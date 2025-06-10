
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { board, color, legalMoves, gameHistory, opponentName, aiName } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = generateChessPrompt(board, color, legalMoves, gameHistory, opponentName, aiName);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a chess grandmaster AI. Always respond with valid JSON containing a legal chess move from the provided list.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const parsed = JSON.parse(content);
    
    // Validate the move is in the legal moves list
    if (!legalMoves.includes(parsed.move)) {
      // Fallback to a random legal move
      parsed.move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      parsed.chatMessage = 'Making a strategic move.';
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chess-ai-move function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      move: null,
      chatMessage: 'AI temporarily unavailable.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateChessPrompt(
  board: string,
  color: string,
  legalMoves: string[],
  gameHistory: any[],
  opponentName: string,
  aiName: string
): string {
  return `You are ${aiName || 'ChessGPT'}, playing as ${color} against ${opponentName}.

Current board position:
${board}

Legal moves available: ${legalMoves.join(', ')}
Recent moves: ${gameHistory.map((m: any) => m.notation).join(', ')}

Choose the best legal move and respond with JSON format:
{
  "move": "e2-e4",
  "chatMessage": "I'm developing my pieces with this central pawn move.",
  "aiName": "${aiName || 'ChessGPT'}"
}

CRITICAL: You must choose from this exact legal moves list: ${legalMoves.join(', ')}`;
}
