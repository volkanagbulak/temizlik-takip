// src/pages/MachinesPage.jsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button, Card, Form, Input, Modal, Select, Table, Tag } from "antd";
import { getDefinitionsApi } from "../api/definitionApi";
import { addMachineApi, getMachinesApi, setMachineActiveApi } from "../api/machineApi";
import { useAction } from "../hooks/useAction";

// Tanımlar ve makinelerin dolu/boş bilgisi birlikte okunuyor.
const loadPage = () =>
  Promise.all([getDefinitionsApi(), getMachinesApi()]).then(([definitions, machines]) => ({
    definitions,
    locks: Object.fromEntries(machines.map((m) => [m.id, m.lock])),
  }));

// Makine silinmiyor, kullanımdan kaldırılıyor. Böylece eski kayıtlar makineyi göstermeye devam ediyor.
export function MachinesPage() {
  const { refreshKey } = useOutletContext();
  const { run, pending } = useAction();
  const [form] = Form.useForm();
  const [data, setData] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = () => loadPage().then(setData);

  useEffect(() => {
    loadPage().then(setData);
  }, [refreshKey]);

  if (!data) return null;

  const { definitions, locks } = data;
  const lineName = (id) => definitions.lines.find((l) => l.id === id)?.name;
  const proceduresOf = (machineId) => definitions.procedures.filter((p) => p.machineIds.includes(machineId));

  function toggleActive(machine) {
    run(() => setMachineActiveApi(machine.id, !machine.active), {
      success: machine.active ? `${machine.code} kullanımdan kaldırıldı.` : `${machine.code} yeniden kullanımda.`,
      onSettled: load,
    });
  }

  async function handleAdd(values) {
    const result = await run(() => addMachineApi(values), { success: `${values.code.toUpperCase()} eklendi.`, onSettled: load });
    if (result.ok) {
      setAdding(false);
      form.resetFields();
    }
  }

  const columns = [
    { title: "Kod", dataIndex: "code" },
    { title: "Ad", dataIndex: "name" },
    { title: "Hat", render: (_, m) => lineName(m.lineId) },
    { title: "Formlar", render: (_, m) => proceduresOf(m.id).map((p) => <Tag key={p.id}>{p.code}</Tag>) },
    {
      title: "Durum",
      render: (_, m) => {
        if (!m.active) return <Tag>Kullanımda değil</Tag>;
        if (locks[m.id]) return <Tag color="blue">{locks[m.id].recordNo} açık</Tag>;
        return <Tag color="green">Boş</Tag>;
      },
    },
    {
      title: "",
      render: (_, m) => (
        // Açık kaydı olan makine kaldırılamıyor. Buton gizlenmiyor, karar serviste.
        <Button size="small" danger={m.active} disabled={pending} onClick={() => toggleActive(m)}>
          {m.active ? "Kullanımdan kaldır" : "Geri al"}
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Makineler"
      extra={
        <Button type="primary" onClick={() => setAdding(true)}>
          Makine ekle
        </Button>
      }
    >
      <Table rowKey="id" columns={columns} dataSource={definitions.machines} pagination={false} scroll={{ x: true }} />
      <Modal title="Makine ekle" open={adding} okText="Ekle" okButtonProps={{ loading: pending }} onOk={() => form.submit()} onCancel={() => setAdding(false)}>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="lineId" label="Tesis / hat" rules={[{ required: true, message: "Hat seç" }]}>
            <Select options={definitions.lines.map((l) => ({ value: l.id, label: l.name }))} />
          </Form.Item>
          <Form.Item name="code" label="Makine kodu" extra="Kayıt numarasında kullanılır, benzersiz olmalı." rules={[{ required: true, whitespace: true, message: "Kod zorunlu" }]}>
            <Input placeholder="Örn. KRS04" />
          </Form.Item>
          <Form.Item name="name" label="Makine adı" rules={[{ required: true, whitespace: true, message: "Ad zorunlu" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="procedureIds" label="Kullanılabilecek formlar">
            <Select mode="multiple" optionFilterProp="label" options={definitions.procedures.map((p) => ({ value: p.id, label: `${p.code} ${p.name}` }))} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
