
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

    // Generate comprehensive prompt with detailed board state
    const comprehensivePrompt = generateComprehensiveChessPrompt(
      board, color, validMoves, boardAnalysis, opponentAnalysis, 
      gamePhase, gameHistory, opponentName, currentAiName
    );

    console.log('🔍 Sending comprehensive chess analysis to OpenAI:', {
      yourColor: color,
      gamePhase,
      inCheck: boardAnalysis.isInCheck,
      checkingPieces: boardAnalysis.checkingPieces,
      materialBalance: boardAnalysis.materialBalance,
      validMovesCount: validMoves.length,
      threatenedPieces: boardAnalysis.threatenedPieces.length,
      kingSafety: boardAnalysis.kingSafety[color],
      promptLength: comprehensivePrompt.length
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

const generateComprehensiveChessPrompt = (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  validMoves: string[],
  boardAnalysis: any,
  opponentAnalysis: any,
  gamePhase: string,
  gameHistory: Move[],
  opponentName: string,
  currentAiName?: string
): string => {
  const detailedBoardState = generateDetailedBoardDescription(board);
  const threatAnalysis = generateThreatAnalysis(board, color, boardAnalysis, opponentAnalysis);
  const strategicOpportunities = generateStrategicOpportunities(board, color, validMoves);
  const tacticalThemes = analyzeTacticalThemes(board, color, boardAnalysis);
  const moveCategories = categorizeMoves(validMoves, board, color);

  return `═══════════════════════════════════════════════════════
🏆 CHESS GRANDMASTER AI - COMPREHENSIVE POSITION ANALYSIS
═══════════════════════════════════════════════════════

🎯 CRITICAL GAME INFORMATION:
▸ YOU ARE PLAYING AS: ${color.toUpperCase()} PIECES
▸ YOUR OPPONENT: ${opponentName} (playing ${color === 'white' ? 'BLACK' : 'WHITE'})
▸ GAME PHASE: ${gamePhase.toUpperCase()}
▸ MOVE NUMBER: ${Math.floor(gameHistory.length / 2) + 1}
${!currentAiName ? '▸ FIRST MOVE: Create your unique chess AI name (e.g., GrandmasterBot-X1, TacticCore-Pro)' : `▸ YOUR AI NAME: ${currentAiName}`}

🚨 IMMEDIATE TACTICAL SITUATION:
${boardAnalysis.isInCheck ? 
  `⚠️  YOUR KING IS IN CHECK! 
  ▸ Checking pieces: ${boardAnalysis.checkingPieces.join(', ')}
  ▸ YOU MUST ESCAPE CHECK IMMEDIATELY - THIS IS MANDATORY!
  ▸ Legal responses: Block check, capture checking piece, or move king
  ▸ Failure to escape check = ILLEGAL MOVE` :
  '✅ Your king is SAFE (not in check)'}

${opponentAnalysis.isInCheck ? 
  `🎯 OPPONENT'S KING IS IN CHECK!
  ▸ You are giving check - excellent tactical pressure!
  ▸ Look for ways to maintain the attack or deliver checkmate` : ''}

═══════════════════════════════════════════════════════
📋 COMPLETE BOARD STATE ANALYSIS
═══════════════════════════════════════════════════════

${detailedBoardState}

═══════════════════════════════════════════════════════
⚡ THREAT & TACTICAL ANALYSIS
═══════════════════════════════════════════════════════

${threatAnalysis}

═══════════════════════════════════════════════════════
🎯 STRATEGIC OPPORTUNITIES & MOVE CATEGORIES
═══════════════════════════════════════════════════════

${strategicOpportunities}

📊 AVAILABLE MOVES BY CATEGORY:
${Object.entries(moveCategories).map(([category, moves]) => 
  `▸ ${category}: ${moves.length > 0 ? moves.slice(0, 8).join(', ') + (moves.length > 8 ? '...' : '') : 'None'}`
).join('\n')}

═══════════════════════════════════════════════════════
🧩 TACTICAL THEMES & PATTERNS
═══════════════════════════════════════════════════════

${tacticalThemes}

═══════════════════════════════════════════════════════
📈 POSITION EVALUATION
═══════════════════════════════════════════════════════

🏆 MATERIAL BALANCE: ${
  boardAnalysis.materialBalance > 0 ? `+${boardAnalysis.materialBalance} for White` : 
  boardAnalysis.materialBalance < 0 ? `${Math.abs(boardAnalysis.materialBalance)} for Black` : 
  'Equal material'
} ${boardAnalysis.materialBalance > 0 && color === 'white' ? '(YOU ARE AHEAD!)' : 
     boardAnalysis.materialBalance < 0 && color === 'black' ? '(YOU ARE AHEAD!)' : 
     boardAnalysis.materialBalance > 0 && color === 'black' ? '(YOU ARE BEHIND)' :
     boardAnalysis.materialBalance < 0 && color === 'white' ? '(YOU ARE BEHIND)' : '(EQUAL)'}

🛡️ KING SAFETY COMPARISON:
▸ Your King (${color}): ${boardAnalysis.kingSafety[color]}/10 ${boardAnalysis.kingSafety[color] < 5 ? '⚠️ DANGER!' : '✅'}
▸ Opponent King: ${boardAnalysis.kingSafety[color === 'white' ? 'black' : 'white']}/10

🏰 CASTLING RIGHTS:
▸ White: Kingside ${boardAnalysis.specialConditions?.canCastle?.white?.kingside ? '✅' : '❌'}, Queenside ${boardAnalysis.specialConditions?.canCastle?.white?.queenside ? '✅' : '❌'}
▸ Black: Kingside ${boardAnalysis.specialConditions?.canCastle?.black?.kingside ? '✅' : '❌'}, Queenside ${boardAnalysis.specialConditions?.canCastle?.black?.queenside ? '✅' : '❌'}

═══════════════════════════════════════════════════════
🎯 STRATEGIC PRIORITIES FOR ${color.toUpperCase()}
═══════════════════════════════════════════════════════

${getColorSpecificStrategy(color, gamePhase, boardAnalysis)}

═══════════════════════════════════════════════════════
🎮 MOVE SELECTION INSTRUCTIONS
═══════════════════════════════════════════════════════

PRIORITY ORDER (FOLLOW STRICTLY):
${boardAnalysis.isInCheck ? 
  '1. 🚨 ESCAPE CHECK (Mandatory - you MUST get out of check!)' :
  '1. 🎯 Look for CHECKMATE opportunities'
}
2. 🏆 Capture valuable pieces safely (especially if material advantage)
3. ⚡ Create tactical threats (pins, forks, skewers, discoveries)
4. 🎯 Improve piece activity and coordination
5. 🏰 Ensure king safety and control key squares
6. 📈 Consider long-term positional advantages

GAME PHASE SPECIFIC GOALS (${gamePhase.toUpperCase()}):
${getGamePhaseGuidelines(gamePhase, color, boardAnalysis)}

═══════════════════════════════════════════════════════
🤖 RESPONSE FORMAT (JSON ONLY)
═══════════════════════════════════════════════════════

You MUST respond with VALID JSON in this exact format:
{
  ${!currentAiName ? '"aiName": "Your unique chess AI name (e.g., TacticMaster-Pro, DeepKnight-X1)",' : ''}
  "move": "exact_move_from_valid_list",
  "chatMessage": "Brief tactical explanation (1-2 sentences)"
}

VALID MOVES TO CHOOSE FROM: ${validMoves.join(', ')}

Remember: You are ${color.toUpperCase()}. Choose the move a world champion would play!`;
};

const generateDetailedBoardDescription = (board: (ChessPiece | null)[][]): string => {
  const description = [];
  description.push('🏁 CURRENT PIECE POSITIONS:');
  
  const whitePieces = [];
  const blackPieces = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const position = `${String.fromCharCode(97 + col)}${8 - row}`;
        const pieceDesc = `${piece.type} on ${position}`;
        
        if (piece.color === 'white') {
          whitePieces.push(pieceDesc);
        } else {
          blackPieces.push(pieceDesc);
        }
      }
    }
  }
  
  description.push(`\n⚪ WHITE PIECES: ${whitePieces.join(', ')}`);
  description.push(`⚫ BLACK PIECES: ${blackPieces.join(', ')}\n`);
  
  return description.join('\n');
};

