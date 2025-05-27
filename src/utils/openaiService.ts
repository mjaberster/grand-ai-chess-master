
import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { getAllValidMoves } from './chessLogic';

export const getOpenAIMove = async (
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  opponentName: string = 'Player'
): Promise<{ move: Move | null; chatMessage: string }> => {
  const validMoves = getAllValidMoves(board, color);
  
  if (validMoves.length === 0) {
    return { move: null, chatMessage: '' };
  }
  
  try {
    // Prepare the game moves array
    const gameMoves = gameHistory.map(move => move.notation);
    
    // Create the prompt
    const prompt = `You are a chess master participating in a chess game, your opponent name and his last move are provided in the following json object, generate a valid json object, and nothing more than a json object with the following:
{
"chatMessage": "Chat message, make it friendly but challenging, something like 'show me what you got ${opponentName}', or 'is this the best you could' or any similar phrase",
"move": "your move"
}

here is the json object with the information:
{
"opponentName": "${opponentName}",
"gameMoves": ${JSON.stringify(gameMoves)},
"validMoves": ${JSON.stringify(validMoves)}
}`;

    console.log('Sending request to OpenAI:', prompt);
    
    // For now, simulate the OpenAI response since we need the actual API integration
    // This should be replaced with actual OpenAI API call
    const simulatedResponse = await simulateOpenAIResponse(validMoves, opponentName, gameMoves);
    
    const [from, to] = simulatedResponse.move.split('-');
    const [fromRow, fromCol] = [from.charCodeAt(0) - 97, 8 - parseInt(from[1])];
    const piece = board[fromRow][fromCol];
    const [toRow, toCol] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
    const captured = board[toRow][toCol];
    
    if (!piece) return { move: null, chatMessage: '' };
    
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
      chatMessage: simulatedResponse.chatMessage
    };
  } catch (error) {
    console.error('OpenAI move generation failed:', error);
    
    // Fallback to random move
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    const [from, to] = randomMove.split('-');
    
    const [fromRow, fromCol] = [from.charCodeAt(0) - 97, 8 - parseInt(from[1])];
    const piece = board[fromRow][fromCol];
    const [toRow, toCol] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
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
      chatMessage: "Let's see what you've got!"
    };
  }
};

// Simulate OpenAI response for now - replace with actual API call
const simulateOpenAIResponse = async (
  validMoves: string[],
  opponentName: string,
  gameMoves: string[]
): Promise<{ chatMessage: string; move: string }> => {
  // Simulate thinking time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const chatMessages = [
    `Show me what you've got, ${opponentName}!`,
    `Is that the best you can do?`,
    `Interesting move, but watch this!`,
    `Let's see how you handle this, ${opponentName}!`,
    `Your move was predictable, ${opponentName}`,
    `Time to step up your game!`,
    `Nice try, but I have something better!`,
    `Challenge accepted, ${opponentName}!`
  ];
  
  // Select an intelligent move (prioritize captures, then center control)
  const captures = validMoves.filter(move => {
    // This is a simplified check - in real implementation, check if target square has piece
    return false; // Placeholder
  });
  
  const selectedMove = captures.length > 0 
    ? captures[Math.floor(Math.random() * captures.length)]
    : validMoves[Math.floor(Math.random() * validMoves.length)];
  
  return {
    chatMessage: chatMessages[Math.floor(Math.random() * chatMessages.length)],
    move: selectedMove
  };
};
