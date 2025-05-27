
import { ChessPiece, PieceColor, Move } from '@/types/chess';

export const generateFEN = (
  board: (ChessPiece | null)[][],
  activeColor: PieceColor = 'white',
  castlingRights: string = 'KQkq',
  enPassant: string = '-',
  halfmoveClock: number = 0,
  fullmoveNumber: number = 1
): string => {
  const pieceSymbols = {
    white: { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: 'P' },
    black: { king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p' }
  };
  
  const boardString = board.map(row => {
    let rowString = '';
    let emptyCount = 0;
    
    row.forEach(piece => {
      if (piece) {
        if (emptyCount > 0) {
          rowString += emptyCount;
          emptyCount = 0;
        }
        rowString += pieceSymbols[piece.color][piece.type];
      } else {
        emptyCount++;
      }
    });
    
    if (emptyCount > 0) {
      rowString += emptyCount;
    }
    
    return rowString;
  }).join('/');

  return `${boardString} ${activeColor[0]} ${castlingRights} ${enPassant} ${halfmoveClock} ${fullmoveNumber}`;
};

export const convertToSAN = (moves: Move[]): string => {
  if (moves.length === 0) return '';
  
  const sanMoves = moves.map((move, index) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const san = `${move.piece.type === 'pawn' ? '' : move.piece.type[0].toUpperCase()}${move.to}${move.captured ? 'x' : ''}`;
    
    if (index % 2 === 0) {
      return `${moveNumber}.${san}`;
    } else {
      return san;
    }
  });
  
  return sanMoves.join(' ');
};

export const getLastMove = (moves: Move[]): string => {
  if (moves.length === 0) return '';
  const lastMove = moves[moves.length - 1];
  return `${lastMove.piece.type === 'pawn' ? '' : lastMove.piece.type[0].toUpperCase()}${lastMove.to}`;
};
