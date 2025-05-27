import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { getAllLegalMoves, validateGameState, isLegalMove } from './chessRuleEnforcement';
import { generateEnhancedMovePrompt, generateRetryPrompt } from './enhancedChessPrompts';
import { 
  generateAnalysisPrompt, 
  generateExplanationPrompt,
  generateHintPrompt
} from './chessPrompts';

interface OpenAIResponse {
  move: Move | null;
  chatMessage: string;
  aiName?: string;
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const getOpenAIMove = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  opponentName: string = 'Player',
  currentAiName?: string,
  retryCount: number = 0
): Promise<OpenAIResponse> => {
  console.log('🤖 OpenAI Move Request Started with Rule Enforcement');
  console.log('📊 Input Data:', {
    color,
    opponentName,
    currentAiName,
    gameHistoryLength: gameHistory.length,
    retryCount
  });

  // Use legal moves instead of basic valid moves
  const gameValidation = validateGameState(board, color);
  const legalMoves = gameValidation.legalMoves;
  
  console.log('✅ Game State Validation:', {
    isInCheck: gameValidation.isInCheck,
    isCheckmate: gameValidation.isCheckmate,
    isStalemate: gameValidation.isStalemate,
    legalMovesCount: legalMoves.length,
    gameOver: gameValidation.gameOver
  });
  
  // Handle game over scenarios
  if (gameValidation.gameOver) {
    console.log('🏁 Game Over Detected:', {
      checkmate: gameValidation.isCheckmate,
      stalemate: gameValidation.isStalemate,
      winner: gameValidation.winner
    });
    
    let gameOverMessage = '';
    if (gameValidation.isCheckmate) {
      gameOverMessage = `Checkmate! ${gameValidation.winner === color ? 'I lose' : 'I win'}!`;
    } else if (gameValidation.isStalemate) {
      gameOverMessage = 'Stalemate! The game is a draw.';
    }
    
    return { 
      move: null, 
      chatMessage: gameOverMessage,
      aiName: currentAiName 
    };
  }
  
  if (legalMoves.length === 0) {
    console.log('❌ No legal moves available');
    return { 
      move: null, 
      chatMessage: 'No legal moves available - this should not happen!',
      aiName: currentAiName 
    };
  }

  try {
    const prompt = generateEnhancedMovePrompt(board, color, gameHistory, legalMoves, opponentName, currentAiName);
    console.log('📝 Enhanced Rule-Aware Prompt Generated:', {
      promptLength: prompt.length,
      checksIncluded: prompt.includes('CHECK'),
      rulesEmphasized: prompt.includes('CRITICAL CHESS RULES')
    });

    const response = await callOpenAI(prompt);
    console.log('🔄 OpenAI Raw Response:', response);

    // Enhanced move validation with legal move checking
    const moveNotation = response.move;
    console.log('🎯 Enhanced Move Validation:', {
      receivedMove: moveNotation,
      isString: typeof moveNotation === 'string',
      hasCorrectFormat: typeof moveNotation === 'string' && moveNotation.includes('-'),
      isLegalMove: legalMoves.includes(moveNotation),
      totalLegalMoves: legalMoves.length
    });

    if (!moveNotation || typeof moveNotation !== 'string') {
      console.error('❌ Invalid move format from OpenAI:', moveNotation);
      
      if (retryCount < 2) {
        console.log('🔄 Retrying with rule violation correction...');
        return retryWithRuleViolation(board, color, gameHistory, legalMoves, moveNotation, 'Invalid move format - must be valid chess notation', opponentName, currentAiName, retryCount + 1);
      }
      
      return createFallbackMove(legalMoves, board, 'AI provided invalid move format. Using safe fallback move.', currentAiName);
    }

    if (!legalMoves.includes(moveNotation)) {
      console.error('❌ Move violates chess rules:', {
        receivedMove: moveNotation,
        isIllegal: !legalMoves.includes(moveNotation),
        wouldLeaveKingInCheck: !isLegalMove(board, moveNotation.split('-')[0], moveNotation.split('-')[1], color),
        legalAlternatives: legalMoves.slice(0, 5)
      });
      
      if (retryCount < 2) {
        console.log('🔄 Retrying with chess rule violation correction...');
        return retryWithRuleViolation(board, color, gameHistory, legalMoves, moveNotation, 'Move violates chess rules - would leave king in check or is otherwise illegal', opponentName, currentAiName, retryCount + 1);
      }
      
      return createFallbackMove(legalMoves, board, 'AI attempted illegal move. Chess rules enforced - using legal alternative.', currentAiName);
    }

    const move = createMoveFromNotation(moveNotation, board);
    console.log('✅ Legal Move Validated and Created:', {
      notation: moveNotation,
      moveCreated: !!move,
      followsChessRules: true
    });

    if (!move) {
      console.error('❌ Failed to create move object from legal notation:', moveNotation);
      
      if (retryCount < 2) {
        console.log('🔄 Retrying move object creation...');
        return retryWithRuleViolation(board, color, gameHistory, legalMoves, moveNotation, 'Failed to create move object from notation', opponentName, currentAiName, retryCount + 1);
      }
      
      return createFallbackMove(legalMoves, board, 'Move creation failed. Using legal fallback.', currentAiName);
    }

    console.log('🎉 Legal OpenAI Move Success:', {
      move: moveNotation,
      chatMessage: response.chatMessage,
      aiName: response.aiName || currentAiName,
      chesRulesEnforced: true
    });

    return {
      move,
      chatMessage: response.chatMessage,
      aiName: response.aiName || currentAiName
    };
  } catch (error) {
    console.error('💥 OpenAI API Error:', error);
    
    if (retryCount < 1) {
      console.log('🔄 Retrying after API error...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getOpenAIMove(board, color, gameHistory, opponentName, currentAiName, retryCount + 1);
    }
    
    return createFallbackMove(legalMoves, board, 'AI temporarily unavailable. Using legal fallback move.', currentAiName);
  }
};

const retryWithRuleViolation = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  legalMoves: string[],
  invalidMove: string,
  reason: string,
  opponentName: string,
  currentAiName: string | undefined,
  retryCount: number
): Promise<OpenAIResponse> => {
  console.log('🔄 Retrying with chess rule violation correction:', { invalidMove, reason, retryCount });
  
  const correctionPrompt = generateRetryPrompt(invalidMove, reason, board, color, legalMoves);
  console.log('📝 Rule Violation Correction Prompt:', correctionPrompt.substring(0, 300) + '...');
  
  try {
    const response = await callOpenAI(correctionPrompt);
    const moveNotation = response.move;
    
    if (moveNotation && legalMoves.includes(moveNotation)) {
      const move = createMoveFromNotation(moveNotation, board);
      if (move) {
        console.log('✅ Rule violation correction successful:', moveNotation);
        return {
          move,
          chatMessage: response.chatMessage || 'Corrected to legal move following chess rules.',
          aiName: currentAiName
        };
      }
    }
    
    console.error('❌ Rule violation correction failed, using fallback');
    return createFallbackMove(legalMoves, board, 'Could not correct rule violation. Using legal fallback move.', currentAiName);
  } catch (error) {
    console.error('💥 Rule violation correction attempt failed:', error);
    return createFallbackMove(legalMoves, board, 'Error in rule correction. Using legal fallback move.', currentAiName);
  }
};

