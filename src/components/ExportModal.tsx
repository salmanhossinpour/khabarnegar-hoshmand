import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Download, 
  Share2, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  Square,
  LayoutTemplate,
  Monitor,
  Maximize2,
  Layers,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { NewsPost, AspectRatioType } from '../types';
import { cleanText } from '../utils/textCleaner';
import { exportElementToImage } from '../utils/imageExporter';

interface ExportModalProps {
  post: NewsPost;
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onUpdatePost?: (updatedFields: Partial<NewsPost>) => void;
}

type QualityLevel = 'standard' | 'ultra' | 'compact';

export const ExportModal: React.FC<ExportModalProps> = ({
  post,
  isOpen,
  onClose,
  canvasRef,
  onUpdatePost,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedFullArticle, setCopiedFullArticle] = useState(false);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState<QualityLevel>('standard');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Aspect ratio presets with exact pixel definitions
  const ASPECT_CONFIG: Record<AspectRatioType, { label: string; sub: string; baseW: number; baseH: number; icon: any }> = {
    '1:1': { label: 'پست مربع (1:1)', sub: '۱۰۸۰ × ۱۰۸۰', baseW: 1080, baseH: 1080, icon: Square },
    '9:16': { label: 'استوری و ریلز (9:16)', sub: '۱۰۸۰ × ۱۹۲۰', baseW: 1080, baseH: 1920, icon: Smartphone },
    '4:5': { label: 'پرتره اینستا (4:5)', sub: '۱۰۸۰ × ۱۳۵۰', baseW: 1080, baseH: 1350, icon: LayoutTemplate },
    '16:9': { label: 'افقی و وبسایت (16:9)', sub: '۱۹۲۰ × ۱۰۸۰', baseW: 1920, baseH: 1080, icon: Monitor },
  };

  const currentConfig = ASPECT_CONFIG[post.aspectRatio || '1:1'];

  const getTargetDimensions = () => {
    const baseW = currentConfig.baseW;
    const baseH = currentConfig.baseH;

    const ratio = quality === 'ultra' ? 2 : quality === 'compact' ? 0.75 : 1;

    return {
      baseWidth: baseW,
      baseHeight: baseH,
      outputWidth: Math.round(baseW * ratio),
      outputHeight: Math.round(baseH * ratio),
      pixelRatio: ratio,
    };
  };

  const { baseWidth, baseHeight, outputWidth, outputHeight, pixelRatio } = getTargetDimensions();

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  };

  const handleDownloadImage = async () => {
    if (!canvasRef.current) {
      alert('المان تصویر یافت نشد.');
      return;
    }
    setDownloading(true);
    setErrorMessage(null);
    setStatusMessage('در حال آماده‌سازی و رندر خروجی با ابعاد دقیق...');

    try {
      const node = canvasRef.current;

      const dataUrl = await exportElementToImage(node, {
        baseWidth,
        baseHeight,
        outputWidth,
        outputHeight,
        pixelRatio,
        format,
        quality: format === 'jpeg' ? 0.96 : 1,
      });

      const link = document.createElement('a');
      const categorySlug = (post.category || 'news').replace(/[\s/]+/g, '_');
      const ratioSlug = (post.aspectRatio || '1_1').replace(':', '_');
      const filename = `${categorySlug}_${ratioSlug}_${outputWidth}x${outputHeight}_${Date.now()}.${format}`;
      
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatusMessage(`فایل تصویر با سایز ${outputWidth} × ${outputHeight} پیکسل دانلود شد!`);
      triggerConfetti();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMessage(err?.message || 'خطا در دریافت تصویر. لطفاً مجدداً امتحان فرمایید.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyCaption = () => {
    const caption = `📌 ${post.kicker ? `[${cleanText(post.kicker)}] ` : ''}${cleanText(post.title)}

🔹 ${cleanText(post.lead)}

${post.keyPoints && post.keyPoints.length > 0 ? `📋 مهم‌ترین نکات:\n${post.keyPoints.map(p => `• ${cleanText(p)}`).join('\n')}\n\n` : ''}${post.quote?.text ? `💬 «${cleanText(post.quote.text)}»\n— ${cleanText(post.quote.author)}\n\n` : ''}🕒 ${post.date} | 🗞 منبع: ${cleanText(post.source)}
${post.watermarkText ? `🆔 ${cleanText(post.watermarkText)}` : ''}
#${(post.category || 'خبر').replace(/\s+/g, '_')} #خبر_فوری #گزارش_ویژه`;

    navigator.clipboard.writeText(cleanText(caption));
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleCopyFullArticle = () => {
    const text = post.fullArticle || `${post.title}\n\n${post.lead}\n\n${post.keyPoints?.map(p => `• ${p}`).join('\n') || ''}\n\nمنبع: ${post.source}`;
    navigator.clipboard.writeText(cleanText(text));
    setCopiedFullArticle(true);
    setTimeout(() => setCopiedFullArticle(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `${post.title}\n\n${post.lead}\n\nمنبع: ${post.source}`,
        });
      } catch (e) {}
    } else {
      handleCopyCaption();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 text-neutral-100 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">خروجی و دانلود پست با ابعاد استاندارد</h3>
              <p className="text-xs text-neutral-400">سایز دقیق بدون کشیدگی و افت کیفیت برای شبکه‌های اجتماعی</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success notification */}
        {statusMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Aspect Ratio Picker with Live Dimensions */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-red-400" />
              <span>انتخاب قطع و نسبت تصویر (Aspect Ratio):</span>
            </span>
            <span className="text-[11px] text-amber-400 font-mono">
              فعلی: {currentConfig.sub} px
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(ASPECT_CONFIG) as AspectRatioType[]).map((r) => {
              const cfg = ASPECT_CONFIG[r];
              const Icon = cfg.icon;
              const isSelected = post.aspectRatio === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onUpdatePost && onUpdatePost({ aspectRatio: r })}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                    isSelected
                      ? 'bg-red-500/20 border-red-500 text-white shadow-md ring-1 ring-red-500/50'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-red-400' : 'text-neutral-500'}`} />
                  <span className="text-xs font-bold leading-tight">{cfg.label.split(' ')[0]}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{cfg.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Output Resolution / Quality Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>رزولوشن و کیفیت تصویر نهایی:</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setQuality('standard')}
              className={`p-2.5 rounded-2xl border text-center transition-all ${
                quality === 'standard'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/50'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="text-xs font-bold">استاندارد (Full HD)</div>
              <div className="text-[10px] text-neutral-400 font-mono mt-0.5">1x — {currentConfig.baseW}×{currentConfig.baseH}</div>
            </button>

            <button
              type="button"
              onClick={() => setQuality('ultra')}
              className={`p-2.5 rounded-2xl border text-center transition-all ${
                quality === 'ultra'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="text-xs font-bold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>فوق‌العاده (4K)</span>
              </div>
              <div className="text-[10px] text-neutral-400 font-mono mt-0.5">2x — {currentConfig.baseW * 2}×{currentConfig.baseH * 2}</div>
            </button>

            <button
              type="button"
              onClick={() => setQuality('compact')}
              className={`p-2.5 rounded-2xl border text-center transition-all ${
                quality === 'compact'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="text-xs font-bold">سبک وب (Web)</div>
              <div className="text-[10px] text-neutral-400 font-mono mt-0.5">0.75x — حجم کمتر</div>
            </button>
          </div>
        </div>

        {/* 3. Format Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300">فرمت فایل:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormat('png')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                format === 'png'
                  ? 'bg-neutral-800 border-red-500 text-white shadow'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="text-xs font-bold">فرمت PNG (کیفیت حداکثری و شفاف)</div>
              <div className="text-[10px] text-neutral-400">مناسب پوستر و اینستاگرام</div>
            </button>
            <button
              type="button"
              onClick={() => setFormat('jpeg')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                format === 'jpeg'
                  ? 'bg-neutral-800 border-red-500 text-white shadow'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="text-xs font-bold">فرمت JPG (فشرده و پرسرعت)</div>
              <div className="text-[10px] text-neutral-400">مناسب سایت و تلگرام</div>
            </button>
          </div>
        </div>

        {/* Dimension Summary Badge */}
        <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>ابعاد فایل دانلودی:</span>
          </span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {outputWidth} × {outputHeight} پیکسل
          </span>
        </div>

        {/* Main Action Download */}
        <button
          type="button"
          onClick={handleDownloadImage}
          disabled={downloading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {downloading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>در حال پردازش و تولید فایل با سایز {outputWidth}×{outputHeight}...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>دانلود فوری تصویر ({outputWidth}×{outputHeight} • {format.toUpperCase()})</span>
            </>
          )}
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={handleCopyFullArticle}
            className="p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 transition-colors"
          >
            {copiedFullArticle ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">مقاله کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>کپی متن کامل خبر</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyCaption}
            className="p-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-2 transition-colors"
          >
            {copiedCaption ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">کپشن کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>کپی کپشن پست</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>اشتراک‌گذاری</span>
          </button>
        </div>

      </div>
    </div>
  );
};

