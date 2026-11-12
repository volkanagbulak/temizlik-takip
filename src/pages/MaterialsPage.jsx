// src/pages/MaterialsPage.jsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button, Card, DatePicker, Flex, Form, Input, Modal, Table, Tag } from "antd";
import { getDefinitionsApi } from "../api/definitionApi";
import { addMaterialApi, addMaterialLotApi } from "../api/materialApi";
import { useAction } from "../hooks/useAction";
import { isExpired } from "../utils/time";

// Malzemenin kodu, lotu ve son kullanma tarihi kayıtta geriye dönük görülebilmeli.
// Lotlar silinmiyor, yeni lot ekleniyor. SKT'si geçen lot yeni kayıtta seçilemiyor.
export function MaterialsPage() {
  const { refreshKey } = useOutletContext();
  const { run, pending } = useAction();
  const [form] = Form.useForm();
  const [newForm] = Form.useForm();
  const [definitions, setDefinitions] = useState(null);
  const [material, setMaterial] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = () => getDefinitionsApi().then(setDefinitions);

  useEffect(() => {
    getDefinitionsApi().then(setDefinitions);
  }, [refreshKey]);

  if (!definitions) return null;

  async function handleAdd(values) {
    const lot = { lot: values.lot, expiry: values.expiry.format("YYYY-MM-DD") };
    const result = await run(() => addMaterialLotApi(material.id, lot), { success: `${material.code} için ${values.lot} eklendi.`, onSettled: load });
    if (result.ok) {
      setMaterial(null);
      form.resetFields();
    }
  }

  async function handleCreate(values) {
    const result = await run(() => addMaterialApi(values), { success: `${values.code.toUpperCase()} eklendi. Şimdi lotunu ekleyebilirsin.`, onSettled: load });
    if (result.ok) {
      setAdding(false);
      newForm.resetFields();
    }
  }

  const columns = [
    { title: "Kod", dataIndex: "code" },
    { title: "Ad", dataIndex: "name" },
    {
      title: "Lotlar",
      render: (_, m) => (
        <Flex gap={4} wrap>
          {m.lots.map((l) => (
            <Tag key={l.lot} color={isExpired(l.expiry) ? "red" : "default"}>
              {l.lot} · SKT {l.expiry}
              {isExpired(l.expiry) ? " · süresi geçmiş" : ""}
            </Tag>
          ))}
        </Flex>
      ),
    },
    {
      title: "",
      render: (_, m) => (
        <Button size="small" onClick={() => setMaterial(m)}>
          Lot ekle
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Malzemeler"
      extra={
        <Button type="primary" onClick={() => setAdding(true)}>
          Malzeme ekle
        </Button>
      }
    >
      <Table rowKey="id" columns={columns} dataSource={definitions.materials} pagination={false} scroll={{ x: true }} />
      <Modal
        title={material ? `${material.code} ${material.name} — lot ekle` : ""}
        open={Boolean(material)}
        okText="Ekle"
        okButtonProps={{ loading: pending }}
        onOk={() => form.submit()}
        onCancel={() => setMaterial(null)}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="lot" label="Parti / lot numarası" rules={[{ required: true, whitespace: true, message: "Lot zorunlu" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="expiry" label="Son kullanma tarihi" rules={[{ required: true, message: "SKT zorunlu" }]}>
            <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="Malzeme ekle" open={adding} okText="Ekle" okButtonProps={{ loading: pending }} onOk={() => newForm.submit()} onCancel={() => setAdding(false)}>
        <Form form={newForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="code" label="Malzeme kodu" extra="Kayıtlarda bu kodla görünür, benzersiz olmalı." rules={[{ required: true, whitespace: true, message: "Kod zorunlu" }]}>
            <Input placeholder="Örn. TM-520" />
          </Form.Item>
          <Form.Item name="name" label="Malzeme adı" rules={[{ required: true, whitespace: true, message: "Ad zorunlu" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
