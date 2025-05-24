
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Brain, Clock } from 'lucide-react';
import { GameMode, PieceColor, Move } from '@/types/chess';

interface GameInfoProps {
  gameMode: GameMode;
  currentPlayer: PieceColor;
  gameHistory: Move[];
  isThinking: boolean;
}

const GameInfo = ({ gameMode, currentPlayer, gameHistory, isThinking }: GameInfoProps) => {
  return (
    <div className="space-y-6">
      {/* Game Mode */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-4">
        <h3 className="font-semibold text-white mb-3">Game Mode</h3>
        <Badge variant="secondary" className="bg-blue-600 text-white">
          {gameMode === 'human-vs-ai' ? (
            <><User className="w-3 h-3 mr-1" /> Human vs AI</>
          ) : (
            <><Bot className="w-3 h-3 mr-1" /> AI vs AI</>
          )}
        </Badge>
      </Card>

      {/* Current Status */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-4">
        <h3 className="font-semibold text-white mb-3">Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Turn:</span>
            <span className={`font-medium ${currentPlayer === 'white' ? 'text-slate-100' : 'text-slate-400'}`}>
              {currentPlayer === 'white' ? 'White' : 'Black'}
            </span>
          </div>
          {isThinking && (
            <div className="flex items-center text-amber-400">
              <Brain className="w-4 h-4 mr-2 animate-pulse" />
              AI thinking...
            </div>
          )}
        </div>
      </Card>

      {/* Game Statistics */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-4">
        <h3 className="font-semibold text-white mb-3">Statistics</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-300">Moves:</span>
            <span className="text-white">{gameHistory.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Captures:</span>
            <span className="text-white">{gameHistory.filter(move => move.captured).length}</span>
          </div>
        </div>
      </Card>

      {/* Move History */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-4">
        <h3 className="font-semibold text-white mb-3">Move History</h3>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {gameHistory.length === 0 ? (
            <p className="text-slate-400 text-sm">No moves yet</p>
          ) : (
            gameHistory.slice(-8).map((move, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  {Math.floor((gameHistory.length - gameHistory.slice(-8).length + index) / 2) + 1}.
                  {(gameHistory.length - gameHistory.slice(-8).length + index) % 2 === 0 ? '' : '..'}
                </span>
                <span className="text-white font-mono">{move.notation}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* AI Info */}
      {gameMode.includes('ai') && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-4">
          <h3 className="font-semibold text-white mb-3">AI Opponent</h3>
          <div className="flex items-center">
            <Bot className="w-4 h-4 mr-2 text-blue-400" />
            <span className="text-slate-300">GPT-4o</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Advanced AI with strategic thinking
          </p>
        </Card>
      )}
    </div>
  );
};

export default GameInfo;
