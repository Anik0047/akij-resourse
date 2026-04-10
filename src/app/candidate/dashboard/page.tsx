'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from 'boneyard-js/react';
import {
  Clock,
  FileText,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from 'lucide-react';
import { useExamStore } from '@/hooks/use-exam-store';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

const supabase = createClient();
const PAGE_SIZE_OPTIONS = [8, 16, 24];

export default function CandidateDashboardPage() {
  const router = useRouter();
  const { exams, isLoading } = useExamStore();
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

  const filtered = exams.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const showLoadingSkeleton = isLoading && exams.length === 0;
  const skeletonFallback = (
    <main className='min-h-screen bg-[#f4f4f6] py-10 text-zinc-900'>
      <section className='mx-auto flex w-full max-w-350 flex-col gap-6 px-4'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='h-8 w-44 rounded-xl bg-zinc-200/80' />
          <div className='flex h-12.5 items-center gap-3 md:w-155.25'>
            <div className='h-12 flex-1 rounded-md bg-zinc-200/80' />
            <div className='h-12 w-12 rounded-md bg-zinc-200/80' />
          </div>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className='flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm'
            >
              <div className='h-6 w-4/5 rounded bg-zinc-200/80' />
              <div className='flex flex-wrap items-center gap-x-5 gap-y-2'>
                <div className='h-4 w-28 rounded bg-zinc-200/80' />
                <div className='h-4 w-24 rounded bg-zinc-200/80' />
                <div className='h-4 w-36 rounded bg-zinc-200/80' />
              </div>
              <div className='mt-auto h-10 w-24 rounded-md bg-zinc-200/80' />
            </div>
          ))}
        </div>

        <div className='flex items-center justify-between pt-1'>
          <div className='flex items-center gap-2'>
            <div className='h-7 w-7 rounded-md bg-zinc-200/80' />
            <div className='h-7 w-7 rounded-md bg-zinc-200/80' />
            <div className='h-7 w-7 rounded-md bg-zinc-200/80' />
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-5 w-36 rounded bg-zinc-200/80' />
            <div className='h-8 w-12 rounded-md bg-zinc-200/80' />
          </div>
        </div>
      </section>
    </main>
  );

  return (
    <Skeleton
      name='candidate-dashboard'
      loading={showLoadingSkeleton}
      fallback={skeletonFallback}
      fixture={skeletonFallback}
    >
      <main className='min-h-screen bg-[#f4f4f6] py-10 text-zinc-900'>
        <section className='mx-auto flex w-full max-w-350 flex-col gap-6 px-4'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <h1 className='text-2xl font-bold tracking-tight text-[#334155]'>
              Online Tests
            </h1>
            <div className='flex items-center justify-end gap-3 md:h-12.5 md:w-155.25 flex-1'>
              <div className='relative flex-1 sm:max-w-xl'>
                <input
                  type='text'
                  placeholder='Search by exam title'
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className='w-full rounded-md border border-violet-300 bg-white py-2 pl-4 pr-10 text-sm text-zinc-700 placeholder-[#7C8493] outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-400 md:h-12'
                />

                <Image
                  src='/search-icon.png'
                  alt='Search'
                  width={100}
                  height={100}
                  className='absolute right-3 top-1/2 h-7 w-7 -translate-y-1/2 md:h-8 md:w-8'
                />
              </div>
            </div>
          </div>

          {paginated.length === 0 ? (
            <p className='py-16 text-center text-sm text-zinc-500'>
              No exams found.
            </p>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2'>
              {paginated.map((exam) => (
                <div
                  key={exam.id}
                  className='flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition hover:shadow-md'
                >
                  <div>
                    <h2 className='text-xl font-semibold leading-snug text-zinc-900'>
                      {exam.title}
                    </h2>
                  </div>

                  <div className='flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-zinc-600'>
                    <span className='flex items-center gap-1.5'>
                      <Clock size={14} className='text-zinc-400' />
                      <span>Duration:</span>
                      <span className='font-medium'>{exam.duration} min</span>
                    </span>
                    <span className='flex items-center gap-1.5'>
                      <FileText size={14} className='text-zinc-400' />
                      <span>Question:</span>
                      <span className='font-medium'>
                        {exam.questions.length}
                      </span>
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

          <div className='flex items-center justify-between pt-1'>
            <div className='flex items-center gap-2 text-sm text-zinc-600'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className='flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40'
              >
                <ChevronLeft size={14} />
              </button>
              <span className='flex h-7 w-7 items-center justify-center rounded-md border border-violet-400 bg-violet-50 text-sm font-medium text-violet-700'>
                {page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className='flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40'
              >
                <ChevronRight size={14} />
              </button>
            </div>

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
                      className={`block w-full px-5 py-1.5 text-left text-sm hover:bg-violet-50 hover:text-violet-700 ${n === perPage ? 'bg-violet-50 font-medium text-violet-700' : 'text-zinc-700'}`}
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
    </Skeleton>
  );
}
