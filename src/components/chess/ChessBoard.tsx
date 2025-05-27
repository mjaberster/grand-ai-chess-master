import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Flag, Clock } from 'lucide-react';
import { GameMode, ChessPiece, PieceColor, Move } from '@/types/chess';
import ChessSquare from './ChessSquare';
import GameInfo from './GameInfo';
import ChatBox from './ChatBox';
import { initializeBoard, isValidMove, makeMove } from '@/utils/chessLogic';
import { getAIMove } from '@/utils/aiService';
import { getOpenAIMove } from '@/utils/openaiService';

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

  useEffect(() => {
    const timer = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (gameMode === 'ai-vs-ai' || (gameMode === 'human-vs-ai' && currentPlayer !== playerColor)) {
      handleAIMove();
    }
  }, [currentPlayer, gameMode, playerColor]);

  const handleAIMove = async () => {
    setIsThinking(true);
    try {
      let aiMove;
      let chatMessage = '';

      // Use OpenAI for human vs AI games
      if (gameMode === 'human-vs-ai') {
        const result = await getOpenAIMove(board, currentPlayer, gameHistory, 'Player');
        aiMove = result.move;
        chatMessage = result.chatMessage;
        
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
        // Use regular AI for AI vs AI games
        aiMove = await getAIMove(board, currentPlayer, gameHistory);
      }

      if (aiMove) {
        const newBoard = makeMove(board, aiMove.from, aiMove.to);
        setBoard(newBoard);
        setGameHistory(prev => [...prev, aiMove]);
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
      }
    } catch (error) {
      console.error('AI move failed:', error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameMode === 'ai-vs-ai') return;
    if (gameMode === 'human-vs-ai' && currentPlayer !== playerColor) return;

    const position = `${String.fromCharCode(97 + col)}${8 - row}`;
    const piece = board[row][col];

    if (selectedSquare) {
      if (selectedSquare === position) {
        setSelectedSquare(null);
        return;
      }

      const [fromCol, fromRow] = [selectedSquare.charCodeAt(0) - 97, 8 - parseInt(selectedSquare[1])];
      
      if (isValidMove(board, selectedSquare, position)) {
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

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Chess Board */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
              <div className="max-w-2xl mx-auto">
                {/* Board with properly aligned coordinates using CSS Grid */}
                <div className="inline-block">
                  {/* Main grid container: 10x10 (8x8 board + 2 for coordinates) */}
                  <div className="grid grid-cols-10 grid-rows-10 gap-0 aspect-square border-4 border-amber-400 rounded-lg overflow-hidden">
                    {/* Top-left corner (empty) */}
                    <div className="flex items-center justify-center"></div>
                    
                    {/* Top file labels (a-h) */}
                    {files.map(file => (
                      <div key={`top-${file}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {file}
                      </div>
                    ))}
                    
                    {/* Top-right corner (empty) */}
                    <div className="flex items-center justify-center"></div>

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
                    <div className="flex items-center justify-center"></div>
                    
                    {/* Bottom file labels (a-h) */}
                    {files.map(file => (
                      <div key={`bottom-${file}`} className="flex items-center justify-center text-amber-300 font-bold text-lg bg-slate-900/50">
                        {file}
                      </div>
                    ))}
                    
                    {/* Bottom-right corner (empty) */}
                    <div className="flex items-center justify-center"></div>
                  </div>
                </div>
              </div>
              
              {/* Current Player Indicator */}
              <div className="mt-6 text-center">
                <div className={`inline-flex items-center px-6 py-3 rounded-full ${
                  currentPlayer === 'white' 
                    ? 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900' 
                    : 'bg-gradient-to-r from-slate-700 to-slate-800 text-white'
                }`}>
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    currentPlayer === 'white' ? 'bg-white border-2 border-slate-400' : 'bg-slate-900'
                  }`} />
                  {isThinking ? 'AI is thinking...' : `${currentPlayer === 'white' ? 'White' : 'Black'} to move`}
                </div>
              </div>
            </Card>
          </div>

          {/* Game Info and Chat */}
          <div className="lg:col-span-2 space-y-6">
            <GameInfo 
              gameMode={gameMode}
              currentPlayer={currentPlayer}
              gameHistory={gameHistory}
              isThinking={isThinking}
            />
            
            {gameMode === 'human-vs-ai' && (
              <ChatBox 
                messages={chatMessages}
                onSendMessage={handleSendMessage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
