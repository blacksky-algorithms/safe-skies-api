import { SupabaseInstance } from './supabase';

export type UserRole = 'user' | 'mod' | 'admin';
export type ModAction = 'mod_promote' | 'mod_demote';

export const canPerformAction = async (
  userDid: string,
  action: ModAction,
  uri: string | null
): Promise<boolean> => {
  // For example, check the feed_permissions table for the user's role on a given URI.
  if (!userDid || !uri) return false;
  const { data, error } = await SupabaseInstance.from('feed_permissions')
    .select('role')
    .eq('did', userDid)
    .eq('uri', uri)
    .single();
  if (error || !data) return false;
  // Simplified permission check:
  // Let's assume admin can do anything, mod can perform mod_promote/demote, etc.
  if (data.role === 'admin') return true;
  if (data.role === 'mod' && action === 'mod_promote') return true;
  return false;
};

export const setFeedRole = async (
  targetUserDid: string,
  uri: string,
  role: UserRole,
  setByUserDid: string,
  feedName: string
): Promise<boolean> => {
  try {
    const { error } = await SupabaseInstance.from('feed_permissions').upsert({
      did: targetUserDid,
      uri,
      feed_name: feedName,
      role,
      created_by: setByUserDid,
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.error('Error upserting feed role:', error);
      return false;
    }
    // Optionally, log moderation event here if needed.
    return true;
  } catch (error) {
    console.error('Error in setFeedRole:', error);
    return false;
  }
};
