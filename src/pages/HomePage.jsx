// src/pages/HomePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button, Card, Empty, Flex, Table, Tag } from "antd";
import { getRecordsApi } from "../api/cleaningApi";
import { CancelRecordModal } from "../components/CancelRecordModal";
import { StatusTag } from "../components/StatusTag";

// Yarım kalan iş otomatik kapanmıyor. Kişi buradan kaldığı yerden devam ediyor.
const isOpen = (record) =>
  record.status === "opened" || record.status === "in_progress";

const isMine = (record, user) =>
  record.ownerId === user.id || record.helperIds.includes(user.id);

export function HomePage({ user }) {
  const navigate = useNavigate();
  const { refreshKey } = useOutletContext();
  const [records, setRecords] = useState([]);
  const [closing, setClosing] = useState(null);

  useEffect(() => {
    getRecordsApi().then(setRecords);
  }, [refreshKey]);

  function handleCancelled() {
    setClosing(null);
    getRecordsApi().then(setRecords);
  }

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
        <Flex gap={8}>
          <Button type="primary" onClick={() => navigate(`/records/${r.id}/run`)}>
            Devam et
          </Button>
          {/* Yanlış açılan kaydı sahibi, adım başlamadan kapatabiliyor. */}
          {r.ownerId === user.id && r.status === "opened" && (
            <Button danger onClick={() => setClosing(r)}>
              Kapat
            </Button>
          )}
        </Flex>
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
      {closing && <CancelRecordModal record={closing} onClose={() => setClosing(null)} onDone={handleCancelled} />}
    </Card>
  );
}
