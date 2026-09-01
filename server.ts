import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini Client with lazy/fallback check
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", storage: "LocalStorage Client", timestamp: Date.now() });
  });

  // CORS-Safe Image Proxy for Canvas Export
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).json({ success: false, error: "URL parameter is required" });
      }

      // If it's already a data URL, return it as is
      if (targetUrl.startsWith("data:")) {
        return res.redirect(targetUrl);
      }

      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ success: false, error: `Failed to fetch image: ${response.statusText}` });
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await response.arrayBuffer());

      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (err: any) {
      console.error("Proxy image error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to proxy image" });
    }
  });

  // Helper: Sanitize Persian text and eliminate literal \n\n, \r, \\n escape artifacts
  function cleanPersianText(str: any): string {
    if (typeof str !== 'string') return '';
    return str
      .replace(/\\\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, ' ')
      .replace(/\\"/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function cleanAiResponsePayload(data: any): any {
    if (!data || typeof data !== 'object') return data;
    return {
      ...data,
      title: cleanPersianText(data.title),
      kicker: cleanPersianText(data.kicker),
      lead: cleanPersianText(data.lead),
      fullArticle: cleanPersianText(data.fullArticle || data.lead),
      category: cleanPersianText(data.category),
      source: cleanPersianText(data.source),
      suggestedPrimaryColor: data.suggestedPrimaryColor,
      suggestedTemplate: data.suggestedTemplate,
      imageKeywordsPrompt: cleanPersianText(data.imageKeywordsPrompt),
      keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints.map(cleanPersianText).filter(Boolean) : [],
      quote: data.quote ? {
        text: cleanPersianText(data.quote.text),
        author: cleanPersianText(data.quote.author),
        role: cleanPersianText(data.quote.role),
      } : undefined,
    };
  }

  // Helper: Extract valid JSON from LLM text responses
  function extractJson(text: string) {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        try {
          return JSON.parse(match[1].trim());
        } catch {}
      }
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        } catch {}
      }
    }
    return null;
  }

  // Robust helper: Call Gemini with auto-retry and fallback models on 503/high-demand errors
  async function generateGeminiWithFallback(primaryModel: string, contents: any, config: any) {
    const modelsToTry = [
      primaryModel || "gemini-3.7-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
    ];

    const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));
    let lastError: any = null;

    for (const currentModel of uniqueModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents,
            config,
          });
          return response;
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || String(err);
          const isHighDemand = 
            errMsg.includes("503") || 
            errMsg.includes("high demand") || 
            errMsg.includes("UNAVAILABLE") || 
            errMsg.includes("429") || 
            errMsg.includes("RESOURCE_EXHAUSTED");

          console.warn(`[Gemini] Model ${currentModel} attempt ${attempt} warning:`, errMsg);

          if (isHighDemand && attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          break;
        }
      }
    }

    throw lastError;
  }

  // Unified AI News Generator Endpoint (Gemini, Mistral, OpenRouter) with Smart Auto-Fallback
  app.post("/api/news/ai-generate", async (req, res) => {
    try {
      const {
        rawText,
        category,
        tone = "formal",
        aspectRatio = "1:1",
        provider = "gemini",
        model,
        apiKey,
        humanize = true,
      } = req.body;

      if (!rawText || !rawText.trim()) {
        return res.status(400).json({ success: false, error: "متن اولیه خبر الزامی است." });
      }

      const toneDescription = 
        tone === 'breaking' ? 'فوری، مهیج، حساس و پوشش زنده لحظه‌ای' :
        tone === 'magazine' ? 'مجله‌ای، تحلیلی، عمیق و دارای ژرف‌نگری' :
        tone === 'bullet' ? 'خلاصه، ضربتی، دسته‌بندی شده و سریع' :
        tone === 'clickbait' ? 'بسیار جذاب، مخاطب‌پسند و برانگیزاننده کنجکاوی' :
        'رسمی، استاندارد تحریریه خبرگزاری و مستند';

      const systemPrompt = `تو یک روزنامه‌نگار تحقیقی و دبیر ارشد تحریریه با بیش از ۲۰ سال سابقه در معتبرترین خبرگزاری‌های رسمی و رسانه‌های جریان اصلی هستی.

دستورالعمل‌های حیاتی برای نگارش انسانی و غیرقابل تشخیص توسط آشکارسازهای هوش مصنوعی (Anti-AI Detector & 100% Authentic Persian Journalism):
۱. ممنوعیت مطلق کلیشه‌ها و تیک‌های کلامی هوش مصنوعی:
   - به هیچ وجه از عباراتی مانند «در دنیای پرشتاب امروزی»، «لازم به ذکر است»، «در این راستا»، «شایان ذکر است»، «در نهایت می‌توان گفت»، «گامی مثبت در جهت»، «همان‌طور که می‌دانیم»، «بر کسی پوشیده نیست»، «چشم‌اندازی روشن» استفاده نکن.
۲. تنوع ساختاری و ریتم طبیعی (Natural Rhythm & Burstiness):
   - از ریتم مکانیکی و طول یکدست جملات دوری کن. جملات خبری کوتاه و ضربه‌ای را در کنار جملات تحلیلی چندوجهی به کار ببر.
۳. نگارش متن کامل خبر (fullArticle):
   - یک گزارش خبری کامل، غنی، مستقل و خواندنی در ۳ تا ۵ بند (پاراگراف) بنویس (حاوی لید خبری جذاب، شرح ابعاد و جزئیات رویداد، آمار یا پیشینه موثق، نقل‌قول‌ها و جمع‌بندی واقع‌گرایانه بدون موعظه یا نتیجه‌گیری‌های اخلاقی).
۴. رعایت کامل رسم‌الخط و نیم‌فاصله‌های استاندارد فارسی (مانند «می‌شود»، «دست‌اندرکاران»، «پیش‌بینی»).

خروجی باید صرفاً یک آبجکت معتبر JSON با ساختار زیر باشد:
{
  "title": "تیتر اصلی جذاب، کوبنده و بدون حاشیه (حداکثر ۱۲ کلمه)",
  "kicker": "روتیتر کوتاه ۱ الی ۴ کلمه‌ای (مانند: تحولات بازار، گزارش اختصاصی، خبر فوری)",
  "lead": "خلاصه و لید خبر در ۲ الی ۳ جمله روان و شفاف",
  "fullArticle": "متن کامل و مفصل خبر به زبان خبرنگاری حرفه‌ای و طبیعی (۳ تا ۵ پاراگراف جامع آماده انتشار)",
  "keyPoints": ["نکته کلیدی ۱", "نکته کلیدی ۲", "نکته کلیدی ۳", "نکته کلیدی ۴"],
  "category": "دسته‌بندی موضوعی فارسی (سیاسی، اقتصادی، فناوری، بین‌الملل، حوادث، ورزشی، و...)",
  "source": "منبع خبر (مثلاً: خبرگزاری، گزارش میدانی، اختصاصی)",
  "suggestedPrimaryColor": "کد رنگ Hex پیشنهادی متناسب با لحن (مثلاً #ef4444، #10b981، #3b82f6، #f59e0b)",
  "suggestedTemplate": "یکی از: breaking-alert | editorial-minimal | dark-glass | social-feed | broadcast-tv | quote-statement | split-photo | headline-hero | key-takeaways",
  "quote": {
    "text": "مهم‌ترین یا تاثیرگذارترین جمله یا نقل قول خبر",
    "author": "گوینده یا منبع نقل قول",
    "role": "سمت یا عنوان"
  },
  "imageKeywordsPrompt": "عبارت کوتاه انگلیسی توصیف‌کننده صحنه برای ساخت یا جستجوی تصویر"
}`;

      const userPrompt = `گزارش یا متن خام ورودی کاربر برای پردازش:
"""
${rawText}
"""

تنظیمات درخواستی:
- لحن درخواستی: ${toneDescription}
- دسته‌بندی ترجیحی: ${category || 'تشخیص خودکار'}
- قطع تصویر هدف: ${aspectRatio}
- حالت نگارش انسانی و ضد هوش مصنوعی: ${humanize ? 'فعال (حداکثر طبیعی‌بودن و عدم استفاده از کلیشه‌های ماشینی)' : 'استاندارد'}`;

      let parsedData: any = null;
      let providerUsed = provider;
      let fallbackNotice: string | null = null;

      // 1. Mistral API Provider
      if (provider === "mistral") {
        const mistralKey = apiKey || process.env.MISTRAL_API_KEY;
        if (!mistralKey) {
          return res.status(400).json({
            success: false,
            error: "کلید API میسترال (Mistral API Key) یافت نشد. لطفاً در فیلد ورودی کلید خود را وارد کنید یا از موتور گوگل جمینای استفاده نمایید.",
          });
        }
        const mistralModel = model || "mistral-large-latest";

        try {
          const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${mistralKey.trim()}`,
            },
            body: JSON.stringify({
              model: mistralModel,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
              temperature: 0.65,
            }),
          });

          if (mistralResponse.ok) {
            const mistralJson = await mistralResponse.json();
            const contentText = mistralJson.choices?.[0]?.message?.content || "{}";
            parsedData = extractJson(contentText);
          } else {
            const errText = await mistralResponse.text();
            console.warn(`[Mistral] Error ${mistralResponse.status}:`, errText);
            fallbackNotice = "به دلیل بروز محدودیت در سرور میسترال، خروجی به‌صورت خودکار با موتور جمینای تولید شد.";
          }
        } catch (mErr: any) {
          console.warn("[Mistral] Request failed, falling back to Gemini:", mErr.message);
          fallbackNotice = "به دلیل خطای ارتباط با میسترال، خروجی به‌صورت خودکار با موتور جمینای تولید شد.";
        }
      }
      
      // 2. OpenRouter API Provider
      else if (provider === "openrouter") {
        const openrouterKey = apiKey || process.env.OPENROUTER_API_KEY;
        if (!openrouterKey) {
          return res.status(400).json({
            success: false,
            error: "کلید API اوپن‌روتر (OpenRouter API Key) یافت نشد. لطفاً در فیلد مربوطه وارد نمایید یا از موتور پیش‌فرض جمینای استفاده فرمایید.",
          });
        }
        const openrouterModel = model || "meta-llama/llama-3.3-70b-instruct";

        try {
          const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openrouterKey.trim()}`,
              "HTTP-Referer": process.env.APP_URL || "https://ai.studio",
              "X-Title": "AI News Card Studio",
            },
            body: JSON.stringify({
              model: openrouterModel,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
              temperature: 0.65,
            }),
          });

          if (orResponse.ok) {
            const orJson = await orResponse.json();
            const contentText = orJson.choices?.[0]?.message?.content || "{}";
            parsedData = extractJson(contentText);
          } else {
            const errBodyText = await orResponse.text();
            let parsedErr: any = null;
            try { parsedErr = JSON.parse(errBodyText); } catch {}
            const errMsg = parsedErr?.error?.message || errBodyText;
            console.warn(`[OpenRouter] Status ${orResponse.status} for model ${openrouterModel}:`, errMsg);

            fallbackNotice = `به دلیل محدودیت ظرفیت مدل OpenRouter (${openrouterModel})، خبر به‌صورت خودکار با موتور گوگل جمینای با موفقیت پردازش شد.`;
          }
        } catch (orErr: any) {
          console.warn("[OpenRouter] Network failed, falling back to Gemini:", orErr.message);
          fallbackNotice = "به دلیل خطای ارتباط با OpenRouter، خروجی به‌صورت هوشمند با جمینای تولید شد.";
        }
      }

      // 3. Fallback or Default Gemini Provider
      if (!parsedData || !parsedData.title) {
        providerUsed = "gemini";
        const geminiModel = (provider === "gemini" && model) ? model : "gemini-3.7-flash";
        const response = await generateGeminiWithFallback(
          geminiModel,
          `${systemPrompt}\n\n${userPrompt}`,
          {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "تیتر اصلی خبر" },
                kicker: { type: Type.STRING, description: "روتیتر کوتاه" },
                lead: { type: Type.STRING, description: "خلاصه لید ۲-۳ جمله‌ای" },
                fullArticle: { type: Type.STRING, description: "متن کامل، ساختاریافته و تحلیلی خبر بدون کلیشه‌های هوش مصنوعی" },
                keyPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "۳ الی ۴ نکته کلیدی",
                },
                category: { type: Type.STRING, description: "دسته‌بندی موضوعی فارسی" },
                source: { type: Type.STRING, description: "منبع خبر یا خبرگزاری" },
                suggestedPrimaryColor: { type: Type.STRING, description: "کد رنگ Hex پیشنهادی" },
                suggestedTemplate: {
                  type: Type.STRING,
                  description: "قالب پیشنهادی",
                },
                quote: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    author: { type: Type.STRING },
                    role: { type: Type.STRING },
                  },
                },
                imageKeywordsPrompt: { type: Type.STRING, description: "English prompt for image generation/search" },
              },
              required: ["title", "kicker", "lead", "fullArticle", "keyPoints", "category", "suggestedPrimaryColor", "suggestedTemplate"],
            },
          }
        );

        parsedData = extractJson(response.text || "{}");
      }

      if (!parsedData || !parsedData.title) {
        throw new Error("پاسخ مدل هوش مصنوعی در ساختار استاندارد دریافت نشد. لطفاً مجدداً امتحان کنید.");
      }

      // Ensure fullArticle exists if model omitted it
      if (!parsedData.fullArticle) {
        parsedData.fullArticle = `${parsedData.kicker ? `«${parsedData.kicker}»\n\n` : ''}${parsedData.title}\n\n${parsedData.lead}\n\n` +
          (parsedData.keyPoints && parsedData.keyPoints.length > 0 
            ? `محورهای کلیدی رویداد:\n` + parsedData.keyPoints.map((k: string) => `• ${k}`).join('\n') + '\n\n'
            : '') +
          (parsedData.quote?.text ? `به گفته ${parsedData.quote.author || 'منابع آگاه'}: «${parsedData.quote.text}»\n\n` : '') +
          `منبع: ${parsedData.source || 'گزارش رسمی'}`;
      }

      const cleanedData = cleanAiResponsePayload(parsedData);

      res.json({
        success: true,
        data: cleanedData,
        providerUsed: providerUsed,
        fallbackNotice: fallbackNotice,
      });
    } catch (err: any) {
      console.error("AI news generate error:", err);
      let userFriendlyError = err.message || "خطایی در برقراری ارتباط با هوش مصنوعی رخ داد.";
      if (userFriendlyError.includes("503") || userFriendlyError.includes("high demand") || userFriendlyError.includes("UNAVAILABLE")) {
        userFriendlyError = "سرورهای هوش مصنوعی در حال حاضر با ترافیک بالایی مواجه هستند. لطفاً لحظاتی بعد مجدداً دکمه تولید را بزنید.";
      }
      res.status(500).json({
        success: false,
        error: userFriendlyError,
      });
    }
  });

  // AI Headline Variations / Tone Rewrite
  app.post("/api/news/ai-rewrite", async (req, res) => {
    try {
      const { title, lead, type = "headlines", provider = "gemini", model, apiKey } = req.body;
      const prompt = type === "headlines"
        ? `تو یک تیترنویس حرفه‌ای روزنامه هستی. برای این خبر، ۵ تیتر متفاوت، جذاب و غیرکلیشه‌ای در سبک‌های (فوری، تحلیلی، کنجکاوی‌برانگیز، کوتاه ضربه‌ای و رسمی) بنویس:
تیتر فعلی: ${title}
خلاصه: ${lead}
خروجی فقط یک آرایه JSON به نام results از ۵ رشته متنی باشد: {"results": ["...", "..."]}`
        : `این متن خبر را بازنویسی و کاملاً طبیعی و انسانی کن تا هیچ ردپایی از هوش مصنوعی در آن باقی نماند:
متن: ${lead}
خروجی فقط یک متن ویرایش شده باشد.`;

      if (provider === "mistral" && (apiKey || process.env.MISTRAL_API_KEY)) {
        const mistralKey = apiKey || process.env.MISTRAL_API_KEY;
        const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralKey}` },
          body: JSON.stringify({
            model: model || "mistral-small-latest",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });
        const json = await resp.json();
        const parsed = extractJson(json.choices?.[0]?.message?.content || "{}");
        return res.json({ success: true, data: parsed?.results || [] });
      }

      const response = await generateGeminiWithFallback(
        model || "gemini-3.7-flash",
        prompt,
        {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              results: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["results"],
          },
        }
      );

      const data = JSON.parse(response.text || '{"results":[]}');
      res.json({ success: true, data: data.results });
    } catch (err: any) {
      let msg = err?.message || "خطا در پردازش هوش مصنوعی";
      if (msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE")) {
        msg = "سرویس موقتاً با بار ترافیکی مواجه شد. لطفاً مجدداً تلاش کنید.";
      }
      res.status(500).json({ success: false, error: msg });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
