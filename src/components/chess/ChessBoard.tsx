
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Flag, Clock } from 'lucide-react';
import { GameMode, ChessPiece, PieceColor, Move } from '@/types/chess';
import ChessSquare from './ChessSquare';
import GameInfo from './GameInfo';
import ChatBox from './ChatBox';
import MoveHistory from './MoveHistory';
import { initializeBoard, makeMove } from '@/utils/chessLogic';
import { getAIMove } from '@/utils/aiService';
import { getOpenAIMove } from '@/utils/openaiChessService';
import { isLegalMove, getAllLegalMoves, validateGameState } from '@/utils/chessRuleEnforcement';

interface ChessBoardProps {
  gameMode: GameMode;
  onEndGame: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'human' | 'ai';
  message: string;
  timestamp: number;
}

const ChessBoard = ({ gameMode, onEndGame }: ChessBoardProps) => {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<Move[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [aiName, setAiName] = useState<string>('');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!gameOver) {
        setGameTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  useEffect(() => {
    // Validate game state after each move
    const gameValidation = validateGameState(board, currentPlayer);
    console.log('🎮 Game State Check:', {
      currentPlayer,
      isInCheck: gameValidation.isInCheck,
      isCheckmate: gameValidation.isCheckmate,
      isStalemate: gameValidation.isStalemate,
      gameOver: gameValidation.gameOver,
      legalMoves: gameValidation.legalMoves.length
    });

    if (gameValidation.gameOver && !gameOver) {
      console.log('🏁 Game Over Detected:', {
        reason: gameValidation.isCheckmate ? 'checkmate' : 'stalemate',
        winner: gameValidation.winner
      });
      
      setGameOver(true);
      setWinner(gameValidation.winner || null);
      
      const gameOverMessage = gameValidation.isCheckmate 
        ? `Checkmate! ${gameValidation.winner === 'white' ? 'White' : 'Black'} wins!`
        : 'Stalemate! The game is a draw.';
      
      const gameOverChatMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'ai',
        message: gameOverMessage,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, gameOverChatMessage]);
      
      return; // Stop here if game is over
    }

    if (!gameOver && (gameMode === 'ai-vs-ai' || (gameMode === 'human-vs-ai' && currentPlayer !== playerColor))) {
      handleAIMove();
    }
  }, [currentPlayer, gameMode, playerColor, gameOver]);

  const handleAIMove = async () => {
    if (gameOver) {
      console.log('🛑 AI move cancelled - game is over');
      return;
    }

    console.log('🤖 AI Move Handler Started with Rule Enforcement:', {
      gameMode,
      currentPlayer,
      playerColor,
      moveCount: gameHistory.length
    });
    
    setIsThinking(true);
    try {
      let aiMove;
      let chatMessage = '';

      if (gameMode === 'human-vs-ai') {
        console.log('🎯 Using Enhanced Rule-Enforced OpenAI Service');
        const result = await getOpenAIMove(board, currentPlayer, gameHistory, 'Player', aiName);
        aiMove = result.move;
        chatMessage = result.chatMessage;
        
        console.log('📤 Rule-Enforced OpenAI Result:', {
          moveNotation: aiMove?.notation,
          hasMove: !!aiMove,
          chatMessage,
          aiNameChanged: result.aiName !== aiName
        });
        
        if (result.aiName && !aiName) {
          console.log('🏷️ Setting AI name:', result.aiName);
          setAiName(result.aiName);
        }
        
        if (chatMessage) {
          const newChatMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'ai',
            message: chatMessage,
            timestamp: Date.now()
          };
          setChatMessages(prev => [...prev, newChatMessage]);
          console.log('💬 Added chat message:', chatMessage);
        }
      } else {
        console.log('🎯 Using Basic AI Service for AI vs AI');
        aiMove = await getAIMove(board, currentPlayer, gameHistory);
      }

      if (aiMove) {
        // Double-check that the AI move is legal before executing
        if (!isLegalMove(board, aiMove.from, aiMove.to, currentPlayer)) {
          console.error('🚨 AI returned illegal move:', {
            from: aiMove.from,
            to: aiMove.to,
            piece: `${aiMove.piece.color} ${aiMove.piece.type}`
          });
          
          // This should not happen with proper rule enforcement, but as a safety net
          const legalMoves = getAllLegalMoves(board, currentPlayer);
          if (legalMoves.length > 0) {
            console.log('🔧 Using fallback legal move');
            const fallbackMove = legalMoves[0].split('-');
            aiMove.from = fallbackMove[0];
            aiMove.to = fallbackMove[1];
            aiMove.notation = legalMoves[0];
          } else {
            console.error('💀 No legal moves available - should have been detected earlier');
            return;
          }
        }

        console.log('✅ Legal AI Move Execution:', {
          from: aiMove.from,
          to: aiMove.to,
          piece: `${aiMove.piece.color} ${aiMove.piece.type}`,
          captured: aiMove.captured ? `${aiMove.captured.color} ${aiMove.captured.type}` : 'none',
          legal: true
        });
        
        const newBoard = makeMove(board, aiMove.from, aiMove.to);
        setBoard(newBoard);
        setGameHistory(prev => [...prev, aiMove]);
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
        
        console.log('🔄 Board state updated, switching to:', currentPlayer === 'white' ? 'black' : 'white');
      } else {
        console.log('🏁 AI returned null move - game over scenario');
      }
    } catch (error) {
      console.error('💥 AI move failed:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : 'No stack trace',
        gameState: {
          currentPlayer,
          moveCount: gameHistory.length,
          gameMode
        }
      });
    } finally {
      setIsThinking(false);
      console.log('🏁 AI move handler completed');
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameMode === 'ai-vs-ai' || gameOver) return;
    if (gameMode === 'human-vs-ai' && currentPlayer !== playerColor) return;

    const position = `${String.fromCharCode(97 + col)}${8 - row}`;
    const piece = board[row][col];

    if (selectedSquare) {
      if (selectedSquare === position) {
        setSelectedSquare(null);
        return;
      }

      const [fromCol, fromRow] = [selectedSquare.charCodeAt(0) - 97, 8 - parseInt(selectedSquare[1])];
      
      // Use legal move validation instead of basic valid move
      if (isLegalMove(board, selectedSquare, position, currentPlayer)) {
        console.log('✅ Human move is legal:', {
          from: selectedSquare,
          to: position,
          player: currentPlayer
        });

        const newBoard = makeMove(board, selectedSquare, position);
        const move: Move = {
          from: selectedSquare,
          to: position,
          piece: board[fromRow][fromCol]!,
          captured: piece || undefined,
          timestamp: Date.now(),
          notation: `${selectedSquare}-${position}`
        };

        setBoard(newBoard);
        setGameHistory(prev => [...prev, move]);
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
        setSelectedSquare(null);
      } else {
        console.warn('❌ Human attempted illegal move:', {
          from: selectedSquare,
          to: position,
          player: currentPlayer,
          reason: 'Would leave king in check or violate chess rules'
        });

        // Show visual feedback for illegal move attempt
        const illegalMoveMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'ai',
          message: `Illegal move! ${selectedSquare}-${position} would leave your king in check or violate chess rules.`,
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, illegalMoveMessage]);

        if (piece && piece.color === currentPlayer) {
          setSelectedSquare(position);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare(position);
      }
    }
  };

  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'human',
      message,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPieceSymbol = (piece: ChessPiece | null) => {
    if (!piece) return '';
    
    const symbols = {
      white: { 
        king: '♔', 
        queen: '♕', 
        rook: '♖', 
        bishop: '♗', 
        knight: '♘', 
        pawn: '♙' 
      },
      black: { 
        king: '♚', 
        queen: '♛', 
        rook: '♜', 
        bishop: '♝', 
        knight: '♞', 
        pawn: '♟' 
      }
    };
    
    return symbols[piece.color][piece.type];
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  // Get current game state for display
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
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              New Game
            </Button>
            <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600/20">
              <Flag className="w-4 h-4 mr-2" />
              Resign
            </Button>
          </div>
        </div>

        {/* Game Over Banner */}
        {gameOver && (
          <div className="mb-6 p-4 bg-amber-600/20 border border-amber-600 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-amber-300">
              {winner === 'draw' ? 'Stalemate - Draw!' : `${winner === 'white' ? 'White' : 'Black'} Wins!`}
            </h2>
            <p className="text-amber-200 mt-2">
              {winner === 'draw' ? 'No legal moves available but king not in check' : 'Checkmate - King captured!'}
            </p>
          </div>
        )}

        {/* Main Game Layout - Board dominant with chat on the right */}
        <div className="flex gap-6">
          {/* Chess Board - Dominant component (70% width) */}
          <div className="flex-1 max-w-4xl">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
              <div className="max-w-3xl mx-auto">
                {/* Board with coordinates */}
                <div className="inline-block">
                  <div className="grid grid-cols-10 grid-rows-10 gap-0 aspect-square border-4 border-amber-400 rounded-lg overflow-hidden">
                    {/* Top-left corner (empty) */}
                    <div className="flex items-center justify-center bg-slate-900/50"></div>
                    
                    {/* Top file labels (a-h) */}
                    {files.map(file => (
                      <div key={`top-${file}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {file}
                      </div>
                    ))}
                    
                    {/* Top-right corner (empty) */}
                    <div className="flex items-center justify-center bg-slate-900/50"></div>

                    {/* Board rows with left and right rank labels */}
                    {board.map((row, rowIndex) => [
                      // Left rank label
                      <div key={`left-${ranks[rowIndex]}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {ranks[rowIndex]}
                      </div>,
                      
                      // Chess squares
                      ...row.map((piece, colIndex) => {
                        const position = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
                        const isLight = (rowIndex + colIndex) % 2 === 0;
                        const isSelected = selectedSquare === position;
                        
                        return (
                          <ChessSquare
                            key={position}
                            position={position}
                            piece={piece}
                            isLight={isLight}
                            isSelected={isSelected}
                            onClick={() => handleSquareClick(rowIndex, colIndex)}
                            pieceSymbol={getPieceSymbol(piece)}
                          />
                        );
                      }),
                      
                      // Right rank label
                      <div key={`right-${ranks[rowIndex]}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {ranks[rowIndex]}
                      </div>
                    ])}

                    {/* Bottom-left corner (empty) */}
                    <div className="flex items-center justify-center bg-slate-900/50"></div>
                    
                    {/* Bottom file labels (a-h) */}
                    {files.map(file => (
                      <div key={`bottom-${file}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {file}
                      </div>
                    ))}
                    
                    {/* Bottom-right corner (empty) */}
                    <div className="flex items-center justify-center bg-slate-900/50"></div>
                  </div>
                </div>
              </div>
              
              {/* Current Player Indicator with Game State */}
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
                    ? `Game Over - ${winner === 'draw' ? 'Draw' : `${winner} wins`}`
                    : gameValidation.isInCheck
                    ? `${currentPlayer} in CHECK! Must escape!`
                    : isThinking 
                    ? `${aiName || 'AI'} is analyzing position...` 
                    : `${currentPlayer === 'white' ? 'White' : 'Black'} to move`}
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Panel - Right side (30% width) */}
          {gameMode === 'human-vs-ai' && (
            <div className="w-80 flex-shrink-0">
              <ChatBox 
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                aiName={aiName}
              />
            </div>
          )}
        </div>

        {/* Bottom Components - Game Info and Move History */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <GameInfo 
            gameMode={gameMode}
            currentPlayer={currentPlayer}
            gameHistory={gameHistory}
            isThinking={isThinking}
            aiName={aiName}
          />
          <MoveHistory gameHistory={gameHistory} />
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
