'use client';

import { Skeleton } from 'boneyard-js/react';

const appRouteFallback = (
  <main className='min-h-screen bg-[#f4f4f6] px-4 py-8 sm:px-6'>
    <section className='mx-auto flex w-full max-w-350 flex-col gap-5'>
      <div className='h-10 w-52 rounded-xl bg-zinc-200/80' />
      <div className='grid gap-4 md:grid-cols-2'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className='rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm'
          >
            <div className='h-6 w-4/5 rounded bg-zinc-200/80' />
            <div className='mt-3 h-4 w-1/2 rounded bg-zinc-200/80' />
            <div className='mt-5 h-9 w-28 rounded-lg bg-zinc-200/80' />
          </div>
        ))}
      </div>
    </section>
  </main>
);

export default function AppLoading() {
  return (
    <Skeleton
      name='app-route-loading'
      loading
      fallback={appRouteFallback}
      fixture={appRouteFallback}
    >
      <div />
    </Skeleton>
  );
}
