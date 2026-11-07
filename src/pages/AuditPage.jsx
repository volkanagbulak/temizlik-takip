// src/pages/AuditPage.jsx
import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Card, Segmented, Table } from "antd";
import { getAuditLogApi } from "../api/auditApi";
import { getDefinitionsApi } from "../api/definitionApi";

const formatDate = (time) => new Date(time).toLocaleString("tr-TR");

const loadPage = () => Promise.all([getAuditLogApi(), getDefinitionsApi()]).then(([logs, definitions]) => ({ logs, users: definitions.users }));

// Kayıt işlemleri kayıt detayında da görünüyor. Tanım işlemleri (prosedür, makine, lot) hiçbir
// kayda bağlı olmadığı için kim, ne zaman, ne yaptı sorusunun cevabı bu sayfada.
export function AuditPage() {
  const { refreshKey } = useOutletContext();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("definitions");

  useEffect(() => {
    loadPage().then(setData);
  }, [refreshKey]);

  if (!data) return null;

  const userName = (id) => (id === "system" ? "Sistem" : (data.users.find((u) => u.id === id)?.name ?? id));
  const logs = filter === "definitions" ? data.logs.filter((l) => !l.recordId) : filter === "records" ? data.logs.filter((l) => l.recordId) : data.logs;

  const columns = [
    { title: "Zaman", render: (_, l) => formatDate(l.at), width: 180 },
    { title: "Kim", render: (_, l) => userName(l.userId) },
    { title: "İşlem", dataIndex: "action" },
    { title: "Detay", dataIndex: "detail" },
    { title: "Kayıt", render: (_, l) => (l.recordId ? <Link to={`/records/${l.recordId}`}>{l.recordNo}</Link> : "—") },
  ];

  return (
    <Card
      title="Denetim izi"
      extra={
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "definitions", label: "Tanım işlemleri" },
            { value: "records", label: "Kayıt işlemleri" },
            { value: "all", label: "Tümü" },
          ]}
        />
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={logs}
        scroll={{ x: true }}
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: "İşlem yok" }}
      />
    </Card>
  );
}
