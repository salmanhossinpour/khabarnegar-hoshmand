import React, { useState } from 'react';
import { NewsPost } from '../types';
import { cleanText } from '../utils/textCleaner';
import { 
  FileText, 
  Tag, 
  Globe, 
  Calendar, 
  Quote, 
  Plus, 
  Trash2, 
  ListOrdered, 
  Clock,
  Sparkles,
  Copy,
  CheckCheck,
  AlignRight
} from 'lucide-react';

interface ContentEditorProps {
  post: NewsPost;
  onChange: (updatedFields: Partial<NewsPost>) => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({ post, onChange }) => {
  const [copiedFull, setCopiedFull] = useState(false);

  const handleCopyFullArticle = async () => {
    const textToCopy = cleanText(post.fullArticle || post.lead);
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2500);
    } catch {
      alert('خطا در کپی');
    }
  };
  const handleKeyPointChange = (index: number, value: string) => {
    const updated = [...(post.keyPoints || [])];
    updated[index] = value;
    onChange({ keyPoints: updated });
  };

  const handleAddKeyPoint = () => {
    const updated = [...(post.keyPoints || []), 'نکته جدید...'];
    onChange({ keyPoints: updated });
  };

  const handleRemoveKeyPoint = (index: number) => {
    const updated = (post.keyPoints || []).filter((_, i) => i !== index);
    onChange({ keyPoints: updated });
  };

  const handleQuoteChange = (field: 'text' | 'author' | 'role', value: string) => {
    onChange({
      quote: {
        text: post.quote?.text || '',
        author: post.quote?.author || '',
        role: post.quote?.role || '',
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-5 pb-6 text-neutral-100">
      {/* Kicker & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-red-400" />
            <span>روتیتر (عبارت بالای تیتر):</span>
          </label>
          <input
            type="text"
            value={post.kicker}
            onChange={(e) => onChange({ kicker: e.target.value })}
            placeholder="مثلا: خبر فوری، تحولات ارزی، گزارش ویژه"
            className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-500 text-xs text-neutral-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>دسته‌بندی موضوعی:</span>
          </label>
          <input
            type="text"
            value={post.category}
            onChange={(e) => onChange({ category: e.target.value })}
            placeholder="مثلا: اقتصادی، فناوری، سیاسی، ورزشی، حوادث"
            className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-500 text-xs text-neutral-100"
          />
        </div>
      </div>

      {/* Main Headline */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>تیتر اصلی خبر:</span>
          </label>
          <span className="text-[11px] text-neutral-500 font-mono">
            {post.title.length} کاراکتر
          </span>
        </div>
        <textarea
          value={post.title}
          onChange={(e) => onChange({ title: e.target.value })}
          rows={2}
          placeholder="تیتر کوتاه، کوبنده و خوانا"
          className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-500 text-sm font-bold text-neutral-100 leading-snug"
        />
      </div>

      {/* Lead Summary */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>خلاصه و لید خبر (روی تصویر):</span>
          </label>
          <span className="text-[11px] text-neutral-500 font-mono">
            {post.lead.length} کاراکتر
          </span>
        </div>
        <textarea
          value={post.lead}
          onChange={(e) => onChange({ lead: e.target.value })}
          rows={3}
          placeholder="۲ الی ۳ جمله توضیحی از اصل خبر..."
          className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-500 text-xs text-neutral-200 leading-relaxed"
        />
      </div>

      {/* Full Article (Comprehensive & Humanized Journalistic Body) */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
            <AlignRight className="w-4 h-4 text-emerald-400" />
            <span>متن کامل و تفصیلی خبر (جهت انتشار و کپی):</span>
          </label>
          <button
            type="button"
            onClick={handleCopyFullArticle}
            className={`text-xs px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 transition-all ${
              copiedFull
                ? 'bg-emerald-500 text-black border-emerald-400 shadow'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {copiedFull ? (
              <>
                <CheckCheck className="w-3 h-3" />
                <span>کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>کپی متن کامل</span>
              </>
            )}
          </button>
        </div>
        <textarea
          value={post.fullArticle || ''}
          onChange={(e) => onChange({ fullArticle: e.target.value })}
          rows={5}
          placeholder="متن کامل و بندهای تحلیلی خبر (تولید شده توسط هوش مصنوعی با نگارش انسانی)..."
          className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-xs text-neutral-200 leading-relaxed"
        />
        <div className="flex items-center justify-between text-[11px] text-neutral-500">
          <span>شامل مقدمه، شرح واقعه، نقل‌قول‌ها و تحلیل ابعاد رویداد</span>
          <span className="font-mono">
            {(post.fullArticle || '').split(/\s+/).filter(Boolean).length} کلمه
          </span>
        </div>
      </div>


      {/* Key Points */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <ListOrdered className="w-3.5 h-3.5 text-violet-400" />
            <span>نکات کلیدی خبر (بولت‌پوینت‌ها):</span>
          </label>
          <button
            type="button"
            onClick={handleAddKeyPoint}
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن نکته</span>
          </button>
        </div>

        <div className="space-y-2">
          {(post.keyPoints || []).map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-800 text-neutral-400 text-xs flex items-center justify-center font-bold shrink-0">
                {index + 1}
              </span>
              <input
                type="text"
                value={point}
                onChange={(e) => handleKeyPointChange(index, e.target.value)}
                placeholder={`نکته کلیدی شماره ${index + 1}`}
                className="flex-1 p-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-violet-500 text-xs text-neutral-100"
              />
              <button
                type="button"
                onClick={() => handleRemoveKeyPoint(index)}
                className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                title="حذف این نکته"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quote Section */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-3">
        <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
          <Quote className="w-3.5 h-3.5 text-amber-400" />
          <span>نقل‌قول و گوینده (اختیاری):</span>
        </label>
        <textarea
          value={post.quote?.text || ''}
          onChange={(e) => handleQuoteChange('text', e.target.value)}
          rows={2}
          placeholder="متن سخنان یا نقل‌قول مهم..."
          className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-xs text-neutral-200"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={post.quote?.author || ''}
            onChange={(e) => handleQuoteChange('author', e.target.value)}
            placeholder="نام گوینده (مثلا: سخنگوی دولت)"
            className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100"
          />
          <input
            type="text"
            value={post.quote?.role || ''}
            onChange={(e) => handleQuoteChange('role', e.target.value)}
            placeholder="سمت یا عنوان"
            className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100"
          />
        </div>
      </div>

      {/* Source, Date, Read Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>منبع خبر:</span>
          </label>
          <input
            type="text"
            value={post.source}
            onChange={(e) => onChange({ source: e.target.value })}
            placeholder="مثلا: خبرگزاری ایرنا / رویترز"
            className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-rose-400" />
            <span>تاریخ و زمان:</span>
          </label>
          <input
            type="text"
            value={post.date}
            onChange={(e) => onChange({ date: e.target.value })}
            placeholder="امروز - ۱۴:۳۰"
            className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>زمان مطالعه:</span>
          </label>
          <input
            type="text"
            value={post.readTime}
            onChange={(e) => onChange({ readTime: e.target.value })}
            placeholder="۲ دقیقه مطالعه"
            className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100"
          />
        </div>
      </div>
    </div>
  );
};
