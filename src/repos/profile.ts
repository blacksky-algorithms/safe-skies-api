// src/repos/profile.ts
import { User } from '../lib/types/user';
import { SupabaseInstance } from './supabase';

export const getProfile = async (did: string): Promise<User | null> => {
  const { data, error } = await SupabaseInstance.from('profiles')
    .select('*')
    .eq('did', did)
    .maybeSingle();
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data || null;
};

export const upsertProfile = async (
  profile: Partial<User>
): Promise<boolean> => {
  const { error } = await SupabaseInstance.from('profiles').upsert(profile);
  if (error) {
    console.error('Error upserting profile:', error);
    return false;
  }
  return true;
};
