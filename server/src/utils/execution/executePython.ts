import { runInDocker } from "./dockerRunner";

export const executePython = (code: string): Promise<string> => {
  return runInDocker(code, "main.py", "python:3.9-slim", ["python", "main.py"]);
};