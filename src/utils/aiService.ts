import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { getAllLegalMoves } from './chessRuleEnforcement';

export const getAIMove = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[]
): Promise<Move | null> => {
  console.log('🤖 Basic AI Move Generation with Rule Enforcement');
  
  const legalMoves = getAllLegalMoves(board, color);
  
  console.log('📊 Legal Moves Analysis:', {
    count: legalMoves.length,
    color,
    gamePhase: determineGamePhase(board)
  });
  
  if (legalMoves.length === 0) {
    console.log('🏁 No legal moves available - game over');
    return null;
  }
  
  try {
    const boardState = boardToFEN(board);
    const historyString = gameHistory.map(move => move.notation).join(' ');
    const gamePhase = determineGamePhase(board);
    const materialBalance = calculateMaterialBalance(board);
    
    console.log('🎯 AI Context:', {
      gamePhase,
      materialBalance,
      legalMovesCount: legalMoves.length,
      boardState: boardState.substring(0, 20) + '...'
    });
    
    // Select intelligent move from legal moves only
    const intelligentMove = selectIntelligentMove(legalMoves, board, color, gamePhase);
    
    // Simulate AI thinking time based on position complexity
    const thinkingTime = Math.min(3000, 1000 + legalMoves.length * 100);
    await new Promise(resolve => setTimeout(resolve, thinkingTime));
    
    const [from, to] = intelligentMove.split('-');
    const [fromRow, fromCol] = [from.charCodeAt(0) - 97, 8 - parseInt(from[1])];
    const piece = board[fromRow][fromCol];
    const [toRow, toCol] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
    const captured = board[toRow][toCol];
    
    if (!piece) {
      console.error('❌ No piece found at selected square');
      return null;
    }
    
    console.log('✅ Legal AI Move Selected:', {
      move: intelligentMove,
      piece: `${piece.color} ${piece.type}`,
      captured: captured ? `${captured.color} ${captured.type}` : 'none'
    });
    
    return {
      from,
      to,
      piece,
      captured: captured || undefined,
      timestamp: Date.now(),
      notation: intelligentMove
    };
  } catch (error) {
    console.error('💥 AI move generation failed:', error);
    
    // Fallback to random legal move
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    const [from, to] = randomMove.split('-');
    
    const [fromRow, fromCol] = [from.charCodeAt(0) - 97, 8 - parseInt(from[1])];
    const piece = board[fromRow][fromCol];
    const [toRow, toCol] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
    const captured = board[toRow][toCol];
    
    if (!piece) return null;
    
    console.log('🔧 Using fallback legal move:', randomMove);
    
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
  legalMoves: string[],
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gamePhase: string
): string => {
  console.log('🧠 Selecting intelligent move from legal moves:', {
    total: legalMoves.length,
    gamePhase,
    color
  });

  // Prioritize captures from legal moves
  const captures = legalMoves.filter(move => {
    const [, to] = move.split('-');
    const [toRow, toCol] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
    return board[toRow][toCol] !== null;
  });
  
  if (captures.length > 0) {
    console.log('🎯 Found capture moves:', captures.length);
    return captures[Math.floor(Math.random() * captures.length)];
  }
  
  // In opening, prefer center moves from legal moves
  if (gamePhase === 'opening') {
    const centerMoves = legalMoves.filter(move => {
      const [, to] = move.split('-');
      const file = to.charCodeAt(0) - 97;
      const rank = parseInt(to[1]);
      return (file >= 2 && file <= 5) && (rank >= 3 && rank <= 6);
    });
    
    if (centerMoves.length > 0) {
      console.log('🏛️ Found center moves:', centerMoves.length);
      return centerMoves[Math.floor(Math.random() * centerMoves.length)];
    }
  }
  
  // Default to random legal move
  const selectedMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
  console.log('🎲 Selected random legal move:', selectedMove);
  return selectedMove;
};
