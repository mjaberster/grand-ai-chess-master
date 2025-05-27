
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/components/auth/AuthPage';
import GameSetup from '@/components/chess/GameSetup';
import OpponentSelection from '@/components/chess/OpponentSelection';
import ChessBoard from '@/components/chess/ChessBoard';
import AIvAIChessBoard from '@/components/chess/AIvAIChessBoard';
import UserProfile from '@/components/chess/UserProfile';
import { GameMode, PieceColor } from '@/types/chess';

type GameState = 'menu' | 'opponent-selection' | 'playing' | 'profile';
type OpponentType = 'human' | 'gpt-4o' | 'claude' | 'gemini';

const Index = () => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('human-vs-ai');
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [opponent1Type, setOpponent1Type] = useState<OpponentType>('human');
  const [opponent2Type, setOpponent2Type] = useState<OpponentType>('gpt-4o');

  if (!user) {
    return <AuthPage />;
  }

  const handleGameModeSelect = (mode: GameMode) => {
    setGameMode(mode);
    setGameState('opponent-selection');
  };

  const handleStartGame = (
    mode: GameMode, 
    opponent1: OpponentType, 
    opponent2: OpponentType, 
    color?: PieceColor
  ) => {
    setGameMode(mode);
    setOpponent1Type(opponent1);
    setOpponent2Type(opponent2);
    if (color) setPlayerColor(color);
    setGameState('playing');
  };

  const handleEndGame = () => {
    setGameState('menu');
  };

  const handleShowProfile = () => {
    setGameState('profile');
  };

  const handleBackFromProfile = () => {
    setGameState('menu');
  };

  const handleBackToMenu = () => {
    setGameState('opponent-selection');
  };

  switch (gameState) {
    case 'menu':
      return (
        <GameSetup 
          onGameModeSelect={handleGameModeSelect}
          onShowProfile={handleShowProfile}
        />
      );
    
    case 'opponent-selection':
      return (
        <OpponentSelection 
          onStartGame={handleStartGame}
          onBack={handleBackToMenu}
        />
      );
    
    case 'playing':
      if (gameMode === 'ai-vs-ai') {
        return (
          <AIvAIChessBoard 
            onEndGame={handleEndGame}
            opponent1Type={opponent1Type}
            opponent2Type={opponent2Type}
          />
        );
      }
      return (
        <ChessBoard 
          gameMode={gameMode}
          onEndGame={handleEndGame}
          opponent1Type={opponent1Type}
          opponent2Type={opponent2Type}
          playerColor={playerColor}
        />
      );
    
    case 'profile':
      return (
        <UserProfile onBack={handleBackFromProfile} />
      );
    
    default:
      return (
        <GameSetup 
          onGameModeSelect={handleGameModeSelect}
          onShowProfile={handleShowProfile}
        />
      );
  }
};

export default Index;
