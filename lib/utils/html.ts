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

/**
 * Strips leading images (img, figure, picture) from HTML.
 * Use when extracting text for excerpts (strip first, then get text).
 */
export function stripLeadingImagesFromHtml(html: string): string {
  if (!html) return '';
  let result = html.trim();
  let changed = true;
  while (changed) {
    changed = false;
    const imgMatch = result.match(/^\s*<img[^>]*\/?>\s*/i);
    if (imgMatch) {
      result = result.slice(imgMatch[0].length).trim();
      changed = true;
      continue;
    }
    const figureMatch = result.match(/^\s*<figure[^>]*>[\s\S]*?<\/figure>\s*/i);
    if (figureMatch) {
      result = result.slice(figureMatch[0].length).trim();
      changed = true;
      continue;
    }
    const pictureMatch = result.match(/^\s*<picture[^>]*>[\s\S]*?<\/picture>\s*/i);
    if (pictureMatch) {
      result = result.slice(pictureMatch[0].length).trim();
      changed = true;
      continue;
    }
  }
  return result;
}

/**
 * Strips ALL images (img, figure, picture) from HTML for card previews.
 * Use when you want to show only text in the listing - no images at all.
 * Detail page should use full content without this.
 */
export function stripAllImagesFromHtml(html: string): string {
  if (!html) return '';
  let result = html;
  // Remove <figure>...</figure> (including nested img)
  result = result.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '');
  // Remove <picture>...</picture>
  result = result.replace(/<picture[^>]*>[\s\S]*?<\/picture>/gi, '');
  // Remove standalone <img ... >
  result = result.replace(/<img[^>]*\/?>/gi, '');
  return result.trim();
}