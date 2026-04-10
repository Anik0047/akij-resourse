'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';

const Navbar = () => {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{
    name: string;
    id: string;
    email: string;
  } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const loadAuthState = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      setUser(null);
      setProfile(null);
      return;
    }

    setUser(data.user);

    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('name, id, email')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profileData) {
      setProfile(null);
      return;
    }

    setProfile(profileData);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAuthState();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadAuthState();
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadAuthState, router, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsDropdownOpen(false);
    router.refresh();
    router.push('/');
  };

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
      {user && (
        <div className='relative'>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className='flex items-center gap-3 hover:opacity-80 transition-opacity'
          >
            <div className='w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center'>
              👤
            </div>

            <div className='text-right leading-tight'>
              <p className='font-medium text-sm'>
                {profile?.email || user.email}
              </p>
              <p className='text-xs text-gray-500'>
                Ref. ID - {(profile?.id || user.id).slice(0, 8)}
              </p>
            </div>

            <span
              className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            >
              ▾
            </span>
          </button>

          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className='absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 bg-white shadow-lg z-50'
            >
              <button
                onClick={handleLogout}
                className='w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors'
              >
                <LogOut className='size-4' />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
