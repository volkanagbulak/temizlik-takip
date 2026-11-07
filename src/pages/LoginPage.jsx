// src/pages/LoginPage.jsx
import { useEffect, useState } from "react";
import { Alert, App, Button, Card, Flex, Layout, Popconfirm, Tag, Typography } from "antd";
import { ReloadOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { resetDemoApi } from "../api/demoApi";
import { getUsersApi } from "../api/userApi";

// Demoda şifre yok, kullanıcı seçiliyor. Böylece roller arasında hızlıca geçebiliyorum.
export function LoginPage({ onLogin }) {
  const { message } = App.useApp();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsersApi().then(setUsers);
  }, []);

  // Demoyu deneyen kişi veriyi karıştırırsa tek tıkla başa dönebilsin.
  async function handleReset() {
    await resetDemoApi();
    message.success("Örnek veriye dönüldü.");
    getUsersApi().then(setUsers);
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Flex justify="center" align="center" flex={1} style={{ padding: 16 }}>
        <Card style={{ width: 420 }}>
          <Flex vertical align="center" gap={4} style={{ marginBottom: 24 }}>
            <SafetyCertificateOutlined style={{ fontSize: 32, color: "#0f766e" }} />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Temizlik Takip
            </Typography.Title>
            <Typography.Text type="secondary">Devam etmek için kullanıcı seç</Typography.Text>
          </Flex>
          <Flex vertical gap={8}>
            {users.map((user) => {
              const isAdmin = user.role === "admin";
              return (
                <Button key={user.id} size="large" block onClick={() => onLogin(user)}>
                  <Flex justify="space-between" align="center" style={{ width: "100%" }}>
                    {user.name}
                    <Tag color={isAdmin ? "blue" : "green"} style={{ marginInlineEnd: 0 }}>
                      {isAdmin ? "Yönetici" : "Operatör"}
                    </Tag>
                  </Flex>
                </Button>
              );
            })}
          </Flex>
          {/* Görüşmeci demoyu tek başına deneyebilsin diye kısa yönlendirme. */}
          <Alert
            type="info"
            style={{ marginTop: 24 }}
            title="Demoyu denemek için"
            description={
              <ul style={{ paddingInlineStart: 18, margin: 0 }}>
                <li>Operatörler kayıt açıp adımları yürütür, yönetici tanımları ve raporları yönetir.</li>
                <li>Eşzamanlılık için iki sekmede farklı operatörlerle aynı makineye kayıt açmayı deneyin.</li>
                <li>Veriler bu tarayıcıda saklanır. Raporlar için geçmiş tarihli örnek kayıtlar hazır gelir.</li>
              </ul>
            }
          />
          <Flex justify="center" style={{ marginTop: 12 }}>
            <Popconfirm title="Tüm kayıtlar silinip örnek veriye dönülsün mü?" okText="Evet" cancelText="Vazgeç" onConfirm={handleReset}>
              <Button type="link" icon={<ReloadOutlined />}>
                Örnek veriye dön
              </Button>
            </Popconfirm>
          </Flex>
        </Card>
      </Flex>
    </Layout>
  );
}
