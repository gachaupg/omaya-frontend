// src/lib/utils/html.ts (recommended) or inline
export function decodeHtml(html: string): string {
    if (!html) return '';
  
    let decoded = html;
  
    // Handle \u003c style escapes (Sanity JSON often does this)
    decoded = decoded.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
  
    // Handle any leftover HTML entities
    decoded = decoded
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#60;/g, '<')
      .replace(/&#62;/g, '>')
      .replace(/&#38;/g, '&');
  
    return decoded;
  }