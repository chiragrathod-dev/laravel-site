# OpenRouter Provider Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the RAG pipeline's `EmbeddingService` and `ChatCompletionService` run against either OpenAI or OpenRouter, selected by one `RAG_PROVIDER` env var, with no change to either service's request-building, failure-handling, or response-parsing logic.

**Architecture:** `config/openai.php` grows a `provider` switch plus a `providers` array holding each provider's base URL, API key, and model defaults. A new `RagProviderConfig::current()` helper resolves the active provider's config once; both services swap their hardcoded OpenAI URL/key lookup for that helper's output and are otherwise unchanged, since OpenRouter's embeddings and chat-completions endpoints are already OpenAI-compatible (confirmed against OpenRouter's official API docs: `Authorization: Bearer`, `data[0].embedding`, `choices[0].message.content`).

**Tech Stack:** Laravel 13 (PHP 8.5), PHPUnit, `Illuminate\Support\Facades\Http`.

**Spec:** `docs/superpowers/specs/2026-11-19-openrouter-provider-support-design.md`

## Global Constraints

- One `RAG_PROVIDER` env var (`openai` default, or `openrouter`) governs **both** services — no per-service override (explicit design decision).
- OpenRouter's `POST /api/v1/embeddings` and `POST /api/v1/chat/completions` are OpenAI-compatible — confirmed real endpoints, same bearer-token auth, same response shape. No new parsing/failure-handling logic needed in either service; only the config source changes.
- `config/openai.php` keeps its filename — do not rename it or any `config('openai.*')` call site's top-level segment.
- Default provider is `openai`, and existing `OPENAI_API_KEY`/`OPENAI_EMBEDDING_MODEL`/`OPENAI_CHAT_MODEL`/`OPENAI_RAG_TOP_K` env vars must keep working unchanged for anyone who doesn't set `RAG_PROVIDER` — this is a backward-compatible restructure, not a breaking one.
- Follow `AGENTS.md`: `php artisan make:class`/`make:test --phpunit` for new files, PHP 8 explicit return types, run `vendor/bin/pint --dirty --format agent` after PHP edits.

## Review Focus

- `RAG_PROVIDER` is unset entirely (the common case — nobody has touched `.env` yet) — must behave exactly as before, defaulting to the `openai` provider. *(Task 1, and every migrated test in Tasks 2-3 that doesn't set `openai.provider`.)*
- `RAG_PROVIDER` is set to a value with no matching entry under `providers` (e.g. a typo) — must fail with the existing, clear "missing API key" error, not a null-array-access crash reading `$config['api_key']` on a non-existent provider. *(Task 1 at the config level; Tasks 2 and 3 end-to-end through each service.)*
- Setting `RAG_PROVIDER=openrouter` must actually change where the request goes for **both** services, not just one silently keep using OpenAI. *(Tasks 2 and 3, one assertion each confirming the OpenRouter URL is hit.)*
- Switching provider (or model) without re-running `rag:ingest` leaves stored embeddings incomparable to new query embeddings (different model/dimensions) — this can't be guarded against in code without knowing every provider's embedding dimensions, so it's documented, not tested, matching how the original plan handled the equivalent model-switch gotcha. *(Task 4.)*
- Existing OpenAI-path tests (missing key, failed request, unexpected shape, connection failure) must keep passing unchanged in behavior after the config restructure — only their `config([...])` call's key path changes. *(Tasks 2 and 3.)*

---

### Task 1: Provider config + `RagProviderConfig` helper

**Files:**
- Modify: `config/openai.php`
- Create: `app/Services/Rag/RagProviderConfig.php` (via `php artisan make:class Services/Rag/RagProviderConfig --no-interaction`)
- Test: `tests/Unit/Rag/RagProviderConfigTest.php` (via `php artisan make:test --unit --phpunit`)

**Interfaces:**
- Produces: `RagProviderConfig::current(): array` returning the active provider's sub-array — keys `base_url` (string), `api_key` (string|null), `embedding_model` (string), `chat_model` (string) when the provider exists; `[]` when it doesn't.
- Consumes: nothing (foundational).

- [ ] **Step 1: Write the failing tests**

```php
namespace Tests\Unit\Rag;

use App\Services\Rag\RagProviderConfig;
use Tests\TestCase;

class RagProviderConfigTest extends TestCase
{
    public function test_defaults_to_the_openai_provider()
    {
        $config = RagProviderConfig::current();

        $this->assertSame('https://api.openai.com/v1', $config['base_url']);
        $this->assertSame('text-embedding-3-small', $config['embedding_model']);
    }

    public function test_switches_to_the_configured_provider()
    {
        config(['openai.provider' => 'openrouter']);

        $config = RagProviderConfig::current();

        $this->assertSame('https://openrouter.ai/api/v1', $config['base_url']);
        $this->assertSame('openai/text-embedding-3-small', $config['embedding_model']);
    }

    public function test_returns_an_empty_array_for_an_unknown_provider()
    {
        config(['openai.provider' => 'does-not-exist']);

        $this->assertSame([], RagProviderConfig::current());
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test tests/Unit/Rag/RagProviderConfigTest.php --compact`
Expected: FAIL (class doesn't exist, and `config/openai.php` doesn't yet have a `providers` array)

- [ ] **Step 3: Replace `config/openai.php` with:**

```php
<?php

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

- [ ] **Step 4: Implement `RagProviderConfig::current()`**

```php
namespace App\Services\Rag;

class RagProviderConfig
{
    public static function current(): array
    {
        $provider = config('openai.provider', 'openai');

        return config("openai.providers.{$provider}", []);
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `php artisan test tests/Unit/Rag/RagProviderConfigTest.php --compact`
Expected: PASS

- [ ] **Step 6: Run the full suite to see the expected, temporary breakage**

Run: `php artisan test --compact`
Expected: FAIL — `EmbeddingServiceTest`, `ChatCompletionServiceTest`, `RetrievalServiceTest`, `RagIngestCommandTest`, and `ChatControllerTest` now fail, because `config/openai.php` no longer has a flat `api_key` key and those services/tests haven't been migrated yet. This is expected; Tasks 2 and 3 fix it. Do not attempt to fix those files in this task.

- [ ] **Step 7: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add config/openai.php app/Services/Rag/RagProviderConfig.php tests/Unit/Rag/RagProviderConfigTest.php
git commit -m "feat: add provider-switchable config for the RAG pipeline"
```

---

### Task 2: Migrate `EmbeddingService` and its consumers' tests

**Files:**
- Modify: `app/Services/Rag/EmbeddingService.php`
- Modify: `tests/Feature/Rag/EmbeddingServiceTest.php`
- Modify: `tests/Feature/Rag/RetrievalServiceTest.php`
- Modify: `tests/Feature/Rag/RagIngestCommandTest.php`

**Interfaces:**
- Consumes: `RagProviderConfig::current()` (Task 1).
- Produces: `EmbeddingService::embed(string $text): array` — signature and all existing behavior (missing-key/failed-request/unexpected-shape/connection-failure exceptions) unchanged; only its config source changes.

- [ ] **Step 1: Migrate existing test config calls**

In `tests/Feature/Rag/EmbeddingServiceTest.php`, `tests/Feature/Rag/RetrievalServiceTest.php`, and `tests/Feature/Rag/RagIngestCommandTest.php`, replace every `config(['openai.api_key' => $value])` with `config(['openai.providers.openai.api_key' => $value])` (keep `$value` — `'test-key'` or `null` — exactly as each test already uses it). This is a mechanical find-and-replace; no other line in these three files changes in this step.

- [ ] **Step 2: Add a new test proving the provider switch works, in `EmbeddingServiceTest.php`**

```php
public function test_embed_uses_the_openrouter_endpoint_when_that_provider_is_configured()
{
    config(['openai.provider' => 'openrouter']);
    config(['openai.providers.openrouter.api_key' => 'test-key']);
    Http::fake(['openrouter.ai/*' => Http::response(['data' => [['embedding' => [0.4, 0.5, 0.6]]]])]);

    $embedding = app(EmbeddingService::class)->embed('hello');

    $this->assertSame([0.4, 0.5, 0.6], $embedding);
    Http::assertSent(fn ($request) => str_contains($request->url(), 'openrouter.ai/api/v1/embeddings'));
}

public function test_embed_throws_a_clean_error_for_an_unknown_provider()
{
    config(['openai.provider' => 'does-not-exist']);

    $this->expectException(OpenAiRequestException::class);

    app(EmbeddingService::class)->embed('hello');
}
```

- [ ] **Step 3: Run the three test files to verify they fail**

Run: `php artisan test tests/Feature/Rag/EmbeddingServiceTest.php tests/Feature/Rag/RetrievalServiceTest.php tests/Feature/Rag/RagIngestCommandTest.php --compact`
Expected: FAIL — `EmbeddingService` still reads the now-removed flat `openai.api_key`, so every test (including the new one) throws the missing-key exception instead of the behavior it expects.

- [ ] **Step 4: Implement the migration in `EmbeddingService::embed`**

Replace the `$apiKey = config('openai.api_key');` line and the hardcoded URL/model lookups with `RagProviderConfig`:

```php
$config = RagProviderConfig::current();
$apiKey = $config['api_key'] ?? null;

if (empty($apiKey)) {
    throw OpenAiRequestException::missingApiKey();
}

try {
    $response = Http::withToken($apiKey)->post("{$config['base_url']}/embeddings", [
        'model' => $config['embedding_model'],
        'input' => $text,
    ]);
} catch (ConnectionException $e) {
    throw OpenAiRequestException::requestFailed($e->getMessage());
}
```

The rest of the method (the `$response->failed()` check and the response-shape validation returning `$embedding`) is unchanged — do not alter it. `RagProviderConfig` is in the same namespace (`App\Services\Rag`), so no new `use` import is needed.

- [ ] **Step 5: Run the three test files to verify they pass**

Run: `php artisan test tests/Feature/Rag/EmbeddingServiceTest.php tests/Feature/Rag/RetrievalServiceTest.php tests/Feature/Rag/RagIngestCommandTest.php --compact`
Expected: PASS

- [ ] **Step 6: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Services/Rag/EmbeddingService.php tests/Feature/Rag/EmbeddingServiceTest.php tests/Feature/Rag/RetrievalServiceTest.php tests/Feature/Rag/RagIngestCommandTest.php
git commit -m "feat: make EmbeddingService provider-switchable"
```

---

### Task 3: Migrate `ChatCompletionService` and its consumers' tests

**Files:**
- Modify: `app/Services/Rag/ChatCompletionService.php`
- Modify: `tests/Feature/Rag/ChatCompletionServiceTest.php`
- Modify: `tests/Feature/Rag/ChatControllerTest.php`

**Interfaces:**
- Consumes: `RagProviderConfig::current()` (Task 1).
- Produces: `ChatCompletionService::complete(string $systemPrompt, string $userPrompt): string` — signature and all existing behavior unchanged; only its config source changes.

- [ ] **Step 1: Migrate existing test config calls**

In `tests/Feature/Rag/ChatCompletionServiceTest.php` and `tests/Feature/Rag/ChatControllerTest.php`, replace every `config(['openai.api_key' => $value])` with `config(['openai.providers.openai.api_key' => $value])`, keeping each `$value` exactly as it already is.

- [ ] **Step 2: Add a new test proving the provider switch works, in `ChatCompletionServiceTest.php`**

```php
public function test_complete_uses_the_openrouter_endpoint_when_that_provider_is_configured()
{
    config(['openai.provider' => 'openrouter']);
    config(['openai.providers.openrouter.api_key' => 'test-key']);
    Http::fake(['openrouter.ai/*' => Http::response(['choices' => [['message' => ['content' => 'the answer']]]])]);

    $answer = app(ChatCompletionService::class)->complete('system', 'user');

    $this->assertSame('the answer', $answer);
    Http::assertSent(fn ($request) => str_contains($request->url(), 'openrouter.ai/api/v1/chat/completions'));
}

public function test_complete_throws_a_clean_error_for_an_unknown_provider()
{
    config(['openai.provider' => 'does-not-exist']);

    $this->expectException(OpenAiRequestException::class);

    app(ChatCompletionService::class)->complete('system', 'user');
}
```

- [ ] **Step 3: Run the two test files to verify they fail**

Run: `php artisan test tests/Feature/Rag/ChatCompletionServiceTest.php tests/Feature/Rag/ChatControllerTest.php --compact`
Expected: FAIL — same reason as Task 2: `ChatCompletionService` still reads the removed flat config key.

- [ ] **Step 4: Implement the migration in `ChatCompletionService::complete`**

Mirror Task 2's `EmbeddingService` change exactly, applied to this service:

```php
$config = RagProviderConfig::current();
$apiKey = $config['api_key'] ?? null;

if (empty($apiKey)) {
    throw OpenAiRequestException::missingApiKey();
}

try {
    $response = Http::withToken($apiKey)->post("{$config['base_url']}/chat/completions", [
        'model' => $config['chat_model'],
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ],
    ]);
} catch (ConnectionException $e) {
    throw OpenAiRequestException::requestFailed($e->getMessage());
}
```

The rest of the method is unchanged.

- [ ] **Step 5: Run the two test files to verify they pass**

Run: `php artisan test tests/Feature/Rag/ChatCompletionServiceTest.php tests/Feature/Rag/ChatControllerTest.php --compact`
Expected: PASS

- [ ] **Step 6: Run the full suite to confirm the whole branch is green again**

Run: `php artisan test --compact`
Expected: PASS (all tests, including Task 1's)

- [ ] **Step 7: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Services/Rag/ChatCompletionService.php tests/Feature/Rag/ChatCompletionServiceTest.php tests/Feature/Rag/ChatControllerTest.php
git commit -m "feat: make ChatCompletionService provider-switchable"
```

---

### Task 4: Document the provider switch

**Files:**
- Modify: `.env.example`
- Modify: `docs/rag-pipeline.md`

**Interfaces:**
- Consumes: the final `config/openai.php` shape and env var names from Tasks 1-3.
- Produces: no code — accurate documentation only.

- [ ] **Step 1: Add to `.env.example`**, after the existing `VITE_APP_NAME` line, following this file's existing bare `KEY=value` style (no comments elsewhere in the file, so match that — a one-line `#` header per group is acceptable since the RAG pipeline is a distinct feature, not because other entries have one):

```
RAG_PROVIDER=openai
OPENAI_API_KEY=
OPENROUTER_API_KEY=
```

- [ ] **Step 2: Update `docs/rag-pipeline.md`**

- In the file-map table, update the `config/openai.php` row to mention `provider` and the `providers` array instead of only the flat keys.
- In the "How to change the embedding/chat model or `top_k`" section, add `RAG_PROVIDER` / `OPENROUTER_API_KEY` / `OPENROUTER_EMBEDDING_MODEL` / `OPENROUTER_CHAT_MODEL` to the table of env vars, and extend the existing "re-run `rag:ingest` after changing the model" note to also cover switching provider, for the same reason (different models/dimensions, stored vectors aren't comparable across them).
- In the required `.env` vars list, add `RAG_PROVIDER` (optional, defaults to `openai`) and `OPENROUTER_API_KEY` (required only when `RAG_PROVIDER=openrouter`).

Exact wording is the implementer's call — match this doc's existing tone and structure.

- [ ] **Step 3: Run the full suite once more as a sanity check**

Run: `php artisan test --compact`
Expected: PASS (this task touches no code, so this just confirms nothing was accidentally broken)

- [ ] **Step 4: Commit**

```bash
git add .env.example docs/rag-pipeline.md
git commit -m "docs: document the RAG provider switch"
```
