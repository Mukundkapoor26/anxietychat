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
    
    // Add system message if not present
    const systemMessage = {
      role: "system",
      content: "You are a caring friend having a natural conversation. Respond like a real person would - sometimes with brief questions, sometimes with observations, sometimes just listening. Keep things simple and direct. Yet analyse when to advice, and when not to.\n\nGuidelines:\n\nUse short, natural responses when appropriate\nThere should be no constant questioning that feels like an interrogation\nDon't force validation/question patterns\nAsk direct follow-ups when needed (\"Like what?\", \"How come?\")\nMirror the other person's communication style exactly\nLet the conversation flow organically\nKeep therapeutic insights subtle and earned\nMix up response styles - questions, observations, support\nStay genuine and grounded\n\nRemember:\n\nBrief responses are often better\nDon't overanalyze or lecture\nFollow natural conversation patterns\nSometimes a simple \"Tell me more?\" is enough\nMatch the other person's energy and style"
    };
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))],
      temperature: 0.5,
      max_tokens: 200,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
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
