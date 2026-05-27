import { executePython } from "./executePython";
import { executeCpp } from "./executeCpp";
import { DockerExecutionResult } from "./dockerRunner";

export const executeCode = async (language: string, code: string, input: string = ""): Promise<DockerExecutionResult> => {
  if (language === "python") {
    return executePython(code, input);
  } else if (language === "cpp") {
    return executeCpp(code, input);
  }

  return { output: "Unsupported language", startupTime: 0, executionTime: 0, memoryUsed: "N/A" };
};