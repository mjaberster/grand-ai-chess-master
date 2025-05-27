import { ChessPiece, PieceType, PieceColor } from '@/types/chess';

export const initializeBoard = (): (ChessPiece | null)[][] => {
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Initialize white pieces
  const whitePieces: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  whitePieces.forEach((type, col) => {
    board[7][col] = { type, color: 'white', position: `${String.fromCharCode(97 + col)}1` };
  });
  
  for (let col = 0; col < 8; col++) {
    board[6][col] = { type: 'pawn', color: 'white', position: `${String.fromCharCode(97 + col)}2` };
  }
  
  // Initialize black pieces
  const blackPieces: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  blackPieces.forEach((type, col) => {
    board[0][col] = { type, color: 'black', position: `${String.fromCharCode(97 + col)}8` };
  });
  
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black', position: `${String.fromCharCode(97 + col)}7` };
  }
  
  return board;
};

export const positionToCoords = (position: string): [number, number] => {
  const col = position.charCodeAt(0) - 97;
  const row = 8 - parseInt(position[1]);
  return [row, col];
};

export const coordsToPosition = (row: number, col: number): string => {
  return `${String.fromCharCode(97 + col)}${8 - row}`;
};

export const isValidMove = (board: (ChessPiece | null)[][], from: string, to: string): boolean => {
  const [fromRow, fromCol] = positionToCoords(from);
  const [toRow, toCol] = positionToCoords(to);
  
  const piece = board[fromRow][fromCol];
  if (!piece) return false;
  
  const targetPiece = board[toRow][toCol];
  if (targetPiece && targetPiece.color === piece.color) return false;
  
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  
  switch (piece.type) {
    case 'pawn':
      const direction = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? 6 : 1;
      
      if (toCol === fromCol) {
        if (toRow === fromRow + direction && !targetPiece) return true;
        if (fromRow === startRow && toRow === fromRow + 2 * direction && !targetPiece) return true;
      } else if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && targetPiece) {
        return true;
      }
      return false;
      
    case 'rook':
      if (rowDiff === 0 || colDiff === 0) {
        return isPathClear(board, fromRow, fromCol, toRow, toCol);
      }
      return false;
      
    case 'bishop':
      if (rowDiff === colDiff) {
        return isPathClear(board, fromRow, fromCol, toRow, toCol);
      }
      return false;
      
    case 'queen':
      if (rowDiff === 0 || colDiff === 0 || rowDiff === colDiff) {
        return isPathClear(board, fromRow, fromCol, toRow, toCol);
      }
      return false;
      
    case 'knight':
      return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
      
    case 'king':
      return rowDiff <= 1 && colDiff <= 1;
      
    default:
      return false;
  }
};

const isPathClear = (board: (ChessPiece | null)[][], fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
  const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
  const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
  
  let currentRow = fromRow + rowStep;
  let currentCol = fromCol + colStep;
  
  while (currentRow !== toRow || currentCol !== toCol) {
    if (board[currentRow][currentCol]) return false;
    currentRow += rowStep;
    currentCol += colStep;
  }
  
  return true;
};

export const makeMove = (board: (ChessPiece | null)[][], from: string, to: string): (ChessPiece | null)[][] => {
  const newBoard = board.map(row => [...row]);
  const [fromRow, fromCol] = positionToCoords(from);
  const [toRow, toCol] = positionToCoords(to);
  
  const piece = newBoard[fromRow][fromCol];
  if (piece) {
    piece.position = to;
    piece.hasMoved = true;
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
  }
  
  return newBoard;
};

export const isInCheck = (board: (ChessPiece | null)[][], color: PieceColor): boolean => {
  // Find the king
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
  
  // Check if any opponent piece can attack the king
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

export const getAllValidMoves = (board: (ChessPiece | null)[][], color: PieceColor): string[] => {
  const moves: string[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const from = coordsToPosition(row, col);
        
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            const to = coordsToPosition(toRow, toCol);
            if (isValidMove(board, from, to)) {
              moves.push(`${from}-${to}`);
            }
          }
        }
      }
    }
  }
  
  return moves;
};

// Enhanced board analysis functions
export interface BoardAnalysis {
  fen: string;
  isInCheck: boolean;
  checkingPieces: string[];
  threatenedPieces: Array<{ piece: string; threats: string[] }>;
  materialBalance: number;
  pieceActivity: { [key: string]: number };
  kingSafety: { white: number; black: number };
  controlledSquares: { white: string[]; black: string[] };
  specialConditions: {
    canCastle: { white: { kingside: boolean; queenside: boolean }; black: { kingside: boolean; queenside: boolean } };
    enPassant: string | null;
    fiftyMoveRule: number;
  };
}

