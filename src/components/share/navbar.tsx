'use client';

import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

const Navbar = () => {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{
    name: string;
    id: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) return;

      setUser(data.user);

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      setProfile(profileData);
    };

    checkAuth();
  }, [supabase]);

  console.log('profile', user);

  return (
    <nav className='h-16 sm:h-20 px-4 max-w-350 mx-auto w-full flex items-center justify-between'>
      {/* LEFT */}
      <div className='flex items-center gap-6 flex-1'>
        <Image
          src='/logo.png'
          alt='Logo'
          width={120}
          height={40}
          className='h-6 w-auto md:h-8'
        />

        {/* show dashboard only if logged in */}
        {user && <span className='font-medium cursor-pointer'>Dashboard</span>}
      </div>

      {/* CENTER (only when not logged in) */}
      {!user && (
        <h1 className='text-[14px] sm:text-2xl font-semibold'>Akij Resource</h1>
      )}

      {/* RIGHT USER INFO */}
      {user && profile && (
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center'>
            👤
          </div>

          <div className='text-right leading-tight'>
            <p className='font-medium text-sm'>{profile?.email}</p>
            <p className='text-xs text-gray-500'>
              Ref. ID - {profile?.id.slice(0, 8) || '1601121'}
            </p>
          </div>

          <span>▾</span>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
