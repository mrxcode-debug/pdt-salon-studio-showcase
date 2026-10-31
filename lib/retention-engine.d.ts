export type RetentionInput = {
  days?: number;
  noShow?: boolean;
  amount?: number;
};

export type RetentionScore = {
  score: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
};

export function scoreRetentionTask(input?: RetentionInput): RetentionScore;
export function rankRetentionTasks<T extends RetentionInput>(tasks?: T[]): Array<T & { retention: RetentionScore }>;
