
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Target, Clock, TrendingUp, Star, Award, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserStats } from '@/hooks/useUserStats';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileProps {
  onBack: () => void;
}

interface GameHistory {
  id: string;
  opponent1_type: string;
  opponent2_type: string;
  result: string;
  moves_count: number;
  duration_seconds: number;
  created_at: string;
}

const UserProfile = ({ onBack }: UserProfileProps) => {
  const { user } = useAuth();
  const { stats, profile, loading } = useUserStats();
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGameHistory();
    }
  }, [user]);

  const fetchGameHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, opponent1_type, opponent2_type, result, moves_count, duration_seconds, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching game history:', error);
      } else {
        setGameHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching game history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getOpponentName = (game: GameHistory) => {
    if (game.opponent1_type === 'human' && game.opponent2_type !== 'human') {
      return game.opponent2_type.toUpperCase();
    } else if (game.opponent2_type === 'human' && game.opponent1_type !== 'human') {
      return game.opponent1_type.toUpperCase();
    } else if (game.opponent1_type !== 'human' && game.opponent2_type !== 'human') {
      return `${game.opponent1_type.toUpperCase()} vs ${game.opponent2_type.toUpperCase()}`;
    }
    return 'Human';
  };

  const achievements = [
    { name: 'First Victory', description: 'Win your first game', unlocked: (stats?.wins || 0) > 0 },
    { name: 'Speed Demon', description: 'Win a game in under 10 minutes', unlocked: false },
    { name: 'Endurance Master', description: 'Play a game over 50 moves', unlocked: false },
    { name: 'AI Conqueror', description: 'Defeat AI 5 times', unlocked: (stats?.wins || 0) >= 5 },
    { name: 'Perfect Score', description: 'Reach 1500+ rating', unlocked: (stats?.current_score || 0) >= 1500 },
    { name: 'Chess Master', description: 'Win 100 games', unlocked: (stats?.wins || 0) >= 100 },
  ];

  if (loading || historyLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-white text-xl">Please log in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            onClick={onBack}
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-700 mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-white">Player Profile</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
              <div className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-amber-400">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 font-bold text-2xl">
                    {profile?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-white mb-2">{profile?.username || 'Player'}</h2>
                <Badge variant="secondary" className="bg-amber-600 text-white">
                  {(stats?.current_score || 0) >= 1500 ? 'Advanced' : (stats?.current_score || 0) >= 1200 ? 'Intermediate' : 'Beginner'}
                </Badge>
              </div>
            </Card>

            {/* Stats */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
              <h3 className="text-xl font-bold text-white mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-amber-400" />
                    <span className="text-slate-300">Current Score</span>
                  </div>
                  <span className="text-2xl font-bold text-amber-400">{stats?.current_score || 1250}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-amber-400" />
                    <span className="text-slate-300">High Score</span>
                  </div>
                  <span className="text-xl font-bold text-white">{stats?.high_score || 1250}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-400" />
                    <span className="text-slate-300">Win Rate</span>
                  </div>
                  <span className="text-xl font-bold text-green-400">
                    {stats?.games_played ? Math.round(((stats.wins || 0) / stats.games_played) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-400" />
                    <span className="text-slate-300">Games Played</span>
                  </div>
                  <span className="text-xl font-bold text-blue-400">{stats?.games_played || 0}</span>
                </div>
              </div>
            </Card>

            {/* Progress */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
              <h3 className="text-xl font-bold text-white mb-4">Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Games Played</span>
                    <span className="text-white">{stats?.games_played || 0}/50</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(((stats?.games_played || 0) / 50) * 100, 100)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Wins</span>
                    <span className="text-white">{stats?.wins || 0}/25</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(((stats?.wins || 0) / 25) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Games */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
              <h3 className="text-xl font-bold text-white mb-4">Recent Games</h3>
              {gameHistory.length > 0 ? (
                <div className="space-y-3">
                  {gameHistory.map((game) => (
                    <div key={game.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge 
                          variant={game.result === 'win' ? 'default' : game.result === 'loss' ? 'destructive' : 'secondary'}
                          className={
                            game.result === 'win' 
                              ? 'bg-green-600 text-white' 
                              : game.result === 'loss' 
                              ? 'bg-red-600 text-white' 
                              : 'bg-gray-600 text-white'
                          }
                        >
                          {game.result?.toUpperCase() || 'IN PROGRESS'}
                        </Badge>
                        <div>
                          <div className="text-white font-medium">vs {getOpponentName(game)}</div>
                          <div className="text-slate-400 text-sm">{formatDate(game.created_at)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white">{game.moves_count || 0} moves</div>
                        <div className="text-slate-400 text-sm">{formatDuration(game.duration_seconds || 0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No games played yet. Start your first game!</p>
                </div>
              )}
            </Card>

            {/* Achievements */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
              <h3 className="text-xl font-bold text-white mb-4">Achievements</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${
                      achievement.unlocked 
                        ? 'bg-amber-600/20 border-amber-600/50' 
                        : 'bg-slate-700/30 border-slate-600'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <Award className={`w-5 h-5 mr-2 ${
                        achievement.unlocked ? 'text-amber-400' : 'text-slate-500'
                      }`} />
                      <span className={`font-medium ${
                        achievement.unlocked ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {achievement.name}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
