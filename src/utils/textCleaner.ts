/**
 * Utility to clean Persian text and eliminate raw literal escape sequences like \n\n, \r, \\n, etc.
 */
export function cleanText(str: any): string {
  if (typeof str !== 'string') return '';
  return str
    // Replace literal escaped newlines ("\n", "\\n", "\\\n") with real newlines
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\"/g, '"')
    // Normalize excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function cleanAiPayload<T = any>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  
  const d = data as any;
  return {
    ...d,
    title: cleanText(d.title),
    kicker: cleanText(d.kicker),
    lead: cleanText(d.lead),
    fullArticle: cleanText(d.fullArticle || d.lead),
    category: cleanText(d.category),
    source: cleanText(d.source),
    keyPoints: Array.isArray(d.keyPoints) ? d.keyPoints.map(cleanText).filter(Boolean) : [],
    quote: d.quote ? {
      text: cleanText(d.quote.text),
      author: cleanText(d.quote.author),
      role: cleanText(d.quote.role),
    } : undefined,
  } as T;
}
