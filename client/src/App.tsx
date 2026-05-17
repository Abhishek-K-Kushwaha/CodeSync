import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { User } from "./user";
import { JoinScreen } from "./JoinScreen";
import { Sidebar } from "./Sidebar";
import { Workspace } from "./Workspace";

const socket = io("http://localhost:3000");

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

  const handleCodeChange = (updatedCode: string) => {
    socket.emit("code-change", {
      roomId,
      code: updatedCode,
    });
  };

  if (!isJoined) {
    return (
      <JoinScreen
        mode={mode} setMode={setMode}
        roomId={roomId} setRoomId={setRoomId}
        username={username} setUsername={setUsername}
        passcode={passcode} setPasscode={setPasscode}
        error={error} setError={setError}
        handleCreate={handleCreate} handleJoin={handleJoin}
        generateRoomId={generateRoomId}
      />
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", position: "absolute", top: 0, left: 0 }}>
      <Sidebar roomId={roomId} passcode={passcode} users={users} socketId={socket.id} />
      <Workspace
        language={language}
        handleLanguageChange={handleLanguageChange}
        handleExecute={handleExecute}
        isExecuting={isExecuting}
        code={code} setCode={setCode}
        onCodeChange={handleCodeChange}
        output={output}
      />
    </div>
  );
}

export default App;