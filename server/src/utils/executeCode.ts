import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const executeCode = async (language: string, code: string): Promise<string> => {
  const fileId = Math.random().toString(36).substring(7);
  const tempDir = os.tmpdir();

  if (language === "python") {
    const filePath = path.join(tempDir, `${fileId}.py`);
    await fs.writeFile(filePath, code);

    return new Promise((resolve) => {
      // "python3" is standard for Linux/macOS environments.
      const process = spawn("python3", [filePath]);
      let output = "";
      let error = "";

      process.on("error", (err) => {
        fs.unlink(filePath).catch(() => {});
        resolve(`Execution error: ${err.message}`);
      });

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        error += data.toString();
      });

      process.on("close", async () => {
        await fs.unlink(filePath).catch(() => {});
        resolve(error || output);
      });
    });
  } else if (language === "cpp") {
    const filePath = path.join(tempDir, `${fileId}.cpp`);
    const outPath = path.join(tempDir, fileId);
    await fs.writeFile(filePath, code);

    return new Promise((resolve) => {
      const compile = spawn("g++", [filePath, "-o", outPath]);
      let compileError = "";

      compile.on("error", (err) => {
        fs.unlink(filePath).catch(() => {});
        resolve(`Compilation error: ${err.message}`);
      });

      compile.stderr.on("data", (data) => {
        compileError += data.toString();
      });

      compile.on("close", (exitCode) => {
        if (exitCode !== 0) {
          fs.unlink(filePath).catch(() => {});
          return resolve(compileError);
        }

        const process = spawn(outPath);
        let output = "";
        let error = "";

        process.on("error", (err) => {
          fs.unlink(filePath).catch(() => {});
          fs.unlink(outPath).catch(() => {});
          resolve(`Execution error: ${err.message}`);
        });

        process.stdout.on("data", (data) => {
          output += data.toString();
        });

        process.stderr.on("data", (data) => {
          error += data.toString();
        });

        process.on("close", async () => {
          await fs.unlink(filePath).catch(() => {});
          await fs.unlink(outPath).catch(() => {});
          resolve(error || output);
        });
      });
    });
  }

  return "Unsupported language";
};