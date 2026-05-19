import { executePython } from "./executePython";
import { executeCpp } from "./executeCpp";

export const executeCode = async (language: string, code: string): Promise<string> => {
  if (language === "python") {
    return executePython(code);
  } else if (language === "cpp") {
    return executeCpp(code);
  }

  return "Unsupported language";
};