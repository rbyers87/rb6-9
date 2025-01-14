import React, { useEffect, useState } from 'react';
    import { supabase } from '../lib/supabase';
    import { format } from 'date-fns';
    import { DateSelector } from '../components/dashboard/DateSelector';
    import { WorkoutOfTheDay } from '../components/dashboard/WorkoutOfTheDay';
    import { LoadingSpinner } from '../components/common/LoadingSpinner';
    import { IncompleteWorkouts } from '../components/dashboard/IncompleteWorkouts';
    import type { Workout } from '../types/workout';
    import { WeeklyExercises } from '../components/weekly/WeeklyExercises';
    import { RecentWorkouts } from '../components/dashboard/RecentWorkouts';
    
    interface CompletedExercise {
      exercise_id: string;
      completed_at: string;
    }
    
    export default function Dashboard() {
      const [wodWorkout, setWodWorkout] = useState<Workout | null>(null);
      const [loading, setLoading] = useState(true);
      const [selectedDate, setSelectedDate] = useState(new Date());
      const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
      const [refreshKey, setRefreshKey] = useState(0);
    
      useEffect(() => {
        async function fetchWOD() {
          try {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            
            const { data, error } = await supabase
              .from('workouts')
              .select(`
                *,
                workout_exercises (
                  *,
                  exercise:exercises (*)
                )
              `)
              .eq('is_wod', true)
              .eq('scheduled_date', formattedDate)
              .limit(1);
    
            if (error) throw error;
            setWodWorkout(data?.[0] || null);
          } catch (error) {
            console.error('Error fetching WOD:', error);
          } finally {
            setLoading(false);
          }
        }
    
        fetchWOD();
      }, [selectedDate, refreshKey]);
    
      const handleWorkoutComplete = (completed: CompletedExercise[]) => {
        setCompletedExercises(completed);
        setRefreshKey(prevKey => prevKey + 1);
      };
    
      if (loading) return <LoadingSpinner />;
    
      return (
        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <DateSelector 
                selectedDate={selectedDate}
                onChange={setSelectedDate}
              />
              <WorkoutOfTheDay workout={wodWorkout} onWorkoutComplete={handleWorkoutComplete} />
              <IncompleteWorkouts onWorkoutComplete={handleWorkoutComplete} />
              <RecentWorkouts onWorkoutComplete={handleWorkoutComplete} />
            </div>
            <div className="space-y-4">
              <WeeklyExercises completedExercises={completedExercises} />
            </div>
          </div>
        </div>
      );
    }
