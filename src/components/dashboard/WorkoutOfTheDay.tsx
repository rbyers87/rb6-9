import React, { useState } from 'react';
    import { Calendar, Clock } from 'lucide-react';
    import { useWorkoutLogger } from '../../hooks/useWorkoutLogger';
    import { WorkoutLogger } from '../workouts/WorkoutLogger';
    import type { Workout } from '../../types/workout';

    interface WorkoutOfTheDayProps {
      workout: Workout | null;
      onWorkoutComplete?: (completedExercises?: any[]) => void;
    }

    export function WorkoutOfTheDay({ workout, onWorkoutComplete }: WorkoutOfTheDayProps) {
      const [isLogging, setIsLogging] = useState(false);
      const { startWorkoutLogging, logging,  } = useWorkoutLogger();
      const [localLogging, setLocalLogging] = useState(false);

      const handleStartWorkout = async () => {
        if (!workout) return;
        try {
          await startWorkoutLogging(workout);
          setIsLogging(true);
          setLocalLogging(true);
        } catch (error) {
          console.error('Error starting workout:', error);
        }
      };

      const handleCloseLogger = (completedExercises?: any[]) => {
        setIsLogging(false);
        setLocalLogging(false);
        if (onWorkoutComplete) {
          onWorkoutComplete(completedExercises);
        }
      };

      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Workout of the Day</h2>
            {workout && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">Today</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">~45 min</span>
                </div>
              </div>
            )}
          </div>

          {workout ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{workout.name}</h3>
                {workout.description && (
                  <p className="text-gray-600 mt-1">{workout.description}</p>
                )}
              </div>

              <div className="space-y-3">
                {workout.workout_exercises?.map((exercise) => (
                  <div key={exercise.id} className="flex items-center justify-between py-2 border-t border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">{exercise.exercise.name}</p>
                      <p className="text-sm text-gray-500">
                        {exercise.sets} sets × {exercise.reps} reps
                        {exercise.weight && ` @ ${exercise.weight}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleStartWorkout}
                disabled={localLogging}
                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {localLogging ? 'Starting...' : 'Start Workout'}
              </button>
            </div>
          ) : (
            <p className="text-gray-600">No workout scheduled for today.</p>
          )}

          {isLogging && workout && (
            <WorkoutLogger
              workout={workout}
              onClose={handleCloseLogger}
            />
          )}
        </div>
      );
    }
