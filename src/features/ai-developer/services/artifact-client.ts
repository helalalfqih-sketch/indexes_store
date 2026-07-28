/**
 * Artifact Client — Store and retrieve agent artifacts
 *
 * Artifacts are meaningful outputs from every agent operation:
 * plans, diffs, build outputs, deployment URLs, commits, PRs.
 *
 * Stored in: agent_artifacts table (via Supabase service role)
 */

import { supabase } from "@/integrations/supabase/client";
import type { Artifact, ArtifactInput } from "../types/artifacts";

/**
 * Store an artifact for a run.
 */
export async function storeArtifact(input: ArtifactInput): Promise<Artifact | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("agent_artifacts")
      .insert({
        run_id: input.runId,
        artifact_type: input.artifactType,
        title: input.title,
        content: input.content ?? null,
        metadata: input.metadata ?? {},
      })
      .select()
      .single();

    if (error) {
      console.warn("[ArtifactClient] storeArtifact error:", error.message);
      return null;
    }
    return data as unknown as Artifact;
  } catch (e: any) {
    console.warn("[ArtifactClient] storeArtifact exception:", e.message);
    return null;
  }
}

/**
 * Fetch all artifacts for a run, ordered by creation time.
 */
export async function getRunArtifacts(runId: string): Promise<Artifact[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("agent_artifacts")
      .select("*")
      .eq("run_id", runId)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("[ArtifactClient] getRunArtifacts error:", error.message);
      return [];
    }
    return (data || []) as unknown as Artifact[];
  } catch {
    return [];
  }
}

/**
 * Fetch artifacts of a specific type for a run.
 */
export async function getRunArtifactsByType(
  runId: string,
  artifactType: string,
): Promise<Artifact[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("agent_artifacts")
      .select("*")
      .eq("run_id", runId)
      .eq("artifact_type", artifactType)
      .order("created_at", { ascending: true });

    if (error) return [];
    return (data || []) as unknown as Artifact[];
  } catch {
    return [];
  }
}
