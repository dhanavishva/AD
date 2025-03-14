import { create } from "zustand";

interface User {
  id: string;
  role: "admin" | "staff" | "student";
  name: string;
  email: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  semester: number;
  batch: string;
  section: string;
  staffName: string;
  academicYear: string;
}

interface QuestionMark {
  questionNumber: string;
  co: number;
  maxMarks: number;
}

interface StudentMark {
  rollNumber: number;
  name: string;
  marks: number[];
  questionMarks?: { [key: string]: number };
  submitted: boolean;
}

interface SerialTest {
  id: number;
  subjectId: string;
  serialTestNumber: 1 | 2;
  questionMarks: QuestionMark[];
  coMarks: Array<{ co: number; maxMarks: number }>;
  studentMarks: StudentMark[];
  batch: string;
  section: string;
}

interface Store {
  user: User | null;
  subjects: Subject[];
  serialTests: SerialTest[];
  subjectsPublished: boolean;
  currentBatch: string;
  currentSection: string;

  setUser: (user: User | null) => void;
  addSubject: (subject: Subject) => void;
  removeSubject: (id: string) => void;
  addSerialTest: (test: SerialTest) => void;
  removeSerialTest: (id: number) => void;
  getSubjectsBySemester: (
    semester: number,
    batch: string,
    section: string
  ) => Subject[];
  updateStudentMarks: (
    testId: number,
    studentRollNumber: number,
    marks: number[],
    questionMarks?: { [key: string]: number }
  ) => void;
  resetSubjects: () => void;
  saveSubjects: () => void;
  setBatchAndSection: (batch: string, section: string) => void;
}

export const useStore = create<Store>((set, get) => ({
  user: null,
  subjects: [],
  serialTests: [],
  subjectsPublished: false,
  currentBatch: "2022-2026",
  currentSection: "A",

  setUser: (user) => set({ user }),

  setBatchAndSection: (batch, section) =>
    set({
      currentBatch: batch,
      currentSection: section,
    }),

  addSubject: (subject) =>
    set((state) => ({
      subjects: [...state.subjects, subject],
    })),

  removeSubject: (id) =>
    set((state) => ({
      subjects: state.subjects.filter((subject) => subject.id !== id),
      serialTests: state.serialTests.filter((test) => test.subjectId !== id),
    })),

  addSerialTest: (test) =>
    set((state) => ({
      serialTests: [...state.serialTests, test],
    })),

  removeSerialTest: (id) =>
    set((state) => ({
      serialTests: state.serialTests.filter((test) => test.id !== id),
    })),

  getSubjectsBySemester: (semester, batch, section) => {
    const state = get();
    return state.subjects.filter(
      (subject) =>
        subject.semester === semester &&
        subject.batch === batch &&
        subject.section === section
    );
  },

  updateStudentMarks: (testId, studentRollNumber, marks, questionMarks) =>
    set((state) => ({
      serialTests: state.serialTests.map((test) =>
        test.id === testId
          ? {
              ...test,
              studentMarks: test.studentMarks.map((student) =>
                student.rollNumber === studentRollNumber
                  ? { ...student, marks, questionMarks, submitted: true }
                  : student
              ),
            }
          : test
      ),
    })),

  resetSubjects: () =>
    set({
      subjects: [],
      serialTests: [],
      subjectsPublished: false,
    }),

  saveSubjects: () =>
    set({
      subjectsPublished: true,
    }),
}));

export type { User, Subject, SerialTest, QuestionMark, StudentMark };
