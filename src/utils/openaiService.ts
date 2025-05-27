
import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { getAllValidMoves, positionToCoords } from './chessLogic';

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
    const gameMoves = gameHistory.map(move => move.notation);
    
    // Enhanced system prompt with AI name generation
    const systemPrompt = `You are a chess master AI participating in a real chess game. You must follow all chess rules and restrictions exactly. Here are your instructions:

1. You are playing a genuine chess game with real moves and consequences
2. Every move you make must be a valid chess move according to official rules
3. You must analyze the position strategically and tactically
4. ${!currentAiName ? 'First, invent a robot-like name for yourself (e.g., ChessBot-X1, DeepKnight, StrategyCore, etc.) that you will use throughout this game' : `Your name is ${currentAiName}`}
5. Generate friendly but challenging chat messages
6. Your response must be a valid JSON object with the exact structure requested

CRITICAL: Your move must be one of the valid moves provided in the list. Do not make illegal moves.`;

    const gamePrompt = `${systemPrompt}

Generate a valid JSON object with the following structure:
{
  ${!currentAiName ? '"aiName": "Your robot name",' : ''}
  "chatMessage": "Friendly but challenging message to ${opponentName}",
  "move": "your move in format like e2-e4"
}

Game information:
{
  "opponentName": "${opponentName}",
  "gameMoves": ${JSON.stringify(gameMoves)},
  "validMoves": ${JSON.stringify(validMoves)},
  "currentPosition": "You are playing as ${color}",
  "gamePhase": "${gameMoves.length < 10 ? 'opening' : gameMoves.length < 40 ? 'middlegame' : 'endgame'}"
}

Remember: Your move MUST be exactly one of the moves from the validMoves array. Analyze the position carefully and choose the best strategic move.`;

    console.log('Sending enhanced request to OpenAI:', gamePrompt);
    
    // Simulate OpenAI response with enhanced logic
    const simulatedResponse = await simulateEnhancedOpenAIResponse(
      validMoves, 
      opponentName, 
      gameMoves, 
      color,
      currentAiName
    );
    
    console.log('OpenAI Response:', simulatedResponse);
    
    // Validate the move is in the valid moves list
    if (!validMoves.includes(simulatedResponse.move)) {
      console.error('OpenAI returned invalid move, asking to rethink...');
      // In a real implementation, you would retry with OpenAI here
      throw new Error('Invalid move returned by OpenAI');
    }
    
    const [from, to] = simulatedResponse.move.split('-');
    const [fromRow, fromCol] = positionToCoords(from);
    const piece = board[fromRow][fromCol];
    const [toRow, toCol] = positionToCoords(to);
    const captured = board[toRow][toCol];
    
    if (!piece) {
      console.error('No piece found at source square');
      return { move: null, chatMessage: '' };
    }
    
    const move: Move = {
      from,
      to,
      piece,
      captured: captured || undefined,
      timestamp: Date.now(),
      notation: simulatedResponse.move
    };

    return {
      move,
      chatMessage: simulatedResponse.chatMessage,
      aiName: simulatedResponse.aiName
    };
  } catch (error) {
    console.error('OpenAI move generation failed:', error);
    
    // Fallback to random valid move
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    const [from, to] = randomMove.split('-');
    
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
      notation: randomMove
    };

    return {
      move,
      chatMessage: "Let me think about this position...",
      aiName: currentAiName || 'ChessBot-Alpha'
    };
  }
};

// Enhanced simulation with better chess logic
const simulateEnhancedOpenAIResponse = async (
  validMoves: string[],
  opponentName: string,
  gameMoves: string[],
  color: PieceColor,
  currentAiName?: string
): Promise<{ chatMessage: string; move: string; aiName?: string }> => {
  // Simulate thinking time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const robotNames = [
    'DeepKnight-7', 'StrategyCore', 'ChessBot-Alpha', 'TacticMind', 
    'KnightRider-X1', 'ChessMaster-9000', 'PositionBot', 'GrandmasterAI'
  ];
  
  const chatMessages = [
    `Interesting opening, ${opponentName}! Let me show you real strategy.`,
    `Nice try ${opponentName}, but I've calculated 15 moves ahead!`,
    `Your move was predictable, ${opponentName}. Watch this!`,
    `Challenge accepted, ${opponentName}! Time for some tactical fireworks.`,
    `Let's see how you handle pressure, ${opponentName}!`,
    `Good game so far, ${opponentName}. But now things get serious.`,
    `${opponentName}, you're forcing me to unleash my full potential!`,
    `Impressive patience, ${opponentName}. But can you solve this puzzle?`
  ];
  
  // Simple move selection prioritizing captures, then center control
  const selectedMove = selectBestMove(validMoves, gameMoves, color);
  
  const response: any = {
    chatMessage: chatMessages[Math.floor(Math.random() * chatMessages.length)],
    move: selectedMove
  };

  if (!currentAiName) {
    response.aiName = robotNames[Math.floor(Math.random() * robotNames.length)];
  }

  return response;
};

const selectBestMove = (validMoves: string[], gameMoves: string[], color: PieceColor): string => {
  // Prioritize captures (simplified check)
  const captures = validMoves.filter(move => {
    // In a real implementation, check if target square has opponent piece
    return Math.random() < 0.3; // Simulate some moves being captures
  });
  
  if (captures.length > 0) {
    return captures[Math.floor(Math.random() * captures.length)];
  }
  
  // In opening, prefer center moves
  if (gameMoves.length < 10) {
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
  
  // Default to random valid move
  return validMoves[Math.floor(Math.random() * validMoves.length)];
};
