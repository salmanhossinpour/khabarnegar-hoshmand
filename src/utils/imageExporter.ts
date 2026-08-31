import { toPng, toJpeg, toBlob } from 'html-to-image';
import html2canvas from 'html2canvas';

/**
 * Returns a CORS-safe URL for external images by routing them through our backend proxy
 */
export function getSafeImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/**
 * Fetches an image URL and converts it to a base64 Data URL to prevent any canvas tainting
 */
export async function urlToDataUrl(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  const safeUrl = getSafeImageUrl(url);
  try {
    const response = await fetch(safeUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Failed to convert image to Data URL, returning original:', err);
    return safeUrl;
  }
}

export interface ExportOptions {
  baseWidth: number;
  baseHeight: number;
  outputWidth: number;
  outputHeight: number;
  pixelRatio: number;
  format: 'png' | 'jpeg';
  quality?: number;
}

/**
 * Robust Multi-Engine Image Exporter with Automatic Fallbacks
 */
export async function exportElementToImage(
  targetElement: HTMLElement,
  options: ExportOptions
): Promise<string> {
  const { baseWidth, baseHeight, outputWidth, outputHeight, pixelRatio, format, quality = 0.95 } = options;

  // 1. Ensure fonts are fully loaded
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch (e) {
    // Non-blocking
  }

  // Pre-process any remote images inside the target element to avoid CORS blocks
  try {
    const images = targetElement.querySelectorAll('img');
    for (const img of Array.from(images)) {
      if (img.src && (img.src.startsWith('http://') || img.src.startsWith('https://'))) {
        img.crossOrigin = 'anonymous';
      }
    }
  } catch (e) {}

  const htmlToImageStyle = {
    transform: 'none',
    transformOrigin: 'top left',
    margin: '0',
    padding: '0',
    top: '0',
    left: '0',
    right: 'auto',
    bottom: 'auto',
    position: 'static',
    width: `${baseWidth}px`,
    height: `${baseHeight}px`,
  };

  // -------------------------------------------------------------
  // STRATEGY 1: html-to-image with skipFonts (Super sharp SVG/DOM rasterizer)
  // -------------------------------------------------------------
  try {
    const renderOptions = {
      width: baseWidth,
      height: baseHeight,
      canvasWidth: outputWidth,
      canvasHeight: outputHeight,
      pixelRatio: pixelRatio,
      quality: format === 'jpeg' ? quality : 1,
      skipFonts: true, // Prevents CORS crashes on external Google Fonts stylesheets
      cacheBust: false,
      style: htmlToImageStyle,
    };

    const dataUrl = format === 'png' 
      ? await toPng(targetElement, renderOptions)
      : await toJpeg(targetElement, renderOptions);

    if (dataUrl && dataUrl.length > 500) {
      return dataUrl;
    }
  } catch (errPrimary: any) {
    console.warn('html-to-image primary failed, switching to html2canvas fallback:', errPrimary?.message || errPrimary);
  }

  // -------------------------------------------------------------
  // STRATEGY 2: html2canvas (Direct Canvas 2D engine)
  // -------------------------------------------------------------
  try {
    const canvas = await html2canvas(targetElement, {
      width: baseWidth,
      height: baseHeight,
      scale: pixelRatio,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#09090b',
      logging: false,
      imageTimeout: 12000,
      onclone: (clonedDoc) => {
        const clonedRoot = clonedDoc.getElementById('news-canvas-root');
        if (clonedRoot) {
          clonedRoot.style.transform = 'none';
          clonedRoot.style.position = 'static';
          clonedRoot.style.margin = '0';
          clonedRoot.style.width = `${baseWidth}px`;
          clonedRoot.style.height = `${baseHeight}px`;
        }
      },
    });

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mimeType, quality);
    if (dataUrl && dataUrl.length > 500) {
      return dataUrl;
    }
  } catch (errSecondary: any) {
    console.warn('html2canvas fallback failed, attempting blob export:', errSecondary?.message || errSecondary);
  }

  // -------------------------------------------------------------
  // STRATEGY 3: html-to-image blob fallback
  // -------------------------------------------------------------
  try {
    const blob = await toBlob(targetElement, {
      width: baseWidth,
      height: baseHeight,
      pixelRatio: 1,
      skipFonts: true,
      style: htmlToImageStyle,
    });

    if (blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (errBlob: any) {
    console.error('All image export strategies failed:', errBlob);
  }

  throw new Error('سیستم نتوانست تصویر را رندر کند. لطفاً از اتصال اینترنت یا بارگذاری مجدد صفحه اطمینان حاصل فرمایید.');
}
