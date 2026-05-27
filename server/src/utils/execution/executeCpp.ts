import { runInDocker, DockerExecutionResult } from "./dockerRunner";

export const executeCpp = (code: string, input: string = ""): Promise<DockerExecutionResult> => {
  return runInDocker(code, "main.cpp", "gcc", [
    "sh",
    "-c",
    "g++ main.cpp -o main 2> compile_err.txt; compile_status=$?; if [ $compile_status -ne 0 ]; then echo 'Compilation Error:' >&2; cat compile_err.txt >&2; exit 1; fi; cat compile_err.txt >&2; date +%s%3N > .start; ./main; exit_code=$?; date +%s%3N > .end; (cat /sys/fs/cgroup/memory.peak 2>/dev/null || cat /sys/fs/cgroup/memory/memory.max_usage_in_bytes 2>/dev/null) > .mem; if [ $exit_code -ne 0 ] && [ $exit_code -ne 137 ]; then echo 'Runtime Error' >&2; fi; exit $exit_code"
  ], input);
};