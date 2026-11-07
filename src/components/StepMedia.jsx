// src/components/StepMedia.jsx
import { useEffect, useState } from "react";
import { Image, Typography } from "antd";
import { getMediaFileApi } from "../api/mediaApi";
import { isUploaded, isVideoPath } from "../utils/media";

// Adres yüklenmiş bir dosyaysa depodan okunup tarayıcı adresine çevriliyor.
function useMedia(src) {
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    if (!src || !isUploaded(src)) return undefined;
    let url = null;
    let cancelled = false;
    getMediaFileApi(src).then((file) => {
      if (cancelled) return;
      if (!file) {
        setLoaded({ src, missing: true });
        return;
      }
      url = URL.createObjectURL(file);
      setLoaded({ src, url, video: file.type.startsWith("video/") });
    });
    // Sayfa değişince tarayıcının ayırdığı adres serbest bırakılıyor.
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  if (!src) return null;
  if (!isUploaded(src)) return { url: src, video: isVideoPath(src) };
  // Önceki adresin sonucu yeni adrese gösterilmesin.
  return loaded?.src === src ? loaded : null;
}

// Adımın eğitim görseli ya da videosu. Video kendiliğinden başlamıyor, operatör oynatıyor.
// compact: tablolardaki küçük önizleme. Kontroller küçük videoyu kapattığı için gizli, tıklayınca oynuyor.
export function StepMedia({ src, width = 320, compact = false }) {
  const media = useMedia(src);
  if (!media) return null;
  if (media.missing) return <Typography.Text type="secondary">Dosya bu tarayıcıda yok</Typography.Text>;
  if (media.video) {
    const style = { width, maxWidth: "100%", borderRadius: 8, display: "block", cursor: compact ? "pointer" : undefined };
    if (compact) {
      // #t=1: önizlemede ilk kare yerine 1. saniyedeki kare görünsün, ilk kare çoğunlukla boş.
      return <video src={`${media.url}#t=1`} muted preload="metadata" title="Oynatmak için tıkla" style={style} onClick={(e) => (e.target.paused ? e.target.play() : e.target.pause())} />;
    }
    return <video src={media.url} controls preload="metadata" style={style} />;
  }
  return <Image width={width} src={media.url} style={{ maxWidth: "100%" }} />;
}
