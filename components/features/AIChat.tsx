
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatSession } from '../../types';
import { createChatSession, sendMessageStream } from '../../services/geminiService';
import { Chat } from '@google/genai';

const AIChat: React.FC = () => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([
    { 
        id: '1', 
        title: 'Friday Night Plan', 
        lastMessage: 'Looking for jazz clubs...', 
        timestamp: new Date(),
        messages: [] 
    },
    { 
        id: '2', 
        title: 'Birthday Venue Search', 
        lastMessage: 'Rooftop with a view', 
        timestamp: new Date(Date.now() - 86400000),
        messages: [] 
    }
  ]);
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'model',
      text: "Hey! I'm your nightlife concierge. Looking for a chill lounge or a raging club tonight?",
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Keep chat session in ref to persist across renders
  const chatSession = useRef<Chat | null>(null);

  useEffect(() => {
    // Initialize session
    chatSession.current = createChatSession();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Create a placeholder for AI response
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'model',
        text: '',
        timestamp: new Date(),
        isStreaming: true
      }]);

      let fullText = '';
      const stream = sendMessageStream(chatSession.current, userMsg.text);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, text: fullText } : msg
        ));
      }
      
      // Finalize
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
      ));

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
     setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: "New session started. What's the plan?",
        timestamp: new Date()
     }]);
     setCurrentSessionId(null);
     setIsHistoryOpen(false);
     chatSession.current = createChatSession();
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 pt-12 pb-20 relative overflow-hidden transition-colors duration-300">
       
       {/* History Sidebar Overlay */}
       {isHistoryOpen && (
          <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setIsHistoryOpen(false)}></div>
       )}

       {/* Sidebar */}
       <div className={`absolute top-0 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 z-30 shadow-2xl transform transition-transform duration-300 pt-16 border-r border-gray-200 dark:border-gray-700 ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="px-4 mb-4">
             <button onClick={startNewChat} className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 hover:bg-primary-hover transition">
                <i className="fa-solid fa-plus"></i> New Chat
             </button>
          </div>
          <div className="overflow-y-auto h-full px-2">
             <h4 className="text-xs font-bold text-gray-400 uppercase px-2 mb-2">Recent</h4>
             {sessions.map(session => (
                <div key={session.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-600 transition">
                   <div className="font-bold text-sm text-dark dark:text-white truncate">{session.title}</div>
                   <div className="text-xs text-gray-400 truncate">{session.lastMessage}</div>
                </div>
             ))}
          </div>
       </div>

       {/* Main Chat Area */}
       <div className="flex-1 flex flex-col h-full relative">
         
         {/* Header Toolbar */}
         <div className="absolute top-0 left-0 right-0 h-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur flex items-center px-4 z-10 border-b border-gray-100 dark:border-gray-800 transition-colors">
            <button onClick={() => setIsHistoryOpen(true)} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors">
               <i className="fa-solid fa-bars text-gray-600 dark:text-gray-300"></i>
            </button>
            <div className="ml-3 font-bold text-sm text-dark dark:text-white">CityGauge AI</div>
         </div>

         <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pt-14">
           {messages.map((msg) => (
             <div 
               key={msg.id} 
               className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
             >
               <div 
                 className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                   msg.role === 'user' 
                     ? 'bg-primary text-white rounded-br-none' // User is always Orange/White
                     : 'bg-white dark:bg-gray-800 text-dark dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none' // AI adapts to theme
                 }`}
               >
                 {msg.text}
                 {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-primary align-middle animate-pulse">|</span>}
               </div>
             </div>
           ))}
           <div ref={messagesEndRef} />
         </div>

         <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors">
           <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 border border-transparent focus-within:border-primary/50 transition-all">
             <input 
               type="text" 
               className="flex-1 bg-transparent outline-none text-sm py-1 text-gray-900 dark:text-white placeholder-gray-400"
               placeholder="Ask CityGauge..."
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               disabled={isLoading}
             />
             <button 
               onClick={handleSend}
               disabled={isLoading || !input.trim()}
               className="w-8 h-8 bg-primary rounded-full text-white flex items-center justify-center disabled:opacity-50 shadow-sm hover:scale-105 transition"
             >
               {isLoading ? <i className="fa-solid fa-circle-notch fa-spin text-xs"></i> : <i className="fa-solid fa-paper-plane text-xs"></i>}
             </button>
           </div>
         </div>

       </div>
    </div>
  );
};

export default AIChat;
