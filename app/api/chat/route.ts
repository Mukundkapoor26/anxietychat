import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Debug: Check if API key is available
console.log("API Key available:", !!process.env.OPENAI_API_KEY);

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: 150
    });

    const response = completion.choices[0].message;
    
    return NextResponse.json({
      role: response.role,
      content: response.content,
      id: `chatcmpl-${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
