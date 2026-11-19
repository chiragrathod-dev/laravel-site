# RAG chat pipeline

This app has a hand-rolled retrieval-augmented generation (RAG) pipeline backing the
"Ask the documentation assistant" chat widget on the homepage. It is intentionally simple:
no vector database, no queue — everything happens synchronously against OpenAI's HTTP API.

## Pipeline diagram

**Ingest** (`php artisan rag:ingest`, run manually whenever FAQ content changes):

```
resources/rag/faq.md
    -> TextChunker::splitFaqMarkdown()      (## headers -> {question, answer} pairs)
    -> EmbeddingService::embed()            (OpenAI embeddings API, one call per chunk)
    -> document_chunks table                (via DocumentChunk::create(), source = "faq")
```

**Query** (`POST /chat`, triggered by the homepage `ChatWidget`):

```
question (ChatWidget fetch)
    -> ChatController::ask()
        -> RetrievalService::retrieveRelevantChunks()
            -> EmbeddingService::embed($question)
            -> VectorMath::cosineSimilarity() against every DocumentChunk, sorted desc, take top_k
        -> PromptBuilder::build()            (system prompt + "Context: ... \n\n Question: ...")
        -> ChatCompletionService::complete() (OpenAI chat completions API)
    -> JSON response {answer, sources}  (or {error} with a 4xx/502 status — see Troubleshooting)
    -> ChatWidget renders the assistant message and its sources, or the error text
```

## File-by-file map

| File | Responsibility |
| --- | --- |
| `config/openai.php` | Reads `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL`, `OPENAI_CHAT_MODEL`, `OPENAI_RAG_TOP_K` from the environment and exposes them as `openai.api_key`, `openai.embedding_model`, `openai.chat_model`, `openai.top_k`. |
| `database/migrations/2026_11_19_091502_create_document_chunks_table.php` | Creates `document_chunks` (`source`, `content`, `embedding` json, `metadata` json nullable, timestamps). |
| `app/Models/DocumentChunk.php` | Eloquent model for `document_chunks`. Casts `embedding`/`metadata` to arrays. `DocumentChunk::SOURCE_FAQ` identifies rows ingested from the FAQ file. |
| `database/factories/DocumentChunkFactory.php` | Factory used by Rag tests to create `DocumentChunk` rows. |
| `app/Services/Rag/TextChunker.php` | `splitFaqMarkdown()` splits the FAQ markdown into `{question, answer}` pairs on `## ` headers. `splitIntoParagraphChunks()` is a generic paragraph-based chunker (not currently wired into the ingest command, available for chunking non-FAQ sources). |
| `app/Services/Rag/EmbeddingService.php` | Calls `POST https://api.openai.com/v1/embeddings` with `openai.embedding_model`; returns the embedding vector or throws `OpenAiRequestException`. |
| `app/Services/Rag/VectorMath.php` | `cosineSimilarity()` between two equal-length vectors (returns `0.0` if either has zero magnitude). |
| `app/Services/Rag/RetrievalService.php` | Embeds the question, scores every `DocumentChunk` by cosine similarity, returns the top `$topK` as `{chunk, score}` pairs, best match first. |
| `app/Services/Rag/PromptBuilder.php` | Builds the system prompt (`PromptBuilder::SYSTEM_PROMPT`) and a user prompt listing the matched chunk contents as numbered context, followed by the question. |
| `app/Services/Rag/ChatCompletionService.php` | Calls `POST https://api.openai.com/v1/chat/completions` with `openai.chat_model`; returns the assistant's reply text or throws `OpenAiRequestException`. |
| `app/Exceptions/Rag/OpenAiRequestException.php` | Thrown by `EmbeddingService`/`ChatCompletionService` when the API key is missing or the HTTP call fails/returns an unexpected shape. Caught in `ChatController` and turned into a 502 JSON response. |
| `app/Console/Commands/RagIngestCommand.php` | `rag:ingest` artisan command. Deletes existing `source = 'faq'` chunks, re-splits `resources/rag/faq.md`, embeds each `Q:`/`A:` pair, and stores it. |
| `resources/rag/faq.md` | The sample FAQ source document ingested by `rag:ingest`. Currently a fictional product ("Pebble") used to exercise the pipeline end to end — not real product content. |
| `app/Http/Controllers/ChatController.php` | `ask()` validates `question` (required, string, max 1000 chars), runs retrieval + prompt build + completion, and returns `{answer, sources}` on success or `{error}` (502) when `OpenAiRequestException` is thrown. |
| `routes/web.php` | Defines `Route::post('chat', [ChatController::class, 'ask'])->name('chat.ask')`. |
| `resources/js/components/home/chat-widget.tsx` | Homepage chat UI. Posts `{question}` as JSON to `/chat`, renders the conversation and sources, shows `error` text on a non-OK response. |
| `resources/js/lib/csrf.ts` | `getCsrfTokenFromCookie()` reads the `XSRF-TOKEN` cookie so the widget can send it as `X-XSRF-TOKEN` on its fetch call. |

