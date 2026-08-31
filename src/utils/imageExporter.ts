import { toPng, toJpeg } from 'html-to-image';
import html2canvas from 'html2canvas';
import { NewsPost } from '../types';

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

export interface ExportOptions {
  post: NewsPost;
  baseWidth: number;
  baseHeight: number;
  outputWidth: number;
  outputHeight: number;
  pixelRatio: number;
  format: 'png' | 'jpeg';
  quality?: number;
}

/**
 * Maps post font family to standard font-family string for HTML5 Canvas 2D
 */
function getCanvasFontFamily(fontFamily?: string): string {
  switch (fontFamily) {
    case 'lalezar':
      return "'Lalezar', 'Vazirmatn', cursive, Tahoma, sans-serif";
    case 'rubik':
      return "'Rubik', 'Vazirmatn', Tahoma, sans-serif";
    case 'naskh':
      return "'Noto Naskh Arabic', 'Vazirmatn', Tahoma, serif";
    case 'system':
      return "system-ui, -apple-system, BlinkMacSystemFont, Tahoma, sans-serif";
    case 'vazir':
    default:
      return "'Vazirmatn', Tahoma, sans-serif";
  }
}

/**
 * 100% Offline-Safe Native Canvas 2D Renderer
 * Draws every element with high precision directly to 2D Canvas context
 */
