'use client';

import { useCallback, useState } from 'react';
import { createExam, getExams } from '@/lib/assessment-storage';
import { type Exam } from '@/lib/assessment-types';

export function useExamStore() {
  const [exams, setExams] = useState<Exam[]>(() => getExams());

  const refresh = useCallback(() => {
    setExams(getExams());
  }, []);

  const addExam = useCallback((exam: Omit<Exam, 'id'>) => {
    createExam(exam);
    setExams(getExams());
  }, []);

  return { exams, refresh, addExam };
}
