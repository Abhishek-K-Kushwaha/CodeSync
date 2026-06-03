import { spawn, spawnSync } from "child_process";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";

interface ActiveResource {
  containerName: string;
  workspaceDir: string;
}

const activeResources = new Set<ActiveResource>();

// Synchronous cleanup to guarantee execution during process exit
const cleanupAllSync = () => {
  for (const res of activeResources) {
    try {
      spawnSync("docker", ["rm", "-f", res.containerName]);
    } catch (e) {}
    try {
      fsSync.rmSync(res.workspaceDir, { recursive: true, force: true });
    } catch (e) {}
  }
};

process.on("exit", cleanupAllSync);
process.on("SIGINT", () => { cleanupAllSync(); process.exit(1); });
process.on("SIGTERM", () => { cleanupAllSync(); process.exit(1); });
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  cleanupAllSync();
  process.exit(1);
});

export interface DockerExecutionResult {
  output: string;
  startupTime: number;
  executionTime: number;
  memoryUsed: string;
}

export const runInDocker = async (
  code: string,
  fileName: string,
  image: string,
  args: string[],
  input: string = ""
): Promise<DockerExecutionResult> => {
  const fileId = Math.random().toString(36).substring(7);
  const workspaceDir = path.join(
    "/opt/codesync-workspaces",
    `workspace_${fileId}`
  );
  await fs.mkdir(workspaceDir, { recursive: true });

  const filePath = path.join(workspaceDir, fileName);
  await fs.writeFile(filePath, code);
  const stat = await fs.stat(filePath);
  return new Promise((resolve) => {
    const containerName = `exec_${fileId}`;
    const spawnTime = Date.now();
    let firstOutputTime = 0;

    const resource: ActiveResource = { containerName, workspaceDir };
    activeResources.add(resource);
    console.log("workspaceDir =", workspaceDir);
    console.log("filePath =", filePath);

    console.log("file exists, size =", stat.size);
    console.log([
	    "docker",
	    "run",
	    ...
	    "-v", `${workspaceDir}:/workspace`,
    ]);
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
      activeResources.delete(resource);
    };

    const getExecutionTime = async (): Promise<number | null> => {
      try {
        const startStr = await fs.readFile(path.join(workspaceDir, ".start"), "utf-8");
        const start = parseInt(startStr.trim(), 10);
        if (isNaN(start)) return null;
        
        try {
          const endStr = await fs.readFile(path.join(workspaceDir, ".end"), "utf-8");
          const end = parseInt(endStr.trim(), 10);
          if (!isNaN(end)) {
            return Math.max(0, end - start);
          }
        } catch (e) {
          // .end missing (e.g., killed by OOM or Timeout)
          return null;
        }
      } catch (e) {
        // .start missing (e.g., compilation error)
        return 0;
      }
      return null;
    };

    const getMemoryUsed = async (): Promise<string> => {
      try {
        const memStr = await fs.readFile(path.join(workspaceDir, ".mem"), "utf-8");
        const bytes = parseInt(memStr.trim(), 10);
        if (!isNaN(bytes)) {
          return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
        }
      } catch (e) {
        return "N/A";
      }
      return "N/A";
    };

    const timer = setTimeout(async () => {
      if (!isResolved) {
        isResolved = true;
        spawn("docker", ["rm", "-f", containerName]);
        const execTime = await getExecutionTime();
        const memoryUsed = await getMemoryUsed();
        await cleanup();
        let finalOutput = output && error ? `${output}\n${error}` : error || output;
        const totalTime = Date.now() - spawnTime;
        resolve({
          output: (finalOutput ? finalOutput.trim() + "\n" : "") + "\nTIME LIMIT EXCEEDED",
          startupTime: execTime !== null ? Math.max(0, totalTime - execTime) : (firstOutputTime > 0 ? firstOutputTime - spawnTime : totalTime),
          executionTime: execTime !== null ? execTime : totalTime,
          memoryUsed
        });
      }
    }, 10000);

    process.on("error", async (err) => {
      if (isResolved) return;
      isResolved = true;
      clearTimeout(timer);
      await cleanup();
      resolve({
        output: `Execution error: ${err.message}`,
        startupTime: Date.now() - spawnTime,
        executionTime: 0,
        memoryUsed: "N/A"
      });
    });

    process.stdout.on("data", (data) => {
      if (firstOutputTime === 0) firstOutputTime = Date.now();
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      if (firstOutputTime === 0) firstOutputTime = Date.now();
      error += data.toString();
    });

    process.on("close", async (code) => {
      if (isResolved) return;
      isResolved = true;
      clearTimeout(timer);

      const execTime = await getExecutionTime();
      const memoryUsed = await getMemoryUsed();
      await cleanup();
      
      let finalOutput = output && error ? `${output}\n${error}` : error || output;
      if (code === 137) {
        finalOutput = (finalOutput ? finalOutput.trim() + "\n" : "") + "MEMORY LIMIT EXCEEDED";
      }

      const totalTime = Date.now() - spawnTime;

      resolve({
        output: finalOutput,
        startupTime: execTime !== null ? Math.max(0, totalTime - execTime) : (firstOutputTime > 0 ? firstOutputTime - spawnTime : totalTime),
        executionTime: execTime !== null ? execTime : totalTime,
        memoryUsed
      });
    });
  });
};
