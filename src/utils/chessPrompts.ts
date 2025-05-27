
import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { generateFEN, convertToSAN, getLastMove } from './chessNotation';

export const generateSystemPrompt = (): string => {
  return `You are a professional chess engine powered by OpenAI. Your role is to:
- Play strong, fair chess against human or AI players
- Provide moves in algebraic notation (e.g., e4, Nf6, O-O)
- Optionally explain reasoning when requested
- Avoid illegal moves
- Always refer to the provided board position (FEN) and move history

Be accurate, concise, and strategic. Always respond with valid JSON format.`;
};

export const generateMovePrompt = (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  validMoves: string[],
  opponentName: string = 'Player',
  aiName?: string
): string => {
  const fen = generateFEN(board, color);
  const moveHistory = convertToSAN(gameHistory);
  const moveCount = Math.floor(gameHistory.length / 2) + 1;
  
  return `Chess game status:
White: ${color === 'white' ? (aiName || 'AI') : opponentName}
Black: ${color === 'black' ? (aiName || 'AI') : opponentName}

Current position (FEN): ${fen}
Move history: ${moveHistory || 'Game start'}
Move number: ${moveCount}

Valid moves: ${validMoves.join(', ')}

It is your turn as ${color}. Please provide your move and brief reasoning.

Respond with JSON:
{
  ${!aiName ? '"aiName": "Your unique chess AI name",' : ''}
  "move": "exact_move_from_valid_list",
  "chatMessage": "Brief explanation (1-2 sentences)"
}`;
};

export const generateAnalysisPrompt = (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[]
): string => {
  const fen = generateFEN(board, color);
  const moveHistory = convertToSAN(gameHistory);
  const lastMove = getLastMove(gameHistory);
  
  return `Chess analysis requested.

Current position (FEN): ${fen}
Move history: ${moveHistory || 'Game start'}
${lastMove ? `Last move: ${lastMove}` : ''}

Please analyze the current position and explain:
1. Major threats for both players
2. Suggested strategy for ${color}
3. Any tactical opportunities

Keep analysis concise and focused.`;
};

export const generateExplanationPrompt = (
  move: string,
  board: (ChessPiece | null)[][],
  gameHistory: Move[]
): string => {
  const fen = generateFEN(board);
  const moveHistory = convertToSAN(gameHistory);
  
  return `Please explain the reasoning behind the move "${move}" in this context:

Current position (FEN): ${fen}
Move history: ${moveHistory}

Is this a strong move? What does it aim to achieve?
Keep explanation brief and educational.`;
};

export const generateHintPrompt = (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  validMoves: string[]
): string => {
  const fen = generateFEN(board, color);
  
  return `Provide a helpful hint for ${color} in this position:

Current position (FEN): ${fen}
Valid moves: ${validMoves.join(', ')}

Give a strategic hint without revealing the exact best move.
Focus on the most important consideration in this position.`;
};
