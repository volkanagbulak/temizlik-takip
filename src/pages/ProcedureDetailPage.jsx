// src/pages/ProcedureDetailPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Alert, Button, Card, Flex, Form, Input, Modal, Result, Select, Switch, Table, Tag, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { getDefinitionsApi } from "../api/definitionApi";
import { createProcedureVersionApi, setProcedureMachinesApi } from "../api/procedureApi";
import { PhasesEditor } from "../components/PhasesEditor";
import { StepMedia } from "../components/StepMedia";
import { useAction } from "../hooks/useAction";

const formatDate = (time) => (time ? new Date(time).toLocaleString("tr-TR") : "—");

// Tanım değişince eski versiyon değiştirilmiyor, yeni versiyon ekleniyor. Geçmiş kayıtlar
// prosedürün o günkü kopyasını taşıdığı için açıldıkları günkü tanımı göstermeye devam ediyor.
export function ProcedureDetailPage() {
  const { procedureId } = useParams();
  const { refreshKey } = useOutletContext();
  const navigate = useNavigate();
  const { run, pending } = useAction();
  const [definitions, setDefinitions] = useState(null);
  // null: güncel versiyon gösteriliyor.
  const [versionNo, setVersionNo] = useState(null);
  const [editing, setEditing] = useState(false);
  // null: pencere kapalı, dizi: pencerede seçili makineler.
  const [machineDraft, setMachineDraft] = useState(null);

  const load = () => getDefinitionsApi().then(setDefinitions);

  useEffect(() => {
    getDefinitionsApi().then(setDefinitions);
  }, [refreshKey]);

  if (!definitions) return null;

  const procedure = definitions.procedures.find((p) => p.id === procedureId);
  if (!procedure) {
    return <Result status="404" title="Prosedür bulunamadı" extra={<Button onClick={() => navigate("/procedures")}>Prosedürlere dön</Button>} />;
  }

  const latest = procedure.versions.at(-1);
  const shown = procedure.versions.find((v) => v.version === versionNo) ?? latest;
  const userName = (id) => definitions.users.find((u) => u.id === id)?.name ?? "—";
  const machineCodes = definitions.machines.filter((m) => procedure.machineIds.includes(m.id)).map((m) => m.code);

  // Düzenleme güncel versiyonun kopyasıyla başlıyor. Kimlikler gizli alanda taşınıyor.
  const initialValues = {
    note: "",
    materialRequired: latest.materialRequired,
    phases: latest.phases.map((phase) => ({
      id: phase.id,
      name: phase.name,
      minMinutes: phase.minMinutes,
      steps: phase.steps.map((s) => ({ id: s.id, title: s.title, description: s.description, media: s.media ?? null })),
    })),
  };

  // Bağlı ama kullanımdan kaldırılmış makine listede kalıyor, yeni seçilemiyor.
  const machineOptions = definitions.machines
    .filter((m) => m.active || procedure.machineIds.includes(m.id))
    .map((m) => ({ value: m.id, label: m.active ? `${m.code} ${m.name}` : `${m.code} ${m.name} (kullanımda değil)` }));

  async function handleMachinesSave() {
    const result = await run(() => setProcedureMachinesApi(procedure.id, machineDraft), {
      success: `${procedure.code} makineleri güncellendi.`,
      onSettled: load,
    });
    if (result.ok) setMachineDraft(null);
  }

  async function handleSave(values) {
    const payload = { baseVersion: latest.version, note: values.note, materialRequired: values.materialRequired, phases: values.phases };
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
    { title: "Görsel / video", width: 140, render: (_, step) => (step.media ? <StepMedia src={step.media} width={120} compact /> : "—") },
  ];

  return (
    <Flex vertical gap={16}>
      <Card>
        <Flex gap={16} align="center" wrap>
          <Button icon={<ArrowLeftOutlined />} disabled={editing} onClick={() => navigate("/procedures")}>
            Prosedürler
          </Button>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {procedure.code} {procedure.name}
          </Typography.Title>
          <Tag color={procedure.category === "emergency" ? "red" : "blue"}>{procedure.category === "emergency" ? "Acil" : "Normal"}</Tag>
          <Button size="small" disabled={editing} onClick={() => setMachineDraft(procedure.machineIds)} style={{ marginLeft: "auto" }}>
            Makineleri düzenle
          </Button>
        </Flex>
        <Typography.Text type="secondary" style={{ display: "block", marginTop: 12 }}>
          Makineler: {machineCodes.join(", ") || "—"}
        </Typography.Text>
      </Card>

      <Modal
        open={machineDraft !== null}
        title={`${procedure.code} makineleri`}
        okText="Kaydet"
        okButtonProps={{ loading: pending, disabled: machineDraft?.length === 0 }}
        onOk={handleMachinesSave}
        onCancel={() => setMachineDraft(null)}
      >
        <Typography.Paragraph type="secondary">Yeni kayıt açılırken bu prosedür seçilen makinelerde listelenir. Açık kayıtlar etkilenmez.</Typography.Paragraph>
        <Select mode="multiple" optionFilterProp="label" value={machineDraft ?? []} onChange={setMachineDraft} options={machineOptions} style={{ width: "100%" }} />
      </Modal>

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
            <PhasesEditor />
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
            <Alert type="warning" title="Eski versiyonu görüntülüyorsun. Bu versiyonla açılmış kayıtlar bu tanımı gösterir." style={{ marginBottom: 16 }} />
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
