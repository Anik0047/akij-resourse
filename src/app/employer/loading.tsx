'use client';

import { Skeleton } from 'boneyard-js/react';

const employerLoadingFallback = (
  <main className='min-h-screen bg-[#f5f6fb] px-4 py-8 text-zinc-900 sm:px-6'>
    <section className='mx-auto flex w-full max-w-350 flex-col gap-5'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
        <div className='h-9 w-48 rounded-xl bg-zinc-200/80' />
        <div className='h-10 flex-1 rounded-xl bg-zinc-200/80 lg:ml-auto lg:max-w-xl' />
        <div className='h-10 w-44 rounded-xl bg-zinc-200/80' />
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className='rounded-2xl border border-[#dfe2ee] bg-white p-5 shadow-none'
          >
            <div className='h-8 w-4/5 rounded bg-zinc-200/80' />
            <div className='mt-2 h-4 w-1/3 rounded bg-zinc-200/80' />
            <div className='mt-4 h-4 w-full rounded bg-zinc-200/80' />
            <div className='mt-2 h-4 w-3/4 rounded bg-zinc-200/80' />
            <div className='mt-5 h-8 w-28 rounded-xl bg-zinc-200/80' />
          </div>
        ))}
      </div>
    </section>
  </main>
);

export default function EmployerLoading() {
  return (
    <Skeleton
      name='employer-route-loading'
      loading
      fallback={employerLoadingFallback}
      fixture={employerLoadingFallback}
    >
      <div />
    </Skeleton>
  );
}
