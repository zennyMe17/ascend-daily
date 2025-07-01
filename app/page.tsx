// pages/index.tsx
"use client"
import Head from 'next/head';
import DailyTimetable from '../components/DailyTimetable';
import PerformanceDashboard from '../components/PerformanceDashboard';
import type { TimetableEntry } from '../types';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

// Define your timetable data (using the revised schedules)
const collegeDayTasks: TimetableEntry[] = [
  { id: 'c2', time: '6:00 AM - 7:30 AM', description: 'Running / Exercise', category: 'Exercise', isCompleted: false, isCoreTask: false },
  { id: 'c3', time: '7:30 AM - 8:00 AM', description: 'Freshen Up & Breakfast', category: 'Freshen Up', isCompleted: false, isCoreTask: false },
  { id: 'c4', time: '8:00 AM - 9:00 AM', description: 'CS Fundamentals', category: 'CS Fundamentals', isCompleted: false, isCoreTask: true },
  { id: 'c5', time: '9:00 AM - 9:30 AM', description: 'Bath & Final College Prep', category: 'Bath & College Prep', isCompleted: false, isCoreTask: false },
  { id: 'c6', time: '9:30 AM - 1:30 PM', description: 'University Classes / Academic Work', category: 'University Classes', isCompleted: false, isCoreTask: false },
  { id: 'c7', time: '1:30 PM - 2:30 PM', description: 'Lunch & Short Break', category: 'Lunch', isCompleted: false, isCoreTask: false },
  { id: 'c8', time: '2:30 PM - 4:30 PM', description: 'DSA Session 2 (Middle Focus)', category: 'DSA', isCompleted: false, isCoreTask: true },
  { id: 'c9', time: '4:30 PM - 5:15 PM', description: 'Project Review on GitHub', category: 'Project Review', isCompleted: false, isCoreTask: true },
  { id: 'c10', time: '5:15 PM - 6:00 PM', description: 'CS Fundamentals (Additional) / Revision / Interview Prep', category: 'CS Fundamentals', isCompleted: false, isCoreTask: true },
  { id: 'c11', time: '6:00 PM - 6:45 PM', description: 'Evening Break / Personal Time', category: 'Break', isCompleted: false, isCoreTask: false },
  { id: 'c12', time: '6:45 PM - 8:30 PM', description: 'DSA Session 3 / Optional Deep Dive', category: 'DSA', isCompleted: false, isCoreTask: true },
  { id: 'c13', time: '8:30 PM - 9:30 PM', description: 'Dinner & Relax', category: 'Dinner', isCompleted: false, isCoreTask: false },
  { id: 'c14', time: '9:30 PM - 11:00 PM', description: 'Revision / Interview Prep / Aptitude', category: 'Revision', isCompleted: false, isCoreTask: true },
  { id: 'c15', time: '11:00 PM onwards', description: 'Sleep', category: 'Sleep', isCompleted: false, isCoreTask: false },
];

const noCollegeDayTasks: TimetableEntry[] = [
  { id: 'nc2', time: '6:00 AM - 7:30 AM', description: 'Running / Exercise', category: 'Exercise', isCompleted: false, isCoreTask: false },
  { id: 'nc3', time: '7:30 AM - 8:00 AM', description: 'Freshen Up & Breakfast (Includes Bath)', category: 'Freshen Up', isCompleted: false, isCoreTask: false },
  { id: 'nc4', time: '8:00 AM - 10:30 AM', description: 'CS Fundamentals', category: 'CS Fundamentals', isCompleted: false, isCoreTask: true },
  { id: 'nc5', time: '10:30 AM - 11:00 AM', description: 'Short Break', category: 'Break', isCompleted: false, isCoreTask: false },
  { id: 'nc6', time: '11:00 AM - 1:30 PM', description: 'DSA Session 1 (Strong Morning Block)', category: 'DSA', isCompleted: false, isCoreTask: true }, // Changed to Session 1
  { id: 'nc7', time: '1:30 PM - 2:30 PM', description: 'Lunch', category: 'Lunch', isCompleted: false, isCoreTask: false },
  { id: 'nc8', time: '2:30 PM - 4:30 PM', description: 'DSA Session 2 (Middle Focus)', category: 'DSA', isCompleted: false, isCoreTask: true }, // Changed to Session 2
  { id: 'nc9', time: '4:30 PM - 5:15 PM', description: 'Project Review on GitHub', category: 'Project Review', isCompleted: false, isCoreTask: true },
  { id: 'nc10', time: '5:15 PM - 6:00 PM', description: 'Revision / Interview Prep / Aptitude', category: 'Revision', isCompleted: false, isCoreTask: true },
  { id: 'nc11', time: '6:00 PM - 7:00 PM', description: 'Evening Break / Personal Time / Hobbies', category: 'Personal Time', isCompleted: false, isCoreTask: false },
  { id: 'nc12', time: '7:00 PM - 8:00 PM', description: 'Dinner', category: 'Dinner', isCompleted: false, isCoreTask: false },
  { id: 'nc13', time: '8:00 PM - 11:00 PM', description: 'DSA Session 3 / Deep Dive', category: 'DSA', isCompleted: false, isCoreTask: true }, // Changed to Session 3
  { id: 'nc14', time: '11:00 PM onwards', description: 'Sleep', category: 'Sleep', isCompleted: false, isCoreTask: false },
];


