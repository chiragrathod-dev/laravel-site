# Homepage RAG Chat Assistant — Design

## Intent

Build a small chat assistant on the homepage so the user can learn how a
Retrieval-Augmented Generation (RAG) pipeline works end to end, inside
this Laravel 13 + Inertia/React app. The goal is understanding each stage
of the pipeline, not shipping a production chatbot for a real business.

## Goals

- Walk through every RAG stage with visible, readable code: chunking,
  embedding generation, vector storage, similarity retrieval, prompt
  construction, and answer generation.
- Use sample FAQ data for a fictional product (not real business content).
- Use OpenAI for both embeddings and the answering LLM, configured via
  `.env`.
- Keep infrastructure minimal: reuse the existing SQLite database, no new
  services to install or accounts to create.
- Beginner-friendly: each piece of the pipeline should be easy to trace
  and explain, not hidden behind a framework/package abstraction.

## Non-goals

- Performance/cost optimization (caching, model routing, token
  minimization, streaming) — explicitly deferred to a later round.
- Real business content, multi-tenancy, auth-gating, or rate limiting.
- A reusable/production RAG package or library abstraction.

## Anti-goals

- A black-box package that hides chunking, embedding, or similarity math
  — defeats the learning purpose.
- Requiring a database engine swap or a new extension (e.g. Postgres +
  pgvector) for this first pass.

## Constraints

- Laravel 13, PHP 8.5, SQLite (`DB_CONNECTION=sqlite`, confirmed current
  default).
- Inertia + React frontend; pages live in `resources/js/pages`, homepage
  is `welcome.tsx`.
- OpenAI API key supplied via `.env`.
- Follow project conventions in `AGENTS.md`: `php artisan make:` for new
  files, PHP 8 constructor promotion + explicit types, Pint formatting,
  feature tests for meaningful behavior, no new base folders without
  flagging it.

## Approaches considered

**Vector storage/retrieval:**

| Approach | Tradeoff |
|---|---|
| **A. Brute-force PHP similarity** — embeddings stored as JSON in a DB column, cosine similarity computed in PHP at query time | No new infra, works with existing SQLite, every step visible in plain PHP. Doesn't scale past a few thousand chunks — irrelevant for a sample FAQ set. **Chosen.** |
| B. Postgres + pgvector | Real SQL-level vector queries, closer to production — but requires swapping the DB engine and installing an extension before writing any pipeline code. |
| C. External vector store (Pinecone/Chroma/Qdrant) | Decouples storage from the app, common in real stacks — but adds a third-party service and a second API to learn on a first pass. |

Chose **A**: keeps every moving part inside the app in plain PHP, so the
user can trace a question through embedding → similarity score →
retrieved chunk → prompt in one place. B and C are natural next steps
once the pipeline itself is understood.

**Provider:** OpenAI for both embeddings and chat generation, called
directly via Laravel's `Http` client (no SDK) so the raw request/response
shapes are visible. One provider instead of two keeps setup to a single
API key.

## Architecture

### 1. Data model

- Migration: `document_chunks` table — `id`, `source` (string), `content`
  (text), `embedding` (json — float array), `metadata` (json, nullable),
  timestamps.
- `DocumentChunk` model, `embedding` and `metadata` cast to `array`.

### 2. Sample content

- A small knowledge base of fictional-product FAQs (builder invents the
  product — something lightweight, e.g. a fictional cloud storage
  service), ~15-20 Q&A entries, stored as a plain text/markdown source
  file. Each FAQ entry is a natural chunk, which keeps the chunking step
  simple while still being a real chunking decision worth explaining.

### 3. Ingestion pipeline

- `php artisan rag:ingest` Artisan command, pipeline made of explicit
  steps a reader can follow in order:
  1. Load the source FAQ file.
  2. Split it into chunks (one per FAQ entry; also include a small,
     clearly-separated generic paragraph-splitter helper so the user sees
     a non-trivial chunking strategy too, even though it isn't needed for
     this dataset).
  3. Call OpenAI's embeddings endpoint for each chunk.
  4. Store chunk text + embedding in `document_chunks` (command is
     idempotent — clears existing rows for the source before
     re-inserting).
