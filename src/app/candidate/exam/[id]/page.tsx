'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function CandidateExamPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { exams } = useExamStore();
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const exam = useMemo(
    () => exams.find((item) => item.id === params.id),
    [exams, params.id],
  );

  useEffect(() => {
    const ensureAuthenticated = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace('/candidate/login');
      }
    };

    void ensureAuthenticated();
  }, [router]);

  useEffect(() => {
    if (!started || submitted) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setSubmitted(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [started, submitted]);

  useEffect(() => {
    if (!started || submitted) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((current) => current + 1);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenExitCount((current) => current + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [started, submitted]);

  const startExam = async () => {
    if (!exam) {
      return;
    }

    setStarted(true);
    setSubmitted(false);
    setTimeLeft(exam.duration * 60);

    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // Browser can block fullscreen without user permissions.
      }
    }
  };

  const submitExam = () => {
    setSubmitted(true);
  };

  if (!exam) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-[#effaf7] p-6'>
        <Card className='w-full max-w-lg'>
          <CardHeader>
            <CardTitle>Exam not found</CardTitle>
            <CardDescription>
              The exam may have been removed by the employer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/candidate/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const question = exam.questions[activeQuestion];
  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <main className='min-h-screen bg-[#effaf7] px-6 py-10 text-zinc-900'>
      <section className='mx-auto flex w-full max-w-5xl flex-col gap-6'>
        <header className='rounded-3xl border border-teal-200 bg-white p-6'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <p className='text-xs uppercase tracking-[0.2em] text-teal-700'>
                Exam Screen
              </p>
              <h1 className='text-2xl font-semibold'>{exam.title}</h1>
            </div>
            <p className='rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-lg font-semibold text-teal-800'>
              {minutes}:{seconds}
            </p>
          </div>
        </header>

        {!started ? (
          <Card>
            <CardHeader>
              <CardTitle>Ready to Start?</CardTitle>
              <CardDescription>
                Timer starts immediately. Tab switch and fullscreen exits are
                tracked for behavior monitoring.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={startExam}>Start Exam</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Question {activeQuestion + 1}</CardTitle>
              <CardDescription>{question?.title}</CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-5'>
              {submitted ? (
                <div className='rounded-xl border border-teal-200 bg-teal-50 p-4'>
                  <p className='font-medium text-teal-900'>Exam submitted.</p>
                  <p className='mt-1 text-sm text-teal-800'>
                    Monitoring summary: {tabSwitchCount} tab switches,{' '}
                    {fullscreenExitCount} fullscreen exits.
                  </p>
                </div>
              ) : question?.type === 'text' ? (
                <textarea
                  className='min-h-32 rounded-md border border-input bg-transparent px-3 py-2 text-sm'
                  placeholder='Write your answer here...'
                />
              ) : (
                <div className='flex flex-col gap-2'>
                  {question?.options.map((option) => (
                    <label
                      key={option}
                      className='flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm'
                    >
                      <input
                        type={question.type}
                        name={`q-${question.id}`}
                        value={option}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className='flex flex-wrap justify-between gap-3'>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    disabled={activeQuestion === 0 || submitted}
                    onClick={() => setActiveQuestion((current) => current - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    disabled={
                      activeQuestion >= exam.questions.length - 1 || submitted
                    }
                    onClick={() => setActiveQuestion((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
                <Button disabled={submitted} onClick={submitExam}>
                  Manual Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
