import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  Lightbulb, 
  Check, 
  Flame, 
  BookOpen, 
  ListChecks, 
  Zap, 
  AlertCircle,
  Clock,
  Key,
  Cpu,
  ShieldCheck,
  Copy,
  CheckCheck,
  ChevronDown,
  Eye,
  EyeOff,
  Save,
  FileText,
  Radio,
  Sliders
} from 'lucide-react';
import { NewsPost, AspectRatioType, AIProviderType } from '../types';
import { cleanText, cleanAiPayload } from '../utils/textCleaner';

interface AIDrawerProps {
  currentPost: NewsPost;
  onApplyPost: (updatedPost: Partial<NewsPost>) => void;
  onClose?: () => void;
}

const MISTRAL_MODELS = [
  { id: 'mistral-large-latest', name: 'Mistral Large (پیشنهادی - قوی‌ترین نگارش)', badge: 'پیشرفته' },
  { id: 'mistral-small-latest', name: 'Mistral Small (فوق سریع و اقتصادی)', badge: 'سریع' },
  { id: 'codestral-latest', name: 'Codestral Latest (تحلیلی و پرسرعت)', badge: 'مدرن' },
  { id: 'open-mistral-nemo', name: 'Open Mistral Nemo 12B (متن‌باز دقیق)', badge: 'متن‌باز' },
  { id: 'pixtral-large-latest', name: 'Pixtral Large Latest (چندوجهی)', badge: 'جدید' },
  { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B (مدل ترکیبی غول‌پیکر)', badge: 'سنگین' },
];

const OPENROUTER_QUICK_MODELS = [
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', badge: 'متا' },
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', badge: 'آنتروپیک' },
  { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1', badge: 'استدلالی' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', badge: 'اوپن‌ای‌آی' },
  { id: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B', badge: 'کیوون' },
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash', badge: 'گوگل' },
];

export const AIDrawer: React.FC<AIDrawerProps> = ({ currentPost, onApplyPost, onClose }) => {
  // Provider settings
  const [provider, setProvider] = useState<AIProviderType>('gemini');
  const [mistralModel, setMistralModel] = useState('mistral-large-latest');
  const [openrouterModel, setOpenrouterModel] = useState('meta-llama/llama-3.3-70b-instruct');
  
  // API Keys
  const [mistralApiKey, setMistralApiKey] = useState('');
  const [openrouterApiKey, setOpenrouterApiKey] = useState('');
  const [showKeyMistral, setShowKeyMistral] = useState(false);
  const [showKeyOR, setShowKeyOR] = useState(false);
  const [savedInDbStatus, setSavedInDbStatus] = useState<string | null>(null);

  // Content generation inputs
  const [rawText, setRawText] = useState('');
  const [tone, setTone] = useState<'formal' | 'breaking' | 'bullet' | 'magazine' | 'clickbait'>('breaking');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>(currentPost.aspectRatio || '1:1');
  const [category, setCategory] = useState(currentPost.category || 'فناوری');
  const [humanize, setHumanize] = useState(true); // ضد هوش مصنوعی و نگارش انسانی

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headlineOptions, setHeadlineOptions] = useState<string[]>([]);
  const [loadingHeadlines, setLoadingHeadlines] = useState(false);
  const [copiedArticle, setCopiedArticle] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Last generated full article
  const [generatedArticle, setGeneratedArticle] = useState<string>(currentPost.fullArticle || '');
  const [lastGeneratedPost, setLastGeneratedPost] = useState<Partial<NewsPost> | null>(null);

  // Load saved AI configuration from NeDB on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/ai/settings');
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.provider) setProvider(json.data.provider);
          if (json.data.mistralModel) setMistralModel(json.data.mistralModel);
          if (json.data.openrouterModel) setOpenrouterModel(json.data.openrouterModel);
          if (json.data.mistralApiKey) setMistralApiKey(json.data.mistralApiKey);
          if (json.data.openrouterApiKey) setOpenrouterApiKey(json.data.openrouterApiKey);
        }
      } catch (err) {
        console.error('Failed to load AI settings from NeDB:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettingsToDb = async () => {
    try {
      const res = await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          mistralModel,
          openrouterModel,
          mistralApiKey,
          openrouterApiKey,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSavedInDbStatus('تنظیمات و کلیدها با موفقیت در دیتابیس NeDB ذخیره شد.');
        setTimeout(() => setSavedInDbStatus(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sampleTexts = [
    {
      title: 'خبر اقتصادی و ارزی',
      text: 'رئیس کل بانک مرکزی در نشست خبری اعلام کرد سامانه جدید ارزی با هدف تسهیل مبادلات تجاری راه‌اندازی شد و نرخ دلار نیما در محدوده مشخص تثبیت می‌شود. این اقدام باعث افزایش دسترسی صادرکنندگان به منابع ارزی خواهد شد.'
    },
    {
      title: 'خبر فناوری و هوش مصنوعی',
      text: 'محققان بین‌المللی موفق به توسعه مدل هوش مصنوعی فوق‌سریع جدیدی شدند که قادر است اسناد طولانی و داده‌های پزشکی پیچیده را در کسری از ثانیه با دقت ۹۹ درصدی تحلیل و عارضه‌یابی کند.'
    },
    {
      title: 'خبر ورزشی و مسابقات',
      text: 'تیم ملی در دیداری حساس و تماشایی موفق شد با نتیجه ۳ بر ۱ برابر رقیب سنتی به پیروزی برسد و جواز صعود به مرحله نهایی رقابت‌های قهرمانی را با شایستگی تمام کسب کند.'
    }
  ];

  const handleGenerate = async () => {
    if (!rawText.trim()) {
      setError('لطفاً ابتدا متن خام یا پیش‌نویس خبر را وارد کنید.');
      return;
    }

    setLoading(true);
    setError(null);
    setHeadlineOptions([]);

    try {
      const activeApiKey = provider === 'mistral' ? mistralApiKey : provider === 'openrouter' ? openrouterApiKey : undefined;
      const activeModel = provider === 'mistral' ? mistralModel : provider === 'openrouter' ? openrouterModel : 'gemini-3.7-flash';

      const res = await fetch('/api/news/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          tone,
          category,
          aspectRatio,
          provider,
          model: activeModel,
          apiKey: activeApiKey,
          humanize,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'خطا در پردازش هوش مصنوعی');
      }

      const data = cleanAiPayload(json.data);
      
      // Calculate current date/time in Persian
      const now = new Date();
      const timeStr = `امروز - ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const updatedPayload: Partial<NewsPost> = {
        title: cleanText(data.title),
        kicker: cleanText(data.kicker),
        lead: cleanText(data.lead),
        fullArticle: cleanText(data.fullArticle || data.lead),
        keyPoints: (data.keyPoints || []).map(cleanText),
        category: cleanText(data.category || category),
        source: cleanText(data.source || 'خبرگزاری'),
        date: timeStr,
        primaryColor: data.suggestedPrimaryColor || currentPost.primaryColor,
        templateId: data.suggestedTemplate || currentPost.templateId,
        quote: data.quote ? {
          text: cleanText(data.quote.text),
          author: cleanText(data.quote.author),
          role: cleanText(data.quote.role),
        } : currentPost.quote,
        aspectRatio: aspectRatio,
      };

      setGeneratedArticle(cleanText(data.fullArticle || data.lead));
      setLastGeneratedPost(updatedPayload);

      // Apply to live post
      onApplyPost(updatedPayload);

    } catch (err: any) {
      console.error('AI error:', err);
      setError(err.message || 'خطایی رخ داد. لطفاً تنظیمات مدل یا کلید API را بررسی فرمایید.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFullArticle = async () => {
    if (!generatedArticle) return;
    try {
      await navigator.clipboard.writeText(generatedArticle);
      setCopiedArticle(true);
      setTimeout(() => setCopiedArticle(false), 2500);
    } catch {
      alert('خطا در کپی متن');
    }
  };

  const handleCopySummary = async () => {
    if (!lastGeneratedPost) return;
    const text = `🔴 ${lastGeneratedPost.kicker ? `«${lastGeneratedPost.kicker}»\n` : ''}${lastGeneratedPost.title}\n\n` +
      `${lastGeneratedPost.lead}\n\n` +
      (lastGeneratedPost.keyPoints && lastGeneratedPost.keyPoints.length > 0 
        ? `📌 محورهای مهم رویداد:\n` + lastGeneratedPost.keyPoints.map(k => `▫️ ${k}`).join('\n') + '\n\n'
        : '') +
      `منبع: ${lastGeneratedPost.source || 'خبرگزاری'}\n#خبر #${(lastGeneratedPost.category || 'خبر').replace(/\s+/g, '_')}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      alert('خطا در کپی خلاصه');
    }
  };

  const handleFetchHeadlineVariations = async () => {
    if (!currentPost.title) return;
    setLoadingHeadlines(true);
    try {
      const activeApiKey = provider === 'mistral' ? mistralApiKey : provider === 'openrouter' ? openrouterApiKey : undefined;
      const activeModel = provider === 'mistral' ? mistralModel : provider === 'openrouter' ? openrouterModel : undefined;

      const res = await fetch('/api/news/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentPost.title,
          lead: currentPost.lead,
          type: 'headlines',
          provider,
          model: activeModel,
          apiKey: activeApiKey,
        })
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setHeadlineOptions(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHeadlines(false);
    }
  };

  return (
    <div className="space-y-6 pb-6 text-neutral-100">
      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-red-600/25 via-amber-600/15 to-transparent border border-red-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">تولید هوشمند خبر با هوش مصنوعی</h3>
            <p className="text-xs text-neutral-400">پشتیبانی از مدل‌های Mistral، OpenRouter و Gemini با نگارش انسانی</p>
          </div>
        </div>
      </div>

      {/* 1. AI Provider Switcher (Gemini / Mistral / OpenRouter) */}
      <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>انتخاب موتور و ارائه‌دهنده هوش مصنوعی:</span>
          </label>
          <span className="text-[10px] text-neutral-400 font-mono">
            {provider === 'gemini' ? 'Google Gemini' : provider === 'mistral' ? 'Mistral AI API' : 'OpenRouter API'}
          </span>
        </div>

        {/* Provider Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {/* Gemini */}
          <button
            type="button"
            onClick={() => setProvider('gemini')}
            className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
              provider === 'gemini'
                ? 'bg-red-500/20 border-red-500 text-white shadow ring-1 ring-red-500/50'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">گوگل جمینای</span>
            <span className="text-[9px] text-neutral-400">پیش‌فرض سرور</span>
          </button>

          {/* Mistral */}
          <button
            type="button"
            onClick={() => setProvider('mistral')}
            className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
              provider === 'mistral'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow ring-1 ring-amber-500/50'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">میسترال (Mistral)</span>
            <span className="text-[9px] text-neutral-400">مدل‌های اختصاصی</span>
          </button>

          {/* OpenRouter */}
          <button
            type="button"
            onClick={() => setProvider('openrouter')}
            className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
              provider === 'openrouter'
                ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow ring-1 ring-blue-500/50'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">اوپن‌روتر (OpenRouter)</span>
            <span className="text-[9px] text-neutral-400">با آیدی دلخواه</span>
          </button>
        </div>

        {/* Mistral Configuration Panel */}
        {provider === 'mistral' && (
          <div className="space-y-3 pt-2 border-t border-neutral-800/80 animate-fadeIn">
            {/* Mistral Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">انتخاب مدل میسترال (Mistral Model):</label>
              <select
                value={mistralModel}
                onChange={(e) => setMistralModel(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-xs text-neutral-100 font-sans"
              >
                {MISTRAL_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mistral API Key Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>کلید اختصاصی Mistral API Key (اختیاری):</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowKeyMistral(!showKeyMistral)}
                  className="text-neutral-400 hover:text-neutral-200 text-xs flex items-center gap-1"
                >
                  {showKeyMistral ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showKeyMistral ? 'مخفی' : 'نمایش'}</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type={showKeyMistral ? 'text' : 'password'}
                  value={mistralApiKey}
                  onChange={(e) => setMistralApiKey(e.target.value)}
                  placeholder="کلید API میسترال خود را وارد کنید (یا از کلید سرور استفاده می‌شود)"
                  className="flex-1 p-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-xs text-neutral-100 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveSettingsToDb}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 flex items-center gap-1 shrink-0 transition-colors"
                  title="ذخیره تنظیمات در دیتابیس NeDB"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>ذخیره NeDB</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OpenRouter Configuration Panel */}
        {provider === 'openrouter' && (
          <div className="space-y-3 pt-2 border-t border-neutral-800/80 animate-fadeIn">
            {/* OpenRouter Custom Model ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>شناسه دقیق مدل OpenRouter (Model ID):</span>
                <span className="text-[10px] text-blue-400 font-mono">هر مدلی را می‌توانید تایپ کنید</span>
              </label>
              <input
                type="text"
                value={openrouterModel}
                onChange={(e) => setOpenrouterModel(e.target.value)}
                placeholder="مثلاً: meta-llama/llama-3.3-70b-instruct یا anthropic/claude-3.5-sonnet"
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-blue-500 text-xs text-neutral-100 font-mono text-left"
                dir="ltr"
              />
            </div>

            {/* Quick OpenRouter Model Badges */}
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-400">مدل‌های محبوب OpenRouter (کلیک برای انتخاب سریع):</span>
              <div className="flex flex-wrap gap-1.5">
                {OPENROUTER_QUICK_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setOpenrouterModel(m.id)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                      openrouterModel === m.id
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    {m.label} ({m.badge})
                  </button>
                ))}
              </div>
            </div>

            {/* OpenRouter API Key Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-blue-400" />
                  <span>کلید اختصاصی OpenRouter API Key:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowKeyOR(!showKeyOR)}
                  className="text-neutral-400 hover:text-neutral-200 text-xs flex items-center gap-1"
                >
                  {showKeyOR ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showKeyOR ? 'مخفی' : 'نمایش'}</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type={showKeyOR ? 'text' : 'password'}
                  value={openrouterApiKey}
                  onChange={(e) => setOpenrouterApiKey(e.target.value)}
                  placeholder="کلید sk-or-v1-... خود را اینجا وارد کنید"
                  className="flex-1 p-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-blue-500 text-xs text-neutral-100 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveSettingsToDb}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 flex items-center gap-1 shrink-0 transition-colors"
                  title="ذخیره تنظیمات در دیتابیس NeDB"
                >
                  <Save className="w-3.5 h-3.5 text-blue-400" />
                  <span>ذخیره NeDB</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Database Saved Status Notification */}
        {savedInDbStatus && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-4 h-4 shrink-0" />
            <span>{savedInDbStatus}</span>
          </div>
        )}
      </div>

      {/* 2. Anti-AI / Humanized Persian Mode Toggle */}
      <div 
        onClick={() => setHumanize(!humanize)}
        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
          humanize 
            ? 'bg-gradient-to-r from-emerald-950/40 to-neutral-900 border-emerald-500/50 shadow-sm'
            : 'bg-neutral-900 border-neutral-800 text-neutral-400'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            humanize ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${humanize ? 'text-emerald-300' : 'text-neutral-300'}`}>
                حالت نگارش کاملاً انسانی و غیرقابل تشخیص هوش مصنوعی (Anti-AI)
              </span>
              {humanize && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  فعال
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
              حذف کلیشه‌های ماشینی، اصلاح ریتم جمله‌بندی ژورنالیستی و نگارش ارگانیک بدون ردپای AI
            </p>
          </div>
        </div>
        <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
          humanize ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-neutral-700'
        }`}>
          {humanize && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>

      {/* 3. Raw News Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-red-400" />
            <span>متن اولیه، گزارش یا خلاصه خام خبر:</span>
          </label>
          <span className="text-[11px] text-neutral-400 font-mono">
            {rawText.length} کاراکتر
          </span>
        </div>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="متن خبر ساده را اینجا کپی یا تایپ کنید (مثلاً: بانک مرکزی نرخ سود را تغییر داد و شرایط جدید تسهیلات اعلام شد...)"
          rows={5}
          className="w-full p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-neutral-100 placeholder-neutral-500 transition-colors leading-relaxed"
        />
      </div>

      {/* Quick Sample Presets */}
      <div className="space-y-1.5">
        <div className="text-[11px] text-neutral-400 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>یا از متن‌های نمونه آماده استفاده کنید:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleTexts.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setRawText(sample.text)}
              className="text-xs px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/60 transition-all"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Tone & Aspect Ratio Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Tone */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300">لحن و فرمت نگارش:</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'breaking', label: 'فوری و زنده', icon: Flame, color: 'text-red-400' },
              { id: 'formal', label: 'رسمی و مستند', icon: Zap, color: 'text-blue-400' },
              { id: 'magazine', label: 'مجله‌ای و عمیق', icon: BookOpen, color: 'text-amber-400' },
              { id: 'bullet', label: 'بولت و فشرده', icon: ListChecks, color: 'text-emerald-400' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = tone === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTone(item.id as any)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-neutral-800 border-red-500 text-white shadow-sm'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300">قطع تصویر خروجی:</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: '1:1', label: 'پست مربع (1:1)' },
              { id: '9:16', label: 'استوری و ریلز (9:16)' },
              { id: '4:5', label: 'پرتره اینستا (4:5)' },
              { id: '16:9', label: 'افقی و وب (16:9)' },
            ].map((ratio) => (
              <button
                key={ratio.id}
                type="button"
                onClick={() => setAspectRatio(ratio.id as AspectRatioType)}
                className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                  aspectRatio === ratio.id
                    ? 'bg-neutral-800 border-red-500 text-white shadow-sm'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 5. Main Action Button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
      >
        {loading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>در حال پردازش با {provider === 'mistral' ? 'Mistral' : provider === 'openrouter' ? 'OpenRouter' : 'Gemini'} و نگارش انسانی...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            <span>تولید هوشمند خبر + نگارش مقاله کامل</span>
          </>
        )}
      </button>

      {/* 6. Generated Full News Article Showcase with Direct Copy */}
      {generatedArticle && (
        <div className="p-4 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-3.5 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">متن کامل و تفصیلی خبر (آماده کپی و انتشار):</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
              {generatedArticle.split(/\s+/).filter(Boolean).length} کلمه
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 text-xs text-neutral-200 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap select-text font-sans">
            {generatedArticle}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Copy Full Article */}
            <button
              type="button"
              onClick={handleCopyFullArticle}
              className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                copiedArticle
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {copiedArticle ? (
                <>
                  <CheckCheck className="w-4 h-4" />
                  <span>متن کامل خبر کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی متن کامل خبر</span>
                </>
              )}
            </button>

            {/* Copy Social Summary / Caption */}
            <button
              type="button"
              onClick={handleCopySummary}
              className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                copiedSummary
                  ? 'bg-amber-500 text-black border-amber-400 shadow'
                  : 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700 text-neutral-200'
              }`}
            >
              {copiedSummary ? (
                <>
                  <CheckCheck className="w-4 h-4" />
                  <span>کپشن شبکه‌های اجتماعی کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی ساختار کارت خبری</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 7. Suggest Headline Variations */}
      {currentPost.title && (
        <div className="pt-4 border-t border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300">
              پیشنهاد ۵ تیتر جذاب و کلیک‌خور با مدل فعال:
            </span>
            <button
              type="button"
              onClick={handleFetchHeadlineVariations}
              disabled={loadingHeadlines}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loadingHeadlines ? 'animate-spin' : ''}`} />
              <span>ساخت تیترهای جدید</span>
            </button>
          </div>

          {headlineOptions.length > 0 && (
            <div className="space-y-2">
              {headlineOptions.map((titleOpt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onApplyPost({ title: titleOpt })}
                  className="w-full text-right p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-red-500/50 text-xs text-neutral-200 transition-all flex items-start gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{titleOpt}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
