
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';
import { Move } from '@/types/chess';

interface MoveHistoryProps {
  gameHistory: Move[];
}

const MoveHistory = ({ gameHistory }: MoveHistoryProps) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <div className="p-4">
        <div className="flex items-center mb-4">
          <History className="w-5 h-5 mr-2 text-green-400" />
          <h3 className="font-semibold text-white">Move History</h3>
        </div>

        <ScrollArea className="h-64">
          <div className="space-y-2">
            {gameHistory.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">
                No moves yet
              </p>
            ) : (
              gameHistory.map((move, index) => {
                const moveNumber = Math.floor(index / 2) + 1;
                const isWhiteMove = index % 2 === 0;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded ${
                      index % 2 === 0 ? 'bg-slate-700/30' : 'bg-slate-600/30'
                    }`}
                  >
                    <span className="text-slate-300 text-sm">
                      {isWhiteMove ? `${moveNumber}.` : `${moveNumber}...`}
                    </span>
                    <span className="text-white font-mono text-sm">{move.notation}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(move.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};

export default MoveHistory;
