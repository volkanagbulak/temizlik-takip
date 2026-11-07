// src/pages/ReportsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button, Card, Col, Flex, Progress, Row, Statistic, Table, Tag, Typography } from "antd";
import { getReportApi } from "../api/reportApi";
import { formatShort } from "../utils/time";

const formatDate = (time) => new Date(time).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
// Süre ve tarih sütunları satır atlamasın, dar ekranda tablo yana kaysın.
const nowrap = { onCell: () => ({ style: { whiteSpace: "nowrap" } }) };

// Hesaplamayı servis yapıyor, sayfa yalnızca gösteriyor. Yalnızca tamamlanmış kayıtlar sayılıyor,
// çünkü yarım ya da kapatılmış kayıt ortalama süreyi yanıltır.
export function ReportsPage() {
  const { refreshKey } = useOutletContext();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);

  useEffect(() => {
    getReportApi().then(setReport);
  }, [refreshKey]);

  if (!report) return null;

  const { totals, byMachine, byPhase, records } = report;
  // Çubuklar en uzun ortalamaya göre ölçekleniyor, makineler göz kararı karşılaştırılabilsin.
  const longest = Math.max(1, ...byMachine.map((m) => m.avgWorkMs));

  const machineColumns = [
    { ...nowrap, title: "Makine", render: (_, m) => `${m.code} ${m.name}` },
    { title: "Form", render: (_, m) => (m.category === "emergency" ? <Tag color="red">{m.procedureCode} acil</Tag> : m.procedureCode) },
    { title: "Tamamlanan", dataIndex: "count" },
    {
      title: "Ortalama gerçek çalışma",
      width: 260,
      render: (_, m) => (
        <Flex vertical>
          <span>{formatShort(m.avgWorkMs)}</span>
          <Progress percent={Math.round((m.avgWorkMs / longest) * 100)} showInfo={false} size="small" />
        </Flex>
      ),
    },
    { ...nowrap, title: "En kısa – en uzun", render: (_, m) => `${formatShort(m.minWorkMs)} – ${formatShort(m.maxWorkMs)}` },
    { ...nowrap, title: "Ortalama efor", render: (_, m) => formatShort(m.avgEffortMs) },
    { ...nowrap, title: "Ortalama ara", render: (_, m) => formatShort(m.avgGapMs) },
    { title: "Sapma", render: (_, m) => (m.deviations ? <Tag color="red">{m.deviations}</Tag> : 0) },
  ];

  const phaseColumns = [
    { title: "Form", dataIndex: "procedureCode" },
    { title: "Faz", dataIndex: "phaseName" },
    { title: "Kayıt", dataIndex: "count" },
    { ...nowrap, title: "Ortalama gerçek çalışma", render: (_, p) => formatShort(p.avgWorkMs) },
    // Versiyon değiştiyse fazın birden fazla minimum süresi olabilir.
    { title: "Minimum", render: (_, p) => `${p.minMinutes.join(" / ")} dk` },
    {
      title: "Minimuma göre",
      width: 220,
      render: (_, p) => {
        const ratio = Math.round((p.avgWorkMs / (Math.max(...p.minMinutes) * 60000)) * 100);
        return <Progress percent={Math.min(ratio, 100)} format={() => `%${ratio}`} status={ratio < 100 ? "exception" : "success"} size="small" />;
      },
    },
    { title: "Minimumun altında", render: (_, p) => (p.belowMin ? <Tag color="red">{p.belowMin} kayıt</Tag> : 0) },
  ];

  const recordColumns = [
    { ...nowrap, title: "Kayıt no", dataIndex: "no" },
    { title: "Tür", render: (_, r) => (r.category === "emergency" ? <Tag color="red">Acil</Tag> : <Tag>Normal</Tag>) },
    { title: "Makine", dataIndex: "machineCode" },
    { title: "Form", dataIndex: "procedure" },
    { ...nowrap, title: "Tamamlanma", render: (_, r) => formatDate(r.completedAt) },
    { ...nowrap, title: "Gerçek çalışma", render: (_, r) => formatShort(r.workMs) },
    { ...nowrap, title: "Efor", render: (_, r) => formatShort(r.effortMs) },
    { ...nowrap, title: "Ara", render: (_, r) => formatShort(r.gapMs) },
    { title: "Sapma", render: (_, r) => (r.deviations ? <Tag color="red">{r.deviations}</Tag> : "—") },
    { title: "", render: (_, r) => <Button size="small" onClick={() => navigate(`/records/${r.id}`)}>Detay</Button> },
  ];

  return (
    <Flex vertical gap={16}>
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Tamamlanan temizlik" value={totals.completed} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Bunlardan acil" value={totals.emergency} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Açık kayıt" value={totals.open} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Kapatılan kayıt" value={totals.cancelled} />
          </Card>
        </Col>
      </Row>

      <Card title="Makine ve form bazında süreler">
        <Typography.Paragraph type="secondary">Bu makinenin temizliği gerçekte ne kadar sürüyor? Gerçek çalışma, duraklatmalar ve aralar hariç süredir.</Typography.Paragraph>
        <Table rowKey="key" columns={machineColumns} dataSource={byMachine} pagination={false} scroll={{ x: true }} />
      </Card>

      <Card title="Faz bazında süreler">
        <Typography.Paragraph type="secondary">Hangi aşama uzun sürüyor, hangisi minimum sürenin altında kalıyor?</Typography.Paragraph>
        <Table rowKey="key" columns={phaseColumns} dataSource={byPhase} pagination={false} scroll={{ x: true }} />
      </Card>

      <Card title="Tamamlanan kayıtlar">
        <Table rowKey="id" size="small" columns={recordColumns} dataSource={records} pagination={{ pageSize: 10 }} scroll={{ x: true }} />
      </Card>
    </Flex>
  );
}
