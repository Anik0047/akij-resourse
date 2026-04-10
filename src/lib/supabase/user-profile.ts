import { createClient } from '@/lib/supabase/server';

export type UserProfileRecord = {
  id: string;
  email: string;
  role: 'candidate' | 'employer' | 'admin';
  panel: 'candidate' | 'employer';
  full_name: string | null;
};

export async function upsertUserProfile(profile: UserProfileRecord) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profile)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
