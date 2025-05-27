import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { generateFEN, convertToSAN, getLastMove } from './chessNotation';
import { analyzeTacticalSituation, TacticalSituation } from './chessStateAnalysis';
import { validateGameState, GameStateValidation } from './chessRuleEnforcement';

export const generateEnhancedMovePrompt = (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  validMoves: string[],
  opponentName: string = 'Player',
  aiName?: string
): string => {
  console.log('📝 Generating Enhanced Move Prompt with Rule Enforcement');
  
  const fen = generateFEN(board, color);
  const moveHistory = convertToSAN(gameHistory);
  const moveCount = Math.floor(gameHistory.length / 2) + 1;
  const tacticalSituation = analyzeTacticalSituation(board, color);
  const gameValidation = validateGameState(board, color);
  const boardDescription = generateDetailedBoardDescription(board);
  const gameContext = generateGameContext(gameHistory, opponentName, aiName, color);
  const strategicContext = generateStrategicContext(tacticalSituation, color, gameValidation);
  
  console.log('📊 Enhanced Prompt Context:', {
    moveCount,
    isInCheck: gameValidation.isInCheck,
    isCheckmate: gameValidation.isCheckmate,
    isStalemate: gameValidation.isStalemate,
    legalMovesCount: gameValidation.legalMoves.length,
    validMovesCount: validMoves.length,
    urgentMovesCount: tacticalSituation.urgentMoves.length
  });

  // CRITICAL: Validate that provided moves are actually legal
  const actualLegalMoves = gameValidation.legalMoves;
  const filteredValidMoves = validMoves.filter(move => actualLegalMoves.includes(move));
  
  if (filteredValidMoves.length !== validMoves.length) {
    console.warn('⚠️ Some provided moves are not legal:', {
      provided: validMoves.length,
      legal: filteredValidMoves.length,
      illegal: validMoves.filter(move => !actualLegalMoves.includes(move))
    });
  }
  
  return `You are a professional chess grandmaster AI playing a serious chess game that MUST follow ALL chess rules.

CRITICAL CHESS RULES:
- You CANNOT make moves that leave your king in check
- If your king IS in check, you MUST escape check immediately
- You CANNOT capture the opponent's king (the game ends at checkmate)
- You MUST only choose from the LEGAL moves provided

GAME CONTEXT:
${gameContext}

CURRENT POSITION ANALYSIS:
Position (FEN): ${fen}
Move ${moveCount} - ${color} to move

GAME STATE VALIDATION:
${generateGameStateDescription(gameValidation)}

BOARD STATE:
${boardDescription}

TACTICAL SITUATION:
${generateTacticalAnalysis(tacticalSituation)}

STRATEGIC CONTEXT:
${strategicContext}

MOVE HISTORY:
${moveHistory || 'Game just started'}

LEGAL MOVES AVAILABLE:
${filteredValidMoves.join(', ')}

${gameValidation.isInCheck ? '🚨 CRITICAL: Your king is in CHECK! You MUST escape check immediately with one of the legal moves above.' : ''}
${gameValidation.isCheckmate ? '💀 GAME OVER: This is checkmate - no legal moves available.' : ''}
${gameValidation.isStalemate ? '🤝 GAME OVER: This is stalemate - no legal moves available but not in check.' : ''}
${gameValidation.checkingPieces.length > 0 ? `⚠️ CHECKING PIECES: Your king is attacked by pieces at: ${gameValidation.checkingPieces.join(', ')}` : ''}

INSTRUCTIONS:
1. You MUST choose EXACTLY one move from the LEGAL MOVES list above
2. If in check, your move MUST escape check (all provided moves already satisfy this)
3. Consider tactical opportunities while respecting chess rules
4. Explain your move choice briefly but clearly

Respond with valid JSON:
{
  ${!aiName ? '"aiName": "Your chess AI persona name",' : ''}
  "move": "exact_move_from_legal_moves_list",
  "chatMessage": "Brief explanation of your move (1-2 sentences)"
}`;
};

const generateGameStateDescription = (validation: GameStateValidation): string => {
  let description = '';
  
  if (validation.isInCheck) {
    description += `🚨 IN CHECK: Your king is under attack!\n`;
  }
  
  if (validation.isCheckmate) {
    description += `💀 CHECKMATE: Game over - no legal moves to escape check.\n`;
  } else if (validation.isStalemate) {
    description += `🤝 STALEMATE: Game over - no legal moves available but not in check.\n`;
  } else {
    description += `✅ NORMAL PLAY: ${validation.legalMoves.length} legal moves available.\n`;
  }
  
  if (validation.checkingPieces.length > 0) {
    description += `⚔️ Attacking pieces: ${validation.checkingPieces.join(', ')}\n`;
  }
  
  return description;
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

const generateStrategicContext = (
  situation: TacticalSituation, 
  color: PieceColor, 
  validation: GameStateValidation
): string => {
  let context = '';
  
  if (validation.isCheckmate) {
    context += 'GAME OVER: Checkmate detected. No legal moves available.\n';
  } else if (validation.isStalemate) {
    context += 'GAME OVER: Stalemate detected. No legal moves available but not in check.\n';
  } else if (validation.isInCheck) {
    context += 'URGENT: Must escape check immediately. All provided moves are guaranteed to escape check.\n';
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
  const gameValidation = validateGameState(board, color);
  const tacticalSituation = analyzeTacticalSituation(board, color);
  
  return `MOVE CORRECTION NEEDED - CHESS RULE VIOLATION:

Your previous move "${invalidMove}" was INVALID and violates chess rules.
Reason: ${reason}

CURRENT GAME STATE:
${generateGameStateDescription(gameValidation)}

TACTICAL ANALYSIS:
${generateTacticalAnalysis(tacticalSituation)}

LEGAL MOVES YOU MUST CHOOSE FROM:
${gameValidation.legalMoves.filter(move => validMoves.includes(move)).join(', ')}

${gameValidation.isInCheck ? '🚨 CRITICAL: You are in CHECK and must escape immediately!' : ''}
${gameValidation.isCheckmate ? '💀 GAME OVER: This is checkmate - no legal moves available.' : ''}

IMPORTANT: The moves listed above are the ONLY legal moves that follow chess rules.
You CANNOT make moves that would leave your king in check or violate other chess rules.

Please provide a valid move from the legal moves list above in JSON format:
{
  "move": "exact_move_from_legal_list",
  "chatMessage": "Corrected move explanation with rule compliance"
}`;
};
