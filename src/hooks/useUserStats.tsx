
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserStats {
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  current_score: number;
  high_score: number;
}

interface UserProfile {
  username: string;
  email: string;
}

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setStats(null);
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error fetching stats:', statsError);
      } else {
        setStats(statsData || {
          games_played: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          current_score: 1250,
          high_score: 1250,
        });
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData || {
          username: user.email?.split('@')[0] || 'Player',
          email: user.email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    if (user) {
      fetchUserData();
    }
  };

  return {
    stats,
    profile,
    loading,
    refreshStats,
  };
};
