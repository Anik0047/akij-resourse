import {
  type CandidateSession,
  type EmployerSession,
  type Exam,
} from '@/lib/assessment-types';

const EXAMS_KEY = 'assessment-exams';
const EMPLOYER_SESSION_KEY = 'employer-session';
const CANDIDATE_SESSION_KEY = 'candidate-session';

const seededExams: Exam[] = [
  {
    id: 'exam-react-1',
    title: 'Frontend Engineer Screening',
    totalCandidates: 48,
    totalSlots: 3,
    questionSets: 2,
    questionType: 'radio',
    startTime: '2026-04-12T10:00',
    endTime: '2026-04-12T12:00',
    duration: 30,
    negativeMarking: 0.25,
    candidates: [
      'maria@candidate.com',
      'tayeb@candidate.com',
      'nuru@candidate.com',
    ],
    questions: [
      {
        id: 'q1',
        title: 'Which hook is used for memoizing expensive calculations?',
        type: 'radio',
        options: ['useEffect', 'useMemo', 'useCallback', 'useLayoutEffect'],
      },
      {
        id: 'q2',
        title: 'Select valid CSS layout systems.',
        type: 'checkbox',
        options: ['Grid', 'Flexbox', 'Object-fit', 'Box-shadow'],
      },
      {
        id: 'q3',
        title: 'Write one strategy to prevent unnecessary rerenders.',
        type: 'text',
        options: [],
      },
    ],
  },
  {
    id: 'exam-node-2',
    title: 'Full Stack Problem Solving',
    totalCandidates: 24,
    totalSlots: 2,
    questionSets: 1,
    questionType: 'text',
    startTime: '2026-04-13T15:00',
    endTime: '2026-04-13T17:00',
    duration: 45,
    negativeMarking: 0,
    candidates: ['anik@candidate.com', 'sajid@candidate.com'],
    questions: [
      {
        id: 'q4',
        title: 'Describe how you would design a queue-based retry system.',
        type: 'text',
        options: [],
      },
      {
        id: 'q5',
        title: 'Which are valid HTTP methods for partial update?',
        type: 'checkbox',
        options: ['PATCH', 'PUT', 'GET', 'DELETE'],
      },
    ],
  },
];

function canUseStorage() {
  return typeof window !== 'undefined';
}

export function getExams(): Exam[] {
  if (!canUseStorage()) {
    return seededExams;
  }

  const raw = window.localStorage.getItem(EXAMS_KEY);
  if (!raw) {
    window.localStorage.setItem(EXAMS_KEY, JSON.stringify(seededExams));
    return seededExams;
  }

  try {
    return JSON.parse(raw) as Exam[];
  } catch {
    window.localStorage.setItem(EXAMS_KEY, JSON.stringify(seededExams));
    return seededExams;
  }
}

export function saveExams(exams: Exam[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
}

export function createExam(exam: Omit<Exam, 'id'>) {
  const exams = getExams();
  const newExam: Exam = {
    ...exam,
    id: `exam-${crypto.randomUUID()}`,
  };

  const nextExams = [newExam, ...exams];
  saveExams(nextExams);
  return newExam;
}

export function getEmployerSession() {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(EMPLOYER_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as EmployerSession;
  } catch {
    return null;
  }
}

export function setEmployerSession(session: EmployerSession) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(EMPLOYER_SESSION_KEY, JSON.stringify(session));
}

export function clearEmployerSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(EMPLOYER_SESSION_KEY);
}

export function getCandidateSession() {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(CANDIDATE_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CandidateSession;
  } catch {
    return null;
  }
}

export function setCandidateSession(session: CandidateSession) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(CANDIDATE_SESSION_KEY, JSON.stringify(session));
}

export function clearCandidateSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(CANDIDATE_SESSION_KEY);
}
