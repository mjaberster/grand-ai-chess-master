
import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { getAllLegalMoves, validateGameState } from './chessRuleEnforcement';
import { supabase } from '@/integrations/supabase/client';

interface OpenAIResponse {
  move: Move | null;
  chatMessage: string;
  aiName?: string;
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const getSecureOpenAIMove = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  opponentName: string = 'Player',
  currentAiName?: string
): Promise<OpenAIResponse> => {
  console.log('🔐 Secure OpenAI Move Request Started');
  
  const gameValidation = validateGameState(board, color);
  const legalMoves = gameValidation.legalMoves;
  
  if (gameValidation.gameOver) {
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
    return { 
      move: null, 
      chatMessage: 'No legal moves available',
      aiName: currentAiName 
    };
  }

  try {
    const apiKey = await getApiKey();
    
    if (!apiKey) {
      return createFallbackMove(legalMoves, board, 'API key not available. Using random move.', currentAiName);
    }

    // If this is the master key access, use the Supabase OpenAI key
    if (apiKey === 'MASTER_KEY_ACCESS') {
      return await callOpenAIWithSupabaseKey(board, color, gameHistory, legalMoves, opponentName, currentAiName);
    }

    // Use the user's API key
    const response = await callOpenAIDirectly(apiKey, board, color, gameHistory, legalMoves, opponentName, currentAiName);
    return response;
  } catch (error) {
    console.error('🚨 Secure OpenAI Error:', error);
    return createFallbackMove(legalMoves, board, 'AI temporarily unavailable. Using fallback move.', currentAiName);
  }
};

const getApiKey = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('api_key_encrypted')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.api_key_encrypted === 'MASTER_KEY_ACCESS') {
        return 'MASTER_KEY_ACCESS';
      }
      
      return data ? atob(data.api_key_encrypted) : null;
    } else {
      // Anonymous user
      const storedKey = localStorage.getItem('chess_api_key_session');
      if (storedKey === 'MASTER_KEY_ACCESS') {
        return 'MASTER_KEY_ACCESS';
      }
      return storedKey ? atob(storedKey) : null;
    }
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return null;
  }
};

const callOpenAIWithSupabaseKey = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  legalMoves: string[],
  opponentName: string,
  currentAiName?: string
): Promise<OpenAIResponse> => {
  // Call the Supabase edge function with the stored OpenAI key
  const { data, error } = await supabase.functions.invoke('chess-ai-move', {
    body: {
      board: boardToSimpleFormat(board),
      color,
      legalMoves,
      gameHistory: gameHistory.slice(-10), // Last 10 moves for context
      opponentName,
      aiName: currentAiName
    }
  });

  if (error) {
    console.error('Supabase function error:', error);
    throw error;
  }

  const moveNotation = data.move;
  if (!moveNotation || !legalMoves.includes(moveNotation)) {
    throw new Error('Invalid move from AI');
  }

  const move = createMoveFromNotation(moveNotation, board);
  if (!move) {
    throw new Error('Failed to create move object');
  }

  return {
    move,
    chatMessage: data.chatMessage || 'AI move completed.',
    aiName: data.aiName || currentAiName
  };
};

const callOpenAIDirectly = async (
  apiKey: string,
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  legalMoves: string[],
  opponentName: string,
  currentAiName?: string
): Promise<OpenAIResponse> => {
  const prompt = generateChessPrompt(board, color, legalMoves, gameHistory, opponentName, currentAiName);

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
          content: 'You are a chess grandmaster AI. Always respond with valid JSON containing a legal chess move.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  const parsed = JSON.parse(content);
  const moveNotation = parsed.move;
  
  if (!moveNotation || !legalMoves.includes(moveNotation)) {
    throw new Error('Invalid move from AI');
  }

  const move = createMoveFromNotation(moveNotation, board);
  if (!move) {
    throw new Error('Failed to create move object');
  }

  return {
    move,
    chatMessage: parsed.chatMessage || 'Move completed.',
    aiName: parsed.aiName || currentAiName
  };
};

// Helper functions
const generateChessPrompt = (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  legalMoves: string[],
  gameHistory: Move[],
  opponentName: string,
  aiName?: string
): string => {
  return `You are ${aiName || 'ChessGPT'}, playing as ${color} against ${opponentName}.

Current board position: ${boardToSimpleFormat(board)}
Legal moves available: ${legalMoves.join(', ')}
Recent moves: ${gameHistory.slice(-5).map(m => m.notation).join(', ')}

Choose the best legal move and respond with JSON format:
{
  "move": "e2-e4",
  "chatMessage": "I'm developing my pieces with this central pawn move.",
  "aiName": "${aiName || 'ChessGPT'}"
}

CRITICAL: You must choose from the legal moves list: ${legalMoves.join(', ')}`;
};

const boardToSimpleFormat = (board: (ChessPiece | null)[][]): string => {
  return board.map(row => 
    row.map(piece => 
      piece ? `${piece.color[0]}${piece.type[0]}` : '--'
    ).join(' ')
  ).join('\n');
};

const createMoveFromNotation = (notation: string, board: (ChessPiece | null)[][]): Move | null => {
  const parts = notation.split('-');
  if (parts.length !== 2) return null;
  
  const [from, to] = parts;
  
  if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) {
    return null;
  }
  
  const [fromCol, fromRow] = [from.charCodeAt(0) - 97, 8 - parseInt(from[1])];
  const [toCol, toRow] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
  
  if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7 ||
      toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
    return null;
  }
  
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

const createFallbackMove = (
  legalMoves: string[],
  board: (ChessPiece | null)[][],
  message: string,
  aiName?: string
): OpenAIResponse => {
  const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
  const move = createMoveFromNotation(randomMove, board);
  
  return {
    move,
    chatMessage: message,
    aiName: aiName || 'ChessBot'
  };
};
