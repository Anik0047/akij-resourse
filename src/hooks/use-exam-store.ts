'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import {
  type Exam,
  type Question,
  type QuestionType,
} from '@/lib/assessment-types';

const supabase = createClient();

type AnswerValue = string | string[];

type SubmitExamInput = {
  exam: Exam;
  answers: Record<string, AnswerValue>;
};

function normalizeQuestionType(value: string): QuestionType {
  if (value === 'checkbox' || value === 'radio' || value === 'text') {
    return value;
  }

  return 'radio';
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function toQuestion(row: Record<string, unknown>): Question {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    type: normalizeQuestionType(String(row.question_type ?? 'radio')),
    options: parseStringArray(row.options),
    correctAnswers: parseStringArray(row.correct_answer),
    points: Number(row.points ?? 1),
  };
}

function toExam(row: Record<string, unknown>): Exam {
  const questionsRaw = Array.isArray(row.questions) ? row.questions : [];

  return {
    id: String(row.id ?? ''),
    employeeId: String(row.employee_id ?? ''),
    title: String(row.title ?? ''),
    totalCandidates: Number(row.total_candidates ?? 0),
    totalSlots: Number(row.total_slots ?? 1),
    questionSets: Number(row.question_sets ?? 1),
    questionType: normalizeQuestionType(String(row.question_type ?? 'radio')),
    startTime: String(row.start_time ?? ''),
    endTime: String(row.end_time ?? ''),
    duration: Number(row.duration_minutes ?? 30),
    negativeMarking: Number(row.negative_marking ?? 0),
    behaviorViolationLimit: Math.max(
      1,
      Number(row.behavior_violation_limit ?? 3),
    ),
    candidates: parseStringArray(row.candidates),
    questions: questionsRaw
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object',
      )
      .map(toQuestion),
  };
}

function arraysHaveSameValues(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const normalizedLeft = [...left].sort();
  const normalizedRight = [...right].sort();

  return normalizedLeft.every(
    (value, index) => value === normalizedRight[index],
  );
}

function calculateQuestionScore(
  question: Question,
  answer: AnswerValue | undefined,
  negativeMarking: number,
) {
  const points = Math.max(0, Number(question.points ?? 1));
  const expected = question.correctAnswers ?? [];

  if (question.type === 'text') {
    return {
      awardedPoints: 0,
      isCorrect: null as boolean | null,
      netScoreDelta: 0,
    };
  }

  let isCorrect = false;

  if (question.type === 'radio') {
    isCorrect =
      typeof answer === 'string' &&
      expected.length > 0 &&
      expected[0] === answer;
  }

  if (question.type === 'checkbox') {
    isCorrect = Array.isArray(answer) && arraysHaveSameValues(answer, expected);
  }

  if (isCorrect) {
    return {
      awardedPoints: points,
      isCorrect,
      netScoreDelta: points,
    };
  }

  return {
    awardedPoints: 0,
    isCorrect,
    netScoreDelta: -Math.max(0, negativeMarking),
  };
}

