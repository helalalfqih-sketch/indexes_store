/**
 * AI Developer — Artifact Types
 *
 * Every meaningful operation produces a stored artifact.
 * Maps to: agent_artifacts table in Supabase.
 */

export type ArtifactType =
  | "plan"
  | "file_list"
  | "diff"
  | "build_output"
  | "test_output"
  | "screenshot"
  | "preview_url"
  | "deployment_url"
  | "commit"
  | "pull_request"
  | "checkpoint";

export interface Artifact {
  id: string;
  run_id: string;
  artifact_type: ArtifactType;
  title: string;
  content: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ArtifactInput {
  runId: string;
  artifactType: ArtifactType;
  title: string;
  content?: string;
  metadata?: Record<string, any>;
}
