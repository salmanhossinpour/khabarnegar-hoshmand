import React from 'react';
import { PRESET_TEMPLATES, COLOR_PALETTES } from '../data/presets';
import { NewsPost, TemplateId, AspectRatioType, FontFamilyType } from '../types';
import { 
  Palette, 
  Type, 
  LayoutTemplate, 
  Smartphone, 
  Square, 
  Monitor, 
  Image as ImageIcon,
  Sliders,
  Check
} from 'lucide-react';

interface TemplatePickerProps {
  post: NewsPost;
  onChange: (updatedFields: Partial<NewsPost>) => void;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({ post, onChange }) => {
  const aspectRatios: { id: AspectRatioType; label: string; sub: string; icon: any }[] = [
    { id: '1:1', label: 'پست مربع', sub: '۱۰۸۰ × ۱۰۸۰', icon: Square },
    { id: '9:16', label: 'استوری کامل', sub: '۱۰۸۰ × ۱۹۲۰', icon: Smartphone },
    { id: '4:5', label: 'پرتره اینستا', sub: '۱۰۸۰ × ۱۳۵۰', icon: LayoutTemplate },
    { id: '16:9', label: 'افقی و وب', sub: '۱۹۲۰ × ۱۰۸۰', icon: Monitor },
  ];

  const fonts: { id: FontFamilyType; label: string; sample: string; css: string }[] = [
    { id: 'vazir', label: 'وزیرمتن (استاندارد رسانه‌ای)', sample: 'خبر فوری و گزارش ویژه', css: 'font-vazir' },
    { id: 'lalezar', label: 'لاله‌زار (تیتر بولد و مهیج)', sample: 'خبرگزاری آنلاین', css: 'font-lalezar' },
    { id: 'rubik', label: 'روبیک (مدرن و تمیز)', sample: 'رویداد فناوری روز', css: 'font-rubik' },
    { id: 'naskh', label: 'نسخ رسمی (ژورنالی)', sample: 'بیانیه و گزارش رسمی', css: 'font-naskh' },
    { id: 'system', label: 'فونت سیستمی', sample: 'ساده و بی‌آلایش', css: 'font-system' },
  ];

  return (
    <div className="space-y-6 pb-6 text-neutral-100">
      {/* Aspect Ratio Selector */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-red-400" />
          <span>ابعاد و سایز خروجی:</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {aspectRatios.map((item) => {
            const Icon = item.icon;
            const isSelected = post.aspectRatio === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange({ aspectRatio: item.id })}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  isSelected
                    ? 'bg-red-500/15 border-red-500 text-white shadow-md'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-red-400' : 'text-neutral-500'}`} />
                <span className="text-xs font-bold">{item.label}</span>
                <span className="text-[10px] text-neutral-500 font-mono">{item.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Chooser Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-amber-400" />
            <span>انتخاب قالب خبری (مینیمال و متنوع):</span>
          </label>
          <span className="text-xs text-neutral-500">{PRESET_TEMPLATES.length} قالب آماده</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PRESET_TEMPLATES.map((tmpl) => {
            const isSelected = post.templateId === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onChange({ 
                  templateId: tmpl.id,
                  primaryColor: post.primaryColor || tmpl.defaultPrimaryColor
                })}
                className={`p-3 rounded-2xl border text-right transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-neutral-800 border-amber-500 ring-1 ring-amber-500/50 shadow-lg'
                    : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-neutral-200'}`}>
                    {tmpl.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-medium">
                    {tmpl.badge}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">
                  {tmpl.description}
                </p>

                {/* Bottom accent indicator */}
                <div 
                  className={`h-1 w-full mt-2.5 rounded-full bg-gradient-to-r ${tmpl.previewGradient} transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-40 group-hover:opacity-80'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Persian Font Family & Title Size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Font Family */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
            <Type className="w-4 h-4 text-blue-400" />
            <span>فونت تیتر و متن:</span>
          </label>
          <div className="space-y-1.5">
            {fonts.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ fontFamily: f.id })}
                className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                  post.fontFamily === f.id
                    ? 'bg-neutral-800 border-blue-500 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">{f.label}</div>
                  <div className={`text-sm text-neutral-300 mt-0.5 ${f.css}`}>
                    {f.sample}
                  </div>
                </div>
                {post.fontFamily === f.id && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Title Size & Controls */}
        <div className="space-y-4">
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>اندازه سایز تیتر:</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'sm', label: 'کوچک' },
                { id: 'md', label: 'متوسط' },
                { id: 'lg', label: 'بزرگ' },
                { id: 'xl', label: 'خیلی بزرگ' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChange({ titleSize: s.id as any })}
                  className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    post.titleSize === s.id
                      ? 'bg-neutral-800 border-emerald-500 text-white'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Presets */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
              <Palette className="w-4 h-4 text-violet-400" />
              <span>رنگ اصلی تم و های‌لایت:</span>
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.color}
                  type="button"
                  title={palette.name}
                  onClick={() => onChange({ primaryColor: palette.color })}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                    post.primaryColor === palette.color
                      ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-neutral-950 shadow-md'
                      : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: palette.color }}
                >
                  {post.primaryColor === palette.color && (
                    <Check className="w-3.5 h-3.5 text-black drop-shadow" />
                  )}
                </button>
              ))}
              <input
                type="color"
                value={post.primaryColor || '#ef4444'}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                title="انتخاب رنگ سفارشی"
              />
            </div>
          </div>

          {/* Watermark Toggle */}
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300">نمایش آیدی و واترمارک:</span>
              <input
                type="checkbox"
                checked={post.showWatermark}
                onChange={(e) => onChange({ showWatermark: e.target.checked })}
                className="w-4 h-4 accent-red-500 rounded cursor-pointer"
              />
            </div>
            {post.showWatermark && (
              <input
                type="text"
                value={post.watermarkText}
                onChange={(e) => onChange({ watermarkText: e.target.value })}
                placeholder="@Channel_ID"
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:border-red-500"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
