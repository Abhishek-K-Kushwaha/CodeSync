import { executeCode } from "./executeCode";

export interface ExecutionMetrics {
  queueWaitTime: number;
  executionTime: number;
  containerStartupTime: number;
  totalLatency: number;
  memoryUsed: string;
}

export interface ExecutionResult {
  output: string;
  metrics: ExecutionMetrics;
}

export interface ExecutionJob {
  jobId: string;
  roomId: string;
  socketId: string;
  language: string;
  code: string;
  input: string;
  queuedAt: number;
}

interface QueuedJob extends ExecutionJob {
  resolve: (value: ExecutionResult) => void;
  reject: (reason?: any) => void;
}

const queue: QueuedJob[] = [];
const MAX_CONCURRENT_WORKERS = 1; // Global concurrency limit
let activeWorkers = 0;

export const enqueueExecution = (jobData: Omit<ExecutionJob, "jobId" | "queuedAt">): Promise<ExecutionResult> => {
  return new Promise((resolve, reject) => {
    const job: QueuedJob = {
      ...jobData,
      jobId: Math.random().toString(36).substring(7),
      queuedAt: Date.now(),
      resolve,
      reject,
    };
    queue.push(job);
    processQueue();
  });
};

const processQueue = async () => {
  if (activeWorkers >= MAX_CONCURRENT_WORKERS || queue.length === 0) {
    return;
  }

  activeWorkers++;
  const job = queue.shift()!;
  
  const executionStartTime = Date.now();
  const queueWaitTime = executionStartTime - job.queuedAt;

  try {
    const result = await executeCode(job.language, job.code, job.input);
    
    const executionEndTime = Date.now();
    const executionTime = result.executionTime;
    const totalLatency = executionEndTime - job.queuedAt;

    job.resolve({
      output: result.output,
      metrics: {
        queueWaitTime,
        executionTime,
        containerStartupTime: result.startupTime,
        totalLatency,
        memoryUsed: result.memoryUsed
      }
    });
  } catch (error: any) {
    job.reject(error);
  } finally {
    activeWorkers--;
    processQueue(); // Look for next pending job
  }
};