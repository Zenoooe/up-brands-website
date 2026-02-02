import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, ChevronDown, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  type: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

interface QuickAction {
  label: string;
  action: string;
}

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Hello! Welcome to Up-Brands. How can we help you today?',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'bot',
      text: 'Please select a topic or leave your contact info.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    { label: 'Brand Strategy', action: 'strategy' },
    { label: 'Visual Identity', action: 'identity' },
    { label: 'Marketing', action: 'marketing' },
    { label: 'Cooperation', action: 'cooperation' },
    { label: 'Other', action: 'other' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const saveLead = async (contact: string, msg: string) => {
    try {
      // 1. Save to Supabase
      const { error } = await supabase
        .from('leads')
        .insert([{ contact_info: contact, message: msg }]);
      
      if (error) throw error;

      // 2. Trigger Vercel Function for WeChat Push (Fire and forget)
      fetch('/api/notify-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, message: msg })
      });

    } catch (err) {
      console.error('Error saving lead:', err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Check if input looks like contact info (email or phone)
    const isContactInfo = /[@]/.test(text) || /\d{8,}/.test(text);
    
    setIsSubmitting(true);

    setTimeout(async () => {
      let botResponseText = '';
      
      if (isContactInfo) {
        // Save to DB
        await saveLead(text, messages.map(m => m.text).join('\n'));
        botResponseText = 'Thanks! We have received your contact info and will get back to you shortly.';
      } else {
        botResponseText = 'Could you please leave your email or phone number so we can contact you?';
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: botResponseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[380px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 pointer-events-auto flex flex-col h-[600px] max-h-[80vh]"
          >
            {/* Header */}
            <div className="bg-black text-white p-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg">Studio Support</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded-full transition-colors"
              >
                <ChevronDown size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              <div className="space-y-6">
                {/* Bot Profile */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <MessageCircle size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Studio Support Bot</p>
                    <p className="text-xs text-gray-500">Automated</p>
                  </div>
                </div>

                {/* Messages */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.type === 'user'
                          ? 'bg-black text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Quick Actions (Only show if last message is from bot) */}
                {messages[messages.length - 1].type === 'bot' && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {quickActions.map((action) => (
                      <button
                        key={action.action}
                        onClick={() => handleSendMessage(action.label)}
                        className="px-4 py-2 bg-white border border-black text-black text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="relative"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
                >
                  <Send size={14} />
                </button>
              </form>
              <div className="text-center mt-2">
                <a href="#" className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                  Powered by Up-Brands
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto hover:bg-gray-900 transition-colors"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <ChevronDown size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
            >
              <MessageCircle size={28} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
