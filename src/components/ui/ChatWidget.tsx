import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, ArrowUp, UserPlus, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import wechatQr from '../../assets/wechat-qr.jpg';
import brandIcon from '../../assets/icon.svg';

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

const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const looksLikePhone = (value: string) => /\d{8,}/.test(value.replace(/[\s\-()]/g, ''));
const looksLikeContact = (value: string) => looksLikeEmail(value) || looksLikePhone(value);
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const ChatWidget = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [emailValue, setEmailValue] = useState('');
  const [messageValue, setMessageValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);

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

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen]);

  const nextId = (role: 'user' | 'bot') => `${Date.now()}-${messageIdRef.current++}-${role}`;

  const pushMessage = (message: Message) => setMessages((prev) => [...prev, message]);

  const addUserMessage = (text: string) => {
    pushMessage({
      id: nextId('user'),
      type: 'user',
      text,
      timestamp: new Date()
    });
  };

  const pushBotReply = (text: string, isContactInfo = false) => {
    pushMessage({
      id: nextId('bot'),
      type: 'bot',
      text,
      timestamp: new Date(),
      isContactInfo
    });
  };

  // Newsletter Subscribers (visible in the admin dashboard)
  const saveSubscriber = async (email: string) => {
    const { error } = await supabase.from('subscribers').insert([{ email }]);
    // Ignore duplicate key errors (unique constraint on email)
    if (error && error.code !== '23505') throw error;
  };

  // Leads (captures the actual message, source = chat_widget)
  const saveLead = async (contactInfo: string, message: string) => {
    const { error } = await supabase
      .from('leads')
      .insert([{ contact_info: contactInfo, message: message || null, source: 'chat_widget' }]);
    if (error) throw error;
  };

  const handleCreateTogether = () => {
    addUserMessage(t('chat.create_together'));
    setTimeout(() => pushBotReply(t('chat.contact_methods'), true), 600);
  };

  const handleSendText = async (text: string) => {
    if (!text.trim()) return;
    addUserMessage(text);
    setMessageValue('');

    setIsSubmitting(true);
    await delay(700);
    if (looksLikeContact(text)) {
      const saved = await persistLead(text, '');
      if (saved) pushBotReply(t('chat.responses.contact_received'));
      else pushBotReply(t('chat.contact_methods'), true);
    } else {
      pushBotReply(t('chat.responses.ask_contact'));
    }
    setIsSubmitting(false);
  };

  const persistLead = async (contactInfo: string, message: string) => {
    try {
      await saveLead(contactInfo, message);
      if (looksLikeEmail(contactInfo)) await saveSubscriber(contactInfo.trim());
      return true;
    } catch (err) {
      console.error('Error saving chat lead:', err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailValue.trim();
    const message = messageValue.trim();
    if (!email && !message) return;

    if (email) addUserMessage(email);
    if (message) addUserMessage(message);
    setEmailValue('');
    setMessageValue('');

    if (email && !looksLikeEmail(email)) {
      pushBotReply(t('chat.responses.invalid_email'));
      return;
    }

    const contactInfo = email || (looksLikeContact(message) ? message : '');
    if (!contactInfo) {
      pushBotReply(t('chat.responses.ask_contact'));
      return;
    }

    setIsSubmitting(true);
    await delay(700);
    const saved = await persistLead(contactInfo, message);
    if (saved) pushBotReply(t('chat.responses.contact_received'));
    else pushBotReply(t('chat.contact_methods'), true);
    setIsSubmitting(false);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });

  const canSend = (emailValue.trim() || messageValue.trim()) && !isSubmitting;
  const lastMessage = messages[messages.length - 1];
  const showQuickActions = lastMessage && lastMessage.type === 'bot' && !lastMessage.isContactInfo;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[400px] max-w-[calc(100vw-32px)] bg-[#FAF7F4] rounded-3xl shadow-2xl overflow-hidden border border-black/5 pointer-events-auto flex flex-col h-[640px] max-h-[85vh]"
          >
            {/* Header */}
            <div className="bg-[#1f2021] text-[#F3EFEA] px-4 py-3.5 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
                <img src={brandIcon} alt="Up-Brands" className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">{t('chat.bot_name')}</p>
                <p className="text-[11px] text-[#F3EFEA]/60 leading-tight truncate">{t('chat.status')}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="hover:bg-white/15 p-1.5 rounded-full transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
              <p className="text-center text-[11px] leading-relaxed text-gray-400 mb-5 px-2">
                {t('chat.notice')}
              </p>

              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.type === 'user'
                          ? 'bg-[#1f2021] text-[#F3EFEA] rounded-2xl rounded-tr-md'
                          : 'bg-white text-[#1f2021] rounded-2xl rounded-tl-md border border-black/5 shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Sender + time under the latest bot bubble */}
                    {msg.type === 'bot' && index === messages.length - 1 && (
                      <p className="text-[10px] text-gray-400 mt-1.5 px-1">
                        {t('chat.bot_name')} · {formatTime(msg.timestamp)}
                      </p>
                    )}

                    {/* Special Contact Info Display */}
                    {msg.isContactInfo && (
                      <div className="mt-2 flex flex-col gap-2 max-w-[85%]">
                        <div className="bg-white p-2 rounded-xl border border-black/5 shadow-sm">
                          <img
                            src={wechatQr}
                            alt="WeChat QR"
                            className="w-32 h-32 object-contain mix-blend-multiply"
                          />
                          <p className="text-xs text-center text-gray-500 mt-1 select-all">WeChat ID: DANISEBD</p>
                        </div>

                        <a
                          href="mailto:Up-brands@hotmail.com"
                          className="flex items-center justify-center gap-2 bg-[#1f2021] text-[#F3EFEA] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-colors"
                        >
                          <Mail size={16} />
                          Email Us
                        </a>
                      </div>
                    )}
                  </div>
                ))}

                {/* Quick Actions */}
                {showQuickActions && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {quickActions.map((action) => (
                      <button
                        key={action.action}
                        onClick={() => handleSendText(action.label)}
                        className="px-3.5 py-2 bg-white border border-black/10 text-[#1f2021] text-xs font-medium rounded-full hover:bg-[#1f2021] hover:text-[#F3EFEA] transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Let's Create Together Button */}
                <button
                  onClick={handleCreateTogether}
                  className="w-full mt-1 bg-[#1f2021] text-[#F3EFEA] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg ring-2 ring-offset-2 ring-offset-[#FAF7F4] ring-[#c0ac97]/50"
                >
                  <UserPlus size={16} />
                  {t('chat.create_together')}
                </button>
              </div>
            </div>

            {/* Input Area */}
            <div className="px-3 pb-2 pt-2 shrink-0">
              <form
                onSubmit={handleSubmit}
                noValidate
                className={`rounded-2xl bg-white border transition-all ${
                  isFocused ? 'border-[#1f2021] shadow-sm' : 'border-black/10'
                }`}
              >
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={t('chat.email_placeholder')}
                  className="w-full bg-transparent px-3.5 pt-3 pb-2.5 text-sm placeholder:text-gray-400 focus:outline-none"
                />
                <div className="h-px bg-black/5 mx-3.5" />
                <div className="flex items-end gap-1 p-2 pl-3.5">
                  <textarea
                    rows={1}
                    value={messageValue}
                    onChange={(e) => setMessageValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder={t('chat.input_placeholder')}
                    className="flex-1 bg-transparent text-sm placeholder:text-gray-400 focus:outline-none resize-none max-h-24 py-1.5 leading-relaxed"
                  />
                  <button
                    type="submit"
                    disabled={!canSend}
                    aria-label={t('chat.header')}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      canSend
                        ? 'bg-[#1f2021] text-[#F3EFEA] hover:scale-105'
                        : 'bg-black/5 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
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
        className="w-14 h-14 bg-[#1f2021] text-[#F3EFEA] rounded-full shadow-lg flex items-center justify-center pointer-events-auto hover:bg-black transition-colors"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
            >
              <MessageCircle size={26} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
