import { type EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { upsertUserProfile } from '@/lib/supabase/user-profile';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const _next = searchParams.get('next');
  const next = _next?.startsWith('/') ? _next : '/';

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (user) {
        const panel = user.email?.includes('employer')
          ? 'employer'
          : 'candidate';

        await upsertUserProfile({
          id: user.id,
          email: user.email ?? '',
          role: panel === 'employer' ? 'employer' : 'candidate',
          panel,
          full_name:
            (user.user_metadata?.full_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            null,
        });
      }

      // redirect user to specified redirect URL or root of app
      redirect(next);
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (user) {
        const panel = user.email?.includes('employer')
          ? 'employer'
          : 'candidate';

        await upsertUserProfile({
          id: user.id,
          email: user.email ?? '',
          role: panel === 'employer' ? 'employer' : 'candidate',
          panel,
          full_name:
            (user.user_metadata?.full_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            null,
        });
      }

      redirect(next);
    } else {
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No code or token hash and type`);
}