export default function Home() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [showCollegeTimetable, setShowCollegeTimetable] = useState(true);
  const [currentTaskCategory, setCurrentTaskCategory] = useState<TimetableEntry['category'] | null>(null);
  const [refreshDashboard, setRefreshDashboard] = useState(0);

  const handleScoreSaved = () => {
    setRefreshDashboard(prev => prev + 1);
  };

  // Main page background and default text color for a softer look
  const getOverallBgClass = () => {
    return 'bg-gray-950 text-gray-200'; // Very dark gray background, slightly muted light gray text
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200">
            <p className="text-xl">Loading user data...</p>
        </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${getOverallBgClass()}`}>
      <Head>
        <title>My Study Timetable</title>
        <meta name="description" content="Personalized study timetable tracker" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation Bar - Darker Gray */}
      <nav className="bg-gray-900 p-4 flex items-center shadow-md border-b border-gray-700">
        <div className="flex-1">
          {/* Optional: Add a logo or app name here */}
        </div>

        {/* Center: Welcome message with icon (conditional) */}
        {user && (
          <div className="flex items-center justify-center space-x-2 text-gray-200 flex-1 min-w-0 px-2"> {/* Muted light gray text */}
            {/* User Icon */}
            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span className="text-sm sm:text-base font-medium truncate">
              {user.displayName || user.email}
            </span>
          </div>
        )}

        {/* Right flex-grow to push center */}
        <div className="flex justify-end flex-1">
          {user ? (
            <button
              onClick={logout}
              // Indigo button with white text and logout icon
              className="px-4 py-2 rounded-full text-sm font-semibold bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all duration-300 whitespace-nowrap flex items-center space-x-2"
            >
              {/* Logout Icon */}
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H3a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
              </svg>
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              // Indigo button with white text and generic sign-in icon
              className="px-4 py-2 rounded-full text-sm font-semibold bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all duration-300 flex items-center space-x-2 whitespace-nowrap"
            >
              {/* Generic Sign In Icon (e.g., arrow entering door) */}
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H3a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
              </svg>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* H1 Title - Muted light gray against Very Dark gray */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-200 text-center mb-8 sm:mb-10 leading-tight">
          My Study Performance Dashboard
        </h1>

        {/* Timetable type selection buttons (only visible if logged in) */}
        {user && (
            <div className="flex flex-col sm:flex-row justify-center mb-8 space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                    onClick={() => setShowCollegeTimetable(true)}
                    className={`px-6 py-3 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 ${
                        showCollegeTimetable
                            ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700' // Active: Indigo with white text
                            : 'bg-gray-900 text-gray-400 border border-indigo-600 hover:bg-gray-800' // Inactive: Darker gray, muted text, indigo border
                    }`}
                >
                    Show College Day Timetable
                </button>
                <button
                    onClick={() => setShowCollegeTimetable(false)}
                    className={`px-6 py-3 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 ${
                        !showCollegeTimetable
                            ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700' // Active: Indigo with white text
                            : 'bg-gray-900 text-gray-400 border border-indigo-600 hover:bg-gray-800' // Inactive: Darker gray, muted text, indigo border
                    }`}
                >
                    Show No College Day Timetable
                </button>
            </div>
        )}

        {/* Conditionally render timetable and dashboard based on user login */}
        {user ? (
            <>
                {showCollegeTimetable ? (
                    <DailyTimetable
                        dayName="College Day"
                        initialTasks={collegeDayTasks}
                        onCurrentTaskCategoryChange={setCurrentTaskCategory}
                        onScoreSaved={handleScoreSaved}
                    />
                ) : (
                    <DailyTimetable
                        dayName="No College Day"
                        initialTasks={noCollegeDayTasks}
                        onCurrentTaskCategoryChange={setCurrentTaskCategory}
                        onScoreSaved={handleScoreSaved}
                    />
                )}
                <PerformanceDashboard refreshTrigger={refreshDashboard} />
            </>
        ) : (
            // Landing Page Content - Softer dark gray box against very dark background
            <div className="text-center bg-gray-900 p-8 rounded-lg shadow-xl max-w-2xl mx-auto mt-10 border border-indigo-700"> {/* Darker gray background, indigo border */}
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-200 mb-4"> {/* Muted light gray heading */}
                    Unlock Your Daily Potential!
                </h2>
                <p className="mb-4 text-base sm:text-lg text-gray-300"> {/* Muted light gray text */}
                    Effortlessly track your study progress, manage your daily tasks, and visualize your performance over time.
                    Achieve your academic and personal goals with a structured routine tailored for success.
                </p>
                <p className="mb-6 text-sm sm:text-base text-gray-400"> {/* Even more muted text */}
                    Sign in with your Google account to get started and keep your data synced across all your devices.
                </p>
            </div>
        )}
      </main>

      {/* Footer - Muted light gray */}
      <footer className="text-center text-gray-400 mt-12">
        <p>&copy; {new Date().getFullYear()} My Study Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}
