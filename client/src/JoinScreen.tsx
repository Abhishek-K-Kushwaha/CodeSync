import React from "react";

interface JoinScreenProps {
  mode: "initial" | "create" | "join";
  setMode: (mode: "initial" | "create" | "join") => void;
  roomId: string;
  setRoomId: (id: string) => void;
  username: string;
  setUsername: (name: string) => void;
  passcode: string;
  setPasscode: (pass: string) => void;
  error: string;
  setError: (err: string) => void;
  handleCreate: (e: React.FormEvent) => void;
  handleJoin: (e: React.FormEvent) => void;
  generateRoomId: () => string;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({
  mode, setMode, roomId, setRoomId, username, setUsername,
  passcode, setPasscode, error, setError, handleCreate, handleJoin, generateRoomId
}) => {
  if (mode === "initial") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: "20px" }}>
        <h2>CodeSync</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => { setRoomId(generateRoomId()); setMode("create"); setError(""); setPasscode(""); }}
            style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
          >
            Create Room
          </button>
          <button
            onClick={() => { setRoomId(""); setMode("join"); setError(""); setPasscode(""); }}
            style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
      <form onSubmit={mode === "create" ? handleCreate : handleJoin} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "300px" }}>
        <h2>{mode === "create" ? "Create CodeSync Room" : "Join CodeSync Room"}</h2>
        {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          style={{ padding: "10px", fontSize: "16px" }}
          required
          readOnly={mode === "create"}
        />
        <input
          type="text"
          placeholder="4-digit Passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          style={{ padding: "10px", fontSize: "16px" }}
          maxLength={4}
          required
        />
        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: "10px", fontSize: "16px" }}
          required
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" style={{ flex: 1, padding: "10px", fontSize: "16px", cursor: "pointer" }}>
            {mode === "create" ? "Create" : "Join"}
          </button>
          <button type="button" onClick={() => { setMode("initial"); setError(""); }} style={{ flex: 1, padding: "10px", fontSize: "16px", cursor: "pointer" }}>
            Back
          </button>
        </div>
      </form>
    </div>
  );
};