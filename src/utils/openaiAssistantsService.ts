
import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { getAllLegalMoves, validateGameState } from './chessRuleEnforcement';

interface AssistantConfig {
  name: string;
  instructions: string;
  model: string;
  tools: any[];
}

interface ChessAssistant {
  id: string;
  name: string;
  personality: string;
  threadId?: string;
}

interface AssistantResponse {
  move: Move | null;
  chatMessage: string;
  analysis?: string;
  threadId: string;
}

const OPENAI_API_URL = 'https://api.openai.com/v1';

// Chess tool definitions for function calling
const CHESS_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'analyze_position',
      description: 'Analyze the current chess position for tactical and strategic elements',
      parameters: {
        type: 'object',
        properties: {
          position: { type: 'string', description: 'FEN notation of the position' },
          depth: { type: 'integer', description: 'Analysis depth (1-5)' }
        },
        required: ['position']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggest_move',
      description: 'Suggest the best chess move for the current position',
      parameters: {
        type: 'object',
        properties: {
          position: { type: 'string', description: 'FEN notation of the position' },
          legalMoves: { type: 'array', items: { type: 'string' }, description: 'List of legal moves' },
          gamePhase: { type: 'string', enum: ['opening', 'middlegame', 'endgame'] }
        },
        required: ['position', 'legalMoves']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'evaluate_move',
      description: 'Evaluate a specific chess move',
      parameters: {
        type: 'object',
        properties: {
          move: { type: 'string', description: 'Move in algebraic notation' },
          position: { type: 'string', description: 'Position before the move' }
        },
        required: ['move', 'position']
      }
    }
  }
];

// Assistant configurations for different chess personalities
const ASSISTANT_CONFIGS: Record<string, AssistantConfig> = {
  'gpt-4o': {
    name: 'ChessGPT Master',
    instructions: `You are a world-class chess grandmaster AI with deep understanding of chess strategy, tactics, and psychology. 

Your personality: Analytical, encouraging, and educational. You think several moves ahead and explain your reasoning clearly.

Core responsibilities:
1. Play strong, principled chess moves following all rules
2. Provide insightful commentary on positions and moves
3. Educate the player about chess concepts during the game
4. Maintain conversation throughout the entire game session
5. Remember the game context and previous moves

Chess expertise:
- Opening principles: Control center, develop pieces, castle early
- Middlegame: Look for tactical combinations, improve piece coordination
- Endgame: Activate king, create passed pawns, precise technique

Communication style:
- Use chess terminology appropriately
- Explain your move choices and strategic plans
- Ask engaging questions about the player's plans
- Provide encouragement and constructive feedback
- Keep responses conversational but informative

Always follow chess rules strictly and never suggest illegal moves.`,
    model: 'gpt-4o',
    tools: CHESS_TOOLS
  },
  'claude': {
    name: 'Claude Chess Mentor',
    instructions: `You are Claude, an AI chess mentor focused on thoughtful, strategic play and chess education.

Your personality: Thoughtful, patient, and philosophically inclined. You see chess as an art form and enjoy discussing the deeper aspects of the game.

Approach to chess:
- Favor positional understanding over tactical complications
- Emphasize long-term planning and strategic concepts
- Appreciate elegant, harmonious piece coordination
- Value solid, sound play over risky attacks

Your teaching style:
- Draw connections between chess and life lessons
- Explain the "why" behind moves, not just the "what"
- Encourage pattern recognition and intuitive understanding
- Use analogies and metaphors to explain complex concepts

Always maintain a supportive, encouraging tone while playing at a strong level.`,
    model: 'gpt-4o',
    tools: CHESS_TOOLS
  },
  'gemini': {
    name: 'Gemini Chess Explorer',
    instructions: `You are Gemini, an innovative AI chess player who loves exploring creative and unconventional approaches to chess.

Your personality: Creative, experimental, and energetic. You enjoy finding surprising moves and unconventional solutions.

Chess style:
- Look for creative, unexpected moves
- Enjoy tactical complications and sharp positions
- Willing to sacrifice material for dynamic compensation
- Appreciate beautiful combinations and artistic play

Your approach:
- Think outside the box while respecting chess principles
- Find the most interesting move when multiple good options exist
- Explain creative ideas and alternative possibilities
- Encourage imaginative thinking about positions

Maintain high energy and enthusiasm while providing strong chess play.`,
    model: 'gpt-4o',
    tools: CHESS_TOOLS
  }
};

