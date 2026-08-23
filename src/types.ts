export type AspectRatioType = '1:1' | '9:16' | '4:5' | '16:9';

export type TemplateId = 
  | 'breaking-alert'
  | 'editorial-minimal'
  | 'dark-glass'
  | 'social-feed'
  | 'broadcast-tv'
  | 'quote-statement'
  | 'split-photo'
  | 'headline-hero'
  | 'key-takeaways';

export type FontFamilyType = 'vazir' | 'lalezar' | 'rubik' | 'naskh' | 'system';

export type BadgeStyleType = 'solid' | 'pill' | 'outline' | 'tag';

export type LogoPositionType = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left';
export type LogoBadgeShapeType = 'circle' | 'square' | 'transparent' | 'pill';
export type LogoSizeType = 'sm' | 'md' | 'lg';

export interface AgencyBrand {
  _id?: string;
  id: string;
  name: string;             // نام رسانه یا خبرگزاری (مثلا: خبرگزاری تسنیم، دیجیاتو، کانال خبر فوری)
  logoUrl: string;          // تصویر یا لوگوی رسانه (Data URL یا آدرس تصویر)
  watermarkText: string;    // آیدی کانال یا واترمارک (مثلا: @Khabar_Fouri)
  sourceName: string;       // نام رسمی منبع (مثلا: خبرگزاری خبرآنلاین)
  badgeShape: LogoBadgeShapeType;
  logoPosition: LogoPositionType;
  logoSize: LogoSizeType;
  showAgencyName: boolean;
  brandColor?: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NewsPost {
  _id?: string;
  id: string;
  title: string;             // تیتر اصلی
  kicker: string;            // روتیتر (مثلا: تحولات منطقه، گزارش اختصاصی، فوری)
  lead: string;              // خلاصه و لید خبر
  body?: string;             // متن اصلی یا توضیحات بیشتر
  fullArticle?: string;      // متن کامل، تحلیلی و جامع خبر (غیرقابل تشخیص از هوش مصنوعی)
  keyPoints: string[];       // ۳ الی ۴ نکته کلیدی
  quote?: {
    text: string;
    author: string;
    role?: string;
  };
  category: string;          // دسته‌بندی (سیاسی، اقتصادی، فناوری، ورزشی، حوادث، فرهنگ)
  source: string;            // منبع خبر (مثلا: خبرگزاری، رویترز، اختصاصی)
  date: string;              // تاریخ و ساعت
  readTime: string;          // زمان مطالعه تقریبی
  aspectRatio: AspectRatioType;
  templateId: TemplateId;
  bgImage: string;           // تصویر اصلی یا پس‌زمینه
  secondaryImage?: string;   // تصویر دوم (اختیاری)
  bgOverlayColor: string;    // رنگ پوشش (hex)
  bgOverlayOpacity: number;  // 0 to 100
  bgBlur: number;            // 0 to 20 px
  fontFamily: FontFamilyType;
  titleSize: 'sm' | 'md' | 'lg' | 'xl';
  primaryColor: string;      // رنگ اصلی تم (قرمز، آبی، زرد، بنفش، ...)
  accentColor: string;       // رنگ های‌لایت
  textColor: string;         // رنگ متن اصلی
  showWatermark: boolean;
  watermarkText: string;     // @کانال_شما
  badgeStyle: BadgeStyleType;
  // Agency & Logo Branding properties
  agencyLogo?: string;
  agencyName?: string;
  agencyPosition?: LogoPositionType;
  agencyBadgeShape?: LogoBadgeShapeType;
  agencyLogoSize?: LogoSizeType;
  showAgencyLogo?: boolean;
  showAgencyName?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type AIProviderType = 'gemini' | 'mistral' | 'openrouter';

export interface AIProviderOption {
  id: AIProviderType;
  name: string;
  badge: string;
  defaultModel: string;
  description: string;
}

export interface AIGenerateRequest {
  rawText: string;
  category?: string;
  tone?: 'formal' | 'breaking' | 'bullet' | 'magazine' | 'storytelling' | 'clickbait';
  aspectRatio?: AspectRatioType;
  provider?: AIProviderType;
  model?: string;
  apiKey?: string;
  humanize?: boolean; // نگارش فوق طبیعی و غیرقابل تشخیص هوش مصنوعی
}

export interface AIGenerateResponse {
  title: string;
  kicker: string;
  lead: string;
  fullArticle: string;       // متن خبر کامل و حرفه‌ای فارسی برای کپی و انتشار
  keyPoints: string[];
  category: string;
  source: string;
  suggestedPrimaryColor: string;
  suggestedTemplate: TemplateId;
  quote?: {
    text: string;
    author: string;
    role?: string;
  };
  imageKeywordsPrompt?: string;
}


export interface PresetTemplate {
  id: TemplateId;
  name: string;
  description: string;
  badge: string;
  previewGradient: string;
  defaultPrimaryColor: string;
}
