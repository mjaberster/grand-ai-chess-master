
import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { positionToCoords, coordsToPosition, isValidMove } from './chessLogic';

export interface TacticalSituation {
  isInCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  checkingPieces: string[];
  threatenedPieces: Array<{ position: string; piece: ChessPiece; threats: string[] }>;
  defendedPieces: Array<{ position: string; piece: ChessPiece; defenders: string[] }>;
  pins: Array<{ pinnedPiece: string; pinningPiece: string; throughSquares: string[] }>;
  forks: Array<{ forkingPiece: string; targets: string[] }>;
  materialBalance: number;
  urgentMoves: string[];
}

export const analyzeTacticalSituation = (
  board: (ChessPiece | null)[][],
  color: PieceColor
): TacticalSituation => {
  console.log('🔍 Analyzing Tactical Situation for:', color);
  
  const isInCheck = detectCheck(board, color);
  const checkingPieces = findCheckingPieces(board, color);
  const threatenedPieces = findThreatenedPieces(board, color);
  const defendedPieces = findDefendedPieces(board, color);
  const pins = findPins(board, color);
  const forks = findForks(board, color);
  const materialBalance = calculateMaterialBalance(board);
  const urgentMoves = calculateUrgentMoves(board, color, isInCheck, checkingPieces);
  
  const situation: TacticalSituation = {
    isInCheck,
    isCheckmate: isInCheck && urgentMoves.length === 0,
    isStalemate: !isInCheck && urgentMoves.length === 0,
    checkingPieces,
    threatenedPieces,
    defendedPieces,
    pins,
    forks,
    materialBalance,
    urgentMoves
  };
  
  console.log('📊 Tactical Analysis Complete:', {
    isInCheck,
    threatsCount: threatenedPieces.length,
    pinsCount: pins.length,
    forksCount: forks.length,
    urgentMovesCount: urgentMoves.length,
    materialBalance
  });
  
  return situation;
};

const detectCheck = (board: (ChessPiece | null)[][], color: PieceColor): boolean => {
  let kingPosition = '';
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        kingPosition = coordsToPosition(row, col);
        break;
      }
    }
  }
  
  if (!kingPosition) return false;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color !== color) {
        const position = coordsToPosition(row, col);
        if (isValidMove(board, position, kingPosition)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

const findCheckingPieces = (board: (ChessPiece | null)[][], color: PieceColor): string[] => {
  const checkingPieces: string[] = [];
  let kingPosition = '';
  
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
  
  return checkingPieces;
};

const findThreatenedPieces = (
  board: (ChessPiece | null)[][],
  color: PieceColor
): Array<{ position: string; piece: ChessPiece; threats: string[] }> => {
  const threatened: Array<{ position: string; piece: ChessPiece; threats: string[] }> = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const position = coordsToPosition(row, col);
        const threats: string[] = [];
        
        for (let eRow = 0; eRow < 8; eRow++) {
          for (let eCol = 0; eCol < 8; eCol++) {
            const enemyPiece = board[eRow][eCol];
            if (enemyPiece && enemyPiece.color !== color) {
              const enemyPosition = coordsToPosition(eRow, eCol);
              if (isValidMove(board, enemyPosition, position)) {
                threats.push(enemyPosition);
              }
            }
          }
        }
        
        if (threats.length > 0) {
          threatened.push({ position, piece, threats });
        }
      }
    }
  }
  
  return threatened;
};

const findDefendedPieces = (
  board: (ChessPiece | null)[][],
  color: PieceColor
): Array<{ position: string; piece: ChessPiece; defenders: string[] }> => {
  const defended: Array<{ position: string; piece: ChessPiece; defenders: string[] }> = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const position = coordsToPosition(row, col);
        const defenders: string[] = [];
        
        for (let dRow = 0; dRow < 8; dRow++) {
          for (let dCol = 0; dCol < 8; dCol++) {
            const defenderPiece = board[dRow][dCol];
            if (defenderPiece && defenderPiece.color === color && !(dRow === row && dCol === col)) {
              const defenderPosition = coordsToPosition(dRow, dCol);
              if (isValidMove(board, defenderPosition, position)) {
                defenders.push(defenderPosition);
              }
            }
          }
        }
        
        if (defenders.length > 0) {
          defended.push({ position, piece, defenders });
        }
      }
    }
  }
  
  return defended;
};

const findPins = (board: (ChessPiece | null)[][], color: PieceColor): Array<{ pinnedPiece: string; pinningPiece: string; throughSquares: string[] }> => {
  // Simplified pin detection - would need more complex logic for full implementation
  return [];
};

const findForks = (board: (ChessPiece | null)[][], color: PieceColor): Array<{ forkingPiece: string; targets: string[] }> => {
  // Simplified fork detection - would need more complex logic for full implementation
  return [];
};

const calculateMaterialBalance = (board: (ChessPiece | null)[][]): number => {
  const values = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
  let whiteValue = 0;
  let blackValue = 0;
  
  board.forEach(row => {
    row.forEach(piece => {
      if (piece) {
        const value = values[piece.type];
        if (piece.color === 'white') {
          whiteValue += value;
        } else {
          blackValue += value;
        }
      }
    });
  });
  
  return whiteValue - blackValue;
};

const calculateUrgentMoves = (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  isInCheck: boolean,
  checkingPieces: string[]
): string[] => {
  const urgentMoves: string[] = [];
  
  if (isInCheck) {
    // Find moves that escape check
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const from = coordsToPosition(row, col);
          
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              const to = coordsToPosition(toRow, toCol);
              if (isValidMove(board, from, to)) {
                // Simulate move and check if still in check
                const testBoard = board.map(r => [...r]);
                const [fromR, fromC] = positionToCoords(from);
                const [toR, toC] = positionToCoords(to);
                
                testBoard[toR][toC] = testBoard[fromR][fromC];
                testBoard[fromR][fromC] = null;
                
                if (!detectCheck(testBoard, color)) {
                  urgentMoves.push(`${from}-${to}`);
                }
              }
            }
          }
        }
      }
    }
  } else {
    // All valid moves when not in check
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const from = coordsToPosition(row, col);
          
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              const to = coordsToPosition(toRow, toCol);
              if (isValidMove(board, from, to)) {
                urgentMoves.push(`${from}-${to}`);
              }
            }
          }
        }
      }
    }
  }
  
  return urgentMoves;
};
