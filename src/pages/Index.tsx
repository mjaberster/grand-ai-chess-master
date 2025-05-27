
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, User, Crown, LogIn, LogOut, Play } from 'lucide-react';
import ChessBoard from '@/components/chess/ChessBoard';
import AIvAIChessBoard from '@/components/chess/AIvAIChessBoard';
import OpponentSelection from '@/components/chess/OpponentSelection';
import UserProfile from '@/components/chess/UserProfile';
import AuthPage from '@/components/auth/AuthPage';
import { GameMode, GameState } from '@/types/chess';
import { useAuth } from '@/hooks/useAuth';
import { useUserStats } from '@/hooks/useUserStats';

type OpponentType = 'human' | 'gpt-4o' | 'claude' | 'gemini';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedOpponents, setSelectedOpponents] = useState<{
    opponent1: OpponentType;
    opponent2: OpponentType;
    playerColor?: 'white' | 'black';
  } | null>(null);

  const { user, signOut, loading: authLoading } = useAuth();
  const { stats, profile, loading: statsLoading } = useUserStats();

  const handleStartGame = (mode: GameMode, opponent1: OpponentType, opponent2: OpponentType, playerColor?: 'white' | 'black') => {
    setGameMode(mode);
    setSelectedOpponents({ opponent1, opponent2, playerColor });
    setGameState('playing');
  };

  const handleEndGame = () => {
    setGameState('menu');
    setGameMode(null);
    setSelectedOpponents(null);
  };

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (showAuth) {
    return <AuthPage onBack={() => setShowAuth(false)} />;
  }

  if (showProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <UserProfile onBack={() => setShowProfile(false)} />
      </div>
    );
  }

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <OpponentSelection 
          onStartGame={handleStartGame}
          onBack={() => setGameState('menu')}
        />
      </div>
    );
  }

  if (gameState === 'playing' && gameMode && selectedOpponents) {
    if (gameMode === 'ai-vs-ai') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <AIvAIChessBoard onEndGame={handleEndGame} />
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <ChessBoard 
          gameMode={gameMode}
          onEndGame={handleEndGame}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Crown className="w-12 h-12 text-amber-400 mr-4" />
              <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                Chess Master
              </h1>
            </div>
            <p className="text-xl text-slate-300">
              Challenge AI opponents or watch them battle each other
            </p>
          </div>

          {/* User Profile Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-8 hover:bg-slate-800/70 transition-all duration-300">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16 border-2 border-amber-400">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 font-bold text-xl">
                    {user ? (profile?.username?.[0]?.toUpperCase() || 'U') : <User className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {user ? profile?.username || 'Player' : 'Anonymous Player'}
                  </h3>
                  <div className="flex items-center space-x-4 text-slate-300">
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 mr-1 text-amber-400" />
                      <span>Score: {user ? stats?.current_score || 1250 : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <Crown className="w-4 h-4 mr-1 text-amber-400" />
                      <span>Best: {user ? stats?.high_score || 1250 : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                {user ? (
                  <>
                    <Button 
                      onClick={() => setShowProfile(true)}
                      variant="outline" 
                      className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
                    >
                      View Profile
                    </Button>
                    <Button 
                      onClick={signOut}
                      variant="outline" 
                      className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setShowAuth(true)}
                    variant="outline" 
                    className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Start Game Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 group cursor-pointer">
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                <Play className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Start New Game</h3>
              <p className="text-slate-300 mb-8 text-lg">
                Choose your opponents and begin an epic chess battle!
              </p>
              <Button 
                onClick={() => setGameState('setup')}
                className="w-full max-w-md h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-lg"
              >
                Choose Opponents
              </Button>
            </div>
          </Card>

          {/* Stats Footer */}
          <div className="mt-12 text-center">
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-amber-400">
                  {user ? stats?.games_played || 0 : 'N/A'}
                </div>
                <div className="text-slate-400">Games Played</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">
                  {user ? stats?.wins || 0 : 'N/A'}
                </div>
                <div className="text-slate-400">Wins</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-400">
                  {user ? stats?.losses || 0 : 'N/A'}
                </div>
                <div className="text-slate-400">Losses</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700 p-6 mt-8">
        <div className="max-w-4xl mx-auto text-center text-slate-400">
          <p className="mb-2">
            Powered by <span className="text-amber-400 font-semibold">Sibawayh.ai</span> - All rights reserved
          </p>
          <p className="text-sm">
            Contact: <a href="mailto:sibawayh@sumerialtd.co.uk" className="text-blue-400 hover:text-blue-300">sibawayh@sumerialtd.co.uk</a> | 
            <a href="tel:+447441395587" className="text-blue-400 hover:text-blue-300 ml-2">+44 7441 395587</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
