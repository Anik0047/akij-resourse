export type QuestionType = 'checkbox' | 'radio' | 'text';

export type Question = {
  id: string;
  title: string;
  type: QuestionType;
  options: string[];
  correctAnswers?: string[];
  points?: number;
};

export type Exam = {
  id: string;
  title: string;
  totalCandidates: number;
  totalSlots: number;
  questionSets: number;
  questionType: QuestionType;
  startTime: string;
  endTime: string;
  duration: number;
  negativeMarking: number;
  candidates: string[];
  questions: Question[];
};

export type EmployerSession = {
  email: string;
};

export type CandidateSession = {
  email: string;
};
