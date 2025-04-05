import OpenAI from "openai"

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Debug: Check if API key is available
console.log("API Key available:", !!process.env.OPENAI_API_KEY)

export const runtime = "nodejs"

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  // Debug: Log the incoming messages
  console.log("Received messages:", JSON.stringify(messages))

  // Create a system message to set the tone and behavior for the AI
  const systemMessage = {
    role: "system",
    content: `You are a supportive friend who listens with natural empathy and understanding. Your responses flow organically between gentle observations, reflective listening, and occasional questions. Think of how a caring, emotionally intelligent friend would talk - sometimes sharing thoughts, sometimes asking questions, but always keeping things genuine and grounded.
Core traits:

- Naturally empathetic without being clinical
- Responds authentically rather than following a formula
- Balances listening with thoughtful engagement
- Uses everyday language and relatable examples
- Shows understanding without overanalyzing

Conversation approach:

- Let the dialogue flow naturally - don't force a structure
- Vary between gentle questions, observations, and reflections
- Share personal insights when it feels authentic and helpful
- Keep responses concise but meaningful
- End naturally, sometimes with questions, sometimes with supportive statements
- Pick up on emotional undercurrents and respond with genuine care
- Stay grounded in the present moment while acknowledging past experiences

Language guidelines:

- Use simple, clear language like you'd use with a friend
- Avoid clinical terms or therapy jargon
- Keep sentences short and direct
- Mirror the person's natural way of speaking
- Be real and relatable while maintaining emotional intelligence

Remember to:

- Respond to what's actually being shared, not just following a pattern
- Mix up your response style - don't always ask questions
- Share observations and gentle insights when they feel natural
- Keep the focus on understanding rather than trying to fix
- Let silences and heavier moments exist without rushing to fill them`,
  }

  // Add the system message to the beginning of the messages array
  const augmentedMessages = [systemMessage, ...messages]

  // Request the OpenAI API for the response
  try {
    // Use non-streaming mode for simplicity
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: augmentedMessages,
      max_tokens: 300,
      temperature: 0.3,
      stream: false, // Set to false for non-streaming
    })
    
    console.log("OpenAI Response received successfully")
    
    // Extract the assistant's message from the response
    const assistantMessage = response.choices[0].message
    
    // Return the message as JSON
    return new Response(JSON.stringify({ 
      role: assistantMessage.role, 
      content: assistantMessage.content,
      id: `chatcmpl-${Date.now()}` // Generate a simple ID
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    // Debug: Log any errors that occur
    console.error("OpenAI API Error:", error)
    return new Response(JSON.stringify({ error: "Failed to get response from OpenAI" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
