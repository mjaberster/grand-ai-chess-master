
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';
export type GameMode = 'human-vs-ai' | 'ai-vs-ai';
export type GameState = 'menu' | 'setup' | 'playing' | 'finished';
export type AIModel = 'gpt-4o';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  position: string;
  hasMoved?: boolean;
}

export interface GameSettings {
  mode: GameMode;
  aiModel: AIModel;
  playerColor?: PieceColor;
  timeControl?: number;
}

export interface Move {
  from: string;
  to: string;
  piece: ChessPiece;
  captured?: ChessPiece;
  timestamp: number;
  notation: string;
}

export interface GameResult {
  winner: PieceColor | 'draw';
  reason: 'checkmate' | 'stalemate' | 'resignation' | 'time' | 'draw';
  moves: Move[];
  duration: number;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  currentScore: number;
  highScore: number;
  averageGameTime: number;
}
