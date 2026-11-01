import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Phone, 
  ExternalLink, 
  Bot, 
  User,
  ShieldCheck,
  TrendingUp,
  MapPin
} from 'lucide-react';

const ADMIN_WHATSAPP_LINK = "https://wa.me/923122677981";
const ADMIN_EMAIL = "abdullahkh1298@gmail.com";

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'bot',
    text: "Hello! I am Rihaish AI, your real estate and society intelligence assistant. How can I help you evaluate properties, verify legal NOC records, or forecast 5-year yields today?",
    time: "Just now"
  }
];

const QUICK_PROMPTS = [
  "Verify Government Lease (Leez) Status",
  "Top Emerging Growth Corridors (30%+ ROI)",
  "How does 5-Year AI Forecasting work?",
  "Connect to Rihaish Admin on WhatsApp"
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (textToSend = null) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: "Just now"
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let botReply = "Thank you for asking! ";
      const q = query.toLowerCase();

      if (q.includes("whatsapp") || q.includes("contact") || q.includes("call") || q.includes("phone") || q.includes("admin")) {
        botReply = `You can directly chat with the Rihaish Lead Consultant & Master Admin on WhatsApp at +92 03122677981 or email ${ADMIN_EMAIL}. Click the green button below to open instant WhatsApp chat!`;
      } else if (q.includes("lease") || q.includes("leez") || q.includes("noc") || q.includes("legal")) {
        botReply = "All listed properties on Rihaish are cross-referenced with government land archives (KDA, LDA, RDA, CDA, and SBCA). Every plot displays its verified NOC serial number, issuing authority seal, and 99-year leasehold status before you make any transaction.";
      } else if (q.includes("forecast") || q.includes("predict") || q.includes("ai") || q.includes("5-year") || q.includes("trend")) {
        botReply = "Our 5-Year AI Prediction Engine utilizes multi-variate polynomial regression and time-series ARIMA modeling. It factors in historical price growth, infrastructure velocity, and proximity to major highways to forecast future valuations with 94.2% statistical confidence.";
      } else if (q.includes("corridor") || q.includes("emerging") || q.includes("frontier") || q.includes("best") || q.includes("growth")) {
        botReply = "Currently, top emerging expansion corridors include: 1) New Metro City Mandra (+41% yield), 2) Northern Bypass Corridor Karachi (+42.5% yield), 3) Faisal Town Phase 2 M-2 (+38.2% yield), and 4) Capital Smart City Silicon Village (+34.6% yield).";
      } else {
        botReply = `I've analyzed our multi-city database regarding '${query}'. Our verified inventory across Karachi, Lahore, and Islamabad shows strong liquidity in RDA and LDA approved sectors. For personalized investment advice, feel free to escalate directly to our Admin on WhatsApp!`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: botReply,
          time: "Just now"
        }
      ]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      
      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[520px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden mb-3 animate-slideUp">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-brand-900 via-brand-800 to-teal-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-400 text-teal-950 flex items-center justify-center font-bold shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight flex items-center">
                  Rihaish AI Assistant
                  <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h4>
                <p className="text-[10px] text-teal-200">Online • 24/7 Market Intelligence</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Direct WhatsApp Banner */}
          <div className="px-4 py-2 bg-emerald-500/10 dark:bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between text-xs">
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              Urgent Consultation?
            </span>
            <a
              href={ADMIN_WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center space-x-1 shadow-xs transition-colors"
            >
              <span>WhatsApp Admin</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-50/50 dark:bg-slate-950/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start space-x-2 ${
                  m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-none shadow-xs'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                <div className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span>Rihaish AI is analyzing dataset...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Suggestions */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto flex space-x-1.5 no-scrollbar">
            {QUICK_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 text-[10px] font-semibold shrink-0 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about properties, legal lease, or ROI..."
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open Rihaish AI Chat"
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-700 via-brand-600 to-teal-400 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all group relative border-2 border-white/20"
      >
        <div className="absolute inset-0 rounded-full bg-teal-400/30 animate-ping pointer-events-none" />
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

    </div>
  );
}
