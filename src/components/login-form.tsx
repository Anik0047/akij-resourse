'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Skeleton } from 'boneyard-js/react';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        throw loginError;
      }

      const userId = loginData.user?.id;
      if (!userId) {
        throw new Error('Unable to resolve signed in user.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (profile.role !== role) {
        await supabase.auth.signOut();
        throw new Error('Selected role does not match your account role.');
      }

      if (role === 'candidate') {
        router.push('/candidate/dashboard');
        return;
      }

      router.push('/employer/dashboard');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Skeleton
        name='login-form'
        loading={false}
        fixture={
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl'>Login</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className='flex flex-col gap-6'>
                  <div className='grid gap-2'>
                    <Label htmlFor='role'>Role</Label>
                    <SelectTrigger id='role' className='w-full' disabled />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='m@example.com'
                      disabled
                    />
                  </div>
                  <div className='grid gap-2'>
                    <div className='flex items-center'>
                      <Label htmlFor='password'>Password</Label>
                    </div>
                    <Input
                      id='password'
                      type='password'
                      placeholder='••••••••'
                      disabled
                    />
                  </div>
                  <Button type='button' className='w-full' disabled>
                    Login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>Login</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className='flex flex-col gap-6'>
                <div className='grid gap-2'>
                  <Label htmlFor='role'>Role</Label>
                  <Select
                    value={role}
                    onValueChange={(value) =>
                      setRole(value as 'candidate' | 'employer')
                    }
                  >
                    <SelectTrigger id='role' className='w-full'>
                      <SelectValue placeholder='Select role' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value='candidate'>Candidate</SelectItem>
                        <SelectItem value='employer'>Employee</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    placeholder='m@example.com'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className='grid gap-2'>
                  <div className='flex items-center'>
                    <Label htmlFor='password'>Password</Label>
                    <Link
                      href='/auth/forgot-password'
                      className='ml-auto inline-block text-sm underline-offset-4 hover:underline'
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    id='password'
                    type='password'
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className='text-sm text-red-500'>{error}</p>}
                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </div>
              <div className='mt-4 text-center text-sm'>
                Don&apos;t have an account?{' '}
                <Link
                  href='/auth/sign-up'
                  className='underline underline-offset-4'
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </Skeleton>
    </div>
  );
}
