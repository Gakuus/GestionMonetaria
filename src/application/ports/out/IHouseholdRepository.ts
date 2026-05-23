import type { Household, HouseholdMember, Profile } from '@/shared/types';

export interface IHouseholdRepository {
  create(name: string, profileId: string): Promise<Household>;
  getById(id: string): Promise<Household | null>;
  getByProfileId(profileId: string): Promise<Household | null>;
  getMembers(householdId: string): Promise<HouseholdMember[]>;
  addMember(householdId: string, profileId: string, role?: 'admin' | 'member'): Promise<HouseholdMember>;
  removeMember(memberId: string): Promise<void>;
  getProfileByEmail(email: string): Promise<Profile | null>;
}
