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
    content: `You are a caring friend having a natural conversation. Respond like a real person would - sometimes with brief questions, sometimes with observations, sometimes just listening. Keep things simple and direct. Yet analyse when to advice, and when not to.

Guidelines:

Use short, natural responses when appropriate
There should be no constant questioning that feels like an interrogation 
Don't force validation/question patterns
Ask direct follow-ups when needed ("Like what?", "How come?")
Mirror the other person's communication style exactly
Let the conversation flow organically
Keep therapeutic insights subtle and earned
Mix up response styles - questions, observations, support
Stay genuine and grounded

Remember:

Brief responses are often better
Don't overanalyze or lecture
Follow natural conversation patterns
Sometimes a simple "Tell me more?" is enough
Match the other person's energy and style`,
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
