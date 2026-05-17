import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:3000");

interface User {
  socketId: string;
  username: string;
}

function App() {
  const [code, setCode] = useState("");
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [mode, setMode] = useState<"initial" | "create" | "join">("initial");
  const [error, setError] = useState("");

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  useEffect(() => {
    const onConnect = () => {
      console.log("Connected:", socket.id);
      // Auto-rejoin if a connection drops and restores
      if (isJoined && username && roomId && passcode) {
        socket.emit("join-room", { roomId, passcode, username });
      }
    };

    socket.on("connect", onConnect);

    socket.on("room-joined", () => {
      setIsJoined(true);
      setError("");
    });

    socket.on("room-error", (msg: string) => {
      setError(msg);
      setIsJoined(false);
    });

    socket.on("sync-language", (lang) => {
      setLanguage(lang);
    });

    socket.on("language-update", (lang) => {
      setLanguage(lang);
    });

    socket.on("execution-started", () => {
      setIsExecuting(true);
      setOutput("Executing...");
    });

    socket.on("execution-output", (res) => {
      setIsExecuting(false);
      setOutput(res);
    });

	socket.on("sync-code", (incomingCode) => {
	  setCode(incomingCode);
	});

	socket.on("code-update", (incomingCode) => {
	  setCode(incomingCode);
	});

	socket.on("users-update", (updatedUsers: User[]) => {
	  setUsers(updatedUsers);
	});

	return () => {
	  socket.off("connect", onConnect);
	  socket.off("room-joined");
	  socket.off("room-error");
	  socket.off("sync-code");
	  socket.off("sync-language");
	  socket.off("language-update");
	  socket.off("execution-started");
	  socket.off("execution-output");
	  socket.off("code-update");
	  socket.off("users-update");
	};
  }, [isJoined, username, roomId, passcode]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (username.trim() && roomId.trim() && passcode.trim().length === 4 && /^\d+$/.test(passcode)) {
      socket.emit("create-room", { roomId, passcode, username });
    } else {
      setError("Please fill all fields. Passcode must be a 4-digit number.");
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (username.trim() && roomId.trim() && passcode.trim().length === 4 && /^\d+$/.test(passcode)) {
      socket.emit("join-room", { roomId, passcode, username });
    } else {
      setError("Please fill all fields. Passcode must be a 4-digit number.");
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socket.emit("language-change", { roomId, language: newLang });
  };

  const handleExecute = () => {
    socket.emit("execute-code", { code, language });
  };

  if (!isJoined) {
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
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "250px", padding: "20px", borderRight: "1px solid #ccc", overflowY: "auto", display: "flex", flexDirection: "column" }}>
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
                🟢 {user.username} {user.socketId === socket.id && "(You)"}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0 }}>CodeSync</h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <select value={language} onChange={handleLanguageChange} style={{ padding: "5px", fontSize: "16px" }}>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
            </select>
            <button onClick={handleExecute} disabled={isExecuting} style={{ padding: "5px 15px", fontSize: "16px", cursor: isExecuting ? "not-allowed" : "pointer" }}>
              {isExecuting ? "Running..." : "Run Code"}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex" }}>
          <div style={{ flex: 0.7 }}>
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => {
                const updatedCode = value || "";
                setCode(updatedCode);
                socket.emit("code-change", {
                  roomId,
                  code: updatedCode,
                });
              }}
            />
          </div>
          <div style={{ flex: 0.3, borderLeft: "1px solid #ccc", padding: "10px", backgroundColor: "#1e1e1e", color: "#fff", overflowY: "auto", fontFamily: "monospace" }}>
            <h3 style={{ marginTop: 0 }}>Output</h3>
            <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{output}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;