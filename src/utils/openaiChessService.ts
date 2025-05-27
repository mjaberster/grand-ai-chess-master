
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
  const validMoves = getAllValidMoves(board, color);
  
  if (validMoves.length === 0) {
    return { move: null, chatMessage: 'No valid moves available.' };
  }

  try {
    const prompt = generateMovePrompt(board, color, gameHistory, validMoves, opponentName, currentAiName);
    const response = await callOpenAI(prompt);
    
    // Validate the move
    if (!validMoves.includes(response.move)) {
      console.error('Invalid move from OpenAI, using fallback');
      return createFallbackMove(validMoves, board, 'Let me recalculate this position...', currentAiName);
    }

    const move = createMoveFromNotation(response.move, board);
    if (!move) {
      return createFallbackMove(validMoves, board, 'I need to analyze this position more carefully.', currentAiName);
    }

    return {
      move,
      chatMessage: response.chatMessage,
      aiName: response.aiName || currentAiName
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return createFallbackMove(validMoves, board, 'Let me think about this position...', currentAiName);
  }
};

export const getPositionAnalysis = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[]
): Promise<string> => {
  try {
    const prompt = generateAnalysisPrompt(board, color, gameHistory);
    const response = await callOpenAI(prompt, false);
    return response.analysis || 'Position analysis unavailable.';
  } catch (error) {
    console.error('Analysis error:', error);
    return 'Unable to analyze position at this time.';
  }
};

export const getMoveExplanation = async (
  move: string,
  board: (ChessPiece | null)[][],
  gameHistory: Move[]
): Promise<string> => {
  try {
    const prompt = generateExplanationPrompt(move, board, gameHistory);
    const response = await callOpenAI(prompt, false);
    return response.explanation || 'Move explanation unavailable.';
  } catch (error) {
    console.error('Explanation error:', error);
    return 'Unable to explain move at this time.';
  }
};

export const getHint = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  validMoves: string[]
): Promise<string> => {
  try {
    const prompt = generateHintPrompt(board, color, validMoves);
    const response = await callOpenAI(prompt, false);
    return response.hint || 'No hint available.';
  } catch (error) {
    console.error('Hint error:', error);
    return 'Unable to provide hint at this time.';
  }
};

const callOpenAI = async (prompt: string, expectJSON: boolean = true): Promise<any> => {
  // For now, simulate API call - replace with actual OpenAI integration
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Simulate OpenAI response
  if (expectJSON) {
    return {
      move: 'e2-e4', // This would be parsed from actual API response
      chatMessage: 'A solid opening move controlling the center.',
      aiName: 'ChessGPT-Pro'
    };
  } else {
    return {
      analysis: 'The position favors active piece development.',
      explanation: 'This move improves piece activity.',
      hint: 'Look for ways to improve your piece coordination.'
    };
  }
};

const createMoveFromNotation = (notation: string, board: (ChessPiece | null)[][]): Move | null => {
  const [from, to] = notation.split('-');
  if (!from || !to) return null;
  
  const [fromRow, fromCol] = [from.charCodeAt(0) - 97, 8 - parseInt(from[1])];
  const [toRow, toCol] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
  
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
  validMoves: string[],
  board: (ChessPiece | null)[][],
  message: string,
  aiName?: string
): OpenAIResponse => {
  const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
  const move = createMoveFromNotation(randomMove, board);
  
  return {
    move,
    chatMessage: message,
    aiName: aiName || 'ChessBot-Backup'
  };
};
