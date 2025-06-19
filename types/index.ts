// types/index.ts

export interface TimetableEntry {
  id: string; // Unique identifier for each task
  time: string; // E.g., "05:30 AM - 6:00 AM"
  description: string; // The task description
  category: 'DSA' | 'Exercise' | 'Freshen Up' | 'Breakfast' | 'CS Fundamentals' | 'University Classes' | 'Lunch' | 'Project Review' | 'Break' | 'Personal Time' | 'Revision' | 'Dinner' | 'Sleep' | 'Bath & College Prep' | 'Interview Prep' | 'Aptitude';
  isCompleted: boolean; // To track if the task is done
  isCoreTask: boolean; // To identify tasks that directly contribute to performance (e.g., DSA, CS Fundamentals)
}

export interface DailyPerformance {
  id?: string; // Add this line - it's optional as it comes from Firestore
  userId?: string; // Add userId to interface for clarity, even if Firestore adds it
  date: string; // YYYY-MM-DD
  score: number; // Percentage of core tasks completed
  totalCoreTasks: number;
  completedCoreTasks: number;
  timestamp?: any; // Optional: If you also retrieve the Firestore Timestamp object
  // ADD THIS NEW FIELD for task persistence
  taskCompletionStatus?: { [taskId: string]: boolean }; // Map task ID to its completion status
  [key: string]: any; // <--- ADD THIS LINE (Index Signature) - ensure this is still here
}