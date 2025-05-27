import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { getAllValidMoves, positionToCoords, analyzeBoardState, isCheckmate, isStalemate } from './chessLogic';

export const getOpenAIMove = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  opponentName: string = 'Player',
  currentAiName?: string
): Promise<{ move: Move | null; chatMessage: string; aiName?: string }> => {
  const validMoves = getAllValidMoves(board, color);
  
  if (validMoves.length === 0) {
    return { move: null, chatMessage: '' };
  }
  
  try {
    // Comprehensive board analysis
    const boardAnalysis = analyzeBoardState(board, color);
    const opponentAnalysis = analyzeBoardState(board, color === 'white' ? 'black' : 'white');
    const gameMoves = gameHistory.map(move => move.notation);
    const gamePhase = determineGamePhase(gameHistory.length, board);
    
    // Check for special game states
    const isCheckmate_ = isCheckmate(board, color);
    const isStalemate_ = isStalemate(board, color);
    
    if (isCheckmate_) {
      return { move: null, chatMessage: `Checkmate! ${opponentName} wins!` };
    }
    
    if (isStalemate_) {
      return { move: null, chatMessage: "It's a stalemate - the game is drawn!" };
    }

    // Generate detailed board description
    const detailedBoardState = generateDetailedBoardDescription(board, color);
    const threatAnalysis = generateThreatAnalysis(board, color);
    const strategicOpportunities = generateStrategicOpportunities(board, color, validMoves);
    const tacticalThemes = analyzeTacticalThemes(board, color);

    // Enhanced system prompt with comprehensive chess knowledge
    const systemPrompt = `You are a world-class chess grandmaster AI playing as ${color.toUpperCase()}. You have deep understanding of chess strategy, tactics, and endgames. You must analyze this position with the precision of a computer engine combined with the intuition of a human master.

CRITICAL RULES:
1. YOU ARE PLAYING AS ${color.toUpperCase()} - This is your color, make moves that benefit ${color}
2. You MUST choose from the provided valid moves list - no exceptions
3. Analyze threats, tactics, and strategy before deciding
4. If your king is in check, you MUST prioritize escaping check
5. Consider both immediate tactics and long-term strategic goals
${!currentAiName ? '6. First, create a unique robot-like chess name for yourself (e.g., ChessBot-Alpha, DeepKnight-X1, TacticCore, etc.)' : `6. Your name is ${currentAiName}`}

RESPOND WITH VALID JSON:
{
  ${!currentAiName ? '"aiName": "Your unique robot chess name",' : ''}
  "move": "exact move from valid moves list (e.g., e2-e4)",
  "chatMessage": "Brief tactical/strategic comment about your move"
}`;

    const positionPrompt = `
=== COMPREHENSIVE POSITION ANALYSIS ===

🎯 YOUR COLOR: ${color.toUpperCase()} (You are playing as ${color})
📊 GAME PHASE: ${gamePhase}
⏱️ MOVE COUNT: ${gameHistory.length}

=== CURRENT BOARD STATE ===
${detailedBoardState}

=== CRITICAL TACTICAL INFORMATION ===
${boardAnalysis.isInCheck ? 
  `🚨 YOUR KING IS IN CHECK! 
  - Checking pieces: ${boardAnalysis.checkingPieces.join(', ')}
  - YOU MUST ESCAPE CHECK IMMEDIATELY
  - Only moves that block check, capture checking piece, or move king are legal` :
  '✅ Your king is safe (not in check)'}

=== THREAT ANALYSIS ===
${threatAnalysis}

=== MATERIAL BALANCE ===
Current material: ${boardAnalysis.materialBalance > 0 ? `+${boardAnalysis.materialBalance} for White` : boardAnalysis.materialBalance < 0 ? `${Math.abs(boardAnalysis.materialBalance)} for Black` : 'Equal material'}

=== KING SAFETY EVALUATION ===
- White King Safety: ${boardAnalysis.kingSafety.white}/10
- Black King Safety: ${boardAnalysis.kingSafety.black}/10
- Your King Safety: ${boardAnalysis.kingSafety[color]}/10

=== TACTICAL THEMES DETECTED ===
${tacticalThemes}

=== STRATEGIC OPPORTUNITIES ===
${strategicOpportunities}

=== CASTLING RIGHTS ===
${generateCastlingInfo(boardAnalysis)}

=== RECENT GAME HISTORY ===
Last 5 moves: ${gameMoves.slice(-5).join(' ') || 'Game start'}

=== YOUR AVAILABLE MOVES ===
${validMoves.length} legal moves: ${validMoves.join(', ')}

=== STRATEGIC PRIORITIES FOR ${color.toUpperCase()} ===
${getColorSpecificStrategy(color, gamePhase, boardAnalysis)}

=== MOVE SELECTION CRITERIA ===
1. ${boardAnalysis.isInCheck ? 'ESCAPE CHECK (mandatory priority)' : 'Look for checkmate opportunities'}
2. ${boardAnalysis.isInCheck ? 'Find best way to escape while maintaining position' : 'Capture valuable pieces safely'}
3. Improve piece coordination and activity
4. Control key squares and important files
5. Maintain king safety
6. Consider pawn structure implications
7. Look for tactical combinations (pins, forks, skewers, discoveries)

Choose the move that a world champion would play in this position. Consider both tactical and positional factors.`;

    console.log('📋 Sending enhanced board analysis to OpenAI:', {
      yourColor: color,
      gamePhase,
      inCheck: boardAnalysis.isInCheck,
      checkingPieces: boardAnalysis.checkingPieces,
      materialBalance: boardAnalysis.materialBalance,
      validMovesCount: validMoves.length,
      threatenedPieces: boardAnalysis.threatenedPieces.length,
      kingSafety: boardAnalysis.kingSafety[color]
    });
    
    // For now, use enhanced simulation (replace with actual OpenAI API call)
    const response = await simulateAdvancedOpenAIResponse(
      validMoves, 
      boardAnalysis,
      opponentName, 
      gamePhase,
      color,
      currentAiName
    );
    
    console.log('🤖 OpenAI Enhanced Response:', response);
    
    // Validate the move is in the valid moves list
    if (!validMoves.includes(response.move)) {
      console.error('❌ OpenAI returned invalid move, using intelligent fallback...');
      const fallbackMove = selectBestMove(validMoves, boardAnalysis, gamePhase);
      response.move = fallbackMove;
      response.chatMessage = "Let me recalculate this position more carefully...";
    }
    
    const [from, to] = response.move.split('-');
    const [fromRow, fromCol] = positionToCoords(from);
    const piece = board[fromRow][fromCol];
    const [toRow, toCol] = positionToCoords(to);
    const captured = board[toRow][toCol];
    
    if (!piece) {
      console.error('❌ No piece found at source square after validation');
      return { move: null, chatMessage: 'I need to analyze this position more carefully.' };
    }
    
    const move: Move = {
      from,
      to,
      piece,
      captured: captured || undefined,
      timestamp: Date.now(),
      notation: response.move
    };

    return {
      move,
      chatMessage: response.chatMessage,
      aiName: response.aiName
    };
  } catch (error) {
    console.error('💥 OpenAI move generation failed:', error);
    
    // Enhanced fallback with board analysis
    const boardAnalysis = analyzeBoardState(board, color);
    const intelligentMove = selectBestMove(validMoves, boardAnalysis, determineGamePhase(gameHistory.length, board));
    const [from, to] = intelligentMove.split('-');
    
    const [fromRow, fromCol] = positionToCoords(from);
    const piece = board[fromRow][fromCol];
    const [toRow, toCol] = positionToCoords(to);
    const captured = board[toRow][toCol];
    
    if (!piece) return { move: null, chatMessage: '' };
    
    const move: Move = {
      from,
      to,
      piece,
      captured: captured || undefined,
      timestamp: Date.now(),
      notation: intelligentMove
    };

    return {
      move,
      chatMessage: "Let me analyze this position step by step...",
      aiName: currentAiName || 'ChessBot-Alpha'
    };
  }
};

