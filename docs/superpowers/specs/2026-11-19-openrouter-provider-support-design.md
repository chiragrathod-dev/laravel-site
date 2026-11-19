# OpenRouter Provider Support — Design (short)

## Intent

Let the RAG pipeline (embeddings + chat completion) run against either
OpenAI directly or OpenRouter, selected by one setting, instead of being
locked to OpenAI.

## Goals

- One `RAG_PROVIDER` env var (`openai` default, or `openrouter`) switches
  **both** `EmbeddingService` and `ChatCompletionService` to the matching
  provider — confirmed as your call over mixing providers per-service.
- No change to either service's request-building or response-parsing
  logic. Confirmed via OpenRouter's official API docs: its embeddings
  (`POST /api/v1/embeddings`) and chat completions (`POST
  /api/v1/chat/completions`) endpoints are OpenAI-compatible — same
  `Authorization: Bearer <key>` header, same `data[0].embedding` /
  `choices[0].message.content` response shape that the services already
  read.
- Each provider gets its own base URL, API key env var, and model
  defaults, since OpenRouter model IDs are provider-prefixed (e.g.
  `openai/text-embedding-3-small`) and can't share a default with
  OpenAI's flat `text-embedding-3-small`.

## Non-goals

- Mixing providers (embeddings via one, chat via the other) — out of
  scope per your "one setting for both" call.
- Any provider beyond OpenAI and OpenRouter.
- A provider abstraction/interface layer. Not needed: both providers'
  request/response shapes are already compatible, so introducing an
  interface would be abstraction with no second implementation shape to
  justify it.

## Constraints

- Keep `config/openai.php`'s filename as-is — renaming it would ripple
  into every `config('openai.*')` call site (both services, the
  controller, and the plan's test files) for no functional benefit.
  Restructure its contents instead.
- Existing tests that set `config(['openai.api_key' => 'test-key'])` will
  need updating to the new provider-scoped path, since `openai.api_key`
  stops meaning "the" key once it's provider-scoped. This is a known,
  mechanical ripple across the embedding/chat/retrieval/ingest/controller
  test files from the original RAG plan.
- This depends on the already-built `EmbeddingService`/
  `ChatCompletionService` (from the RAG feature currently in PR #2), so
  it builds as a new branch stacked on `worktree-rag-chat-assistant`
  rather than more commits onto that already-reviewed PR.

## The design

`config/openai.php` restructured:

```php
return [
    'provider' => env('RAG_PROVIDER', 'openai'),

    'providers' => [
        'openai' => [
            'base_url' => 'https://api.openai.com/v1',
            'api_key' => env('OPENAI_API_KEY'),
            'embedding_model' => env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
            'chat_model' => env('OPENAI_CHAT_MODEL', 'gpt-4o-mini'),
        ],
        'openrouter' => [
            'base_url' => 'https://openrouter.ai/api/v1',
            'api_key' => env('OPENROUTER_API_KEY'),
            'embedding_model' => env('OPENROUTER_EMBEDDING_MODEL', 'openai/text-embedding-3-small'),
            'chat_model' => env('OPENROUTER_CHAT_MODEL', 'openai/gpt-4o-mini'),
        ],
    ],

    'top_k' => (int) env('OPENAI_RAG_TOP_K', 3),
];
```

A new, small `App\Services\Rag\RagProviderConfig::current(): array` reads
`config('openai.provider')` and returns that provider's sub-array
(`base_url`, `api_key`, `embedding_model`, `chat_model`). Both services
use it instead of duplicating the "which provider is active" lookup.

`EmbeddingService::embed()` and `ChatCompletionService::complete()`
change from `config('openai.api_key')` / a hardcoded URL to
`RagProviderConfig::current()`, building each request URL as
`"{$config['base_url']}/embeddings"` or `"/chat/completions"`. Everything
else — the `ConnectionException` handling, failure checks, response-shape
validation — stays exactly as it is today.

`.env.example` gets `OPENAI_API_KEY=`, `RAG_PROVIDER=openai`, and
commented-out `OPENROUTER_API_KEY=` / model-override lines (this also
fixes the pre-existing gap where the OpenAI vars were missing from
`.env.example` at all).

`docs/rag-pipeline.md` gets a short "switching providers" section, plus a
note that switching provider — like switching models — requires
re-running `rag:ingest`, since stored embedding vectors aren't comparable
across models/dimensions.

## What's left to the builder

- Exact wording of the new docs section and `.env.example` comments.
- Whether `RagProviderConfig::current()` returns a plain array or a
  small typed value object — a plain array matches this feature's
  existing style (no DTOs used anywhere else in it).
