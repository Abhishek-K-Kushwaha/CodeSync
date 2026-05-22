import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const runInDocker = async (
  code: string,
  fileName: string,
  image: string,
  args: string[],
  input: string = ""
): Promise<string> => {
  const fileId = Math.random().toString(36).substring(7);
  const tempDir = os.tmpdir();
  const workspaceDir = path.join(tempDir, `workspace_${fileId}`);
  await fs.mkdir(workspaceDir, { recursive: true });

  const filePath = path.join(workspaceDir, fileName);
  await fs.writeFile(filePath, code);

  return new Promise((resolve) => {
    const containerName = `exec_${fileId}`;
    const process = spawn("docker", [
      "run",
      "-i",
      "--name", containerName,
      "--rm",
      "--network", "none",
      "-m", "128m",
      "--cpus", "1",
      "-v", `${workspaceDir}:/workspace`,
      "-w", "/workspace",
      image,
      ...args
    ]);

    if (input) {
      process.stdin.write(input);
    }
    process.stdin.end();

    let output = "";
    let error = "";
    let isResolved = false;

    const cleanup = async () => {
      try {
        await fs.rm(workspaceDir, { recursive: true, force: true });
      } catch (e) {}
    };

    const timer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        spawn("docker", ["rm", "-f", containerName]);
        cleanup();
        let finalOutput = output && error ? `${output}\n${error}` : error || output;
        resolve((finalOutput ? finalOutput.trim() + "\n" : "") + "\nTIME LIMIT EXCEEDED");
      }
    }, 10000);

    process.on("error", (err) => {
      if (isResolved) return;
      isResolved = true;
      clearTimeout(timer);
      cleanup();
      resolve(`Execution error: ${err.message}`);
    });

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      error += data.toString();
    });

    process.on("close", async (code) => {
      if (isResolved) return;
      isResolved = true;
      clearTimeout(timer);
      await cleanup();
      
      let finalOutput = output && error ? `${output}\n${error}` : error || output;
      if (code === 137) {
        finalOutput = (finalOutput ? finalOutput.trim() + "\n" : "") + "MEMORY LIMIT EXCEEDED";
      }

      resolve(finalOutput);
    });
  });
};