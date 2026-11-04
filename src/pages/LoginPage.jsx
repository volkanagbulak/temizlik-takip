import { useEffect, useState } from "react";
import { getUsersApi } from "../api/cleaningApi";

import { Button, Card, Flex, Tag } from "antd";
export function LoginPage({ onLogin }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsersApi().then(setUsers);
  }, []);

  return (
    <Flex
      justify="center"
      align="center"
      style={{ minHeight: "100vh", padding: 16 }}
    >
      <Card title="Temizlik Takip" style={{ width: 360 }}>
        <Flex vertical gap={8}>
          {users.map((user) => (
            <Button
              key={user.id}
              size="large"
              block
              onClick={() => onLogin(user)}
            >
              {user.name}{" "}
              <Tag>{user.role === "admin" ? "Yönetici" : "Operatör"}</Tag>
            </Button>
          ))}
        </Flex>
      </Card>
    </Flex>
  );
}