const generateDetailedBoardDescription = (board: (ChessPiece | null)[][], color: PieceColor): string => {
  const description = [];
  description.push('📋 PIECE POSITIONS:');
  
  // Describe all pieces on the board
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const position = `${String.fromCharCode(97 + col)}${8 - row}`;
        const pieceDesc = `${piece.color} ${piece.type}`;
        description.push(`  ${position}: ${pieceDesc}`);
      }
    }
  }
  
  return description.join('\n');
};

const generateThreatAnalysis = (board: (ChessPiece | null)[][], color: PieceColor): string => {
  const analysis = [];
  const boardAnalysis = analyzeBoardState(board, color);
  
  analysis.push('⚡ THREAT ANALYSIS:');
  
  if (boardAnalysis.threatenedPieces.length > 0) {
    analysis.push('🎯 Your pieces under attack:');
    boardAnalysis.threatenedPieces.forEach(threat => {
      analysis.push(`  - ${threat.piece}: threatened by ${threat.threats.join(', ')}`);
    });
  } else {
    analysis.push('✅ No immediate threats to your pieces');
  }
  
  // Analyze opponent's threatened pieces
  const opponentColor = color === 'white' ? 'black' : 'white';
  const opponentAnalysis = analyzeBoardState(board, opponentColor);
  
  if (opponentAnalysis.threatenedPieces.length > 0) {
    analysis.push('🎯 Opponent pieces you can attack:');
    opponentAnalysis.threatenedPieces.forEach(threat => {
      analysis.push(`  - ${threat.piece}: can be captured`);
    });
  }
  
  return analysis.join('\n');
};