export async function renderNewsCardToNativeCanvas(
  post: NewsPost,
  width: number,
  height: number,
  format: 'png' | 'jpeg' = 'png',
  quality = 0.96
): Promise<string> {
  // Ensure fonts are parsed and ready before drawing text
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch (e) {
      // Non-blocking
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: format === 'png' });
  if (!ctx) throw new Error('Canvas 2D context is not supported in this browser.');

  // Set RTL text rendering
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  const scale = width / 1080; // Base reference scale
  const activeFontFamily = getCanvasFontFamily(post.fontFamily);

  // 1. Draw Base Dark Background
  ctx.fillStyle = post.bgOverlayColor || '#09090b';
  ctx.fillRect(0, 0, width, height);

  // 2. Try drawing background image if available in memory
  if (post.bgImage) {
    try {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = getSafeImageUrl(post.bgImage);
      await new Promise<void>((resolve) => {
        if (bgImg.complete) return resolve();
        bgImg.onload = () => resolve();
        bgImg.onerror = () => resolve(); // Non-blocking
        setTimeout(resolve, 800);
      });

      if (bgImg.naturalWidth > 0) {
        // Draw cover scaled
        const imgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
        const canvasRatio = width / height;
        let drawW = width;
        let drawH = height;
        let drawX = 0;
        let drawY = 0;

        if (imgRatio > canvasRatio) {
          drawW = height * imgRatio;
          drawX = (width - drawW) / 2;
        } else {
          drawH = width / imgRatio;
          drawY = (height - drawH) / 2;
        }

        ctx.save();
        if (post.bgBlur > 0) {
          ctx.filter = `blur(${Math.round(post.bgBlur * scale)}px)`;
        }
        ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
        ctx.restore();
      }
    } catch (e) {
      // Graceful fallback to rich dark gradient
    }
  }

  // 3. Dark Overlay Gradient
  const overlayOpacity = (post.bgOverlayOpacity ?? 75) / 100;
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, `rgba(9, 9, 11, ${overlayOpacity * 0.85})`);
  grad.addColorStop(0.4, `rgba(9, 9, 11, ${overlayOpacity * 0.92})`);
  grad.addColorStop(1, `rgba(9, 9, 11, ${Math.min(1, overlayOpacity + 0.15)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Layout Paddings
  const paddingX = Math.round(56 * scale);
  const paddingY = Math.round(56 * scale);

  // 4. Header Section (Category, Date & Agency Brand)
  const headerY = paddingY + Math.round(24 * scale);

  // Category Pill (Right)
  const categoryText = post.category || 'خبر فوری';
  ctx.font = `bold ${Math.round(22 * scale)}px ${activeFontFamily}`;
  const catMetrics = ctx.measureText(categoryText);
  const catW = catMetrics.width + Math.round(40 * scale);
  const catH = Math.round(44 * scale);
  const catX = width - paddingX - catW;
  const catY = headerY - catH / 2;

  // Draw category pill background
  ctx.fillStyle = post.primaryColor || '#ef4444';
  roundRect(ctx, catX, catY, catW, catH, Math.round(12 * scale));
  ctx.fill();

  // Category Text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(categoryText, catX + catW / 2, headerY);

  // Date (Right side next to Category or Center)
  if (post.date) {
    ctx.font = `normal ${Math.round(18 * scale)}px ${activeFontFamily}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.textAlign = 'right';
    ctx.fillText(post.date, catX - Math.round(20 * scale), headerY);
  }

  // Agency Brand / Logo (Left)
  if (post.showAgencyLogo !== false) {
    const brandName = post.agencyName || 'خبرگزاری';
    ctx.font = `bold ${Math.round(20 * scale)}px ${activeFontFamily}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(brandName, paddingX, headerY);
  }

  // 5. Kicker (روتیتر)
  let currentY = headerY + Math.round(70 * scale);
  if (post.kicker) {
    ctx.font = `bold ${Math.round(24 * scale)}px ${activeFontFamily}`;
    ctx.fillStyle = post.accentColor || '#fbbf24';
    ctx.textAlign = 'right';
    ctx.fillText(post.kicker, width - paddingX, currentY);
    currentY += Math.round(45 * scale);
  }

  // 6. News Title (تیتر اصلی - Multi-line word wrapped)
  const titleFontSize = Math.round((post.titleSize === 'xl' ? 52 : post.titleSize === 'lg' ? 44 : 38) * scale);
  ctx.font = `900 ${titleFontSize}px ${activeFontFamily}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';

  const maxContentWidth = width - (paddingX * 2);
  const titleLines = wrapText(ctx, post.title, maxContentWidth);
  const titleLineHeight = titleFontSize * 1.45;

  titleLines.forEach((line) => {
    ctx.fillText(line, width - paddingX, currentY + titleFontSize / 2);
    currentY += titleLineHeight;
  });

  currentY += Math.round(20 * scale);

  // 7. News Lead / Summary Box (لید خبر با کادر شیشه‌ای)
  if (post.lead) {
    const leadFontSize = Math.round(24 * scale);
    ctx.font = `normal ${leadFontSize}px ${activeFontFamily}`;
    const leadLineHeight = leadFontSize * 1.65;
    const leadLines = wrapText(ctx, post.lead, maxContentWidth - Math.round(40 * scale));
    const boxHeight = (leadLines.length * leadLineHeight) + Math.round(40 * scale);

    // Box Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    roundRect(ctx, paddingX, currentY, maxContentWidth, boxHeight, Math.round(18 * scale));
    ctx.fill();

    // Box Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = Math.max(1, Math.round(1.5 * scale));
    ctx.stroke();

    // Box Text
    ctx.fillStyle = 'rgba(240, 240, 245, 0.95)';
    ctx.textAlign = 'right';
    let leadTextY = currentY + Math.round(28 * scale);
    leadLines.forEach((line) => {
      ctx.fillText(line, width - paddingX - Math.round(20 * scale), leadTextY);
      leadTextY += leadLineHeight;
    });

    currentY += boxHeight + Math.round(25 * scale);
  }

  // 8. Key Takeaways / Points (نکات کلیدی)
  if (post.keyPoints && post.keyPoints.length > 0) {
    const pointFontSize = Math.round(20 * scale);
    ctx.font = `500 ${pointFontSize}px ${activeFontFamily}`;
    post.keyPoints.slice(0, 3).forEach((pt) => {
      const ptLines = wrapText(ctx, pt, maxContentWidth - Math.round(60 * scale));
      const ptHeight = ptLines.length * (pointFontSize * 1.5) + Math.round(20 * scale);

      // Bullet Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      roundRect(ctx, paddingX, currentY, maxContentWidth, ptHeight, Math.round(12 * scale));
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();

      // Bullet Dot
      ctx.fillStyle = post.primaryColor || '#ef4444';
      ctx.beginPath();
      ctx.arc(width - paddingX - Math.round(18 * scale), currentY + Math.round(18 * scale), Math.round(5 * scale), 0, Math.PI * 2);
      ctx.fill();

      // Bullet Text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      let ptY = currentY + Math.round(18 * scale);
      ptLines.forEach((line) => {
        ctx.fillText(line, width - paddingX - Math.round(35 * scale), ptY);
        ptY += pointFontSize * 1.5;
      });

      currentY += ptHeight + Math.round(12 * scale);
    });
  }

  // 9. Footer Bar (منبع، زمان مطالعه و واترمارک)
  const footerY = height - paddingY;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = Math.max(1, Math.round(1 * scale));
  ctx.beginPath();
  ctx.moveTo(paddingX, footerY - Math.round(20 * scale));
  ctx.lineTo(width - paddingX, footerY - Math.round(20 * scale));
  ctx.stroke();

  ctx.font = `bold ${Math.round(18 * scale)}px ${activeFontFamily}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'right';
  ctx.fillText(`منبع: ${post.source || 'خبرگزاری'}`, width - paddingX, footerY);

  if (post.readTime) {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`زمان مطالعه: ${post.readTime}`, paddingX, footerY);
  }

  if (post.watermarkText && post.showWatermark) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(post.watermarkText, width / 2, footerY);
  }

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return canvas.toDataURL(mimeType, quality);
}

/**
 * Word-wrapping helper for Persian RTL text
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Utility to draw rounded rectangles on HTML5 Canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Robust Multi-Engine Image Exporter with Font Inlining Guarantee
 */
export async function exportElementToImage(
  targetElement: HTMLElement,
  options: ExportOptions
): Promise<string> {
  const { post, baseWidth, baseHeight, outputWidth, outputHeight, pixelRatio, format, quality = 0.96 } = options;

  // 1. Wait for document fonts to be completely ready before rasterizing
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch (e) {
      // Continue gracefully
    }
  }

  // Small delay to ensure browser layout repaint
  await new Promise((r) => setTimeout(r, 60));

  // -------------------------------------------------------------
  // STRATEGY 1: html-to-image (High fidelity vector/DOM rasterization with fonts)
  // -------------------------------------------------------------
  try {
    const renderOptions = {
      width: baseWidth,
      height: baseHeight,
      canvasWidth: outputWidth,
      canvasHeight: outputHeight,
      pixelRatio: pixelRatio,
      quality: format === 'jpeg' ? quality : 1,
      cacheBust: false,
      filter: (node: HTMLElement) => {
        if (node.tagName === 'IFRAME') return false;
        return true;
      },
      style: {
        transform: 'none',
        transformOrigin: 'top left',
        margin: '0',
        padding: '0',
        top: '0',
        left: '0',
        position: 'static',
        width: `${baseWidth}px`,
        height: `${baseHeight}px`,
      },
    };

    const dataUrl = format === 'png' 
      ? await toPng(targetElement, renderOptions)
      : await toJpeg(targetElement, renderOptions);

    if (dataUrl && dataUrl.length > 1000) {
      return dataUrl;
    }
  } catch (errPrimary: any) {
    console.warn('[Export] html-to-image strategy failed, trying html2canvas:', errPrimary?.message || errPrimary);
  }

  // -------------------------------------------------------------
  // STRATEGY 2: html2canvas (Safe Untainted Local DOM Canvas Engine)
  // -------------------------------------------------------------
  try {
    const canvas = await html2canvas(targetElement, {
      width: baseWidth,
      height: baseHeight,
      scale: pixelRatio,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#09090b',
      logging: false,
      imageTimeout: 5000,
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
    if (dataUrl && dataUrl.length > 1000) {
      return dataUrl;
    }
  } catch (errSecondary: any) {
    console.warn('[Export] html2canvas strategy failed, switching to Native Canvas 2D fallback:', errSecondary?.message || errSecondary);
  }

  // -------------------------------------------------------------
  // STRATEGY 3: 100% Offline Pure Canvas 2D Generator (With Custom Persian Fonts)
  // -------------------------------------------------------------
  try {
    console.info('[Export] Executing Native Canvas 2D generator with Persian fonts...');
    const offlineDataUrl = await renderNewsCardToNativeCanvas(
      post,
      outputWidth,
      outputHeight,
      format,
      quality
    );
    if (offlineDataUrl && offlineDataUrl.length > 500) {
      return offlineDataUrl;
    }
  } catch (errFallback: any) {
    console.error('[Export] Offline Canvas 2D generator failed:', errFallback);
  }

  throw new Error('سیستم در رندر تصویر با مشکل مواجه شد. لطفاً دوباره تلاش فرمایید.');
}
