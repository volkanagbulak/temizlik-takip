// src/pages/NewRecordPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button, Card, Form, Input, Select } from "antd";
import { getDefinitionsApi } from "../api/definitionApi";
import { getMachinesApi } from "../api/machineApi";
import { openRecordApi } from "../api/recordApi";
import { getAvailabilityApi } from "../api/userApi";
import { useAction } from "../hooks/useAction";
import { isExpired } from "../utils/time";

const toOptions = (items, label) =>
  items.map((item) => ({ value: item.id, label: label(item) }));

// Makine ve personel durumu değişebildiği için tanımlarla birlikte okunuyor.
const loadForm = () =>
  Promise.all([getDefinitionsApi(), getMachinesApi(), getAvailabilityApi()]).then(
    ([definitions, machines, people]) => ({ definitions, machines, people }),
  );

export function NewRecordPage({ user }) {
  const navigate = useNavigate();
  const { refreshKey } = useOutletContext();
  const { run, pending } = useAction();
  const [form] = Form.useForm();
  const [data, setData] = useState(null);

  const category = Form.useWatch("category", form);
  const lineId = Form.useWatch("lineId", form);
  const machineId = Form.useWatch("machineId", form);
  const procedureId = Form.useWatch("procedureId", form);

  // Başka sekmede makine alınınca liste güncelleniyor. Formda seçilenler silinmiyor.
  useEffect(() => {
    loadForm().then(setData);
  }, [refreshKey]);

  async function handleSubmit(values) {
    // Yalnızca seçim gönderiliyor: malzeme kimliği ve lot. Gerisini servis tanımdan alıyor.
    const { lots = [], ...rest } = values;
    const materialLots = lots.map((value) => {
      const [materialId, lot] = value.split("|");
      return { materialId, lot };
    });
    const result = await run(() => openRecordApi({ ...rest, materialLots }));
    if (result.ok) navigate(`/records/${result.data.id}/run`);
    // Makineyi başkası aldıysa liste hemen yenilensin.
    else loadForm().then(setData);
  }

  if (!data) return null;

  const { definitions, people } = data;

  // Seçimler birbirine bağlı: hat makineyi, makine ve kayıt türü de formu belirliyor.
  // Kullanımdan kaldırılan makine listede çıkmıyor. Dolu makine seçilemiyor, kimde olduğu
  // yazıyor. Son kararı yine servis veriyor.
  const machineOptions = data.machines
    .filter((m) => m.lineId === lineId)
    .map((m) => ({
      value: m.id,
      label: m.lock ? `${m.code} ${m.name} (${m.lock.ownerName} kullanıyor)` : `${m.code} ${m.name}`,
      disabled: Boolean(m.lock),
    }));
  const procedures = definitions.procedures.filter(
    (p) => p.category === category && p.machineIds.includes(machineId),
  );
  const procedure = procedures.find((p) => p.id === procedureId);
  // Malzeme zorunluluğu seçilen formun son versiyonundan geliyor.
  const materialRequired = procedure?.versions.at(-1).materialRequired;
  // SKT'si geçmiş lot seçilemiyor. Son kararı yine servis veriyor.
  const lotOptions = definitions.materials.flatMap((m) =>
    m.lots.map((l) => ({
      value: `${m.id}|${l.lot}`,
      label: `${m.code} ${m.name} / ${l.lot} / SKT ${l.expiry}${isExpired(l.expiry) ? " (süresi geçmiş)" : ""}`,
      disabled: isExpired(l.expiry),
    })),
  );
  // Kaydı açan zaten sorumlu, kendini yardımcı olarak seçemesin.
  // Başka kayıtta çalışan kişi seçilebilir ama kimde olduğu görünsün.
  const helperOptions = people
    .filter((p) => p.id !== user.id)
    .map((p) => ({
      value: p.id,
      label: p.busy ? `${p.name} (${p.busy.recordNo} kaydında)` : p.name,
    }));

  return (
    <Card title="Yeni kayıt" style={{ maxWidth: 640 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ category: "normal" }}
        onFinish={handleSubmit}
      >
        <Form.Item name="category" label="Kayıt türü">
          <Select
            onChange={() => form.setFieldValue("procedureId", undefined)}
            options={[
              { value: "normal", label: "Normal temizlik" },
              { value: "emergency", label: "Acil müdahale" },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="lineId"
          label="Tesis / hat"
          rules={[{ required: true, message: "Hat seç" }]}
        >
          <Select
            onChange={() =>
              form.setFieldsValue({
                machineId: undefined,
                procedureId: undefined,
              })
            }
            options={toOptions(definitions.lines, (l) => l.name)}
          />
        </Form.Item>
        <Form.Item
          name="machineId"
          label="Makine"
          rules={[{ required: true, message: "Makine seç" }]}
        >
          <Select
            onChange={() => form.setFieldValue("procedureId", undefined)}
            options={machineOptions}
          />
        </Form.Item>
        <Form.Item
          name="procedureId"
          label="Form tipi"
          rules={[{ required: true, message: "Form seç" }]}
        >
          <Select
            options={toOptions(procedures, (p) => `${p.code} ${p.name}`)}
          />
        </Form.Item>
        <Form.Item
          name="lots"
          label="Malzeme ve lot"
          rules={[
            {
              required: materialRequired,
              message: "Bu form için malzeme zorunlu",
            },
          ]}
        >
          <Select mode="multiple" optionFilterProp="label" options={lotOptions} />
        </Form.Item>
        <Form.Item name="helperIds" label="Yardımcı personel">
          <Select mode="multiple" optionFilterProp="label" options={helperOptions} />
        </Form.Item>
        <Form.Item
          name="workOrder"
          label="Üretim iş emri"
          rules={[
            { required: true, whitespace: true, message: "İş emri zorunlu" },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="note" label="Açıklama">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Button type="primary" size="large" htmlType="submit" block loading={pending}>
          Kaydı aç
        </Button>
      </Form>
    </Card>
  );
}
