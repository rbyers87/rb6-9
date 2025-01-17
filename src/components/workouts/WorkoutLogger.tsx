import React, { useState, useEffect } from 'react';
    import { supabase } from '../../lib/supabase';
    import { useAuth } from '../../contexts/AuthContext';
    import { ExercisePercentages } from './ExercisePercentages';
    import type { Workout, WorkoutExercise } from '../../types/workout';
    import { format, startOfWeek, endOfWeek } from 'date-fns';
    import { Trash2 } from 'lucide-react';
    
    interface WorkoutLoggerProps {
      workout: Workout;
      onClose: (completedExercises?: any[]) => void;
      previousLogs?: any[];
    }
    
    interface ExerciseLog {
      exercise_id: string;
      sets: Array<{
        weight: number;
        reps: number;
        distance?: number;
        time?: number;
        calories?: number;
      }>;
    }
    
    export function WorkoutLogger({ workout, onClose, previousLogs }: WorkoutLoggerProps) {
      const { user } = useAuth();
      const [logs, setLogs] = useState<ExerciseLog[]>([]);
      const [notes, setNotes] = useState('');
      const [saving, setSaving] = useState(false);
    
      useEffect(() => {
        if (previousLogs && previousLogs.length > 0) {
          const lastLog = previousLogs[0];
          setNotes(lastLog.notes || '');
    
          async function fetchExerciseScores() {
            try {
              const { data, error } = await supabase
                .from('exercise_scores')
                .select('*')
                .eq('workout_log_id', lastLog.id);
    
              if (error) throw error;
    
              const initialLogs = workout.workout_exercises?.map((exercise) => {
                const exerciseScores = data?.filter(score => score.exercise_id === exercise.exercise_id);
                const sets = exerciseScores?.map(score => ({
                  weight: score.weight || 0,
                  reps: score.reps,
                  distance: score.distance,
                  time: score.time,
                  calories: score.calories,
                })) || Array(exercise.sets).fill({
                  weight: exercise.weight || 0,
                  reps: exercise.reps,
                  distance: exercise.distance,
                  time: exercise.time,
                  calories: exercise.calories,
                });
    
                return {
                  exercise_id: exercise.exercise_id,
                  sets: sets,
                };
              }) || [];
    
              setLogs(initialLogs);
            } catch (error) {
              console.error('Error fetching previous exercise scores:', error);
            }
          }
    
          fetchExerciseScores();
        } else {
          const initialLogs = workout.workout_exercises?.map((exercise) => ({
            exercise_id: exercise.exercise_id,
            sets: Array(exercise.sets).fill({
              weight: exercise.weight || 0,
              reps: exercise.reps,
              distance: exercise.distance,
              time: exercise.time,
              calories: exercise.calories,
            }),
          })) || [];
          setLogs(initialLogs);
        }
      }, [previousLogs, workout]);
    
      const handleSetChange = (
        exerciseIndex: number,
        setIndex: number,
        field: 'weight' | 'reps' | 'distance' | 'time' | 'calories',
        value: number
      ) => {
        setLogs((prevLogs) => {
          const newLogs = [...prevLogs];
          newLogs[exerciseIndex].sets[setIndex] = {
            ...newLogs[exerciseIndex].sets[setIndex],
            [field]: value,
          };
          return newLogs;
        });
      };
    
      const handleAddSet = (exerciseIndex: number) => {
        setLogs((prevLogs) => {
          const newLogs = [...prevLogs];
          const exercise = workout.workout_exercises?.[exerciseIndex];
          if (exercise) {
            newLogs[exerciseIndex] = {
              ...newLogs[exerciseIndex],
              sets: [...newLogs[exerciseIndex].sets, {
                weight: exercise.weight || 0,
                reps: exercise.reps,
                distance: exercise.distance,
                time: exercise.time,
                calories: exercise.calories,
              }]
            };
          }
          return newLogs;
        });
      };
    
      const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
        setLogs((prevLogs) => {
          const newLogs = [...prevLogs];
          newLogs[exerciseIndex].sets = newLogs[exerciseIndex].sets.filter((_, i) => i !== setIndex);
          return newLogs;
        });
      };
    
      const calculateScore = (exercise: WorkoutExercise, log: ExerciseLog, workoutType: string) => {
        // Calculate score based on exercise type
        if (exercise.exercise.name === 'Run') {
          // Score for Run is based on total distance
          return log.sets.reduce((total, set) => total + (set.distance || 0), 0);
        } else if (exercise.exercise.name === 'Assault Bike') {
          // Score for Assault Bike is based on total calories
          return log.sets.reduce((total, set) => total + (set.calories || 0), 0);
        } else if (workoutType === 'weight training') {
          // Score for weight training workouts is based on the heaviest weight used
          let maxWeight = 0;
          log.sets.forEach(set => {
            if (set.weight > maxWeight) {
              maxWeight = set.weight;
            }
          });
          return maxWeight;
        } else {
          // Score for other exercises is based on the heaviest weight used
          let maxWeight = 0;
          log.sets.forEach(set => {
            if (set.weight > maxWeight) {
              maxWeight = set.weight;
            }
          });
          return maxWeight;
        }
      };
    
      const calculateTotal = (exercise: WorkoutExercise, log: ExerciseLog) => {
        if (exercise.exercise.name === 'Run') {
          return log.sets.reduce((total, set) => {
            return total + (set.distance || 0);
          }, 0);
        } else if (exercise.exercise.name === 'Assault Bike') {
          return log.sets.reduce((total, set) => {
            return total + (set.calories || 0);
          }, 0);
        } else {
          return log.sets.reduce(
            (total, set) => total + set.weight * set.reps,
            0
          );
        }
      };
    
      const handleSave = async () => {
        setSaving(true);
        try {
          // Save workout progress (without completing)
          alert('Workout progress saved!');
        } catch (error) {
          console.error('Error saving workout progress:', error);
          alert(`Failed to save workout progress: ${error.message || 'Unknown error'}`);
        } finally {
          setSaving(false);
        }
      };
    