export const getPositionAnalysis = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[]
): Promise<string> => {
  console.log('📊 Position Analysis Request:', { color, historyLength: gameHistory.length });
  
  try {
    const prompt = generateAnalysisPrompt(board, color, gameHistory);
    console.log('📝 Analysis Prompt Generated:', prompt.substring(0, 100) + '...');
    
    const response = await callOpenAI(prompt, false);
    console.log('✅ Analysis Response:', response);
    
    return response.analysis || 'Position analysis unavailable.';
  } catch (error) {
    console.error('❌ Analysis Error:', error);
    return 'Unable to analyze position at this time.';
  }
};

export const getMoveExplanation = async (
  move: string,
  board: (ChessPiece | null)[][],
  gameHistory: Move[]
): Promise<string> => {
  console.log('💭 Move Explanation Request:', { move, historyLength: gameHistory.length });
  
  try {
    const prompt = generateExplanationPrompt(move, board, gameHistory);
    console.log('📝 Explanation Prompt Generated:', prompt.substring(0, 100) + '...');
    
    const response = await callOpenAI(prompt, false);
    console.log('✅ Explanation Response:', response);
    
    return response.explanation || 'Move explanation unavailable.';
  } catch (error) {
    console.error('❌ Explanation Error:', error);
    return 'Unable to explain move at this time.';
  }
};

