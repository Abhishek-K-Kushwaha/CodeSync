import { runInDocker } from "./dockerRunner";

export const executeCpp = (code: string): Promise<string> => {
  return runInDocker(code, "main.cpp", "gcc", ["sh", "-c", "g++ main.cpp -o main && ./main"]);
};