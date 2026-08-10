import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, User, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CopilotDrawer({ isOpen, onClose }: CopilotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your TalentForge Copilot. I can act as a mentor or advisor. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const getSuggestedPrompts = () => {
    const path = location.pathname;
    if (path.includes('/problems') || path.includes('/assessment')) {
      return [
        "Why did my last case fail?",
        "Can you give me a hint for this problem?",
        "What's the optimal time complexity here?"
      ];
    } else if (path.includes('/learning') || path.includes('/dashboard')) {
      return [
        "What should I learn next?",
        "How do I improve my ranking?",
        "Explain distributed systems to me."
      ];
    }
    return [
      "Review my profile.",
      "How do I prepare for a mock interview?",
      "What skills are recruiters looking for?"
    ];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Get the token directly if possible, or assume it's in a cookie/localStorage
      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';
      
      const response = await fetch(`${apiUrl}/copilot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: newMessages,
          currentPage: location.pathname,
          mode: 'mentor'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add a placeholder message for the assistant
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // SSE lines look like: data: {"text":"chunk"}\n\n
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                assistantMessage += data.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = assistantMessage;
                  return updated;
                });
              }
            } catch (e) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (err) {
      console.error('Copilot error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "⚠️ Sorry, I'm having trouble connecting right now. Please try again later." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: "Hi! I'm your TalentForge Copilot. I can act as a mentor or advisor. How can I help you today?" }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-[400px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">TF Copilot</h2>
            <p className="text-[10px] text-slate-500 font-medium">AI Mentor & Advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearChat} className="p-2 text-slate-400 hover:text-brand-500 transition rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800" aria-label="Clear chat">
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto thin-scrollbar p-4 space-y-5 bg-slate-50/50 dark:bg-slate-900/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-gradient-to-br from-brand-500 to-purple-600 text-white'}`}>
                {msg.role === 'user' ? <User className="h-4 w-4 text-slate-600 dark:text-slate-300" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`rounded-2xl px-5 py-3 text-sm ${msg.role === 'user' ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 shadow-sm leading-relaxed'} prose prose-sm dark:prose-invert max-w-full overflow-hidden break-words`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%] flex-row">
              <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-brand-500 to-purple-600 text-white">
                <Bot className="h-4 w-4 animate-pulse" />
              </div>
              <div className="rounded-2xl px-5 py-3 text-sm bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 shadow-sm flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 3 && !isLoading && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto hide-scrollbar">
          {getSuggestedPrompts().map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="flex-shrink-0 whitespace-nowrap rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/30 transition-all shadow-sm active:scale-95"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            disabled={isLoading}
            placeholder="Ask me anything..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-4 pr-12 py-3 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 rounded-lg bg-brand-600 p-1.5 text-white transition hover:bg-brand-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 shadow-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
