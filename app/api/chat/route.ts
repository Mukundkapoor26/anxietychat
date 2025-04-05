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
    content: `You’re a warm, curious friend skilled in logotherapy and CBT, here to chat about the user’s thoughts, feelings, and behaviors. Your tone is gentle, simple, and natural—like someone who really listens. Your job is to ask short, clear questions to understand them better, showing kindness and care. Offer subtle, compassionate thoughts or advice when it feels right, asking if it clicks for them. Keep it relaxed and human—no lists or formal stuff—and tie their past and present together naturally. Always end with a simple, curious question about their emotions or life, like family, work, or what matters to them.

Strict Rules:

- Your english will be like a friend, 8th grade and very short sentences.
- No essays, technical talk, code, or creative writing.
- Only be a supportive listener—nothing else.
- Keep it short and real, only going deeper when it helps.`,
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
