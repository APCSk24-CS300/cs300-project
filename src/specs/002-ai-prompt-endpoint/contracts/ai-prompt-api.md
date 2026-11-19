# API Contract: Send a message to the AI Student Assistant

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/ai/prompt` |
| **Auth required** | Yes, `Authorization: Bearer <access token>` |
| **Request body** | JSON ([PromptRequest](../data-model.md#promptrequest-request-body)) |
| **Success status** | `200 OK` |

## Processing order

The first step that fails sends the response.

1. JSON body parsing (`bodyParser.json()`): broken JSON currently answers `500` (known issue #4 in the register API doc; the shared error handler is not changed by this feature).
2. Method check (`ValidatorMiddleware.validateMethod([POST])`) → `405` with `Allow: POST`.
3. Access token check (`ValidatorMiddleware.validateAccessToken`) → `401` with `WWW-Authenticate`.
4. Content-Type check (`ValidatorMiddleware.validateContentType`) → `415`.
5. Rate limit (`RateLimitMiddleware`, 10 per minute per user) → `429` with `Retry-After`.
6. Body validation (`AIController.prompt`) → `400` with `data.details` listing the problems.
7. Call the AI (`AIService.prompt` → `LLMClient`) → `200`, or `503` if the AI service fails.

## Request example

```http
POST /api/ai/prompt HTTP/1.1
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...

{
  "message": "Tell me more about the second one",
  "history": [
    { "role": "user", "text": "Which volunteer clubs can I join?" },
    { "role": "assistant", "text": "Two popular ones are the Green Summer Club and the Blood Donation Club..." }
  ]
}
```

## Responses

All responses use the existing `ServiceResponse` format. The server appends the status name to `message`.

### `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "payload": {
    "message": "Prompt answered (OK)",
    "data": { "reply": "The Blood Donation Club runs a donation day each semester...", "blocked": false }
  }
}
```

When the AI refuses for safety reasons, `blocked` is `true` and `reply` is: "Sorry, I can't help with that request. I can answer questions about student activities, training points and university procedures."

### `400 Bad Request`

```json
{
  "success": false,
  "statusCode": 400,
  "payload": {
    "message": "Invalid prompt request (BAD_REQUEST)",
    "data": { "details": ["message must not be empty", "history[1].role must be \"user\" or \"assistant\""] }
  }
}
```

Possible details: `message is required`, `message must be a string`, `message must not be empty`, `message must be at most 2000 characters`, `history must be an array`, `history must have at most 20 turns`, `history[i] must be an object`, `history[i].role must be "user" or "assistant"`, `history[i].text must be a non-empty string`, `history[i].text must be at most 2000 characters`.

### `401 Unauthorized`, `405 Method Not Allowed`, `415 Unsupported Media Type`

Same bodies and headers as the existing middleware produces for other endpoints.

### `429 Too Many Requests`

Header `Retry-After: <seconds>`. Body message: "Too many requests, please try again in N seconds (TOO_MANY_REQUESTS)".

### `503 Service Unavailable`

Header `Retry-After: 30` when Gemini reported its quota was used up.

```json
{
  "success": false,
  "statusCode": 503,
  "payload": { "message": "AI assistant is temporarily unavailable, please try again later (SERVICE_UNAVAILABLE)" }
}
```

No provider error text, stack trace or key is ever included.
