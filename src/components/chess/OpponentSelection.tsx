
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bot, User, Zap, Brain, Sparkles } from 'lucide-react';
import { GameMode, PieceColor } from '@/types/chess';

type OpponentType = 'human' | 'gpt-4o' | 'claude' | 'gemini';

interface OpponentSelectionProps {
  onStartGame: (mode: GameMode, opponent1: OpponentType, opponent2: OpponentType, playerColor?: PieceColor) => void;
  onBack: () => void;
}

const OpponentSelection = ({ onStartGame, onBack }: OpponentSelectionProps) => {
  const [opponent1, setOpponent1] = useState<OpponentType>('human');
  const [opponent2, setOpponent2] = useState<OpponentType>('gpt-4o');
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');

  const opponents = [
    { 
      id: 'human' as OpponentType, 
      name: 'Human', 
      icon: User, 
      description: 'Play against another human player',
      color: 'from-green-500 to-green-600'
    },
    { 
      id: 'gpt-4o' as OpponentType, 
      name: 'GPT-4o', 
      icon: Brain, 
      description: 'Advanced AI with Assistants API integration',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'claude' as OpponentType, 
      name: 'Claude', 
      icon: Zap, 
      description: 'Thoughtful AI chess mentor with persistent memory',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      id: 'gemini' as OpponentType, 
      name: 'Gemini', 
      icon: Sparkles, 
      description: 'Creative AI explorer with innovative strategies',
      color: 'from-orange-500 to-orange-600'
    },
  ];

  const handleStartGame = () => {
    const humanCount = [opponent1, opponent2].filter(opp => opp === 'human').length;
    const gameMode: GameMode = humanCount > 0 ? 'human-vs-ai' : 'ai-vs-ai';
    onStartGame(gameMode, opponent1, opponent2, gameMode === 'human-vs-ai' ? playerColor : undefined);
  };

  const humanInvolved = opponent1 === 'human' || opponent2 === 'human';
  const aiOpponents = [opponent1, opponent2].filter(opp => opp !== 'human');
  const useAssistantsAPI = aiOpponents.some(opp => ['gpt-4o', 'claude', 'gemini'].includes(opp));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm w-full max-w-2xl">
        <div className="p-8">
          <div className="flex items-center mb-8">
            <Button 
              onClick={onBack}
              variant="ghost" 
              className="mr-4 text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-3xl font-bold text-white">Select Opponents</h2>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <Label className="text-lg font-semibold text-white">First Opponent</Label>
              <div className="grid grid-cols-4 gap-3">
                {opponents.map((opp) => (
                  <Button
                    key={`opp1-${opp.id}`}
                    variant={opponent1 === opp.id ? 'default' : 'outline'}
                    className={`h-16 flex-col space-y-1 ${
                      opponent1 === opp.id
                        ? `bg-gradient-to-r ${opp.color} text-white`
                        : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                    onClick={() => setOpponent1(opp.id)}
                  >
                    <opp.icon className="w-5 h-5" />
                    <span className="text-xs">{opp.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold text-white">Second Opponent</Label>
              <div className="grid grid-cols-4 gap-3">
                {opponents.map((opp) => (
                  <Button
                    key={`opp2-${opp.id}`}
                    variant={opponent2 === opp.id ? 'default' : 'outline'}
                    className={`h-16 flex-col space-y-1 ${
                      opponent2 === opp.id
                        ? `bg-gradient-to-r ${opp.color} text-white`
                        : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                    onClick={() => setOpponent2(opp.id)}
                  >
                    <opp.icon className="w-5 h-5" />
                    <span className="text-xs">{opp.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {humanInvolved && (
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
            )}

            <div className="bg-slate-700/50 rounded-lg p-6 space-y-2">
              <h3 className="font-semibold text-white">Game Info</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• {humanInvolved ? 'Human vs AI' : 'AI vs AI'} match selected</li>
                <li>• Click to select pieces, click again to move</li>
                <li>• {humanInvolved ? 'AI will make moves automatically' : 'Watch AI models battle each other'}</li>
                <li>• Score is calculated based on game outcome</li>
                {useAssistantsAPI && (
                  <li className="text-blue-400">• Enhanced with OpenAI Assistants API for persistent conversations</li>
                )}
              </ul>
            </div>

            <Button 
              onClick={handleStartGame}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
            >
              Start Game {useAssistantsAPI && '(Enhanced AI)'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OpponentSelection;