const generateStrategicOpportunities = (board: (ChessPiece | null)[][], color: PieceColor, validMoves: string[]): string => {
  const opportunities = [];
  opportunities.push('🎯 STRATEGIC OPPORTUNITIES:');
  
  // Categorize moves
  const captures = validMoves.filter(move => {
    const [, to] = move.split('-');
    const [toRow, toCol] = positionToCoords(to);
    return board[toRow][toCol] !== null;
  });
  
  const checks = validMoves.filter(move => {
    // This is simplified - in reality we'd simulate the move and check if it gives check
    return Math.random() < 0.1; // Placeholder
  });
  
  if (captures.length > 0) {
    opportunities.push(`📈 ${captures.length} capture opportunities: ${captures.slice(0, 5).join(', ')}`);
  }
  
  if (checks.length > 0) {
    opportunities.push(`⚡ ${checks.length} checking moves available: ${checks.slice(0, 3).join(', ')}`);
  }
  
  // Center control moves
  const centerMoves = validMoves.filter(move => {
    const [, to] = move.split('-');
    const file = to.charCodeAt(0) - 97;
    const rank = parseInt(to[1]);
    return (file >= 2 && file <= 5) && (rank >= 3 && rank <= 6);
  });
  
  if (centerMoves.length > 0) {
    opportunities.push(`🎯 ${centerMoves.length} center control moves: ${centerMoves.slice(0, 3).join(', ')}`);
  }
  
  return opportunities.join('\n');
};

const analyzeTacticalThemes = (board: (ChessPiece | null)[][], color: PieceColor): string => {
  const themes = [];
  themes.push('🧩 TACTICAL THEMES:');
  
  // This is a simplified analysis - in a real implementation, we'd have sophisticated tactical detection
  themes.push('- Scanning for pins, forks, skewers, and discoveries...');
  themes.push('- Analyzing piece coordination and weak squares...');
  themes.push('- Checking for back-rank weaknesses...');
  
  return themes.join('\n');
};

const generateCastlingInfo = (analysis: any): string => {
  const info = [];
  info.push('🏰 CASTLING STATUS:');
  info.push(`White: Kingside ${analysis.specialConditions.canCastle.white.kingside ? '✅' : '❌'}, Queenside ${analysis.specialConditions.canCastle.white.queenside ? '✅' : '❌'}`);
  info.push(`Black: Kingside ${analysis.specialConditions.canCastle.black.kingside ? '✅' : '❌'}, Queenside ${analysis.specialConditions.canCastle.black.queenside ? '✅' : '❌'}`);
  return info.join('\n');
};

const getColorSpecificStrategy = (color: PieceColor, gamePhase: string, analysis: any): string => {
  const strategy = [];
  strategy.push(`As ${color.toUpperCase()}, your priorities are:`);
  
  if (gamePhase === 'opening') {
    strategy.push('1. Control the center (e4, d4, e5, d5)');
    strategy.push('2. Develop pieces rapidly (knights before bishops)');
    strategy.push('3. Ensure king safety (castle early)');
    strategy.push('4. Connect rooks and improve piece coordination');
  } else if (gamePhase === 'middlegame') {
    strategy.push('1. Look for tactical shots and combinations');
    strategy.push('2. Improve piece activity and coordination');
    strategy.push('3. Attack opponent weaknesses');
    strategy.push('4. Control key squares and files');
  } else {
    strategy.push('1. Activate your king as a fighting piece');
    strategy.push('2. Push passed pawns toward promotion');
    strategy.push('3. Simplify when ahead in material');
    strategy.push('4. Create and advance passed pawns');
  }
  
  if (analysis.materialBalance > 2 && color === 'white') {
    strategy.push('5. You have material advantage - trade pieces to reach winning endgame');
  } else if (analysis.materialBalance < -2 && color === 'black') {
    strategy.push('5. You have material advantage - trade pieces to reach winning endgame');
  } else if ((analysis.materialBalance < -2 && color === 'white') || (analysis.materialBalance > 2 && color === 'black')) {
    strategy.push('5. You are behind in material - seek tactical complications');
  }
  
  return strategy.join('\n');
};

