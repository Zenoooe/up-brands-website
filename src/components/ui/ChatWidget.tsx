import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, ChevronDown, Send, UserPlus, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  type: 'bot' | 'user';
  text: string;
  timestamp: Date;
  isContactInfo?: boolean;
}

interface QuickAction {
  label: string;
  action: string;
}

export const ChatWidget = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messages when language changes or first load
  useEffect(() => {
    setMessages([
      {
        id: '1',
        type: 'bot',
        text: t('chat.welcome'),
        timestamp: new Date()
      },
      {
        id: '2',
        type: 'bot',
        text: t('chat.prompt'),
        timestamp: new Date()
      }
    ]);
  }, [i18n.language, t]);

  const quickActions: QuickAction[] = [
    { label: t('chat.actions.strategy'), action: 'strategy' },
    { label: t('chat.actions.identity'), action: 'identity' },
    { label: t('chat.actions.marketing'), action: 'marketing' },
    { label: t('chat.actions.cooperation'), action: 'cooperation' },
    { label: t('chat.actions.other'), action: 'other' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const saveLead = async (contact: string, msg: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .insert([{ contact_info: contact, message: msg }]);
      
      if (error) throw error;

      fetch('/api/notify-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, message: msg })
      });

    } catch (err) {
      console.error('Error saving lead:', err);
    }
  };

  const handleCreateTogether = () => {
    // Add user action
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: t('chat.create_together'),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    // Bot response with contact info
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: t('chat.contact_methods'),
        timestamp: new Date(),
        isContactInfo: true
      };
      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    const isContactInfo = /[@]/.test(text) || /\d{8,}/.test(text);
    
    setIsSubmitting(true);

    setTimeout(async () => {
      let botResponseText = '';
      
      if (isContactInfo) {
        await saveLead(text, messages.map(m => m.text).join('\n'));
        botResponseText = t('chat.responses.contact_received');
      } else {
        botResponseText = t('chat.responses.ask_contact');
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
              <h3 className="font-bold text-lg">{t('chat.header')}</h3>
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
                    <p className="font-bold text-sm">{t('chat.bot_name')}</p>
                    <p className="text-xs text-gray-500">{t('chat.status')}</p>
                  </div>
                </div>

                {/* Messages */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
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
                    
                    {/* Special Contact Info Display */}
                    {msg.isContactInfo && (
                       <div className="mt-2 flex flex-col gap-2 max-w-[85%]">
                         {/* WeChat QR Placeholder - Replace src with actual QR code */}
                         <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                           <img 
                             src="https://sbnnpbtvdvggpqesohxa.supabase.co/storage/v1/object/public/project-images/wechat-qr-placeholder.png" 
                             alt="WeChat QR" 
                             className="w-32 h-32 object-contain mix-blend-multiply"
                             onError={(e) => {
                               (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Up-Brands-WeChat';
                             }}
                           />
                           <p className="text-xs text-center text-gray-500 mt-1">WeChat ID: Up-Brands</p>
                         </div>
                         
                         <a 
                           href="https://wa.me/8613800138000" 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#128C7E] transition-colors"
                         >
                           <MessageSquare size={16} />
                           Chat on WhatsApp
                         </a>
                       </div>
                    )}
                  </div>
                ))}

                {/* Quick Actions */}
                {messages.length > 0 && messages[messages.length - 1].type === 'bot' && !messages[messages.length - 1].isContactInfo && (
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
                
                {/* Let's Create Together Button (Always visible at bottom of chat if not user typing) */}
                <button
                    onClick={handleCreateTogether}
                    className="w-full mt-4 bg-black text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                    <UserPlus size={16} />
                    {t('chat.create_together')}
                </button>

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
                  placeholder={t('chat.input_placeholder')}
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
                  {t('chat.powered_by')}
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
