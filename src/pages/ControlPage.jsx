// src/pages/ControlPage.jsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button, Card, Flex, Table, Tag } from "antd";
import { getDefinitionsApi, getRecordsApi } from "../api/cleaningApi";
import { CancelRecordModal } from "../components/CancelRecordModal";
import { StatusTag } from "../components/StatusTag";

const IDLE_LIMIT = 8 * 60 * 60 * 1000;

const formatDate = (time) => new Date(time).toLocaleString("tr-TR");

// Kayıtta en son işlem yapılan zaman: açılış, adım başlangıç/bitişleri ve duraklatmalar.
function lastActivity(record) {
  const times = record.steps.flatMap((s) => [...s.sessions.flatMap((x) => [x.start, x.end ?? 0]), ...s.pauses.map((p) => p.at)]);
  return Math.max(record.openedAt, ...times);
}

// Sonsuz kilit kalmasın diye yöneticiye müdahale gereken kayıtları gösteriyorum.
// 8 saat bizim varsayımımız.
function getIssue(record, users, now) {
  const owner = users.find((u) => u.id === record.ownerId);
  if (!owner.active) return "Sahibi aktif değil";
  if (record.status === "opened" && now > record.reservedUntil) return "Rezervasyon süresi doldu";
  if (now - lastActivity(record) > IDLE_LIMIT) return "8 saattir işlem yok";
  return null;
}

const loadData = () => Promise.all([getRecordsApi(), getDefinitionsApi()]).then(([records, definitions]) => ({ records, users: definitions.users }));

export function ControlPage() {
  const { refreshKey } = useOutletContext();
  const [data, setData] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [closing, setClosing] = useState(null);

  useEffect(() => {
    loadData().then(setData);
  }, [refreshKey]);

  // Rezervasyon ve 8 saat kontrolü sayfa açık kaldıkça güncellensin.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  if (!data) return null;

  const { records, users } = data;
  const openRecords = records.filter((r) => r.status === "opened" || r.status === "in_progress");
  const issues = openRecords.flatMap((r) => {
    const issue = getIssue(r, users, now);
    return issue ? [{ ...r, issue }] : [];
  });

  const columns = [
    { title: "Kayıt no", dataIndex: "no" },
    { title: "Makine", render: (_, r) => r.machine.name },
    { title: "Sorumlu", render: (_, r) => users.find((u) => u.id === r.ownerId).name },
    { title: "Durum", render: (_, r) => <StatusTag status={r.status} /> },
    { title: "Son işlem", render: (_, r) => formatDate(lastActivity(r)) },
    {
      title: "",
      render: (_, r) => (
        <Button danger onClick={() => setClosing(r)}>
          Kaydı kapat
        </Button>
      ),
    },
  ];
  const issueColumns = [columns[0], { title: "Neden", render: (_, r) => <Tag color="red">{r.issue}</Tag> }, ...columns.slice(1)];

  function handleCancelled() {
    setClosing(null);
    loadData().then(setData);
  }

  return (
    <Flex vertical gap={16}>
      <Card title="Müdahale bekleyenler">
        <Table rowKey="id" columns={issueColumns} dataSource={issues} pagination={false} scroll={{ x: true }} locale={{ emptyText: "Müdahale bekleyen kayıt yok" }} />
      </Card>
      <Card title="Açık kayıtlar">
        <Table rowKey="id" columns={columns} dataSource={openRecords} pagination={false} scroll={{ x: true }} locale={{ emptyText: "Açık kayıt yok" }} />
      </Card>
      {closing && <CancelRecordModal record={closing} detailRequired onClose={() => setClosing(null)} onDone={handleCancelled} />}
    </Flex>
  );
}
