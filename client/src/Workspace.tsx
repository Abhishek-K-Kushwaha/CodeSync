import React from "react";
import Editor from "@monaco-editor/react";

interface WorkspaceProps {
  language: string;
  handleLanguageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleExecute: () => void;
  isExecuting: boolean;
  code: string;
  setCode: (code: string) => void;
  onCodeChange: (code: string) => void;
  output: string;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  language, handleLanguageChange, handleExecute, isExecuting, code, setCode, onCodeChange, output
}) => {
  return (
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
              onCodeChange(updatedCode);
            }}
          />
        </div>
        <div style={{ flex: 0.3, borderLeft: "1px solid #ccc", padding: "10px", backgroundColor: "#1e1e1e", color: "#fff", overflowY: "auto", fontFamily: "monospace", textAlign: "left" }}>
          <h3 style={{ marginTop: 0 }}>Output</h3>
          <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{output}</pre>
        </div>
      </div>
    </div>
  );
};