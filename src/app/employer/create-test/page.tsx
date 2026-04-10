'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Clock3, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Question, type QuestionType } from '@/lib/assessment-types';
import { useExamStore } from '@/hooks/use-exam-store';

type BasicForm = {
  title: string;
  totalCandidates: number;
  totalSlots: number;
  questionSets: number;
  questionType: QuestionType;
  startTime: string;
  endTime: string;
  duration: number;
};

const initialBasicForm: BasicForm = {
  title: '',
  totalCandidates: 20,
  totalSlots: 1,
  questionSets: 1,
  questionType: 'radio',
  startTime: '',
  endTime: '',
  duration: 30,
};

const questionTemplate: Question = {
  id: '',
  title: '',
  type: 'radio',
  options: ['Option A', 'Option B'],
  correctAnswers: [],
  points: 1,
};

function defaultOptionsFor(type: QuestionType) {
  if (type === 'text') {
    return [] as string[];
  }

  return ['Option A', 'Option B', 'Option C', 'Option D'];
}

function defaultPointsFor(type: QuestionType) {
  return type === 'text' ? 5 : 1;
}

export default function CreateTestPage() {
  const router = useRouter();
  const { addExam } = useExamStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [showBasicInfoReview, setShowBasicInfoReview] = useState(false);
  const [basicForm, setBasicForm] = useState<BasicForm>(initialBasicForm);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [draftQuestion, setDraftQuestion] =
    useState<Question>(questionTemplate);
  const [optionDrafts, setOptionDrafts] = useState<string[]>(
    defaultOptionsFor('radio'),
  );
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const canContinue = useMemo(() => {
    return Boolean(
      basicForm.title.trim() &&
      basicForm.startTime.trim() &&
      basicForm.endTime.trim() &&
      basicForm.duration > 0 &&
      basicForm.totalCandidates > 0,
    );
  }, [basicForm]);

  const openNewQuestionModal = () => {
    setDraftQuestion({
      ...questionTemplate,
      id: `q-${crypto.randomUUID()}`,
      points: defaultPointsFor('radio'),
      correctAnswers: [],
    });
    setOptionDrafts(defaultOptionsFor('radio'));
    setEditingQuestionId(null);
    setShowQuestionModal(true);
  };

  const openEditQuestionModal = (question: Question) => {
    const nextType = question.type;
    setDraftQuestion({
      ...question,
      correctAnswers: question.correctAnswers ?? [],
      points: question.points ?? defaultPointsFor(nextType),
    });

    setOptionDrafts(
      nextType === 'text'
        ? []
        : question.options.length > 0
          ? question.options
          : defaultOptionsFor(nextType),
    );

    setEditingQuestionId(question.id);
    setShowQuestionModal(true);
  };

  const saveQuestion = () => {
    if (!draftQuestion.title.trim()) {
      return;
    }

    const normalizedOptions =
      draftQuestion.type === 'text'
        ? []
        : optionDrafts.map((item) => item.trim()).filter(Boolean);

    const normalizedQuestion: Question = {
      ...draftQuestion,
      options: normalizedOptions,
      correctAnswers:
        draftQuestion.type === 'text'
          ? []
          : (draftQuestion.correctAnswers ?? []).filter((answer) =>
              normalizedOptions.includes(answer),
            ),
      points: Math.max(
        1,
        Number(draftQuestion.points ?? defaultPointsFor(draftQuestion.type)),
      ),
    };

    if (
      normalizedQuestion.type !== 'text' &&
      normalizedQuestion.options.length < 2
    ) {
      return;
    }

    if (
      normalizedQuestion.type !== 'text' &&
      (normalizedQuestion.correctAnswers?.length ?? 0) === 0
    ) {
      return;
    }

    if (
      normalizedQuestion.type === 'radio' &&
      (normalizedQuestion.correctAnswers?.length ?? 0) > 1
    ) {
      normalizedQuestion.correctAnswers = [
        normalizedQuestion.correctAnswers![0],
      ];
    }

    if (editingQuestionId) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestionId ? normalizedQuestion : q)),
      );
    } else {
      setQuestions((prev) => [...prev, normalizedQuestion]);
    }

    setShowQuestionModal(false);
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions((prev) =>
      prev.filter((question) => question.id !== questionId),
    );
  };

  const createTest = async () => {
    if (!canContinue) {
      return;
    }

    const result = await addExam({
      title: basicForm.title,
      totalCandidates: basicForm.totalCandidates,
      totalSlots: basicForm.totalSlots,
      questionSets: basicForm.questionSets,
      questionType: basicForm.questionType,
      startTime: basicForm.startTime,
      endTime: basicForm.endTime,
      duration: basicForm.duration,
      negativeMarking: 0.25,
      candidates: [],
      questions,
    });

    if (!result.ok) {
      return;
    }

    router.push('/employer/dashboard');
  };

  const fieldLabelClass = 'text-sm font-medium text-[#334155]';
  const inputClass =
    'h-11 rounded-xl border-[#d9dde7] bg-[#fdfdff] text-[#344054] placeholder:text-[#97a1ba]';

  const formatDateLabel = (value: string) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString();
  };

  const formatTimeLabel = (value: string) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    if (type === 'radio') return 'MCQ';
    if (type === 'checkbox') return 'Checkbox';
    return 'Text';
  };

  const toggleCorrectAnswer = (option: string, checked: boolean) => {
    setDraftQuestion((prev) => {
      if (prev.type === 'radio') {
        return {
          ...prev,
          correctAnswers: checked ? [option] : [],
        };
      }

      const current = prev.correctAnswers ?? [];
      const next = checked
        ? [...current.filter((item) => item !== option), option]
        : current.filter((item) => item !== option);

      return {
        ...prev,
        correctAnswers: next,
      };
    });
  };

  return (
    <main className='min-h-screen bg-[#f4f5f9] px-4 py-8 text-zinc-900 sm:px-6'>
      <section className='mx-auto flex w-full max-w-350 flex-col gap-6'>
        <header className='rounded-2xl border border-[#d7dbe6] bg-[#f7f8fc] px-6 py-5'>
          <div className='flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
            <div>
              <h1 className='text-[30px] font-semibold text-[#2d3c56]'>
                Manage Online Test
              </h1>

              <div className='mt-3 flex items-center gap-3'>
                <div className='flex items-center gap-2'>
                  <span className='flex size-5 items-center justify-center rounded-full bg-[#5b3bfe] text-xs font-semibold text-white'>
                    {step === 2 ? <Check className='size-3.5' /> : '1'}
                  </span>
                  <span
                    className={`text-sm ${step === 1 ? 'font-semibold text-[#5b3bfe]' : 'text-[#2f3d56]'}`}
                  >
                    Basic Info
                  </span>
                </div>

                <span className='h-px w-15 bg-[#9aa5bf]' />

                <div className='flex items-center gap-2'>
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-xs font-semibold ${step === 2 ? 'bg-[#5b3bfe] text-white' : 'bg-[#c7cedf] text-[#4a5876]'}`}
                  >
                    {step === 2 ? <Check className='size-3.5' /> : '2'}
                  </span>
                  <span
                    className={`text-sm ${step === 2 ? 'font-semibold text-[#2f3d56]' : 'text-[#73809f]'}`}
                  >
                    Questions Sets
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant='outline'
              onClick={() => router.push('/employer/dashboard')}
              className='h-11 rounded-xl border-[#d8dde8] bg-[#f6f7fb] px-6 font-semibold text-[#3c4a66]'
            >
              Back to Dashboard
            </Button>
          </div>
        </header>

        {step === 1 ? (
          <>
            {!showBasicInfoReview ? (
              <>
                <div className='mx-auto w-full max-w-5xl rounded-2xl border border-[#e2e5ef] bg-[#f8f9fc] p-5 sm:p-6'>
                  <h2 className='text-[28px] font-semibold text-[#2f3d56]'>
                    Basic Information
                  </h2>

                  <div className='mt-5 grid gap-5 md:grid-cols-2'>
                    <div className='flex flex-col gap-2 md:col-span-2'>
                      <Label htmlFor='title' className={fieldLabelClass}>
                        Online Test Title{' '}
                        <span className='text-[#ef4444]'>*</span>
                      </Label>
                      <Input
                        id='title'
                        value={basicForm.title}
                        onChange={(event) =>
                          setBasicForm((prev) => ({
                            ...prev,
                            title: event.target.value,
                          }))
                        }
                        className={inputClass}
                        placeholder='Enter online test title'
                      />
                    </div>

                    <div className='flex flex-col gap-2'>
                      <Label htmlFor='candidates' className={fieldLabelClass}>
                        Total Candidates{' '}
                        <span className='text-[#ef4444]'>*</span>
                      </Label>
                      <Input
                        id='candidates'
                        type='number'
                        min={1}
                        value={basicForm.totalCandidates}
                        onChange={(event) =>
                          setBasicForm((prev) => ({
                            ...prev,
                            totalCandidates: Number(event.target.value),
                          }))
                        }
                        className={inputClass}
                        placeholder='Enter total candidates'
                      />
                    </div>

                    <div className='flex flex-col gap-2'>
                      <Label htmlFor='slots' className={fieldLabelClass}>
                        Total Slots <span className='text-[#ef4444]'>*</span>
                      </Label>
                      <div className='relative'>
                        <select
                          id='slots'
                          value={basicForm.totalSlots}
                          onChange={(event) =>
                            setBasicForm((prev) => ({
                              ...prev,
                              totalSlots: Number(event.target.value),
                            }))
                          }
                          className='h-11 w-full appearance-none rounded-xl border border-[#d9dde7] bg-[#fdfdff] px-3 text-sm text-[#344054] outline-none'
                        >
                          {Array.from({ length: 10 }).map((_, index) => {
                            const value = index + 1;
                            return (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8d97b2]' />
                      </div>
                    </div>

                    <div className='flex flex-col gap-2'>
                      <Label
                        htmlFor='question-sets'
                        className={fieldLabelClass}
                      >
                        Total Question Set{' '}
                        <span className='text-[#ef4444]'>*</span>
                      </Label>
                      <div className='relative'>
                        <select
                          id='question-sets'
                          value={basicForm.questionSets}
                          onChange={(event) =>
                            setBasicForm((prev) => ({
                              ...prev,
                              questionSets: Number(event.target.value),
                            }))
                          }
                          className='h-11 w-full appearance-none rounded-xl border border-[#d9dde7] bg-[#fdfdff] px-3 text-sm text-[#344054] outline-none'
                        >
                          {Array.from({ length: 10 }).map((_, index) => {
                            const value = index + 1;
                            return (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8d97b2]' />
                      </div>
                    </div>

                    <div className='flex flex-col gap-2'>
                      <Label
                        htmlFor='question-type'
                        className={fieldLabelClass}
                      >
                        Question Type <span className='text-[#ef4444]'>*</span>
                      </Label>
                      <div className='relative'>
                        <select
                          id='question-type'
                          value={basicForm.questionType}
                          onChange={(event) =>
                            setBasicForm((prev) => ({
                              ...prev,
                              questionType: event.target.value as QuestionType,
                            }))
                          }
                          className='h-11 w-full appearance-none rounded-xl border border-[#d9dde7] bg-[#fdfdff] px-3 text-sm text-[#344054] outline-none'
                        >
                          <option value='radio'>Radio</option>
                          <option value='checkbox'>Checkbox</option>
                          <option value='text'>Text</option>
                        </select>
                        <ChevronDown className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8d97b2]' />
                      </div>
                    </div>

                    <div className='flex flex-col gap-2'>
                      <Label htmlFor='start-time' className={fieldLabelClass}>
                        Start Time <span className='text-[#ef4444]'>*</span>
                      </Label>
                      <div className='relative'>
                        <Input
                          id='start-time'
                          type='datetime-local'
                          value={basicForm.startTime}
                          onChange={(event) =>
                            setBasicForm((prev) => ({
                              ...prev,
                              startTime: event.target.value,
                            }))
                          }
                          className={`${inputClass} pr-10`}
                        />
                        <Clock3 className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8d97b2]' />
                      </div>
                    </div>

                    <div className='flex flex-col gap-2'>
                      <Label htmlFor='end-time' className={fieldLabelClass}>
                        End Time <span className='text-[#ef4444]'>*</span>
                      </Label>
                      <div className='relative'>
                        <Input
                          id='end-time'
                          type='datetime-local'
                          value={basicForm.endTime}
                          onChange={(event) =>
                            setBasicForm((prev) => ({
                              ...prev,
                              endTime: event.target.value,
                            }))
                          }
                          className={`${inputClass} pr-10`}
                        />
                        <Clock3 className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8d97b2]' />
                      </div>
                    </div>

                    <div className='flex flex-col gap-2'>
                      <Label htmlFor='duration' className={fieldLabelClass}>
                        Duration
                      </Label>
                      <Input
                        id='duration'
                        type='number'
                        min={1}
                        value={basicForm.duration}
                        onChange={(event) =>
                          setBasicForm((prev) => ({
                            ...prev,
                            duration: Number(event.target.value),
                          }))
                        }
                        className={inputClass}
                        placeholder='Duration time'
                      />
                    </div>
                  </div>
                </div>

                <div className='mx-auto w-full max-w-5xl rounded-2xl border border-[#e2e5ef] bg-[#f8f9fc] p-5'>
                  <div className='flex items-center justify-between'>
                    <Button
                      variant='outline'
                      onClick={() => router.push('/employer/dashboard')}
                      className='h-11 rounded-xl border-[#d8dde8] bg-[#f6f7fb] px-10 text-[#3c4a66]'
                    >
                      Cancel
                    </Button>

                    <Button
                      disabled={!canContinue}
                      onClick={() => setShowBasicInfoReview(true)}
                      className='h-11 rounded-xl bg-[#5b3bfe] px-8 font-semibold text-white hover:bg-[#4d30df]'
                    >
                      Save & Continue
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className='mx-auto w-full max-w-5xl rounded-2xl border border-[#e2e5ef] bg-[#f8f9fc] p-5 sm:p-6'>
                  <div className='flex items-center justify-between'>
                    <h2 className='text-[24px] font-semibold text-[#2f3d56]'>
                      Basic Information
                    </h2>
                    <button
                      type='button'
                      onClick={() => setShowBasicInfoReview(false)}
                      className='text-xs font-semibold text-[#5b3bfe] hover:underline'
                    >
                      Edit
                    </button>
                  </div>

                  <div className='mt-4 rounded-xl border border-[#e2e6f1] bg-white px-4 py-4'>
                    <p className='text-sm font-semibold text-[#2f3d56]'>
                      {basicForm.title || '-'}
                    </p>

                    <div className='mt-4 grid gap-4 text-xs text-[#6c7896] md:grid-cols-5'>
                      <div>
                        <p>Total Candidates</p>
                        <p className='mt-1 text-sm font-semibold text-[#334155]'>
                          {basicForm.totalCandidates}
                        </p>
                      </div>
                      <div>
                        <p>Total Slots</p>
                        <p className='mt-1 text-sm font-semibold text-[#334155]'>
                          {basicForm.totalSlots}
                        </p>
                      </div>
                      <div>
                        <p>Total Question Set</p>
                        <p className='mt-1 text-sm font-semibold text-[#334155]'>
                          {basicForm.questionSets}
                        </p>
                      </div>
                      <div>
                        <p>Question For Slots (Minutes)</p>
                        <p className='mt-1 text-sm font-semibold text-[#334155]'>
                          {basicForm.duration}
                        </p>
                      </div>
                      <div>
                        <p>Question Type</p>
                        <p className='mt-1 text-sm font-semibold text-[#334155]'>
                          {getQuestionTypeLabel(basicForm.questionType)}
                        </p>
                      </div>
                    </div>

                    <div className='mt-4 grid gap-4 text-xs text-[#6c7896] md:grid-cols-2'>
                      <div>
                        <p>Start</p>
                        <p className='mt-1 text-sm font-semibold text-[#334155]'>
                          {formatDateLabel(basicForm.startTime)} ·{' '}
                          {formatTimeLabel(basicForm.startTime)}
                        </p>
                      </div>
                      <div>
                        <p>End</p>
                        <p className='mt-1 text-sm font-semibold text-[#334155]'>
                          {formatDateLabel(basicForm.endTime)} ·{' '}
                          {formatTimeLabel(basicForm.endTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='mx-auto w-full max-w-5xl rounded-2xl border border-[#e2e5ef] bg-[#f8f9fc] p-5'>
                  <div className='flex items-center justify-between'>
                    <Button
                      variant='outline'
                      onClick={() => router.push('/employer/dashboard')}
                      className='h-11 rounded-xl border-[#d8dde8] bg-[#f6f7fb] px-10 text-[#3c4a66]'
                    >
                      Cancel
                    </Button>

                    <Button
                      disabled={!canContinue}
                      onClick={() => setStep(2)}
                      className='h-11 rounded-xl bg-[#5b3bfe] px-8 font-semibold text-white hover:bg-[#4d30df]'
                    >
                      Save & Continue
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className='mx-auto flex w-full max-w-5xl flex-col gap-5'>
            <div className='rounded-2xl border border-[#e2e5ef] bg-[#f8f9fc] p-4'>
              <Button
                onClick={openNewQuestionModal}
                className='h-11 w-full rounded-xl bg-[#5b3bfe] text-base font-semibold text-white hover:bg-[#4d30df]'
              >
                Add Question
              </Button>
            </div>

            <div className='flex flex-col gap-4'>
              {questions.length === 0 ? (
                <div className='rounded-2xl border border-dashed border-[#ccd2e2] bg-[#f8f9fc] p-8 text-center'>
                  <p className='text-sm text-[#6b7694]'>
                    No questions added yet.
                  </p>
                </div>
              ) : (
                questions.map((question, index) => (
                  <article
                    key={question.id}
                    className='rounded-2xl border border-[#e4e8f2] bg-[#f8f9fc] px-4 py-3 sm:px-5'
                  >
                    <div className='flex items-center justify-between border-b border-[#e6e9f2] pb-2'>
                      <p className='text-sm font-semibold text-[#24324b]'>
                        Question {index + 1}
                      </p>
                      <div className='flex items-center gap-2'>
                        <span className='rounded-md border border-[#d7dce9] px-2 py-0.5 text-[11px] text-[#6d7795]'>
                          {getQuestionTypeLabel(question.type)}
                        </span>
                        <span className='rounded-md border border-[#d7dce9] px-2 py-0.5 text-[11px] text-[#6d7795]'>
                          {question.points ?? defaultPointsFor(question.type)}{' '}
                          pt
                        </span>
                      </div>
                    </div>

                    <div className='py-3'>
                      <p className='text-sm font-semibold text-[#1f2c44]'>
                        {question.title}
                      </p>

                      {question.type === 'text' ? (
                        <p className='mt-3 text-sm leading-6 text-[#4b5570]'>
                          Write a brief response for this question.
                        </p>
                      ) : (
                        <div className='mt-3 space-y-2'>
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={`${question.id}-option-${option}-${optionIndex}`}
                              className='flex items-center justify-between rounded-md bg-[#eceef4] px-3 py-2 text-sm text-[#3d4864]'
                            >
                              <span>
                                {String.fromCharCode(65 + optionIndex)}.{' '}
                                {option}
                              </span>
                              {(question.correctAnswers ?? []).includes(
                                option,
                              ) ? (
                                <span className='flex size-4 items-center justify-center rounded-full bg-[#38c976] text-white'>
                                  <Check className='size-3' />
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className='flex items-center justify-between border-t border-[#e6e9f2] pt-2'>
                      <button
                        type='button'
                        onClick={() => openEditQuestionModal(question)}
                        className='text-xs font-semibold text-[#5b3bfe] hover:underline'
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        onClick={() => deleteQuestion(question.id)}
                        className='text-xs font-semibold text-[#ef4444] hover:underline'
                      >
                        Remove From Exam
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className='flex justify-between'>
              <Button
                variant='outline'
                onClick={() => setStep(1)}
                className='h-10 rounded-xl border-[#d8dde8] bg-[#f6f7fb] px-6 text-[#3c4a66]'
              >
                Back
              </Button>
              <Button
                onClick={createTest}
                className='h-10 rounded-xl bg-[#5b3bfe] px-7 text-white hover:bg-[#4d30df]'
              >
                Create Test
              </Button>
            </div>
          </div>
        )}
      </section>

      {showQuestionModal ? (
        <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4'>
          <Card className='w-full max-w-4xl rounded-2xl border border-[#dbe0eb] bg-[#f4f6fb] py-4 shadow-xl'>
            <CardHeader className='border-b border-[#dfe3ed] pb-3'>
              <div className='flex items-center justify-between gap-3'>
                <CardTitle className='text-lg font-semibold text-[#223047]'>
                  {editingQuestionId ? 'Edit Question' : 'Question 1'}
                </CardTitle>

                <div className='flex items-center gap-2'>
                  <Label
                    htmlFor='question-points'
                    className='text-xs text-[#54627f]'
                  >
                    Score:
                  </Label>
                  <Input
                    id='question-points'
                    type='number'
                    min={1}
                    value={
                      draftQuestion.points ??
                      defaultPointsFor(draftQuestion.type)
                    }
                    onChange={(event) =>
                      setDraftQuestion((prev) => ({
                        ...prev,
                        points: Math.max(1, Number(event.target.value) || 1),
                      }))
                    }
                    className='h-8 w-16 rounded-md bg-white text-xs'
                  />

                  <select
                    id='question-type-select'
                    value={draftQuestion.type}
                    onChange={(event) => {
                      const nextType = event.target.value as QuestionType;

                      setDraftQuestion((prev) => ({
                        ...prev,
                        type: nextType,
                        correctAnswers: [],
                        points:
                          nextType === 'text'
                            ? 5
                            : Math.max(1, Number(prev.points ?? 1)),
                      }));

                      setOptionDrafts(defaultOptionsFor(nextType));
                    }}
                    className='h-8 rounded-md border border-input bg-white px-2 text-xs'
                  >
                    <option value='radio'>Radio</option>
                    <option value='checkbox'>Checkbox</option>
                    <option value='text'>Text</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className='space-y-4 pt-4'>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='question-title'>Question Title</Label>
                <Input
                  id='question-title'
                  value={draftQuestion.title}
                  onChange={(event) =>
                    setDraftQuestion((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder='Write your question title'
                  className='h-11 rounded-lg bg-white'
                />
              </div>

              {draftQuestion.type === 'text' ? (
                <div className='rounded-lg border border-[#d8ddeb] bg-white p-3 text-sm text-[#5f6b86]'>
                  This is a descriptive question. Candidate will write a text
                  answer.
                </div>
              ) : (
                <div className='space-y-3'>
                  {optionDrafts.map((option, index) => {
                    const letter = String.fromCharCode(65 + index);
                    const trimmed = option.trim();
                    const isCorrect = (
                      draftQuestion.correctAnswers ?? []
                    ).includes(trimmed);

                    return (
                      <div key={`option-row-${index}`} className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <span className='flex size-5 items-center justify-center rounded-full border border-[#c7d0e2] text-xs font-semibold text-[#64748b]'>
                              {letter}
                            </span>

                            <label className='flex items-center gap-2 text-xs text-[#5f6b86]'>
                              <input
                                type={
                                  draftQuestion.type === 'radio'
                                    ? 'radio'
                                    : 'checkbox'
                                }
                                name='correct-answer'
                                checked={isCorrect}
                                onChange={(event) =>
                                  toggleCorrectAnswer(
                                    trimmed,
                                    event.target.checked,
                                  )
                                }
                                disabled={!trimmed}
                              />
                              Set as correct answer
                            </label>
                          </div>

                          <button
                            type='button'
                            onClick={() => {
                              if (optionDrafts.length <= 2) {
                                return;
                              }

                              const removed = optionDrafts[index]?.trim();
                              setOptionDrafts((prev) =>
                                prev.filter(
                                  (_, optionIndex) => optionIndex !== index,
                                ),
                              );

                              if (!removed) {
                                return;
                              }

                              setDraftQuestion((prev) => ({
                                ...prev,
                                correctAnswers: (
                                  prev.correctAnswers ?? []
                                ).filter((answer) => answer !== removed),
                              }));
                            }}
                            className='text-[#8a93ad] hover:text-[#4e5a79]'
                          >
                            <Trash2 className='size-4' />
                          </button>
                        </div>

                        <Input
                          value={option}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            const previousTrimmed = optionDrafts[index]?.trim();

                            setOptionDrafts((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? nextValue : item,
                              ),
                            );

                            if (previousTrimmed) {
                              setDraftQuestion((prev) => ({
                                ...prev,
                                correctAnswers: (prev.correctAnswers ?? []).map(
                                  (answer) =>
                                    answer === previousTrimmed
                                      ? nextValue.trim()
                                      : answer,
                                ),
                              }));
                            }
                          }}
                          placeholder={`Option ${letter}`}
                          className='h-16 rounded-lg border-[#d7dceb] bg-white text-sm'
                        />
                      </div>
                    );
                  })}

                  <button
                    type='button'
                    onClick={() => setOptionDrafts((prev) => [...prev, ''])}
                    className='inline-flex items-center gap-2 text-sm font-medium text-[#4f46e5] hover:text-[#4338ca]'
                  >
                    <Plus className='size-4' /> Another options
                  </button>
                </div>
              )}

              <div className='flex items-center justify-end gap-2 border-t border-[#dfe3ed] pt-3'>
                <Button
                  variant='outline'
                  onClick={() => setShowQuestionModal(false)}
                  className='h-10 rounded-lg border-[#cfd6e7] bg-white px-7'
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveQuestion}
                  className='h-10 rounded-lg bg-[#5b3bfe] px-7 text-white hover:bg-[#4d30df]'
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
