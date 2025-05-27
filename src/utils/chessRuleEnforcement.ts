
import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { positionToCoords, coordsToPosition, isValidMove } from './chessLogic';

export interface GameStateValidation {
  isInCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  checkingPieces: string[];
  legalMoves: string[];
  gameOver: boolean;
  winner?: PieceColor | 'draw';
}

export const simulateMove = (
  board: (ChessPiece | null)[][],
  from: string,
  to: string
): (ChessPiece | null)[][] => {
  console.log('🔄 Simulating move:', { from, to });
  
  const newBoard = board.map(row => [...row]);
  const [fromRow, fromCol] = positionToCoords(from);
  const [toRow, toCol] = positionToCoords(to);
  
  const piece = newBoard[fromRow][fromCol];
  if (piece) {
    newBoard[toRow][toCol] = { ...piece, position: to };
    newBoard[fromRow][fromCol] = null;
  }
  
  return newBoard;
};

export const isInCheck = (board: (ChessPiece | null)[][], color: PieceColor): boolean => {
  console.log('👑 Checking if king is in check for:', color);
  
  let kingPosition = '';
  
  // Find the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        kingPosition = coordsToPosition(row, col);
        break;
      }
    }
  }
  
  if (!kingPosition) {
    console.error('❌ King not found for color:', color);
    return false;
  }
  
  // Check if any opponent piece can attack the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color !== color) {
        const position = coordsToPosition(row, col);
        if (isValidMove(board, position, kingPosition)) {
          console.log('🚨 King in check! Attacked by:', position);
          return true;
        }
      }
    }
  }
  
  return false;
};

export const findCheckingPieces = (board: (ChessPiece | null)[][], color: PieceColor): string[] => {
  const checkingPieces: string[] = [];
  let kingPosition = '';
  
  // Find the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        kingPosition = coordsToPosition(row, col);
        break;
      }
    }
  }
  
  if (!kingPosition) return checkingPieces;
  
  // Find pieces attacking the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color !== color) {
        const position = coordsToPosition(row, col);
        if (isValidMove(board, position, kingPosition)) {
          checkingPieces.push(position);
        }
      }
    }
  }
  
  console.log('🎯 Checking pieces found:', checkingPieces);
  return checkingPieces;
};

export const isLegalMove = (
  board: (ChessPiece | null)[][],
  from: string,
  to: string,
  color: PieceColor
): boolean => {
  console.log('⚖️ Validating legal move:', { from, to, color });
  
  // First check if the move is valid according to piece movement rules
  if (!isValidMove(board, from, to)) {
    console.log('❌ Invalid piece movement');
    return false;
  }
  
  // Simulate the move and check if it leaves the king in check
  const simulatedBoard = simulateMove(board, from, to);
  const wouldBeInCheck = isInCheck(simulatedBoard, color);
  
  if (wouldBeInCheck) {
    console.log('❌ Move would leave king in check');
    return false;
  }
  
  console.log('✅ Legal move confirmed');
  return true;
};

export const getAllLegalMoves = (board: (ChessPiece | null)[][], color: PieceColor): string[] => {
  console.log('📋 Getting all legal moves for:', color);
  
  const legalMoves: string[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const from = coordsToPosition(row, col);
        
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            const to = coordsToPosition(toRow, toCol);
            if (isLegalMove(board, from, to, color)) {
              legalMoves.push(`${from}-${to}`);
            }
          }
        }
      }
    }
  }
  
  console.log('📊 Legal moves found:', { count: legalMoves.length, moves: legalMoves.slice(0, 5) });
  return legalMoves;
};

export const getCheckEscapeMoves = (board: (ChessPiece | null)[][], color: PieceColor): string[] => {
  console.log('🚨 Finding check escape moves for:', color);
  
  if (!isInCheck(board, color)) {
    console.log('ℹ️ Not in check, returning all legal moves');
    return getAllLegalMoves(board, color);
  }
  
  const escapeMoves: string[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const from = coordsToPosition(row, col);
        
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            const to = coordsToPosition(toRow, toCol);
            if (isValidMove(board, from, to)) {
              const simulatedBoard = simulateMove(board, from, to);
              if (!isInCheck(simulatedBoard, color)) {
                escapeMoves.push(`${from}-${to}`);
              }
            }
          }
        }
      }
    }
  }
  
  console.log('🆘 Check escape moves found:', { count: escapeMoves.length, moves: escapeMoves.slice(0, 3) });
  return escapeMoves;
};

export const validateGameState = (board: (ChessPiece | null)[][], color: PieceColor): GameStateValidation => {
  console.log('🔍 Validating game state for:', color);
  
  const inCheck = isInCheck(board, color);
  const checkingPieces = inCheck ? findCheckingPieces(board, color) : [];
  const legalMoves = getAllLegalMoves(board, color);
  
  const isCheckmate = inCheck && legalMoves.length === 0;
  const isStalemate = !inCheck && legalMoves.length === 0;
  const gameOver = isCheckmate || isStalemate;
  
  let winner: PieceColor | 'draw' | undefined;
  if (isCheckmate) {
    winner = color === 'white' ? 'black' : 'white';
  } else if (isStalemate) {
    winner = 'draw';
  }
  
  const validation: GameStateValidation = {
    isInCheck: inCheck,
    isCheckmate,
    isStalemate,
    checkingPieces,
    legalMoves,
    gameOver,
    winner
  };
  
  console.log('📊 Game state validation:', {
    inCheck,
    isCheckmate,
    isStalemate,
    legalMovesCount: legalMoves.length,
    gameOver
  });
  
  return validation;
};
