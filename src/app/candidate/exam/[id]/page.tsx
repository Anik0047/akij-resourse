'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExamStore } from '@/hooks/use-exam-store';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function CandidateExamPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { exams } = useExamStore();

  const [timeLeft, setTimeLeft] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const exam = useMemo(
    () => exams.find((item) => item.id === params.id),
    [exams, params.id],
  );

  useEffect(() => {
    const ensureAuthenticated = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.replace('/auth/login');
    };

    ensureAuthenticated();
  }, [router]);

  useEffect(() => {
    if (!exam) return;

    const initTimer = window.setTimeout(() => {
      setTimeLeft((prev) => (prev > 0 ? prev : (exam.duration ?? 0) * 60));
    }, 0);

    return () => window.clearTimeout(initTimer);
  }, [exam]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!exam) return null;

  const question = exam.questions[activeQuestion];
  const isLastQuestion = activeQuestion === exam.questions.length - 1;
  const selectedAnswer = question ? answers[question.id] : '';

  const goNextQuestion = () => {
    if (isLastQuestion) {
      router.push('/candidate/dashboard');
      return;
    }

    setActiveQuestion((prev) => prev + 1);
  };

  const handleSkipQuestion = () => {
    goNextQuestion();
  };

  const handleSaveAndContinue = () => {
    if (!question) return;
    goNextQuestion();
  };

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0');

  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <main className='min-h-screen bg-[#f8fafc] p-6'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* top bar */}
        <div className='flex items-center justify-between bg-white border rounded-xl px-6 py-4'>
          <p className='text-sm font-medium text-gray-600'>
            Question ({activeQuestion + 1}/{exam.questions.length})
          </p>

          <div className='bg-gray-100 px-4 py-2 rounded-lg text-sm font-semibold'>
            {minutes}:{seconds} left
          </div>
        </div>

        {/* question card */}
        <Card className='rounded-xl'>
          <CardHeader>
            <CardTitle className='text-base font-semibold'>
              Q{activeQuestion + 1}. {question?.title}
            </CardTitle>
          </CardHeader>

          <CardContent className='space-y-3'>
            {question?.options.map((option: string) => (
              <label
                key={option}
                className='flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50'
              >
                <input
                  type='radio'
                  name={`q-${question.id}`}
                  className='w-4 h-4'
                  checked={selectedAnswer === option}
                  onChange={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: option,
                    }))
                  }
                />
                <span className='text-sm'>{option}</span>
              </label>
            ))}

            {/* footer buttons */}
            <div className='flex items-center justify-between pt-4'>
              <Button
                variant='outline'
                type='button'
                onClick={handleSkipQuestion}
              >
                Skip this Question
              </Button>

              <Button
                className='bg-purple-600 hover:bg-purple-700'
                type='button'
                onClick={handleSaveAndContinue}
              >
                {isLastQuestion ? 'Save & Finish' : 'Save & Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