export const getHint = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  validMoves: string[]
): Promise<string> => {
  console.log('💡 Hint Request:', { color, validMovesCount: validMoves.length });
  
  try {
    const prompt = generateHintPrompt(board, color, validMoves);
    console.log('📝 Hint Prompt Generated:', prompt.substring(0, 100) + '...');
    
    const response = await callOpenAI(prompt, false);
    console.log('✅ Hint Response:', response);
    
    return response.hint || 'No hint available.';
  } catch (error) {
    console.error('❌ Hint Error:', error);
    return 'Unable to provide hint at this time.';
  }
};

const callOpenAI = async (prompt: string, expectJSON: boolean = true): Promise<any> => {
  console.log('🔄 OpenAI API Call Starting:', {
    expectJSON,
    promptLength: prompt.length,
    timestamp: new Date().toISOString()
  });

  // Check for API key - for now simulate the call
  const apiKey = localStorage.getItem('openai_api_key');
  
  if (!apiKey) {
    console.log('⚠️ No API key found, using enhanced simulation');
    return simulateOpenAICall(prompt, expectJSON);
  }

  try {
    console.log('📡 Making real OpenAI API call...');
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional chess grandmaster AI that ALWAYS follows chess rules. Never suggest illegal moves. Always respond with valid JSON format as requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📤 OpenAI API Response:', data);
    
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    try {
      const parsed = JSON.parse(content);
      console.log('✅ Parsed OpenAI Response:', parsed);
      return parsed;
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      return simulateOpenAICall(prompt, expectJSON);
    }
  } catch (error) {
    console.error('💥 Real OpenAI API Error:', error);
    console.log('🔄 Falling back to enhanced simulation');
    return simulateOpenAICall(prompt, expectJSON);
  }
};

