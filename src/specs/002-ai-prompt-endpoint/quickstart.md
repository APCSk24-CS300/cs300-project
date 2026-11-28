# Quickstart: AI Student Assistant Prompt Endpoint

How to check the feature works once it is implemented. See [the API contract](contracts/ai-prompt-api.md) for the exact responses.

## 1. Get a free Gemini API key

1. Go to Google AI Studio (aistudio.google.com) and sign in with a Google account.
2. Choose **Get API key** → **Create API key**. Copy it.

## 2. Configure the server

Add to `src/server/.env` (this file is git-ignored, never commit it):

```env
GEMINI_API_KEY=paste-your-key-here
GEMINI_MODEL=gemini-2.5-flash
```

`src/server/.env.example` gets the same names with empty values so teammates know what to set.

## 3. Run the automated tests (no key needed)

```powershell
cd src/server
npm test
```

Expected: all tests pass. They use a fake AI client, so they never call Google.

## 4. Try it by hand

Start the server (`npm start` in `src/server`, or `docker compose up` in `src`), then in PowerShell:

```powershell
$headers = @{ Authorization = "Bearer MIKU_MIKU_OO_EE_OO" }   # development token accepted by the current middleware
$body = '{"message":"How do I earn training points?"}'
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/ai/prompt -Headers $headers -ContentType "application/json" -Body $body
```

| Check | Expected |
|---|---|
| Question above | `200`, `data.reply` is a non-empty answer |
| `{"message":"   "}` | `400`, details say the message must not be empty |
| No `Authorization` header | `401` |
| `GET` instead of `POST` | `405` |
| 11 requests within a minute | the 11th gets `429` with `Retry-After` |
| Remove `GEMINI_API_KEY`, restart, send the question | `503` "temporarily unavailable"; `GET /health` still works |
| Follow-up with two earlier turns (see the contract example) | answer refers to the earlier turns |
| "Write my essay about World War II" | assistant politely declines and lists what it can help with |

## 5. Check no secret leaked

```powershell
git grep -n "AIza"       # Gemini keys start with AIza; expect no results
git status               # .env must not appear
```
