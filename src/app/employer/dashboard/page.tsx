'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
import { type Exam } from '@/lib/assessment-types';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function EmployerDashboardPage() {
  const router = useRouter();
  const { exams } = useExamStore();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  useEffect(() => {
    const ensureEmployerAuthenticated = async () => {
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

      if (profileError || profile?.role !== 'employer') {
        await supabase.auth.signOut();
        router.replace('/auth/login');
      }
    };

    void ensureEmployerAuthenticated();
  }, [router]);

  const totalCandidates = useMemo(() => {
    return exams.reduce((count, exam) => count + exam.totalCandidates, 0);
  }, [exams]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <main className='min-h-screen bg-[#fff9f1] px-6 py-10 text-zinc-900'>
      <section className='mx-auto flex w-full max-w-6xl flex-col gap-8'>
        <header className='flex flex-col gap-6 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between'>
          <div className='flex flex-col gap-2'>
            <p className='text-xs uppercase tracking-[0.2em] text-amber-700'>
              Employer Panel
            </p>
            <h1 className='text-3xl font-semibold'>Online Tests Dashboard</h1>
            <p className='text-sm text-zinc-600'>
              {exams.length} tests active · {totalCandidates} candidates in
              pipeline
            </p>
          </div>
          <div className='flex gap-3'>
            <Button asChild>
              <Link href='/employer/create-test'>Create Online Test</Link>
            </Button>
            <Button variant='outline' onClick={onLogout}>
              Logout
            </Button>
          </div>
        </header>

        <div className='grid gap-5 md:grid-cols-2'>
          {exams.map((exam) => (
            <Card key={exam.id} className='border-zinc-200 bg-white'>
              <CardHeader>
                <CardTitle>{exam.title}</CardTitle>
                <CardDescription>
                  Slot Window: {new Date(exam.startTime).toLocaleString()} to{' '}
                  {new Date(exam.endTime).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col gap-4'>
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <p>
                    <span className='font-medium'>Candidates:</span>{' '}
                    {exam.totalCandidates}
                  </p>
                  <p>
                    <span className='font-medium'>Question Sets:</span>{' '}
                    {exam.questionSets}
                  </p>
                  <p>
                    <span className='font-medium'>Exam Slots:</span>{' '}
                    {exam.totalSlots}
                  </p>
                  <p>
                    <span className='font-medium'>Duration:</span>{' '}
                    {exam.duration} min
                  </p>
                </div>
                <Button variant='outline' onClick={() => setSelectedExam(exam)}>
                  View Candidates
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {selectedExam ? (
        <div className='fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4'>
          <Card className='w-full max-w-lg'>
            <CardHeader>
              <CardTitle>{selectedExam.title}</CardTitle>
              <CardDescription>
                Candidates assigned to this exam
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
              {selectedExam.candidates.length === 0 ? (
                <p className='text-sm text-zinc-600'>
                  No candidates assigned yet.
                </p>
              ) : (
                <ul className='flex flex-col gap-2 text-sm text-zinc-700'>
                  {selectedExam.candidates.map((candidate) => (
                    <li
                      key={candidate}
                      className='rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2'
                    >
                      {candidate}
                    </li>
                  ))}
                </ul>
              )}
              <Button onClick={() => setSelectedExam(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
