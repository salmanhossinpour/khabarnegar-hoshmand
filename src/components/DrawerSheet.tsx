import React from 'react';
import { X, ChevronDown } from 'lucide-react';

interface DrawerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const DrawerSheet: React.FC<DrawerSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end md:justify-center md:items-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container (Bottom sheet on mobile, centered modal on desktop) */}
      <div 
        className="relative z-10 w-full md:max-w-2xl bg-neutral-900 border-t md:border border-neutral-800 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-[88vh] overflow-hidden animate-slideUp"
      >
        {/* Mobile Pull Drag Bar */}
        <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mt-3 mb-1 md:hidden" />

        {/* Drawer Header */}
        <div className="p-4 px-6 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/90 backdrop-blur">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center text-white shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              {subtitle && <p className="text-[11px] text-neutral-400">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="p-5 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
