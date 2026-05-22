import { runInDocker } from "./dockerRunner";

export const executePython = (code: string, input: string = ""): Promise<string> => {
  return runInDocker(code, "main.py", "python:3.9-slim", ["python", "main.py"], input);
};