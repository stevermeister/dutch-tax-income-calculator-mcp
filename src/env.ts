export interface Env {
  RATE_LIMITER: RateLimit;
  /** OpenAI App Directory domain-verification token. Unset until the submission portal issues one. */
  OPENAI_APPS_CHALLENGE_TOKEN?: string;
}
