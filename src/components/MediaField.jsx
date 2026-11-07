// src/components/MediaField.jsx
import { App, Button, Flex, Typography, Upload } from "antd";
import { DeleteOutlined, PaperClipOutlined } from "@ant-design/icons";
import { StepMedia } from "./StepMedia";
import { uploadMediaApi } from "../api/mediaApi";
import { MAX_MEDIA_MB } from "../utils/media";

// Form.Item içinde kullanılıyor: value adımın medya adresi, onChange yeni adresi forma yazıyor.
// Seçilen dosya önce dosya deposuna yükleniyor, forma yalnızca dönen adres yazılıyor.
export function MediaField({ value, onChange }) {
  const { message } = App.useApp();

  function handleFile(file) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      message.error("Yalnızca görsel veya video seçilebilir.");
      return false;
    }
    if (file.size > MAX_MEDIA_MB * 1024 * 1024) {
      message.error(`Dosya en fazla ${MAX_MEDIA_MB} MB olabilir.`);
      return false;
    }
    uploadMediaApi(file)
      .then(onChange)
      .catch(() => message.error("Dosya kaydedilemedi."));
    // false: Upload bileşeni dosyayı kendisi bir adrese göndermeye çalışmasın.
    return false;
  }

  return (
    <Flex gap={8} align="center" wrap>
      {value && <StepMedia src={value} width={160} compact />}
      <Upload accept="image/*,video/*" showUploadList={false} beforeUpload={handleFile}>
        <Button size="small" icon={<PaperClipOutlined />}>
          {value ? "Medyayı değiştir" : "Görsel / video ekle"}
        </Button>
      </Upload>
      {value && (
        <Button size="small" icon={<DeleteOutlined />} onClick={() => onChange(null)}>
          Kaldır
        </Button>
      )}
      {!value && <Typography.Text type="secondary">İsteğe bağlı, en fazla {MAX_MEDIA_MB} MB</Typography.Text>}
    </Flex>
  );
}
