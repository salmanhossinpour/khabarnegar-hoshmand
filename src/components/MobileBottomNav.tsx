import React from 'react';
import { 
  Sparkles, 
  Building2,
  LayoutTemplate, 
  Edit3, 
  Image as ImageIcon, 
  FolderArchive, 
  Download,
  Share2
} from 'lucide-react';

export type TabType = 'ai' | 'templates' | 'content' | 'agency' | 'media' | 'archive' | null;

interface MobileBottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenExport: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenExport,
}) => {
  const navItems = [
    {
      id: 'ai' as TabType,
      label: 'هوش مصنوعی',
      icon: Sparkles,
      color: 'text-red-400',
      activeBg: 'bg-red-500/20 text-red-400 border-red-500/40',
    },
    {
      id: 'agency' as TabType,
      label: 'لوگو و برند',
      icon: Building2,
      color: 'text-rose-400',
      activeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    },
    {
      id: 'templates' as TabType,
      label: 'قالب و استایل',
      icon: LayoutTemplate,
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    },
    {
      id: 'content' as TabType,
      label: 'متن خبر',
      icon: Edit3,
      color: 'text-blue-400',
      activeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    },
    {
      id: 'media' as TabType,
      label: 'عکس سیستم',
      icon: ImageIcon,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    },
    {
      id: 'archive' as TabType,
      label: 'آرشیو NeDB',
      icon: FolderArchive,
      color: 'text-violet-400',
      activeBg: 'bg-violet-500/20 text-violet-400 border-violet-500/40',
    },
  ];

  return (
    <nav 
      id="mobile-bottom-bar"
      className="fixed bottom-0 left-0 right-0 z-30 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/90 px-2 py-2 shadow-2xl safe-bottom"
    >
      <div className="max-w-lg mx-auto flex items-center justify-between gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(isActive ? null : item.id)}
              className={`flex-1 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? `${item.activeBg} border font-bold scale-[1.03]`
                  : 'text-neutral-400 hover:text-neutral-200 active:scale-95'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-neutral-400'}`} />
              <span className="text-[10px] tracking-tight leading-none whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}

        {/* Quick Export Button in Bottom Bar */}
        <button
          type="button"
          onClick={onOpenExport}
          title="دانلود عکس"
          className="p-2.5 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-lg shadow-red-950/50 flex flex-col items-center justify-center shrink-0 active:scale-95 transition-all mr-1"
        >
          <Download className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-0.5">دانلود</span>
        </button>
      </div>
    </nav>
  );
};
