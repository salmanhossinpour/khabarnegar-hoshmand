import React, { forwardRef } from 'react';
import { NewsPost } from '../types';
import { 
  Flame, 
  Clock, 
  Share2, 
  Sparkles, 
  Radio, 
  TrendingUp, 
  CheckCircle2, 
  Quote, 
  Bookmark,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

interface NewsCanvasProps {
  post: NewsPost;
  scale?: number;
  interactive?: boolean;
  onEditField?: (field: keyof NewsPost, value: any) => void;
}

export const NewsCanvas = forwardRef<HTMLDivElement, NewsCanvasProps>(
  ({ post, scale = 1, interactive = false, onEditField }, ref) => {
    // Dimension definitions based on aspect ratio (fixed coordinate system for high-res export)
    // 1:1 -> 1080x1080
    // 9:16 -> 1080x1920
    // 4:5 -> 1080x1350
    // 16:9 -> 1920x1080
    const getDimensions = () => {
      switch (post.aspectRatio) {
        case '9:16':
          return { width: 1080, height: 1920, label: 'استوری ۹:۱۶' };
        case '4:5':
          return { width: 1080, height: 1350, label: 'پرتره ۴:۵' };
        case '16:9':
          return { width: 1920, height: 1080, label: 'افقی ۱۶:۹' };
        case '1:1':
        default:
          return { width: 1080, height: 1080, label: 'پست ۱:۱' };
      }
    };

    const { width, height } = getDimensions();

    const getFontFamilyClass = () => {
      switch (post.fontFamily) {
        case 'lalezar':
          return 'font-lalezar';
        case 'rubik':
          return 'font-rubik';
        case 'naskh':
          return 'font-naskh';
        case 'system':
          return 'font-system';
        case 'vazir':
        default:
          return 'font-vazir';
      }
    };

    const getTitleSizeClass = () => {
      switch (post.titleSize) {
        case 'sm':
          return 'text-4xl leading-[1.3]';
        case 'md':
          return 'text-5xl leading-[1.3]';
        case 'xl':
          return 'text-7xl leading-[1.2]';
        case 'lg':
        default:
          return 'text-6xl leading-[1.25]';
      }
    };

    return (
      <div 
        className="relative shadow-2xl rounded-2xl overflow-hidden transition-all duration-200 select-none"
        style={{
          width: `${width * scale}px`,
          height: `${height * scale}px`,
        }}
      >
        {/* Render container scaled to native canvas resolution */}
        <div
          ref={ref}
          id="news-canvas-root"
          className={`absolute top-0 right-0 origin-top-right overflow-hidden bg-neutral-950 text-white ${getFontFamilyClass()}`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top right',
          }}
        >
          {/* Background Image Layer */}
          {post.bgImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-300"
              style={{
                backgroundImage: `url(${post.bgImage})`,
                filter: post.bgBlur > 0 ? `blur(${post.bgBlur}px)` : 'none',
                transform: post.bgBlur > 0 ? 'scale(1.08)' : 'none',
              }}
            />
          )}

          {/* Dynamic Background Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              backgroundColor: post.bgOverlayColor || '#09090b',
              opacity: (post.bgOverlayOpacity ?? 75) / 100,
            }}
          />

          {/* Template Specific Renderers */}
          {post.templateId === 'breaking-alert' && (
            <BreakingAlertTemplate post={post} titleClass={getTitleSizeClass()} />
          )}

          {post.templateId === 'editorial-minimal' && (
            <EditorialTemplate post={post} titleClass={getTitleSizeClass()} />
          )}

          {post.templateId === 'dark-glass' && (
            <DarkGlassTemplate post={post} titleClass={getTitleSizeClass()} />
          )}

          {post.templateId === 'social-feed' && (
            <SocialFeedTemplate post={post} titleClass={getTitleSizeClass()} />
          )}

          {post.templateId === 'broadcast-tv' && (
            <BroadcastTvTemplate post={post} titleClass={getTitleSizeClass()} />
          )}

          {post.templateId === 'quote-statement' && (
            <QuoteStatementTemplate post={post} titleClass={getTitleSizeClass()} />
          )}

          {post.templateId === 'split-photo' && (
            <SplitPhotoTemplate post={post} titleClass={getTitleSizeClass()} />
          )}

          {post.templateId === 'headline-hero' && (
            <HeadlineHeroTemplate post={post} titleClass={getTitleSizeClass()} />
          )}

          {post.templateId === 'key-takeaways' && (
            <KeyTakeawaysTemplate post={post} titleClass={getTitleSizeClass()} />
          )}

          {/* Agency Logo & Branding Overlay Layer */}
          {post.showAgencyLogo !== false && post.agencyLogo && (
            <AgencyLogoOverlay post={post} />
          )}

          {/* Global Watermark (if enabled and not overlapping agency logo) */}
          {post.showWatermark && post.watermarkText && (
            <div 
              className={`absolute z-30 flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xl font-medium tracking-wide shadow-lg ${
                post.agencyPosition === 'top-left' ? 'bottom-8 left-8' : 'top-8 left-8'
              }`}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: post.primaryColor || '#ef4444' }} 
              />
              <span>{post.watermarkText}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

// Agency Brand & Logo Overlay Renderer
const AgencyLogoOverlay: React.FC<{ post: NewsPost }> = ({ post }) => {
  const position = post.agencyPosition || 'top-left';
  const shape = post.agencyBadgeShape || 'pill';
  const size = post.agencyLogoSize || 'md';

  const getPositionClass = () => {
    switch (position) {
      case 'top-right':
        return 'top-8 right-8';
      case 'top-center':
        return 'top-8 left-1/2 -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-8 right-8';
      case 'bottom-left':
        return 'bottom-8 left-8';
      case 'top-left':
      default:
        return 'top-8 left-8';
    }
  };

  const getLogoSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'w-12 h-12 text-lg';
      case 'lg':
        return 'w-20 h-20 text-3xl';
      case 'md':
      default:
        return 'w-16 h-16 text-2xl';
    }
  };

  const isPill = shape === 'pill';
  const isCircle = shape === 'circle';
  const isTransparent = shape === 'transparent';

  return (
    <div 
      className={`absolute z-30 flex items-center gap-3 transition-all select-none ${getPositionClass()} ${
        isPill
          ? 'bg-black/75 backdrop-blur-xl border border-white/20 p-2.5 pr-4 pl-4 rounded-full shadow-2xl'
          : isTransparent
          ? 'p-1 filter drop-shadow-2xl'
          : isCircle
          ? 'p-2 rounded-full bg-black/70 backdrop-blur-md border border-white/20 shadow-2xl'
          : 'p-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 shadow-2xl'
      }`}
    >
      <div 
        className={`overflow-hidden flex items-center justify-center shrink-0 ${getLogoSizeClass()} ${
          isCircle || isPill ? 'rounded-full' : 'rounded-xl'
        }`}
      >
        <img
          src={post.agencyLogo}
          alt={post.agencyName || 'لوگوی خبرگزاری'}
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
        />
      </div>

      {post.showAgencyName !== false && post.agencyName && (
        <div className="flex flex-col">
          <span className="font-black text-white text-2xl drop-shadow-md leading-tight tracking-tight">
            {post.agencyName}
          </span>
          {post.watermarkText && isPill && (
            <span className="text-base text-white/70 font-mono leading-none mt-0.5">
              {post.watermarkText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// 1. Template: Breaking Alert
const BreakingAlertTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 text-white">
    {/* Top Bar */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div 
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-2xl shadow-lg tracking-wider"
          style={{ backgroundColor: post.primaryColor || '#ef4444' }}
        >
          <Flame className="w-7 h-7 animate-bounce" />
          <span>خبر فوری</span>
        </div>
        <div className="px-4 py-2 rounded-lg bg-white/15 backdrop-blur-md text-white font-medium text-xl border border-white/10">
          {post.category || 'عمومی'}
        </div>
      </div>
      <div className="flex items-center gap-2 text-white/80 text-xl bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
        <Clock className="w-5 h-5" />
        <span>{post.date || 'امروز'}</span>
      </div>
    </div>

    {/* Center / Body Section */}
    <div className="my-auto space-y-6">
      {post.kicker && (
        <div 
          className="inline-block px-4 py-1.5 rounded text-2xl font-bold tracking-wide"
          style={{ color: post.accentColor || '#fbbf24', backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          {post.kicker}
        </div>
      )}
      <h1 className={`font-black text-white drop-shadow-md tracking-tight ${titleClass}`}>
        {post.title}
      </h1>
      <p className="text-3xl text-neutral-200 leading-[1.6] font-normal bg-black/40 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
        {post.lead}
      </p>

      {/* Key Takeaways */}
      {post.keyPoints && post.keyPoints.length > 0 && (
        <div className="space-y-3 pt-2">
          {post.keyPoints.slice(0, 3).map((point, index) => (
            <div key={index} className="flex items-start gap-4 text-2xl text-white/90 bg-white/5 px-5 py-3 rounded-xl border border-white/5">
              <span 
                className="w-7 h-7 rounded-full flex items-center justify-center text-base font-bold shrink-0 mt-1"
                style={{ backgroundColor: post.primaryColor || '#ef4444' }}
              >
                {index + 1}
              </span>
              <span>{point}</span>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Bottom Footer */}
    <div className="flex items-center justify-between pt-6 border-t border-white/15 text-xl text-white/70">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-white/90">منبع:</span>
        <span className="text-white">{post.source || 'خبرگزاری رسمی'}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>{post.readTime}</span>
      </div>
    </div>
  </div>
);

// 2. Template: Editorial Minimal
const EditorialTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-14 bg-neutral-900/85 text-white border-[16px] border-neutral-800">
    {/* Editorial Header */}
    <div className="text-center pb-6 border-b-2 border-white/20 space-y-2">
      <div className="flex items-center justify-between text-lg text-white/60 uppercase tracking-widest font-mono">
        <span>{post.date || 'امروز'}</span>
        <span className="px-3 py-1 bg-white/10 rounded font-sans text-sm text-white font-bold">{post.category}</span>
        <span>منبع: {post.source}</span>
      </div>
      <div className="text-sm text-white/40 tracking-wider">گزارش ویژه و تحلیل خبری</div>
    </div>

    {/* Headline & Body */}
    <div className="my-auto space-y-8 py-6">
      {post.kicker && (
        <div 
          className="text-2xl font-bold tracking-wider"
          style={{ color: post.primaryColor || '#38bdf8' }}
        >
          // {post.kicker}
        </div>
      )}
      <h1 className={`font-black tracking-tight text-white ${titleClass}`}>
        {post.title}
      </h1>
      
      <div className="w-24 h-1 bg-white/30" />

      <p className="text-3xl text-neutral-300 leading-relaxed font-light">
        {post.lead}
      </p>

      {/* Quote or Takeaway */}
      {post.quote && post.quote.text && (
        <div className="border-r-4 pr-6 py-2 my-4 bg-white/5 rounded-l-lg border-white/40">
          <p className="text-2xl italic text-white/90">«{post.quote.text}»</p>
          <div className="text-xl text-white/60 mt-2 font-medium">
            — {post.quote.author} {post.quote.role && `(${post.quote.role})`}
          </div>
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="pt-6 border-t border-white/15 flex items-center justify-between text-xl text-white/50">
      <span>استودیو خبر و رسانه</span>
      <span>{post.readTime}</span>
    </div>
  </div>
);

// 3. Template: Dark Glass
const DarkGlassTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-end p-12">
    {/* Glass Card Container */}
    <div className="p-10 rounded-3xl bg-neutral-950/70 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-6">
      {/* Category Pill */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span 
            className="px-4 py-1.5 rounded-full text-xl font-bold text-white shadow-sm flex items-center gap-2"
            style={{ backgroundColor: post.primaryColor || '#06b6d4' }}
          >
            <Sparkles className="w-5 h-5" />
            {post.category}
          </span>
          {post.kicker && (
            <span className="text-xl text-white/80 font-medium bg-white/10 px-3.5 py-1 rounded-full">
              {post.kicker}
            </span>
          )}
        </div>
        <span className="text-lg text-white/60 bg-black/40 px-3 py-1 rounded-full">{post.date}</span>
      </div>

      {/* Title */}
      <h1 className={`font-black text-white tracking-tight ${titleClass}`}>
        {post.title}
      </h1>

      {/* Lead */}
      <p className="text-2xl text-neutral-300 leading-relaxed font-normal">
        {post.lead}
      </p>

      {/* Key Points */}
      {post.keyPoints && post.keyPoints.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 pt-2">
          {post.keyPoints.slice(0, 2).map((point, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xl text-white/90 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>{point}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 text-lg text-white/60">
        <span>منبع: {post.source}</span>
        <span>{post.readTime}</span>
      </div>
    </div>
  </div>
);

// 4. Template: Social Feed
const SocialFeedTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 text-white">
    {/* Instagram-like Top Badge */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/15">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xl" style={{ backgroundColor: post.primaryColor || '#8b5cf6' }}>
          {post.category ? post.category[0] : 'خ'}
        </div>
        <div>
          <div className="font-bold text-xl">{post.category || 'خبر فوری'}</div>
          <div className="text-sm text-white/60">{post.date}</div>
        </div>
      </div>
      <div className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-lg font-mono">
        صفحه ۱ از ۱
      </div>
    </div>

    {/* Content Card */}
    <div className="my-auto space-y-6 bg-gradient-to-t from-black/95 via-black/80 to-black/40 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
      {post.kicker && (
        <span 
          className="inline-block px-3.5 py-1 rounded-lg text-xl font-bold"
          style={{ backgroundColor: `${post.primaryColor}33`, color: post.primaryColor || '#a78bfa' }}
        >
          #{post.kicker.replace(/\s+/g, '_')}
        </span>
      )}
      <h1 className={`font-black text-white ${titleClass}`}>
        {post.title}
      </h1>
      <p className="text-2xl text-neutral-200 leading-relaxed font-light">
        {post.lead}
      </p>
    </div>

    {/* Social Footer */}
    <div className="flex items-center justify-between bg-black/60 backdrop-blur-md p-4 px-6 rounded-2xl border border-white/10 text-xl text-white/80">
      <div className="flex items-center gap-2">
        <Bookmark className="w-6 h-6 text-yellow-400" />
        <span>برای بعد ذخیره کنید</span>
      </div>
      <div className="flex items-center gap-2">
        <span>{post.source}</span>
      </div>
    </div>
  </div>
);

// 5. Template: Broadcast TV
const BroadcastTvTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-10 text-white">
    {/* Channel & Live Indicator */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 font-black text-xl tracking-wider uppercase animate-pulse">
          <Radio className="w-5 h-5" />
          <span>پخش زنده</span>
        </div>
        <div className="px-4 py-2 rounded bg-black/70 backdrop-blur text-xl font-bold border border-white/20">
          استودیو خبر
        </div>
      </div>
      <div className="text-xl bg-black/70 px-4 py-2 rounded font-mono border border-white/20">
        {post.date}
      </div>
    </div>

    {/* Bottom Lower Third Broadcast Strip */}
    <div className="space-y-4">
      <div 
        className="inline-block px-6 py-2 text-2xl font-black rounded-t-lg shadow-lg"
        style={{ backgroundColor: post.primaryColor || '#2563eb' }}
      >
        {post.kicker || post.category}
      </div>

      <div className="p-8 bg-neutral-950/90 backdrop-blur-xl border-t-4 border-red-600 shadow-2xl rounded-b-2xl space-y-4">
        <h1 className={`font-black text-white leading-tight ${titleClass}`}>
          {post.title}
        </h1>
        <p className="text-2xl text-neutral-300 leading-normal">
          {post.lead}
        </p>

        {/* Ticker Bar */}
        <div className="flex items-center gap-4 bg-neutral-900 px-4 py-2.5 rounded text-lg text-white/80 border border-white/10">
          <span className="font-bold text-red-400 shrink-0">آخرین سرخط:</span>
          <span className="truncate">{post.keyPoints?.[0] || post.title}</span>
        </div>
      </div>
    </div>
  </div>
);

// 6. Template: Quote & Statement
const QuoteStatementTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-14 bg-neutral-950/80 text-white">
    {/* Top Category */}
    <div className="flex items-center justify-between border-b border-white/15 pb-6">
      <span className="text-2xl font-bold tracking-wider" style={{ color: post.primaryColor || '#f59e0b' }}>
        بیانیه و اظهارات رسمی
      </span>
      <span className="text-xl text-white/60">{post.date}</span>
    </div>

    {/* Center Quote Box */}
    <div className="my-auto space-y-8 p-10 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-lg">
      <Quote 
        className="w-20 h-20 opacity-40 rotate-180" 
        style={{ color: post.primaryColor || '#f59e0b' }} 
      />
      
      <p className="text-4xl text-white font-medium leading-[1.6]">
        «{post.quote?.text || post.lead}»
      </p>

      {/* Author Info */}
      <div className="flex items-center gap-5 pt-6 border-t border-white/15">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl text-black shadow-lg"
          style={{ backgroundColor: post.primaryColor || '#f59e0b' }}
        >
          {post.quote?.author ? post.quote.author[0] : 'گ'}
        </div>
        <div>
          <div className="text-3xl font-black text-white">{post.quote?.author || 'مقام مسئول'}</div>
          <div className="text-xl text-white/70">{post.quote?.role || post.source}</div>
        </div>
      </div>
    </div>

    {/* Footer Headline context */}
    <div className="text-2xl text-white/80 font-light pt-4 flex items-center justify-between">
      <span>موضوع: {post.title}</span>
      <span className="text-lg text-white/50">{post.readTime}</span>
    </div>
  </div>
);

// 7. Template: Split Photo
const SplitPhotoTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-10">
    <div className="p-8 rounded-3xl bg-neutral-950/90 backdrop-blur-xl border border-white/15 shadow-2xl space-y-6 my-auto">
      <div className="flex items-center justify-between">
        <span 
          className="px-4 py-1.5 rounded-lg text-xl font-black text-white"
          style={{ backgroundColor: post.primaryColor || '#10b981' }}
        >
          {post.category}
        </span>
        <span className="text-lg text-white/60">{post.date}</span>
      </div>

      <h1 className={`font-black text-white ${titleClass}`}>
        {post.title}
      </h1>

      <p className="text-2xl text-neutral-300 leading-relaxed font-light">
        {post.lead}
      </p>

      {post.keyPoints && post.keyPoints.length > 0 && (
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
          {post.keyPoints.slice(0, 2).map((item, idx) => (
            <div key={idx} className="text-xl text-white/90 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-white/10 text-lg text-white/60">
        <span>منبع: {post.source}</span>
        <span>{post.readTime}</span>
      </div>
    </div>
  </div>
);

// 8. Template: Headline Hero Focus
const HeadlineHeroTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 bg-gradient-to-t from-black via-black/80 to-transparent text-white">
    <div className="flex items-center justify-between">
      <span 
        className="px-5 py-2 rounded-xl text-2xl font-black text-white shadow-xl"
        style={{ backgroundColor: post.primaryColor || '#f43f5e' }}
      >
        {post.category || 'خبر مهم'}
      </span>
      <span className="text-xl text-white/80 bg-black/50 px-4 py-1.5 rounded-lg backdrop-blur">
        {post.date}
      </span>
    </div>

    <div className="my-auto space-y-8">
      {post.kicker && (
        <div className="text-3xl font-bold tracking-wider text-rose-400">
          ● {post.kicker}
        </div>
      )}
      <h1 className="text-7xl font-black leading-[1.18] text-white drop-shadow-2xl">
        {post.title}
      </h1>
      <p className="text-3xl text-neutral-200 leading-[1.6] font-normal bg-black/60 p-6 rounded-2xl border border-white/15 backdrop-blur-md">
        {post.lead}
      </p>
    </div>

    <div className="flex items-center justify-between pt-6 border-t border-white/20 text-2xl text-white/80">
      <span>منبع: {post.source}</span>
      <span>{post.readTime}</span>
    </div>
  </div>
);

// 9. Template: Key Takeaways Infographic
const KeyTakeawaysTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 bg-neutral-950/90 text-white">
    <div className="flex items-center justify-between pb-4 border-b border-white/15">
      <div className="flex items-center gap-3">
        <span 
          className="px-4 py-2 rounded-lg text-xl font-bold text-white"
          style={{ backgroundColor: post.primaryColor || '#14b8a6' }}
        >
          ۳ نکته کلیدی
        </span>
        <span className="text-xl text-white/70">{post.category}</span>
      </div>
      <span className="text-lg text-white/60">{post.date}</span>
    </div>

    <div className="space-y-4 my-2">
      <h1 className={`font-black text-white ${titleClass}`}>
        {post.title}
      </h1>
      <p className="text-2xl text-neutral-300 font-light">{post.lead}</p>
    </div>

    {/* 3 Key Takeaways Boxes */}
    <div className="space-y-3.5 my-auto">
      {post.keyPoints && post.keyPoints.length > 0 ? (
        post.keyPoints.slice(0, 3).map((point, index) => (
          <div 
            key={index}
            className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm"
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white shrink-0 mt-0.5"
              style={{ backgroundColor: post.primaryColor || '#14b8a6' }}
            >
              ۰{index + 1}
            </div>
            <p className="text-2xl text-white/95 font-medium leading-relaxed">
              {point}
            </p>
          </div>
        ))
      ) : (
        <div className="text-xl text-white/50">بدون نکات کلیدی</div>
      )}
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-white/15 text-lg text-white/60">
      <span>منبع: {post.source}</span>
      <span>{post.readTime}</span>
    </div>
  </div>
);
