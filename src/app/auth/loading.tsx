'use client';

import { Skeleton } from 'boneyard-js/react';

const authLoadingFallback = (
  <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
    <div className='w-full max-w-sm'>
      <div className='rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm'>
        <div className='mb-2 h-7 w-32 rounded bg-zinc-200/80' />
        <div className='mb-6 h-4 w-52 rounded bg-zinc-200/80' />

        <div className='space-y-4'>
          <div className='space-y-2'>
            <div className='h-4 w-14 rounded bg-zinc-200/80' />
            <div className='h-10 w-full rounded-lg bg-zinc-200/80' />
          </div>
          <div className='space-y-2'>
            <div className='h-4 w-16 rounded bg-zinc-200/80' />
            <div className='h-10 w-full rounded-lg bg-zinc-200/80' />
          </div>
          <div className='h-11 w-full rounded-lg bg-zinc-200/80' />
        </div>
      </div>
    </div>
  </div>
);

export default function AuthLoading() {
  return (
    <Skeleton
      name='auth-route-loading'
      loading
      fallback={authLoadingFallback}
      fixture={authLoadingFallback}
    >
      <div />
    </Skeleton>
  );
}
