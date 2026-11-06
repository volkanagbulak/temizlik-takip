import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { getRecordDetailApi } from "../api/recordApi";
import { finishStepApi, pauseStepApi, resumeStepApi, setStepPeopleApi, startStepApi } from "../api/stepApi";
import { getAvailabilityApi } from "../api/userApi";
import { Alert, App, Button, Card, Col, Descriptions, Flex, Image, Input, Modal, Progress, Row, Select, Statistic, Steps } from "antd";
import { StatusTag } from "../components/StatusTag";
import { useAction } from "../hooks/useAction";
import { formatDuration, recordStats } from "../utils/time";

const PAUSE_REASONS = ["Vardiya bitti", "Mola", "Malzeme bekleniyor", "Arıza"].map((value) => ({ value, label: value }));

// Kayıt ve personel durumu birlikte okunuyor, kişi listesi de güncel kalsın.
const loadRun = (recordId) => Promise.all([getRecordDetailApi(recordId), getAvailabilityApi()]);

export function RunPage() {
  const { message } = App.useApp();
  const { recordId } = useParams();
  const { refreshKey } = useOutletContext();
  const { run, pending } = useAction();
  const [detail, setDetail] = useState(null);
  const [people, setPeople] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const [askReason, setAskReason] = useState(false);
  const [finishReason, setFinishReason] = useState("");
  const [askPause, setAskPause] = useState(false);
  const [pauseReason, setPauseReason] = useState();

  const refresh = () =>
    loadRun(recordId).then(([nextDetail, nextPeople]) => {
      setDetail(nextDetail);
      setPeople(nextPeople);
    });

  useEffect(() => {
    loadRun(recordId).then(([nextDetail, nextPeople]) => {
      setDetail(nextDetail);
      setPeople(nextPeople);
    });
  }, [recordId, refreshKey]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!detail) return null;

  const { record } = detail;
  const openStep = record.steps.find((s) => s.status !== "done");
  // Kapatılan kayıtta işlem yapılamıyor.
  const step = record.status === "cancelled" ? undefined : openStep;
  const definition = record.procedure.phases.flatMap((phase) => phase.steps).find((s) => s.id === step?.stepId);
  const stepItems = record.steps.map((s) => ({
    title: s.title,
    content: record.procedure.phases.find((p) => p.id === s.phaseId).name,
  }));
  const current = openStep ? record.steps.indexOf(openStep) : record.steps.length;
  const stats = recordStats(record, now);
  const doneCount = record.steps.filter((s) => s.status === "done").length;
  // Başka kayıtta çalışan kişi seçilemiyor. Aynı anda seçilirse servis yine 409 ile reddediyor.
  const peopleOptions = people.map((p) => {
    const busyElsewhere = p.busy && p.busy.recordId !== record.id;
    return {
      value: p.id,
      label: busyElsewhere ? `${p.name} (${p.busy.recordNo} kaydında)` : p.name,
      disabled: Boolean(busyElsewhere),
    };
  });

  // Tüm işlemler aynı: servisi çağır, hata varsa göster, kaydı yeniden oku.
  const perform = (request, options) => run(request, { ...options, onSettled: refresh });

  const handleStart = () => perform(() => startStepApi(record.id, step.stepId));
  const handleResume = () => perform(() => resumeStepApi(record.id, step.stepId));

  function handlePause() {
    if (!pauseReason) {
      message.error("Duraklatma nedeni seç.");
      return;
    }
    setAskPause(false);
    setPauseReason(undefined);
    perform(() => pauseStepApi(record.id, step.stepId, pauseReason));
  }

  function handleReasonOk() {
    if (!finishReason.trim()) {
      message.error("Açıklama zorunlu.");
      return;
    }
    handleFinish(finishReason);
  }

  async function handleFinish(reason) {
    const result = await perform(() => finishStepApi(record.id, step.stepId, reason), {
      success: `${step.title} tamamlandı`,
      // Minimum süre sağlanmadıysa hata göstermek yerine açıklama penceresini açıyorum.
      onError(error) {
        if (error.code !== "MIN_NOT_MET") return false;
        setAskReason(true);
        return true;
      },
    });
    if (result.ok) {
      setAskReason(false);
      setFinishReason("");
    }
  }
  function handlePeople(userIds) {
    if (userIds.length === 0) {
      message.error("En az bir kişi seçilmeli.");
      return;
    }
    perform(() => setStepPeopleApi(record.id, step.stepId, userIds));
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
        <Card title={record.status === "cancelled" ? "Kayıt kapatıldı" : (step?.title ?? "Temizlik tamamlandı")}>
          {record.status === "cancelled" && <Alert type="error" title={record.cancel.reason} style={{ marginBottom: 16 }} />}
          <Progress percent={Math.round((doneCount / record.steps.length) * 100)} format={() => `${doneCount} / ${record.steps.length} adım`} style={{ marginBottom: 16 }} />
          {definition?.media && <Image width={240} src={definition.media} />}
          <p>{definition?.description}</p>
          {step && <Select mode="multiple" value={step.people} options={peopleOptions} disabled={step.status === "running" || pending} onChange={handlePeople} style={{ width: "100%", marginBottom: 16 }} />}
          {step?.status === "pending" && (
            <Button type="primary" size="large" block loading={pending} onClick={handleStart}>
              Adımı başlat
            </Button>
          )}
          {step?.status === "running" && (
            <Flex gap={8}>
              <Button size="large" disabled={pending} onClick={() => setAskPause(true)}>
                Duraklat
              </Button>
              <Button type="primary" size="large" block loading={pending} onClick={() => handleFinish()}>
                Adımı bitir
              </Button>
            </Flex>
          )}
          {step?.status === "paused" && (
            <>
              <Alert type="warning" title={`Duraklatıldı: ${step.pauses.at(-1).reason}`} style={{ marginBottom: 16 }} />
              <Button type="primary" size="large" block loading={pending} onClick={handleResume}>
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

      <Modal title="Adımı duraklat" open={askPause && step?.status === "running"} onOk={handlePause} onCancel={() => setAskPause(false)}>
        <Select placeholder="Neden" value={pauseReason} onChange={setPauseReason} options={PAUSE_REASONS} style={{ width: "100%" }} />
      </Modal>

      <Modal title="Minimum süre sağlanmadı" open={askReason && step?.status === "running"} okButtonProps={{ loading: pending }} onOk={handleReasonOk} onCancel={() => setAskReason(false)}>
        <Input.TextArea rows={3} placeholder="Açıklama" value={finishReason} onChange={(e) => setFinishReason(e.target.value)} />
      </Modal>
    </Row>
  );
}
