import React, { forwardRef } from 'react';
import { NewsPost } from '../types';
import { getSafeImageUrl } from '../utils/imageExporter';
import { 
  Flame, 
  Clock, 
  Sparkles, 
  Radio, 
  CheckCircle2, 
  Quote, 
  Bookmark,
} from 'lucide-react';

interface NewsCanvasProps {
  post: NewsPost;
  scale?: number;
  interactive?: boolean;
  onEditField?: (field: keyof NewsPost, value: any) => void;
}

export const NewsCanvas = forwardRef<HTMLDivElement, NewsCanvasProps>(
  ({ post, scale = 1 }, ref) => {
    // Dimension definitions based on aspect ratio (fixed coordinate system for high-res export)
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
                backgroundImage: `url(${getSafeImageUrl(post.bgImage)})`,
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

          {/* Template Specific Renderers with Integrated, Collision-Free Branding */}
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
        </div>
      </div>
    );
  }
);

// -------------------------------------------------------------
// REUSABLE BRANDING & LOGO BADGE COMPONENT (Zero Background Text)
// -------------------------------------------------------------
export const AgencyBrandBadge: React.FC<{ 
  post: NewsPost; 
  className?: string;
  forceCompact?: boolean;
}> = ({ post, className = '', forceCompact = false }) => {
  if (post.showAgencyLogo === false || !post.agencyLogo) return null;

  const shape = post.agencyBadgeShape || 'pill';
  const size = post.agencyLogoSize || 'md';

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { box: 'w-10 h-10', text: 'text-lg', sub: 'text-xs' };
      case 'xl':
        return { box: 'w-24 h-24', text: 'text-3xl', sub: 'text-lg' };
      case 'lg':
        return { box: 'w-20 h-20', text: 'text-2xl', sub: 'text-base' };
      case 'md':
      default:
        return { box: 'w-14 h-14', text: 'text-xl', sub: 'text-sm' };
    }
  };

  const sz = getSizeStyles();
  const isPill = shape === 'pill' && !forceCompact;
  const isCircle = shape === 'circle';
  const isTransparent = shape === 'transparent';

  return (
    <div 
      className={`inline-flex items-center gap-3 transition-all select-none shrink-0 ${
        isPill
          ? 'bg-black/75 backdrop-blur-xl border border-white/20 px-3.5 py-2 rounded-full shadow-2xl'
          : isTransparent
          ? 'p-0.5 filter drop-shadow-2xl'
          : isCircle
          ? 'p-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 shadow-2xl'
          : 'p-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 shadow-2xl'
      } ${className}`}
    >
      <div 
        className={`overflow-hidden flex items-center justify-center shrink-0 ${sz.box} ${
          isCircle || isPill ? 'rounded-full' : 'rounded-xl'
        }`}
      >
        <img
          src={getSafeImageUrl(post.agencyLogo)}
          alt={post.agencyName || 'لوگوی خبرگزاری'}
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
        />
      </div>

      {post.showAgencyName !== false && post.agencyName && !forceCompact && (
        <div className="flex flex-col text-right pr-1">
          <span className={`font-black text-white drop-shadow-md leading-tight tracking-tight ${sz.text}`}>
            {post.agencyName}
          </span>
          {post.watermarkText && isPill && (
            <span className={`${sz.sub} text-white/70 font-mono leading-none mt-0.5`}>
              {post.watermarkText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// SMART HEADER BAR COMPONENT (Zero-Collision Layout)
// -------------------------------------------------------------
interface SmartHeaderProps {
  post: NewsPost;
  customBadge?: React.ReactNode;
  showDate?: boolean;
}

const SmartHeader: React.FC<SmartHeaderProps> = ({ 
  post, 
  customBadge, 
  showDate = true 
}) => {
  const hasLogo = post.showAgencyLogo !== false && !!post.agencyLogo;
  const pos = post.agencyPosition || 'top-left';

  // 1. Full-Width Header Bar Mode
  if (hasLogo && pos === 'header-bar') {
    return (
      <div className="w-full bg-black/70 backdrop-blur-xl border-b border-white/15 px-8 py-4 -mx-12 -mt-12 mb-8 flex items-center justify-between shadow-2xl">
        <AgencyBrandBadge post={post} />
        <div className="flex items-center gap-3">
          {customBadge || (
            <div 
              className="px-4 py-1.5 rounded-lg text-lg font-bold shadow"
              style={{ backgroundColor: post.primaryColor || '#ef4444' }}
            >
              {post.category || 'خبر فوری'}
            </div>
          )}
          {showDate && (
            <div className="flex items-center gap-1.5 text-white/70 text-lg font-mono bg-white/10 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>{post.date || 'امروز'}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Top-Center Mode (Centered Brand Pill with sub-row)
  if (hasLogo && pos === 'top-center') {
    return (
      <div className="w-full space-y-4 mb-4">
        <div className="flex justify-center">
          <AgencyBrandBadge post={post} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {customBadge || (
              <div 
                className="px-4 py-1.5 rounded-lg text-xl font-bold shadow"
                style={{ backgroundColor: post.primaryColor || '#ef4444' }}
              >
                {post.category || 'خبر فوری'}
              </div>
            )}
          </div>
          {showDate && (
            <div className="flex items-center gap-2 text-white/80 text-xl bg-black/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
              <Clock className="w-5 h-5" />
              <span>{post.date || 'امروز'}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Top-Right Mode: Logo on the right, Category/Date on the left
  if (hasLogo && pos === 'top-right') {
    return (
      <div className="flex items-center justify-between w-full mb-6">
        <div className="flex items-center gap-3">
          <AgencyBrandBadge post={post} />
          {customBadge}
        </div>
        {showDate && (
          <div className="flex items-center gap-2 text-white/80 text-xl bg-black/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
            <Clock className="w-5 h-5" />
            <span>{post.date || 'امروز'}</span>
          </div>
        )}
      </div>
    );
  }

  // 4. Top-Left Mode (Default Standard): Category/Alert on the right, Logo on the left (Zero Text Underneath!)
  if (hasLogo && pos === 'top-left') {
    return (
      <div className="flex items-center justify-between w-full mb-6">
        <div className="flex items-center gap-3">
          {customBadge || (
            <div 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-2xl shadow-lg tracking-wider"
              style={{ backgroundColor: post.primaryColor || '#ef4444' }}
            >
              <Flame className="w-6 h-6 animate-bounce" />
              <span>{post.category || 'خبر فوری'}</span>
            </div>
          )}
          {showDate && (
            <div className="flex items-center gap-2 text-white/70 text-lg bg-black/40 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
              <Clock className="w-4 h-4" />
              <span>{post.date || 'امروز'}</span>
            </div>
          )}
        </div>
        <AgencyBrandBadge post={post} />
      </div>
    );
  }

  // 5. Default Header (When logo is at bottom or disabled)
  return (
    <div className="flex items-center justify-between w-full mb-6">
      <div className="flex items-center gap-3">
        {customBadge || (
          <div 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-2xl shadow-lg tracking-wider"
            style={{ backgroundColor: post.primaryColor || '#ef4444' }}
          >
            <Flame className="w-6 h-6 animate-bounce" />
            <span>{post.category || 'خبر فوری'}</span>
          </div>
        )}
      </div>
      {showDate && (
        <div className="flex items-center gap-2 text-white/80 text-xl bg-black/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
          <Clock className="w-5 h-5" />
          <span>{post.date || 'امروز'}</span>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// SMART FOOTER BAR COMPONENT (Zero-Collision Layout)
// -------------------------------------------------------------
const SmartFooter: React.FC<{ post: NewsPost; extraText?: string }> = ({ post, extraText }) => {
  const hasLogo = post.showAgencyLogo !== false && !!post.agencyLogo;
  const isBottomLeft = hasLogo && post.agencyPosition === 'bottom-left';
  const isBottomRight = hasLogo && post.agencyPosition === 'bottom-right';

  return (
    <div className="flex items-center justify-between pt-6 border-t border-white/15 text-xl text-white/75 mt-auto">
      {/* Right Side */}
      <div className="flex items-center gap-3">
        {isBottomRight ? (
          <AgencyBrandBadge post={post} />
        ) : (
          <>
            <span className="font-semibold text-white/90">منبع:</span>
            <span className="text-white">{post.source || 'خبرگزاری رسمی'}</span>
            {post.watermarkText && post.showWatermark && (
              <span className="text-white/60 font-mono text-lg bg-white/5 px-2.5 py-0.5 rounded-md">
                {post.watermarkText}
              </span>
            )}
          </>
        )}
      </div>

      {/* Left Side */}
      <div className="flex items-center gap-3">
        {isBottomLeft ? (
          <AgencyBrandBadge post={post} />
        ) : (
          <>
            {extraText && <span>{extraText}</span>}
            <span>{post.readTime || '۱ دقیقه'}</span>
          </>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// TEMPLATE 1: Breaking Alert
// -------------------------------------------------------------
const BreakingAlertTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 text-white">
    <SmartHeader 
      post={post} 
      customBadge={
        <div 
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-2xl shadow-lg tracking-wider"
          style={{ backgroundColor: post.primaryColor || '#ef4444' }}
        >
          <Flame className="w-6 h-6 animate-bounce" />
          <span>خبر فوری</span>
          <span className="text-white/70 font-normal text-xl pr-1.5">| {post.category || 'عمومی'}</span>
        </div>
      }
    />

    {/* Center / Body Section */}
    <div className="my-auto space-y-6">
      {post.kicker && (
        <div 
          className="inline-block px-4 py-1.5 rounded-lg text-2xl font-bold tracking-wide shadow-sm"
          style={{ color: post.accentColor || '#fbbf24', backgroundColor: 'rgba(0,0,0,0.65)' }}
        >
          {post.kicker}
        </div>
      )}
      <h1 className={`font-black text-white drop-shadow-md tracking-tight ${titleClass}`}>
        {post.title}
      </h1>
      <p className="text-3xl text-neutral-200 leading-[1.6] font-normal bg-black/45 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
        {post.lead}
      </p>

      {/* Key Takeaways */}
      {post.keyPoints && post.keyPoints.length > 0 && (
        <div className="space-y-3 pt-2">
          {post.keyPoints.slice(0, 3).map((point, index) => (
            <div key={index} className="flex items-start gap-4 text-2xl text-white/90 bg-white/5 px-5 py-3 rounded-xl border border-white/5 backdrop-blur-sm">
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

    <SmartFooter post={post} />
  </div>
);

// -------------------------------------------------------------
// TEMPLATE 2: Editorial Minimal
// -------------------------------------------------------------
const EditorialTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-14 bg-neutral-900/90 text-white border-[16px] border-neutral-800">
    <SmartHeader 
      post={post}
      customBadge={
        <div className="flex items-center gap-2 text-base text-white/70 uppercase tracking-widest font-mono bg-white/10 px-4 py-2 rounded-xl">
          <span className="font-bold text-white">{post.category || 'تحلیل و گزارش'}</span>
        </div>
      }
    />

    {/* Headline & Body */}
    <div className="my-auto space-y-7 py-4">
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
      
      <div className="w-24 h-1.5 rounded-full" style={{ backgroundColor: post.primaryColor || '#38bdf8' }} />

      <p className="text-3xl text-neutral-300 leading-relaxed font-light">
        {post.lead}
      </p>

      {/* Quote or Takeaway */}
      {post.quote && post.quote.text && (
        <div className="border-r-4 pr-6 py-3 my-4 bg-white/5 rounded-l-2xl border-white/40">
          <p className="text-2xl italic text-white/95 leading-relaxed">«{post.quote.text}»</p>
          <div className="text-xl text-white/60 mt-2 font-medium">
            — {post.quote.author} {post.quote.role && `(${post.quote.role})`}
          </div>
        </div>
      )}
    </div>

    <SmartFooter post={post} extraText="گزارش ویژه تحریریه" />
  </div>
);

// -------------------------------------------------------------
// TEMPLATE 3: Dark Glass
// -------------------------------------------------------------
const DarkGlassTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-12">
    {/* Clean Top Zone (Logo sits on open photo with zero text under it) */}
    <SmartHeader 
      post={post}
      customBadge={
        <span 
          className="px-4 py-1.5 rounded-full text-xl font-bold text-white shadow-sm flex items-center gap-2"
          style={{ backgroundColor: post.primaryColor || '#06b6d4' }}
        >
          <Sparkles className="w-5 h-5" />
          {post.category || 'خبر مهم'}
        </span>
      }
    />

    {/* Glass Card Container at bottom half */}
    <div className="p-10 rounded-3xl bg-neutral-950/80 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-6 mt-auto">
      {post.kicker && (
        <div className="text-xl text-white/80 font-medium bg-white/10 px-4 py-1 rounded-full inline-block">
          {post.kicker}
        </div>
      )}

      <h1 className={`font-black text-white tracking-tight ${titleClass}`}>
        {post.title}
      </h1>

      <p className="text-2xl text-neutral-300 leading-relaxed font-normal">
        {post.lead}
      </p>

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

      <SmartFooter post={post} />
    </div>
  </div>
);

// -------------------------------------------------------------
// TEMPLATE 4: Social Feed
// -------------------------------------------------------------
const SocialFeedTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 text-white">
    <SmartHeader 
      post={post}
      customBadge={
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/15">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-lg" style={{ backgroundColor: post.primaryColor || '#8b5cf6' }}>
            {post.category ? post.category[0] : 'خ'}
          </div>
          <div>
            <div className="font-bold text-lg">{post.category || 'خبر فوری'}</div>
          </div>
        </div>
      }
    />

    {/* Content Card */}
    <div className="my-auto space-y-6 bg-gradient-to-t from-black/95 via-black/85 to-black/50 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
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
      <div className="flex items-center gap-3">
        {post.showAgencyLogo !== false && post.agencyLogo && (
          <AgencyBrandBadge post={post} forceCompact />
        )}
        <span>{post.source}</span>
      </div>
    </div>
  </div>
);

// -------------------------------------------------------------
// TEMPLATE 5: Broadcast TV
// -------------------------------------------------------------
const BroadcastTvTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-10 text-white">
    <SmartHeader 
      post={post}
      customBadge={
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 font-black text-xl tracking-wider uppercase shadow animate-pulse">
          <Radio className="w-5 h-5" />
          <span>پخش زنده</span>
        </div>
      }
    />

    {/* Bottom Lower Third Broadcast Strip */}
    <div className="space-y-4 mt-auto">
      <div 
        className="inline-block px-6 py-2 text-2xl font-black rounded-t-xl shadow-lg"
        style={{ backgroundColor: post.primaryColor || '#2563eb' }}
      >
        {post.kicker || post.category || 'خبر فوری'}
      </div>

      <div className="p-8 bg-neutral-950/95 backdrop-blur-xl border-t-4 border-red-600 shadow-2xl rounded-b-3xl space-y-4">
        <h1 className={`font-black text-white leading-tight ${titleClass}`}>
          {post.title}
        </h1>
        <p className="text-2xl text-neutral-300 leading-normal font-light">
          {post.lead}
        </p>

        {/* Ticker Bar */}
        <div className="flex items-center gap-4 bg-neutral-900 px-4 py-2.5 rounded-xl text-lg text-white/80 border border-white/10">
          <span className="font-bold text-red-400 shrink-0">آخرین سرخط:</span>
          <span className="truncate">{post.keyPoints?.[0] || post.title}</span>
        </div>
      </div>
    </div>
  </div>
);

// -------------------------------------------------------------
// TEMPLATE 6: Quote & Statement
// -------------------------------------------------------------
const QuoteStatementTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-14 bg-neutral-950/85 text-white">
    <SmartHeader 
      post={post}
      customBadge={
        <span className="text-2xl font-bold tracking-wider" style={{ color: post.primaryColor || '#f59e0b' }}>
          بیانیه و اظهارات رسمی
        </span>
      }
    />

    {/* Center Quote Box */}
    <div className="my-auto space-y-8 p-10 rounded-3xl bg-black/65 border border-white/15 backdrop-blur-lg shadow-2xl">
      <Quote 
        className="w-18 h-18 opacity-40 rotate-180" 
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

    <SmartFooter post={post} extraText={`موضوع: ${post.title.slice(0, 30)}...`} />
  </div>
);

// -------------------------------------------------------------
// TEMPLATE 7: Split Photo
// -------------------------------------------------------------
const SplitPhotoTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-10">
    <SmartHeader 
      post={post}
      customBadge={
        <span 
          className="px-4 py-1.5 rounded-xl text-xl font-black text-white shadow"
          style={{ backgroundColor: post.primaryColor || '#10b981' }}
        >
          {post.category || 'گزارش مصور'}
        </span>
      }
    />

    <div className="p-8 rounded-3xl bg-neutral-950/90 backdrop-blur-xl border border-white/15 shadow-2xl space-y-6 mt-auto">
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
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      <SmartFooter post={post} />
    </div>
  </div>
);

// -------------------------------------------------------------
// TEMPLATE 8: Headline Hero Focus
// -------------------------------------------------------------
const HeadlineHeroTemplate: React.FC<{ post: NewsPost }> = ({ post }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 bg-gradient-to-t from-black via-black/80 to-transparent text-white">
    <SmartHeader 
      post={post}
      customBadge={
        <span 
          className="px-5 py-2 rounded-xl text-2xl font-black text-white shadow-xl"
          style={{ backgroundColor: post.primaryColor || '#f43f5e' }}
        >
          {post.category || 'خبر مهم'}
        </span>
      }
    />

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

    <SmartFooter post={post} />
  </div>
);

// -------------------------------------------------------------
// TEMPLATE 9: Key Takeaways Infographic
// -------------------------------------------------------------
const KeyTakeawaysTemplate: React.FC<{ post: NewsPost; titleClass: string }> = ({ post, titleClass }) => (
  <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 bg-neutral-950/90 text-white">
    <SmartHeader 
      post={post}
      customBadge={
        <div className="flex items-center gap-3">
          <span 
            className="px-4 py-2 rounded-xl text-xl font-bold text-white shadow"
            style={{ backgroundColor: post.primaryColor || '#14b8a6' }}
          >
            ۳ نکته کلیدی
          </span>
          <span className="text-xl text-white/70">{post.category}</span>
        </div>
      }
    />

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

    <SmartFooter post={post} />
  </div>
);

