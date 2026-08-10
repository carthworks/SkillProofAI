import { Queue } from 'bullmq';
import redis from '../services/redis';

export interface GradeJobData {
  submissionId: string;
  userId: string;
  problemId: string;
  s3Key: string;
  language: string;
}

/**
 * BullMQ queue for dispatching grading jobs to worker processes.
 * Workers consume from this queue and emit socket events back on completion.
 */
export const gradingQueue = new Queue<GradeJobData>('grading', {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 2,           // retry once on infra failures only
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // keep last 100 completed jobs for debugging
    removeOnFail: 200,     // keep last 200 failed jobs for inspection
  },
});

gradingQueue.on('error', (err) => {
  console.error('[GradingQueue] Queue error:', err.message);
});
