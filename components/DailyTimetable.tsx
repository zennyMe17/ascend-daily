// components/DailyTimetable.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { TimetableEntry, DailyPerformance } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, Timestamp, updateDoc, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface DailyTimetableProps {
  dayName: string;
  initialTasks: TimetableEntry[];
  onCurrentTaskCategoryChange: (category: TimetableEntry['category'] | null) => void;
  onScoreSaved: () => void;
}

const parseTimeRange = (timeString: string) => {
  const [startTimeStr, endTimeStr] = timeString.split(' - ');

  const parseTime = (time: string): { hours: number; minutes: number } => {
    const [timeVal, ampm] = time.split(' ');
    let [hours, minutes] = timeVal.split(':').map(Number);
    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    return { hours, minutes };
  };

  const start = parseTime(startTimeStr);
  const end = parseTime(endTimeStr);

  return { start, end };
};

const DailyTimetable: React.FC<DailyTimetableProps> = ({ dayName, initialTasks, onCurrentTaskCategoryChange, onScoreSaved }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TimetableEntry[]>(initialTasks);
  const [performance, setPerformance] = useState<DailyPerformance | null>(null);
  const [currentTask, setCurrentTask] = useState<TimetableEntry | null>(null);
  const [showFullTimetable, setShowFullTimetable] = useState(false);
  const [hasScoreBeenSavedToday, setHasScoreBeenSavedToday] = useState(false);
  const [currentDayDocRef, setCurrentDayDocRef] = useState<any>(null); // To store ref for today's doc

  // --- NEW: Load tasks from Firestore or use initialTasks ---
  useEffect(() => {
    const loadTasksForToday = async () => {
      if (!user) {
        setTasks(initialTasks); // Reset to initial if no user
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      try {
        const q = query(
          collection(db, 'dailyPerformance'),
          where('date', '==', today),
          where('userId', '==', user.uid),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const savedData = doc.data() as DailyPerformance;
          setCurrentDayDocRef(doc.ref); // Store the document reference

          setHasScoreBeenSavedToday(true); // Mark as saved if doc exists

          if (savedData.taskCompletionStatus) {
            // Apply saved completion statuses to the initial tasks
            const updatedTasks = initialTasks.map(task => ({
              ...task,
              isCompleted: savedData.taskCompletionStatus![task.id] || false // Default to false if not found
            }));
            setTasks(updatedTasks);
          } else {
            // If no taskCompletionStatus, use initial tasks
            setTasks(initialTasks);
          }
        } else {
          // No record for today, initialize with all tasks unchecked
          setTasks(initialTasks);
          setHasScoreBeenSavedToday(false);
          setCurrentDayDocRef(null); // Clear ref
        }
      } catch (e) {
        console.error("Error loading tasks for today:", e);
        setTasks(initialTasks); // Fallback to initial tasks on error
      }
    };

    loadTasksForToday();
  }, [user, dayName, initialTasks]); // Re-run when user, dayName, or initialTasks change

  // Calculate performance whenever tasks change
  useEffect(() => {
    const coreTasks = tasks.filter(task => task.isCoreTask);
    const completedCoreTasks = coreTasks.filter(task => task.isCompleted);

    const totalCoreTasks = coreTasks.length;
    const completedCount = completedCoreTasks.length;
    const score = totalCoreTasks > 0 ? (completedCount / totalCoreTasks) * 100 : 0;

    // NEW: Generate taskCompletionStatus object
    const taskCompletionStatus: { [key: string]: boolean } = {};
    tasks.forEach(task => {
      taskCompletionStatus[task.id] = task.isCompleted;
    });

    setPerformance({
      date: new Date().toISOString().split('T')[0],
      score: parseFloat(score.toFixed(2)),
      totalCoreTasks: totalCoreTasks,
      completedCoreTasks: completedCount,
      taskCompletionStatus: taskCompletionStatus, // Include this new field
    });
  }, [tasks]);

  // Function to save performance to Firestore (now also used for updates)
  // Use useCallback to memoize this function, preventing unnecessary re-renders
  const savePerformanceToFirestore = useCallback(async (dailyPerf: DailyPerformance) => {
    if (!user || !dailyPerf) {
      console.warn("Cannot save performance: No user or performance data.");
      return;
    }

    try {
      const today = dailyPerf.date;
      let docRefToUse = currentDayDocRef; // Use stored doc ref if available

      if (!docRefToUse) { // If no docRef (first save of the day)
        const q = query(
          collection(db, 'dailyPerformance'),
          where('date', '==', today),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          docRefToUse = querySnapshot.docs[0].ref; // Get ref if it exists
        }
      }

      const dataToSave = {
          ...dailyPerf,
          timestamp: Timestamp.now(),
          userId: user.uid,
          taskCompletionStatus: dailyPerf.taskCompletionStatus, // Ensure this is always included
      };

      if (docRefToUse) {
        // If a document exists, update it
        await updateDoc(docRefToUse, dataToSave);
        console.log("Document updated: ", docRefToUse.id);
      } else {
        // Otherwise, create a new document
        const newDocRef = await addDoc(collection(db, 'dailyPerformance'), dataToSave);
        setCurrentDayDocRef(newDocRef); // Store the new document reference
        console.log("Document written with ID: ", newDocRef.id);
      }

      setHasScoreBeenSavedToday(true);
      onScoreSaved(); // Trigger dashboard refresh
    } catch (e) {
      console.error("Error adding/updating document: ", e);
    }
  }, [user, currentDayDocRef, onScoreSaved]); // Dependencies for useCallback

  // EFFECT FOR AUTOMATIC SAVE (modified slightly to use the updated save function)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkAndSave = async () => {
      if (!user || !performance || hasScoreBeenSavedToday) {
        return;
      }

      const now = new Date();
      const currentHour = now.getHours();

      if (currentHour >= 23) { // 23:00 is 11 PM
        console.log("It's after 11 PM, attempting to auto-save performance...");
        await savePerformanceToFirestore(performance); // This now includes taskCompletionStatus
        if (intervalId) clearInterval(intervalId);
      }
    };

    intervalId = setInterval(checkAndSave, 60 * 60 * 1000); // Check every hour
    checkAndSave(); // Run once on mount

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, performance, hasScoreBeenSavedToday, savePerformanceToFirestore]); // Add savePerformanceToFirestore as dependency

  // Find the current active task and report its category for background effect
  useEffect(() => {
    const updateCurrentTaskAndReport = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      let foundTask: TimetableEntry | null = null;
      for (const task of tasks) {
        if (task.category === 'Sleep' && task.time.includes('onwards')) {
          const sleepStartTimeStr = task.time.split(' ')[0] + ' ' + task.time.split(' ')[1];
          const { start: sleepStart } = parseTimeRange(sleepStartTimeStr + ' - 12:00 AM');

          if (currentHours > sleepStart.hours || (currentHours === sleepStart.hours && currentMinutes >= sleepStart.minutes) ||
              (currentHours >= 0 && currentHours < 5) || (currentHours === 5 && currentMinutes < 30)) {
              foundTask = task;
              break;
          }
          continue;
        }

        const { start, end } = parseTimeRange(task.time);

        const taskStartTimeInMinutes = start.hours * 60 + start.minutes;
        const taskEndTimeInMinutes = end.hours * 60 + end.minutes;
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;

        if (currentTimeInMinutes >= taskStartTimeInMinutes && currentTimeInMinutes < taskEndTimeInMinutes) {
          foundTask = task;
          break;
        }
      }
      setCurrentTask(foundTask);
      onCurrentTaskCategoryChange(foundTask ? foundTask.category : null);
    };

    updateCurrentTaskAndReport();
    const intervalId = setInterval(updateCurrentTaskAndReport, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [tasks, onCurrentTaskCategoryChange]);


  // --- MODIFIED: handleTaskToggle to save on each change ---
  const handleTaskToggle = async (id: string) => {
    if (!user) { // Don't allow toggling if not logged in
        console.warn("Cannot toggle task: No user logged in.");
        return;
    }

    // Update local state first for immediate UI feedback
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
    );
    setTasks(updatedTasks);

    // Calculate new performance and taskCompletionStatus based on updatedTasks
    const coreTasks = updatedTasks.filter(task => task.isCoreTask);
    const completedCoreTasks = coreTasks.filter(task => task.isCompleted);
    const totalCoreTasks = coreTasks.length;
    const completedCount = completedCoreTasks.length;
    const newScore = totalCoreTasks > 0 ? (completedCount / totalCoreTasks) * 100 : 0;

    const newTaskCompletionStatus: { [key: string]: boolean } = {};
    updatedTasks.forEach(task => {
        newTaskCompletionStatus[task.id] = task.isCompleted;
    });

    // Prepare the performance object with the new task status
    const updatedPerformance: DailyPerformance = {
        date: new Date().toISOString().split('T')[0],
        score: parseFloat(newScore.toFixed(2)),
        totalCoreTasks: totalCoreTasks,
        completedCoreTasks: completedCount,
        taskCompletionStatus: newTaskCompletionStatus,
        userId: user.uid, // Ensure userId is present
    };

    // Immediately save the updated performance (including task status) to Firestore
    await savePerformanceToFirestore(updatedPerformance);
  };

  // Harmonized category colors for a monochromatic theme with a subtle accent
  const getCategoryColor = (category: TimetableEntry['category']) => {
    // All categories now use a dark gray background with a teal accent text
    return 'bg-gray-700 text-teal-400';
  };

  return (
    <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-8 w-full max-w-4xl mx-auto border border-gray-700"> {/* Dark gray card, with a subtle border */}
      <h2 className="text-3xl font-bold text-gray-100 mb-6 text-center">{dayName} Timetable</h2> {/* Lighter gray for heading */}

      {/* Performance Metrics */}
      {performance && (
        <div className="mb-6 bg-gray-700 text-gray-100 p-4 rounded-lg shadow-md flex items-center justify-between border border-gray-600"> {/* Darker gray background, light gray text */}
          <div>
            <p className="text-xl font-semibold">Today's Performance:</p>
            <p className="text-sm text-gray-300">Completed {performance.completedCoreTasks} out of {performance.totalCoreTasks} core tasks.</p> {/* Muted text */}
          </div>
          <div className="text-4xl font-extrabold text-gray-50"> {/* Brighter gray for score */}
            {performance.score}%
          </div>
        </div>
      )}

      {/* Current Task Display (shown when full timetable is hidden) */}
      {!showFullTimetable && (
        <div className="mb-6 border-2 border-teal-400 bg-gray-700 p-4 rounded-lg shadow-inner text-center"> {/* Teal accent border, dark gray background */}
          <h3 className="text-xl font-semibold text-gray-200 mb-2">Current Task:</h3> {/* Muted light gray heading */}
          {currentTask ? (
            <div className="flex items-center justify-center space-x-3 text-xl font-bold text-gray-100"> {/* Light gray text */}
              {/* Checkbox for the current task, only visible here */}
              <input
                type="checkbox"
                checked={currentTask.isCompleted}
                onChange={() => handleTaskToggle(currentTask.id)}
                disabled={!user} // Disable if not logged in
                className="form-checkbox h-7 w-7 text-teal-400 rounded-md cursor-pointer focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-700 transition-colors duration-200" // Teal checkbox
              />
              <span className={`text-sm font-semibold px-2 py-1 rounded-full ${getCategoryColor(currentTask.category)}`}>
                {currentTask.category}
              </span>
              <span>{currentTask.description} ({currentTask.time})</span>
            </div>
          ) : (
            <p className="text-gray-300">No active task or outside defined schedule.</p> 
          )}
        </div>
      )}

      {/* Toggle Button for Full Timetable */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowFullTimetable(!showFullTimetable)}
          className="px-6 py-2 bg-gray-700 text-gray-100 font-semibold rounded-full shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-all duration-200"
        >
          {showFullTimetable ? 'Hide Full Timetable' : 'Show Full Timetable'}
        </button>
      </div>

      {!user && (
          <div className="flex justify-center mb-6 text-orange-400 font-medium"> {/* Softer warning color */}
              Sign in to save your performance and task progress.
          </div>
      )}

      {/* Full Timetable Display (Conditional) */}
      {showFullTimetable && (
        <div className="space-y-4">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`flex items-center p-4 rounded-lg transition-all duration-200 border border-gray-700
                ${task.isCompleted ? 'bg-gray-700' : 'bg-gray-900'} {/* Darker background for incomplete */}
                ${currentTask && currentTask.id === task.id
                  ? 'border-2 border-teal-400 ring-4 ring-teal-900' // Teal highlight for current task
                  : 'opacity-70' // Reduce opacity if not current task
                }`}
            >
              <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={() => handleTaskToggle(task.id)}
                // Allow toggling only if it's the current active task AND user is logged in
                disabled={!user || !currentTask || currentTask.id !== task.id}
                className="form-checkbox h-6 w-6 text-teal-400 rounded-md cursor-pointer
                           focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-700
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors duration-200"
              />
              <div className="ml-4 flex-1">
                <div className="flex items-center mb-1">
                  <span className={`text-sm font-semibold mr-2 px-2 py-1 rounded-full ${getCategoryColor(task.category)}`}>
                    {task.category}
                  </span>
                  <span className={`text-lg font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-200'} `}> {/* Muted line-through, and muted active text */}
                    {task.description}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{task.time}</p> {/* Muted time text */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyTimetable;