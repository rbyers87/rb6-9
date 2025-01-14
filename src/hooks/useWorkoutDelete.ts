import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useWorkoutDelete() {
  const [deleting, setDeleting] = useState(false);

  const deleteWorkout = async (workoutId: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error;
    } finally {
      setDeleting(false);
    }
  };

  return { deleteWorkout, deleting };
}
