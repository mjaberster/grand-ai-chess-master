
import { ChessPiece } from '@/types/chess';

interface ChessSquareProps {
  position: string;
  piece: ChessPiece | null;
  isLight: boolean;
  isSelected: boolean;
  onClick: () => void;
  pieceSymbol: string;
}

const ChessSquare = ({ 
  position, 
  piece, 
  isLight, 
  isSelected, 
  onClick, 
  pieceSymbol 
}: ChessSquareProps) => {
  return (
    <div
      className={`
        aspect-square flex items-center justify-center cursor-pointer text-4xl font-bold
        transition-all duration-200 hover:scale-105 relative
        ${isLight 
          ? 'bg-gradient-to-br from-amber-100 to-amber-200' 
          : 'bg-gradient-to-br from-amber-700 to-amber-800'
        }
        ${isSelected 
          ? 'ring-4 ring-blue-400 ring-inset shadow-lg shadow-blue-400/50' 
          : ''
        }
        ${piece ? 'hover:bg-opacity-80' : ''}
      `}
      onClick={onClick}
    >
      {pieceSymbol && (
        <span 
          className={`
            select-none drop-shadow-lg
            ${piece?.color === 'white' 
              ? 'text-slate-100 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' 
              : 'text-slate-800 filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]'
            }
          `}
        >
          {pieceSymbol}
        </span>
      )}
      
      {/* Position label for development */}
      <span className="absolute bottom-0 right-0 text-xs opacity-30 text-slate-600">
        {position}
      </span>
    </div>
  );
};

export default ChessSquare;