const simulateOpenAICall = async (prompt: string, expectJSON: boolean): Promise<any> => {
  console.log('🎭 Simulating OpenAI API Call with Rule Awareness');
  
  // Simulate realistic thinking time
  const thinkingTime = 1500 + Math.random() * 2000;
  console.log(`⏳ Simulating thinking time: ${Math.round(thinkingTime)}ms`);
  
  await new Promise(resolve => setTimeout(resolve, thinkingTime));
  
  if (expectJSON) {
    // Extract legal moves from prompt to ensure we return a legal move
    const legalMovesMatch = prompt.match(/LEGAL MOVES AVAILABLE:\s*([^\n]+)/);
    const legalMoves = legalMovesMatch ? legalMovesMatch[1].split(', ').filter(m => m.includes('-')) : ['e2-e4'];
    
    // Prioritize moves based on context
    let selectedMove = legalMoves[0];
    
    // Check for urgent situations in prompt
    if (prompt.includes('CHECK') || prompt.includes('CHECKMATE')) {
      console.log('🚨 Detected check/mate situation, selecting escape move');
      selectedMove = legalMoves[0]; // First move should be a legal escape
    } else if (prompt.includes('THREATENED')) {
      console.log('⚠️ Detected threats, selecting defensive move');
      selectedMove = legalMoves[Math.floor(Math.random() * Math.min(3, legalMoves.length))];
    } else {
      selectedMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
    
    const response = {
      move: selectedMove,
      chatMessage: generateContextualChatMessage(prompt),
      aiName: 'ChessGPT-RuleEnforced'
    };
    
    console.log('📤 Simulated Legal JSON Response:', response);
    return response;
  } else {
    const response = {
      analysis: 'The position shows complex tactical and strategic elements requiring careful evaluation while following chess rules.',
      explanation: 'This move addresses the current position\'s requirements while maintaining rule compliance.',
      hint: 'Focus on legal moves that ensure king safety while looking for tactical opportunities.'
    };
    
    console.log('📤 Simulated Rule-Aware Text Response:', response);
    return response;
  }
};

const generateContextualChatMessage = (prompt: string): string => {
  if (prompt.includes('CHECKMATE')) {
    return 'This is checkmate - the game is over!';
  }
  if (prompt.includes('CHECK')) {
    return 'Escaping check with the only legal move available.';
  }
  if (prompt.includes('THREATENED')) {
    return 'Addressing the threats while maintaining legal play.';
  }
  if (prompt.includes('Opening')) {
    return 'Developing pieces according to opening principles and chess rules.';
  }
  if (prompt.includes('Endgame')) {
    return 'Focusing on endgame technique while respecting all chess rules.';
  }
  
  const messages = [
    'A solid positional move that follows all chess rules.',
    'This legal move maintains balance while creating pressure.',
    'Centralizing my pieces with a rule-compliant move.',
    'A strategic move that respects chess principles.',
    'Improving my position while ensuring king safety.'
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};

const createMoveFromNotation = (notation: string, board: (ChessPiece | null)[][]): Move | null => {
  console.log('🔧 Creating Move Object:', { notation });
  
  const parts = notation.split('-');
  if (parts.length !== 2) {
    console.error('❌ Invalid notation format:', notation);
    return null;
  }
  
  const [from, to] = parts;
  console.log('📍 Move Coordinates:', { from, to });
  
  // Validate square notation
  if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) {
    console.error('❌ Invalid square notation:', { from, to });
    return null;
  }
  
  const [fromCol, fromRow] = [from.charCodeAt(0) - 97, 8 - parseInt(from[1])];
  const [toCol, toRow] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
  
  console.log('🎯 Board Indices:', {
    from: { row: fromRow, col: fromCol },
    to: { row: toRow, col: toCol }
  });
  
  // Validate board indices
  if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7 ||
      toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
    console.error('❌ Invalid board indices');
    return null;
  }
  
  const piece = board[fromRow]?.[fromCol];
  const captured = board[toRow]?.[toCol];
  
  console.log('♟️ Piece Information:', {
    piece: piece ? `${piece.color} ${piece.type}` : 'none',
    captured: captured ? `${captured.color} ${captured.type}` : 'none'
  });
  
  if (!piece) {
    console.error('❌ No piece found at source square:', from);
    return null;
  }
  
  const move: Move = {
    from,
    to,
    piece,
    captured: captured || undefined,
    timestamp: Date.now(),
    notation
  };
  
  console.log('✅ Move Object Created:', move);
  return move;
};

const createFallbackMove = (
  legalMoves: string[],
  board: (ChessPiece | null)[][],
  message: string,
  aiName?: string
): OpenAIResponse => {
  console.log('🚨 Creating Legal Fallback Move:', {
    legalMovesCount: legalMoves.length,
    message,
    aiName
  });
  
  const randomLegalMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
  console.log('🎲 Selected Random Legal Move:', randomLegalMove);
  
  const move = createMoveFromNotation(randomLegalMove, board);
  
  const response = {
    move,
    chatMessage: message,
    aiName: aiName || 'ChessBot-RuleEnforced'
  };
  
  console.log('✅ Legal Fallback Response Created:', response);
  return response;
};
