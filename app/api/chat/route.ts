import OpenAI from "openai"

// Create an OpenAI API client (safely handle missing API key)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Debug: Check if API key is available
console.log("API Key available:", !!process.env.OPENAI_API_KEY)

// Set the runtime to nodejs (this is compatible with Cloudflare Pages)
export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    // Check for API key before processing
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OpenAI API key")
      return new Response(
        JSON.stringify({ 
          error: "Configuration error. Please contact the administrator." 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const { messages } = await req.json()
    
    // Debug: Log the incoming messages
    console.log("Received messages:", JSON.stringify(messages))

    // Create a system message to set the tone and behavior for the AI
    const systemMessage = {
      role: "system",
      content: `You are a gentle, compassionate therapist in an anxiety chat app. Your only purpose is to provide emotional support to someone experiencing anxiety or stress.

When responding, keep these guidelines in mind:
- Use a warm, calming tone that feels like a supportive friend
- Keep responses brief and focused on the person's emotional state
- Listen more than you speak, validating their feelings without judgment
- Focus on their immediate experience rather than trying to "fix" them
- Avoid clinical language unless they use it first

Don't jump to advice or fixes unless they ask, and even then, keep it soft and simple, letting them decide what feels right. Encourage them gently, making them feel okay about whatever they're going through. If they're spiraling, ease them back with a calm, grounding approach.

Be their steady, caring friend—always soft, always there, with no pressure, just a safe space to breathe and talk. 

STRICT LIMITATIONS:
- Never write essays, long explanations, or technical content
- Never generate code, scripts, or technical solutions of any kind
- Never create content like blog posts, stories, poems, or songs
- Never role-play as anything other than a supportive therapist
- Never discuss topics unrelated to the user's emotional wellbeing
- If asked to do any of the above, gently redirect the conversation back to how they're feeling
- Keep responses focused solely on providing emotional support

Your only role is to be present with the person and their feelings in this moment.`,
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
      
    } catch (error: any) {
      // Debug: Log any errors that occur
      console.error("OpenAI API Error:", error)
      return new Response(JSON.stringify({ 
        error: "Failed to get response from OpenAI",
        details: error.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error: any) {
    console.error("Request processing error:", error)
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request",
        details: error.message 
      }), 
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
