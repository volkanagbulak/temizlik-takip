// src/pages/LoginPage.jsx
import { useEffect, useState } from "react";
import { Button, Card, Flex, Layout, Tag, Typography } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { getUsersApi } from "../api/cleaningApi";

export function LoginPage({ onLogin }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsersApi().then(setUsers);
  }, []);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Flex justify="center" align="center" flex={1} style={{ padding: 16 }}>
        <Card style={{ width: 380 }}>
          <Flex vertical align="center" gap={4} style={{ marginBottom: 24 }}>
            <SafetyCertificateOutlined
              style={{ fontSize: 32, color: "#0f766e" }}
            />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Temizlik Takip
            </Typography.Title>
            <Typography.Text type="secondary">
              Devam etmek için kullanıcı seç
            </Typography.Text>
          </Flex>
          <Flex vertical gap={8}>
            {users.map((user) => {
              const isAdmin = user.role === "admin";
              return (
                <Button
                  key={user.id}
                  size="large"
                  block
                  onClick={() => onLogin(user)}
                >
                  <Flex
                    justify="space-between"
                    align="center"
                    style={{ width: "100%" }}
                  >
                    {user.name}
                    <Tag
                      color={isAdmin ? "blue" : "green"}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {isAdmin ? "Yönetici" : "Operatör"}
                    </Tag>
                  </Flex>
                </Button>
              );
            })}
          </Flex>
        </Card>
      </Flex>
    </Layout>
  );
}
