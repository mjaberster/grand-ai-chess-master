import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Flag, Clock } from 'lucide-react';
import { GameMode, ChessPiece, PieceColor, Move, PieceType } from '@/types/chess';
import ChessSquare from './ChessSquare';
import GameInfo from './GameInfo';
import ChatBox from './ChatBox';
import MoveHistory from './MoveHistory';
import PromotionDialog from './PromotionDialog';
import { initializeBoard, makeMove, isPawnPromotion, isCastlingMove } from '@/utils/chessLogic';
import { getAIMove } from '@/utils/aiService';
import { getOpenAIMove } from '@/utils/openaiChessService';
import { createChessAssistant, createGameThread, getAssistantChessMove, sendChatToAssistant } from '@/utils/openaiAssistantsService';
import { isLegalMove, getAllLegalMoves, validateGameState } from '@/utils/chessRuleEnforcement';

interface ChessBoardProps {
  gameMode: GameMode;
  onEndGame: () => void;
  opponent1Type?: string;
  opponent2Type?: string;
  playerColor?: PieceColor;
}

interface ChatMessage {
  id: string;
  sender: 'human' | 'ai';
  message: string;
  timestamp: number;
}

const ChessBoard = ({ gameMode, onEndGame, opponent1Type, opponent2Type, playerColor }: ChessBoardProps) => {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<Move[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{from: string, to: string, piece: ChessPiece} | null>(null);
  
  // Assistant-specific state
  const [assistantId, setAssistantId] = useState<string>('');
  const [threadId, setThreadId] = useState<string>('');
  const [aiName, setAiName] = useState<string>('');
  const [useAssistantsAPI, setUseAssistantsAPI] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!gameOver) {
        setGameTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  useEffect(() => {
    // Initialize assistant if playing against AI
    if (gameMode === 'human-vs-ai' && (opponent1Type || opponent2Type)) {
      initializeAssistant();
    }
  }, [gameMode, opponent1Type, opponent2Type]);

  const initializeAssistant = async () => {
    console.log('🚀 Initializing Assistant API integration');
    
    // Determine which opponent is the AI
    const aiOpponentType = playerColor === 'white' ? opponent2Type : opponent1Type;
    
    if (!aiOpponentType || aiOpponentType === 'human') return;
    
    setUseAssistantsAPI(true);
    
    try {
      // Create the assistant
      const assistant = await createChessAssistant(aiOpponentType);
      setAssistantId(assistant.id);
      setAiName(assistant.name);
      
      // Create a thread for this game
      const thread = await createGameThread(assistant.id, {
        gameMode,
        playerColor,
        opponent1Type,
        opponent2Type
      });
      setThreadId(thread);
      
      console.log('✅ Assistant initialized:', { assistantId: assistant.id, threadId: thread });
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'ai',
        message: `Hello! I'm ${assistant.name}, your chess partner for this game. I'm excited to play with you and discuss our moves as we go. Good luck!`,
        timestamp: Date.now()
      };
      setChatMessages([welcomeMessage]);
      
    } catch (error) {
      console.error('❌ Assistant initialization failed:', error);
      setUseAssistantsAPI(false);
    }
  };

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
      
      return;
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

    console.log('🤖 AI Move Handler Started:', {
      gameMode,
      currentPlayer,
      playerColor,
      moveCount: gameHistory.length,
      useAssistantsAPI
    });
    
    setIsThinking(true);
    try {
      let aiMove;
      let chatMessage = '';
      let promotionPiece: PieceType | undefined;

      if (gameMode === 'human-vs-ai' && useAssistantsAPI && assistantId && threadId) {
        console.log('🎯 Using OpenAI Assistants API');
        const result = await getAssistantChessMove(assistantId, threadId, board, currentPlayer, gameHistory);
        aiMove = result.move;
        chatMessage = result.chatMessage;
        
        console.log('📤 Assistants API Result:', {
          moveNotation: aiMove?.notation,
          hasMove: !!aiMove,
          chatMessage: chatMessage.substring(0, 100) + '...'
        });
        
        if (chatMessage) {
          const newChatMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'ai',
            message: chatMessage,
            timestamp: Date.now()
          };
          setChatMessages(prev => [...prev, newChatMessage]);
        }
      } else if (gameMode === 'human-vs-ai') {
        console.log('🎯 Using Enhanced OpenAI Service');
        const result = await getOpenAIMove(board, currentPlayer, gameHistory, 'Player', aiName);
        aiMove = result.move;
        chatMessage = result.chatMessage;
        promotionPiece = result.promotionPiece;
        
        if (result.aiName && !aiName) {
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
        }
      } else {
        console.log('🎯 Using Basic AI Service for AI vs AI');
        aiMove = await getAIMove(board, currentPlayer, gameHistory);
        
        if (aiMove && isPawnPromotion(aiMove.from, aiMove.to, aiMove.piece)) {
          promotionPiece = 'queen';
        }
      }

      if (aiMove) {
        if (!isLegalMove(board, aiMove.from, aiMove.to, currentPlayer)) {
          console.error('🚨 AI returned illegal move:', {
            from: aiMove.from,
            to: aiMove.to,
            piece: `${aiMove.piece.color} ${aiMove.piece.type}`
          });
          
          const legalMoves = getAllLegalMoves(board, currentPlayer);
          if (legalMoves.length > 0) {
            console.log('🔧 Using fallback legal move');
            const fallbackMove = legalMoves[0].split('-');
            aiMove.from = fallbackMove[0];
            aiMove.to = fallbackMove[1];
            aiMove.notation = legalMoves[0];
          } else {
            console.error('💀 No legal moves available');
            return;
          }
        }

        console.log('✅ Legal AI Move Execution:', {
          from: aiMove.from,
          to: aiMove.to,
          piece: `${aiMove.piece.color} ${aiMove.piece.type}`,
          captured: aiMove.captured ? `${aiMove.captured.color} ${aiMove.captured.type}` : 'none',
          promotionPiece,
          apiUsed: useAssistantsAPI ? 'Assistants' : 'Chat Completions'
        });
        
        const newBoard = makeMove(board, aiMove.from, aiMove.to, promotionPiece);
        setBoard(newBoard);
        setGameHistory(prev => [...prev, aiMove]);
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
      } else {
        console.log('🏁 AI returned null move - game over scenario');
      }
    } catch (error) {
      console.error('💥 AI move failed:', error);
    } finally {
      setIsThinking(false);
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
      
      if (isLegalMove(board, selectedSquare, position, currentPlayer)) {
        console.log('✅ Human move is legal:', {
          from: selectedSquare,
          to: position,
          player: currentPlayer
        });

        const movingPiece = board[fromRow][fromCol]!;
        
        if (isPawnPromotion(selectedSquare, position, movingPiece)) {
          console.log('👑 Human pawn promotion detected');
          setPendingPromotion({ from: selectedSquare, to: position, piece: movingPiece });
          setShowPromotionDialog(true);
          setSelectedSquare(null);
          return;
        }

        executeMove(selectedSquare, position, movingPiece, piece);
      } else {
        console.warn('❌ Human attempted illegal move:', {
          from: selectedSquare,
          to: position,
          player: currentPlayer
        });

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

  const executeMove = (from: string, to: string, movingPiece: ChessPiece, capturedPiece: ChessPiece | null, promotionPiece?: PieceType) => {
    const newBoard = makeMove(board, from, to, promotionPiece);
    const move: Move = {
      from,
      to,
      piece: movingPiece,
      captured: capturedPiece || undefined,
      timestamp: Date.now(),
      notation: `${from}-${to}`
    };

    setBoard(newBoard);
    setGameHistory(prev => [...prev, move]);
    setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
    setSelectedSquare(null);

    if (isCastlingMove(from, to, movingPiece)) {
      const castlingMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'ai',
        message: `Castling completed: ${from}-${to}`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, castlingMessage]);
    }

    if (promotionPiece) {
      const promotionMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'ai',
        message: `Pawn promoted to ${promotionPiece}!`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, promotionMessage]);
    }
  };

  const handlePromotionSelect = (pieceType: PieceType) => {
    if (pendingPromotion) {
      console.log('✅ Human promotion choice:', pieceType);
      const { from, to, piece } = pendingPromotion;
      const [fromCol, fromRow] = [from.charCodeAt(0) - 97, 8 - parseInt(from[1])];
      const [toCol, toRow] = [to.charCodeAt(0) - 97, 8 - parseInt(to[1])];
      const capturedPiece = board[toRow][toCol];
      
      executeMove(from, to, piece, capturedPiece, pieceType);
      setPendingPromotion(null);
    }
  };

  const handlePromotionClose = () => {
    setShowPromotionDialog(false);
    setPendingPromotion(null);
    setSelectedSquare(null);
  };

  const handleSendMessage = async (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'human',
      message,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, newMessage]);

    // If using Assistants API, send to assistant
    if (useAssistantsAPI && assistantId && threadId) {
      try {
        const response = await sendChatToAssistant(assistantId, threadId, message);
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          message: response,
          timestamp: Date.now() + 1
        };
        setChatMessages(prev => [...prev, aiResponse]);
      } catch (error) {
        console.error('❌ Chat message failed:', error);
      }
    }
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
            {useAssistantsAPI && (
              <p className="text-amber-200 text-sm mt-1">
                Powered by OpenAI Assistants API
              </p>
            )}
          </div>
        )}

        {/* Promotion Dialog */}
        <PromotionDialog
          isOpen={showPromotionDialog}
          color={currentPlayer}
          onSelect={handlePromotionSelect}
          onClose={handlePromotionClose}
        />

        {/* Main Game Layout */}
        <div className="flex gap-6">
          {/* Chess Board */}
          <div className="flex-1 max-w-4xl">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
              <div className="max-w-3xl mx-auto">
                <div className="inline-block">
                  <div className="grid grid-cols-10 grid-rows-10 gap-0 aspect-square border-4 border-amber-400 rounded-lg overflow-hidden">
                    {/* ... keep existing code (board rendering) */}
                    <div className="flex items-center justify-center bg-slate-900/50"></div>
                    
                    {files.map(file => (
                      <div key={`top-${file}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {file}
                      </div>
                    ))}
                    
                    <div className="flex items-center justify-center bg-slate-900/50"></div>

                    {board.map((row, rowIndex) => [
                      <div key={`left-${ranks[rowIndex]}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {ranks[rowIndex]}
                      </div>,
                      
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
                      
                      <div key={`right-${ranks[rowIndex]}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {ranks[rowIndex]}
                      </div>
                    ])}

                    <div className="flex items-center justify-center bg-slate-900/50"></div>
                    
                    {files.map(file => (
                      <div key={`bottom-${file}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {file}
                      </div>
                    ))}
                    
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
                    ? `${aiName || 'AI'} is ${useAssistantsAPI ? 'thinking deeply' : 'analyzing position'}...` 
                    : `${currentPlayer === 'white' ? 'White' : 'Black'} to move`}
                </div>
                {useAssistantsAPI && (
                  <div className="text-xs text-slate-400 mt-2">
                    Enhanced with OpenAI Assistants API
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Chat Panel */}
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

        {/* Bottom Components */}
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
