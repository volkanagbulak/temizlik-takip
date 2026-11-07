// src/utils/media.js
// Adım medyası tek bir adres olarak tutuluyor: public klasöründeki dosya ("/egitim.mp4")
// ya da yöneticinin yüklediği dosyanın adresi ("media:...").
export const isUploaded = (src) => src.startsWith("media:");
export const isVideoPath = (src) => /\.(mp4|webm|ogg)$/i.test(src);

// Demo için üst sınır. Dosyalar tarayıcının IndexedDB deposunda tutuluyor.
export const MAX_MEDIA_MB = 50;
