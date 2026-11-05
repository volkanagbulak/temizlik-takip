// src/pages/HomePage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Empty, Table, Tag } from "antd";
import { getRecordsApi } from "../api/cleaningApi";
import { StatusTag } from "../components/StatusTag";

// Yarım kalan iş otomatik kapanmıyor. Kişi buradan kaldığı yerden devam ediyor.
const isOpen = (record) =>
  record.status === "opened" || record.status === "in_progress";

const isMine = (record, user) =>
  record.ownerId === user.id || record.helperIds.includes(user.id);

export function HomePage({ user }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);

  useEffect(() => {
    getRecordsApi().then(setRecords);
  }, []);

  const myRecords = records.filter((r) => isOpen(r) && isMine(r, user));

  const columns = [
    { title: "Kayıt no", dataIndex: "no" },
    { title: "Makine", render: (_, r) => r.machine.name },
    { title: "Form", render: (_, r) => r.procedure.name },
    {
      title: "Görev",
      render: (_, r) =>
        r.ownerId === user.id ? <Tag color="green">Sorumlu</Tag> : <Tag>Yardımcı</Tag>,
    },
    { title: "Durum", render: (_, r) => <StatusTag status={r.status} /> },
    {
      title: "",
      render: (_, r) => (
        <Button type="primary" onClick={() => navigate(`/records/${r.id}/run`)}>
          Devam et
        </Button>
      ),
    },
  ];

  return (
    <Card title="İşlerim">
      {myRecords.length === 0 ? (
        <Empty description="Açık işin yok">
          <Button type="primary" onClick={() => navigate("/records/new")}>
            Yeni kayıt aç
          </Button>
        </Empty>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={myRecords}
          pagination={false}
          scroll={{ x: true }}
        />
      )}
    </Card>
  );
}
