
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PieceType, PieceColor } from '@/types/chess';

interface PromotionDialogProps {
  isOpen: boolean;
  color: PieceColor;
  onSelect: (pieceType: PieceType) => void;
  onClose: () => void;
}

const PromotionDialog = ({ isOpen, color, onSelect, onClose }: PromotionDialogProps) => {
  const [selectedPiece, setSelectedPiece] = useState<PieceType>('queen');

  const promotionOptions: { type: PieceType; symbol: string; name: string }[] = [
    { type: 'queen', symbol: color === 'white' ? '♕' : '♛', name: 'Queen' },
    { type: 'rook', symbol: color === 'white' ? '♖' : '♜', name: 'Rook' },
    { type: 'bishop', symbol: color === 'white' ? '♗' : '♝', name: 'Bishop' },
    { type: 'knight', symbol: color === 'white' ? '♘' : '♞', name: 'Knight' }
  ];

  const handleSelect = () => {
    onSelect(selectedPiece);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-amber-300">
            Pawn Promotion
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <p className="text-center text-slate-300 mb-6">
            Choose a piece to promote your pawn to:
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {promotionOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedPiece(option.type)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                  selectedPiece === option.type
                    ? 'border-amber-400 bg-amber-400/20'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <div className="text-4xl">{option.symbol}</div>
                <div className="text-sm font-medium">{option.name}</div>
              </button>
            ))}
          </div>
          
          <div className="flex justify-center space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSelect}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Promote to {promotionOptions.find(o => o.type === selectedPiece)?.name}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionDialog;
