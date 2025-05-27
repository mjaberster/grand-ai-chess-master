import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, RotateCcw, Clock, Brain, Zap } from 'lucide-react';
import { ChessPiece, PieceColor, Move } from '@/types/chess';
import ChessSquare from './ChessSquare';
import { initializeBoard, makeMove } from '@/utils/chessLogic';
import { validateGameState } from '@/utils/chessRuleEnforcement';
import { AIPlayer, getRandomAIPlayer, getAIPlayerMove, AIBattleResult } from '@/utils/aiPlayerManager';

interface AIvAIChessBoardProps {
  onEndGame: () => void;
}

interface BattleCommentary {
  id: string;
  timestamp: number;
  message: string;
  type: 'move' | 'analysis' | 'event';
  player?: AIPlayer;
}

const AIvAIChessBoard = ({ onEndGame }: AIvAIChessBoardProps) => {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [gameHistory, setGameHistory] = useState<Move[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [whitePlayer, setWhitePlayer] = useState<AIPlayer | null>(null);
  const [blackPlayer, setBlackPlayer] = useState<AIPlayer | null>(null);
  const [currentThinking, setCurrentThinking] = useState<AIPlayer | null>(null);
  const [lastMoveResult, setLastMoveResult] = useState<AIBattleResult | null>(null);
  const [commentary, setCommentary] = useState<BattleCommentary[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  const [battleStats, setBattleStats] = useState({
    totalMoves: 0,
    averageThinkingTime: 0,
    positionEvaluation: 0
  });

  useEffect(() => {
    // Initialize AI players
    const white = getRandomAIPlayer();
    const black = getRandomAIPlayer();
    
    // Ensure different players
    while (black.id === white.id) {
      const newBlack = getRandomAIPlayer();
      setBlackPlayer(newBlack);
      break;
    }
    
    setWhitePlayer(white);
    setBlackPlayer(black);
    
    const initialCommentary: BattleCommentary = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      message: `Battle begins! ${white.name} ${white.avatar} vs ${black.name} ${black.avatar}`,
      type: 'event'
    };
    setCommentary([initialCommentary]);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying && !isPaused && !gameOver) {
        setGameTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, isPaused, gameOver]);

  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver && whitePlayer && blackPlayer) {
      handleAIBattleMove();
    }
  }, [currentPlayer, isPlaying, isPaused, gameOver]);

  useEffect(() => {
    // Check for game over conditions
    const gameValidation = validateGameState(board, currentPlayer);
    
    if (gameValidation.gameOver && !gameOver) {
      setGameOver(true);
      setWinner(gameValidation.winner || null);
      setIsPlaying(false);
      
      const gameOverMessage = gameValidation.isCheckmate 
        ? `Checkmate! ${gameValidation.winner === 'white' ? whitePlayer?.name : blackPlayer?.name} wins!`
        : 'Stalemate! The battle ends in a draw.';
      
      const gameOverCommentary: BattleCommentary = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        message: gameOverMessage,
        type: 'event'
      };
      setCommentary(prev => [...prev, gameOverCommentary]);
    }
  }, [board, currentPlayer, gameOver, whitePlayer, blackPlayer]);

  const handleAIBattleMove = async () => {
    if (!whitePlayer || !blackPlayer || gameOver) return;
    
    const currentAI = currentPlayer === 'white' ? whitePlayer : blackPlayer;
    const opponent = currentPlayer === 'white' ? blackPlayer : whitePlayer;
    
    setCurrentThinking(currentAI);
    
    try {
      const result = await getAIPlayerMove(currentAI, board, currentPlayer, gameHistory, opponent);
      
      if (result.move) {
        // Handle move execution with potential promotion using the existing makeMove function
        const newBoard = makeMove(board, result.move.from, result.move.to, result.promotionPiece);
        
        setBoard(newBoard);
        setGameHistory(prev => [...prev, result.move!]);
        setLastMoveResult(result);
        
        // Enhanced move commentary with promotion info
        let moveMessage = `${currentAI.avatar} ${result.analysis}`;
        if (result.promotionPiece) {
          moveMessage += ` 👑`;
        }
        
        const moveCommentary: BattleCommentary = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          message: moveMessage,
          type: 'move',
          player: currentAI
        };
        setCommentary(prev => [...prev, moveCommentary]);
        
        // Update battle stats
        setBattleStats(prev => ({
          totalMoves: prev.totalMoves + 1,
          averageThinkingTime: (prev.averageThinkingTime * prev.totalMoves + result.thinkingTime) / (prev.totalMoves + 1),
          positionEvaluation: result.evaluation
        }));
        
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
      }
    } catch (error) {
      console.error('AI battle move failed:', error);
      
      const errorCommentary: BattleCommentary = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        message: `${currentAI.name} encountered technical difficulties!`,
        type: 'event'
      };
      setCommentary(prev => [...prev, errorCommentary]);
    } finally {
      setCurrentThinking(null);
    }
  };

  const startBattle = () => {
    if (!whitePlayer || !blackPlayer) return;
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseBattle = () => {
    setIsPaused(!isPaused);
  };

  const resetBattle = () => {
    setBoard(initializeBoard());
    setCurrentPlayer('white');
    setGameHistory([]);
    setIsPlaying(false);
    setIsPaused(false);
    setGameTime(0);
    setGameOver(false);
    setWinner(null);
    setLastMoveResult(null);
    setCommentary([{
      id: Date.now().toString(),
      timestamp: Date.now(),
      message: `New battle! ${whitePlayer?.name} ${whitePlayer?.avatar} vs ${blackPlayer?.name} ${blackPlayer?.avatar}`,
      type: 'event'
    }]);
    setBattleStats({ totalMoves: 0, averageThinkingTime: 0, positionEvaluation: 0 });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPieceSymbol = (piece: ChessPiece | null) => {
    if (!piece) return '';
    
    const symbols = {
      white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
      black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
    };
    
    return symbols[piece.color][piece.type];
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const gameValidation = validateGameState(board, currentPlayer);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={onEndGame}
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-slate-300">
              <Clock className="w-4 h-4 mr-2" />
              {formatTime(gameTime)}
            </div>
            
            {!isPlaying ? (
              <Button 
                onClick={startBattle}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!whitePlayer || !blackPlayer}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Battle
              </Button>
            ) : (
              <Button 
                onClick={pauseBattle}
                variant="outline" 
                className="border-amber-600 text-amber-400 hover:bg-amber-600/20"
              >
                <Pause className="w-4 h-4 mr-2" />
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            )}
            
            <Button 
              onClick={resetBattle}
              variant="outline" 
              className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Battle
            </Button>
          </div>
        </div>

        {/* AI Player Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{whitePlayer?.avatar}</div>
              <div>
                <h3 className="text-xl font-bold text-white">{whitePlayer?.name}</h3>
                <p className="text-slate-300">{whitePlayer?.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-400" />
                  <span className="text-slate-300">White</span>
                  {currentPlayer === 'white' && currentThinking && (
                    <div className="flex items-center text-amber-400">
                      <Brain className="w-4 h-4 mr-1 animate-pulse" />
                      <span>Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{blackPlayer?.avatar}</div>
              <div>
                <h3 className="text-xl font-bold text-white">{blackPlayer?.name}</h3>
                <p className="text-slate-300">{blackPlayer?.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-3 h-3 rounded-full bg-slate-900" />
                  <span className="text-slate-300">Black</span>
                  {currentPlayer === 'black' && currentThinking && (
                    <div className="flex items-center text-amber-400">
                      <Brain className="w-4 h-4 mr-1 animate-pulse" />
                      <span>Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Game Over Banner */}
        {gameOver && (
          <div className="mb-6 p-4 bg-amber-600/20 border border-amber-600 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-amber-300">
              Battle Complete!
            </h2>
            <p className="text-amber-200 mt-2">
              {winner === 'draw' 
                ? 'The battle ends in a strategic draw!' 
                : `${winner === 'white' ? whitePlayer?.name : blackPlayer?.name} emerges victorious!`}
            </p>
          </div>
        )}

        {/* Main Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chess Board */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
              <div className="max-w-2xl mx-auto">
                <div className="inline-block">
                  <div className="grid grid-cols-10 grid-rows-10 gap-0 aspect-square border-4 border-amber-400 rounded-lg overflow-hidden">
                    {/* Top-left corner */}
                    <div className="flex items-center justify-center bg-slate-900/50"></div>
                    
                    {/* Top file labels */}
                    {files.map(file => (
                      <div key={`top-${file}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {file}
                      </div>
                    ))}
                    
                    {/* Top-right corner */}
                    <div className="flex items-center justify-center bg-slate-900/50"></div>

                    {/* Board rows */}
                    {board.map((row, rowIndex) => [
                      // Left rank label
                      <div key={`left-${ranks[rowIndex]}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {ranks[rowIndex]}
                      </div>,
                      
                      // Chess squares
                      ...row.map((piece, colIndex) => {
                        const position = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
                        const isLight = (rowIndex + colIndex) % 2 === 0;
                        const isLastMove = gameHistory.length > 0 && 
                          (gameHistory[gameHistory.length - 1].from === position || 
                           gameHistory[gameHistory.length - 1].to === position);
                        
                        return (
                          <ChessSquare
                            key={position}
                            position={position}
                            piece={piece}
                            isLight={isLight}
                            isSelected={isLastMove}
                            onClick={() => {}}
                            pieceSymbol={getPieceSymbol(piece)}
                          />
                        );
                      }),
                      
                      // Right rank label
                      <div key={`right-${ranks[rowIndex]}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {ranks[rowIndex]}
                      </div>
                    ])}

                    {/* Bottom-left corner */}
                    <div className="flex items-center justify-center bg-slate-900/50"></div>
                    
                    {/* Bottom file labels */}
                    {files.map(file => (
                      <div key={`bottom-${file}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {file}
                      </div>
                    ))}
                    
                    {/* Bottom-right corner */}
                    <div className="flex items-center justify-center bg-slate-900/50"></div>
                  </div>
                </div>
              </div>
              
              {/* Battle Status */}
              <div className="mt-6 text-center">
                <div className={`inline-flex items-center px-6 py-3 rounded-full ${
                  gameOver 
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
                    : gameValidation.isInCheck
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                    : currentPlayer === 'white' 
                    ? 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900' 
                    : 'bg-gradient-to-r from-slate-700 to-slate-800 text-white'
                }`}>
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    gameOver
                      ? 'bg-amber-300'
                      : gameValidation.isInCheck
                      ? 'bg-red-300'
                      : currentPlayer === 'white' ? 'bg-white border-2 border-slate-400' : 'bg-slate-900'
                  }`} />
                  {gameOver 
                    ? `Battle Complete!`
                    : gameValidation.isInCheck
                    ? `${currentPlayer === 'white' ? whitePlayer?.name : blackPlayer?.name} in CHECK!`
                    : currentThinking
                    ? `${currentThinking.name} analyzing position...`
                    : `${currentPlayer === 'white' ? whitePlayer?.name : blackPlayer?.name} to move`}
                </div>
              </div>
            </Card>
          </div>

          {/* Battle Commentary and Stats */}
          <div className="space-y-6">
            {/* Live Commentary */}
            <Card className="bg-slate-800/50 border-slate-700 p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-amber-400" />
                Battle Commentary
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {commentary.slice(-8).reverse().map(comment => (
                  <div key={comment.id} className="text-sm">
                    <div className={`p-2 rounded ${
                      comment.type === 'event' 
                        ? 'bg-amber-600/20 text-amber-300' 
                        : 'bg-slate-700/50 text-slate-300'
                    }`}>
                      {comment.player && (
                        <span className="font-semibold">
                          {comment.player.avatar} {comment.player.name}: 
                        </span>
                      )}
                      <span className="ml-1">{comment.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Battle Statistics */}
            <Card className="bg-slate-800/50 border-slate-700 p-4">
              <h3 className="text-lg font-bold text-white mb-4">Battle Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-300">Total Moves:</span>
                  <span className="text-white font-semibold">{battleStats.totalMoves}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Avg Think Time:</span>
                  <span className="text-white font-semibold">
                    {battleStats.averageThinkingTime > 0 ? `${Math.round(battleStats.averageThinkingTime / 1000)}s` : '0s'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Position Value:</span>
                  <span className={`font-semibold ${
                    battleStats.positionEvaluation > 0 ? 'text-green-400' : 
                    battleStats.positionEvaluation < 0 ? 'text-red-400' : 'text-slate-300'
                  }`}>
                    {battleStats.positionEvaluation > 0 ? '+' : ''}{battleStats.positionEvaluation}
                  </span>
                </div>
                {lastMoveResult && (
                  <div className="flex justify-between">
                    <span className="text-slate-300">Last Move Quality:</span>
                    <span className={`font-semibold ${
                      lastMoveResult.moveQuality === 'excellent' ? 'text-green-400' :
                      lastMoveResult.moveQuality === 'good' ? 'text-blue-400' :
                      lastMoveResult.moveQuality === 'average' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {lastMoveResult.moveQuality}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Moves */}
            <Card className="bg-slate-800/50 border-slate-700 p-4">
              <h3 className="text-lg font-bold text-white mb-4">Recent Moves</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {gameHistory.slice(-10).reverse().map((move, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-300">
                      {gameHistory.length - index}. {move.notation}
                    </span>
                    <span className="text-slate-400">
                      {move.piece.color === 'white' ? whitePlayer?.avatar : blackPlayer?.avatar}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIvAIChessBoard;
