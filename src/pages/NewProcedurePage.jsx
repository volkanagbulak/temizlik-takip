// src/pages/NewProcedurePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button, Card, Flex, Form, Input, Select, Switch } from "antd";
import { getDefinitionsApi } from "../api/definitionApi";
import { createProcedureApi } from "../api/procedureApi";
import { PhasesEditor } from "../components/PhasesEditor";
import { useAction } from "../hooks/useAction";

const FIRST_PHASE = { name: "", minMinutes: 10, steps: [{ title: "", description: "", media: null }] };

const CATEGORIES = [
  { value: "normal", label: "Normal temizlik" },
  { value: "emergency", label: "Acil müdahale" },
];

// Yeni prosedür v1 olarak oluşuyor. Sonraki değişiklikler detay sayfasında yeni versiyonla yapılıyor.
export function NewProcedurePage() {
  const { refreshKey } = useOutletContext();
  const navigate = useNavigate();
  const { run, pending } = useAction();
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    getDefinitionsApi().then((definitions) => setMachines(definitions.machines.filter((m) => m.active)));
  }, [refreshKey]);

  async function handleSave(values) {
    const result = await run(() => createProcedureApi(values), { success: `${values.code.trim().toUpperCase()} oluşturuldu.` });
    if (result.ok) navigate(`/procedures/${result.data.id}`);
  }

  return (
    <Form layout="vertical" initialValues={{ category: "normal", materialRequired: false, machineIds: [], phases: [FIRST_PHASE] }} onFinish={handleSave}>
      <Card title="Yeni prosedür">
        <Flex wrap style={{ columnGap: 16 }}>
          <Form.Item name="code" label="Kod" extra="Benzersiz olmalı, örn. TP-03" rules={[{ required: true, whitespace: true, message: "Kod zorunlu" }]} style={{ flex: "1 1 160px" }}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Ad" rules={[{ required: true, whitespace: true, message: "Ad zorunlu" }]} style={{ flex: "2 1 240px" }}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Tür" style={{ flex: "1 1 160px" }}>
            <Select options={CATEGORIES} />
          </Form.Item>
        </Flex>
        <Form.Item
          name="machineIds"
          label="Kullanılabilecek makineler"
          extra="Seçilen makinelerde yeni kayıt açılırken bu prosedür listelenir."
          rules={[{ required: true, message: "En az bir makine seç" }]}
        >
          <Select mode="multiple" optionFilterProp="label" options={machines.map((m) => ({ value: m.id, label: `${m.code} ${m.name}` }))} />
        </Form.Item>
        <Form.Item name="materialRequired" label="Malzeme girişi zorunlu" valuePropName="checked">
          <Switch />
        </Form.Item>
        <PhasesEditor />
        {/* Form uzun olduğu için butonlar sonda, dar ekranda başlığı da sıkıştırmıyor. */}
        <Flex gap={8} justify="flex-end" style={{ marginTop: 24 }}>
          <Button onClick={() => navigate("/procedures")}>Vazgeç</Button>
          <Button type="primary" htmlType="submit" loading={pending}>
            Prosedürü kaydet
          </Button>
        </Flex>
      </Card>
    </Form>
  );
}
