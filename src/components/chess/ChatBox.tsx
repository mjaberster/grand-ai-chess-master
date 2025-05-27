
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, User, Bot } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'human' | 'ai';
  message: string;
  timestamp: number;
}

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const ChatBox = ({ messages, onSendMessage }: ChatBoxProps) => {
  const [inputMessage, setInputMessage] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <div className="p-4">
        <div className="flex items-center mb-4">
          <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
          <h3 className="font-semibold text-white">Game Chat</h3>
        </div>

        <ScrollArea className="h-64 mb-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">
                Start chatting with your AI opponent!
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-2 ${
                    message.sender === 'human' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    message.sender === 'human' 
                      ? 'bg-blue-600' 
                      : 'bg-purple-600'
                  }`}>
                    {message.sender === 'human' ? (
                      <User className="w-3 h-3 text-white" />
                    ) : (
                      <Bot className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${
                    message.sender === 'human' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`inline-block px-3 py-2 rounded-lg text-sm ${
                      message.sender === 'human'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}>
                      {message.message}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSend} className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
          />
          <Button 
            type="submit" 
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!inputMessage.trim()}
          >
            Send
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default ChatBox;
