import { executePython } from "./executePython";
import { executeCpp } from "./executeCpp";

export const executeCode = async (language: string, code: string, input: string = ""): Promise<string> => {
  if (language === "python") {
    return executePython(code, input);
  } else if (language === "cpp") {
    return executeCpp(code, input);
  }

  return "Unsupported language";
};