
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
            select-none text-5xl font-bold
            ${piece?.color === 'white' 
              ? 'text-white filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.8)]' 
              : 'text-slate-900 filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.5)]'
            }
          `}
          style={{
            textShadow: piece?.color === 'white' 
              ? '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)' 
              : '1px 1px 2px rgba(255,255,255,0.5), -1px -1px 1px rgba(0,0,0,0.3)'
          }}
        >
          {pieceSymbol}
        </span>
      )}
    </div>
  );
};

export default ChessSquare;
