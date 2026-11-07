// src/pages/ProceduresPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button, Card, Table, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getDefinitionsApi } from "../api/definitionApi";

const formatDate = (time) => (time ? new Date(time).toLocaleString("tr-TR") : "—");

// Prosedürlerin listesi. Bir satıra tıklayınca versiyonlar ve adımlar detay sayfasında açılıyor.
export function ProceduresPage() {
  const { refreshKey } = useOutletContext();
  const navigate = useNavigate();
  const [definitions, setDefinitions] = useState(null);

  useEffect(() => {
    getDefinitionsApi().then(setDefinitions);
  }, [refreshKey]);

  if (!definitions) return null;

  const machineCodes = (procedure) =>
    definitions.machines
      .filter((m) => procedure.machineIds.includes(m.id))
      .map((m) => m.code)
      .join(", ") || "—";

  const columns = [
    { title: "Kod", dataIndex: "code", render: (code) => <span style={{ whiteSpace: "nowrap" }}>{code}</span> },
    { title: "Ad", dataIndex: "name" },
    { title: "Tür", render: (_, p) => (p.category === "emergency" ? <Tag color="red">Acil</Tag> : <Tag color="blue">Normal</Tag>) },
    { title: "Versiyon", render: (_, p) => `v${p.versions.at(-1).version}` },
    {
      title: "Faz / adım",
      render: (_, p) => {
        const { phases } = p.versions.at(-1);
        return `${phases.length} faz, ${phases.reduce((sum, phase) => sum + phase.steps.length, 0)} adım`;
      },
    },
    { title: "Makineler", render: (_, p) => machineCodes(p) },
    { title: "Son değişiklik", render: (_, p) => formatDate(p.versions.at(-1).createdAt) },
    {
      title: "",
      render: (_, p) => (
        <Button size="small" onClick={() => navigate(`/procedures/${p.id}`)}>
          Aç
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Prosedürler"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/procedures/new")}>
          Yeni prosedür
        </Button>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={definitions.procedures}
        pagination={false}
        scroll={{ x: true }}
        onRow={(p) => ({ onClick: () => navigate(`/procedures/${p.id}`), style: { cursor: "pointer" } })}
      />
    </Card>
  );
}
