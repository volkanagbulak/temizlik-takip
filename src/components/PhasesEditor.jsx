// src/components/PhasesEditor.jsx
import { Button, Card, Flex, Form, Input, InputNumber, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { MediaField } from "./MediaField";

const emptyStep = () => ({ title: "", description: "", media: null });
const emptyPhase = () => ({ name: "", minMinutes: 10, steps: [emptyStep()] });

// Yeni prosedür ve yeni versiyon aynı düzenleyiciyi kullanıyor. Faz ve adım eklenip silinebiliyor.
// Gizli id alanı var olan faz ve adımın kimliğini taşıyor, yeni eklenene kimliği servis veriyor.
export function PhasesEditor() {
  return (
    <Form.List
      name="phases"
      rules={[
        {
          validator: async (_, phases) => {
            if (!phases?.length) throw new Error("En az bir faz ekle.");
          },
        },
      ]}
    >
      {(phaseFields, { add: addPhase, remove: removePhase }, { errors }) => (
        <Flex vertical gap={16}>
          {phaseFields.map((phaseField, i) => (
            <Card
              key={phaseField.key}
              size="small"
              title={`${i + 1}. faz`}
              extra={
                <Button size="small" danger disabled={phaseFields.length === 1} onClick={() => removePhase(phaseField.name)}>
                  Fazı sil
                </Button>
              }
            >
              <Form.Item name={[phaseField.name, "id"]} hidden>
                <Input />
              </Form.Item>
              <Flex gap={16} wrap>
                <Form.Item name={[phaseField.name, "name"]} label="Faz adı" rules={[{ required: true, whitespace: true, message: "Faz adı zorunlu" }]} style={{ flex: 1, minWidth: 200 }}>
                  <Input placeholder="Örn. Ön hazırlık" />
                </Form.Item>
                <Form.Item name={[phaseField.name, "minMinutes"]} label="Minimum süre (dakika)" rules={[{ required: true, message: "Süre zorunlu" }]}>
                  <InputNumber min={1} precision={0} />
                </Form.Item>
              </Flex>
              <Form.List name={[phaseField.name, "steps"]}>
                {(stepFields, { add, remove }) => (
                  <Flex vertical gap={4}>
                    {stepFields.map((stepField, j) => (
                      <div key={stepField.key}>
                      <Flex gap={8} align="start" wrap>
                        <Typography.Text style={{ width: 24, paddingTop: 5 }}>{j + 1}.</Typography.Text>
                        <Form.Item name={[stepField.name, "id"]} hidden>
                          <Input />
                        </Form.Item>
                        <Form.Item name={[stepField.name, "title"]} rules={[{ required: true, whitespace: true, message: "Adım adı zorunlu" }]} style={{ width: 220, marginBottom: 12 }}>
                          <Input placeholder="Adım adı" />
                        </Form.Item>
                        <Form.Item name={[stepField.name, "description"]} rules={[{ required: true, whitespace: true, message: "Açıklama zorunlu" }]} style={{ flex: 1, minWidth: 200, marginBottom: 12 }}>
                          <Input placeholder="Açıklama" />
                        </Form.Item>
                        <Button icon={<DeleteOutlined />} aria-label="Adımı sil" disabled={stepFields.length === 1} onClick={() => remove(stepField.name)} />
                      </Flex>
                      <Form.Item name={[stepField.name, "media"]} noStyle>
                        <MediaField />
                      </Form.Item>
                      </div>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(emptyStep())}>
                      Adım ekle
                    </Button>
                  </Flex>
                )}
              </Form.List>
            </Card>
          ))}
          <Form.ErrorList errors={errors} />
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => addPhase(emptyPhase())}>
            Faz ekle
          </Button>
        </Flex>
      )}
    </Form.List>
  );
}
