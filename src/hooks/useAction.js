// src/hooks/useAction.js
import { useRef, useState } from "react";
import { App } from "antd";

// Servise yazan işlemlerin ortak kalıbı: isteği gönder, hatayı göster, ekranı yenile.
// İşlem ve yenileme bitene kadar ikinci tıklama yeni istek göndermiyor.
export function useAction() {
  const { message } = App.useApp();
  const [pending, setPending] = useState(false);
  // State bir sonraki çizimde güncelleniyor. Ref ise hemen değiştiği için araya giren tıklamayı da yakalıyor.
  const running = useRef(false);

  async function run(request, { success, onError, onSettled } = {}) {
    if (running.current) return { ok: false };
    running.current = true;
    setPending(true);
    try {
      const data = await request();
      if (success) message.success(success);
      return { ok: true, data };
    } catch (err) {
      const error = {
        status: err.response?.status,
        code: err.response?.data?.code,
        message: err.response?.data?.message ?? "İşlem yapılamadı.",
      };
      // onError true dönerse hatayı sayfa kendisi yönetiyor.
      if (!onError?.(error)) message.error(error.message);
      return { ok: false, error };
    } finally {
      // Hata olsa da ekran yenileniyor, veri başka biri tarafından değişmiş olabilir.
      await onSettled?.();
      running.current = false;
      setPending(false);
    }
  }

  return { run, pending };
}
