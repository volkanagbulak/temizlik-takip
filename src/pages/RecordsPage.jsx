// src/pages/RecordsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Flex, Input, Segmented, Select, Table, Tag } from "antd";
import { getRecordsApi } from "../api/cleaningApi";
import { StatusTag } from "../components/StatusTag";

const STATUS_OPTIONS = [
  { value: "opened", label: "Açıldı" },
  { value: "in_progress", label: "Devam ediyor" },
  { value: "completed", label: "Tamamlandı" },
  { value: "cancelled", label: "Kapatıldı" },
];

const formatDate = (time) => new Date(time).toLocaleString("tr-TR");

// Kişi başkasının kaydını görebilir ama görmek çalıştırmak demek değil.
// Bu yüzden burada "Devam et" yok, yalnızca "Detay" var.
export function RecordsPage({ user }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [scope, setScope] = useState("mine");
  const [status, setStatus] = useState();
  const [search, setSearch] = useState("");

  useEffect(() => {
    getRecordsApi().then(setRecords);
  }, []);

  const text = search.trim().toLowerCase();
  const filtered = records.filter((r) => {
    const mine = r.ownerId === user.id || r.helperIds.includes(user.id);
    if (scope === "mine" && !mine) return false;
    if (status && r.status !== status) return false;
    const searchable = `${r.no} ${r.machine.code} ${r.machine.name} ${r.workOrder}`;
    return searchable.toLowerCase().includes(text);
  });

  const columns = [
    { title: "Kayıt no", dataIndex: "no" },
    {
      title: "Tür",
      render: (_, r) =>
        r.category === "emergency" ? <Tag color="red">Acil</Tag> : <Tag>Normal</Tag>,
    },
    { title: "Makine", render: (_, r) => r.machine.name },
    { title: "Form", render: (_, r) => `${r.procedure.code} v${r.procedure.version}` },
    { title: "İş emri", dataIndex: "workOrder" },
    { title: "Açılış", render: (_, r) => formatDate(r.openedAt) },
    { title: "Durum", render: (_, r) => <StatusTag status={r.status} /> },
    {
      title: "",
      render: (_, r) => (
        <Button onClick={() => navigate(`/records/${r.id}`)}>Detay</Button>
      ),
    },
  ];

  return (
    <Card title="Kayıtlar">
      <Flex wrap gap={12} style={{ marginBottom: 16 }}>
        <Segmented
          value={scope}
          onChange={setScope}
          options={[
            { value: "mine", label: "Kayıtlarım" },
            { value: "all", label: "Tümü" },
          ]}
        />
        <Select
          allowClear
          placeholder="Durum"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          style={{ width: 180 }}
        />
        <Input.Search
          allowClear
          placeholder="Kayıt no, makine veya iş emri"
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
      </Flex>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        scroll={{ x: true }}
      />
    </Card>
  );
}
