-- Optional demo entities. Called from seed.sql only when ai_schema.sql is installed.
DO $$
BEGIN
 IF to_regclass('public."AiConsent"') IS NULL THEN
   RAISE NOTICE 'AI schema is not installed; skipping optional AI demo entities.';
   RETURN;
 END IF;

 -- Synthetic embedding for table coverage only. Inactive so retrieval cannot use it;
 -- replace through the real indexing pipeline before enabling this chunk.
 EXECUTE $insert$
 INSERT INTO "AiKnowledgeChunk" (source_type, source_id, chunk_index, content,
 content_hash, embedding, audience, trust, author_user_id, is_active, updated_at)
 VALUES ('faq', 'seed-demo-faq', 0, 'Demo: bring your student ID to activity check-in.',
 md5('Demo: bring your student ID to activity check-in.'),
 $insert$ || quote_literal(array_to_json(array_fill(0.001::real, ARRAY[768]))::text) || $insert$,
 'student', 'staff_written', 'SEED-MANAGER', FALSE, '2026-11-23 09:00+07')
 $insert$;

 INSERT INTO "AiRequestLog" (request_id, user_id, role, faculty_id, topic, outcome,
 block_reason, rule_hits, prompt_version, latency_ms, created_at)
 VALUES ('00000000-0000-4000-8000-000000000001', 'SEED-STUDENT-1', 'student',
 'SEED-FAC-MCS', 'off_topic', 'refused_off_topic', 'Demo off-topic refusal',
 ARRAY['off_topic_repeat'], 'seed-demo-v1', 10, '2026-11-23 09:00+07');
 INSERT INTO "AiToolCall" (request_id, tool_name, arguments, allowed, row_count, duration_ms, created_at)
 VALUES ('00000000-0000-4000-8000-000000000001', 'list_activities', '{}', FALSE,
 0, 0, '2026-11-23 09:00+07');
 INSERT INTO "AiFlag" (request_id, category, severity, status, expires_at, created_at)
 VALUES ('00000000-0000-4000-8000-000000000001', 'off_topic_repeat', 'low', 'open',
 '2026-12-23 09:00+07', '2026-11-23 09:00+07');
 INSERT INTO "AiUserQuota" (user_id, limit_5h, limit_week, updated_by_user_id, updated_at, reason)
 VALUES ('SEED-STUDENT-1', 40000, 200000, 'SEED-ADMIN', '2026-11-23 08:00+07',
 'Demo student quota.');
 INSERT INTO "AiUsageWindow" (user_id, window_type, window_start, window_end, units_used, requests)
 VALUES
 ('SEED-STUDENT-1', '5h', '2026-11-23 08:00+07', '2026-11-23 13:00+07', 0, 1),
 ('SEED-STUDENT-1', 'week', '2026-11-23 08:00+07', '2026-11-30 08:00+07', 0, 1);
 INSERT INTO "AiConsent" (user_id, notice_version, accepted_at)
 VALUES ('SEED-STUDENT-1', '1', '2026-11-23 08:00+07');
END $$;
