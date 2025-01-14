import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Star } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface TopPerformer {
  id: string;
  profile_name: string;
  first_name: string;
  last_name: string;
  workout_count: number;
}

export function TopPerformers() {
  const [performers, setPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopPerformers() {
      try {
        const { data, error } = await supabase
          .from('workout_logs')
          .select(`
            user_id,
            profiles (
              id,
              first_name,
              last_name,
              profile_name
            )
          `)
          .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .then(({ data }) => {
            if (!data) return [];

            const userCounts = data.reduce((acc: Record<string, TopPerformer>, log) => {
              const profile = log.profiles;
              if (!profile) return acc;

              if (!acc[profile.id]) {
                acc[profile.id] = {
                  id: profile.id,
                  profile_name: profile.profile_name || '',
                  first_name: profile.first_name || '',
                  last_name: profile.last_name || '',
                  workout_count: 0
                };
              }

              acc[profile.id].workout_count++;
              return acc;
            }, {});

            return Object.values(userCounts)
              .sort((a, b) => b.workout_count - a.workout_count)
              .slice(0, 5);
          });

        setPerformers(data || []);
      } catch (error) {
        console.error('Error fetching top performers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTopPerformers();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performers</h2>
      <p className="text-sm text-gray-500 mb-6">Last 7 days</p>

      <div className="space-y-4">
        {performers.map((performer) => (
          <div
            key={performer.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium text-gray-900">
                  {performer.profile_name || `${performer.first_name} ${performer.last_name}`}
                </p>
                <p className="text-sm text-gray-500">
                  {performer.workout_count} workouts
                </p>
              </div>
            </div>
          </div>
        ))}

        {performers.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No top performers this week
          </p>
        )}
      </div>
    </div>
  );
}