const handleSubmit = async () => {
  if (!user) {
    alert('User is not logged in.');
    return;
  }

  try {
    // First create the workout log
    const { data: workoutLog, error: workoutError } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        workout_id: workout.id,
        notes,
        completed_at: new Date().toISOString(), // Add this line
        score: logs.reduce((total, log, index) => {
          const exercise = workout.workout_exercises?.[index];
          return total + (exercise ? calculateScore(exercise, log, workout.type) : 0);
        }, 0),
        total: logs.reduce((total, log, index) => {
          const exercise = workout.workout_exercises?.[index];
          return total + (exercise ? calculateTotal(exercise, log) : 0);
        }, 0),
      })
      .select()
      .single();

    if (workoutError) throw workoutError;

    // Save exercise scores
    const exerciseScores = logs.flatMap((log, index) => {
      const exercise = workout.workout_exercises?.[index];
      if (!exercise) return [];

      return log.sets.map((set) => ({
        user_id: user.id,
        workout_log_id: workoutLog.id,
        exercise_id: log.exercise_id,
        weight: set.weight,
        reps: set.reps,
        distance: set.distance,
        time: set.time,
        calories: set.calories,
      }));
    });

    const { error: scoresError } = await supabase
      .from('exercise_scores')
      .insert(exerciseScores);

    if (scoresError) throw scoresError;

    // Get completed exercises for the week in the format WeeklyExercises expects
    if (user) {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const { data: completedData, error: completedError } = await supabase
        .from('workout_logs')
        .select(`
          completed_at,
          workout:workouts!inner (
            workout_exercises!inner (
              exercise_id
            )
          )
        `)
        .eq('user_id', user.id)
        .gte('completed_at', weekStart)
        .lte('completed_at', weekEnd);

      if (completedError) throw completedError;

      const formattedCompletedExercises = completedData?.flatMap(log =>
        log.workout.workout_exercises.map(ex => ({
          exercise_id: ex.exercise_id,
          completed_at: log.completed_at,
        }))
      ) || [];

      onClose(formattedCompletedExercises);
    } else {
      onClose();
    }

    alert('Workout logged successfully!');
  } catch (error) {
    console.error('Error logging workout:', error);
    alert(`Failed to log workout: ${error.message || 'Unknown error'}`);
  }
};
    
      const formatTime = (minutes: number | undefined): string => {
        if (minutes === undefined) return '00:00';
        const totalSeconds = Math.round(minutes * 60);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      };
    
      return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Log Workout: {workout.name}
            </h2>
    
            <div className="space-y-6">
              {workout.workout_exercises?.map((exercise, exerciseIndex) => (
                <div key={exercise.id} className="border rounded-md p-4">
                  <h3 className="font-medium text-lg mb-3">
                    {exercise.exercise.name}
                  </h3>
    
                  <ExercisePercentages 
                    exerciseId={exercise.exercise_id}
                    exerciseName={exercise.exercise.name}
                  />
    
                  <div className="space-y-3 mt-4">
                    {Array.from({ length: logs[exerciseIndex]?.sets?.length || 0 }).map((_, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-sm text-gray-500">
                          Set {setIndex + 1}
                        </div>
                        {exercise.exercise.name === 'Run' ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Distance (m)</label>
                              <input
                                type="number"
                                value={logs[exerciseIndex].sets[setIndex].distance}
                                onChange={(e) =>
                                  handleSetChange(
                                    exerciseIndex,
                                    setIndex,
                                    'distance',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full rounded-md border-gray-300"
                                placeholder="Distance (m)"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Time (min)</label>
                              <input
                                type="number"
                                value={logs[exerciseIndex].sets[setIndex].time}
                                onChange={(e) =>
                                  handleSetChange(
                                    exerciseIndex,
                                    setIndex,
                                    'time',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full rounded-md border-gray-300"
                                placeholder="Time (min)"
                              />
                            </div>
                          </>
                        ) : exercise.exercise.name === 'Assault Bike' ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Calories</label>
                              <input
                                type="number"
                                value={logs[exerciseIndex].sets[setIndex].calories}
                                onChange={(e) =>
                                  handleSetChange(
                                    exerciseIndex,
                                    setIndex,
                                    'calories',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full rounded-md border-gray-300"
                                placeholder="Calories"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Time (min)</label>
                              <input
                                type="number"
                                value={logs[exerciseIndex].sets[setIndex].time}
                                onChange={(e) =>
                                  handleSetChange(
                                    exerciseIndex,
                                    setIndex,
                                    'time',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full rounded-md border-gray-300"
                                placeholder="Time (min)"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
    <input
      type="number"
      value={logs[exerciseIndex].sets[setIndex].weight || ''} // Default to empty string if weight is null or undefined
      onChange={(e) =>
        handleSetChange(
          exerciseIndex,
          setIndex,
          'weight',
          e.target.value ? Number(e.target.value) : null // Convert to number, or null if empty
        )
      }
      className="w-full rounded-md border-gray-300"
      placeholder="Weight"
    />
    
                            </div>
                            <div>
                              <input
                                type="number"
                                value={logs[exerciseIndex].sets[setIndex].reps}
                                onChange={(e) =>
                                  handleSetChange(
                                    exerciseIndex,
                                    setIndex,
                                    'reps',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full rounded-md border-gray-300"
                                placeholder="Reps"
                              />
                            </div>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteSet(exerciseIndex, setIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddSet(exerciseIndex)}
                      className="mt-2 text-indigo-600 font-medium hover:underline"
                    >
                      Add Set
                    </button>
                  </div>
                </div>
              ))}
    
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-md border-gray-300"
                  rows={3}
                />
              </div>
    
              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  Complete Workout
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
