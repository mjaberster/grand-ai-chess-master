
import { ChessPiece, PieceColor, Move } from '@/types/chess';
import { getOpenAIMove } from './openaiChessService';
import { getAIMove } from './aiService';
import { getAllLegalMoves, validateGameState } from './chessRuleEnforcement';

export interface AIPlayer {
  id: string;
  name: string;
  personality: 'aggressive' | 'defensive' | 'balanced' | 'tactical';
  avatar: string;
  description: string;
  useOpenAI: boolean;
  wins: number;
  losses: number;
  draws: number;
}

export interface AIBattleResult {
  move: Move | null;
  analysis: string;
  evaluation: number;
  thinkingTime: number;
  moveQuality: 'excellent' | 'good' | 'average' | 'poor' | 'blunder';
}

const AI_PLAYERS: AIPlayer[] = [
  {
    id: 'magnus-ai',
    name: 'Magnus AI',
    personality: 'balanced',
    avatar: '👑',
    description: 'World champion level strategic play',
    useOpenAI: true,
    wins: 0,
    losses: 0,
    draws: 0
  },
  {
    id: 'kasparov-ai',
    name: 'Kasparov AI',
    personality: 'aggressive',
    avatar: '⚡',
    description: 'Aggressive tactical monster',
    useOpenAI: true,
    wins: 0,
    losses: 0,
    draws: 0
  },
  {
    id: 'petrosian-ai',
    name: 'Petrosian AI',
    personality: 'defensive',
    avatar: '🛡️',
    description: 'Iron defense specialist',
    useOpenAI: false,
    wins: 0,
    losses: 0,
    draws: 0
  },
  {
    id: 'tal-ai',
    name: 'Tal AI',
    personality: 'tactical',
    avatar: '🔥',
    description: 'Brilliant tactical genius',
    useOpenAI: true,
    wins: 0,
    losses: 0,
    draws: 0
  }
];

export const getAIPlayers = (): AIPlayer[] => AI_PLAYERS;

export const getRandomAIPlayer = (): AIPlayer => {
  const randomIndex = Math.floor(Math.random() * AI_PLAYERS.length);
  return AI_PLAYERS[randomIndex];
};

export const getAIPlayerMove = async (
  player: AIPlayer,
  board: (ChessPiece | null)[][],
  color: PieceColor,
  gameHistory: Move[],
  opponent: AIPlayer
): Promise<AIBattleResult> => {
  console.log(`🤖 ${player.name} (${color}) analyzing position...`);
  
  const startTime = Date.now();
  const gameValidation = validateGameState(board, color);
  
  if (gameValidation.gameOver) {
    return {
      move: null,
      analysis: gameValidation.isCheckmate ? 'Checkmate detected' : 'Stalemate detected',
      evaluation: gameValidation.isCheckmate ? (color === 'white' ? -1000 : 1000) : 0,
      thinkingTime: Date.now() - startTime,
      moveQuality: 'excellent'
    };
  }
  
  let move: Move | null = null;
  let analysis = '';
  
  try {
    if (player.useOpenAI) {
      const result = await getOpenAIMove(
        board, 
        color, 
        gameHistory, 
        opponent.name,
        player.name
      );
      move = result.move;
      analysis = result.chatMessage || generatePersonalityAnalysis(player, board, color);
    } else {
      move = await getAIMove(board, color, gameHistory);
      analysis = generatePersonalityAnalysis(player, board, color);
    }
  } catch (error) {
    console.error(`❌ ${player.name} move generation failed:`, error);
    // Fallback to basic AI
    move = await getAIMove(board, color, gameHistory);
    analysis = `${player.name} had to use backup thinking due to technical issues.`;
  }
  
  const thinkingTime = Date.now() - startTime;
  const evaluation = evaluatePosition(board, color);
  const moveQuality = assessMoveQuality(move, board, gameValidation);
  
  console.log(`✅ ${player.name} selected move:`, {
    move: move?.notation,
    thinkingTime,
    evaluation,
    quality: moveQuality
  });
  
  return {
    move,
    analysis,
    evaluation,
    thinkingTime,
    moveQuality
  };
};

const generatePersonalityAnalysis = (
  player: AIPlayer, 
  board: (ChessPiece | null)[][], 
  color: PieceColor
): string => {
  const gameValidation = validateGameState(board, color);
  
  if (gameValidation.isInCheck) {
    switch (player.personality) {
      case 'aggressive':
        return "Under attack! Time to counter-punch with maximum force!";
      case 'defensive':
        return "Calmly escaping check with the most solid defensive move.";
      case 'tactical':
        return "Check creates tactical opportunities - let me find the brilliant solution!";
      default:
        return "Methodically addressing the check with optimal play.";
    }
  }
  
  const phrases = {
    aggressive: [
      "Attacking with maximum pressure!",
      "Time to create chaos on the board!",
      "Going for the throat - no mercy!",
      "Building a devastating attack!"
    ],
    defensive: [
      "Consolidating position with solid play.",
      "Maintaining perfect defense and balance.",
      "Preventing all opponent threats systematically.",
      "Building an impenetrable fortress."
    ],
    tactical: [
      "Calculating brilliant combinations!",
      "Setting up a devastating tactical blow!",
      "Finding the hidden tactical motif!",
      "Weaving a complex tactical web!"
    ],
    balanced: [
      "Playing the most principled move.",
      "Balancing attack and defense perfectly.",
      "Following optimal strategic guidelines.",
      "Maintaining perfect positional harmony."
    ]
  };
  
  const personalityPhrases = phrases[player.personality];
  return personalityPhrases[Math.floor(Math.random() * personalityPhrases.length)];
};

const evaluatePosition = (board: (ChessPiece | null)[][], color: PieceColor): number => {
  const values = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
  let evaluation = 0;
  
  board.forEach(row => {
    row.forEach(piece => {
      if (piece) {
        const value = values[piece.type];
        if (piece.color === color) {
          evaluation += value;
        } else {
          evaluation -= value;
        }
      }
    });
  });
  
  return evaluation;
};

const assessMoveQuality = (
  move: Move | null,
  board: (ChessPiece | null)[][],
  gameValidation: any
): 'excellent' | 'good' | 'average' | 'poor' | 'blunder' => {
  if (!move) return 'poor';
  
  if (gameValidation.isCheckmate) return 'excellent';
  if (gameValidation.isInCheck) return 'good';
  if (move.captured) return 'good';
  
  // Simple heuristics for move quality assessment
  const isCenter = ['d4', 'd5', 'e4', 'e5'].includes(move.to);
  if (isCenter) return 'good';
  
  return 'average';
};