- An `EmbeddingService` (or similarly named class) wraps the OpenAI
  embeddings call so both ingestion and retrieval use the same method.
- **Running ingestion (builder's call):** `rag:ingest` is a manual step
  the user runs once after setting `OPENAI_API_KEY`, not wired into
  `composer.json`'s setup scripts. This is a learning exercise explored
  by hand, not a deployable feature that needs to work unattended on a
  fresh clone — the plan's final step will just say to run the command.

### 4. Retrieval

- A retrieval service with `retrieveRelevantChunks(string $question, int
  $topK = 3)`:
  1. Embed the question (same `EmbeddingService`).
  2. Load all stored chunks, compute cosine similarity between the
     question embedding and each chunk's embedding.
  3. Sort by similarity, return the top K.
- Cosine similarity implemented explicitly (dot product over the product
  of magnitudes) as a small, named helper — not hidden in a library call
  — since seeing this math is part of the point.

### 5. Prompt construction & generation

- A service that:
  1. Builds a system prompt instructing the model to answer only from
     the given context and say it doesn't know when the context doesn't
     cover the question.
  2. Concatenates retrieved chunks into a context block and composes the
     user message (question + context).
  3. Calls OpenAI's chat completions endpoint via `Http`.
  4. Returns the answer text alongside which chunks were used (useful
     for the user to see retrieval working, not just the final answer).

### 6. HTTP layer

- `POST /chat` route → a controller action that validates the incoming
  question, runs retrieval then generation, and returns JSON (`answer`,
  `sources`). This is a plain JSON endpoint, not an Inertia page render —
  the chat widget calls it directly from the client.
- **CSRF (builder's call):** the route stays in the standard `web`
  middleware group, so Laravel's CSRF check still applies. Since this
  app dropped axios (Inertia v3) and has no interceptor auto-attaching
  tokens, the `ChatWidget` reads the `XSRF-TOKEN` cookie Laravel already
  sets on every response and sends it back as an `X-XSRF-TOKEN` header
  on its `fetch` call — the standard Laravel pattern for plain JS
  requests, no axios or extra middleware needed.
- **Failure handling (builder's call):** the embedding/generation
  services raise a clear, specific exception when `OPENAI_API_KEY` is
  missing or the OpenAI call fails (network error, 401, 429). The
  controller catches that and returns a JSON error response (e.g. HTTP
  502, `{ "error": "..." }`) instead of a raw 500. The `ChatWidget` shows
  that message in the UI instead of failing silently. This is baseline
  robustness, not the performance/cost optimization excluded above.

### 7. Frontend

- A simple `ChatWidget` React component on the homepage (`welcome.tsx` or
  a shared component): text input, send button, message list. On submit,
  POSTs to `/chat`, shows a loading state, then renders the answer and
  the matched FAQ sources. No streaming, no persistence, no auth-gating —
  just enough UI to exercise the pipeline end to end.

### 8. Configuration

- `.env`: `OPENAI_API_KEY`.
- A small config file (e.g. `config/openai.php` or an entry in
  `config/services.php`) for the embedding model name, chat model name,
  and top-K constant, so these aren't magic strings buried in services.

## What's left to the builder

- The fictional product/domain for the sample FAQ content.
- Exact wording/boundaries of the generic paragraph-splitter helper.
- Where new service classes live (no `app/Services` directory exists
  yet in this app — builder proposes one, e.g. `app/Services/Rag/`).
- Exact React component styling (kept minimal; this is a learning
  exercise, not a design pass).
- Test coverage specifics: per `AGENTS.md`, add feature tests for the
  ingestion command and the chat endpoint (e.g. `Http::fake()` for OpenAI
  calls) — builder decides exact cases.
