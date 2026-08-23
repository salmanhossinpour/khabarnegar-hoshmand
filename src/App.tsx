import React, { useState, useRef, useEffect } from 'react';
import { NewsPost, AspectRatioType } from './types';
import { INITIAL_NEWS_POST } from './data/presets';
import { NewsCanvas } from './components/NewsCanvas';
import { MobileBottomNav, TabType } from './components/MobileBottomNav';
import { DrawerSheet } from './components/DrawerSheet';
import { AIDrawer } from './components/AIDrawer';
import { TemplatePicker } from './components/TemplatePicker';
import { ContentEditor } from './components/ContentEditor';
import { MediaEditor } from './components/MediaEditor';
import { AgencyLogoManager } from './components/AgencyLogoManager';
import { ArchiveDrawer } from './components/ArchiveDrawer';
import { ExportModal } from './components/ExportModal';
import { 
  Sparkles, 
  Building2,
  LayoutTemplate, 
  Edit3, 
  Image as ImageIcon, 
  FolderArchive, 
  Download, 
  Save, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Smartphone,
  Square,
  RefreshCw,
  Database,
  Share2,
  HelpCircle,
  Undo2
} from 'lucide-react';

export default function App() {
  const [post, setPost] = useState<NewsPost>(INITIAL_NEWS_POST);
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [zoomManual, setZoomManual] = useState<number | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto calculate scale for canvas fit
  const [autoScale, setAutoScale] = useState<number>(0.35);

  const updateScale = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    let targetWidth = 1080;
    let targetHeight = 1080;
    if (post.aspectRatio === '9:16') {
      targetWidth = 1080;
      targetHeight = 1920;
    } else if (post.aspectRatio === '4:5') {
      targetWidth = 1080;
      targetHeight = 1350;
    } else if (post.aspectRatio === '16:9') {
      targetWidth = 1920;
      targetHeight = 1080;
    }

    const padding = 32;
    const availableWidth = Math.max(containerWidth - padding, 280);
    const availableHeight = Math.max(containerHeight - padding, 320);

    const scaleW = availableWidth / targetWidth;
    const scaleH = availableHeight / targetHeight;

    const fitScale = Math.min(scaleW, scaleH, 0.65);
    setAutoScale(Math.max(fitScale, 0.18));
  };

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [post.aspectRatio]);

  const currentScale = zoomManual ?? autoScale;

  const handleUpdatePost = (updatedFields: Partial<NewsPost>) => {
    setPost((prev) => ({
      ...prev,
      ...updatedFields,
      updatedAt: Date.now(),
    }));
  };

  const handleSaveToNeDB = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
      const json = await res.json();
      if (json.success) {
        setSaveToast('پست با موفقیت در دیتابیس NeDB ذخیره شد!');
        setTimeout(() => setSaveToast(null), 3000);
      }
    } catch (err) {
      console.error('Error saving post to NeDB:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between overflow-x-hidden pb-20 md:pb-6 select-none font-vazir">
      {/* Top Header Bar */}
      <header className="h-16 px-4 md:px-6 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between sticky top-0 z-30 shrink-0">
        {/* App Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm md:text-base text-white leading-tight">
              خبرنگار هوشمند
            </h1>
            <p className="text-[10px] text-neutral-400 hidden sm:block">
              ساخت آسان پست و استوری خبری با هوش مصنوعی و دیتابیس NeDB
            </p>
          </div>
        </div>

        {/* Quick Aspect Ratio Switcher Pills */}
        <div className="hidden md:flex items-center gap-1 bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
          {(['1:1', '9:16', '4:5', '16:9'] as AspectRatioType[]).map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => handleUpdatePost({ aspectRatio: ratio })}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                post.aspectRatio === ratio
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {ratio === '1:1' ? 'پست مربع (1:1)' : ratio === '9:16' ? 'استوری (9:16)' : ratio === '4:5' ? 'پرتره (4:5)' : 'افقی (16:9)'}
            </button>
          ))}
        </div>

        {/* Top Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Quick AI Trigger */}
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 text-xs font-bold transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>هوش مصنوعی</span>
          </button>

          {/* Quick Save to NeDB */}
          <button
            type="button"
            onClick={handleSaveToNeDB}
            disabled={saving}
            title="ذخیره در NeDB"
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-emerald-400 border border-neutral-700 transition-colors"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-950/40 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>خروجی و دانلود</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Desktop Left Action Sidebar (Tools Navigation) */}
        <aside className="hidden lg:flex flex-col w-72 bg-neutral-900/60 border-l border-neutral-800 p-4 space-y-3 shrink-0 overflow-y-auto">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2">
            ابزارهای ساخت و ویرایش
          </div>

          {[
            { id: 'ai' as TabType, label: 'تولید با هوش مصنوعی', icon: Sparkles, color: 'text-red-400', desc: 'تبدیل متن ساده به خبر آماده' },
            { id: 'agency' as TabType, label: 'لوگو و برند خبرگزاری', icon: Building2, color: 'text-rose-400', desc: 'ثبت، سوییچ و ذخیره لوگو در NeDB' },
            { id: 'templates' as TabType, label: 'قالب‌ها و استایل‌ها', icon: LayoutTemplate, color: 'text-amber-400', desc: 'انتخاب از ۹ قالب مینیمال' },
            { id: 'content' as TabType, label: 'ویرایش متن و تیتر', icon: Edit3, color: 'text-blue-400', desc: 'تیتر، لید، روتیتر و نکات' },
            { id: 'media' as TabType, label: 'عکس از سیستم کاربر', icon: ImageIcon, color: 'text-emerald-400', desc: 'بارگذاری عکس و تنظیم بلر' },
            { id: 'archive' as TabType, label: 'آرشیو دیتابیس NeDB', icon: FolderArchive, color: 'text-violet-400', desc: 'مشاهده و لود اخبار ذخیره شده' },
          ].map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTab(isActive ? null : tool.id)}
                className={`p-3 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                  isActive
                    ? 'bg-neutral-800 border-neutral-600 shadow-md ring-1 ring-white/10'
                    : 'bg-neutral-900/90 border-neutral-800/80 hover:bg-neutral-800/60 hover:border-neutral-700'
                }`}
              >
                <div className={`p-2 rounded-xl bg-neutral-950/80 ${tool.color} shrink-0 mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-100">{tool.label}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{tool.desc}</div>
                </div>
              </button>
            );
          })}

          {/* Quick Info Tip */}
          <div className="mt-auto p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-[11px] text-neutral-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-300 font-bold">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>پایگاه داده NeDB فعال</span>
            </div>
            <p className="leading-relaxed">
              تمام اخبار و تنظیمات به صورت امن در سرور NeDB ذخیره می‌شوند.
            </p>
          </div>
        </aside>

        {/* Central Canvas Viewport */}
        <div 
          ref={containerRef}
          className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative bg-dot-pattern overflow-hidden min-h-[480px]"
        >
          {/* Zoom & Fit Toolbar Overlay */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-800 shadow-xl">
            <button
              type="button"
              onClick={() => setZoomManual((prev) => Math.max((prev ?? autoScale) - 0.05, 0.15))}
              className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="کوچک‌نمایی"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-neutral-300 px-1">
              {Math.round(currentScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomManual((prev) => Math.min((prev ?? autoScale) + 0.05, 0.9))}
              className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="بزرگ‌نمایی"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-neutral-800 mx-0.5" />
            <button
              type="button"
              onClick={() => {
                setZoomManual(null);
                updateScale();
              }}
              className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="تنظیم خودکار با صفحه (Fit)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Aspect Ratio Selector (Mobile view) */}
          <div className="md:hidden absolute top-4 left-4 z-20 flex items-center gap-1 bg-neutral-900/90 backdrop-blur p-1 rounded-2xl border border-neutral-800">
            {(['1:1', '9:16', '4:5'] as AspectRatioType[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleUpdatePost({ aspectRatio: r })}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                  post.aspectRatio === r ? 'bg-red-500 text-white' : 'text-neutral-400'
                }`}
              >
                {r === '1:1' ? 'پست' : r === '9:16' ? 'استوری' : 'پرتره'}
              </button>
            ))}
          </div>

          {/* Live Canvas Component */}
          <NewsCanvas
            ref={canvasRef}
            post={post}
            scale={currentScale}
            interactive={true}
            onEditField={(field, val) => handleUpdatePost({ [field]: val })}
          />
        </div>
      </main>

      {/* Drawer Sheets (Collapsible Sliding Drawers for both Mobile and Desktop) */}
      <DrawerSheet
        isOpen={activeTab === 'ai'}
        onClose={() => setActiveTab(null)}
        title="تولید هوشمند خبر با هوش مصنوعی"
        subtitle="متن ساده را بدهید و خبر ساختاریافته تحویل بگیرید"
        icon={<Sparkles className="w-5 h-5 text-red-400" />}
      >
        <AIDrawer
          currentPost={post}
          onApplyPost={handleUpdatePost}
          onClose={() => setActiveTab(null)}
        />
      </DrawerSheet>

      <DrawerSheet
        isOpen={activeTab === 'agency'}
        onClose={() => setActiveTab(null)}
        title="لوگو و برند خبرگزاری (ذخیره دائمی NeDB)"
        subtitle="بارگذاری لوگوی اختصاصی، سوییچ بین خبرگزاری‌ها و تنظیمات کادر"
        icon={<Building2 className="w-5 h-5 text-rose-400" />}
      >
        <AgencyLogoManager
          post={post}
          onUpdatePost={handleUpdatePost}
          onClose={() => setActiveTab(null)}
        />
      </DrawerSheet>

      <DrawerSheet
        isOpen={activeTab === 'templates'}
        onClose={() => setActiveTab(null)}
        title="قالب‌ها و استایل‌های خبری"
        subtitle="تغییر قالب، فونت فارسی، پالت رنگ و ابعاد"
        icon={<LayoutTemplate className="w-5 h-5 text-amber-400" />}
      >
        <TemplatePicker post={post} onChange={handleUpdatePost} />
      </DrawerSheet>

      <DrawerSheet
        isOpen={activeTab === 'content'}
        onClose={() => setActiveTab(null)}
        title="ویرایشگر محتوا و متن خبر"
        subtitle="ویرایش مستقیم تیتر، روتیتر، لید و نکات کلیدی"
        icon={<Edit3 className="w-5 h-5 text-blue-400" />}
      >
        <ContentEditor post={post} onChange={handleUpdatePost} />
      </DrawerSheet>

      <DrawerSheet
        isOpen={activeTab === 'media'}
        onClose={() => setActiveTab(null)}
        title="تصویر و پس‌زمینه از سیستم"
        subtitle="بارگذاری عکس از سیستم شما یا گالری گوشی"
        icon={<ImageIcon className="w-5 h-5 text-emerald-400" />}
      >
        <MediaEditor post={post} onChange={handleUpdatePost} />
      </DrawerSheet>

      <DrawerSheet
        isOpen={activeTab === 'archive'}
        onClose={() => setActiveTab(null)}
        title="آرشیو اخبار ذخیره‌شده (NeDB)"
        subtitle="مدیریت و بارگذاری پست‌های ذخیره شده در دیتابیس NeDB"
        icon={<FolderArchive className="w-5 h-5 text-violet-400" />}
      >
        <ArchiveDrawer
          currentPost={post}
          onLoadPost={(loadedPost) => {
            setPost(loadedPost);
            setActiveTab(null);
            setSaveToast(`خبر «${loadedPost.title.substring(0, 25)}...» لود شد`);
            setTimeout(() => setSaveToast(null), 2500);
          }}
          onSaveCurrent={handleSaveToNeDB}
          saving={saving}
        />
      </DrawerSheet>

      {/* Export Modal */}
      <ExportModal
        post={post}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        canvasRef={canvasRef}
        onUpdatePost={handleUpdatePost}
      />

      {/* Persistent Mobile Bottom Navigation Bar ("توی گوشی همیشه باتوم بار داشته باشه") */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-neutral-900/95 border border-emerald-500/80 text-emerald-400 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <Database className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}
    </div>
  );
}
