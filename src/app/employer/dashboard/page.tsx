'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Search,
  Users,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useExamStore } from '@/hooks/use-exam-store';
import { type Exam } from '@/lib/assessment-types';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

const supabase = createClient();

function metricValue(value: number) {
  return value > 0 ? value.toLocaleString() : 'Not Set';
}

function formatDateYmd(value: string) {
  return value.split('T')[0] ?? value;
}

export default function EmployerDashboardPage() {
  const router = useRouter();
  const { exams } = useExamStore();
  const [modalCandidates, setModalCandidates] = useState<
    Array<{ candidateId: string | null; candidateEmail: string }>
  >([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedCandidateEmail, setSelectedCandidateEmail] = useState<
    string | null
  >(null);
  const [candidateSubmission, setCandidateSubmission] = useState<{
    score: number;
    maxScore: number;
    submittedAt: string;
  } | null>(null);
  const [candidateAnswers, setCandidateAnswers] = useState<
    Array<{
      id: string;
      questionTitle: string;
      questionType: string;
      candidateAnswer: unknown;
      awardedPoints: number;
      isCorrect: boolean | null;
      correctAnswer: unknown;
    }>
  >([]);
  const [isLoadingCandidateResult, setIsLoadingCandidateResult] =
    useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [candidateResultError, setCandidateResultError] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);

  const formatAnswerValue = (value: unknown) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'string') {
      return value;
    }

    if (value === null || value === undefined) {
      return 'Not answered';
    }

    return JSON.stringify(value);
  };

  const loadCandidateResult = async (
    examId: string,
    candidate: { candidateId: string | null; candidateEmail: string },
  ) => {
    const { candidateId, candidateEmail } = candidate;

    setSelectedCandidateEmail(candidateEmail);
    setIsLoadingCandidateResult(true);
    setCandidateResultError(null);
    setCandidateSubmission(null);
    setCandidateAnswers([]);

    let submissionQuery = supabase
      .from('exam_submissions')
      .select('id, score, max_score, submitted_at')
      .eq('exam_id', examId)
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (candidateId) {
      submissionQuery = submissionQuery.eq('candidate_id', candidateId);
    } else {
      submissionQuery = submissionQuery.eq('candidate_email', candidateEmail);
    }

    const { data: submissionRow, error: submissionError } =
      await submissionQuery.maybeSingle();

    if (submissionError) {
      setCandidateResultError(submissionError.message);
      setIsLoadingCandidateResult(false);
      return;
    }

    if (!submissionRow) {
      setIsLoadingCandidateResult(false);
      return;
    }

    const { data: answerRows, error: answersError } = await supabase
      .from('exam_submission_answers')
      .select(
        `
          id,
          candidate_answer,
          awarded_points,
          is_correct,
          questions(
            title,
            question_type,
            correct_answer
          )
        `,
      )
      .eq('submission_id', submissionRow.id);

    if (answersError) {
      setCandidateResultError(answersError.message);
      setIsLoadingCandidateResult(false);
      return;
    }

    setCandidateSubmission({
      score: Number(submissionRow.score ?? 0),
      maxScore: Number(submissionRow.max_score ?? 0),
      submittedAt: String(submissionRow.submitted_at ?? ''),
    });

    const normalizedAnswers = (answerRows ?? []).map((answer) => {
      const question =
        answer.questions &&
        typeof answer.questions === 'object' &&
        !Array.isArray(answer.questions)
          ? (answer.questions as {
              title?: string;
              question_type?: string;
              correct_answer?: unknown;
            })
          : {};

      return {
        id: String(answer.id),
        questionTitle: String(question.title ?? 'Untitled question'),
        questionType: String(question.question_type ?? 'unknown'),
        candidateAnswer: answer.candidate_answer,
        awardedPoints: Number(answer.awarded_points ?? 0),
        isCorrect:
          typeof answer.is_correct === 'boolean' ? answer.is_correct : null,
        correctAnswer: question.correct_answer ?? null,
      };
    });

    setCandidateAnswers(normalizedAnswers);
    setIsLoadingCandidateResult(false);
  };

  const openCandidatesModal = (exam: Exam) => {
    setSelectedExam(exam);
    setCandidateSubmission(null);
    setCandidateAnswers([]);
    setCandidateResultError(null);
    setSelectedCandidateEmail(null);
    setIsLoadingCandidateResult(false);
    setIsLoadingCandidates(true);
    setModalCandidates([]);

    const loadCandidates = async () => {
      const { data: submissionRows, error: submissionError } = await supabase
        .from('exam_submissions')
        .select('candidate_id, candidate_email, submitted_at')
        .eq('exam_id', exam.id)
        .order('submitted_at', { ascending: false });

      if (submissionError) {
        setCandidateResultError(submissionError.message);
        setIsLoadingCandidates(false);
        return;
      }

      const byEmail = new Map<
        string,
        { candidateId: string | null; candidateEmail: string }
      >();

      (submissionRows ?? []).forEach((row) => {
        const email = String(row.candidate_email ?? '').trim();
        if (!email || byEmail.has(email)) {
          return;
        }

        byEmail.set(email, {
          candidateId: row.candidate_id ? String(row.candidate_id) : null,
          candidateEmail: email,
        });
      });

      exam.candidates.forEach((email) => {
        if (!byEmail.has(email)) {
          byEmail.set(email, { candidateId: null, candidateEmail: email });
        }
      });

      const nextCandidates = Array.from(byEmail.values());
      setModalCandidates(nextCandidates);
      setIsLoadingCandidates(false);

      const firstCandidate = nextCandidates[0] ?? null;
      if (!firstCandidate) {
        return;
      }

      void loadCandidateResult(exam.id, firstCandidate);
    };

    void loadCandidates();
  };

  const closeCandidatesModal = () => {
    setSelectedExam(null);
    setSelectedCandidateEmail(null);
    setCandidateSubmission(null);
    setCandidateAnswers([]);
    setCandidateResultError(null);
    setIsLoadingCandidateResult(false);
    setIsLoadingCandidates(false);
    setModalCandidates([]);
  };

  useEffect(() => {
    const ensureEmployerAuthenticated = async () => {
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

      if (profileError || profile?.role !== 'employer') {
        await supabase.auth.signOut();
        router.replace('/auth/login');
      }
    };

    void ensureEmployerAuthenticated();
  }, [router]);

  const totalCandidates = useMemo(() => {
    return exams.reduce((count, exam) => count + exam.totalCandidates, 0);
  }, [exams]);

  const filteredExams = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return exams;
    }

    return exams.filter((exam) => exam.title.toLowerCase().includes(query));
  }, [exams, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / perPage));
  const activePage = Math.min(page, totalPages);

  const pagedExams = useMemo(() => {
    const start = (activePage - 1) * perPage;
    return filteredExams.slice(start, start + perPage);
  }, [activePage, filteredExams, perPage]);

  return (
    <main className='min-h-screen bg-[#f5f6fb] px-4 py-8 text-zinc-900 sm:px-6'>
      <section className='mx-auto flex w-full max-w-350 flex-col gap-5'>
        <header className='flex flex-col gap-3 lg:flex-row lg:items-center'>
          <h1 className='text-[30px] font-semibold text-[#2c3b53]'>
            Online Tests
          </h1>

          <div className='relative flex-1 lg:ml-auto lg:max-w-xl'>
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder='Search by exam title'
              className='h-10 rounded-xl border-[#cbcfe6] bg-white pr-10 text-sm'
            />
            <Search className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#7f87a8]' />
          </div>

          <div className='flex items-center justify-end gap-2'>
            <Button
              asChild
              className='h-10 rounded-xl bg-[#5c3bfe] px-5 font-semibold text-white hover:bg-[#4f31e2]'
            >
              <Link href='/employer/create-test'>Create Online Test</Link>
            </Button>
          </div>
        </header>

        <div className='grid gap-4 md:grid-cols-2'>
          {pagedExams.map((exam) => (
            <Card
              key={exam.id}
              className='gap-3 rounded-2xl border border-[#dfe2ee] bg-white py-5 shadow-none'
            >
              <CardHeader>
                <CardTitle className='text-[31px] font-semibold text-[#2f3d56]'>
                  {exam.title}
                </CardTitle>
                <CardDescription className='text-xs text-[#8490ad]'>
                  {formatDateYmd(exam.startTime)} -{' '}
                  {formatDateYmd(exam.endTime)}
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col gap-4'>
                <div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#7481a1]'>
                  <p className='flex items-center gap-1.5'>
                    <Users className='size-3.5' /> Candidates:{' '}
                    {metricValue(exam.totalCandidates)}
                  </p>
                  <p className='flex items-center gap-1.5'>
                    <FileText className='size-3.5' /> Question Set:{' '}
                    {metricValue(exam.questionSets)}
                  </p>
                  <p className='flex items-center gap-1.5'>
                    <Workflow className='size-3.5' /> Exam Slots:{' '}
                    {metricValue(exam.totalSlots)}
                  </p>
                </div>
                <Button
                  variant='outline'
                  onClick={() => openCandidatesModal(exam)}
                  className='h-8 w-fit rounded-xl border-[#6f4fff] px-5 text-xs font-semibold text-[#5c3bfe] hover:bg-[#f4f1ff]'
                >
                  View Candidates
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {pagedExams.length === 0 ? (
          <Card className='rounded-2xl border border-dashed border-[#cfd5e8] bg-white py-8 text-center shadow-none'>
            <CardContent>
              <Image
                src='/group.png'
                alt='No exams found'
                width={100}
                height={100}
                className='mx-auto'
              />

              <p className='text-lg font-bold'>
                No exams found for your search.
              </p>
              <p className='text-sm font-normal text-[#64748B] mt-3'>
                Currently, there are no online tests available. Please check
                back later for updates.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className='flex items-center justify-between pt-1 text-xs text-[#636c84]'>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={activePage === 1}
              className='flex size-6 items-center justify-center rounded border border-[#d8dced] bg-white disabled:opacity-40'
            >
              <ChevronLeft className='size-3.5' />
            </button>
            <span className='font-semibold'>{activePage}</span>
            <button
              type='button'
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={activePage === totalPages}
              className='flex size-6 items-center justify-center rounded border border-[#d8dced] bg-white disabled:opacity-40'
            >
              <ChevronRight className='size-3.5' />
            </button>
          </div>

          <div className='flex items-center gap-2'>
            <span>Online Test Per Page</span>
            <select
              value={perPage}
              onChange={(event) => {
                setPerPage(Number(event.target.value));
                setPage(1);
              }}
              className='rounded-md border border-[#d8dced] bg-white px-2 py-1 outline-none'
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
            </select>
          </div>
        </div>

        <p className='text-xs text-[#697392]'>
          {filteredExams.length} tests active · {totalCandidates} candidates in
          pipeline
        </p>
      </section>

      {selectedExam ? (
        <div className='fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4'>
          <Card className='w-full max-w-4xl'>
            <CardHeader>
              <CardTitle>{selectedExam.title}</CardTitle>
              <CardDescription>
                Select a candidate to see answers and score
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4 md:grid-cols-[220px_1fr]'>
              <div className='rounded-xl border border-zinc-200 bg-zinc-50 p-2'>
                {isLoadingCandidates ? (
                  <div className='flex items-center gap-2 px-2 py-4 text-xs text-zinc-500'>
                    <Loader2 className='size-3.5 animate-spin' /> Loading
                    candidates...
                  </div>
                ) : null}

                {!isLoadingCandidates && modalCandidates.length === 0 ? (
                  <p className='px-2 py-4 text-xs text-zinc-500'>
                    No candidates found yet.
                  </p>
                ) : (
                  <ul className='space-y-1'>
                    {modalCandidates.map((candidate) => {
                      const active =
                        candidate.candidateEmail === selectedCandidateEmail;

                      return (
                        <li key={candidate.candidateEmail}>
                          <button
                            type='button'
                            onClick={() =>
                              void loadCandidateResult(
                                selectedExam.id,
                                candidate,
                              )
                            }
                            className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                              active
                                ? 'bg-[#5c3bfe] text-white'
                                : 'bg-white text-zinc-700 hover:bg-zinc-100'
                            }`}
                          >
                            {candidate.candidateEmail}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className='rounded-xl border border-zinc-200 bg-white p-4'>
                {!selectedCandidateEmail ? (
                  <p className='text-sm text-zinc-500'>
                    Select a candidate from the left panel.
                  </p>
                ) : null}

                {isLoadingCandidateResult ? (
                  <div className='flex items-center gap-2 text-sm text-zinc-500'>
                    <Loader2 className='size-4 animate-spin' /> Loading
                    candidate result...
                  </div>
                ) : null}

                {candidateResultError ? (
                  <p className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                    {candidateResultError}
                  </p>
                ) : null}

                {!isLoadingCandidateResult &&
                !candidateResultError &&
                selectedCandidateEmail &&
                !candidateSubmission ? (
                  <p className='text-sm text-zinc-600'>
                    This candidate has not submitted the exam yet.
                  </p>
                ) : null}

                {candidateSubmission ? (
                  <div className='space-y-3'>
                    <div className='rounded-lg bg-[#f3efff] px-3 py-2 text-sm text-[#4b34a5]'>
                      Score:{' '}
                      <strong>{candidateSubmission.score.toFixed(2)}</strong>
                      {' / '}
                      <strong>{candidateSubmission.maxScore.toFixed(2)}</strong>
                      <span className='ml-3 text-xs text-[#6a57c5]'>
                        Submitted:{' '}
                        {new Date(
                          candidateSubmission.submittedAt,
                        ).toLocaleString()}
                      </span>
                    </div>

                    {candidateAnswers.length === 0 ? (
                      <p className='text-sm text-zinc-600'>
                        No answers found for this submission.
                      </p>
                    ) : (
                      <ul className='max-h-85 space-y-2 overflow-y-auto pr-1'>
                        {candidateAnswers.map((answer, index) => (
                          <li
                            key={answer.id}
                            className='rounded-lg border border-zinc-200 bg-zinc-50 p-3'
                          >
                            <p className='text-sm font-semibold text-zinc-800'>
                              Q{index + 1}. {answer.questionTitle}
                            </p>
                            <p className='mt-1 text-xs text-zinc-500'>
                              Type: {answer.questionType}
                            </p>
                            <p className='mt-2 text-sm text-zinc-700'>
                              Candidate:{' '}
                              {formatAnswerValue(answer.candidateAnswer)}
                            </p>
                            <p className='mt-1 text-sm text-zinc-700'>
                              Correct: {formatAnswerValue(answer.correctAnswer)}
                            </p>
                            <p className='mt-1 text-xs text-zinc-500'>
                              Awarded: {answer.awardedPoints.toFixed(2)} pts
                              {answer.isCorrect === null
                                ? ' (manual review)'
                                : answer.isCorrect
                                  ? ' (correct)'
                                  : ' (incorrect)'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>

              <div className='md:col-span-2'>
                <Button onClick={closeCandidatesModal}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
