'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Clock3 } from 'lucide-react';
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
};

export default function CreateTestPage() {
  const router = useRouter();
  const { addExam } = useExamStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [basicForm, setBasicForm] = useState<BasicForm>(initialBasicForm);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [draftQuestion, setDraftQuestion] =
    useState<Question>(questionTemplate);
  const [optionsInput, setOptionsInput] = useState('Option A, Option B');
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
    setDraftQuestion({ ...questionTemplate, id: `q-${crypto.randomUUID()}` });
    setOptionsInput('Option A, Option B');
    setEditingQuestionId(null);
    setShowQuestionModal(true);
  };

  const openEditQuestionModal = (question: Question) => {
    setDraftQuestion({
      ...question,
      correctAnswers: question.correctAnswers ?? [],
    });
    setOptionsInput(question.options.join(', '));
    setEditingQuestionId(question.id);
    setShowQuestionModal(true);
  };

  const parsedOptions = useMemo(
    () =>
      optionsInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [optionsInput],
  );

  const saveQuestion = () => {
    if (!draftQuestion.title.trim()) {
      return;
    }

    const normalizedQuestion: Question = {
      ...draftQuestion,
      options: draftQuestion.type === 'text' ? [] : parsedOptions,
      correctAnswers:
        draftQuestion.type === 'text'
          ? []
          : (draftQuestion.correctAnswers ?? []).filter((answer) =>
              parsedOptions.includes(answer),
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

  const createTest = () => {
    if (!canContinue) {
      return;
    }

    addExam({
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

    router.push('/employer/dashboard');
  };

  const fieldLabelClass = 'text-sm font-medium text-[#334155]';
  const inputClass =
    'h-11 rounded-xl border-[#d9dde7] bg-[#fdfdff] text-[#344054] placeholder:text-[#97a1ba]';

  const getQuestionTypeLabel = (type: QuestionType) => {
    if (type === 'radio') return 'MCQ';
    if (type === 'checkbox') return 'Checkbox';
    return 'Text';
  };

  const getQuestionPoint = (type: QuestionType) => {
    return type === 'text' ? 5 : 1;
  };

  return (
    <main className='min-h-screen bg-[#f4f5f9] px-4 py-8 text-zinc-900 sm:px-6'>
      <section className='mx-auto flex w-full max-w-7xl flex-col gap-6'>
        <header className='rounded-2xl border border-[#d7dbe6] bg-[#f7f8fc] px-6 py-5'>
          <div className='flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
            <div>
              <h1 className='text-[30px] font-semibold text-[#2d3c56]'>
                Manage Online Test
              </h1>

              <div className='mt-3 flex items-center gap-3'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-xs font-semibold ${step === 2 ? 'bg-[#5b3bfe] text-white' : 'bg-[#5b3bfe] text-white'}`}
                  >
                    {step === 2 ? <Check className='size-3.5' /> : '1'}
                  </span>
                  <span
                    className={`text-sm ${step === 1 ? 'font-semibold text-[#5b3bfe]' : 'text-[#2f3d56]'}`}
                  >
                    Basic Info
                  </span>
                </div>

                <span className='h-px w-10 bg-[#9aa5bf]' />

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
            <div className='mx-auto w-full max-w-4xl rounded-2xl border border-[#e2e5ef] bg-[#f8f9fc] p-5 sm:p-6'>
              <h2 className='text-[28px] font-semibold text-[#2f3d56]'>
                Basic Information
              </h2>

              <div className='mt-5 grid gap-5 md:grid-cols-2'>
                <div className='flex flex-col gap-2 md:col-span-2'>
                  <Label htmlFor='title' className={fieldLabelClass}>
                    Online Test Title <span className='text-[#ef4444]'>*</span>
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
                    Total Candidates <span className='text-[#ef4444]'>*</span>
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
                  <Label htmlFor='question-sets' className={fieldLabelClass}>
                    Total Question Set <span className='text-[#ef4444]'>*</span>
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
                  <Label htmlFor='question-type' className={fieldLabelClass}>
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

            <div className='mx-auto w-full max-w-4xl rounded-2xl border border-[#e2e5ef] bg-[#f8f9fc] p-5'>
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
                          {getQuestionPoint(question.type)} pt
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
                              key={`${question.id}-option-${option}`}
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
          <Card className='w-full max-w-xl'>
            <CardHeader>
              <CardTitle>
                {editingQuestionId ? 'Edit Question' : 'Add Question'}
              </CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
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
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label htmlFor='question-type-select'>Question Type</Label>
                <select
                  id='question-type-select'
                  value={draftQuestion.type}
                  onChange={(event) =>
                    setDraftQuestion((prev) => ({
                      ...prev,
                      type: event.target.value as QuestionType,
                      correctAnswers: [],
                    }))
                  }
                  className='h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm'
                >
                  <option value='radio'>Radio</option>
                  <option value='checkbox'>Checkbox</option>
                  <option value='text'>Text</option>
                </select>
              </div>

              {draftQuestion.type !== 'text' ? (
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='question-options'>
                    Options (comma separated)
                  </Label>
                  <Input
                    id='question-options'
                    value={optionsInput}
                    onChange={(event) => setOptionsInput(event.target.value)}
                    placeholder='Option A, Option B, Option C'
                  />
                </div>
              ) : null}

              {draftQuestion.type !== 'text' && parsedOptions.length > 0 ? (
                <div className='flex flex-col gap-2'>
                  <Label>Correct Answer</Label>
                  <div className='space-y-2 rounded-md border border-input bg-background p-3'>
                    {parsedOptions.map((option) => {
                      const isSelected = (
                        draftQuestion.correctAnswers ?? []
                      ).includes(option);

                      return (
                        <label
                          key={`correct-${option}`}
                          className='flex cursor-pointer items-center gap-2 text-sm'
                        >
                          <input
                            type={
                              draftQuestion.type === 'radio'
                                ? 'radio'
                                : 'checkbox'
                            }
                            name='correct-answer'
                            checked={isSelected}
                            onChange={(event) => {
                              if (draftQuestion.type === 'radio') {
                                setDraftQuestion((prev) => ({
                                  ...prev,
                                  correctAnswers: [option],
                                }));
                                return;
                              }

                              setDraftQuestion((prev) => {
                                const current = prev.correctAnswers ?? [];
                                const next = event.target.checked
                                  ? [
                                      ...current.filter(
                                        (item) => item !== option,
                                      ),
                                      option,
                                    ]
                                  : current.filter((item) => item !== option);

                                return {
                                  ...prev,
                                  correctAnswers: next,
                                };
                              });
                            }}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setShowQuestionModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveQuestion}>Save Question</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
