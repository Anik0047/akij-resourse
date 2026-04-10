'use client';

import { Skeleton } from 'boneyard-js/react';

const candidateLoadingFallback = (
  <main className='min-h-screen bg-[#f4f4f6] py-10 text-zinc-900'>
    <section className='mx-auto flex w-full max-w-350 flex-col gap-6 px-4'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='h-8 w-44 rounded-xl bg-zinc-200/80' />
        <div className='h-12 w-full max-w-xl rounded-md bg-zinc-200/80' />
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
    </section>
  </main>
);

export default function CandidateLoading() {
  return (
    <Skeleton
      name='candidate-route-loading'
      loading
      fallback={candidateLoadingFallback}
      fixture={candidateLoadingFallback}
    >
      <div />
    </Skeleton>
  );
}
