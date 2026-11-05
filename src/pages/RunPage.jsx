import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { finishStepApi, getRecordDetailApi, setStepPeopleApi, startStepApi } from "../api/cleaningApi";
import { App, Button, Card, Col, Descriptions, Image, Row, Select, Steps } from "antd";
import { StatusTag } from "../components/StatusTag";

export function RunPage() {
  const { message } = App.useApp();
  const { recordId } = useParams();
  const [detail, setDetail] = useState(null);

  const refresh = () => getRecordDetailApi(recordId).then(setDetail);

  useEffect(() => {
    getRecordDetailApi(recordId).then(setDetail);
  }, [recordId]);

  if (!detail) return null;

  const { record, users } = detail;
  const step = record.steps.find((s) => s.status !== "done");
  const definition = record.procedure.phases.flatMap((phase) => phase.steps).find((s) => s.id === step?.stepId);
  const stepItems = record.steps.map((s) => ({
    title: s.title,
    content: record.procedure.phases.find((p) => p.id === s.phaseId).name,
  }));
  const current = step ? record.steps.indexOf(step) : record.steps.length;
  const peopleOptions = users.filter((u) => u.role === "operator" && u.active).map((u) => ({ value: u.id, label: u.name }));

  // Tüm işlemler aynı: servisi çağır, kaydı yeniden oku, hata varsa göster.
  async function run(action) {
    try {
      await action();
      await refresh();
    } catch (err) {
      message.error(err.response.data.message);
    }
  }

  const handleStart = () => run(() => startStepApi(record.id, step.stepId));
  const handleFinish = () => run(() => finishStepApi(record.id, step.stepId));

  function handlePeople(userIds) {
    if (userIds.length === 0) {
      message.error("En az bir kişi seçilmeli.");
      return;
    }
    run(() => setStepPeopleApi(record.id, step.stepId, userIds));
  }

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card>
          <Descriptions
            column={{ xs: 1, md: 4 }}
            items={[
              { key: "no", label: "Kayıt no", children: record.no },
              { key: "machine", label: "Makine", children: record.machine.code },
              { key: "procedure", label: "Prosedür", children: `${record.procedure.code} v${record.procedure.version}` },
              { key: "status", label: "Durum", children: <StatusTag status={record.status} /> },
            ]}
          />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        {/* Temizlik Adımları */}
        <Card title="Adımlar">
          <Steps orientation="vertical" size="small" current={current} items={stepItems} />
        </Card>
      </Col>
      <Col xs={24} md={16}>
        <Card title={step?.title ?? "Temizlik tamamlandı"}>
          {definition?.media && <Image width={240} src={definition.media} />}
          <p>{definition?.description}</p>
          {step && <Select mode="multiple" value={step.people} options={peopleOptions} disabled={step.status !== "pending"} onChange={handlePeople} style={{ width: "100%", marginBottom: 16 }} />}
          {step?.status === "pending" && (
            <Button type="primary" size="large" block onClick={handleStart}>
              Adımı başlat
            </Button>
          )}
          {step?.status === "running" && (
            <Button type="primary" size="large" block onClick={() => handleFinish()}>
              Adımı bitir
            </Button>
          )}
        </Card>
      </Col>
    </Row>
  );
}
