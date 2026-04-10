'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useExamStore } from '@/hooks/use-exam-store';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function CandidateDashboardPage() {
  const router = useRouter();
  const { exams } = useExamStore();

  useEffect(() => {
    const ensureCandidateAuthenticated = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace('/auth/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || profile?.role !== 'candidate') {
        await supabase.auth.signOut();
        router.replace('/auth/login');
      }
    };

    void ensureCandidateAuthenticated();
  }, [router]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <main className='min-h-screen bg-[#effaf7] px-6 py-10 text-zinc-900'>
      <section className='mx-auto flex w-full max-w-6xl flex-col gap-8'>
        <header className='flex flex-col gap-5 rounded-3xl border border-teal-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between'>
          <div className='flex flex-col gap-2'>
            <p className='text-xs uppercase tracking-[0.2em] text-teal-700'>
              Candidate Panel
            </p>
            <h1 className='text-3xl font-semibold'>Upcoming Online Exams</h1>
            <p className='text-sm text-zinc-600'>
              Sign in with your Supabase email provider magic link. Behavioral
              tracking is enabled during exam sessions.
            </p>
          </div>
          <Button variant='outline' onClick={onLogout}>
            Logout
          </Button>
        </header>

        <div className='grid gap-5 md:grid-cols-2'>
          {exams.map((exam) => (
            <Card key={exam.id} className='border-zinc-200 bg-white'>
              <CardHeader>
                <CardTitle>{exam.title}</CardTitle>
                <CardDescription>
                  Starts: {new Date(exam.startTime).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col gap-4'>
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <p>
                    <span className='font-medium'>Duration:</span>{' '}
                    {exam.duration} min
                  </p>
                  <p>
                    <span className='font-medium'>Questions:</span>{' '}
                    {exam.questions.length}
                  </p>
                  <p>
                    <span className='font-medium'>Negative:</span>{' '}
                    {exam.negativeMarking}
                  </p>
                  <p>
                    <span className='font-medium'>Type:</span>{' '}
                    {exam.questionType}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/candidate/exam/${exam.id}`}>Start</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
