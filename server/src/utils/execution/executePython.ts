import { runInDocker, DockerExecutionResult } from "./dockerRunner";

export const executePython = (code: string, input: string = ""): Promise<DockerExecutionResult> => {
  return runInDocker(code, "main.py", "python:3.9-slim", [
    "sh",
    "-c",
    "date +%s%3N > .start; python main.py; exit_code=$?; date +%s%3N > .end; (cat /sys/fs/cgroup/memory.peak 2>/dev/null || cat /sys/fs/cgroup/memory/memory.max_usage_in_bytes 2>/dev/null) > .mem; exit $exit_code"
  ], input);
};