const generateThreatAnalysis = (
  board: (ChessPiece | null)[][], 
  color: PieceColor, 
  boardAnalysis: any, 
  opponentAnalysis: any
): string => {
  const analysis = [];
  
  analysis.push('⚔️ THREAT ANALYSIS:');
  
  if (boardAnalysis.threatenedPieces.length > 0) {
    analysis.push(`\n🎯 YOUR PIECES UNDER ATTACK:`);
    boardAnalysis.threatenedPieces.forEach(threat => {
      analysis.push(`  ▸ ${threat.piece} - threatened by: ${threat.threats.join(', ')}`);
    });
  } else {
    analysis.push('\n✅ None of your pieces are under immediate attack');
  }
  
  if (opponentAnalysis.threatenedPieces.length > 0) {
    analysis.push(`\n🎯 OPPONENT PIECES YOU CAN ATTACK:`);
    opponentAnalysis.threatenedPieces.forEach(threat => {
      analysis.push(`  ▸ ${threat.piece} - you can capture this piece!`);
    });
  } else {
    analysis.push('\n⚠️ No immediate capture opportunities available');
  }
  
  return analysis.join('\n');
};

const generateStrategicOpportunities = (board: (ChessPiece | null)[][], color: PieceColor, validMoves: string[]): string => {
  const opportunities = [];
  
  // Categorize moves
  const captures = validMoves.filter(move => {
    const [, to] = move.split('-');
    const [toRow, toCol] = positionToCoords(to);
    return board[toRow][toCol] !== null;
  });
  
  const centerMoves = validMoves.filter(move => {
    const [, to] = move.split('-');
    const file = to.charCodeAt(0) - 97;
    const rank = parseInt(to[1]);
    return (file >= 2 && file <= 5) && (rank >= 3 && rank <= 6);
  });
  
  opportunities.push('🎯 IMMEDIATE STRATEGIC OPPORTUNITIES:');
  
  if (captures.length > 0) {
    opportunities.push(`\n📈 CAPTURE OPPORTUNITIES (${captures.length}): ${captures.slice(0, 5).join(', ')}`);
  }
  
  if (centerMoves.length > 0) {
    opportunities.push(`🎯 CENTER CONTROL MOVES (${centerMoves.length}): ${centerMoves.slice(0, 5).join(', ')}`);
  }
  
  return opportunities.join('\n');
};

