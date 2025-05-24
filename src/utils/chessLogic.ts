
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
