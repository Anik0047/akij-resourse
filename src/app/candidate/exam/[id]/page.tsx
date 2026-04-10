'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Bold, Italic, List, Redo2, Underline, Undo2 } from 'lucide-react';
import { Skeleton } from 'boneyard-js/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExamStore } from '@/hooks/use-exam-store';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

const supabase = createClient();

type AnswerValue = string | string[];

export default function CandidateExamPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { exams, submitExam, isLoading } = useExamStore();

  const [timeLeft, setTimeLeft] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [candidateName, setCandidateName] = useState('Candidate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const exam = useMemo(
    () => exams.find((item) => item.id === params.id),
    [exams, params.id],
  );
  const showLoadingSkeleton = isLoading && !exam;

  useEffect(() => {
    const ensureAuthenticated = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, full_name, email')
        .eq('id', data.user.id)
        .single();

      if (profile?.role && profile.role !== 'candidate') {
        await supabase.auth.signOut();
        router.replace('/auth/login');
        return;
      }

      const displayName =
        profile?.full_name || profile?.email || data.user.email || 'Candidate';
      setCandidateName(displayName);
    };

    void ensureAuthenticated();
  }, [router]);

  useEffect(() => {
    if (!exam) return;

    const initTimer = window.setTimeout(() => {
      setTimeLeft((exam.duration ?? 0) * 60);
      setActiveQuestion(0);
      setAnswers({});
      setIsCompleted(false);
      setIsTimeOut(false);
    }, 0);

    return () => window.clearTimeout(initTimer);
  }, [exam]);

  useEffect(() => {
    if (!exam || isCompleted || isTimeOut || timeLeft <= 0) return;

    const timer = window.setTimeout(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0);
        setIsTimeOut(true);
        return;
      }

      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [exam, isCompleted, isTimeOut, timeLeft]);

  useEffect(() => {
    if (!exam || !isTimeOut || hasSubmitted || isSubmitting) {
      return;
    }

    const persistTimeoutSubmission = async () => {
      setIsSubmitting(true);
      setSubmissionError(null);

      const result = await submitExam({ exam, answers });

      if (!result.ok) {
        setSubmissionError(result.message ?? 'Failed to save your answers.');
      } else {
        setHasSubmitted(true);
      }

      setIsSubmitting(false);
    };

    void persistTimeoutSubmission();
  }, [answers, exam, hasSubmitted, isSubmitting, isTimeOut, submitExam]);

  const skeletonFallback = (
    <main className='min-h-screen bg-[#eceef2] px-3 pt-6 md:pt-14'>
      <div className='mx-auto max-w-350 space-y-4 sm:space-y-6'>
        <div className='flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 sm:px-6 sm:py-4'>
          <div className='h-6 w-56 rounded bg-zinc-200/80' />
          <div className='h-12 w-28 rounded-xl bg-zinc-200/80' />
        </div>

        <Card className='rounded-2xl border-zinc-200'>
          <CardHeader className='px-4 pb-2 pt-4 sm:px-6 sm:pb-4 sm:pt-6'>
            <div className='h-6 w-3/4 rounded bg-zinc-200/80' />
          </CardHeader>

          <CardContent className='space-y-3 px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-6'>
            <div className='overflow-hidden rounded-xl border border-zinc-200'>
              <div className='flex items-center gap-2 border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-3'>
                <div className='h-4 w-4 rounded bg-zinc-200/80' />
                <div className='h-4 w-4 rounded bg-zinc-200/80' />
                <div className='h-4 w-24 rounded bg-zinc-200/80' />
                <div className='h-4 w-4 rounded bg-zinc-200/80' />
                <div className='h-4 w-4 rounded bg-zinc-200/80' />
              </div>
              <div className='space-y-3 px-3 py-3 sm:px-4 sm:py-4'>
                <div className='h-12 w-full rounded-lg bg-zinc-200/80' />
                <div className='h-12 w-full rounded-lg bg-zinc-200/80' />
                <div className='h-12 w-full rounded-lg bg-zinc-200/80' />
              </div>
            </div>

            <div className='flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4'>
              <div className='h-12 w-full rounded-xl bg-zinc-200/80 sm:w-44' />
              <div className='h-12 w-full rounded-xl bg-zinc-200/80 sm:w-48' />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );

  if (showLoadingSkeleton) {
    return (
      <Skeleton
        name='candidate-exam'
        loading
        fallback={skeletonFallback}
        fixture={skeletonFallback}
      >
        <div />
      </Skeleton>
    );
  }

  if (!exam) return null;

  const question = exam.questions[activeQuestion];
  const isLastQuestion = activeQuestion === exam.questions.length - 1;
  const selectedAnswer = question ? answers[question.id] : undefined;

  const saveTextAnswer = (value: string) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const saveRadioAnswer = (value: string) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const saveCheckboxAnswer = (value: string, checked: boolean) => {
    if (!question) return;
    setAnswers((prev) => {
      const current = Array.isArray(prev[question.id])
        ? (prev[question.id] as string[])
        : [];
      const next = checked
        ? [...current, value]
        : current.filter((item) => item !== value);
      return { ...prev, [question.id]: next };
    });
  };

  const goNextQuestion = () => {
    if (isLastQuestion) {
      const completeExam = async () => {
        if (!exam || hasSubmitted || isSubmitting) {
          setIsCompleted(true);
          return;
        }

        setIsSubmitting(true);
        setSubmissionError(null);

        const result = await submitExam({ exam, answers });

        if (!result.ok) {
          setSubmissionError(result.message ?? 'Failed to save your answers.');
          setIsSubmitting(false);
          return;
        }

        setHasSubmitted(true);
        setIsSubmitting(false);
        setIsCompleted(true);
      };

      void completeExam();
      return;
    }
    setActiveQuestion((prev) => prev + 1);
  };

  const handleSkipQuestion = () => goNextQuestion();
  const handleSaveAndContinue = () => {
    if (!question) return;
    goNextQuestion();
  };
  const handleBackToDashboard = () => router.push('/candidate/dashboard');

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  if (isCompleted) {
    return (
      <main className='min-h-screen bg-[#eceef2] p-4 sm:p-5 md:p-8'>
        <section className='mx-auto max-w-6xl rounded-2xl border border-zinc-200 bg-white px-4 py-10 text-center sm:px-6 sm:py-12 md:px-12'>
          {/* <CheckCircle2 className='mx-auto mb-4 size-9 text-[#2f8be6] sm:size-10' /> */}
          <div className='relative mx-auto mb-4 h-14 w-14'>
            <Image
              src='/circle.png'
              alt='Test Completed'
              width={56}
              height={56}
              className='h-full w-full object-contain'
              priority
            />
            <Image
              src='/right.png'
              alt='Test Completed'
              width={32}
              height={24}
              className='absolute left-1/2 top-1/2 h-[24.4px] w-[32.25px] -translate-x-1/2 -translate-y-[42%] object-contain'
              priority
            />
          </div>
          <h2 className='text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl'>
            Test Completed
          </h2>
          <p className='mx-auto mt-3 max-w-4xl text-sm text-slate-500'>
            Congratulations! {candidateName}, You have completed your{' '}
            {exam.title} exam. Thank you for participating.
          </p>
          {submissionError ? (
            <p className='mx-auto mt-2 max-w-3xl text-sm text-red-600'>
              {submissionError}
            </p>
          ) : null}
          <Button
            type='button'
            variant='outline'
            className='mt-6 rounded-lg border-zinc-300 px-6 text-slate-700 sm:px-8'
            onClick={handleBackToDashboard}
          >
            Back to Dashboard
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-[#eceef2] px-3 pt-6 md:pt-14'>
      <div className='mx-auto max-w-350 space-y-4 sm:space-y-6'>
        {/* top bar */}
        <div className='flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 sm:px-6 sm:py-4'>
          <p className='text-base font-medium text-slate-700 sm:text-xl md:text-xl'>
            Question ({activeQuestion + 1}/{exam.questions.length})
          </p>

          <div className='rounded-xl bg-[#eef0f4] px-4 py-2 text-center text-base font-medium text-slate-700 sm:px-6 sm:py-3 sm:text-xl md:min-w-38 md:px-8 md:text-xl'>
            {minutes}:{seconds} left
          </div>
        </div>

        {/* question card */}
        <Card className='rounded-2xl border-zinc-200'>
          <CardHeader className='px-4 pb-2 pt-4 sm:px-6 sm:pb-4 sm:pt-6'>
            <CardTitle className='text-lg font-medium text-slate-700 sm:text-xl md:text-xl'>
              Q{activeQuestion + 1}. {question?.title}
            </CardTitle>
          </CardHeader>

          <CardContent className='space-y-3 px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-6'>
            {question?.type === 'text' ? (
              <div className='overflow-hidden rounded-xl border border-zinc-200'>
                <div className='flex flex-wrap items-center gap-1.5 border-b border-zinc-200 px-3 py-2 text-slate-600 sm:gap-2 sm:px-4 sm:py-3'>
                  <button
                    type='button'
                    className='rounded p-1 hover:bg-zinc-100'
                  >
                    <Undo2 className='size-3.5 sm:size-4' />
                  </button>
                  <button
                    type='button'
                    className='rounded p-1 hover:bg-zinc-100'
                  >
                    <Redo2 className='size-3.5 sm:size-4' />
                  </button>
                  <span className='mx-0.5 h-4 w-px bg-zinc-200 sm:mx-1' />
                  <button
                    type='button'
                    className='rounded px-1.5 py-1 text-xs hover:bg-zinc-100 sm:px-2'
                  >
                    Normal text
                  </button>
                  <span className='mx-0.5 h-4 w-px bg-zinc-200 sm:mx-1' />
                  <button
                    type='button'
                    className='rounded p-1 hover:bg-zinc-100'
                  >
                    <List className='size-3.5 sm:size-4' />
                  </button>
                  <button
                    type='button'
                    className='rounded p-1 hover:bg-zinc-100'
                  >
                    <Bold className='size-3.5 sm:size-4' />
                  </button>
                  <button
                    type='button'
                    className='rounded p-1 hover:bg-zinc-100'
                  >
                    <Italic className='size-3.5 sm:size-4' />
                  </button>
                  <button
                    type='button'
                    className='rounded p-1 hover:bg-zinc-100'
                  >
                    <Underline className='size-3.5 sm:size-4' />
                  </button>
                </div>
                <textarea
                  className='min-h-40 w-full resize-none bg-white px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-h-56 sm:px-4 sm:py-4'
                  placeholder='Type questions here..'
                  value={
                    typeof selectedAnswer === 'string' ? selectedAnswer : ''
                  }
                  onChange={(e) => saveTextAnswer(e.target.value)}
                />
              </div>
            ) : null}

            {question?.type === 'radio'
              ? question.options.map((option: string) => (
                  <label
                    key={option}
                    className='flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 hover:bg-zinc-50 sm:px-4 sm:py-3'
                  >
                    <input
                      type='radio'
                      name={`q-${question.id}`}
                      className='size-4 shrink-0'
                      checked={selectedAnswer === option}
                      onChange={() => saveRadioAnswer(option)}
                    />
                    <span className='text-base text-slate-600 sm:text-lg'>
                      {option}
                    </span>
                  </label>
                ))
              : null}

            {question?.type === 'checkbox'
              ? question.options.map((option: string) => {
                  const checked =
                    Array.isArray(selectedAnswer) &&
                    selectedAnswer.includes(option);

                  return (
                    <label
                      key={option}
                      className='flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 hover:bg-zinc-50 sm:px-4 sm:py-3'
                    >
                      <input
                        type='checkbox'
                        className='size-4 shrink-0'
                        checked={checked}
                        onChange={(e) =>
                          saveCheckboxAnswer(option, e.currentTarget.checked)
                        }
                      />
                      <span className='text-base text-slate-600 sm:text-lg'>
                        {option}
                      </span>
                    </label>
                  );
                })
              : null}

            {/* footer buttons */}
            <div className='flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4'>
              <Button
                variant='outline'
                type='button'
                onClick={handleSkipQuestion}
                className='w-full rounded-xl border-zinc-300 px-8 py-6 text-slate-700 sm:w-auto'
                disabled={isTimeOut}
              >
                Skip this Question
              </Button>

              <Button
                className='w-full rounded-xl bg-[#6038ef] px-8 py-6 hover:bg-[#502ed4] sm:w-auto text-base'
                type='button'
                onClick={handleSaveAndContinue}
                disabled={isTimeOut || isSubmitting}
              >
                {isLastQuestion
                  ? isSubmitting
                    ? 'Submitting...'
                    : 'Save & Finish'
                  : 'Save & Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isTimeOut ? (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            className='flex items-center justify-center bg-black/40 px-4'
          >
            <section className='w-full max-w-4xl rounded-2xl bg-white px-5 py-10 text-center shadow-2xl sm:px-8 sm:py-12'>
              <div className='mx-auto mb-4 h-14 w-14'>
                <Image
                  src='/time-out.png'
                  alt='Timeout'
                  width={500}
                  height={500}
                  className='h-14 w-14 object-contain'
                  priority
                />
              </div>
              <h2 className='text-xl font-semibold text-slate-800 sm:text-3xl'>
                Timeout!
              </h2>
              <p className='mx-auto mt-3 max-w-3xl text-base text-[#64748B]'>
                Dear {candidateName}, Your exam time has been finished. Thank
                you for participating.
              </p>
              {/* {isSubmitting ? (
                <p className='mx-auto mt-2 max-w-3xl text-sm text-slate-500'>
                  Saving your answers...
                </p>
              ) : null} */}
              {/* {submissionError ? (
                <p className='mx-auto mt-2 max-w-3xl text-sm text-red-600'>
                  {submissionError}
                </p>
              ) : null} */}
              <Button
                type='button'
                variant='outline'
                className='mt-6 rounded-lg border-zinc-300 px-8 py-6 text-slate-700 sm:px-8'
                onClick={handleBackToDashboard}
              >
                Back to Dashboard
              </Button>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