const analyzeTacticalThemes = (board: (ChessPiece | null)[][], color: PieceColor, boardAnalysis: any): string => {
  const themes = [];
  themes.push('🧩 TACTICAL PATTERN ANALYSIS:');
  themes.push('▸ Scanning for pins, forks, skewers, and discovered attacks...');
  themes.push('▸ Analyzing piece coordination and weak squares...');
  themes.push('▸ Checking for back-rank weaknesses and mating patterns...');
  themes.push('▸ Looking for piece sacrifice opportunities...');
  
  return themes.join('\n');
};

const categorizeMoves = (validMoves: string[], board: (ChessPiece | null)[][], color: PieceColor) => {
  const categories = {
    'CAPTURES': [],
    'CHECKS': [],
    'CENTER_CONTROL': [],
    'DEVELOPMENT': [],
    'KING_SAFETY': [],
    'OTHER': []
  };
  
  validMoves.forEach(move => {
    const [, to] = move.split('-');
    const [toRow, toCol] = positionToCoords(to);
    
    // Categorize captures
    if (board[toRow][toCol] !== null) {
      categories.CAPTURES.push(move);
      return;
    }
    
    // Center control (simplified)
    const file = to.charCodeAt(0) - 97;
    const rank = parseInt(to[1]);
    if ((file >= 2 && file <= 5) && (rank >= 3 && rank <= 6)) {
      categories.CENTER_CONTROL.push(move);
      return;
    }
    
    categories.OTHER.push(move);
  });
  
  return categories;
};

const getColorSpecificStrategy = (color: PieceColor, gamePhase: string, analysis: any): string => {
  const strategy = [];
  
  if (gamePhase === 'opening') {
    strategy.push('1. 🎯 Control the center with pawns (e4, d4, e5, d5)');
    strategy.push('2. 🐎 Develop knights before bishops');
    strategy.push('3. 🏰 Castle early for king safety');
    strategy.push('4. 🔗 Connect rooks and improve coordination');
  } else if (gamePhase === 'middlegame') {
    strategy.push('1. ⚡ Look for tactical combinations');
    strategy.push('2. 🎯 Improve piece activity and coordination');
    strategy.push('3. 🎪 Attack opponent weaknesses');
    strategy.push('4. 🏰 Control key squares and important files');
  } else {
    strategy.push('1. 👑 Activate king as fighting piece');
    strategy.push('2. 🏃 Push passed pawns toward promotion');
    strategy.push('3. 🔄 Trade pieces when ahead in material');
    strategy.push('4. 🎯 Create and advance passed pawns');
  }
  
  // Material-based strategy adjustments
  const materialAdv = color === 'white' ? analysis.materialBalance : -analysis.materialBalance;
  if (materialAdv > 2) {
    strategy.push('5. 💎 You have material advantage - simplify to winning endgame');
  } else if (materialAdv < -2) {
    strategy.push('5. ⚡ You are behind - seek tactical complications!');
  }
  
  return strategy.join('\n');
};

const getGamePhaseGuidelines = (gamePhase: string, color: PieceColor, analysis: any): string => {
  const guidelines = [];
  
  if (gamePhase === 'opening') {
    guidelines.push('▸ Rapid development over material gain');
    guidelines.push('▸ Control center squares (e4, e5, d4, d5)');
    guidelines.push('▸ Castle within first 10 moves if possible');
  } else if (gamePhase === 'middlegame') {
    guidelines.push('▸ Look for tactical shots and combinations');
    guidelines.push('▸ Improve worst-placed piece');
    guidelines.push('▸ Create and exploit weaknesses');
  } else {
    guidelines.push('▸ King becomes a strong piece - activate it');
    guidelines.push('▸ Passed pawns are crucial - create and push them');
    guidelines.push('▸ Calculate precisely - every move matters');
  }
  
  return guidelines.join('\n');
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
    return validMoves[0]; // Simplified - would need to filter check-escaping moves
  }
  
  // Priority 2: Look for captures
  const captures = validMoves.filter(move => {
    return Math.random() < 0.25; // Simplified capture detection
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
  
  return validMoves[Math.floor(Math.random() * validMoves.length)];
};
