import React, { useState, useEffect } from 'react';
    import { supabase } from '../../lib/supabase';
    import { useAuth } from '../../contexts/AuthContext';
    import { LoadingSpinner } from '../common/LoadingSpinner';
    import { WorkoutLogger } from '../workouts/WorkoutLogger';
    import type { Workout } from '../../types/workout';
    
    interface IncompleteWorkoutsProps {
      onWorkoutComplete?: () => void;
    }
    
    export function IncompleteWorkouts({ onWorkoutComplete }: IncompleteWorkoutsProps) {
      const { user } = useAuth();
      const [incompleteWorkouts, setIncompleteWorkouts] = useState<any[]>([]);
      const [loading, setLoading] = useState(true);
      const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    
      const fetchIncompleteWorkouts = async () => {
        if (!user) return;
    
        try {
          // Fetch workout logs that are not completed
          const { data, error } = await supabase
            .from('workout_logs')
            .select(`
              *,
              workout:workouts (*)
            `)
            .eq('user_id', user.id)
            .is('completed_at', null)
            .order('created_at', { ascending: false });
    
          if (error) throw error;
          setIncompleteWorkouts(data || []);
        } catch (error) {
          console.error('Error fetching incomplete workouts:', error);
        } finally {
          setLoading(false);
        }
      };
    
      useEffect(() => {
        fetchIncompleteWorkouts();
      }, [user, onWorkoutComplete]);
    
      const handleResumeWorkout = (workout: Workout) => {
        setSelectedWorkout(workout);
      };
    
      const handleCloseLogger = () => {
        setSelectedWorkout(null);
      };
    
      if (loading) return <LoadingSpinner />;
    
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Incomplete Workouts</h2>
          
          <div className="space-y-4">
            {incompleteWorkouts.map((log) => (
              <div key={log.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{log.workout.name}</p>
                  <p className="text-sm text-gray-600">
                    Started on: {new Date(log.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleResumeWorkout(log.workout)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Resume
                </button>
              </div>
            ))}
    
            {incompleteWorkouts.length === 0 && (
              <p className="text-gray-500">No incomplete workouts.</p>
            )}
          </div>
    
          {selectedWorkout && (
            <WorkoutLogger
              workout={selectedWorkout}
              onClose={handleCloseLogger}
            />
          )}
        </div>
      );
    }
