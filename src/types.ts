export interface StudentProfile {
  name: string;
  language: "Hindi" | "English" | "Hinglish";
  grade: string;
  topic: string;
  weaknesses: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
  imageUrl?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  topic: string;
  score: number;
  total: number;
  date: string;
  questions: QuizQuestion[];
  studentAnswers: string[];
}

export interface TopicProgress {
  topic: string;
  completedQuizzesCount: number;
  averageScore: number;
  weaknesses: string[];
  lastStudied: string;
}

export interface DailyGoal {
  id: string;
  text: string;
  completed: boolean;
  date: string;
}

