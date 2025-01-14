import React, { useEffect, useState } from 'react';
    import { supabase } from '../../lib/supabase';
    import { useAuth } from '../../contexts/AuthContext';
    import type { ExerciseScore } from '../../types/workout';

    export function PersonalRecords() {
      const { user } = useAuth();
      const [personalRecords, setPersonalRecords] = useState<ExerciseScore[]>([]);

      useEffect(() => {
        async function fetchPersonalRecords() {
          if (!user) return;

          const { data, error } = await supabase
            .from('exercise_scores')
            .select(`
              *,
              exercise:exercises (*)
            `)
            .eq('user_id', user.id)
            .order('weight', { ascending: false })
            .limit(5);

          if (error) {
            console.error('Error fetching personal records:', error);
            return;
          }

          setPersonalRecords(data);
        }

        fetchPersonalRecords();
      }, [user]);


      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal Records</h2>
          
          <div className="space-y-4">
            {personalRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{record.exercise.name}</p>
                  <p className="text-sm text-gray-600">
                    {record.reps} reps @ {record.weight}lbs
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
