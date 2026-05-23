#!/usr/bin/env bash
# ============================================================
# GestionMonetaria — Server bootstrap
#
# Usage:
#   sudo ./deploy/bootstrap.sh
#
# What it does:
#   1. Installs system dependencies (Docker, Node.js, nginx, certbot)
#   2. Reads config.yml + .env.production
#   3. Clones / pulls the app repository
#   4. Starts Supabase via Docker Compose
#   5. Generates nginx site config and obtains SSL certificate
#   6. Creates systemd service for the Next.js app
#   7. Builds and starts the app
#
# Prerequisites:
#   - Debian 12+ (bookworm)
#   - Root / sudo access
#   - Domain DNS already pointing to this server
#   - Ports 80 and 443 reachable (no firewall block)
# ============================================================
set -euo pipefail

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; }

# --- Sanity checks ---
if [[ $EUID -ne 0 ]]; then
    err "This script must be run as root (sudo)."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -f config.yml ]]; then
    err "config.yml not found in $SCRIPT_DIR"
    exit 1
fi

# --- Parse config.yml (simple grep-based, no yq dependency) ---
get_yaml() {
    grep -E "^${1}:" config.yml | sed "s/^${1}: *\"\?//" | sed 's/\"$//' | tr -d ' '
}

DOMAIN=$(get_yaml "domain.name")
SSL_EMAIL=$(get_yaml "domain.ssl_email")
REPO_URL=$(get_yaml "app.repo_url")
DEPLOY_PATH=$(get_yaml "app.deploy_path")
NODE_VERSION=$(get_yaml "app.node_version")
APP_PORT=$(get_yaml "app.port")
SUPABASE_PROJECT=$(get_yaml "supabase.project_name")
API_PORT=$(get_yaml "supabase.api_port")
DB_PORT=$(get_yaml "supabase.db_port")
STUDIO_PORT=$(get_yaml "supabase.studio_port")
TIMEZONE=$(get_yaml "system.timezone")

# --- Validate required fields ---
if [[ "$DOMAIN" == "tudominio.com" || -z "$DOMAIN" ]]; then
    err "You must set 'domain.name' in config.yml to your actual domain."
    exit 1
fi

if [[ "$REPO_URL" == "https://github.com/tuusuario/gestion-monetaria.git" || -z "$REPO_URL" ]]; then
    err "You must set 'app.repo_url' in config.yml to your repository URL."
    exit 1
fi

if [[ ! -f .env.production ]]; then
    err ".env.production not found."
    err "Copy .env.production.example to .env.production and fill in your secrets."
    exit 1
fi

# --- Load secrets (safe: only exported for the script, not written to disk) ---
set -a
source .env.production
set +a

