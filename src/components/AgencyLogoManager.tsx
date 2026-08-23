import React, { useState, useEffect, useRef } from 'react';
import { AgencyBrand, NewsPost, LogoBadgeShapeType, LogoPositionType, LogoSizeType } from '../types';
import { 
  Building2, 
  Upload, 
  Check, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Save, 
  Sliders, 
  Sparkles, 
  Star, 
  Tag, 
  AtSign, 
  LayoutGrid, 
  Layers, 
  Image as ImageIcon,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';

interface AgencyLogoManagerProps {
  post: NewsPost;
  onUpdatePost: (updatedFields: Partial<NewsPost>) => void;
  onClose?: () => void;
}

export const AgencyLogoManager: React.FC<AgencyLogoManagerProps> = ({
  post,
  onUpdatePost,
  onClose,
}) => {
  const [agencies, setAgencies] = useState<AgencyBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [isEditingNew, setIsEditingNew] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state for creating / editing an agency
  const [formName, setFormName] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formWatermark, setFormWatermark] = useState('');
  const [formSourceName, setFormSourceName] = useState('');
  const [formShape, setFormShape] = useState<LogoBadgeShapeType>('pill');
  const [formPosition, setFormPosition] = useState<LogoPositionType>('top-left');
  const [formSize, setFormSize] = useState<LogoSizeType>('md');
  const [formShowName, setFormShowName] = useState(true);
  const [formIsDefault, setFormIsDefault] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load agencies from NeDB backend
  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agencies');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAgencies(json.data);
        // Find if any matches current post
        const match = json.data.find((a: AgencyBrand) => a.logoUrl === post.agencyLogo || a.name === post.agencyName);
        if (match) {
          setActiveBrandId(match.id);
        } else if (json.data.length > 0 && !post.agencyLogo) {
          // Select default or first
          const def = json.data.find((a: AgencyBrand) => a.isDefault) || json.data[0];
          handleSwitchAgency(def);
        }
      }
    } catch (err) {
      console.error('Error fetching agencies from NeDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const handleSwitchAgency = (agency: AgencyBrand) => {
    setActiveBrandId(agency.id);
    onUpdatePost({
      agencyLogo: agency.logoUrl,
      agencyName: agency.name,
      watermarkText: agency.watermarkText || post.watermarkText,
      source: agency.sourceName || post.source,
      agencyBadgeShape: agency.badgeShape || 'pill',
      agencyPosition: agency.logoPosition || 'top-left',
      agencyLogoSize: agency.logoSize || 'md',
      showAgencyLogo: true,
      showAgencyName: agency.showAgencyName ?? true,
    });

    setSuccessMessage(`لوگوی رسانه «${agency.name}» فعال شد`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('لطفاً یک فایل تصویری (PNG، JPG، SVG، WEBP) انتخاب فرمایید.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFormLogoUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSaveAgencyToNeDB = async () => {
    if (!formName.trim()) {
      alert('لطفاً نام رسانه یا خبرگزاری را وارد فرمایید.');
      return;
    }
    if (!formLogoUrl.trim()) {
      alert('لطفاً یک تصویر برای لوگوی خبرگزاری بارگذاری یا انتخاب کنید.');
      return;
    }

    setSaving(true);
    try {
      const newAgency: Partial<AgencyBrand> = {
        name: formName.trim(),
        logoUrl: formLogoUrl,
        watermarkText: formWatermark.trim() || `@${formName.replace(/\s+/g, '_')}`,
        sourceName: formSourceName.trim() || formName.trim(),
        badgeShape: formShape,
        logoPosition: formPosition,
        logoSize: formSize,
        showAgencyName: formShowName,
        isDefault: formIsDefault,
      };

      const res = await fetch('/api/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgency),
      });
      const json = await res.json();
      if (json.success && json.data) {
        await fetchAgencies();
        handleSwitchAgency(json.data);
        setIsEditingNew(false);
        setSuccessMessage(`برند «${formName}» برای همیشه در دیتابیس NeDB ذخیره شد!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error saving agency to NeDB:', err);
      alert('خطا در ذخیره‌سازی لوگو در دیتابیس NeDB.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgency = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('آیا از حذف این لوگوی رسانه از دیتابیس NeDB اطمینان دارید؟')) return;

    try {
      const res = await fetch(`/api/agencies/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setAgencies((prev) => prev.filter((a) => a.id !== id));
        if (activeBrandId === id) {
          setActiveBrandId(null);
        }
      }
    } catch (err) {
      console.error('Error deleting agency from NeDB:', err);
    }
  };

  // Sample Logo Presets for Quick Selection
  const SAMPLE_LOGOS = [
    { name: 'پایگاه خبری طلایی', url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=200&h=200&q=80' },
    { name: 'فناوری و مدرن', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&h=200&q=80' },
    { name: 'اقتصادی و مالی', url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=200&h=200&q=80' },
    { name: 'رسانه ورزشی', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=200&h=200&q=80' },
  ];

  return (
    <div className="space-y-6 pb-6 text-neutral-100">
      {/* Toast Notification */}
      {successMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
              <span>مدیریت و سوییچ بین لوگوهای خبرگزاری</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h4>
            <p className="text-[11px] text-neutral-400">
              لوگوی اختصاصی خود را یک‌بار ثبت و برای همیشه در دیتابیس NeDB ذخیره کنید.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsEditingNew(!isEditingNew);
            setFormName('');
            setFormLogoUrl('');
            setFormWatermark('');
            setFormSourceName('');
          }}
          className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{isEditingNew ? 'بستن فرم' : 'افزودن لوگوی جدید'}</span>
        </button>
      </div>

      {/* Form: Add or Edit New Agency Logo */}
      {isEditingNew && (
        <div className="p-5 rounded-2xl bg-neutral-900 border border-red-500/40 space-y-4 animate-slideDown">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>ثبت لوگوی جدید رسانه شما (ذخیره دائمی در NeDB)</span>
            </span>
          </div>

          {/* Logo Upload Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              ۱. بارگذاری لوگو از گوشی یا کامپیوتر:
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-neutral-700 bg-neutral-950 hover:border-neutral-600'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              {formLogoUrl ? (
                <div className="flex items-center justify-center gap-3">
                  <img
                    src={formLogoUrl}
                    alt="پیش‌نمایش لوگو"
                    className="w-12 h-12 object-contain rounded-xl bg-white/10 p-1 border border-white/20"
                  />
                  <div className="text-right text-xs">
                    <span className="text-emerald-400 font-bold block">✓ لوگو انتخاب شد</span>
                    <span className="text-neutral-500 text-[10px]">برای تغییر کلیک کنید</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload className="w-6 h-6 text-red-400" />
                  <span className="text-xs font-bold text-neutral-200">
                    کلیک برای انتخاب فایل لوگو (PNG شفاف یا JPG)
                  </span>
                </div>
              )}
            </div>

            {/* Quick Preset Logos */}
            {!formLogoUrl && (
              <div className="pt-2">
                <div className="text-[11px] text-neutral-400 mb-1.5">یا انتخاب سریع لوگوهای نمونه:</div>
                <div className="grid grid-cols-4 gap-2">
                  {SAMPLE_LOGOS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormLogoUrl(sample.url)}
                      className="p-1.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-neutral-600 flex flex-col items-center gap-1 text-[10px] text-neutral-400"
                    >
                      <img src={sample.url} alt={sample.name} className="w-8 h-8 rounded-lg object-cover" />
                      <span className="truncate w-full text-center">{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Inputs: Name, Watermark, Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">نام رسانه یا خبرگزاری:</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="مثلا: خبرگزاری تسنیم، دیجیاتو، خبر فوری"
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-red-500 text-xs text-neutral-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">آیدی یا واترمارک کانال:</label>
              <input
                type="text"
                value={formWatermark}
                onChange={(e) => setFormWatermark(e.target.value)}
                placeholder="مثلا: @tasnim_news"
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-red-500 text-xs text-neutral-100 font-mono"
              />
            </div>
          </div>

          {/* Form: Logo Shape & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">کادر و فرم نمایش لوگو:</label>
              <select
                value={formShape}
                onChange={(e) => setFormShape(e.target.value as LogoBadgeShapeType)}
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100"
              >
                <option value="pill">کپسولی شیک همراه با نام (Pill)</option>
                <option value="circle">دایره‌ای نشان‌دار (Circle)</option>
                <option value="square">مربعی گرد مدرن (Square)</option>
                <option value="transparent">شفاف بدون کادر (Transparent)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">موقعیت قرارگیری در تصویر:</label>
              <select
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value as LogoPositionType)}
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100"
              >
                <option value="top-left">بالا سمت چپ (استاندارد)</option>
                <option value="top-right">بالا سمت راست</option>
                <option value="top-center">بالا وسط</option>
                <option value="bottom-left">پایین سمت چپ</option>
                <option value="bottom-right">پایین سمت راست</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveAgencyToNeDB}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>ذخیره دائمی لوگو در دیتابیس NeDB و اعمال روی خبر</span>
          </button>
        </div>
      )}

      {/* Saved Agency Logos List (Switchable Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>لوگوها و برندهای ذخیره شده (کلیک برای سوییچ آنی):</span>
          </label>
          <button
            type="button"
            onClick={fetchAgencies}
            disabled={loading}
            className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            در حال دریافت از دیتابیس NeDB...
          </div>
        ) : agencies.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-neutral-900/50 border border-neutral-800 text-xs text-neutral-400 space-y-2">
            <Building2 className="w-8 h-8 mx-auto text-neutral-600" />
            <div>هنوز لوگویی ذخیره نشده است. با دکمه «افزودن لوگوی جدید» اولین لوگوی خود را ثبت کنید!</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agencies.map((agency) => {
              const isSelected = activeBrandId === agency.id || post.agencyLogo === agency.logoUrl;
              return (
                <div
                  key={agency.id}
                  onClick={() => handleSwitchAgency(agency)}
                  className={`p-3.5 rounded-2xl border text-right cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-neutral-800 border-red-500/80 ring-2 ring-red-500/30 scale-[1.01]'
                      : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      <img
                        src={agency.logoUrl}
                        alt={agency.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          {agency.name}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            فعال
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {agency.watermarkText || agency.sourceName}
                      </div>
                      <div className="text-[10px] text-neutral-500 flex items-center gap-2">
                        <span>فرم: {agency.badgeShape === 'pill' ? 'کپسولی' : agency.badgeShape === 'circle' ? 'دایره' : agency.badgeShape === 'transparent' ? 'شفاف' : 'مربع'}</span>
                        <span>•</span>
                        <span>{agency.logoPosition === 'top-left' ? 'بالا چپ' : agency.logoPosition === 'top-right' ? 'بالا راست' : 'پایین'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteAgency(agency.id, e)}
                      className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="حذف از دیتابیس NeDB"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Canvas Placement & Style Adjustments */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>تنظیمات ظاهر و جایگاه لوگوی فعال در تصویر:</span>
          </span>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
            <input
              type="checkbox"
              checked={post.showAgencyLogo !== false}
              onChange={(e) => onUpdatePost({ showAgencyLogo: e.target.checked })}
              className="accent-red-500 rounded"
            />
            <span>نمایش لوگو در پست</span>
          </label>
        </div>

        {/* Shape & Position Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-neutral-400">کادر و فرمت نمایش:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'pill' as LogoBadgeShapeType, label: 'کپسولی' },
                { id: 'circle' as LogoBadgeShapeType, label: 'دایره‌ای' },
                { id: 'square' as LogoBadgeShapeType, label: 'مربعی' },
                { id: 'transparent' as LogoBadgeShapeType, label: 'شفاف' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onUpdatePost({ agencyBadgeShape: s.id })}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                    (post.agencyBadgeShape || 'pill') === s.id
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-neutral-400">محل قرارگیری:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'top-left' as LogoPositionType, label: 'بالا چپ' },
                { id: 'top-right' as LogoPositionType, label: 'بالا راست' },
                { id: 'bottom-left' as LogoPositionType, label: 'پایین چپ' },
                { id: 'bottom-right' as LogoPositionType, label: 'پایین راست' },
              ].map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => onUpdatePost({ agencyPosition: pos.id })}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                    (post.agencyPosition || 'top-left') === pos.id
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-neutral-400">اندازه لوگو:</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'sm' as LogoSizeType, label: 'کوچک' },
                { id: 'md' as LogoSizeType, label: 'متوسط' },
                { id: 'lg' as LogoSizeType, label: 'بزرگ' },
              ].map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => onUpdatePost({ agencyLogoSize: sz.id })}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                    (post.agencyLogoSize || 'md') === sz.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-neutral-300">
                <input
                  type="checkbox"
                  checked={post.showAgencyName !== false}
                  onChange={(e) => onUpdatePost({ showAgencyName: e.target.checked })}
                  className="accent-red-500 rounded"
                />
                <span>نمایش نام خبرگزاری کنار لوگو</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
