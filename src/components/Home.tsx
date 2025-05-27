
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Play, User, LogOut, Trophy, Clock } from 'lucide-react';

interface HomeProps {
  onStartGame: () => void;
  onShowProfile: () => void;
}

const Home = ({ onStartGame, onShowProfile }: HomeProps) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Crown className="w-8 h-8 text-amber-400 mr-3" />
            <h1 className="text-2xl font-bold text-white">AI Chess Arena</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-300">Welcome, {user?.email?.split('@')[0]}</span>
            <Button
              onClick={onShowProfile}
              variant="ghost"
              className="text-slate-300 hover:bg-slate-700"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="text-slate-300 hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Challenge the World's Best AI Models
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Test your chess skills against advanced AI opponents or watch epic AI battles unfold.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6 hover:bg-slate-800/70 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Play Chess</h3>
              <p className="text-slate-300 mb-4">
                Challenge AI opponents in strategic battles
              </p>
              <Button 
                onClick={onStartGame}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                Start Game
              </Button>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6 hover:bg-slate-800/70 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Your Profile</h3>
              <p className="text-slate-300 mb-4">
                View stats and manage your account
              </p>
              <Button 
                onClick={onShowProfile}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                View Profile
              </Button>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6 hover:bg-slate-800/70 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
              <p className="text-slate-300 mb-4">
                Tournaments and leaderboards
              </p>
              <Button 
                variant="outline"
                disabled
                className="w-full border-slate-600 text-slate-500"
              >
                Soon
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-slate-400" />
            Recent Activity
          </h3>
          <div className="text-center py-8">
            <p className="text-slate-400">No games played yet. Start your first game!</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Home;
