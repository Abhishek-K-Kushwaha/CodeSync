import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:3000");

const ROOM_ID = "room-1";

function App() {
  const [code, setCode] = useState("");

  useEffect(() => {
	socket.on("connect", () => {
	  console.log("Connected:", socket.id);

	  socket.emit("join-room", ROOM_ID);
	});

	socket.on("sync-code", (incomingCode) => {
	  setCode(incomingCode);
	});

	socket.on("code-update", (incomingCode) => {
	  setCode(incomingCode);
	});

	socket.on("user-joined", (id) => {
	  console.log("Another user joined:", id);
	});

	return () => {
	  socket.off("sync-code");
	  socket.off("code-update");
	};
  }, []);

  const handleCodeChange = (
	e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
	const newCode = e.target.value;

	setCode(newCode);

	socket.emit("code-change", {
	  roomId: ROOM_ID,
	  code: newCode,
	});
  };

  return (
	<div style={{ padding: "20px" }}>
	  <h1>CodeSync</h1>

	  <Editor
		height="90vh"
		defaultLanguage="cpp"
		theme="vs-dark"
		value={code}
		onChange={(value) => {
			const updatedCode = value || "";
			setCode(updatedCode);
			socket.emit("code-change", {
			roomId: ROOM_ID,
			code: updatedCode,
			});
		}}
	  />
	</div>
  );
}

export default App;