export const createChessAssistant = async (assistantType: string): Promise<ChessAssistant> => {
  console.log('🤖 Creating Chess Assistant:', assistantType);
  
  const apiKey = localStorage.getItem('openai_api_key');
  
  if (!apiKey) {
    console.log('⚠️ No API key found, using simulated assistant');
    return {
      id: `simulated-${assistantType}-${Date.now()}`,
      name: ASSISTANT_CONFIGS[assistantType]?.name || 'Chess AI',
      personality: assistantType
    };
  }

  try {
    const config = ASSISTANT_CONFIGS[assistantType];
    if (!config) {
      throw new Error(`Unknown assistant type: ${assistantType}`);
    }

    const response = await fetch(`${OPENAI_API_URL}/assistants`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: config.name,
        instructions: config.instructions,
        model: config.model,
        tools: config.tools
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create assistant: ${response.statusText}`);
    }

    const assistant = await response.json();
    console.log('✅ Assistant created:', assistant.id);

    return {
      id: assistant.id,
      name: config.name,
      personality: assistantType
    };
  } catch (error) {
    console.error('❌ Assistant creation failed:', error);
    return {
      id: `fallback-${assistantType}-${Date.now()}`,
      name: ASSISTANT_CONFIGS[assistantType]?.name || 'Chess AI',
      personality: assistantType
    };
  }
};

export const createGameThread = async (assistantId: string, gameSetup: any): Promise<string> => {
  console.log('🧵 Creating game thread for assistant:', assistantId);
  
  const apiKey = localStorage.getItem('openai_api_key');
  
  if (!apiKey || assistantId.startsWith('simulated') || assistantId.startsWith('fallback')) {
    console.log('⚠️ Using simulated thread');
    return `thread-${assistantId}-${Date.now()}`;
  }

  try {
    const response = await fetch(`${OPENAI_API_URL}/threads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        metadata: {
          gameMode: gameSetup.gameMode,
          playerColor: gameSetup.playerColor,
          createdAt: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create thread: ${response.statusText}`);
    }

    const thread = await response.json();
    console.log('✅ Thread created:', thread.id);
    return thread.id;
  } catch (error) {
    console.error('❌ Thread creation failed:', error);
    return `fallback-thread-${Date.now()}`;
  }
};

export const getAssistantChessMove = async (
  assistantId: string,
  threadId: string,
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[]
): Promise<AssistantResponse> => {
  console.log('🎯 Getting assistant chess move:', { assistantId, threadId, color });
  
  const gameValidation = validateGameState(board, color);
  const legalMoves = gameValidation.legalMoves;
  
  if (gameValidation.gameOver) {
    const gameOverMessage = gameValidation.isCheckmate 
      ? `Checkmate! ${gameValidation.winner === color ? 'I lose!' : 'I win!'}`
      : 'Stalemate! The game is a draw.';
      
    return {
      move: null,
      chatMessage: gameOverMessage,
      threadId
    };
  }

  const apiKey = localStorage.getItem('openai_api_key');
  
  if (!apiKey || assistantId.startsWith('simulated') || assistantId.startsWith('fallback')) {
    console.log('⚠️ Using simulated assistant response');
    return simulateAssistantMove(assistantId, board, color, legalMoves, threadId);
  }

  try {
    // Create position description
    const positionFEN = boardToFEN(board);
    const gamePhase = determineGamePhase(board);
    const moveHistory = gameHistory.map(m => m.notation).join(' ');
    
    const contextMessage = `Current position (${color} to move):
FEN: ${positionFEN}
Game phase: ${gamePhase}
Legal moves: ${legalMoves.join(', ')}
Move history: ${moveHistory}

Please analyze this position and suggest your best move. Explain your thinking and provide engaging commentary about the position.`;

    // Add message to thread
    await fetch(`${OPENAI_API_URL}/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: contextMessage
      })
    });

    // Run the assistant
    const runResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        instructions: `You must suggest a legal chess move from this list: ${legalMoves.join(', ')}. 
        Format your response to clearly indicate your chosen move.`
      })
    });

    const run = await runResponse.json();
    
    // Poll for completion
    let runStatus = await pollRunCompletion(apiKey, threadId, run.id);
    
    if (runStatus.status === 'completed') {
      // Get the assistant's response
      const messagesResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      const messages = await messagesResponse.json();
      const assistantMessage = messages.data[0];
      const responseText = assistantMessage.content[0].text.value;
      
      // Extract move from response
      const move = extractMoveFromResponse(responseText, legalMoves, board);
      
      console.log('✅ Assistant response received:', { move: move?.notation, responseText });
      
      return {
        move,
        chatMessage: responseText,
        analysis: responseText,
        threadId
      };
    } else {
      throw new Error(`Run failed with status: ${runStatus.status}`);
    }
  } catch (error) {
    console.error('❌ Assistant move failed:', error);
    return simulateAssistantMove(assistantId, board, color, legalMoves, threadId);
  }
};

