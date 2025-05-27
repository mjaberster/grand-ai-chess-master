
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, User, Crown, Zap } from 'lucide-react';
import ChessBoard from '@/components/chess/ChessBoard';
import AIvAIChessBoard from '@/components/chess/AIvAIChessBoard';
import GameSetup from '@/components/chess/GameSetup';
import UserProfile from '@/components/chess/UserProfile';
import { GameMode, GameState } from '@/types/chess';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    setGameState('playing');
  };

  const handleEndGame = () => {
    setGameState('menu');
    setGameMode(null);
  };

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
        <GameSetup 
          onStartGame={handleStartGame}
          onBack={() => setGameState('menu')}
        />
      </div>
    );
  }

  if (gameState === 'playing' && gameMode) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
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
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-bold text-white">Player</h3>
                <div className="flex items-center space-x-4 text-slate-300">
                  <div className="flex items-center">
                    <Trophy className="w-4 h-4 mr-1 text-amber-400" />
                    <span>Score: 1250</span>
                  </div>
                  <div className="flex items-center">
                    <Crown className="w-4 h-4 mr-1 text-amber-400" />
                    <span>Best: 1420</span>
                  </div>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowProfile(true)}
              variant="outline" 
              className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
            >
              View Profile
            </Button>
          </div>
        </Card>

        {/* Game Mode Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Human vs AI */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 group cursor-pointer">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <User className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Human vs AI</h3>
              <p className="text-slate-300 mb-6">
                Challenge our advanced AI powered by GPT-4o. Test your skills against artificial intelligence!
              </p>
              <Button 
                onClick={() => setGameState('setup')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3"
              >
                Start Challenge
              </Button>
            </div>
          </Card>

          {/* AI vs AI */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 group cursor-pointer">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">AI vs AI</h3>
              <p className="text-slate-300 mb-6">
                Watch two AI models battle it out in an epic chess showdown. Pure strategy in action!
              </p>
              <Button 
                onClick={() => handleStartGame('ai-vs-ai')}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3"
              >
                Watch Battle
              </Button>
            </div>
          </Card>
        </div>

        {/* Stats Footer */}
        <div className="mt-12 text-center">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-amber-400">42</div>
              <div className="text-slate-400">Games Played</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">28</div>
              <div className="text-slate-400">Wins</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-400">14</div>
              <div className="text-slate-400">Losses</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
