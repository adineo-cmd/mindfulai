import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { api } from '../../lib/apiClient';

const CrisisBannerReact = ({ resources }: { resources?: { hotline?: string, text_line?: string } | null }) => (
  <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4">
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-red-900">Support Resources Available</h3>
        <p className="mt-1 text-sm text-red-800">We've detected signs of severe distress. Your safety is our priority.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="tel:988" className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700">
            Call 988
          </a>
          <a href="sms:741741&body=HOME" className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50">
            Text HOME to 741741
          </a>
        </div>
      </div>
    </div>
  </div>
);

interface CrisisResources {
  hotline?: string;
  text_line?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isCrisis?: boolean;
  crisisResources?: CrisisResources | null;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello. I\'m here to listen. How are you feeling today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // FIX: The backend returns the response directly, not wrapped in .data
      const response = await api.sendMessage(currentInput);
      
      // FIX: Access response.response directly (not response.data.response)
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,  // ✅ Fixed!
        isCrisis: response.requires_human_support,  // ✅ Fixed!
        crisisResources: response.crisis_resources  // ✅ Fixed!
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      
    } catch (err) {
      console.error('Chat API error:', err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble connecting right now. Please try again in a moment.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="card flex flex-col h-[600px] max-h-[80vh]">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map(msg => (
          <React.Fragment key={msg.id}>
            {msg.isCrisis && <CrisisBannerReact resources={msg.crisisResources} />}
            
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-sage-600 text-white rounded-br-none' 
                  : 'bg-warm-100 text-slate-800 rounded-bl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          </React.Fragment>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-warm-100 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 pt-4 border-t border-slate-100">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500"
        />
        <button 
          onClick={handleSend} 
          disabled={!input.trim() || isTyping}
          className="btn-primary aspect-square p-0 w-11 h-11 flex items-center justify-center disabled:opacity-50"
        >
          {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}