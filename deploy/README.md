# Deploy — GestionMonetaria

Este directorio contiene todo lo necesario para desplegar GestionMonetaria
en un servidor Debian fresh.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `config.yml` | Configuración del deploy (dominio, repo, etc.) |
| `.env.production.example` | Template para las secrets de producción |
| `.env.production` | Secrets reales (ignorado por git, crearlo manualmente) |
| `bootstrap.sh` | Script automático de instalación (correr como root) |
| `nginx-gestion-monetaria.conf` | Template de nginx reverse proxy |
| `gestion-monetaria.service` | Template de systemd unit |

## Uso rápido

```bash
# 1. Editar configuración con tu dominio
nano deploy/config.yml

# 2. Crear archivo de secrets (nunca se commitea)
cp deploy/.env.production.example deploy/.env.production
nano deploy/.env.production

# 3. Ejecutar bootstrap (como root)
sudo ./deploy/bootstrap.sh
```

## Requisitos del servidor

- Debian 12+ (Bookworm)
- Puertos 80 y 443 accesibles (sin firewall bloqueante)
- DNS del dominio apuntando a la IP del servidor
- Conexión SSH con clave configurada en GitHub

## Qué hace bootstrap.sh

1. Instala Docker, Node.js 22, nginx, certbot
2. Clona el repositorio en `/opt/gestion-monetaria`
3. Instala Supabase CLI y levanta Supabase (`supabase start`)
4. Extrae las keys de Supabase automáticamente
5. Configura nginx como reverse proxy
6. Obtiene certificado SSL con Let's Encrypt
7. Crea servicio systemd para la app
8. Build de Next.js y arranque

## Migrar datos locales al servidor

```bash
# En la máquina local (donde corre Supabase ahora):
supabase db dump -f backup.sql

# Copiar al servidor:
scp backup.sql usuario@server:/tmp/

# En el servidor:
cd /opt/gestion-monetaria/supabase
supabase db restore -f /tmp/backup.sql
```

## Actualizar la app

```bash
cd /opt/gestion-monetaria
git pull
npm run build
sudo systemctl restart gestion-monetaria
```
