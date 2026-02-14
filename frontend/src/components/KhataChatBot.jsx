import { useState, useRef, useEffect } from 'react';

const KhataChatBot = ({ data, lang = 'en', dark = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isRtl = lang === 'ur' || lang === 'ps';

  // Greeting messages based on language
  const greetings = {
    en: {
      welcome: "Hi! 👋 I'm your Smart Khata Assistant. Ask me anything about the khata!",
      suggestions: [
        "Who owes the most?",
        "Total members?",
        "Monthly expense?",
        "Show all balances"
      ],
      placeholder: "Ask about khata...",
      typing: "Thinking...",
      title: "Khata Assistant",
      subtitle: "Ask anything about khata",
    },
    ur: {
      welcome: "السلام علیکم! 👋 میں آپ کا سمارٹ کھاتا اسسٹنٹ ہوں۔ کھاتے کے بارے میں کچھ بھی پوچھیں!",
      suggestions: [
        "سب سے زیادہ کس نے دینا ہے؟",
        "کل ممبرز کتنے ہیں؟",
        "مہینے کا خرچہ؟",
        "سب کا بیلنس دکھاؤ"
      ],
      placeholder: "کھاتے کے بارے میں پوچھیں...",
      typing: "سوچ رہا ہوں...",
      title: "کھاتا اسسٹنٹ",
      subtitle: "کھاتے کے بارے میں کچھ بھی پوچھیں",
    },
    ps: {
      welcome: "سلام! 👋 زه ستاسو سمارٹ کھاتا اسسٹنٹ یم۔ د کھاتا په اړه پوښتنه وکړئ!",
      suggestions: [
        "ترټولو زیات چا ورکول دي؟",
        "ټول غړي څومره دي؟",
        "د میاشتې لګښت؟",
        "د ټولو بیلنس وښایاست"
      ],
      placeholder: "د کھاتا په اړه پوښتنه...",
      typing: "فکر کوم...",
      title: "کھاتا اسسٹنٹ",
      subtitle: "د کھاتا په اړه هرڅه پوښتنه وکړئ",
    }
  };

  const t = greetings[lang] || greetings.en;

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        type: 'bot',
        text: t.welcome,
        time: new Date()
      }]);
    }
  }, []);

  // Reset messages when language changes
  useEffect(() => {
    setMessages([{
      id: 1,
      type: 'bot',
      text: t.welcome,
      time: new Date()
    }]);
  }, [lang]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Process user question and generate response
  const processQuestion = (question) => {
    if (!data || !data.customers) {
      return lang === 'ur' ? 'ابھی ڈیٹا لوڈ نہیں ہوا۔ تھوڑی دیر بعد پوچھیں۔' :
             lang === 'ps' ? 'اوس مهال ډاټا نه دی پورته شوی.' :
             'Data is not loaded yet. Please try again.';
    }

    const q = question.toLowerCase().trim();
    const customers = data.customers;
    const summary = data.summary;

    // Check if asking about a specific customer
    const matchedCustomer = customers.find(c => 
      q.includes(c.name.toLowerCase())
    );

    if (matchedCustomer) {
      return getCustomerResponse(matchedCustomer);
    }

    // Keywords for different intents
    const totalKeywords = ['total', 'kitna', 'kitne', 'کتنا', 'کتنے', 'ٹوٹل', 'سب', 'all', 'sab', 'everyone', 'har', 'ہر', 'ټول'];
    const membersKeywords = ['member', 'members', 'ممبر', 'ممبرز', 'kaun', 'کون', 'who', 'list', 'naam', 'name', 'نام', 'غړي', 'لسټ'];
    const oweKeywords = ['owe', 'owes', 'dena', 'دینا', 'pay', 'lena', 'لینا', 'get', 'milna', 'ملنا', 'ورکول'];
    const mostKeywords = ['most', 'zyada', 'ziyada', 'زیادہ', 'سب سے', 'sabse', 'highest', 'max', 'bada', 'بڑا', 'ترټولو'];
    const expenseKeywords = ['expense', 'kharcha', 'خرچہ', 'خرچ', 'spend', 'spent', 'monthly', 'mahina', 'مہینا', 'لګښت', 'month'];
    const balanceKeywords = ['balance', 'بیلنس', 'hisab', 'حساب', 'status', 'balanc'];
    const helpKeywords = ['help', 'مدد', 'kya', 'کیا', 'what', 'how', 'کیسے', 'kaise', 'commands', 'څه'];
    const greetKeywords = ['hi', 'hello', 'salam', 'سلام', 'assalam', 'السلام', 'hey', 'hola', 'sup'];

    // Greeting
    if (greetKeywords.some(k => q.includes(k)) && q.length < 30) {
      if (lang === 'ur') return 'وعلیکم السلام! 😊 بتائیں کھاتے کے بارے میں کیا جاننا ہے؟';
      if (lang === 'ps') return 'وعلیکم السلام! 😊 ووایاست د کھاتا په اړه څه غواړئ پوهه شئ؟';
      return 'Hello! 😊 What would you like to know about the khata?';
    }

    // Help
    if (helpKeywords.some(k => q.includes(k)) && (q.length < 40 || q.includes('help'))) {
      return getHelpResponse();
    }

    // Monthly expense
    if (expenseKeywords.some(k => q.includes(k))) {
      return getExpenseResponse(summary);
    }

    // Show all balances
    if (balanceKeywords.some(k => q.includes(k)) || 
        (totalKeywords.some(k => q.includes(k)) && (q.includes('show') || q.includes('dikha') || q.includes('دکھا') || q.includes('بتا') || q.includes('bata')))) {
      return getAllBalancesResponse(customers);
    }

    // Who owes the most
    if (mostKeywords.some(k => q.includes(k)) || 
        (oweKeywords.some(k => q.includes(k)) && mostKeywords.some(k => q.includes(k)))) {
      return getMostOwingResponse(customers);
    }

    // Total members
    if (membersKeywords.some(k => q.includes(k))) {
      return getMembersResponse(customers, summary);
    }

    // Who needs to pay / who owes
    if (oweKeywords.some(k => q.includes(k))) {
      return getOwingResponse(customers);
    }

    // Total / summary
    if (totalKeywords.some(k => q.includes(k))) {
      return getSummaryResponse(customers, summary);
    }

    // Fallback - try fuzzy customer name match
    const fuzzyMatch = customers.find(c => {
      const name = c.name.toLowerCase();
      return q.split(/\s+/).some(word => word.length > 2 && name.includes(word));
    });

    if (fuzzyMatch) {
      return getCustomerResponse(fuzzyMatch);
    }

    // Default response
    return getDefaultResponse();
  };

  const getCustomerResponse = (customer) => {
    const { name, balance } = customer;
    const absBalance = Math.abs(balance).toLocaleString();

    if (balance > 0) {
      // Customer needs to pay (I need to get)
      if (lang === 'ur') return `📊 **${name}** کو **Rs. ${absBalance}** دینے ہیں۔\n\n💡 یعنی ${name} پر قرض ہے۔`;
      if (lang === 'ps') return `📊 **${name}** باید **Rs. ${absBalance}** ورکړي.\n\n💡 دا پدې معنی ده چې ${name} پور لري.`;
      return `📊 **${name}** needs to pay **Rs. ${absBalance}**.\n\n💡 This means ${name} owes money.`;
    } else if (balance < 0) {
      // Customer needs to get (I need to pay)
      if (lang === 'ur') return `📊 **${name}** کو **Rs. ${absBalance}** ملنے ہیں۔\n\n💡 یعنی ${name} کو واپس کرنے ہیں۔`;
      if (lang === 'ps') return `📊 **${name}** باید **Rs. ${absBalance}** ترلاسه کړي.\n\n💡 دا پدې معنی ده چې ${name} ته بیرته ورکول دي.`;
      return `📊 **${name}** needs to get **Rs. ${absBalance}**.\n\n💡 This means money is owed to ${name}.`;
    } else {
      if (lang === 'ur') return `✅ **${name}** کا حساب برابر ہے! کوئی لین دین باقی نہیں۔`;
      if (lang === 'ps') return `✅ **${name}** حساب مساوي دی! هیڅ پور نشته.`;
      return `✅ **${name}**'s account is settled! No pending balance.`;
    }
  };

  const getAllBalancesResponse = (customers) => {
    let response = lang === 'ur' ? '📋 **سب کا بیلنس:**\n\n' : 
                   lang === 'ps' ? '📋 **د ټولو بیلنس:**\n\n' :
                   '📋 **All Balances:**\n\n';
    
    customers.forEach(c => {
      const abs = Math.abs(c.balance).toLocaleString();
      const emoji = c.balance > 0 ? '🔴' : c.balance < 0 ? '🟢' : '⚪';
      const status = c.balance > 0 
        ? (lang === 'ur' ? 'دینے ہیں' : lang === 'ps' ? 'ورکول دي' : 'owes')
        : c.balance < 0 
          ? (lang === 'ur' ? 'ملنے ہیں' : lang === 'ps' ? 'ترلاسه کول دي' : 'to get')
          : (lang === 'ur' ? 'برابر' : lang === 'ps' ? 'مساوي' : 'settled');
      response += `${emoji} **${c.name}** — Rs. ${abs} (${status})\n`;
    });

    return response;
  };

  const getMostOwingResponse = (customers) => {
    const owing = customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);
    
    if (owing.length === 0) {
      if (lang === 'ur') return '✅ کسی نے بھی کچھ نہیں دینا!';
      if (lang === 'ps') return '✅ هیچا ته هیڅ نه ورکوي!';
      return '✅ Nobody owes anything!';
    }

    const top = owing[0];
    let response = lang === 'ur' 
      ? `🏆 سب سے زیادہ **${top.name}** نے دینے ہیں: **Rs. ${top.balance.toLocaleString()}**\n\n`
      : lang === 'ps'
        ? `🏆 ترټولو زیات **${top.name}** ورکول دي: **Rs. ${top.balance.toLocaleString()}**\n\n`
        : `🏆 **${top.name}** owes the most: **Rs. ${top.balance.toLocaleString()}**\n\n`;

    if (owing.length > 1) {
      response += lang === 'ur' ? '📊 **باقی:**\n' : lang === 'ps' ? '📊 **نور:**\n' : '📊 **Others:**\n';
      owing.slice(1).forEach((c, i) => {
        response += `${i + 2}. ${c.name} — Rs. ${c.balance.toLocaleString()}\n`;
      });
    }

    return response;
  };

  const getMembersResponse = (customers, summary) => {
    let response = lang === 'ur' 
      ? `👥 کل **${summary.totalCustomers}** ممبرز ہیں:\n\n`
      : lang === 'ps'
        ? `👥 ټول **${summary.totalCustomers}** غړي دي:\n\n`
        : `👥 Total **${summary.totalCustomers}** members:\n\n`;
    
    customers.forEach((c, i) => {
      response += `${i + 1}. **${c.name}**${c.phone ? ' 📱' : ''}\n`;
    });

    return response;
  };

  const getOwingResponse = (customers) => {
    const owing = customers.filter(c => c.balance > 0);
    const owed = customers.filter(c => c.balance < 0);

    let response = '';

    if (owing.length > 0) {
      response += lang === 'ur' ? '🔴 **جنہوں نے دینے ہیں:**\n' : 
                  lang === 'ps' ? '🔴 **چا چې ورکول دي:**\n' :
                  '🔴 **Need to pay:**\n';
      owing.forEach(c => {
        response += `• ${c.name} — Rs. ${c.balance.toLocaleString()}\n`;
      });
    }

    if (owed.length > 0) {
      response += lang === 'ur' ? '\n🟢 **جنہیں ملنے ہیں:**\n' :
                  lang === 'ps' ? '\n🟢 **چا چې ترلاسه کول دي:**\n' :
                  '\n🟢 **Need to get:**\n';
      owed.forEach(c => {
        response += `• ${c.name} — Rs. ${Math.abs(c.balance).toLocaleString()}\n`;
      });
    }

    if (!response) {
      response = lang === 'ur' ? '✅ سب کا حساب برابر ہے!' :
                 lang === 'ps' ? '✅ د ټولو حساب مساوي دی!' :
                 '✅ Everyone is settled!';
    }

    return response;
  };

  const getExpenseResponse = (summary) => {
    if (lang === 'ur') return `💰 **${summary.currentMonth}** کا کل خرچہ:\n\n**Rs. ${summary.monthlyTotalExpense.toLocaleString()}**\n\nکل ممبرز: ${summary.totalCustomers}`;
    if (lang === 'ps') return `💰 **${summary.currentMonth}** ټول لګښت:\n\n**Rs. ${summary.monthlyTotalExpense.toLocaleString()}**\n\nټول غړي: ${summary.totalCustomers}`;
    return `💰 **${summary.currentMonth}** total expense:\n\n**Rs. ${summary.monthlyTotalExpense.toLocaleString()}**\n\nTotal members: ${summary.totalCustomers}`;
  };

  const getSummaryResponse = (customers, summary) => {
    const totalOwed = customers.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0);
    const totalToGet = customers.filter(c => c.balance < 0).reduce((s, c) => s + Math.abs(c.balance), 0);

    if (lang === 'ur') {
      return `📊 **خلاصہ:**\n\n👥 کل ممبرز: **${summary.totalCustomers}**\n🔴 کل وصولی: **Rs. ${totalOwed.toLocaleString()}**\n🟢 کل ادائیگی: **Rs. ${totalToGet.toLocaleString()}**\n💰 ماہانہ خرچہ: **Rs. ${summary.monthlyTotalExpense.toLocaleString()}**`;
    }
    if (lang === 'ps') {
      return `📊 **لنډیز:**\n\n👥 ټول غړي: **${summary.totalCustomers}**\n🔴 ټول وصول: **Rs. ${totalOwed.toLocaleString()}**\n🟢 ټول ورکول: **Rs. ${totalToGet.toLocaleString()}**\n💰 میاشتنی لګښت: **Rs. ${summary.monthlyTotalExpense.toLocaleString()}**`;
    }
    return `📊 **Summary:**\n\n👥 Total Members: **${summary.totalCustomers}**\n🔴 Total to collect: **Rs. ${totalOwed.toLocaleString()}**\n🟢 Total to pay: **Rs. ${totalToGet.toLocaleString()}**\n💰 Monthly expense: **Rs. ${summary.monthlyTotalExpense.toLocaleString()}**`;
  };

  const getHelpResponse = () => {
    if (lang === 'ur') {
      return `🤖 **میں ان سوالات کا جواب دے سکتا ہوں:**\n\n• کسی بھی ممبر کا نام لکھیں (مثلاً "شفیق")\n• "سب کا بیلنس دکھاؤ"\n• "کس نے سب سے زیادہ دینا ہے؟"\n• "کل ممبرز کتنے ہیں؟"\n• "مہینے کا خرچہ؟"\n• "کس نے دینا ہے؟"`;
    }
    if (lang === 'ps') {
      return `🤖 **زه دغو پوښتنو ځواب ورکولی شم:**\n\n• د هر غړي نوم ولیکئ (مثلاً "شفیق")\n• "د ټولو بیلنس وښایاست"\n• "ترټولو زیات چا ورکول دي؟"\n• "ټول غړي څومره دي؟"\n• "د میاشتې لګښت؟"\n• "چا ورکول دي؟"`;
    }
    return `🤖 **I can answer these questions:**\n\n• Type any member's name (e.g. "Shafiq")\n• "Show all balances"\n• "Who owes the most?"\n• "How many members?"\n• "Monthly expense?"\n• "Who needs to pay?"`;
  };

  const getDefaultResponse = () => {
    if (lang === 'ur') return '🤔 مجھے سمجھ نہیں آیا۔ کسی ممبر کا نام لکھیں یا "مدد" لکھیں۔';
    if (lang === 'ps') return '🤔 ما پوه نه شوم. د غړي نوم ولیکئ یا "مدد" ولیکئ.';
    return '🤔 I didn\'t understand that. Try typing a member\'s name or "help" to see what I can do.';
  };

  // Simple markdown-like rendering
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      // Bold
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="mb-0.5" dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />;
    });
  };

  const handleSend = async (text = null) => {
    const question = text || input.trim();
    if (!question) return;

    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: question,
      time: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate thinking delay
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

    const answer = processQuestion(question);
    const botMsg = {
      id: Date.now() + 1,
      type: 'bot',
      text: answer,
      time: new Date()
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botMsg]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${isRtl ? 'left-6' : 'right-6'} z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen 
            ? (dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
            : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
        }`}
        style={{ boxShadow: isOpen ? undefined : '0 4px 20px rgba(16, 185, 129, 0.4)' }}
      >
        {isOpen ? (
          <span className="text-xl">✕</span>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </button>

      {/* Unread dot when closed */}
      {!isOpen && messages.length <= 1 && (
        <span className={`fixed bottom-[72px] ${isRtl ? 'left-6' : 'right-6'} z-50 w-4 h-4 bg-rose-500 rounded-full animate-pulse border-2 ${dark ? 'border-gray-900' : 'border-gray-50'}`}></span>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`fixed bottom-24 ${isRtl ? 'left-4' : 'right-4'} z-50 w-[340px] sm:w-[380px] rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 border ${
            dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          style={{ maxHeight: 'calc(100vh - 140px)', height: '500px' }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-4 flex items-center space-x-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              🤖
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm">{t.title}</h3>
              <p className="text-emerald-100/70 text-xs">{t.subtitle}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 ${dark ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.type === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : dark 
                      ? 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                }`}>
                  {renderText(msg.text)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`rounded-2xl px-4 py-3 rounded-bl-sm ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'}`}>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (show only at start) */}
          {messages.length <= 1 && (
            <div className={`px-4 py-2 flex flex-wrap gap-1.5 border-t ${dark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-white/50'}`}>
              {t.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    dark 
                      ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-800/50' 
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className={`px-4 py-3 border-t flex items-center gap-2 flex-shrink-0 ${dark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              className={`flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none transition-all ${
                dark 
                  ? 'bg-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/30 border border-gray-600' 
                  : 'bg-gray-100 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 border border-gray-200'
              }`}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default KhataChatBot;
