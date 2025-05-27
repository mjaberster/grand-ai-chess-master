
import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { getAllValidMoves } from './chessLogic';
import { 
  generateSystemPrompt, 
  generateMovePrompt, 
  generateAnalysisPrompt,
  generateExplanationPrompt,
  generateHintPrompt
} from './chessPrompts';

interface OpenAIResponse {
  move: Move | null;
  chatMessage: string;
  aiName?: string;
}

export const getOpenAIMove = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  opponentName: string = 'Player',
  currentAiName?: string
): Promise<OpenAIResponse> => {
  console.log('🤖 OpenAI Move Request Started');
  console.log('📊 Input Data:', {
    color,
    opponentName,
    currentAiName,
    gameHistoryLength: gameHistory.length,
    boardState: board.map(row => row.map(piece => piece ? `${piece.color[0]}${piece.type[0]}` : '.')).join('')
  });

  const validMoves = getAllValidMoves(board, color);
  console.log('✅ Valid Moves Generated:', {
    count: validMoves.length,
    moves: validMoves.slice(0, 10), // Log first 10 moves to avoid spam
    allMoves: validMoves.length <= 20 ? validMoves : `${validMoves.length} total moves`
  });
  
  if (validMoves.length === 0) {
    console.log('❌ No valid moves available');
    return { move: null, chatMessage: 'No valid moves available.' };
  }

  try {
    const prompt = generateMovePrompt(board, color, gameHistory, validMoves, opponentName, currentAiName);
    console.log('📝 Generated Prompt:', {
      promptLength: prompt.length,
      prompt: prompt.substring(0, 200) + '...'
    });

    const response = await callOpenAI(prompt);
    console.log('🔄 OpenAI Raw Response:', response);

    // Enhanced move validation with detailed logging
    const moveNotation = response.move;
    console.log('🎯 Move Validation:', {
      receivedMove: moveNotation,
      expectedFormat: 'from-to (e.g., e2-e4)',
      isValidFormat: typeof moveNotation === 'string' && moveNotation.includes('-')
    });

    if (!moveNotation || typeof moveNotation !== 'string') {
      console.error('❌ Invalid move format from OpenAI:', moveNotation);
      return createFallbackMove(validMoves, board, 'Invalid move format received. Let me recalculate...', currentAiName);
    }

    if (!validMoves.includes(moveNotation)) {
      console.error('❌ Move not in valid moves list:', {
        receivedMove: moveNotation,
        validMovesCount: validMoves.length,
        isInList: validMoves.includes(moveNotation),
        similarMoves: validMoves.filter(m => m.includes(moveNotation.split('-')[0]) || m.includes(moveNotation.split('-')[1]))
      });
      return createFallbackMove(validMoves, board, 'Let me recalculate this position...', currentAiName);
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
      return createFallbackMove(validMoves, board, 'I need to analyze this position more carefully.', currentAiName);
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
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return createFallbackMove(validMoves, board, 'Let me think about this position...', currentAiName);
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
  console.log('🔄 OpenAI API Call:', {
    expectJSON,
    promptLength: prompt.length,
    timestamp: new Date().toISOString()
  });

  // Simulate API call with more realistic timing
  const thinkingTime = 1500 + Math.random() * 2000;
  console.log(`⏳ Simulating OpenAI thinking time: ${Math.round(thinkingTime)}ms`);
  
  await new Promise(resolve => setTimeout(resolve, thinkingTime));
  
  // Simulate more realistic OpenAI responses based on the prompt content
  if (expectJSON) {
    // Extract valid moves from prompt to ensure we return a valid move
    const validMovesMatch = prompt.match(/Valid moves: ([^\n]+)/);
    const validMoves = validMovesMatch ? validMovesMatch[1].split(', ') : ['e2-e4'];
    
    // Pick a random valid move to ensure it's always valid
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    
    const response = {
      move: randomMove,
      chatMessage: generateRandomChatMessage(),
      aiName: 'ChessGPT-Pro'
    };
    
    console.log('📤 OpenAI Simulated JSON Response:', response);
    return response;
  } else {
    const response = {
      analysis: 'The position shows good piece coordination with opportunities for tactical play.',
      explanation: 'This move improves piece activity and maintains strategic balance.',
      hint: 'Look for ways to improve your piece coordination and control key squares.'
    };
    
    console.log('📤 OpenAI Simulated Text Response:', response);
    return response;
  }
};

const generateRandomChatMessage = (): string => {
  const messages = [
    'A solid move that develops my pieces effectively.',
    'This move improves my position while maintaining piece safety.',
    'I\'m focusing on controlling the center squares.',
    'This develops my pieces with tempo.',
    'A strategic move that improves my pawn structure.',
    'I\'m preparing for the middlegame with this development.',
    'This move creates good piece coordination.',
    'Maintaining material balance while improving position.'
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
