import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <div className='flex min-h-svh w-full items-center justify-center bg-muted/20 p-6 md:p-10'>
      <div className='w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm'>
        <h1 className='text-2xl font-semibold tracking-tight'>Choose Login</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Select which panel you want to access.
        </p>

        <div className='mt-6 grid gap-3'>
          <Button asChild className='w-full'>
            <Link href='/auth/login/candidate'>Candidate Login</Link>
          </Button>
          <Button asChild variant='outline' className='w-full'>
            <Link href='/auth/login/employer'>Employer Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
