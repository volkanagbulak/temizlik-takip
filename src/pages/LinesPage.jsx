// src/pages/LinesPage.jsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button, Card, Flex, Form, Input, Modal, Select, Table } from "antd";
import { getDefinitionsApi } from "../api/definitionApi";
import { addFacilityApi, addLineApi } from "../api/lineApi";
import { useAction } from "../hooks/useAction";

// Tesis ve hat kodları kayıt numarasında kullanılıyor (GEB-H1-KRS01-...).
export function LinesPage() {
  const { refreshKey } = useOutletContext();
  const { run, pending } = useAction();
  const [facilityForm] = Form.useForm();
  const [lineForm] = Form.useForm();
  const [definitions, setDefinitions] = useState(null);
  // "facility" | "line" | null
  const [modal, setModal] = useState(null);

  const load = () => getDefinitionsApi().then(setDefinitions);

  useEffect(() => {
    getDefinitionsApi().then(setDefinitions);
  }, [refreshKey]);

  if (!definitions) return null;

  const { facilities, lines, machines } = definitions;
  const facilityOf = (id) => facilities.find((f) => f.id === id);

  async function handleFacility(values) {
    const result = await run(() => addFacilityApi(values), { success: `${values.code.toUpperCase()} eklendi.`, onSettled: load });
    if (result.ok) {
      setModal(null);
      facilityForm.resetFields();
    }
  }

  async function handleLine(values) {
    const result = await run(() => addLineApi(values), { success: `${values.name} eklendi.`, onSettled: load });
    if (result.ok) {
      setModal(null);
      lineForm.resetFields();
    }
  }

  const facilityColumns = [
    { title: "Kod", dataIndex: "code" },
    { title: "Ad", dataIndex: "name" },
    { title: "Hat sayısı", render: (_, f) => lines.filter((l) => l.facilityId === f.id).length },
  ];

  const lineColumns = [
    { title: "Tesis", render: (_, l) => facilityOf(l.facilityId)?.name },
    { title: "Kod", dataIndex: "code" },
    { title: "Ad", dataIndex: "name" },
    { title: "Makine sayısı", render: (_, l) => machines.filter((m) => m.lineId === l.id).length },
  ];

  return (
    <Flex vertical gap={16}>
      <Card
        title="Tesisler"
        extra={
          <Button type="primary" onClick={() => setModal("facility")}>
            Tesis ekle
          </Button>
        }
      >
        <Table rowKey="id" columns={facilityColumns} dataSource={facilities} pagination={false} scroll={{ x: true }} />
      </Card>
      <Card
        title="Hatlar"
        extra={
          <Button type="primary" onClick={() => setModal("line")}>
            Hat ekle
          </Button>
        }
      >
        <Table rowKey="id" columns={lineColumns} dataSource={lines} pagination={false} scroll={{ x: true }} />
      </Card>

      <Modal title="Tesis ekle" open={modal === "facility"} okText="Ekle" okButtonProps={{ loading: pending }} onOk={() => facilityForm.submit()} onCancel={() => setModal(null)}>
        <Form form={facilityForm} layout="vertical" onFinish={handleFacility}>
          <Form.Item name="code" label="Tesis kodu" extra="Kayıt numarasında kullanılır, benzersiz olmalı." rules={[{ required: true, whitespace: true, message: "Kod zorunlu" }]}>
            <Input placeholder="Örn. IZM" />
          </Form.Item>
          <Form.Item name="name" label="Tesis adı" rules={[{ required: true, whitespace: true, message: "Ad zorunlu" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Hat ekle" open={modal === "line"} okText="Ekle" okButtonProps={{ loading: pending }} onOk={() => lineForm.submit()} onCancel={() => setModal(null)}>
        <Form form={lineForm} layout="vertical" onFinish={handleLine}>
          <Form.Item name="facilityId" label="Tesis" rules={[{ required: true, message: "Tesis seç" }]}>
            <Select options={facilities.map((f) => ({ value: f.id, label: `${f.code} ${f.name}` }))} />
          </Form.Item>
          <Form.Item name="code" label="Hat kodu" extra="Kayıt numarasında kullanılır, tesis içinde benzersiz olmalı." rules={[{ required: true, whitespace: true, message: "Kod zorunlu" }]}>
            <Input placeholder="Örn. H5" />
          </Form.Item>
          <Form.Item name="name" label="Hat adı" rules={[{ required: true, whitespace: true, message: "Ad zorunlu" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  );
}
