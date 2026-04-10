'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Clock,
  FileText,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExamStore } from '@/hooks/use-exam-store';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const PAGE_SIZE_OPTIONS = [8, 16, 24];

export default function CandidateDashboardPage() {
  const router = useRouter();
  const { exams } = useExamStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [showPerPage, setShowPerPage] = useState(false);

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

  const filtered = exams.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <main className='min-h-screen bg-[#f4f4f6] px-6 py-10 text-zinc-900'>
      <section className='max-w-350 mx-auto flex w-full flex-col gap-6 px-4'>
        {/* Header row: title + search + logout */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='text-xl font-semibold tracking-tight text-zinc-900'>
            Online Tests
          </h1>
          <div className='flex w-[621px] h-[48px] items-center gap-3'>
            {/* Search */}
            <div className='relative flex-1 sm:max-w-xl]'>
              <input
                type='text'
                placeholder='Search by exam title'
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className='w-full rounded-md border border-violet-300 bg-white py-2 pl-4 pr-10 text-sm text-zinc-700 placeholder-zinc-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-400'
              />
              <Search
                size={16}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-violet-500'
              />
            </div>
            {/* <Button
              variant='outline'
              size='sm'
              onClick={onLogout}
              className='shrink-0 text-sm'
            >
              Logout
            </Button> */}
          </div>
        </div>

        {/* Exam cards grid */}
        {paginated.length === 0 ? (
          <p className='py-16 text-center text-sm text-zinc-500'>
            No exams found.
          </p>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2'>
            {paginated.map((exam) => (
              <div
                key={exam.id}
                className='flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md'
              >
                <div>
                  <h2 className='text-xl font-semibold text-zinc-900 leading-snug'>
                    {exam.title}
                  </h2>
                </div>

                {/* Metadata row */}
                <div className='flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-zinc-600'>
                  <span className='flex items-center gap-1.5'>
                    <Clock size={14} className='text-zinc-400' />
                    <span>Duration:</span>
                    <span className='font-medium'>{exam.duration} min</span>
                  </span>
                  <span className='flex items-center gap-1.5'>
                    <FileText size={14} className='text-zinc-400' />
                    <span>Question:</span>
                    <span className='font-medium'>{exam.questions.length}</span>
                  </span>
                  <span className='flex items-center gap-1.5'>
                    <XCircle size={14} className='text-zinc-400' />
                    <span>Negative Marking:</span>
                    <span className='font-medium'>
                      {exam.negativeMarking > 0
                        ? `-${exam.negativeMarking}/wrong`
                        : 'None'}
                    </span>
                  </span>
                </div>

                {/* Start button */}
                <Link
                  href={`/candidate/exam/${exam.id}`}
                  className='mt-auto self-start rounded-md border border-violet-500 px-12 py-2.5 text-sm font-medium text-violet-600 transition hover:bg-violet-50'
                >
                  Start
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Pagination footer */}
        <div className='flex items-center justify-between pt-1'>
          {/* Prev / page / next */}
          <div className='flex items-center gap-2 text-sm text-zinc-600'>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className='flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white disabled:opacity-40 hover:bg-zinc-50'
            >
              <ChevronLeft size={14} />
            </button>
            <span className='flex h-7 w-7 items-center justify-center rounded-md border border-violet-400 bg-violet-50 text-sm font-medium text-violet-700'>
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className='flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white disabled:opacity-40 hover:bg-zinc-50'
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Per-page selector */}
          <div className='relative flex items-center gap-2 text-sm text-zinc-500'>
            <span>Online Test Per Page</span>
            <button
              onClick={() => setShowPerPage((v) => !v)}
              className='flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1 font-medium text-zinc-700 hover:bg-zinc-50'
            >
              {perPage}
              <ChevronUp
                size={13}
                className={`transition-transform ${showPerPage ? '' : 'rotate-180'}`}
              />
            </button>
            {showPerPage && (
              <div className='absolute bottom-full right-0 mb-1 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-md'>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setPerPage(n);
                      setPage(1);
                      setShowPerPage(false);
                    }}
                    className={`block w-full px-5 py-1.5 text-left text-sm hover:bg-violet-50 hover:text-violet-700 ${n === perPage ? 'bg-violet-50 text-violet-700 font-medium' : 'text-zinc-700'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
