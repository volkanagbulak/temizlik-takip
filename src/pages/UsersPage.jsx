// src/pages/UsersPage.jsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button, Card, Form, Input, Modal, Select, Table, Tag } from "antd";
import { getDefinitionsApi } from "../api/definitionApi";
import { addUserApi, setUserActiveApi } from "../api/userApi";
import { useAction } from "../hooks/useAction";

const ROLES = [
  { value: "operator", label: "Operatör" },
  { value: "admin", label: "Yönetici" },
];

// Personel silinmiyor, pasife alınıyor. Geçmiş kayıtlarda adı görünmeye devam ediyor.
export function UsersPage() {
  const { refreshKey } = useOutletContext();
  const { run, pending } = useAction();
  const [form] = Form.useForm();
  const [users, setUsers] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = () => getDefinitionsApi().then((d) => setUsers(d.users));

  useEffect(() => {
    getDefinitionsApi().then((d) => setUsers(d.users));
  }, [refreshKey]);

  if (!users) return null;

  function toggleActive(person) {
    run(() => setUserActiveApi(person.id, !person.active), {
      success: person.active ? `${person.name} pasife alındı.` : `${person.name} aktif edildi.`,
      onSettled: load,
    });
  }

  async function handleAdd(values) {
    const result = await run(() => addUserApi(values), { success: `${values.name} eklendi.`, onSettled: load });
    if (result.ok) {
      setAdding(false);
      form.resetFields();
    }
  }

  const columns = [
    { title: "Ad soyad", dataIndex: "name" },
    { title: "Rol", render: (_, u) => (u.role === "admin" ? <Tag color="blue">Yönetici</Tag> : <Tag>Operatör</Tag>) },
    { title: "Durum", render: (_, u) => (u.active ? <Tag color="green">Aktif</Tag> : <Tag>Pasif</Tag>) },
    {
      title: "",
      render: (_, u) => (
        // Kendini pasife alma ve çalışan kişiyi pasife alma kuralı serviste.
        <Button size="small" danger={u.active} disabled={pending} onClick={() => toggleActive(u)}>
          {u.active ? "Pasife al" : "Aktif et"}
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Personel"
      extra={
        <Button type="primary" onClick={() => setAdding(true)}>
          Personel ekle
        </Button>
      }
    >
      <Table rowKey="id" columns={columns} dataSource={users} pagination={false} scroll={{ x: true }} />
      <Modal title="Personel ekle" open={adding} okText="Ekle" okButtonProps={{ loading: pending }} onOk={() => form.submit()} onCancel={() => setAdding(false)}>
        <Form form={form} layout="vertical" onFinish={handleAdd} initialValues={{ role: "operator" }}>
          <Form.Item name="name" label="Ad soyad" rules={[{ required: true, whitespace: true, message: "Ad zorunlu" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Rol" rules={[{ required: true, message: "Rol seç" }]}>
            <Select options={ROLES} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
