import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { finishStepApi, getRecordDetailApi, pauseStepApi, resumeStepApi, setStepPeopleApi, startStepApi } from "../api/cleaningApi";
import { Alert, App, Button, Card, Col, Descriptions, Flex, Image, Input, Modal, Progress, Row, Select, Statistic, Steps } from "antd";
import { StatusTag } from "../components/StatusTag";
import { formatDuration, recordStats } from "../utils/time";

const PAUSE_REASONS = ["Vardiya bitti", "Mola", "Malzeme bekleniyor", "Arıza"].map((value) => ({ value, label: value }));

export function RunPage() {
  const { message } = App.useApp();
  const { recordId } = useParams();
  const [detail, setDetail] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [askReason, setAskReason] = useState(false);
  const [finishReason, setFinishReason] = useState("");
  const [askPause, setAskPause] = useState(false);
  const [pauseReason, setPauseReason] = useState();

  const refresh = () => getRecordDetailApi(recordId).then(setDetail);

  useEffect(() => {
    getRecordDetailApi(recordId).then(setDetail);
  }, [recordId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!detail) return null;

  const { record, users } = detail;
  const step = record.steps.find((s) => s.status !== "done");
  const definition = record.procedure.phases.flatMap((phase) => phase.steps).find((s) => s.id === step?.stepId);
  const stepItems = record.steps.map((s) => ({
    title: s.title,
    content: record.procedure.phases.find((p) => p.id === s.phaseId).name,
  }));
  const current = step ? record.steps.indexOf(step) : record.steps.length;
  const stats = recordStats(record, now);
  const doneCount = record.steps.filter((s) => s.status === "done").length;
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
  const handleResume = () => run(() => resumeStepApi(record.id, step.stepId));

  function handlePause() {
    if (!pauseReason) {
      message.error("Duraklatma nedeni seç.");
      return;
    }
    setAskPause(false);
    setPauseReason(undefined);
    run(() => pauseStepApi(record.id, step.stepId, pauseReason));
  }

  function handleReasonOk() {
    if (!finishReason.trim()) {
      message.error("Açıklama zorunlu.");
      return;
    }
    handleFinish(finishReason);
    setFinishReason("");
  }

  async function handleFinish(reason) {
    try {
      await finishStepApi(record.id, step.stepId, reason);
      setAskReason(false);
      await refresh();
      message.success(`${step.title} tamamlandı`);
    } catch (err) {
      if (err.response.data.code === "MIN_NOT_MET") setAskReason(true);
      else message.error(err.response.data.message);
    }
  }
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
          <Progress percent={Math.round((doneCount / record.steps.length) * 100)} format={() => `${doneCount} / ${record.steps.length} adım`} style={{ marginBottom: 16 }} />
          {definition?.media && <Image width={240} src={definition.media} />}
          <p>{definition?.description}</p>
          {step && <Select mode="multiple" value={step.people} options={peopleOptions} disabled={step.status === "running"} onChange={handlePeople} style={{ width: "100%", marginBottom: 16 }} />}
          {step?.status === "pending" && (
            <Button type="primary" size="large" block onClick={handleStart}>
              Adımı başlat
            </Button>
          )}
          {step?.status === "running" && (
            <Flex gap={8}>
              <Button size="large" onClick={() => setAskPause(true)}>
                Duraklat
              </Button>
              <Button type="primary" size="large" block onClick={() => handleFinish()}>
                Adımı bitir
              </Button>
            </Flex>
          )}
          {step?.status === "paused" && (
            <>
              <Alert type="warning" title={`Duraklatıldı: ${step.pauses.at(-1).reason}`} style={{ marginBottom: 16 }} />
              <Button type="primary" size="large" block onClick={handleResume}>
                Devam et
              </Button>
            </>
          )}
        </Card>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={12} md={6}>
            <Statistic title="Gerçek çalışma" value={formatDuration(stats.workMs)} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="İnsan eforu" value={formatDuration(stats.effortMs)} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="Takvim süresi" value={formatDuration(stats.elapsedMs)} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="Ara" value={formatDuration(stats.gapMs)} />
          </Col>
        </Row>
      </Col>

      <Modal title="Adımı duraklat" open={askPause} onOk={handlePause} onCancel={() => setAskPause(false)}>
        <Select placeholder="Neden" value={pauseReason} onChange={setPauseReason} options={PAUSE_REASONS} style={{ width: "100%" }} />
      </Modal>

      <Modal title="Minimum süre sağlanmadı" open={askReason} onOk={handleReasonOk} onCancel={() => setAskReason(false)}>
        <Input.TextArea rows={3} placeholder="Açıklama" value={finishReason} onChange={(e) => setFinishReason(e.target.value)} />
      </Modal>
    </Row>
  );
}