type ExamStore = {
  exams: Exam[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addExam: (exam: Omit<Exam, 'id' | 'employeeId'>) => Promise<{ ok: boolean }>;
  submitExam: (input: SubmitExamInput) => Promise<{
    ok: boolean;
    message?: string;
    score?: number;
    maxScore?: number;
    submissionId?: string;
  }>;
};

const useExamStoreBase = create<ExamStore>()((set) => {
  const refresh = async () => {
    set({ isLoading: true, error: null });

    const { data, error: fetchError } = await supabase
      .from('online_tests')
      .select(
        `
          id,
          employee_id,
          title,
          total_candidates,
          total_slots,
          question_sets,
          question_type,
          start_time,
          end_time,
          duration_minutes,
          negative_marking,
          behavior_violation_limit,
          candidates,
          questions(
            id,
            title,
            question_type,
            options,
            correct_answer,
            points
          )
        `,
      )
      .order('created_at', { ascending: false });

    if (fetchError) {
      set({ exams: [], error: fetchError.message, isLoading: false });
      return;
    }

    const nextExams = ((data ?? []) as unknown[])
      .filter((item) => Boolean(item) && typeof item === 'object')
      .map((item) => toExam(item as Record<string, unknown>));

    set({ exams: nextExams, isLoading: false });
  };

  const addExam: ExamStore['addExam'] = async (exam) => {
    set({ error: null });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      set({ error: 'You need to be logged in as an employer.' });
      return { ok: false };
    }

    const { error: employeeUpsertError } = await supabase
      .from('employees')
      .upsert({ id: authData.user.id }, { onConflict: 'id' });

    if (employeeUpsertError) {
      set({ error: employeeUpsertError.message });
      return { ok: false };
    }

    const { data: insertedTest, error: insertTestError } = await supabase
      .from('online_tests')
      .insert({
        employee_id: authData.user.id,
        title: exam.title,
        total_candidates: exam.totalCandidates,
        total_slots: exam.totalSlots,
        question_sets: exam.questionSets,
        question_type: exam.questionType,
        start_time: new Date(exam.startTime).toISOString(),
        end_time: new Date(exam.endTime).toISOString(),
        duration_minutes: exam.duration,
        negative_marking: exam.negativeMarking,
        behavior_violation_limit: exam.behaviorViolationLimit,
        candidates: exam.candidates,
      })
      .select('id')
      .single();

    if (insertTestError || !insertedTest) {
      set({ error: insertTestError?.message ?? 'Failed to create test.' });
      return { ok: false };
    }

    if (exam.questions.length > 0) {
      const questionRows = exam.questions.map((question) => ({
        employee_id: authData.user.id,
        exam_id: insertedTest.id,
        title: question.title,
        question_type: question.type,
        options: question.options,
        correct_answer: question.correctAnswers ?? [],
        points: question.points ?? 1,
      }));

      const { error: insertQuestionsError } = await supabase
        .from('questions')
        .insert(questionRows);

      if (insertQuestionsError) {
        set({ error: insertQuestionsError.message });
        return { ok: false };
      }
    }

    await refresh();
    return { ok: true };
  };

  const submitExam: ExamStore['submitExam'] = async ({ exam, answers }) => {
    set({ error: null });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { ok: false, message: 'You need to be logged in as a candidate.' };
    }

    const { error: candidateUpsertError } = await supabase
      .from('candidates')
      .upsert({ id: authData.user.id }, { onConflict: 'id' });

    if (candidateUpsertError) {
      return { ok: false, message: candidateUpsertError.message };
    }

    if (!exam.employeeId) {
      return { ok: false, message: 'Exam owner is missing.' };
    }

    const maxScore = exam.questions.reduce(
      (sum, question) => sum + Math.max(0, Number(question.points ?? 1)),
      0,
    );

    const scoredQuestions = exam.questions.map((question) => {
      const answer = answers[question.id];
      const scored = calculateQuestionScore(
        question,
        answer,
        exam.negativeMarking,
      );

      return {
        question,
        answer,
        ...scored,
      };
    });

    const totalScore = scoredQuestions.reduce(
      (sum, item) => sum + item.netScoreDelta,
      0,
    );

    const clampedScore = Math.min(maxScore, Math.max(0, totalScore));

    const { data: submission, error: submissionError } = await supabase
      .from('exam_submissions')
      .insert({
        exam_id: exam.id,
        candidate_id: authData.user.id,
        candidate_email: authData.user.email ?? null,
        employee_id: exam.employeeId,
        score: clampedScore,
        max_score: maxScore,
      })
      .select('id')
      .single();

    if (submissionError || !submission) {
      return {
        ok: false,
        message: submissionError?.message ?? 'Failed to save exam submission.',
      };
    }

    const answerRows = scoredQuestions.map((item) => ({
      submission_id: submission.id,
      question_id: item.question.id,
      candidate_answer: item.answer ?? null,
      awarded_points: item.awardedPoints,
      is_correct: item.isCorrect,
    }));

    if (answerRows.length > 0) {
      const { error: answersError } = await supabase
        .from('exam_submission_answers')
        .insert(answerRows);

      if (answersError) {
        return {
          ok: false,
          message: answersError.message,
        };
      }
    }

    return {
      ok: true,
      score: clampedScore,
      maxScore,
      submissionId: String(submission.id),
    };
  };

  return {
    exams: [],
    isLoading: true,
    error: null,
    refresh,
    addExam,
    submitExam,
  };
});

export function useExamStore() {
  const store = useExamStoreBase();

  useEffect(() => {
    void store.refresh();
  }, [store.refresh]);

  return store;
}
