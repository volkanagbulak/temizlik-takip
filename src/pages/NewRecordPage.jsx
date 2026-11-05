// src/pages/NewRecordPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, Button, Card, Form, Input, Select } from "antd";
import { getDefinitionsApi, openRecordApi } from "../api/cleaningApi";

const toOptions = (items, label) =>
  items.map((item) => ({ value: item.id, label: label(item) }));

export function NewRecordPage({ user }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [definitions, setDefinitions] = useState(null);

  const category = Form.useWatch("category", form);
  const lineId = Form.useWatch("lineId", form);
  const machineId = Form.useWatch("machineId", form);
  const procedureId = Form.useWatch("procedureId", form);

  useEffect(() => {
    getDefinitionsApi().then(setDefinitions);
  }, []);

  async function handleSubmit(values) {
    // Lot seçenekleri metin olarak duruyor, kayda nesne olarak gidiyor.
    const materials = (values.lots ?? []).map((text) => JSON.parse(text));
    try {
      const record = await openRecordApi({ ...values, materials });
      navigate(`/records/${record.id}/run`);
    } catch (err) {
      message.error(err.response.data.message);
    }
  }

  if (!definitions) return null;

  // Seçimler birbirine bağlı: hat makineyi, makine ve kayıt türü de formu belirliyor.
  // Kullanımdan kaldırılan makine listede çıkmıyor.
  const machines = definitions.machines.filter(
    (m) => m.lineId === lineId && m.active,
  );
  const procedures = definitions.procedures.filter(
    (p) => p.category === category && p.machineIds.includes(machineId),
  );
  const procedure = procedures.find((p) => p.id === procedureId);
  // Malzeme zorunluluğu seçilen formun son versiyonundan geliyor.
  const materialRequired = procedure?.versions.at(-1).materialRequired;
  const lotOptions = definitions.materials.flatMap((m) =>
    m.lots.map((l) => ({
      value: JSON.stringify({ code: m.code, name: m.name, ...l }),
      label: `${m.code} ${m.name} / ${l.lot} / SKT ${l.expiry}`,
    })),
  );
  // Kaydı açan zaten sorumlu, kendini yardımcı olarak seçemesin.
  const helpers = definitions.users.filter(
    (u) => u.role === "operator" && u.active && u.id !== user.id,
  );

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
            options={toOptions(machines, (m) => `${m.code} ${m.name}`)}
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
          <Select mode="multiple" options={lotOptions} />
        </Form.Item>
        <Form.Item name="helperIds" label="Yardımcı personel">
          <Select mode="multiple" options={toOptions(helpers, (u) => u.name)} />
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
        <Button type="primary" size="large" htmlType="submit" block>
          Kaydı aç
        </Button>
      </Form>
    </Card>
  );
}
