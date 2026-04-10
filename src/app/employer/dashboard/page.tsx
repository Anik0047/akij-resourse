'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  Users,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

function metricValue(value: number) {
  return value > 0 ? value.toLocaleString() : 'Not Set';
}

function formatDateYmd(value: string) {
  return value.split('T')[0] ?? value;
}

export default function EmployerDashboardPage() {
  const router = useRouter();
  const { exams } = useExamStore();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);

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

  const filteredExams = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return exams;
    }

    return exams.filter((exam) => exam.title.toLowerCase().includes(query));
  }, [exams, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / perPage));
  const activePage = Math.min(page, totalPages);

  const pagedExams = useMemo(() => {
    const start = (activePage - 1) * perPage;
    return filteredExams.slice(start, start + perPage);
  }, [activePage, filteredExams, perPage]);

  return (
    <main className='min-h-screen bg-[#f5f6fb] px-4 py-8 text-zinc-900 sm:px-6'>
      <section className='mx-auto flex w-full max-w-350 flex-col gap-5'>
        <header className='flex flex-col gap-3 lg:flex-row lg:items-center'>
          <h1 className='text-[30px] font-semibold text-[#2c3b53]'>
            Online Tests
          </h1>

          <div className='relative flex-1 lg:ml-auto lg:max-w-xl'>
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder='Search by exam title'
              className='h-10 rounded-xl border-[#cbcfe6] bg-white pr-10 text-sm'
            />
            <Search className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#7f87a8]' />
          </div>

          <div className='flex items-center justify-end gap-2'>
            <Button
              asChild
              className='h-10 rounded-xl bg-[#5c3bfe] px-5 font-semibold text-white hover:bg-[#4f31e2]'
            >
              <Link href='/employer/create-test'>Create Online Test</Link>
            </Button>
          </div>
        </header>

        <div className='grid gap-4 md:grid-cols-2'>
          {pagedExams.map((exam) => (
            <Card
              key={exam.id}
              className='gap-3 rounded-2xl border border-[#dfe2ee] bg-white py-5 shadow-none'
            >
              <CardHeader>
                <CardTitle className='text-[31px] font-semibold text-[#2f3d56]'>
                  {exam.title}
                </CardTitle>
                <CardDescription className='text-xs text-[#8490ad]'>
                  {formatDateYmd(exam.startTime)} -{' '}
                  {formatDateYmd(exam.endTime)}
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col gap-4'>
                <div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#7481a1]'>
                  <p className='flex items-center gap-1.5'>
                    <Users className='size-3.5' /> Candidates:{' '}
                    {metricValue(exam.totalCandidates)}
                  </p>
                  <p className='flex items-center gap-1.5'>
                    <FileText className='size-3.5' /> Question Set:{' '}
                    {metricValue(exam.questionSets)}
                  </p>
                  <p className='flex items-center gap-1.5'>
                    <Workflow className='size-3.5' /> Exam Slots:{' '}
                    {metricValue(exam.totalSlots)}
                  </p>
                </div>
                <Button
                  variant='outline'
                  onClick={() => setSelectedExam(exam)}
                  className='h-8 w-fit rounded-xl border-[#6f4fff] px-5 text-xs font-semibold text-[#5c3bfe] hover:bg-[#f4f1ff]'
                >
                  View Candidates
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {pagedExams.length === 0 ? (
          <Card className='rounded-2xl border border-dashed border-[#cfd5e8] bg-white py-8 text-center shadow-none'>
            <CardContent>
              <p className='text-sm text-[#6a7391]'>
                No exams found for your search.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className='flex items-center justify-between pt-1 text-xs text-[#636c84]'>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={activePage === 1}
              className='flex size-6 items-center justify-center rounded border border-[#d8dced] bg-white disabled:opacity-40'
            >
              <ChevronLeft className='size-3.5' />
            </button>
            <span className='font-semibold'>{activePage}</span>
            <button
              type='button'
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={activePage === totalPages}
              className='flex size-6 items-center justify-center rounded border border-[#d8dced] bg-white disabled:opacity-40'
            >
              <ChevronRight className='size-3.5' />
            </button>
          </div>

          <div className='flex items-center gap-2'>
            <span>Online Test Per Page</span>
            <select
              value={perPage}
              onChange={(event) => {
                setPerPage(Number(event.target.value));
                setPage(1);
              }}
              className='rounded-md border border-[#d8dced] bg-white px-2 py-1 outline-none'
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
            </select>
          </div>
        </div>

        <p className='text-xs text-[#697392]'>
          {filteredExams.length} tests active · {totalCandidates} candidates in
          pipeline
        </p>
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
