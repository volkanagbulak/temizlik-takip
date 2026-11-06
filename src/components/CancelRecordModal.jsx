// src/components/CancelRecordModal.jsx
import { useState } from "react";
import { App, Input, Modal, Select } from "antd";
import { cancelRecordApi } from "../api/recordApi";
import { useAction } from "../hooks/useAction";

const REASONS = ["Yanlış açıldı", "Sahibi işe devam edemiyor", "Temizlik iptal edildi", "Diğer"].map((value) => ({ value, label: value }));

// Operatör ve yönetici aynı pencereyi kullanıyor. Yönetici için açıklama zorunlu.
export function CancelRecordModal({ record, detailRequired = false, onClose, onDone }) {
  const { message } = App.useApp();
  const { run, pending } = useAction();
  const [reason, setReason] = useState();
  const [detail, setDetail] = useState("");

  async function handleOk() {
    if (!reason) {
      message.error("Kapatma nedeni seç.");
      return;
    }
    if (detailRequired && !detail.trim()) {
      message.error("Açıklama zorunlu.");
      return;
    }
    // Hata alınsa da liste yenileniyor, kayıt başka biri tarafından kapatılmış olabilir.
    await run(() => cancelRecordApi(record.id, reason, detail.trim()), { success: `${record.no} kapatıldı.`, onSettled: onDone });
  }

  return (
    <Modal open title={`${record.no} kaydını kapat`} okText="Kaydı kapat" okButtonProps={{ danger: true, loading: pending }} onOk={handleOk} onCancel={onClose}>
      <Select placeholder="Neden" value={reason} onChange={setReason} options={REASONS} style={{ width: "100%", marginBottom: 12 }} />
      <Input.TextArea rows={3} placeholder={detailRequired ? "Açıklama (zorunlu)" : "Açıklama (isteğe bağlı)"} value={detail} onChange={(e) => setDetail(e.target.value)} />
    </Modal>
  );
}
