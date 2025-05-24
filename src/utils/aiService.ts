
import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { getAllValidMoves } from './chessLogic';

export const getAIMove = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[]
): Promise<Move | null> => {
  const validMoves = getAllValidMoves(board, color);
  
  if (validMoves.length === 0) return null;
  
  try {
    const boardState = boardToString(board);
    const historyString = gameHistory.map(move => move.notation).join(' ');
    
    const prompt = `You are a chess AI. Given the current board position and game history, choose the best move.
    
Current board (8x8, white pieces uppercase, black lowercase):
${boardState}

Game history: ${historyString}
Valid moves: ${validMoves.join(', ')}
Current player: ${color}

Respond with only the move in format "from-to" (e.g., "e2-e4").`;

    console.log('AI thinking with prompt:', prompt);
    
    // For now, make a random valid move (replace with actual AI call)
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    const [from, to] = randomMove.split('-');
    
    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const [fromRow, fromCol] = [from.charCodeAt(0) - 97, 8 - parseInt(from[1])];
    const piece = board[fromRow][fromCol];
    const [toRow, toCol] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
    const captured = board[toRow][toCol];
    
    if (!piece) return null;
    
    return {
      from,
      to,
      piece,
      captured: captured || undefined,
      timestamp: Date.now(),
      notation: randomMove
    };
  } catch (error) {
    console.error('AI move generation failed:', error);
    
    // Fallback to random move
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    const [from, to] = randomMove.split('-');
    
    const [fromRow, fromCol] = [from.charCodeAt(0) - 97, 8 - parseInt(from[1])];
    const piece = board[fromRow][fromCol];
    const [toRow, toCol] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
    const captured = board[toRow][toCol];
    
    if (!piece) return null;
    
    return {
      from,
      to,
      piece,
      captured: captured || undefined,
      timestamp: Date.now(),
      notation: randomMove
    };
  }
};

const boardToString = (board: (ChessPiece | null)[][]): string => {
  const pieceSymbols = {
    white: { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: 'P' },
    black: { king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p' }
  };
  
  return board.map(row => 
    row.map(piece => 
      piece ? pieceSymbols[piece.color][piece.type] : '.'
    ).join(' ')
  ).join('\n');
};