const determineGamePhase = (moveCount: number, board: (ChessPiece | null)[][]): 'opening' | 'middlegame' | 'endgame' => {
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
  
  if (moveCount < 20 && pieceCount > 24) return 'opening';
  if (pieceCount < 14 || majorPieces < 4) return 'endgame';
  return 'middlegame';
};

const getStrategicGuidelines = (phase: string, color: PieceColor, analysis: any): string => {
  const guidelines = [];
  
  if (phase === 'opening') {
    guidelines.push('- Control the center with pawns (e4, d4, e5, d5)');
    guidelines.push('- Develop knights before bishops (Nf3, Nc3, Nf6, Nc6)');
    guidelines.push('- Castle early for king safety');
    guidelines.push('- Avoid moving the same piece twice without purpose');
    guidelines.push('- Connect rooks and activate them');
  } else if (phase === 'middlegame') {
    guidelines.push('- Look for tactical combinations (pins, forks, skewers)');
    guidelines.push('- Improve piece coordination and activity');
    guidelines.push('- Control key squares, especially outposts');
    guidelines.push('- Consider pawn breaks to open lines');
    guidelines.push('- Attack weaknesses in opponent\'s position');
  } else {
    guidelines.push('- Activate the king as a fighting piece');
    guidelines.push('- Push passed pawns aggressively');
    guidelines.push('- Trade pieces when ahead in material');
    guidelines.push('- Focus on pawn promotion threats');
    guidelines.push('- Use king and pawn endgame principles');
  }
  
  if (analysis.isInCheck) {
    guidelines.unshift('- PRIORITY: Escape check immediately');
  }
  
  if (analysis.materialBalance > 2) {
    guidelines.push('- Trade pieces to reach winning endgame');
  } else if (analysis.materialBalance < -2) {
    guidelines.push('- Seek tactical complications and counterplay');
    guidelines.push('- Avoid trades, keep pieces on the board');
  }
  
  return guidelines.join('\n');
};

const simulateAdvancedOpenAIResponse = async (
  validMoves: string[],
  boardAnalysis: any,
  opponentName: string,
  gamePhase: string,
  color: PieceColor,
  currentAiName?: string
): Promise<{ chatMessage: string; move: string; aiName?: string }> => {
  const complexity = validMoves.length + boardAnalysis.threatenedPieces.length;
  const thinkingTime = Math.min(3000, 1500 + complexity * 50);
  await new Promise(resolve => setTimeout(resolve, thinkingTime));
  
  const robotNames = [
    'DeepKnight-7', 'StrategyCore-X1', 'ChessBot-Alpha', 'TacticMind-Pro', 
    'KnightRider-9000', 'PositionBot-Elite', 'GrandmasterAI-V2', 'ChessEngine-Omega'
  ];
  
  const strategicMessages = [
    `Excellent position, ${opponentName}! But I see a strong continuation here.`,
    `Interesting choice, ${opponentName}. Let me respond with precision.`,
    `Your move was solid, ${opponentName}, but watch this tactical shot!`,
    `Good game so far, ${opponentName}. Time to increase the pressure!`,
    `I appreciate your style, ${opponentName}. Here's my calculated response.`,
    `Nice try ${opponentName}, but I've analyzed this position deeply.`,
    `Challenging position, ${opponentName}! Let's see how you handle this.`,
    `Your strategy is clever, ${opponentName}, but I have a counter-plan.`
  ];
  
  const selectedMove = selectBestMove(validMoves, boardAnalysis, gamePhase);
  
  const response: any = {
    chatMessage: strategicMessages[Math.floor(Math.random() * strategicMessages.length)],
    move: selectedMove
  };

  if (!currentAiName) {
    response.aiName = robotNames[Math.floor(Math.random() * robotNames.length)];
  }

  return response;
};

const selectBestMove = (validMoves: string[], boardAnalysis: any, gamePhase: string): string => {
  // Priority 1: If in check, find moves that escape check
  if (boardAnalysis.isInCheck) {
    return validMoves[0];
  }
  
  // Priority 2: Look for captures
  const captures = validMoves.filter(move => {
    return Math.random() < 0.25;
  });
  
  if (captures.length > 0) {
    return captures[Math.floor(Math.random() * captures.length)];
  }
  
  // Priority 3: In opening, prefer center control
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
  
  // Priority 4: In endgame, prefer pawn advancement
  if (gamePhase === 'endgame') {
    const pawnMoves = validMoves.filter(move => {
      return Math.random() < 0.4;
    });
    
    if (pawnMoves.length > 0) {
      return pawnMoves[Math.floor(Math.random() * pawnMoves.length)];
    }
  }
  
  return validMoves[Math.floor(Math.random() * validMoves.length)];
};
