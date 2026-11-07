// src/pages/ProceduresPage.jsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Alert, Button, Card, Flex, Form, Input, InputNumber, Select, Switch, Table, Tag, Typography } from "antd";
import { getDefinitionsApi } from "../api/definitionApi";
import { createProcedureVersionApi } from "../api/procedureApi";
import { useAction } from "../hooks/useAction";

const formatDate = (time) => (time ? new Date(time).toLocaleString("tr-TR") : "—");

// Tanım değişince eski versiyon değiştirilmiyor, yeni versiyon ekleniyor. Geçmiş kayıtlar
// prosedürün o günkü kopyasını taşıdığı için açıldıkları günkü tanımı göstermeye devam ediyor.
export function ProceduresPage() {
  const { refreshKey } = useOutletContext();
  const { run, pending } = useAction();
  const [definitions, setDefinitions] = useState(null);
  const [procedureId, setProcedureId] = useState(null);
  // null: güncel versiyon gösteriliyor.
  const [versionNo, setVersionNo] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = () => getDefinitionsApi().then(setDefinitions);

  useEffect(() => {
    getDefinitionsApi().then(setDefinitions);
  }, [refreshKey]);

  if (!definitions) return null;

  const procedure = definitions.procedures.find((p) => p.id === procedureId) ?? definitions.procedures[0];
  const latest = procedure.versions.at(-1);
  const shown = procedure.versions.find((v) => v.version === versionNo) ?? latest;
  const userName = (id) => definitions.users.find((u) => u.id === id)?.name ?? "—";
  const machineCodes = definitions.machines.filter((m) => procedure.machineIds.includes(m.id)).map((m) => m.code);

  function selectProcedure(id) {
    setProcedureId(id);
    setVersionNo(null);
    setEditing(false);
  }

  // Form yalnızca değiştirilebilen alanları tutuyor. Faz ve adım kimlikleri güncel versiyondan geliyor.
  const initialValues = {
    note: "",
    materialRequired: latest.materialRequired,
    phases: latest.phases.map((phase) => ({ minMinutes: phase.minMinutes, steps: phase.steps.map((s) => ({ description: s.description })) })),
  };

  async function handleSave(values) {
    const payload = {
      baseVersion: latest.version,
      note: values.note,
      materialRequired: values.materialRequired,
      phases: latest.phases.map((phase, i) => ({
        id: phase.id,
        minMinutes: values.phases[i].minMinutes,
        steps: phase.steps.map((step, j) => ({ id: step.id, description: values.phases[i].steps[j].description })),
      })),
    };
    const result = await run(() => createProcedureVersionApi(procedure.id, payload), {
      success: `${procedure.code} v${latest.version + 1} oluşturuldu.`,
      onSettled: load,
    });
    if (result.ok) {
      setEditing(false);
      setVersionNo(null);
    }
  }

  const versionColumns = [
    { title: "Versiyon", render: (_, v) => (v.version === latest.version ? <Tag color="green">v{v.version} güncel</Tag> : `v${v.version}`) },
    { title: "Değişiklik nedeni", dataIndex: "note" },
    { title: "Oluşturan", render: (_, v) => (v.createdBy ? userName(v.createdBy) : "İlk tanım") },
    { title: "Tarih", render: (_, v) => formatDate(v.createdAt) },
    {
      title: "",
      render: (_, v) => (
        <Button size="small" disabled={editing || v.version === shown.version} onClick={() => setVersionNo(v.version)}>
          Göster
        </Button>
      ),
    },
  ];

  const stepColumns = [
    { title: "#", width: 48, render: (_, __, i) => i + 1 },
    { title: "Adım", dataIndex: "title", width: 220 },
    { title: "Açıklama", dataIndex: "description" },
  ];

  return (
    <Flex vertical gap={16}>
      <Card>
        <Flex gap={16} align="center" wrap>
          <Select
            value={procedure.id}
            onChange={selectProcedure}
            disabled={editing}
            style={{ minWidth: 320 }}
            options={definitions.procedures.map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))}
          />
          <Tag color={procedure.category === "emergency" ? "red" : "blue"}>{procedure.category === "emergency" ? "Acil" : "Normal"}</Tag>
          <Typography.Text type="secondary">Makineler: {machineCodes.join(", ") || "—"}</Typography.Text>
        </Flex>
      </Card>

      <Card title="Versiyonlar">
        <Table rowKey="version" columns={versionColumns} dataSource={[...procedure.versions].reverse()} pagination={false} scroll={{ x: true }} />
      </Card>

      {editing ? (
        <Form key={latest.version} layout="vertical" initialValues={initialValues} onFinish={handleSave}>
          <Card
            title={`${procedure.code} v${latest.version + 1} hazırlanıyor`}
            extra={
              <Flex gap={8}>
                <Button onClick={() => setEditing(false)}>Vazgeç</Button>
                <Button type="primary" htmlType="submit" loading={pending}>
                  Yeni versiyonu kaydet
                </Button>
              </Flex>
            }
          >
            <Alert type="info" title="Açık ve geçmiş kayıtlar etkilenmez. Bundan sonra açılan kayıtlar yeni versiyonla açılır." style={{ marginBottom: 16 }} />
            <Form.Item name="note" label="Değişiklik nedeni" rules={[{ required: true, whitespace: true, message: "Değişiklik nedeni zorunlu" }]}>
              <Input placeholder="Örn. Ön hazırlık süresi denetim talebiyle 20 dakikaya çıkarıldı" />
            </Form.Item>
            <Form.Item name="materialRequired" label="Malzeme girişi zorunlu" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Flex vertical gap={16}>
              {latest.phases.map((phase, i) => (
                <Card key={phase.id} size="small" title={phase.name}>
                  <Form.Item name={["phases", i, "minMinutes"]} label="Minimum süre (dakika)" rules={[{ required: true, message: "Süre zorunlu" }]}>
                    <InputNumber min={1} precision={0} />
                  </Form.Item>
                  {phase.steps.map((step, j) => (
                    <Form.Item key={step.id} name={["phases", i, "steps", j, "description"]} label={`${j + 1}. ${step.title}`} rules={[{ required: true, whitespace: true, message: "Açıklama zorunlu" }]}>
                      <Input />
                    </Form.Item>
                  ))}
                </Card>
              ))}
            </Flex>
          </Card>
        </Form>
      ) : (
        <Card
          title={`${procedure.code} v${shown.version}${shown.version === latest.version ? " (güncel)" : " (eski versiyon)"}`}
          extra={
            <Button type="primary" onClick={() => setEditing(true)}>
              Yeni versiyon oluştur
            </Button>
          }
        >
          {shown.version !== latest.version && (
            <Alert type="warning" title={`Eski versiyonu görüntülüyorsun. Bu versiyonla açılmış kayıtlar bu tanımı gösterir.`} style={{ marginBottom: 16 }} />
          )}
          <Typography.Paragraph>Malzeme girişi: {shown.materialRequired ? <Tag color="orange">Zorunlu</Tag> : <Tag>İsteğe bağlı</Tag>}</Typography.Paragraph>
          <Flex vertical gap={16}>
            {shown.phases.map((phase) => (
              <Card key={phase.id} size="small" title={`${phase.name} — en az ${phase.minMinutes} dk`}>
                <Table rowKey="id" size="small" columns={stepColumns} dataSource={phase.steps} pagination={false} />
              </Card>
            ))}
          </Flex>
        </Card>
      )}
    </Flex>
  );
}
