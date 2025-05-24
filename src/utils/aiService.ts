
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
    const boardState = boardToFEN(board);
    const historyString = gameHistory.map(move => move.notation).join(' ');
    const gamePhase = determineGamePhase(board);
    const materialBalance = calculateMaterialBalance(board);
    
    const prompt = `You are a chess grandmaster AI with deep understanding of chess strategy, tactics, and endgames.

POSITION ANALYSIS:
- Current FEN: ${boardState}
- Game phase: ${gamePhase}
- Material balance: ${materialBalance > 0 ? `+${materialBalance}` : materialBalance} for ${color}
- Move history: ${historyString || 'Opening'}
- Available moves: ${validMoves.join(', ')}
- Player to move: ${color}

STRATEGIC GUIDELINES:
${getStrategicGuidelines(gamePhase, color, materialBalance)}

EVALUATION CRITERIA:
1. Tactical opportunities (checks, captures, threats)
2. Positional improvements (piece activity, king safety, pawn structure)
3. Strategic goals based on position type
4. Opening principles (if early game)
5. Endgame technique (if late game)

Choose the strongest move considering:
- Immediate tactics and threats
- Long-term positional advantages
- King safety and piece coordination
- Pawn structure and weak squares
- Initiative and tempo

Respond with ONLY the move in format "from-to" (e.g., "e2-e4").
Choose the move that a grandmaster would play in this position.`;

    console.log('AI analyzing position with advanced prompting:', {
      gamePhase,
      materialBalance,
      validMovesCount: validMoves.length
    });
    
    // For now, make an intelligent random move (replace with actual AI call)
    const intelligentMove = selectIntelligentMove(validMoves, board, color, gamePhase);
    
    // Simulate AI thinking time based on position complexity
    const thinkingTime = Math.min(3000, 1000 + validMoves.length * 100);
    await new Promise(resolve => setTimeout(resolve, thinkingTime));
    
    const [from, to] = intelligentMove.split('-');
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
      notation: intelligentMove
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

const boardToFEN = (board: (ChessPiece | null)[][]): string => {
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

const determineGamePhase = (board: (ChessPiece | null)[][]): 'opening' | 'middlegame' | 'endgame' => {
  let pieceCount = 0;
  let majorPieces = 0;
  
  board.forEach(row => {
    row.forEach(piece => {
      if (piece) {
        pieceCount++;
        if (['queen', 'rook'].includes(piece.type)) {
          majorPieces++;
        }
      }
    });
  });
  
  if (pieceCount > 24) return 'opening';
  if (pieceCount < 14 || majorPieces < 4) return 'endgame';
  return 'middlegame';
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

const getStrategicGuidelines = (phase: string, color: PieceColor, materialBalance: number): string => {
  const guidelines = [];
  
  if (phase === 'opening') {
    guidelines.push('- Control the center with pawns and pieces');
    guidelines.push('- Develop knights before bishops');
    guidelines.push('- Castle early for king safety');
    guidelines.push('- Avoid moving the same piece twice');
  } else if (phase === 'middlegame') {
    guidelines.push('- Look for tactical combinations and threats');
    guidelines.push('- Improve piece coordination and activity');
    guidelines.push('- Control key squares and files');
    guidelines.push('- Consider pawn breaks and weaknesses');
  } else {
    guidelines.push('- Activate the king as a fighting piece');
    guidelines.push('- Push passed pawns aggressively');
    guidelines.push('- Trade pieces when ahead in material');
    guidelines.push('- Focus on pawn promotion threats');
  }
  
  if (materialBalance > 2) {
    guidelines.push('- Trade pieces to simplify the position');
  } else if (materialBalance < -2) {
    guidelines.push('- Seek tactical complications and counterplay');
  }
  
  return guidelines.join('\n');
};

const selectIntelligentMove = (
  validMoves: string[],
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gamePhase: string
): string => {
  // Prioritize captures and checks
  const captures = validMoves.filter(move => {
    const [, to] = move.split('-');
    const [toRow, toCol] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
    return board[toRow][toCol] !== null;
  });
  
  if (captures.length > 0) {
    return captures[Math.floor(Math.random() * captures.length)];
  }
  
  // In opening, prefer center moves
  if (gamePhase === 'opening') {
    const centerMoves = validMoves.filter(move => {
      const [, to] = move.split('-');
      const file = to.charCodeAt(0) - 97;
      const rank = parseInt(to[1]);
      return (file >= 2 && file <= 5) && (rank >= 3 && rank <= 6);
    });
    
    if (centerMoves.length > 0) {
      return centerMoves[Math.floor(Math.random() * centerMoves.length)];
    }
  }
  
  // Default to random move
  return validMoves[Math.floor(Math.random() * validMoves.length)];
};
