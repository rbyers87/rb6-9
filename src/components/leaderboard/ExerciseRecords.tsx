import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Dumbbell } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { ExerciseScore } from '../../types/workout';

export function ExerciseRecords() {
  const [records, setRecords] = useState<ExerciseScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExerciseRecords() {
      try {
        const { data, error } = await supabase
          .from('exercise_scores')
          .select(`
            *,
            profiles (
              first_name,
              last_name,
              profile_name
            ),
            exercise:exercises (*)
          `)
          .order('weight', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecords(data || []);
      } catch (error) {
        console.error('Error fetching exercise records:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchExerciseRecords();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Exercise Records</h2>

      <div className="space-y-4">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Dumbbell className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">{record.exercise.name}</p>
                <p className="text-sm text-gray-500">
                  {record.weight}lbs × {record.reps} reps
                </p>
              </div>
            </div>
          </div>
        ))}

        {records.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No exercise records yet
          </p>
        )}
      </div>
    </div>
  );
}
