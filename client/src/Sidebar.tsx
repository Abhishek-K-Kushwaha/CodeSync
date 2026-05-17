import React from "react";
import type { User } from "./user";

interface SidebarProps {
  roomId: string;
  passcode: string;
  users: User[];
  socketId: string | undefined;
}

export const Sidebar: React.FC<SidebarProps> = ({ roomId, passcode, users, socketId }) => {
  return (
    <div style={{ width: "250px", padding: "20px", borderRight: "1px solid #ccc", overflowY: "auto", display: "flex", flexDirection: "column", textAlign: "left" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ marginTop: 0 }}>Room Details</h3>
        <p style={{ margin: "5px 0" }}><strong>ID:</strong> {roomId}</p>
        <p style={{ margin: "5px 0" }}><strong>Passcode:</strong> {passcode}</p>
      </div>
      <div>
        <h3 style={{ marginTop: 0 }}>Connected Users</h3>
        <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
          {users.map((user) => (
            <li key={user.socketId} style={{ padding: "5px 0", fontSize: "16px" }}>
              🟢 {user.username} {user.socketId === socketId && "(You)"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};