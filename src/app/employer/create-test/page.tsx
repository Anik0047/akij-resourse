'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
};

export default function CreateTestPage() {
  const router = useRouter();
  const { addExam } = useExamStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [basicForm, setBasicForm] = useState<BasicForm>(initialBasicForm);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [draftQuestion, setDraftQuestion] =
    useState<Question>(questionTemplate);
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
    setEditingQuestionId(null);
    setShowQuestionModal(true);
  };

  const openEditQuestionModal = (question: Question) => {
    setDraftQuestion(question);
    setEditingQuestionId(question.id);
    setShowQuestionModal(true);
  };

  const saveQuestion = () => {
    if (!draftQuestion.title.trim()) {
      return;
    }

    if (editingQuestionId) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestionId ? draftQuestion : q)),
      );
    } else {
      setQuestions((prev) => [...prev, draftQuestion]);
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

  return (
    <main className='min-h-screen bg-[#fff9f1] px-6 py-10 text-zinc-900'>
      <section className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
        <header className='rounded-3xl border border-amber-200 bg-white p-6'>
          <p className='text-xs uppercase tracking-[0.2em] text-amber-700'>
            Create Online Test
          </p>
          <h1 className='mt-2 text-3xl font-semibold'>
            Multi-Step Exam Builder
          </h1>
          <p className='mt-1 text-sm text-zinc-600'>Step {step} of 2</p>
        </header>

        {step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Basic Info</CardTitle>
              <CardDescription>
                Configure high-level exam details and schedule window.
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-5 md:grid-cols-2'>
              <div className='flex flex-col gap-2 md:col-span-2'>
                <Label htmlFor='title'>Title</Label>
                <Input
                  id='title'
                  value={basicForm.title}
                  onChange={(event) =>
                    setBasicForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder='Frontend Hiring Round - Batch 4'
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label htmlFor='candidates'>Total Candidates</Label>
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
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label htmlFor='slots'>Total Slots</Label>
                <Input
                  id='slots'
                  type='number'
                  min={1}
                  value={basicForm.totalSlots}
                  onChange={(event) =>
                    setBasicForm((prev) => ({
                      ...prev,
                      totalSlots: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label htmlFor='question-sets'>Question Sets</Label>
                <Input
                  id='question-sets'
                  type='number'
                  min={1}
                  value={basicForm.questionSets}
                  onChange={(event) =>
                    setBasicForm((prev) => ({
                      ...prev,
                      questionSets: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label htmlFor='question-type'>Question Type</Label>
                <select
                  id='question-type'
                  value={basicForm.questionType}
                  onChange={(event) =>
                    setBasicForm((prev) => ({
                      ...prev,
                      questionType: event.target.value as QuestionType,
                    }))
                  }
                  className='h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm'
                >
                  <option value='radio'>Radio</option>
                  <option value='checkbox'>Checkbox</option>
                  <option value='text'>Text</option>
                </select>
              </div>

              <div className='flex flex-col gap-2'>
                <Label htmlFor='start-time'>Start Time</Label>
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
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label htmlFor='end-time'>End Time</Label>
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
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label htmlFor='duration'>Duration (minutes)</Label>
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
                />
              </div>

              <div className='md:col-span-2 flex justify-end'>
                <Button disabled={!canContinue} onClick={() => setStep(2)}>
                  Continue to Step 2
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Question Sets</CardTitle>
              <CardDescription>
                Add, edit, or remove questions for this exam.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
              <div className='flex justify-end'>
                <Button onClick={openNewQuestionModal}>Add Question</Button>
              </div>

              <div className='flex flex-col gap-3'>
                {questions.length === 0 ? (
                  <p className='rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500'>
                    No questions added yet.
                  </p>
                ) : (
                  questions.map((question) => (
                    <article
                      key={question.id}
                      className='rounded-xl border border-zinc-200 px-4 py-3'
                    >
                      <p className='font-medium'>{question.title}</p>
                      <p className='text-sm text-zinc-600'>
                        Type: {question.type}
                      </p>
                      <div className='mt-3 flex gap-2'>
                        <Button
                          variant='outline'
                          onClick={() => openEditQuestionModal(question)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant='outline'
                          onClick={() => deleteQuestion(question.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <div className='flex justify-between'>
                <Button variant='outline' onClick={() => setStep(1)}>
                  Back to Step 1
                </Button>
                <Button onClick={createTest}>Create Test</Button>
              </div>
            </CardContent>
          </Card>
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
                    value={draftQuestion.options.join(', ')}
                    onChange={(event) =>
                      setDraftQuestion((prev) => ({
                        ...prev,
                        options: event.target.value
                          .split(',')
                          .map((item) => item.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder='Option A, Option B, Option C'
                  />
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
