// components/PerformanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase'; // Ensure this correctly imports db
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore'; // Import 'where'
import type { DailyPerformance } from '../types';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

interface PerformanceDashboardProps {
  refreshTrigger: number;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ refreshTrigger }) => {
  const { user, loading: authLoading } = useAuth(); // Get user and authLoading state
  const [pastPerformances, setPastPerformances] = useState<DailyPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPastPerformances = async () => {
      if (authLoading || !user) { // Wait for auth to load and user to be present
        setPastPerformances([]); // Clear performances if no user or still loading
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'dailyPerformance'),
          where('userId', '==', user.uid), // Crucial: filter by current user's ID
          orderBy('timestamp', 'desc'),
          limit(7)
        );
        const querySnapshot = await getDocs(q);
        const performances: DailyPerformance[] = [];
        querySnapshot.forEach((doc) => {
          performances.push({
            id: doc.id,
            date: doc.data().date,
            score: doc.data().score,
            totalCoreTasks: doc.data().totalCoreTasks,
            completedCoreTasks: doc.data().completedCoreTasks,
            // timestamp: doc.data().timestamp // If you want to use the Firebase Timestamp object directly
          });
        });
        setPastPerformances(performances);
      } catch (err) {
        console.error("Error fetching past performances: ", err);
        setError("Failed to load performance data. Please ensure you are logged in.");
      } finally {
        setLoading(false);
      }
    };

    fetchPastPerformances();
  }, [refreshTrigger, user, authLoading]); // Re-fetch when refreshTrigger or user changes

  return (
    <div className="bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-4xl mx-auto mt-8 border border-gray-700"> {/* Dark gray background with border */}
      <h2 className="text-3xl font-bold text-gray-100 mb-6 text-center">Your Performance Trend</h2> {/* Soft light gray heading */}

      {authLoading && <p className="text-center text-gray-300">Authenticating...</p>} {/* Muted gray text */}
      {!authLoading && !user && <p className="text-center text-gray-300">Sign in to view your performance history.</p>} {/* Muted gray text */}
      {!authLoading && user && loading && <p className="text-center text-gray-300">Loading past performance...</p>} {/* Muted gray text */}
      {!authLoading && user && error && <p className="text-center text-orange-400">{error}</p>} {/* Softer warning color */}

      {!authLoading && user && !loading && !error && pastPerformances.length === 0 && (
        <p className="text-center text-gray-300">No performance data yet. Complete and save a day's score!</p> 
      )}

      {!authLoading && user && !loading && !error && pastPerformances.length > 0 && (
        <div className="space-y-4">
          {pastPerformances.map((perf) => (
            <div key={perf.id} className="flex justify-between items-center bg-gray-700 p-4 rounded-lg border border-gray-700"> {/* Darker gray background for entries, consistent border */}
              <span className="text-lg font-medium text-gray-200"> {/* Muted light gray text */}
                {perf.date === new Date().toISOString().split('T')[0] ? 'Today' : perf.date}
              </span>
              <span
                className="text-xl font-bold"
                // Muted score colors
                style={{
                  color: perf.score >= 80 ? '#2DD4BF' : perf.score >= 50 ? '#FB923C' : '#F87171' // Teal-400, Orange-400, Red-400
                }}
              >
                {perf.score}%
              </span>
              <span className="text-sm text-gray-400"> {/* Muted gray for details */}
                ({perf.completedCoreTasks}/{perf.totalCoreTasks} core tasks)
              </span>
            </div>
          ))}
        </div>
      )}
      {!authLoading && user && <p className="text-sm text-gray-400 mt-4 text-center">Scores are based on completion of core tasks.</p>} {/* Muted gray footer text */}
    </div>
  );
};

export default PerformanceDashboard;