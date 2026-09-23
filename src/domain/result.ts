export type RunStatus = "success" | "business_outcome" | "needs_intervention" | "failed";

export type RunResult = {
  status: RunStatus;
  outcome_code?: string;
  outputs: Record<string, string>;
  recovered: string[];
  step_id?: string;
  expected?: string;
  observed?: string;
  evidence_dir?: string;
  control?: { owner: "agent" | "human"; session_id: string };
};
