import React, { useState, useEffect } from 'react';
    import { supabase } from '../../lib/supabase';
    import { useAuth } from '../../contexts/AuthContext';
    import { format, startOfWeek, endOfWeek, addWeeks, isSameDay } from 'date-fns';
    import { CheckCircle, Circle } from 'lucide-react';
    import { LoadingSpinner } from '../common/LoadingSpinner';
    
    interface WeeklyExercise {
      id: string;
      name: string;
    }
    
    interface CompletedExercise {
      exercise_id: string;
      completed_at: string;
    }
    
    interface WeeklyExercisesProps {
      completedExercises?: CompletedExercise[];
    }
    
    export function WeeklyExercises({ completedExercises: initialCompletedExercises }: WeeklyExercisesProps) {
      const { user } = useAuth();
      const [exercises, setExercises] = useState<WeeklyExercise[]>([]);
      const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>(initialCompletedExercises || []);
      const [loading, setLoading] = useState(true);
      const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    
      useEffect(() => {
        async function fetchExercises() {
          setLoading(true);
          try {
            const { data: exercisesData, error: exercisesError } = await supabase
              .from('exercises')
              .select('*')
              .order('name');
    
            if (exercisesError) throw exercisesError;
            setExercises(exercisesData || []);
    
            if (user) {
              const weekStart = format(currentWeekStart, 'yyyy-MM-dd');
              const weekEnd = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
              const { data: completedData, error: completedError } = await supabase
                .from('workout_logs')
                .select(`
                  id,
                  completed_at,
                  workout:workouts (
                    workout_exercises (
                      exercise_id
                    )
                  )
                `)
                .eq('user_id', user.id)
                .gte('completed_at', weekStart)
                .lte('completed_at', weekEnd);
    
              if (completedError) throw completedError;
    
              const formattedCompletedExercises = completedData?.flatMap(log =>
                log.workout?.workout_exercises?.map(ex => ({
                  exercise_id: ex.exercise_id,
                  completed_at: log.completed_at,
                })) || []
              ) || [];
    
              setCompletedExercises(formattedCompletedExercises);
            }
          } catch (error) {
            console.error('Error fetching weekly exercises:', error);
          } finally {
            setLoading(false);
          }
        }
    
        fetchExercises();
      }, [user, currentWeekStart]);
    
      useEffect(() => {
        if (initialCompletedExercises) {
          setCompletedExercises(initialCompletedExercises);
        }
      }, [initialCompletedExercises]);
    
      const handlePrevWeek = () => {
        setCurrentWeekStart(addWeeks(currentWeekStart, -1));
      };
    
      const handleNextWeek = () => {
        setCurrentWeekStart(addWeeks(currentWeekStart, 1));
      };
    
      const isExerciseCompleted = (exerciseId: string) => {
        return completedExercises.some(
          (completed) => completed.exercise_id === exerciseId &&
            isSameDay(new Date(completed.completed_at), currentWeekStart)
        );
      };
    
      if (loading) return <LoadingSpinner />;
    
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Weekly Exercises</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevWeek}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Previous week"
              >
                &lt;
              </button>
              <span className="text-sm text-gray-600">
                {format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM d')}
              </span>
              <button
                onClick={handleNextWeek}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Next week"
              >
                &gt;
              </button>
            </div>
          </div>
    
          <ul className="space-y-2">
            {exercises.map((exercise) => (
              <li key={exercise.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-900">{exercise.name}</span>
                {isExerciseCompleted(exercise.id) ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    }
