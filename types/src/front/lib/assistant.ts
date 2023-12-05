/**
 * Supported models
 */

import { ExtractSpecificKeys } from "../../shared/typescipt_utils";

export const GPT_4_32K_MODEL_ID = "gpt-4-32k" as const;
export const GPT_4_MODEL_ID = "gpt-4" as const;
export const GPT_4_TURBO_MODEL_ID = "gpt-4-1106-preview" as const;
export const GPT_3_5_TURBO_MODEL_ID = "gpt-3.5-turbo-1106" as const;

export const GPT_4_32K_MODEL_CONFIG = {
  providerId: "openai",
  modelId: GPT_4_32K_MODEL_ID,
  displayName: "GPT 4",
  contextSize: 32768,
  recommendedTopK: 32,
  largeModel: true,
} as const;

export const GPT_4_MODEL_CONFIG = {
  providerId: "openai",
  modelId: GPT_4_MODEL_ID,
  displayName: "GPT 4",
  contextSize: 8192,
  recommendedTopK: 16,
  largeModel: true,
};

export const GPT_4_TURBO_MODEL_CONFIG = {
  providerId: "openai",
  modelId: GPT_4_TURBO_MODEL_ID,
  displayName: "GPT 4",
  contextSize: 128000,
  recommendedTopK: 32,
  largeModel: true,
} as const;

export const GPT_3_5_TURBO_MODEL_CONFIG = {
  providerId: "openai",
  modelId: GPT_3_5_TURBO_MODEL_ID,
  displayName: "GPT 3.5 Turbo",
  contextSize: 16384,
  recommendedTopK: 16,
  largeModel: false,
} as const;

export const CLAUDE_2_1_MODEL_ID = "claude-2.1" as const;
export const CLAUDE_2_MODEL_ID = "claude-2" as const;
export const CLAUDE_INSTANT_1_2_MODEL_ID = "claude-instant-1.2" as const;

export const CLAUDE_DEFAULT_MODEL_CONFIG = {
  providerId: "anthropic",
  modelId: CLAUDE_2_1_MODEL_ID,
  displayName: "Claude 2.1",
  contextSize: 200000,
  recommendedTopK: 32,
  largeModel: true,
} as const;

export const CLAUDE_INSTANT_DEFAULT_MODEL_CONFIG = {
  providerId: "anthropic",
  modelId: CLAUDE_INSTANT_1_2_MODEL_ID,
  displayName: "Claude Instant 1.2",
  contextSize: 100000,
  recommendedTopK: 32,
  largeModel: false,
} as const;

export const MISTRAL_7B_INSTRUCT_MODEL_ID = "mistral_7B_instruct" as const;

export const MISTRAL_7B_DEFAULT_MODEL_CONFIG = {
  providerId: "textsynth",
  modelId: MISTRAL_7B_INSTRUCT_MODEL_ID,
  displayName: "Mistral 7B",
  contextSize: 8192,
  recommendedTopK: 16,
  largeModel: false,
} as const;

export const SUPPORTED_MODEL_CONFIGS = [
  GPT_3_5_TURBO_MODEL_CONFIG,
  GPT_4_32K_MODEL_CONFIG,
  GPT_4_MODEL_CONFIG,
  GPT_4_TURBO_MODEL_CONFIG,
  CLAUDE_DEFAULT_MODEL_CONFIG,
  CLAUDE_INSTANT_DEFAULT_MODEL_CONFIG,
  MISTRAL_7B_DEFAULT_MODEL_CONFIG,
] as const;

// this creates a union type of all the {providerId: string, modelId: string}
// pairs that are in SUPPORTED_MODELS
export type SupportedModel = ExtractSpecificKeys<
  (typeof SUPPORTED_MODEL_CONFIGS)[number],
  "providerId" | "modelId"
>;