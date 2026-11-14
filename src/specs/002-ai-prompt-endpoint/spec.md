# Feature Specification: AI Student Assistant Prompt Endpoint

**Feature Branch**: `002-ai-prompt-endpoint`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Implement the endpoint `api/ai/prompt`, do this phase 1. I think I will use the Google free AI API for this service."

**Related documents**: UC-06 "Chat with AI Student Assistant" (`docs/requirements/use-case-specifications.md`), NFR-REL-04/05/06 and NFR-SEC-03/10/11 (`docs/requirements/vision-document.md`), business requirement note that chatbot context needs no dedicated persistent entity (`docs/analysis-and-design/db/business-requirement.md`).

## Scope

Phase 1 delivers the backend part of UC-06 only: a logged-in student sends a message (plus, optionally, the earlier turns of the same conversation) and receives the assistant's answer.

**In scope**: receiving a question, passing it with the conversation so far to an external AI service, returning the answer, input validation, access control, friendly errors when the AI service fails, and per-student request limits.

**Out of scope for this phase** (later features): the chat screen (UC-06 S01–S07), personalised activity recommendations that read the student's own activities, interests or scores (UC-06 steps 4 and A3, A7, A9), storing conversations on the server, streaming answers word by word, and the reverse proxy.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ask the assistant a question (Priority: P1)

A logged-in student types a question about student activities or university procedures and receives a written answer from the AI Student Assistant.

**Why this priority**: This is the core of UC-06. Without it there is no assistant at all.

**Independent Test**: Send one question as a logged-in student and check that a non-empty answer comes back.

**Acceptance Scenarios**:

1. **Given** a logged-in student, **When** they send "How do I earn training points?", **Then** the system returns a success response containing a non-empty answer.
2. **Given** a logged-in student, **When** they send a question outside the assistant's scope (for example, "Write my essay about World War II"), **Then** the answer explains the assistant's limits and suggests topics it can help with (UC-06 A2).
3. **Given** a logged-in student, **When** they ask about an official rule the assistant is not sure about, **Then** the answer says the information may be incomplete and suggests checking with the university, instead of stating it as official policy (UC-06 A8).

---

### User Story 2 - Continue a conversation (Priority: P2)

A student asks a follow-up question that refers to an earlier message ("What about the second one?"), and the assistant answers using the earlier turns.

**Why this priority**: Conversation history is part of the Phase 1 MVP and UC-06 A10, but a single question already gives value on its own.

**Independent Test**: Send a question together with two earlier turns that give it meaning, and check the answer follows from them.

**Acceptance Scenarios**:

1. **Given** a student who earlier asked about two clubs and got an answer, **When** they send "Tell me more about the second one" together with those earlier turns, **Then** the answer refers to the second club.
2. **Given** a request with no earlier turns, **When** it is sent, **Then** it is treated as the start of a new conversation.

---

### User Story 3 - Clear feedback when something goes wrong (Priority: P2)

When the request is invalid, the student is not logged in, the student sends too many requests, or the AI service is slow or down, the student gets a clear message and can try again, and the rest of the system keeps working.

**Why this priority**: Required by UC-06 A1 and A6, NFR-REL-04 and NFR-REL-05. The free AI service has strict usage limits, so failures will happen.

**Independent Test**: Send an empty message, a request without login, and a request while the AI service is unreachable; check each gets the right error and no technical details.

**Acceptance Scenarios**:

1. **Given** a logged-in student, **When** they send an empty or blank message, **Then** the system rejects it and asks for a valid message (UC-06 A1).
2. **Given** a visitor who is not logged in, **When** they send a message, **Then** the system refuses access.
3. **Given** the AI service is unavailable, times out, or has used up its quota, **When** a student sends a message, **Then** the system returns a "temporarily unavailable, please try again" error, and other endpoints such as `/health` and `/api/auth/register` keep working (UC-06 A6, NFR-REL-04).
4. **Given** a student who has already sent the maximum number of messages allowed in the current minute, **When** they send another, **Then** the system refuses it and says when they can try again.

### Edge Cases

