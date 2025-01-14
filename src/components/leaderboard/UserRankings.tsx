import React, { useState, useEffect } from 'react';
    import { supabase } from '../../lib/supabase';
    import { Trophy, Medal } from 'lucide-react';
    import { LoadingSpinner } from '../common/LoadingSpinner';
    import { format, startOfDay, endOfDay } from 'date-fns';

    interface UserRanking {
      id: string;
      first_name: string;
      last_name: string;
      profile_name: string;
      total_workouts: number;
      total_score: number;
      daily_score: number;
    }

    export function UserRankings() {
      const [rankings, setRankings] = useState<UserRanking[]>([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        async function fetchRankings() {
          try {
            const todayStart = startOfDay(new Date()).toISOString();
            const todayEnd = endOfDay(new Date()).toISOString();

            const { data, error } = await supabase
              .from('workout_logs')
              .select(`
                user_id,
                score,
                profiles (
                  id,
                  first_name,
                  last_name,
                  profile_name
                ),
                workout:workouts (
                  id,
                  workout_exercises (
                    exercise_id,
                    exercise:exercises (
                      name
                    )
                  )
                )
              `)
              .gte('completed_at', todayStart)
              .lte('completed_at', todayEnd)
              .then(async ({ data }) => {
                if (!data) return [];

                const wodLogs = data.filter(log => log.workout?.workout_exercises?.some(ex => ex.exercise.name !== 'Run'));
                const runLogs = data.filter(log => log.workout?.workout_exercises?.some(ex => ex.exercise.name === 'Run'));

                const userStats = wodLogs.reduce((acc: Record<string, UserRanking>, log) => {
                  const profile = log.profiles;
                  if (!profile) return acc;

                  if (!acc[profile.id]) {
                    acc[profile.id] = {
                      id: profile.id,
                      first_name: profile.first_name || '',
                      last_name: profile.last_name || '',
                      profile_name: profile.profile_name || '',
                      total_workouts: 0,
                      total_score: 0,
                      daily_score: 0,
                    };
                  }

                  acc[profile.id].total_workouts++;
                  acc[profile.id].total_score += log.score;
                  acc[profile.id].daily_score += log.score;
                  return acc;
                }, {});

                const runUserStats = runLogs.reduce((acc: Record<string, UserRanking>, log) => {
                  const profile = log.profiles;
                  if (!profile) return acc;

                  if (!acc[profile.id]) {
                    acc[profile.id] = {
                      id: profile.id,
                      first_name: profile.first_name || '',
                      last_name: profile.last_name || '',
                      profile_name: profile.profile_name || '',
                      total_workouts: 0,
                      total_score: 0,
                      daily_score: 0,
                    };
                  }

                  acc[profile.id].total_workouts++;
                  acc[profile.id].total_score += log.score;
                  acc[profile.id].daily_score += log.score;
                  return acc;
                }, {});

                const combinedStats = { ...userStats, ...runUserStats };

                return Object.values(combinedStats).sort((a, b) => b.daily_score - a.daily_score).slice(0, 10);
              });

            setRankings(data || []);
          } catch (error) {
            console.error('Error fetching rankings:', error);
          } finally {
            setLoading(false);
          }
        }

        fetchRankings();
      }, []);

      if (loading) return <LoadingSpinner />;

      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">User Rankings</h2>
          <p className="text-sm text-gray-500 mb-6">Today's Results</p>

          <div className="space-y-4">
            {rankings.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {index === 0 ? (
                      <Trophy className="h-6 w-6 text-yellow-500" />
                    ) : index === 1 ? (
                      <Medal className="h-6 w-6 text-gray-400" />
                    ) : index === 2 ? (
                      <Medal className="h-6 w-6 text-amber-600" />
                    ) : (
                      <span className="w-6 text-center font-medium text-gray-500">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.profile_name || `${user.first_name} ${user.last_name}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user.total_workouts} workouts completed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-indigo-600 font-medium">
                    {user.daily_score} points
                  </span>
                </div>
              </div>
            ))}

            {rankings.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No rankings available yet for today
              </p>
            )}
          </div>
        </div>
      );
    }
