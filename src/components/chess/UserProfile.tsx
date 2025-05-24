
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Target, Clock, TrendingUp, Star, Award } from 'lucide-react';

interface UserProfileProps {
  onBack: () => void;
}

const UserProfile = ({ onBack }: UserProfileProps) => {
  const gameHistory = [
    { id: 1, opponent: 'GPT-4o', result: 'win', moves: 34, duration: '12:45', date: '2024-01-15' },
    { id: 2, opponent: 'GPT-4o', result: 'loss', moves: 28, duration: '08:32', date: '2024-01-14' },
    { id: 3, opponent: 'GPT-4o', result: 'win', moves: 42, duration: '18:21', date: '2024-01-13' },
    { id: 4, opponent: 'GPT-4o', result: 'draw', moves: 67, duration: '25:14', date: '2024-01-12' },
    { id: 5, opponent: 'GPT-4o', result: 'win', moves: 31, duration: '11:03', date: '2024-01-11' },
  ];

  const achievements = [
    { name: 'First Victory', description: 'Win your first game', unlocked: true },
    { name: 'Speed Demon', description: 'Win a game in under 10 minutes', unlocked: true },
    { name: 'Endurance Master', description: 'Play a game over 50 moves', unlocked: true },
    { name: 'AI Conqueror', description: 'Defeat GPT-4o 5 times', unlocked: false },
    { name: 'Perfect Score', description: 'Reach 1500+ rating', unlocked: false },
    { name: 'Chess Master', description: 'Win 100 games', unlocked: false },
  ];

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
                    P
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-white mb-2">Player</h2>
                <Badge variant="secondary" className="bg-amber-600 text-white">
                  Intermediate
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
                  <span className="text-2xl font-bold text-amber-400">1250</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-amber-400" />
                    <span className="text-slate-300">High Score</span>
                  </div>
                  <span className="text-xl font-bold text-white">1420</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-400" />
                    <span className="text-slate-300">Win Rate</span>
                  </div>
                  <span className="text-xl font-bold text-green-400">67%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-400" />
                    <span className="text-slate-300">Avg. Game Time</span>
                  </div>
                  <span className="text-xl font-bold text-blue-400">14:32</span>
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
                    <span className="text-white">42/50</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '84%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Wins</span>
                    <span className="text-white">28/40</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '70%' }}></div>
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
                        {game.result.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="text-white font-medium">vs {game.opponent}</div>
                        <div className="text-slate-400 text-sm">{game.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">{game.moves} moves</div>
                      <div className="text-slate-400 text-sm">{game.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
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
