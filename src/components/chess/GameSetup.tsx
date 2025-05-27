import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Bot, User, UserCircle } from 'lucide-react';
import { GameMode, AIModel, PieceColor } from '@/types/chess';

interface GameSetupProps {
  onStartGame: (mode: GameMode) => void;
  onBack: () => void;
  onShowProfile: () => void;
}

const GameSetup = ({ onStartGame, onBack, onShowProfile }: GameSetupProps) => {
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-4o');
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm w-full max-w-2xl">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Button 
                onClick={onBack}
                variant="ghost" 
                className="mr-4 text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-3xl font-bold text-white">Game Setup</h2>
            </div>
            <Button
              onClick={onShowProfile}
              variant="ghost"
              className="text-slate-300 hover:bg-slate-700"
            >
              <UserCircle className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-8">
            {/* AI Model Selection */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-white">AI Opponent</Label>
              <Select value={selectedModel} onValueChange={(value: AIModel) => setSelectedModel(value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="gpt-4o" className="text-white hover:bg-slate-600">
                    <div className="flex items-center">
                      <Bot className="w-4 h-4 mr-2" />
                      GPT-4o (Advanced AI)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-400">
                GPT-4o provides strategic and challenging gameplay with advanced position evaluation.
              </p>
            </div>

            {/* Player Color Selection */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-white">Your Color</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={playerColor === 'white' ? 'default' : 'outline'}
                  className={`h-16 ${
                    playerColor === 'white'
                      ? 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 hover:from-slate-200 hover:to-slate-300'
                      : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => setPlayerColor('white')}
                >
                  <User className="w-6 h-6 mr-2" />
                  White (First Move)
                </Button>
                <Button
                  variant={playerColor === 'black' ? 'default' : 'outline'}
                  className={`h-16 ${
                    playerColor === 'black'
                      ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:from-slate-600 hover:to-slate-700'
                      : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => setPlayerColor('black')}
                >
                  <User className="w-6 h-6 mr-2" />
                  Black (Second Move)
                </Button>
              </div>
            </div>

            {/* Game Info */}
            <div className="bg-slate-700/50 rounded-lg p-6 space-y-2">
              <h3 className="font-semibold text-white">Game Rules</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Standard chess rules apply</li>
                <li>• Click to select pieces, click again to move</li>
                <li>• AI will make moves automatically</li>
                <li>• Score is calculated based on game outcome and difficulty</li>
              </ul>
            </div>

            {/* Start Game Button */}
            <Button 
              onClick={() => onStartGame('human-vs-ai')}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
            >
              Start Game
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GameSetup;
