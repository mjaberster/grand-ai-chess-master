import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { getAllValidMoves } from './chessLogic';
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
  console.log('🤖 OpenAI Move Request Started');
  console.log('📊 Input Data:', {
    color,
    opponentName,
    currentAiName,
    gameHistoryLength: gameHistory.length,
    retryCount,
    boardState: board.map(row => row.map(piece => piece ? `${piece.color[0]}${piece.type[0]}` : '.')).join('')
  });

  const validMoves = getAllValidMoves(board, color);
  console.log('✅ Valid Moves Generated:', {
    count: validMoves.length,
    moves: validMoves.length <= 10 ? validMoves : validMoves.slice(0, 10).concat([`... and ${validMoves.length - 10} more`])
  });
  
  if (validMoves.length === 0) {
    console.log('❌ No valid moves available - game over');
    return { move: null, chatMessage: 'No valid moves available - game over.' };
  }

  try {
    const prompt = generateEnhancedMovePrompt(board, color, gameHistory, validMoves, opponentName, currentAiName);
    console.log('📝 Enhanced Prompt Generated:', {
      promptLength: prompt.length,
      preview: prompt.substring(0, 300) + '...'
    });

    const response = await callOpenAI(prompt);
    console.log('🔄 OpenAI Raw Response:', response);

    // Enhanced move validation with detailed logging
    const moveNotation = response.move;
    console.log('🎯 Move Validation:', {
      receivedMove: moveNotation,
      expectedFormat: 'from-to (e.g., e2-e4)',
      isValidFormat: typeof moveNotation === 'string' && moveNotation.includes('-'),
      isInValidList: validMoves.includes(moveNotation)
    });

    if (!moveNotation || typeof moveNotation !== 'string') {
      console.error('❌ Invalid move format from OpenAI:', moveNotation);
      
      if (retryCount < 2) {
        console.log('🔄 Retrying with correction prompt...');
        return retryWithCorrection(board, color, gameHistory, validMoves, moveNotation, 'Invalid move format', opponentName, currentAiName, retryCount + 1);
      }
      
      return createFallbackMove(validMoves, board, 'Invalid move format received. Using fallback move.', currentAiName);
    }

    if (!validMoves.includes(moveNotation)) {
      console.error('❌ Move not in valid moves list:', {
        receivedMove: moveNotation,
        validMovesCount: validMoves.length,
        isInList: validMoves.includes(moveNotation),
        similarMoves: validMoves.filter(m => 
          m.includes(moveNotation.split('-')[0]) || 
          m.includes(moveNotation.split('-')[1])
        )
      });
      
      if (retryCount < 2) {
        console.log('🔄 Retrying with correction prompt...');
        return retryWithCorrection(board, color, gameHistory, validMoves, moveNotation, 'Move not in valid moves list', opponentName, currentAiName, retryCount + 1);
      }
      
      return createFallbackMove(validMoves, board, 'Invalid move received. Let me recalculate...', currentAiName);
    }

    const move = createMoveFromNotation(moveNotation, board);
    console.log('✅ Move Creation Result:', {
      notation: moveNotation,
      moveCreated: !!move,
      moveDetails: move ? {
        from: move.from,
        to: move.to,
        piece: `${move.piece.color} ${move.piece.type}`,
        captured: move.captured ? `${move.captured.color} ${move.captured.type}` : 'none'
      } : null
    });

    if (!move) {
      console.error('❌ Failed to create move object from notation:', moveNotation);
      
      if (retryCount < 2) {
        console.log('🔄 Retrying with correction prompt...');
        return retryWithCorrection(board, color, gameHistory, validMoves, moveNotation, 'Failed to create move object', opponentName, currentAiName, retryCount + 1);
      }
      
      return createFallbackMove(validMoves, board, 'Move creation failed. Using fallback.', currentAiName);
    }

    console.log('🎉 OpenAI Move Success:', {
      move: moveNotation,
      chatMessage: response.chatMessage,
      aiName: response.aiName || currentAiName
    });

    return {
      move,
      chatMessage: response.chatMessage,
      aiName: response.aiName || currentAiName
    };
  } catch (error) {
    console.error('💥 OpenAI API Error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      retryCount
    });
    
    if (retryCount < 1) {
      console.log('🔄 Retrying after API error...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getOpenAIMove(board, color, gameHistory, opponentName, currentAiName, retryCount + 1);
    }
    
    return createFallbackMove(validMoves, board, 'AI temporarily unavailable. Using fallback move.', currentAiName);
  }
};