if [[ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
    warn ".env.production is missing supabase keys. They will be auto-detected from 'supabase status' in step 3."
fi

# ============================================================
# STEP 1: Install system dependencies
# ============================================================
step_system() {
    info "Step 1/7 — Installing system dependencies..."

    export DEBIAN_FRONTEND=noninteractive

    apt-get update -qq
    apt-get install -y -qq \
        curl git nginx certbot python3-certbot-nginx \
        ca-certificates gnupg lsb-release

    # --- Docker ---
    if ! command -v docker &>/dev/null; then
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/debian/gpg \
            -o /etc/apt/keyrings/docker.asc
        chmod 644 /etc/apt/keyrings/docker.asc
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
            https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
            > /etc/apt/sources.list.d/docker.list
        apt-get update -qq
        apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
        systemctl enable --now docker
        ok "Docker installed"
    else
        ok "Docker already installed"
    fi

    # --- Node.js ---
    if ! command -v node &>/dev/null || [[ "$(node --version | cut -d. -f1 | tr -d v)" -lt "$NODE_VERSION" ]]; then
        curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
        apt-get install -y -qq nodejs
        ok "Node.js $(node --version) installed"
    else
        ok "Node.js $(node --version) already installed"
    fi

    # --- Timezone ---
    timedatectl set-timezone "$TIMEZONE" 2>/dev/null || true

    ok "System dependencies ready"
}

# ============================================================
# STEP 2: Clone / pull repository
# ============================================================
step_repo() {
    info "Step 2/7 — Ensuring repository at $DEPLOY_PATH..."

    if [[ -d "$DEPLOY_PATH/.git" ]]; then
        info "Repository exists — pulling latest..."
        git -C "$DEPLOY_PATH" pull --ff-only
    else
        mkdir -p "$(dirname "$DEPLOY_PATH")"
        git clone "$REPO_URL" "$DEPLOY_PATH"
    fi

    ok "Repository ready at $DEPLOY_PATH"
}

# ============================================================
# STEP 3: Install Supabase CLI and start services
# ============================================================
step_supabase() {
    info "Step 3/7 — Installing Supabase CLI and starting services..."

    local SUPABASE_DIR="$DEPLOY_PATH/supabase"

    if [[ ! -f "$SUPABASE_DIR/config.toml" ]]; then
        err "Supabase config.toml not found at $SUPABASE_DIR"
        exit 1
    fi

    # Install Supabase CLI if not present
    if ! command -v supabase &>/dev/null; then
        info "Downloading Supabase CLI..."
        curl -fsSL \
            "https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.deb" \
            -o /tmp/supabase.deb
        dpkg -i /tmp/supabase.deb
        rm /tmp/supabase.deb
        ok "Supabase CLI installed"
    else
        ok "Supabase CLI already installed"
    fi

    # Start Supabase (uses config.toml, pulls images, runs migrations)
    cd "$SUPABASE_DIR"
    supabase start 2>&1 | while IFS= read -r line; do
        info "supabase: $line"
    done

    # Get the generated anon key from running instance
    info "Extracting Supabase connection info..."
    eval "$(supabase status -o env 2>/dev/null | grep -E '^(STUDIO_ANON_KEY|SERVICE_ROLE_KEY|DB_PASSWORD)=' | sed 's/^STUDIO_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY/')"
    
    # Update .env.production with the actual keys from Supabase
    if [[ -n "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" && -n "${SERVICE_ROLE_KEY:-}" ]]; then
        cat > "$SCRIPT_DIR/.env.production" <<SUPABASE_ENV
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:${API_PORT}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
NEXT_PUBLIC_APP_NAME=GestionMonetaria
NEXT_PUBLIC_ANT_EXPENSE_THRESHOLD=5000
NEXT_PUBLIC_STORAGE_BUCKET_RECEIPTS=receipts
SUPABASE_DB_PASSWORD=${DB_PASSWORD:-supabase}
SUPABASE_ENV
        chmod 600 "$SCRIPT_DIR/.env.production"
        ok "Supabase started and keys extracted"
    else
        warn "Could not extract Supabase keys. Check: supabase status"
        warn "You may need to manually set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.production"
    fi

    cd "$DEPLOY_PATH"
}

# ============================================================
# STEP 4: Configure nginx
# ============================================================
step_nginx() {
    info "Step 4/7 — Configuring nginx..."

    local NGINX_CONF="/etc/nginx/sites-available/gestion-monetaria"
    local NGINX_ENABLED="/etc/nginx/sites-enabled/gestion-monetaria"

    # Generate nginx config from template
    sed -e "s/{{DOMAIN}}/$DOMAIN/g" \
        -e "s/{{PORT}}/$APP_PORT/g" \
        "$SCRIPT_DIR/nginx-gestion-monetaria.conf" > "$NGINX_CONF"

    if [[ ! -L "$NGINX_ENABLED" ]]; then
        ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
    fi

    # Remove default site if present
    rm -f /etc/nginx/sites-enabled/default

    nginx -t || { err "nginx configuration test failed"; exit 1; }
    systemctl reload nginx

    ok "nginx configured for $DOMAIN"
}

# ============================================================
# STEP 5: Obtain SSL certificate
# ============================================================
step_ssl() {
    info "Step 5/7 — Obtaining SSL certificate from Let's Encrypt..."

    # Check if certificate already exists
    if [[ -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
        ok "SSL certificate already exists for $DOMAIN"
        return
    fi

    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
        --email "$SSL_EMAIL" --redirect \
        || warn "SSL certificate failed. Run manually: certbot --nginx -d $DOMAIN"

    if [[ -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
        ok "SSL certificate obtained for $DOMAIN"
    fi
}

# ============================================================
# STEP 6: Create systemd service
# ============================================================
step_systemd() {
    info "Step 6/7 — Creating systemd service..."

    local SERVICE_FILE="/etc/systemd/system/gestion-monetaria.service"
    local NODE_BIN
    NODE_BIN="$(command -v node)"

    sed -e "s|{{DEPLOY_PATH}}|$DEPLOY_PATH|g" \
        -e "s|{{NODE_BIN}}|$NODE_BIN|g" \
        -e "s|{{PORT}}|$APP_PORT|g" \
        "$SCRIPT_DIR/gestion-monetaria.service" > "$SERVICE_FILE"

    systemctl daemon-reload
    ok "systemd service created"
}

# ============================================================
# STEP 7: Build and start the app
# ============================================================
step_app() {
    info "Step 7/7 — Building and starting the app..."

    # Copy production env
    cp "$SCRIPT_DIR/.env.production" "$DEPLOY_PATH/.env.production"
    chmod 600 "$DEPLOY_PATH/.env.production"

    cd "$DEPLOY_PATH"

    # Install production dependencies
    npm ci --omit=dev --no-fund --no-audit --loglevel=error

    # Build
    npm run build

    # Enable and start service
    systemctl enable gestion-monetaria
    systemctl restart gestion-monetaria

    ok "App built and service started"
}

# ============================================================
# Summary
# ============================================================
print_summary() {
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  GestionMonetaria — Deployment complete!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "  App:        ${BLUE}https://${DOMAIN}${NC}"
    echo -e "  Supabase:   ${BLUE}http://127.0.0.1:${STUDIO_PORT}${NC}"
    echo -e "             (user: admin / pass: from supabase/.env)"
    echo -e "  Deploy dir: ${YELLOW}${DEPLOY_PATH}${NC}"
    echo -e "  Config:     ${YELLOW}${SCRIPT_DIR}/config.yml${NC}"
    echo ""
    echo -e "  Commands:"
    echo -e "    sudo systemctl status gestion-monetaria"
    echo -e "    sudo journalctl -u gestion-monetaria -f"
    echo -e "    cd ${DEPLOY_PATH}/supabase && supabase status"
    echo ""
    echo -e "  Upgrade:"
    echo -e "    cd ${DEPLOY_PATH} && git pull && npm run build && sudo systemctl restart gestion-monetaria"
    echo -e "  Supabase restart:"
    echo -e "    cd ${DEPLOY_PATH}/supabase && supabase stop && supabase start"
    echo ""
}

# ============================================================
# Main
# ============================================================
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     GestionMonetaria Bootstrap Script    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Domain:      ${YELLOW}${DOMAIN}${NC}"
echo -e "  Deploy path: ${YELLOW}${DEPLOY_PATH}${NC}"
echo -e "  Supabase:    ${YELLOW}${SUPABASE_PROJECT}${NC}"
echo ""

step_system
step_repo
step_supabase
step_nginx
step_ssl
step_systemd
step_app

print_summary