### Tests

| Path | Covers |
| --- | --- |
| `tests/Unit/Rag/VectorMathTest.php` | `VectorMath::cosineSimilarity()` |
| `tests/Unit/Rag/PromptBuilderTest.php` | `PromptBuilder::build()` |
| `tests/Unit/Rag/TextChunkerTest.php` | `TextChunker::splitFaqMarkdown()` / `splitIntoParagraphChunks()` |
| `tests/Feature/Rag/EmbeddingServiceTest.php` | `EmbeddingService::embed()` against a faked HTTP response |
| `tests/Feature/Rag/ChatCompletionServiceTest.php` | `ChatCompletionService::complete()` against a faked HTTP response |
| `tests/Feature/Rag/RetrievalServiceTest.php` | `RetrievalService::retrieveRelevantChunks()` ranking |
| `tests/Feature/Rag/DocumentChunkTest.php` | `DocumentChunk` model/casts |
| `tests/Feature/Rag/RagIngestCommandTest.php` | `rag:ingest` end to end |
| `tests/Feature/Rag/ChatControllerTest.php` | `POST /chat` success, validation (422), and missing-API-key (502) cases |

## How to add or edit FAQ content

1. Edit `resources/rag/faq.md`. Each entry is a `## Question` header followed by its answer text.
2. Re-run `php artisan rag:ingest`. This deletes all existing `document_chunks` rows where
   `source = 'faq'` and recreates them from the current file, generating a fresh embedding for
   each entry (this calls the real OpenAI API, so `OPENAI_API_KEY` must be set).

## How to change the embedding/chat model or `top_k`

Edit the defaults in `config/openai.php`, or set the matching `.env` variable (env vars always
win over the config defaults):

| Config key | `.env` var | Default |
| --- | --- | --- |
| `openai.embedding_model` | `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` |
| `openai.chat_model` | `OPENAI_CHAT_MODEL` | `gpt-4o-mini` |
| `openai.top_k` | `OPENAI_RAG_TOP_K` | `3` |

If you change `OPENAI_EMBEDDING_MODEL`, re-run `php artisan rag:ingest` — existing chunks were
embedded with the old model and comparing vectors from two different embedding models is
meaningless.

## Required `.env` vars

- `OPENAI_API_KEY` — required. There is no default; `EmbeddingService` and
  `ChatCompletionService` both throw `OpenAiRequestException::missingApiKey()` immediately if
  it's empty.
- `OPENAI_EMBEDDING_MODEL` — optional, defaults to `text-embedding-3-small`.
- `OPENAI_CHAT_MODEL` — optional, defaults to `gpt-4o-mini`.
- `OPENAI_RAG_TOP_K` — optional, defaults to `3`.

Note: these vars are not yet in `.env.example`; add them locally when working on this feature.

## Running this feature's tests

```bash
php artisan test tests/Unit/Rag tests/Feature/Rag --compact
```

## Troubleshooting: 502 vs 422 responses

`POST /chat` can fail two different ways, and the `ChatWidget` treats both as a generic error
(it reads `body.error` and shows it under the input):

- **422 Unprocessable Content** — Laravel's own validation failure (`question` missing, not a
  string, or over 1000 characters). This is the framework's default validation error shape
  (`{"message": ..., "errors": {...}}`), **not** `{"error": ...}` — `ChatController` never
  touches this response. If you see the widget display `undefined` as the error text, this is
  why: the widget's `ChatErrorResponse` type assumes an `error` key that a 422 response doesn't
  have.
- **502 Bad Gateway** — `ChatController::ask()` caught an `OpenAiRequestException` thrown by
  `EmbeddingService` or `ChatCompletionService`. This happens when `OPENAI_API_KEY` is empty, or
  when the OpenAI HTTP call itself fails (network error, non-2xx response, or an unexpected
  response body shape). The JSON body in this case is `{"error": "<message>"}`, which the
  widget displays directly. Check `OPENAI_API_KEY` is set to a valid key and that OpenAI's API
  isn't rate-limiting or otherwise rejecting requests.
