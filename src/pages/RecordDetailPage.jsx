// src/pages/RecordDetailPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Alert, Button, Card, Col, Descriptions, Flex, Result, Row, Statistic, Table, Tag } from "antd";
import { getRecordDetailApi } from "../api/recordApi";
import { StatusTag } from "../components/StatusTag";
import { formatDuration, phaseStats, recordStats, stepEffortMs, stepWorkMs } from "../utils/time";

const formatDate = (time) => (time ? new Date(time).toLocaleString("tr-TR") : "—");
const formatTime = (time) => (time ? new Date(time).toLocaleTimeString("tr-TR") : "…");

// Vakanın "kayıtta görmek istediğimiz" listesinin tamamı bu sayfada. Sayfa yalnızca okuyor:
// kayıtta sonradan değişiklik yapan hiçbir işlem yok, zamanları sistem yazıyor.
export function RecordDetailPage() {
  const { recordId } = useParams();
  const { refreshKey } = useOutletContext();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [missing, setMissing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    getRecordDetailApi(recordId)
      .then((data) => {
        setDetail(data);
        setMissing(false);
      })
      .catch(() => setMissing(true));
  }, [recordId, refreshKey]);

  // Kayıt devam ediyorsa süreler canlı aksın.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (missing) {
    return <Result status="404" title="Kayıt bulunamadı" extra={<Button onClick={() => navigate("/records")}>Kayıtlara dön</Button>} />;
  }
  if (!detail) return null;

  const { record, auditLog, users, latestVersion } = detail;
  const userName = (id) => (id === "system" ? "Sistem" : (users.find((u) => u.id === id)?.name ?? id));
  const names = (ids) => ids.map(userName).join(", ");
  const endAt = record.completedAt ?? record.cancel?.at ?? now;
  const stats = recordStats(record, endAt);
  const isOpen = record.status === "opened" || record.status === "in_progress";

  const info = [
    { key: "no", label: "Kayıt no", children: record.no },
    { key: "type", label: "Tür", children: record.category === "emergency" ? <Tag color="red">Acil müdahale</Tag> : <Tag>Normal temizlik</Tag> },
    { key: "status", label: "Durum", children: <StatusTag status={record.status} /> },
    { key: "field", label: "Saha referansı", children: record.fieldRef ?? "Yok (acil kayıt saha defterine işlenmez)" },
    { key: "facility", label: "Tesis", children: record.machine.facilityName },
    { key: "line", label: "Hat", children: record.machine.lineName },
    { key: "machine", label: "Makine", children: `${record.machine.code} ${record.machine.name}` },
    {
      key: "procedure",
      label: "Prosedür",
      children: (
        <>
          {record.procedure.code} {record.procedure.name} v{record.procedure.version}{" "}
          {record.procedure.version !== latestVersion && <Tag color="orange">Güncel versiyon v{latestVersion}</Tag>}
        </>
      ),
    },
    { key: "workOrder", label: "Üretim iş emri", children: record.workOrder },
    { key: "owner", label: "Sorumlu (kaydı açan)", children: userName(record.ownerId) },
    { key: "helpers", label: "Yardımcılar", children: record.helperIds.length ? names(record.helperIds) : "—" },
    { key: "opened", label: "Kayıt açılışı", children: formatDate(record.openedAt) },
    { key: "started", label: "İlk adım başlangıcı", children: formatDate(record.startedAt) },
    { key: "completed", label: "Tamamlanma", children: formatDate(record.completedAt) },
    { key: "note", label: "Açıklama", children: record.note || "—" },
  ];

  const stepColumns = [
    { title: "Faz", render: (_, s) => record.procedure.phases.find((p) => p.id === s.phaseId).name },
    { title: "Adım", dataIndex: "title" },
    { title: "Durum", render: (_, s) => ({ pending: "Bekliyor", running: "Çalışıyor", paused: "Duraklatıldı", done: "Tamamlandı", interrupted: "Kesildi" })[s.status] },
    {
      // Kişiler çalışma aralığı bazında: duraklatmadan sonra kişi değişmiş olabilir.
      title: "Çalışma aralıkları ve kişiler",
      render: (_, s) =>
        s.sessions.length === 0 ? (
          "—"
        ) : (
          <Flex vertical gap={2}>
            {s.sessions.map((x) => (
              <span key={x.start}>
                {formatTime(x.start)}–{formatTime(x.end)} · {names(x.people)}
              </span>
            ))}
            {s.pauses.map((p) => (
              <Tag key={p.at} color="orange" style={{ width: "fit-content" }}>
                {formatTime(p.at)} duraklatıldı: {p.reason}
              </Tag>
            ))}
          </Flex>
        ),
    },
    { title: "Süre", render: (_, s) => formatDuration(stepWorkMs(s, endAt)) },
    { title: "Efor", render: (_, s) => formatDuration(stepEffortMs(s, endAt)) },
  ];

  const phaseRows = record.procedure.phases.map((phase) => ({ phase, stats: phaseStats(record, phase, endAt) }));
  const phaseColumns = [
    { title: "Faz", render: (_, r) => r.phase.name },
    { title: "Minimum", render: (_, r) => `${r.phase.minMinutes} dk` },
    { title: "Gerçek çalışma", render: (_, r) => formatDuration(r.stats.workMs) },
    { title: "Efor", render: (_, r) => formatDuration(r.stats.effortMs) },
    { title: "Ara", render: (_, r) => formatDuration(r.stats.gapMs) },
    { title: "", render: (_, r) => (r.stats.workMs === 0 ? null : r.stats.metMin ? <Tag color="green">Sağlandı</Tag> : <Tag color="red">Minimumun altında</Tag>) },
  ];

  const deviationColumns = [
    { title: "Faz", dataIndex: "phaseName" },
    { title: "Çalışılan", render: (_, d) => formatDuration(d.workMs) },
    { title: "Minimum", render: (_, d) => formatDuration(d.minMs) },
    { title: "Açıklama", dataIndex: "reason" },
    { title: "Kim", render: (_, d) => userName(d.by) },
    { title: "Ne zaman", render: (_, d) => formatDate(d.at) },
  ];

  const materialColumns = [
    { title: "Kod", dataIndex: "code" },
    { title: "Ad", dataIndex: "name" },
    { title: "Parti / lot", dataIndex: "lot" },
    { title: "Son kullanma", dataIndex: "expiry" },
  ];

  const auditColumns = [
    { title: "Zaman", render: (_, l) => formatDate(l.at) },
    { title: "Kim", render: (_, l) => userName(l.userId) },
    { title: "İşlem", dataIndex: "action" },
    { title: "Detay", dataIndex: "detail" },
  ];

  return (
    <Flex vertical gap={16}>
      <Card
        title={`Kayıt ${record.no}`}
        extra={
          isOpen && (
            <Button type="primary" onClick={() => navigate(`/records/${record.id}/run`)}>
              Adım ekranına git
            </Button>
          )
        }
      >
        {record.status === "cancelled" && (
          <Alert type="error" title={`${formatDate(record.cancel.at)} tarihinde ${userName(record.cancel.by)} tarafından kapatıldı: ${record.cancel.reason}`} style={{ marginBottom: 16 }} />
        )}
        <Descriptions bordered size="small" column={{ xs: 1, md: 2, xl: 3 }} items={info} />
      </Card>

      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Gerçek çalışma" value={formatDuration(stats.workMs)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="İnsan eforu" value={formatDuration(stats.effortMs)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Takvim süresi" value={formatDuration(stats.elapsedMs)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Ara (çalışılmayan)" value={formatDuration(stats.gapMs)} />
          </Card>
        </Col>
      </Row>

      <Card title="Fazlar">
        <Table rowKey={(r) => r.phase.id} size="small" columns={phaseColumns} dataSource={phaseRows} pagination={false} scroll={{ x: true }} />
      </Card>

      <Card title="Adımlar: kim, ne zaman, ne kadar">
        <Table rowKey="stepId" size="small" columns={stepColumns} dataSource={record.steps} pagination={false} scroll={{ x: true }} />
      </Card>

      {record.deviations.length > 0 && (
        <Card title="Minimum süre sapmaları">
          <Table rowKey="at" size="small" columns={deviationColumns} dataSource={record.deviations} pagination={false} scroll={{ x: true }} />
        </Card>
      )}

      <Card title="Kullanılan malzemeler">
        <Table rowKey="lot" size="small" columns={materialColumns} dataSource={record.materials} pagination={false} locale={{ emptyText: "Bu kayıtta malzeme kullanılmadı" }} />
      </Card>

      <Card title="Denetim izi">
        <Alert
          type="info"
          title="Kayıtları sonradan değiştiren bir işlem yok: zamanları sistem yazıyor, kayıtlar silinmiyor, yanlış kayıt nedeniyle kapatılıyor ve her işlem buraya ekleniyor."
          style={{ marginBottom: 16 }}
        />
        <Table rowKey={(l) => `${l.at}-${l.action}-${l.detail}`} size="small" columns={auditColumns} dataSource={[...auditLog].sort((a, b) => a.at - b.at)} pagination={false} scroll={{ x: true }} />
      </Card>
    </Flex>
  );
}