const retryWithCorrection = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  validMoves: string[],
  invalidMove: string,
  reason: string,
  opponentName: string,
  currentAiName: string | undefined,
  retryCount: number
): Promise<OpenAIResponse> => {
  console.log('🔄 Retrying with correction:', { invalidMove, reason, retryCount });
  
  const correctionPrompt = generateRetryPrompt(invalidMove, reason, board, color, validMoves);
  console.log('📝 Correction Prompt:', correctionPrompt.substring(0, 200) + '...');
  
  try {
    const response = await callOpenAI(correctionPrompt);
    const moveNotation = response.move;
    
    if (moveNotation && validMoves.includes(moveNotation)) {
      const move = createMoveFromNotation(moveNotation, board);
      if (move) {
        console.log('✅ Correction successful:', moveNotation);
        return {
          move,
          chatMessage: response.chatMessage || 'Corrected move selected.',
          aiName: currentAiName
        };
      }
    }
    
    console.error('❌ Correction failed, using fallback');
    return createFallbackMove(validMoves, board, 'Correction failed. Using fallback move.', currentAiName);
  } catch (error) {
    console.error('💥 Correction attempt failed:', error);
    return createFallbackMove(validMoves, board, 'Error in correction. Using fallback move.', currentAiName);
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
    console.log('⚠️ No API key found, using simulation');
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
            content: 'You are a professional chess grandmaster AI. Always respond with valid JSON format as requested.'
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
    console.log('🔄 Falling back to simulation');
    return simulateOpenAICall(prompt, expectJSON);
  }
};

const simulateOpenAICall = async (prompt: string, expectJSON: boolean): Promise<any> => {
  console.log('🎭 Simulating OpenAI API Call');
  
  // Simulate realistic thinking time
  const thinkingTime = 1500 + Math.random() * 2000;
  console.log(`⏳ Simulating thinking time: ${Math.round(thinkingTime)}ms`);
  
  await new Promise(resolve => setTimeout(resolve, thinkingTime));
  
  if (expectJSON) {
    // Extract valid moves from prompt to ensure we return a valid move
    const validMovesMatch = prompt.match(/AVAILABLE MOVES:\s*([^\n]+)/);
    const validMoves = validMovesMatch ? validMovesMatch[1].split(', ').filter(m => m.includes('-')) : ['e2-e4'];
    
    // Prioritize moves based on context
    let selectedMove = validMoves[0];
    
    // Check for urgent situations in prompt
    if (prompt.includes('CHECK') || prompt.includes('THREATENED')) {
      console.log('🚨 Detected urgent situation, selecting defensive move');
      // In a real implementation, this would analyze the moves more intelligently
      selectedMove = validMoves[Math.floor(Math.random() * Math.min(3, validMoves.length))];
    } else {
      selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    const response = {
      move: selectedMove,
      chatMessage: generateContextualChatMessage(prompt),
      aiName: 'ChessGPT-Enhanced'
    };
    
    console.log('📤 Simulated JSON Response:', response);
    return response;
  } else {
    const response = {
      analysis: 'The position shows complex tactical and strategic elements requiring careful evaluation.',
      explanation: 'This move addresses the current position\'s tactical requirements while maintaining strategic balance.',
      hint: 'Focus on piece safety and coordination while looking for tactical opportunities.'
    };
    
    console.log('📤 Simulated Text Response:', response);
    return response;
  }
};

const generateContextualChatMessage = (prompt: string): string => {
  if (prompt.includes('CHECK')) {
    return 'Escaping check with the safest available move.';
  }
  if (prompt.includes('THREATENED')) {
    return 'Addressing the threats to my pieces while maintaining position.';
  }
  if (prompt.includes('Opening')) {
    return 'Developing pieces according to opening principles.';
  }
  if (prompt.includes('Endgame')) {
    return 'Focusing on endgame technique and king activity.';
  }
  
  const messages = [
    'A solid positional move that improves my piece coordination.',
    'This move maintains the balance while creating subtle pressure.',
    'Centralizing my pieces for better control of key squares.',
    'A strategic move that prepares for the next phase of the game.',
    'Improving my position while keeping tactical vigilance.'
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
  validMoves: string[],
  board: (ChessPiece | null)[][],
  message: string,
  aiName?: string
): OpenAIResponse => {
  console.log('🚨 Creating Fallback Move:', {
    validMovesCount: validMoves.length,
    message,
    aiName
  });
  
  const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
  console.log('🎲 Selected Random Move:', randomMove);
  
  const move = createMoveFromNotation(randomMove, board);
  
  const response = {
    move,
    chatMessage: message,
    aiName: aiName || 'ChessBot-Backup'
  };
  
  console.log('✅ Fallback Response Created:', response);
  return response;
};