export const analyzeBoardState = (board: (ChessPiece | null)[][], color: PieceColor): BoardAnalysis => {
  const fen = generateFEN(board);
  const inCheck = isInCheck(board, color);
  const checkingPieces = findCheckingPieces(board, color);
  const threatenedPieces = findThreatenedPieces(board, color);
  const materialBalance = calculateMaterialBalance(board);
  const pieceActivity = calculatePieceActivity(board);
  const kingSafety = evaluateKingSafety(board);
  const controlledSquares = getControlledSquares(board);
  
  return {
    fen,
    isInCheck: inCheck,
    checkingPieces,
    threatenedPieces,
    materialBalance,
    pieceActivity,
    kingSafety,
    controlledSquares,
    specialConditions: {
      canCastle: { 
        white: { kingside: canCastle(board, 'white', 'kingside'), queenside: canCastle(board, 'white', 'queenside') },
        black: { kingside: canCastle(board, 'black', 'kingside'), queenside: canCastle(board, 'black', 'queenside') }
      },
      enPassant: null, // Simplified for now
      fiftyMoveRule: 0 // Simplified for now
    }
  };
};

const generateFEN = (board: (ChessPiece | null)[][]): string => {
  const pieceSymbols = {
    white: { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: 'P' },
    black: { king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p' }
  };
  
  return board.map(row => {
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
};

const findCheckingPieces = (board: (ChessPiece | null)[][], color: PieceColor): string[] => {
  const checkingPieces: string[] = [];
  let kingPosition = '';
  
  // Find king
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
  
  return checkingPieces;
};

const findThreatenedPieces = (board: (ChessPiece | null)[][], color: PieceColor): Array<{ piece: string; threats: string[] }> => {
  const threatened: Array<{ piece: string; threats: string[] }> = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const position = coordsToPosition(row, col);
        const threats: string[] = [];
        
        // Find enemy pieces that can attack this piece
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
          threatened.push({ piece: position, threats });
        }
      }
    }
  }
  
  return threatened;
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

const calculatePieceActivity = (board: (ChessPiece | null)[][]): { [key: string]: number } => {
  const activity: { [key: string]: number } = {};
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const position = coordsToPosition(row, col);
        const validMoves = getAllValidMoves(board, piece.color).filter(move => move.startsWith(position));
        activity[position] = validMoves.length;
      }
    }
  }
  
  return activity;
};

const evaluateKingSafety = (board: (ChessPiece | null)[][]): { white: number; black: number } => {
  const safety = { white: 0, black: 0 };
  
  ['white', 'black'].forEach(color => {
    const kingThreats = findCheckingPieces(board, color as PieceColor).length;
    safety[color as 'white' | 'black'] = Math.max(0, 10 - kingThreats * 3);
  });
  
  return safety;
};

const getControlledSquares = (board: (ChessPiece | null)[][]): { white: string[]; black: string[] } => {
  const controlled = { white: [] as string[], black: [] as string[] };
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const position = coordsToPosition(row, col);
        const moves = getAllValidMoves(board, piece.color).filter(move => move.startsWith(position));
        moves.forEach(move => {
          const [, to] = move.split('-');
          controlled[piece.color].push(to);
        });
      }
    }
  }
  
  return controlled;
};

const canCastle = (board: (ChessPiece | null)[][], color: PieceColor, side: 'kingside' | 'queenside'): boolean => {
  const row = color === 'white' ? 7 : 0;
  const king = board[row][4];
  
  if (!king || king.type !== 'king' || king.hasMoved) return false;
  
  if (side === 'kingside') {
    const rook = board[row][7];
    if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;
    return !board[row][5] && !board[row][6];
  } else {
    const rook = board[row][0];
    if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;
    return !board[row][1] && !board[row][2] && !board[row][3];
  }
};

export const isCheckmate = (board: (ChessPiece | null)[][], color: PieceColor): boolean => {
  if (!isInCheck(board, color)) return false;
  return getAllValidMoves(board, color).length === 0;
};

export const isStalemate = (board: (ChessPiece | null)[][], color: PieceColor): boolean => {
  if (isInCheck(board, color)) return false;
  return getAllValidMoves(board, color).length === 0;
};
