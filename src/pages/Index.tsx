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
  const [gameMode, setGameMode] = useState<GameMode>('ai-vs-ai');
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [opponent1Type, setOpponent1Type] = useState<OpponentType>('gpt-4o');
  const [opponent2Type, setOpponent2Type] = useState<OpponentType>('gpt-4o');

  const handleStartGame = () => {
    // Directly start AI vs AI game with GPT-4o opponents
    setGameMode('ai-vs-ai');
    setOpponent1Type('gpt-4o');
    setOpponent2Type('gpt-4o');
    setGameState('playing');
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
    if (!user) {
      setGameState('auth');
      return;
    }
    setGameState('profile');
  };

  const handleShowAuth = () => {
    setGameState('auth');
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
          onShowAuth={handleShowAuth}
        />
      );
    
    case 'auth':
      return (
        <AuthPage onBack={handleBackToHome} />
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
      return (
        <AIvAIChessBoard 
          onEndGame={handleEndGame}
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
          onShowAuth={handleShowAuth}
        />
      );
  }
};

export default Index;
