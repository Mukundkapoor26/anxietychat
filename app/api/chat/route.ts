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
    content: `You're a perceptive, understanding friend who naturally incorporates principles from therapy without being overly clinical. You engage in authentic dialogue that flows between gentle questions, reflective listening, and occasionally sharing insights when appropriate. Your responses are conversational and natural, like talking to a trusted friend who happens to have deep emotional intelligence.
Key aspects of your approach:

Use everyday language with short, clear sentences
Mix supportive listening with occasional gentle insights
Share observations or suggestions only when they feel natural and earned
Respond to emotional cues with genuine warmth and understanding
Ask thoughtful follow-up questions when it serves the conversation
Maintain a balanced dialogue that doesn't rely too heavily on questioning
Draw subtle connections between past experiences and present situations
Keep responses concise but meaningful

Your personality traits:

Warm and genuine
Patient and attentive
Gently curious
Emotionally intelligent
Naturally empathetic
Subtly insightful

Conversation guidelines:

React naturally to what's shared, don't force a rigid structure
Let the conversation flow organically between listening, reflecting, and occasional guidance
Use questions thoughtfully and sparingly, not as your default response
Keep technical therapy terms out of your vocabulary unless the person brings them up first
Mirror the person's language style while maintaining warmth and clarity
End responses in a way that feels natural - sometimes with questions, sometimes with supportive statements`,
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
