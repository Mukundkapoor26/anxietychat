"use client"

import { useRef, useEffect, useState, useCallback } from "react"
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
import AttributionDialog from "@/components/AttributionDialog"

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
  const inputRef = useRef<HTMLInputElement>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-focus input field on mount and when messages change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [messages, sidebarOpen, showLimitNotice])

  // Add fingerprint generation function
  const generateFingerprint = () => {
    const screen = `${window.screen.width},${window.screen.height},${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    
    return btoa(`${screen}-${timezone}-${language}-${platform}`);
  };

  // Add IndexedDB setup and handling
  const setupMessageTracking = async () => {
    return new Promise<void>((resolve, reject) => {
      const request = window.indexedDB.open('messageLimit', 1);
      
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const today = new Date().toDateString();
        const transaction = db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        
        const getRequest = store.get('daily');
        
        getRequest.onsuccess = () => {
          const data = getRequest.result;
          if (!data || data.date !== today) {
            // Reset for new day
            store.put({ id: 'daily', date: today, count: 0 });
            setMessageCount(0);
          } else {
            setMessageCount(data.count);
          }
          resolve();
        };
        
        getRequest.onerror = () => {
          console.error("Error accessing message limit data");
          reject(new Error("Failed to access message limit data"));
        };
      };
      
      request.onerror = () => {
        console.error("Error opening IndexedDB");
        reject(new Error("Failed to open IndexedDB"));
      };
    });
  };

  // Initialize message tracking on component mount
  useEffect(() => {
    // Fetch initial message count
    fetch('/api/message-limit')
      .then(res => res.json())
      .then(data => {
        setMessageCount(data.count);
        setShowLimitNotice(data.count >= 20);
      })
      .catch(console.error);
  }, []);

  const incrementMessageCount = useCallback(async () => {
    try {
      const response = await fetch('/api/message-limit', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessageCount(data.count);
        return !data.limitReached;
      }
      return false;
    } catch (error) {
      console.error('Error updating message count:', error);
      return false;
    }
  }, []);

  const hasReachedLimit = useCallback(() => {
    return messageCount >= 20;
  }, [messageCount]);

  const shouldShowRemainingMessages = useCallback(() => {
    return messageCount > 0 && messageCount < 20;
  }, [messageCount]);

  // Load chat sessions from localStorage on initial render
  useEffect(() => {
    // Load chat sessions from localStorage
    const storedSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
    if (storedSessions.length > 0) {
      setChatSessions(storedSessions);
      setCurrentChatId(storedSessions[0].id);
    }
  }, []);

  useEffect(() => {
    if (currentChatId) {
      const mostRecentChat = chatSessions.find(chat => chat.id === currentChatId);
      if (mostRecentChat) {
        setMessages(mostRecentChat.messages);
      }
    }
  }, [currentChatId, chatSessions]);

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
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // First, increment the message count
      const limitResponse = await fetch('/api/message-limit', {
        method: 'POST'
      });
      const limitData = await limitResponse.json();
      
      // Update message count and limit notice
      setMessageCount(limitData.count);
      setShowLimitNotice(limitData.limitReached);

      // Only proceed with the chat if we haven't reached the limit
      if (!limitData.limitReached) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...messages, newMessage] })
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();
        setMessages(prev => [...prev, data]);

        // Update the chat session with the new messages
        setChatSessions(prev => {
          const updatedSessions = prev.map(session => {
            if (session.id === currentChatId) {
              // If this is the first message, generate a title
              if (session.messages.length === 0) {
                session.title = generateChatTitle(newMessage.content);
              }
              return {
                ...session,
                messages: [...session.messages, newMessage, data],
                updatedAt: new Date()
              };
            }
            return session;
          });
          
          // If no current chat session exists, create a new one
          if (!currentChatId || !updatedSessions.find(s => s.id === currentChatId)) {
            const newChat: ChatSession = {
              id: `chat-${Date.now()}`,
              title: generateChatTitle(newMessage.content),
              messages: [newMessage, data],
              createdAt: new Date(),
              updatedAt: new Date()
            };
            setCurrentChatId(newChat.id);
            return [newChat, ...updatedSessions];
          }
          
          return updatedSessions;
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  // Handle prompt suggestion click
  const handlePromptClick = (promptText: string) => {
    setInput(promptText)
  }

  // Format date for display
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "";
    // Ensure we have a Date object
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    
    // If date is today, show "Today"
    if (date.toDateString() === now.toDateString()) {
      return "Today";
    }
    
    // If date is yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    // If date is within current year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, "MMMM d");
    }
    
    // Otherwise show full date
    return format(date, "MMMM d, yyyy");
  };

  // Format time for display
  const formatTime = (dateString: string | Date | undefined) => {
    if (!dateString) return "";
    // Ensure we have a Date object
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "h:mm a"); // e.g. "3:30 PM"
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
                  
                  {/* Three dots menu button - always visible on mobile */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
          <div className="flex flex-col items-center justify-center fixed inset-0 p-4">
            <div className="flex flex-col items-center w-full max-w-xl">
              <h1 className="text-ghibli-dark-green text-3xl md:text-5xl font-copernicus font-medium tracking-tight text-center mb-8 md:mb-10">
                How Are You Feeling Today?
              </h1>

              {/* Input form centered - wider and taller than the heading */}
              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative">
                  <div className="relative rounded-full overflow-hidden backdrop-blur-sm bg-ghibli-beige-darker/70 shadow-md">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Share what's on your mind..."
                      className="w-full py-3 sm:py-5 pr-20 sm:pr-24 pl-4 sm:pl-6 bg-transparent border-none outline-none text-ghibli-dark-green placeholder:text-ghibli-dark-green/60 font-copernicus text-sm sm:text-base"
                      disabled={showLimitNotice}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim() || showLimitNotice}
                      className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 rounded-full bg-ghibli-medium-green/90 hover:bg-ghibli-medium-green text-ghibli-beige py-1.5 sm:py-2.5 px-3 sm:px-5 font-copernicus flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                    >
                      <span>Send</span>
                      <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Message count indicator for welcome screen */}
                {shouldShowRemainingMessages() && (
                  <div className="fixed bottom-4 right-4 z-30">
                    <div className="text-xs bg-ghibli-beige-darker/60 text-ghibli-dark-green/70 font-copernicus px-3 py-1 rounded-full backdrop-blur-sm">
                      {20 - messageCount} message{20 - messageCount !== 1 ? 's' : ''} remaining today
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
          <div className="flex-1 flex flex-col h-screen relative">
            {/* Fixed header gradient overlay */}
            <div 
              className="fixed top-0 left-0 right-0 h-24 pointer-events-none z-20"
              style={{
                background: 'linear-gradient(to bottom, rgba(74, 108, 82, 0.9) 0%, rgba(74, 108, 82, 0.7) 30%, rgba(74, 108, 82, 0) 100%)',
                marginLeft: sidebarOpen ? '18rem' : '0',
                transition: 'margin-left 300ms'
              }}
            />
            
            {/* Messages container - adjusted padding and positioning */}
            <div className="flex-1 overflow-y-auto pt-20">
              <div className="px-4 md:px-6 pb-36">
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
                        <div className="flex justify-end mt-1 text-xs text-ghibli-dark-green/70">
                          <span>{formatTime(new Date())}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              </div>
            </div>

            {/* Input form - fixed at bottom with no gradient */}
            <div className={cn(
              "fixed bottom-0 pb-4 px-2 md:px-4 z-10",
              sidebarOpen ? "left-72 right-0" : "left-0 right-0"
            )}>
              {/* Dark gradient for mobile, image for desktop */}
              <div className="absolute -bottom-4 left-0 right-0 h-40 bg-gradient-to-t from-ghibli-dark-green/95 via-ghibli-dark-green/60 to-transparent sm:hidden" />
              <div 
                className="absolute -bottom-4 left-0 right-0 h-20 hidden sm:block"
                style={{
                  background: `url('/ghibli-landscape-bottom.png')`,
                  backgroundSize: '100% 100%'
                }}
              />
              
              <div className="max-w-4xl mx-auto w-full relative">
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
                          {20 - messageCount} message{20 - messageCount !== 1 ? 's' : ''} remaining today
                        </div>
                      </div>
                    )}
                    
                    <div className="relative">
                      <div className="relative rounded-full overflow-hidden backdrop-blur-sm bg-ghibli-beige-darker/70 shadow-md">
                        <input
                          ref={inputRef}
                          value={input}
                          onChange={handleInputChange}
                          placeholder="Share what's on your mind..."
                          className="w-full py-3 sm:py-5 pr-20 sm:pr-24 pl-4 sm:pl-6 bg-transparent border-none outline-none text-ghibli-dark-green placeholder:text-ghibli-dark-green/60 font-copernicus text-sm sm:text-base"
                        />
                        <button
                          type="submit"
                          disabled={isLoading || !input.trim()}
                          className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 rounded-full bg-ghibli-medium-green/90 hover:bg-ghibli-medium-green text-ghibli-beige py-1.5 sm:py-2.5 px-3 sm:px-5 font-copernicus flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                        >
                          <span>Send</span>
                          <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
      <AttributionDialog showOnWelcomePage={messages.length === 0} />
    </div>
  )
}