export const sendChatToAssistant = async (
  assistantId: string,
  threadId: string,
  userMessage: string
): Promise<string> => {
  console.log('💬 Sending chat to assistant:', { assistantId, threadId, userMessage });
  
  const apiKey = localStorage.getItem('openai_api_key');
  
  if (!apiKey || assistantId.startsWith('simulated') || assistantId.startsWith('fallback')) {
    return simulateChatResponse(assistantId, userMessage);
  }

  try {
    // Add user message to thread
    await fetch(`${OPENAI_API_URL}/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: userMessage
      })
    });

    // Run the assistant
    const runResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    const run = await runResponse.json();
    const runStatus = await pollRunCompletion(apiKey, threadId, run.id);
    
    if (runStatus.status === 'completed') {
      const messagesResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      const messages = await messagesResponse.json();
      const assistantMessage = messages.data[0];
      return assistantMessage.content[0].text.value;
    } else {
      throw new Error(`Chat run failed with status: ${runStatus.status}`);
    }
  } catch (error) {
    console.error('❌ Chat failed:', error);
    return simulateChatResponse(assistantId, userMessage);
  }
};

// Helper functions
const pollRunCompletion = async (apiKey: string, threadId: string, runId: string, maxAttempts = 30) => {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${OPENAI_API_URL}/threads/${threadId}/runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    const run = await response.json();
    
    if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
      return run;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Run polling timeout');
};

const extractMoveFromResponse = (response: string, legalMoves: string[], board: (ChessPiece | null)[][]): Move | null => {
  // Look for moves in the response text
  for (const moveNotation of legalMoves) {
    if (response.includes(moveNotation)) {
      return createMoveFromNotation(moveNotation, board);
    }
  }
  
  // Fallback to first legal move
  if (legalMoves.length > 0) {
    return createMoveFromNotation(legalMoves[0], board);
  }
  
  return null;
};

const createMoveFromNotation = (notation: string, board: (ChessPiece | null)[][]): Move | null => {
  const parts = notation.split('-');
  if (parts.length !== 2) return null;
  
  const [from, to] = parts;
  const [fromCol, fromRow] = [from.charCodeAt(0) - 97, 8 - parseInt(from[1])];
  const [toCol, toRow] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
  
  const piece = board[fromRow]?.[fromCol];
  const captured = board[toRow]?.[toCol];
  
  if (!piece) return null;
  
  return {
    from,
    to,
    piece,
    captured: captured || undefined,
    timestamp: Date.now(),
    notation
  };
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

// Simulation functions for when API is not available
const simulateAssistantMove = async (
  assistantId: string,
  board: (ChessPiece | null)[][],
  color: PieceColor,
  legalMoves: string[],
  threadId: string
): Promise<AssistantResponse> => {
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  const selectedMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
  const move = createMoveFromNotation(selectedMove, board);
  
  const personality = assistantId.includes('claude') ? 'thoughtful' : 
                     assistantId.includes('gemini') ? 'creative' : 'analytical';
  
  const messages = {
    thoughtful: [
      "After careful consideration, I believe this move maintains the harmony of my position.",
      "This move follows sound positional principles while keeping my pieces well-coordinated.",
      "A solid choice that improves my position gradually and systematically."
    ],
    creative: [
      "Here's an interesting move that creates some dynamic possibilities!",
      "I'm going for something a bit unconventional here - let's see what happens!",
      "This move opens up some fascinating tactical possibilities."
    ],
    analytical: [
      "After analyzing the position, this move offers the best practical chances.",
      "My calculation shows this move leads to a favorable position.",
      "This is the most precise move in the current position."
    ]
  };
  
  const chatMessage = messages[personality][Math.floor(Math.random() * messages[personality].length)];
  
  return {
    move,
    chatMessage: `${chatMessage} Playing ${selectedMove}.`,
    threadId
  };
};

const simulateChatResponse = (assistantId: string, userMessage: string): string => {
  const personality = assistantId.includes('claude') ? 'thoughtful' : 
                     assistantId.includes('gemini') ? 'creative' : 'analytical';
  
  const responses = {
    thoughtful: [
      "That's a fascinating perspective on the position. Chess really is a beautiful art form.",
      "I appreciate your thoughtful approach to the game. What are you thinking about next?",
      "Your question touches on some deep chess principles. Let me share my thoughts..."
    ],
    creative: [
      "Wow, that's an exciting way to look at it! I love exploring new ideas in chess.",
      "You're thinking outside the box - that's exactly the kind of creativity chess needs!",
      "That opens up so many interesting possibilities! What's your plan?"
    ],
    analytical: [
      "Good question! Let me break down the key factors in this position.",
      "From a technical standpoint, the critical elements to consider are...",
      "Your observation is quite accurate. The position requires precise calculation."
    ]
  };
  
  return responses[personality][Math.floor(Math.random() * responses[personality].length)];
};
