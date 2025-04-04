"use client"

import { useRef, useEffect, useState } from "react"
import { Send, Menu, X, Plus, Music, Volume2, VolumeX, MoreVertical, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { format } from "date-fns"
import { v4 as uuidv4 } from "uuid"
import MessageLimitNotice, { MessageCounter } from "@/components/MessageLimitNotice"
import { 
  initMessageLimit, 
  incrementMessageCount, 
  hasReachedLimit, 
  getMessageCount, 
  getRemainingMessages,
  shouldShowRemainingMessages
} from "@/utils/message-limit"

// Define types for our chat data
type Message = {
  role: string
  content: string
  id: string
  timestamp?: Date
}

type ChatSession = {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

// Add new type for message limit data
type MessageLimitData = {
  count: number;
  limit: number;
  remaining: number;
  limitReached: boolean;
  resetTimestamp: number;
}

// Helper function to safely use localStorage
const isBrowser = () => typeof window !== 'undefined';

const getLocalStorage = (key: string, defaultValue: any = null) => {
  if (!isBrowser()) return defaultValue;
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return JSON.parse(value, (key, value) => {
      if (key === "createdAt" || key === "updatedAt" || key === "timestamp") {
        return value ? new Date(value) : undefined;
      }
      return value;
    });
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const setLocalStorage = (key: string, value: any) => {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
};

export default function GhibliChat() {
  // State for the current chat session
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  // Update message limit related state
  const [showLimitNotice, setShowLimitNotice] = useState(false)
  const [messageCount, setMessageCount] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Initialize message limit on component mount
  useEffect(() => {
    // Initialize message limit tracker
    initMessageLimit();
    
    // Check if limit is already reached
    const limitReached = hasReachedLimit();
    setShowLimitNotice(limitReached);
    
    // Set current message count
    setMessageCount(getMessageCount());
    
    // Log current status for debugging
    console.log("Message limit status:", {
      count: getMessageCount(),
      remaining: getRemainingMessages(),
      limitReached: hasReachedLimit()
    });
  }, []);

  // Load chat sessions from localStorage on initial render
  useEffect(() => {
    if (!isBrowser()) return;
    
    try {
      const storedSessions = getLocalStorage("chatSessions", []);
      
      if (Array.isArray(storedSessions) && storedSessions.length > 0) {
        console.log("Loaded chat sessions:", storedSessions.length);
        setChatSessions(storedSessions);
        
        // Load the most recent chat if available
        const mostRecentChat = storedSessions.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];
        
        setCurrentChatId(mostRecentChat.id);
        
        // Make sure we set the full message history
        if (mostRecentChat.messages && Array.isArray(mostRecentChat.messages)) {
          setMessages([...mostRecentChat.messages]);
          console.log("Loaded messages for current chat:", mostRecentChat.messages.length);
        }
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error);
    }
  }, []);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (chatSessions.length > 0) {
      setLocalStorage("chatSessions", chatSessions);
    }
  }, [chatSessions]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle music toggle
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
        });
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  // Create a new chat session
  const createNewChat = () => {
    const newChatId = `chat-${Date.now()}`
    const newChat: ChatSession = {
      id: newChatId,
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Add the new chat to the beginning of the list
    setChatSessions(prev => [newChat, ...prev])
    
    // Update localStorage immediately
    const updatedSessions = [newChat, ...chatSessions];
    setLocalStorage("chatSessions", updatedSessions);
    
    // Set as current chat and clear messages
    setCurrentChatId(newChatId)
    setMessages([])
    setSidebarOpen(false)
  }

  // Switch to a different chat session
  const switchChat = (chatId: string) => {
    const chat = chatSessions.find(c => c.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages)
      setSidebarOpen(false)
    }
  }

  // Generate a title based on the first user message
  const generateChatTitle = (userMessage: string) => {
    // Get the first few words from the message to create a meaningful title
    const words = userMessage.split(' ');
    const titleWords = words.slice(0, 5); // Get up to 5 words
    let title = titleWords.join(' ');
    
    // Add ellipsis if the message is longer than 5 words
    if (words.length > 5) {
      title += '...';
    }
    
    return title;
  };

  // Delete a chat session
  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    
    // Remove the chat from state
    const updatedSessions = chatSessions.filter(chat => chat.id !== chatId);
    setChatSessions(updatedSessions);
    
    // Update localStorage immediately
    setLocalStorage("chatSessions", updatedSessions);
    
    // If the deleted chat was the current one, switch to another chat or clear messages
    if (currentChatId === chatId) {
      if (updatedSessions.length > 0) {
        const nextChat = updatedSessions[0];
        setCurrentChatId(nextChat.id);
        setMessages(nextChat.messages);
      } else {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
    
    // Reset delete confirmation state
    setChatToDelete(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return
    
    // Check if the user has reached their message limit
    if (hasReachedLimit()) {
      setShowLimitNotice(true);
      return;
    }

    // Create a user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    }

    // Clear input
    setInput("")

    // Update messages state
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)

    // Create new chat if this is the first message and no current chat exists
    if (!currentChatId) {
      const newChatId = `chat-${Date.now()}`
      const newChat: ChatSession = {
        id: newChatId,
        title: generateChatTitle(userMessage.content),
        messages: updatedMessages,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setCurrentChatId(newChatId)
      setChatSessions(prev => [newChat, ...prev])
      
      // Save to localStorage immediately
      const updatedSessions = [newChat, ...chatSessions];
      setLocalStorage("chatSessions", updatedSessions);
    } else {
      // Find current chat
      const currentChat = chatSessions.find((chat) => chat.id === currentChatId)
      let updatedChatSessions = [...chatSessions]

      // If this is the first message in an existing chat, update the title
      if (currentChat && currentChat.messages.length === 0) {
        const chatIndex = chatSessions.findIndex((chat) => chat.id === currentChatId)
        if (chatIndex !== -1) {
          updatedChatSessions[chatIndex] = {
            ...updatedChatSessions[chatIndex],
            title: generateChatTitle(userMessage.content),
            messages: updatedMessages,
            updatedAt: new Date(),
          }
          setChatSessions(updatedChatSessions)
        }
      } else if (currentChat) {
        // Just update the messages and updatedAt
        const chatIndex = chatSessions.findIndex((chat) => chat.id === currentChatId)
        if (chatIndex !== -1) {
          updatedChatSessions[chatIndex] = {
            ...updatedChatSessions[chatIndex],
            messages: updatedMessages,
            updatedAt: new Date(),
          }
          setChatSessions(updatedChatSessions)
        }
      }

      // Save to local storage
      setLocalStorage("chatSessions", updatedChatSessions)
    }

    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

    // Set loading state
    setIsLoading(true)
    setIsTyping(true)

    // Increment message count and update state
    const newCount = incrementMessageCount();
    setMessageCount(newCount);
    const newLimitReached = hasReachedLimit();
    
    console.log("Message count updated:", {
      newCount,
      limitReached: newLimitReached
    });

    try {
      // Send request to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Chat API response:", data);

      // Create assistant message
      const assistantMessage = {
        role: "assistant",
        content: data.content,
        id: data.id || `assistant-${Date.now()}`,
        timestamp: new Date(),
      }

      // Add assistant message to chat
      const newMessages = [...updatedMessages, assistantMessage]
      setMessages(newMessages)

      // Find the current chat session index
      let chatToUpdate = currentChatId;
      
      // If this is a new conversation (first message handled in the earlier condition)
      if (chatToUpdate) {
        // Update chat session with complete message history including assistant response
        const updatedChatSessionsWithResponse = chatSessions.map(chat => {
          if (chat.id === chatToUpdate) {
            // If this is a new chat (has only one message before this), use the first user message to set title
            const isNewChat = chat.messages.length <= 1;
            const userFirstMessage = updatedMessages[0]?.content || '';
            
            return {
              ...chat,
              // Update title if this is a new chat
              title: isNewChat ? generateChatTitle(userFirstMessage) : chat.title,
              messages: newMessages,
              updatedAt: new Date()
            };
          }
          return chat;
        });
        
        setChatSessions(updatedChatSessionsWithResponse);
        
        // Save to local storage
        setLocalStorage("chatSessions", updatedChatSessionsWithResponse);
      }
      
      // Check limit after message sent
      if (newLimitReached) {
        setShowLimitNotice(true);
      }
      
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
      setIsTyping(false)
      // Scroll to bottom after a short delay to ensure the DOM has updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  // Handle prompt suggestion click
  const handlePromptClick = (promptText: string) => {
    setInput(promptText)
  }

  // Format time as HH:MM AM/PM
  const formatTime = (date?: Date) => {
    if (!date) return "";
    return format(date, "h:mm a");
  };

  // Format date for chat list
  const formatDate = (date?: Date) => {
    if (!date) return "";
    // Get current date to compare
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If date is today, just show "Today"
    if (date >= today) {
      return "Today";
    }
    
    // If date is within current month, show day only
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      return format(date, "d");
    }
    
    // Otherwise show month and day
    return format(date, "MMM d");
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image with proper positioning */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/ghibli-landscape.png"
          alt="Ghibli landscape"
          fill
          style={{
            objectFit: "cover",
            filter: "brightness(0.85)", // Reduce brightness of the image
          }}
          priority
        />
        {/* Darker semi-transparent overlay */}
        <div className="absolute inset-0 bg-ghibli-dark-green/20"></div>
      </div>

      {/* Sidebar toggle button - Pill shaped with logo and name */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "fixed top-4 left-4 z-30 shadow-lg backdrop-blur-md transition-all duration-300 flex items-center overflow-hidden border border-white/20",
          sidebarOpen 
            ? "bg-ghibli-dark-green/70 hover:bg-ghibli-dark-green/80 w-12 h-12 justify-center rounded-full" 
            : "bg-ghibli-dark-green/70 hover:bg-ghibli-dark-green/80 pl-1.5 pr-5 h-12 justify-between rounded-full"
        )}
      >
        {sidebarOpen ? (
          <X size={24} className="text-ghibli-beige" />
        ) : (
          <>
            <div className="w-9 h-9 flex items-center justify-center bg-ghibli-medium-green/40 rounded-full">
              <Image 
                src="/chat-logo.png" 
                alt="AnxietyChat Logo" 
                width={34} 
                height={34}
                className="rounded-sm"
              />
            </div>
            <span className="text-ghibli-beige font-copernicus text-sm font-medium ml-2">AnxietyChat</span>
          </>
        )}
      </button>

      {/* Music toggle button */}
      <button
        onClick={toggleMusic}
        className="fixed top-4 right-4 z-30 bg-ghibli-medium-green hover:bg-ghibli-medium-green/90 text-white p-2 rounded-full shadow-md backdrop-blur-sm w-10 h-10 flex items-center justify-center"
      >
        {isMusicPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src="/relaxing-music.mp3" 
        loop 
        preload="auto"
      />

      {/* Simplified Sidebar with glass effect - now mobile friendly */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full bg-ghibli-dark-green/70 backdrop-blur-md z-20 transition-all duration-300 ease-in-out overflow-y-auto",
          sidebarOpen ? "w-full sm:w-72 opacity-100" : "w-0 opacity-0",
        )}
      >
        <div className="p-4 sm:p-6 pt-20 sm:pt-24 relative">
          {/* New Chat button */}
          <button 
            onClick={createNewChat}
            className="flex items-center gap-3 text-ghibli-beige mb-6 sm:mb-8 hover:text-white transition-colors mt-2 sm:mt-4"
          >
            <div className="bg-ghibli-medium-green rounded-full p-1.5">
              <Plus size={18} />
            </div>
            <span className="font-copernicus text-lg">New chat</span>
          </button>

          {/* Recents heading */}
          <h3 className="text-ghibli-beige/70 text-xs font-copernicus uppercase tracking-wider mb-3 sm:mb-4">Recents</h3>

          {/* Chat history */}
          <div className="space-y-4">
            {chatSessions.length > 0 ? (
              chatSessions.map((chat) => (
                <div
                  key={chat.id}
                  className={cn("text-ghibli-beige font-copernicus cursor-pointer transition-colors py-1 group relative", currentChatId === chat.id ? "text-white" : "hover:text-white")}
                >
                  <div 
                    onClick={() => switchChat(chat.id)}
                    className="flex justify-between items-center pr-8"
                  >
                    <span className="truncate">{chat.title}</span>
                    <span className="text-xs font-medium ml-2 px-1.5 py-0.5 rounded bg-ghibli-medium-green/20">{formatDate(chat.updatedAt)}</span>
                  </div>
                  
                  {/* Three dots menu button */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatToDelete(chatToDelete === chat.id ? null : chat.id);
                      }}
                      className="p-1 hover:bg-ghibli-medium-green/20 rounded-full"
                    >
                      <MoreVertical size={16} className="text-ghibli-beige" />
                    </button>
                  </div>
                  
                  {/* Delete button that appears when three dots is clicked */}
                  {chatToDelete === chat.id && (
                    <div className="absolute right-0 top-full mt-1 bg-ghibli-dark-green/90 backdrop-blur-md rounded shadow-lg z-10 p-1">
                      <button 
                        onClick={(e) => deleteChat(chat.id, e)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-ghibli-medium-green/20 rounded w-full"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-ghibli-beige/70 italic">No conversations yet</div>
            )}
          </div>
        </div>
      </div>

      <main
        className={cn("flex-1 flex flex-col relative z-10 transition-all duration-300", 
          sidebarOpen ? "sm:ml-72" : "ml-0"
        )}
      >
        {messages.length === 0 ? (
          // Welcome screen when no messages - centered vertically and horizontally
          <div className="flex flex-col items-center justify-center h-screen p-4 pt-16 sm:pt-4">
            <div className="flex flex-col items-center w-full max-w-xl">
              <h1 className="text-ghibli-dark-green text-4xl md:text-5xl font-copernicus font-medium tracking-tight text-center mb-10">
                How Are You Feeling Today?
              </h1>

              {/* Input form centered - wider and taller than the heading */}
              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative">
                  <div className="relative rounded-full overflow-hidden backdrop-blur-sm bg-ghibli-beige-darker/70 shadow-md">
                    <input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Share what's on your mind..."
                      className="w-full py-5 px-6 bg-transparent border-none outline-none text-ghibli-dark-green placeholder:text-ghibli-dark-green/60 font-copernicus"
                      disabled={showLimitNotice}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim() || showLimitNotice}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-ghibli-medium-green/90 hover:bg-ghibli-medium-green text-ghibli-beige py-2.5 px-5 font-copernicus flex items-center gap-2"
                    >
                      <span>Send</span>
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Message count indicator for welcome screen */}
                {shouldShowRemainingMessages() && (
                  <div className="fixed bottom-4 right-4 z-30">
                    <div className="text-xs bg-ghibli-beige-darker/60 text-ghibli-dark-green/70 font-copernicus px-3 py-1 rounded-full backdrop-blur-sm">
                      {10 - messageCount} message{10 - messageCount !== 1 ? 's' : ''} remaining today
                    </div>
                  </div>
                )}
                
                {/* Show message limit notice */}
                {showLimitNotice && (
                  <div className="mt-6">
                    <MessageLimitNotice />
                  </div>
                )}
                
                {/* Prompt suggestions */}
                {!showLimitNotice && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => handlePromptClick("I'm feeling overwhelmed right now.")}
                      className="text-sm text-ghibli-dark-green/80 hover:text-ghibli-dark-green bg-ghibli-beige-darker/40 hover:bg-ghibli-beige-darker/60 px-3 py-1.5 rounded-full font-copernicus transition-colors backdrop-blur-sm"
                    >
                      I'm feeling overwhelmed
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePromptClick("I just need to breathe.")}
                      className="text-sm text-ghibli-dark-green/80 hover:text-ghibli-dark-green bg-ghibli-beige-darker/40 hover:bg-ghibli-beige-darker/60 px-3 py-1.5 rounded-full font-copernicus transition-colors backdrop-blur-sm"
                    >
                      I just need to breathe
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePromptClick("My thoughts won't slow down.")}
                      className="text-sm text-ghibli-dark-green/80 hover:text-ghibli-dark-green bg-ghibli-beige-darker/40 hover:bg-ghibli-beige-darker/60 px-3 py-1.5 rounded-full font-copernicus transition-colors backdrop-blur-sm"
                    >
                      My thoughts won't slow down
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : (
          // Chat interface when conversation has started
          <div className="flex-1 flex flex-col p-4 md:p-6 pt-16 sm:pt-4 relative">
            {/* Chat messages */}
            <div className="flex-1 overflow-auto pb-36">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] p-3 shadow-md backdrop-blur-sm font-copernicus relative",
                        message.role === "user"
                          ? "bg-ghibli-light-green/80 border border-ghibli-medium-green/60 text-ghibli-dark-green chat-bubble-right"
                          : "bg-ghibli-beige-darker/85 border border-ghibli-medium-green/50 text-ghibli-dark-green chat-bubble-left",
                      )}
                    >
                      {message.content}
                      
                      {/* Time and double tick for user messages */}
                      {message.role === "user" && (
                        <div className="flex items-center justify-end mt-1 text-xs text-ghibli-dark-green/70 space-x-1">
                          <span>{formatTime(message.timestamp)}</span>
                          <div className="ml-1 relative">
                            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-ghibli-medium-green">
                              <path d="M10.7 1L5.85 6.75L3.3 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14.7 1L9.85 6.75L7.3 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {/* Time for assistant messages */}
                      {message.role === "assistant" && (
                        <div className="flex justify-end mt-1 text-xs text-ghibli-dark-green/70">
                          <span>{formatTime(message.timestamp)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-4 shadow-md backdrop-blur-sm font-copernicus relative bg-ghibli-beige-darker/85 border border-ghibli-medium-green/50 text-ghibli-dark-green chat-bubble-left">
                      <div className="flex space-x-1.5 items-center min-h-[24px]">
                        <div className="w-2 h-2 rounded-full bg-ghibli-dark-green/80 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-ghibli-dark-green/80 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-ghibli-dark-green/80 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      {/* Add timestamp to make it look more like a real message */}
                      <div className="flex justify-end mt-1 text-xs text-ghibli-dark-green/70">
                        <span>{formatTime(new Date())}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input form - fixed at bottom with no gradient */}
            <div className="fixed bottom-0 left-0 right-0 pb-4 px-4 md:px-6 z-10">
              <div className="max-w-3xl mx-auto w-full relative">
                {/* Show message limit notice in chat mode */}
                {showLimitNotice && (
                  <div className="mb-6">
                    <MessageLimitNotice />
                  </div>
                )}
                
                {!showLimitNotice && (
                  <form onSubmit={handleSubmit}>
                    {/* Message count indicator positioned at top right of typing panel */}
                    {shouldShowRemainingMessages() && (
                      <div className="absolute -top-8 right-0">
                        <div className="text-xs bg-ghibli-beige-darker/60 text-ghibli-dark-green/70 font-copernicus px-3 py-1 rounded-full backdrop-blur-sm">
                          {10 - messageCount} message{10 - messageCount !== 1 ? 's' : ''} remaining today
                        </div>
                      </div>
                    )}
                    
                    <div className="relative">
                      <div className="relative rounded-full overflow-hidden backdrop-blur-sm bg-ghibli-beige-darker/70 shadow-md">
                        <input
                          value={input}
                          onChange={handleInputChange}
                          placeholder="Share what's on your mind..."
                          className="w-full py-5 px-6 bg-transparent border-none outline-none text-ghibli-dark-green placeholder:text-ghibli-dark-green/60 font-copernicus"
                        />
                        <button
                          type="submit"
                          disabled={isLoading || !input.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-ghibli-medium-green/90 hover:bg-ghibli-medium-green text-ghibli-beige py-2.5 px-5 font-copernicus flex items-center gap-2"
                        >
                          <span>Send</span>
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Prompt suggestions for chat interface */}
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => handlePromptClick("I'm feeling overwhelmed right now.")}
                        className="text-xs text-ghibli-dark-green/70 hover:text-ghibli-dark-green bg-ghibli-beige-darker/30 hover:bg-ghibli-beige-darker/50 px-2.5 py-1 rounded-full font-copernicus transition-colors backdrop-blur-sm"
                      >
                        I'm feeling overwhelmed
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromptClick("I just need to breathe.")}
                        className="text-xs text-ghibli-dark-green/70 hover:text-ghibli-dark-green bg-ghibli-beige-darker/30 hover:bg-ghibli-beige-darker/50 px-2.5 py-1 rounded-full font-copernicus transition-colors backdrop-blur-sm"
                      >
                        I just need to breathe
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromptClick("My thoughts won't slow down.")}
                        className="text-xs text-ghibli-dark-green/70 hover:text-ghibli-dark-green bg-ghibli-beige-darker/30 hover:bg-ghibli-beige-darker/50 px-2.5 py-1 rounded-full font-copernicus transition-colors backdrop-blur-sm"
                      >
                        My thoughts won't slow down
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Add custom CSS for chat bubbles */}
      <style jsx global>{`
        .chat-bubble-right {
          border-radius: 18px 18px 4px 18px;
        }
        
        .chat-bubble-left {
          border-radius: 18px 18px 18px 4px;
        }
      `}</style>
    </div>
  )
}
