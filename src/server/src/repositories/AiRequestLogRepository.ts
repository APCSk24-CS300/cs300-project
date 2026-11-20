import type { Pool } from 'pg';
import type { AIOutcome } from '../types/ChatResult.ts';

/** One AiRequestLog row. Never contains the question or the answer (FR-024, FR-031). */
export interface RequestLogRow {
	requestId: string,
	userId: string,
	role: string,
	facultyId: string | null,
	activityId?: string | null,
	semesterId?: number | null,
	topic: string,
	outcome: AIOutcome,
	blockReason?: string | null,
	ruleHits?: string[] | null,
	model?: string | null,
	promptVersion: string,
	inputTokens: number,
	outputTokens: number,
	classifierTokens: number,
	embeddingTokens: number,
	units: number,
	costUsd: number,
	latencyMs: number,
	llmLatencyMs?: number | null,
	retrievalMs?: number | null,
	toolRounds: number,
	sourceCount: number
}

export interface RequestLogStore {
	insert(row: RequestLogRow): Promise<void>
}

/** RequestLogStore over the AiRequestLog table (ai_gateway role). */
export class AiRequestLogRepository implements RequestLogStore {
	private readonly pool: Pool;

	constructor(pool: Pool) {
		this.pool = pool;
	}

	/**
	 * Inserts one row into <code>AiRequestLog</code> with a parameterized query. Runs as the <code>ai_gateway</code> database role, which may insert into this table but not change or delete rows. Throws on a database error; <code>UsageLogger</code> catches it.
	 * @param {RequestLogRow} r - The row. Never contains the message or the reply.
	 * @returns {Promise<void>}
	 *
	 * @example <caption>Usage</caption>
	 * await new AiRequestLogRepository(getAiPool()).insert({
	 *   requestId: '6f1c2a9e-0b7d-4a51-9c43-2f8e1d5a7b10', userId: '23127001', role: 'student', facultyId: 'IT',
	 *   topic: 'unclassified', outcome: 'answered', model: 'gemini-2.5-flash', promptVersion: 'v1',
	 *   inputTokens: 1000, outputTokens: 200, classifierTokens: 0, embeddingTokens: 0, units: 1200,
	 *   costUsd: 0.0008, latencyMs: 2350, toolRounds: 0, sourceCount: 0
	 * });
	 *
	 * @example <caption>Row in the database</caption>
	 * request_id | user_id  | role    | outcome  | units | cost_usd | latency_ms
	 * 6f1c2a9e-… | 23127001 | student | answered | 1200  | 0.000800 | 2350
	 */
	async insert(r: RequestLogRow): Promise<void> {
		await this.pool.query(
			`INSERT INTO "AiRequestLog" (request_id, user_id, role, faculty_id, activity_id, semester_id, topic,
				outcome, block_reason, rule_hits, model, prompt_version, input_tokens, output_tokens,
				classifier_tokens, embedding_tokens, units, cost_usd, latency_ms, llm_latency_ms, retrieval_ms,
				tool_rounds, source_count)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
				$21, $22, $23)`,
			[r.requestId, r.userId, r.role, r.facultyId, r.activityId ?? null, r.semesterId ?? null, r.topic,
			 r.outcome, r.blockReason ?? null, r.ruleHits ?? null, r.model ?? null, r.promptVersion,
			 r.inputTokens, r.outputTokens, r.classifierTokens, r.embeddingTokens, r.units, r.costUsd,
			 r.latencyMs, r.llmLatencyMs ?? null, r.retrievalMs ?? null, r.toolRounds, r.sourceCount]);
	}
}