- Message is missing, not text, blank, or longer than 2,000 characters → rejected as invalid.
- Earlier turns are not a list, have an unknown speaker, have blank or over-long text, or there are more than 20 of them → rejected as invalid.
- The request body is not valid JSON or has the wrong content type → rejected with the same errors as other endpoints.
- The AI service refuses to answer for safety reasons → the student gets a polite message that the assistant cannot help with that request, not an error.
- The AI service returns an empty or unreadable answer → treated as the service being unavailable.
- The AI key is not configured on the server → the server still starts; prompt requests return "temporarily unavailable", and the cause is logged for the team.
- A message asks for another student's personal data → the assistant has no access to any student data in this phase, so it cannot reveal it, and it says so (UC-06 A4, NFR-SEC-10).
- A message tries to make the assistant ignore its rules ("ignore previous instructions") → the assistant stays within its scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an endpoint at `/api/ai/prompt` that accepts a student's message and returns the assistant's answer.
- **FR-002**: The endpoint MUST accept only `POST` requests with a JSON body and MUST reject other methods and content types the same way existing endpoints do.
- **FR-003**: The endpoint MUST only serve logged-in users and MUST refuse requests without a valid access token.
- **FR-004**: The system MUST reject a message that is missing, not text, blank after trimming spaces, or longer than 2,000 characters, with a message saying what is wrong.
- **FR-005**: The system MUST accept an optional list of earlier conversation turns, each marked as written by the student or by the assistant, and MUST use them as context for the answer.
- **FR-006**: The system MUST reject the earlier-turns list if it has more than 20 turns, or any turn has an unknown speaker or text that is blank or over 2,000 characters.
- **FR-007**: The assistant MUST be instructed to stay within its scope (student activities, training points, and university procedures at the University of Science, VNU-HCM), to explain its limits for out-of-scope questions, and not to present uncertain information as official university policy.
- **FR-008**: The system MUST NOT send any student's personal data (name, email, phone, student ID, scores) to the AI service in this phase; only the message text and earlier turns supplied in the request are sent.
- **FR-009**: When the AI service is unavailable, times out (no answer within 20 seconds), reports its quota is used up, or returns an unreadable answer, the system MUST return a "temporarily unavailable, try again" error and MUST NOT expose technical details or the AI provider's raw error.
- **FR-010**: When the AI service declines to answer for safety reasons, the system MUST return a success response with a polite fixed message saying the assistant cannot help with that request.
- **FR-011**: The system MUST limit each user to 10 prompt requests per minute and MUST tell a user who exceeds it how many seconds to wait.
- **FR-012**: The AI service key MUST be read from the server's environment configuration and MUST NOT appear in source code, logs, or responses.
- **FR-013**: The server MUST start and its other endpoints MUST work even if the AI key is missing or the AI service is down.
- **FR-014**: Every failed call to the AI service MUST be logged with the time, user, and error type, but MUST NOT log the message content or the key (NFR-REL-06, NFR-SEC-09).
- **FR-015**: All responses MUST use the same response format as existing endpoints (success flag, status code, message, data).

### Key Entities

- **Prompt request**: what the student sends. The new message and an optional list of earlier turns.
- **Conversation turn**: one earlier message. Who wrote it (student or assistant) and its text. Turns are held by the client and sent with each request; the server does not store them.
- **Assistant answer**: the text returned to the student.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A logged-in student receives an answer to a typical question in under 10 seconds in at least 9 out of 10 attempts while the AI service is healthy.
- **SC-002**: 100% of invalid requests in the test suite (empty message, too long, bad turns, wrong method, wrong content type, no login) are rejected with the correct error and never reach the AI service.
- **SC-003**: When the AI service is unreachable, 100% of prompt requests get a clear "try again" error within 21 seconds, and health and registration requests still succeed.
- **SC-004**: In a follow-up test with two earlier turns, the answer correctly refers to the earlier conversation.
- **SC-005**: A search of the repository finds no AI key, and no response or log line in the test suite contains the key.
- **SC-006**: In a set of 5 out-of-scope questions, the assistant declines or redirects all 5 instead of answering them.

## Assumptions

- The external AI service is Google's Gemini API on its free tier, as the user chose. Free-tier quotas are small, so requests limits (FR-011) and "try again" errors (FR-009) are expected in normal use.
- Conversation history is kept by the client and sent with each request. This matches the business requirement that chatbot context needs no dedicated persistent entity, and avoids depending on the database, which is not connected yet. Server-side history can be added in a later feature once PostgreSQL is wired in.
- "Logged-in" means a valid access token, checked the same way as other protected endpoints. The current token check does not yet read the user's role, so restricting the endpoint to students only (NFR-SEC-03) will follow when login issues role-bearing tokens.
- The answer is plain text (it may contain simple Markdown); the client decides how to display it.
- Request limits are kept in server memory, so they reset when the server restarts. That is acceptable for a single-server Phase 1.
- The 2,000-character and 20-turn limits are reasonable defaults for a student chat and keep each call within free-tier limits.
