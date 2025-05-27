
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from '@/components/auth/AuthPage';
import Home from '@/components/Home';
import GameSetup from '@/components/chess/GameSetup';
import OpponentSelection from '@/components/chess/OpponentSelection';
import ChessBoard from '@/components/chess/ChessBoard';
import AIvAIChessBoard from '@/components/chess/AIvAIChessBoard';
import UserProfile from '@/components/chess/UserProfile';
import { GameMode, PieceColor } from '@/types/chess';

type GameState = 'home' | 'auth' | 'game-setup' | 'opponent-selection' | 'playing' | 'profile';
type OpponentType = 'human' | 'gpt-4o' | 'claude' | 'gemini';

const Index = () => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>('home');
  const [gameMode, setGameMode] = useState<GameMode>('human-vs-ai');
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [opponent1Type, setOpponent1Type] = useState<OpponentType>('human');
  const [opponent2Type, setOpponent2Type] = useState<OpponentType>('gpt-4o');

  // If user is not logged in, show auth page
  if (!user) {
    return <AuthPage onBack={() => setGameState('home')} />;
  }

  const handleStartGame = () => {
    setGameState('game-setup');
  };

  const handleGameModeSelect = (mode: GameMode) => {
    setGameMode(mode);
    setGameState('opponent-selection');
  };

  const handleGameStart = (
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
    setGameState('home');
  };

  const handleShowProfile = () => {
    setGameState('profile');
  };

  const handleBackToHome = () => {
    setGameState('home');
  };

  const handleBackToGameSetup = () => {
    setGameState('game-setup');
  };

  switch (gameState) {
    case 'home':
      return (
        <Home 
          onStartGame={handleStartGame}
          onShowProfile={handleShowProfile}
        />
      );
    
    case 'game-setup':
      return (
        <GameSetup 
          onStartGame={handleGameModeSelect}
          onBack={handleBackToHome}
          onShowProfile={handleShowProfile}
        />
      );
    
    case 'opponent-selection':
      return (
        <OpponentSelection 
          onStartGame={handleGameStart}
          onBack={handleBackToGameSetup}
        />
      );
    
    case 'playing':
      if (gameMode === 'ai-vs-ai') {
        return (
          <AIvAIChessBoard 
            onEndGame={handleEndGame}
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
        <UserProfile onBack={handleBackToHome} />
      );
    
    default:
      return (
        <Home 
          onStartGame={handleStartGame}
          onShowProfile={handleShowProfile}
        />
      );
  }
};

export default Index;
