'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@/infrastructure/supabase/client';
import { useAuth } from './AuthContext';
import type { Household, HouseholdMember } from '@/shared/types';

interface HouseholdContextType {
  household: Household | null;
  members: HouseholdMember[];
  isAdmin: boolean;
  loading: boolean;
  createHousehold: (name: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const supabase = createSupabaseClient();

async function loadHouseholdForUser(
  currentUser: { id: string } | null,
  setHousehold: (h: Household | null) => void,
  setMembers: (m: HouseholdMember[]) => void,
  setLoading: (l: boolean) => void,
) {
  if (!currentUser) {
    setHousehold(null);
    setMembers([]);
    setLoading(false);
    return;
  }

  const { data: memberData } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('profile_id', currentUser.id)
    .maybeSingle();

  if (!memberData) {
    setHousehold(null);
    setMembers([]);
    setLoading(false);
    return;
  }

  const [hResult, mResult] = await Promise.all([
    supabase.from('households').select('*').eq('id', memberData.household_id).single(),
    supabase.from('household_members').select('*, profile:profiles(*)').eq('household_id', memberData.household_id),
  ]);

  setHousehold(hResult.data);
  setMembers((mResult.data as HouseholdMember[]) || []);
  setLoading(false);
}

const HouseholdContext = createContext<HouseholdContextType | null>(null);

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = members.some(
    (m) => m.profile_id === user?.id && m.role === 'admin',
  );

  useEffect(() => {
    loadHouseholdForUser(user, setHousehold, setMembers, setLoading);
  }, [user]);

  const refresh = useCallback(async () => {
    await loadHouseholdForUser(user, setHousehold, setMembers, setLoading);
  }, [user]);

  const createHousehold = async (name: string) => {
    if (!user) return;

    const { error } = await supabase.rpc('create_household', { p_name: name });

    if (error) throw new Error(error.message);

    await loadHouseholdForUser(user, setHousehold, setMembers, setLoading);
  };

  return (
    <HouseholdContext.Provider
      value={{ household, members, isAdmin, loading, createHousehold, refresh }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
  return ctx;
}
