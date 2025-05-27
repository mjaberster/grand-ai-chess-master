
import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { generateFEN, convertToSAN, getLastMove } from './chessNotation';
import { analyzeTacticalSituation, TacticalSituation } from './chessStateAnalysis';

export const generateEnhancedMovePrompt = (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  validMoves: string[],
  opponentName: string = 'Player',
  aiName?: string
): string => {
  console.log('📝 Generating Enhanced Move Prompt');
  
  const fen = generateFEN(board, color);
  const moveHistory = convertToSAN(gameHistory);
  const moveCount = Math.floor(gameHistory.length / 2) + 1;
  const tacticalSituation = analyzeTacticalSituation(board, color);
  const boardDescription = generateDetailedBoardDescription(board);
  const gameContext = generateGameContext(gameHistory, opponentName, aiName, color);
  const strategicContext = generateStrategicContext(tacticalSituation, color);
  
  console.log('📊 Enhanced Prompt Context:', {
    moveCount,
    isInCheck: tacticalSituation.isInCheck,
    threatsCount: tacticalSituation.threatenedPieces.length,
    validMovesCount: validMoves.length,
    urgentMovesCount: tacticalSituation.urgentMoves.length
  });
  
  return `You are a professional chess grandmaster AI playing a serious game.

GAME CONTEXT:
${gameContext}

CURRENT POSITION ANALYSIS:
Position (FEN): ${fen}
Move ${moveCount} - ${color} to move

BOARD STATE:
${boardDescription}

TACTICAL SITUATION:
${generateTacticalAnalysis(tacticalSituation)}

STRATEGIC CONTEXT:
${strategicContext}

MOVE HISTORY:
${moveHistory || 'Game just started'}

AVAILABLE MOVES:
${validMoves.join(', ')}

${tacticalSituation.isInCheck ? 'WARNING: Your king is in CHECK! You MUST escape check.' : ''}
${tacticalSituation.isCheckmate ? 'CRITICAL: This appears to be checkmate.' : ''}
${tacticalSituation.threatenedPieces.length > 0 ? `THREATS: ${tacticalSituation.threatenedPieces.length} of your pieces are under attack.` : ''}

INSTRUCTIONS:
1. You MUST choose from the available moves list
2. If in check, you MUST choose a move that escapes check
3. Prioritize safety and strong positional play
4. Consider tactical opportunities (captures, threats, checks)
5. Explain your reasoning briefly

Respond with valid JSON:
{
  ${!aiName ? '"aiName": "Your chess AI persona name",' : ''}
  "move": "exact_move_from_available_list",
  "chatMessage": "Brief explanation of your move (1-2 sentences)"
}`;
};

const generateDetailedBoardDescription = (board: (ChessPiece | null)[][]): string => {
  console.log('🎯 Generating Detailed Board Description');
  
  const pieces: { [key: string]: string[] } = {
    'white-king': [], 'white-queen': [], 'white-rook': [], 'white-bishop': [], 'white-knight': [], 'white-pawn': [],
    'black-king': [], 'black-queen': [], 'black-rook': [], 'black-bishop': [], 'black-knight': [], 'black-pawn': []
  };
  
  board.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      if (piece) {
        const position = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
        const key = `${piece.color}-${piece.type}`;
        pieces[key].push(position);
      }
    });
  });
  
  let description = '';
  ['white', 'black'].forEach(color => {
    description += `${color.toUpperCase()} pieces:\n`;
    ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'].forEach(type => {
      const positions = pieces[`${color}-${type}`];
      if (positions.length > 0) {
        description += `  ${type}${positions.length > 1 ? 's' : ''}: ${positions.join(', ')}\n`;
      }
    });
  });
  
  return description;
};

const generateGameContext = (
  gameHistory: Move[],
  opponentName: string,
  aiName: string | undefined,
  currentColor: PieceColor
): string => {
  const totalMoves = gameHistory.length;
  const gamePhase = totalMoves < 10 ? 'Opening' : totalMoves < 25 ? 'Middlegame' : 'Endgame';
  const yourColor = currentColor;
  const opponentColor = currentColor === 'white' ? 'black' : 'white';
  
  return `Game Phase: ${gamePhase}
Total Moves Played: ${totalMoves}
You (${aiName || 'AI'}): Playing as ${yourColor}
Opponent (${opponentName}): Playing as ${opponentColor}`;
};

const generateTacticalAnalysis = (situation: TacticalSituation): string => {
  let analysis = '';
  
  if (situation.isInCheck) {
    analysis += `🚨 CHECK: Your king is under attack by pieces at: ${situation.checkingPieces.join(', ')}\n`;
  }
  
  if (situation.isCheckmate) {
    analysis += '💀 CHECKMATE: No legal moves available to escape check\n';
  }
  
  if (situation.isStalemate) {
    analysis += '🤝 STALEMATE: No legal moves available but not in check\n';
  }
  
  if (situation.threatenedPieces.length > 0) {
    analysis += `⚠️ THREATENED PIECES:\n`;
    situation.threatenedPieces.forEach(threat => {
      analysis += `  ${threat.piece.type} at ${threat.position} attacked by: ${threat.threats.join(', ')}\n`;
    });
  }
  
  if (situation.pins.length > 0) {
    analysis += `📍 PINNED PIECES: ${situation.pins.length} pieces are pinned\n`;
  }
  
  if (situation.forks.length > 0) {
    analysis += `🍴 FORK OPPORTUNITIES: ${situation.forks.length} potential forks available\n`;
  }
  
  analysis += `💰 Material Balance: ${situation.materialBalance > 0 ? '+' : ''}${situation.materialBalance} points\n`;
  
  return analysis || 'No immediate tactical concerns detected.';
};

const generateStrategicContext = (situation: TacticalSituation, color: PieceColor): string => {
  let context = '';
  
  if (situation.isInCheck) {
    context += 'URGENT: Must escape check immediately. Consider: king moves, blocking pieces, or capturing the attacking piece.\n';
  } else if (situation.threatenedPieces.length > 0) {
    context += 'PRIORITY: Defend or move threatened pieces. Consider counterattack opportunities.\n';
  } else {
    context += 'STRATEGY: Look for tactical opportunities, improve piece coordination, control key squares.\n';
  }
  
  if (situation.materialBalance > 2) {
    context += 'ADVANTAGE: You have material advantage - consider simplifying the position.\n';
  } else if (situation.materialBalance < -2) {
    context += 'DISADVANTAGE: Seek tactical complications and counterplay opportunities.\n';
  }
  
  return context;
};

export const generateRetryPrompt = (
  invalidMove: string,
  reason: string,
  board: (ChessPiece | null)[][],
  color: PieceColor,
  validMoves: string[]
): string => {
  const tacticalSituation = analyzeTacticalSituation(board, color);
  
  return `MOVE CORRECTION NEEDED:

Your previous move "${invalidMove}" was INVALID.
Reason: ${reason}

CURRENT SITUATION ANALYSIS:
${generateTacticalAnalysis(tacticalSituation)}

VALID MOVES YOU MUST CHOOSE FROM:
${validMoves.join(', ')}

${tacticalSituation.isInCheck ? 'CRITICAL: You are in CHECK and must escape immediately!' : ''}

Please provide a valid move from the list above in JSON format:
{
  "move": "exact_move_from_valid_list",
  "chatMessage": "Corrected move explanation"
}`;
};
