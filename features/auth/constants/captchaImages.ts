/** Same-origin puzzle images — avoids picsum/CORS failures in production. */
export const CAPTCHA_IMAGES = [
  "/assets/omaya-office-about.png",
  "/assets/Container_7_ffwiyh.png",
  "/assets/Container_8_c6iouu.png",
  "/assets/Container_9_e1cnzo.png",
  "/assets/Container_11_tss9j7.png",
] as const;

export function pickCaptchaImage(): string {
  const index = Math.floor(Math.random() * CAPTCHA_IMAGES.length);
  return CAPTCHA_IMAGES[index] ?? CAPTCHA_IMAGES[0];
}
