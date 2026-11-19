# Homepage RAG Chat Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a homepage chat widget that answers questions about a sample fictional-product FAQ using a hand-rolled RAG pipeline (chunk → embed → store → retrieve → prompt → generate), plus a project skill and doc so the pipeline is quick to find and modify later.

**Architecture:** Plain PHP services under `app/Services/Rag` implement each pipeline stage with no hidden abstractions: chunking and cosine-similarity are pure functions, OpenAI calls go through two small wrapper services via Laravel's `Http` client, embeddings are stored as a JSON column on a `document_chunks` table and compared in PHP at query time (no vector DB). An Artisan command (`rag:ingest`) runs the chunk→embed→store steps once; a `POST /chat` endpoint runs retrieve→prompt→generate per question; a React `ChatWidget` on the homepage talks to that endpoint.

**Tech Stack:** Laravel 13 (PHP 8.5), SQLite, Inertia + React, OpenAI REST API (embeddings + chat completions) via `Illuminate\Support\Facades\Http`, PHPUnit.

**Spec:** `docs/superpowers/specs/2026-11-18-rag-chat-assistant-design.md`

## Global Constraints

- SQLite stays the database; no new DB engine or vector extension (spec, Approach A).
- OpenAI only, called directly via `Http` — no SDK, no second provider.
- Embeddings stored as JSON and compared with cosine similarity in PHP — no pgvector/external vector store.
- `rag:ingest` is a manual step; it is **not** wired into `composer.json` setup scripts (spec, builder's call).
- `/chat` stays in the `web` middleware group; the frontend authenticates the write with the `XSRF-TOKEN` cookie → `X-XSRF-TOKEN` header, no axios (spec, builder's call).
- Missing/failing OpenAI calls raise a specific exception; `/chat` returns a JSON error (not a raw 500) when that happens (spec, builder's call).
- Follow `AGENTS.md`: `php artisan make:*` for new files, PHP 8 constructor promotion + explicit types, PHPUnit-style tests (`php artisan make:test --phpunit`), run `vendor/bin/pint --dirty --format agent` after PHP edits, no new top-level base folders (`app/Services` and `app/Exceptions` are ordinary subfolders of the existing `app/` tree, not new base folders).
- Defaults pinned by this plan: embedding model `text-embedding-3-small`, chat model `gpt-4o-mini`, `top_k` = 3, question length cap 1000 characters.

## Review Focus

- No chunks exist yet (fresh app, `rag:ingest` never run) — retrieval and prompt construction must still respond sanely instead of erroring. *(Tasks 4, 5)*
- The FAQ source file has no `## `-headed entries (empty or malformed) — chunking must return an empty list rather than throwing, and ingestion must not crash on zero entries. *(Task 2)*
- OpenAI responds `200 OK` with an unexpected JSON shape (missing `data`/`choices`, e.g. from an API change or an odd error body) — the wrapper services must raise `OpenAiRequestException`, not fatal-error on a null array access. *(Task 3)*
- The `question` field is missing, blank, or longer than the pinned 1000-character cap — validation must reject with `422` before any OpenAI call is made. *(Task 7)*
- `OPENAI_API_KEY` is unset when ingestion or `/chat` runs — both must fail fast with a clear message instead of an opaque error from OpenAI's API. *(Tasks 3, 7)*

---

### Task 1: Data layer — config, migration, model, factory

**Files:**
- Create: `config/openai.php`
- Create: `database/migrations/<timestamp>_create_document_chunks_table.php` (via `php artisan make:migration create_document_chunks_table --no-interaction`)
- Create: `app/Models/DocumentChunk.php` (via `php artisan make:model DocumentChunk --no-interaction`)
- Create: `database/factories/DocumentChunkFactory.php` (via `php artisan make:factory DocumentChunkFactory --model=DocumentChunk --no-interaction`)
- Test: `tests/Feature/Rag/DocumentChunkTest.php` (via `php artisan make:test Rag/DocumentChunkTest --phpunit --no-interaction`)

**Interfaces:**
- Produces: `DocumentChunk` model with fillable `source`, `content`, `embedding` (array cast), `metadata` (array cast, nullable); constant `DocumentChunk::SOURCE_FAQ = 'faq'`. `DocumentChunkFactory` with `definition()` returning `source: DocumentChunk::SOURCE_FAQ`, `content: fake()->sentence()`, `embedding: [3 random floats between -1 and 1]`, `metadata: null`.
- Consumes: nothing (foundational task).

- [ ] **Step 1: Write the failing test**

```php
namespace Tests\Feature\Rag;

use App\Models\DocumentChunk;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentChunkTest extends TestCase
{
    use RefreshDatabase;

    public function test_embedding_and_metadata_are_cast_to_arrays()
    {
        $chunk = DocumentChunk::factory()->create([
            'embedding' => [0.1, 0.2, 0.3],
            'metadata' => ['note' => 'test'],
        ]);

        $fresh = DocumentChunk::find($chunk->id);

        $this->assertSame([0.1, 0.2, 0.3], $fresh->embedding);
        $this->assertSame(['note' => 'test'], $fresh->metadata);
        $this->assertSame(DocumentChunk::SOURCE_FAQ, $fresh->source);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test tests/Feature/Rag/DocumentChunkTest.php --compact`
Expected: FAIL (migration/model/factory don't exist yet)

- [ ] **Step 3: Create the config file `config/openai.php`**

```php
return [
    'api_key' => env('OPENAI_API_KEY'),
    'embedding_model' => env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
    'chat_model' => env('OPENAI_CHAT_MODEL', 'gpt-4o-mini'),
    'top_k' => (int) env('OPENAI_RAG_TOP_K', 3),
];
```

- [ ] **Step 4: Write the migration**

`document_chunks` table: `id`, `string source`, `text content`, `json embedding`, `json metadata` nullable, `timestamps()`.

- [ ] **Step 5: Write the model**

```php
namespace App\Models;

use Database\Factories\DocumentChunkFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $source
 * @property string $content
 * @property array<int, float> $embedding
 * @property array<string, mixed>|null $metadata
 */
#[Fillable(['source', 'content', 'embedding', 'metadata'])]
class DocumentChunk extends Model
{
    /** @use HasFactory<DocumentChunkFactory> */
    use HasFactory;

    public const SOURCE_FAQ = 'faq';

    protected function casts(): array
    {
        return [
            'embedding' => 'array',
            'metadata' => 'array',
        ];
    }
}
```

- [ ] **Step 6: Write the factory `definition()`** returning the shape in the Interfaces block above.

- [ ] **Step 7: Run migrations and the test**

Run: `php artisan migrate --no-interaction && php artisan test tests/Feature/Rag/DocumentChunkTest.php --compact`
Expected: PASS

- [ ] **Step 8: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add config/openai.php database/migrations database/factories/DocumentChunkFactory.php app/Models/DocumentChunk.php tests/Feature/Rag/DocumentChunkTest.php
git commit -m "feat: add document_chunks data layer for RAG pipeline"
```

---

### Task 2: Pure helpers — `VectorMath` and `TextChunker`

**Files:**
- Create: `app/Services/Rag/VectorMath.php` (via `php artisan make:class Services/Rag/VectorMath --no-interaction`)
- Create: `app/Services/Rag/TextChunker.php` (via `php artisan make:class Services/Rag/TextChunker --no-interaction`)
- Test: `tests/Unit/Rag/VectorMathTest.php`, `tests/Unit/Rag/TextChunkerTest.php` (via `php artisan make:test --unit --phpunit`)

**Interfaces:**
- Produces: `VectorMath::cosineSimilarity(array $a, array $b): float`. `TextChunker::splitFaqMarkdown(string $markdown): array<int, array{question: string, answer: string}>` (parses `## Question` headers; text after a header up to the next `## ` or EOF, trimmed, is the answer; returns `[]` when no `## ` header is found). `TextChunker::splitIntoParagraphChunks(string $text, int $maxChars = 500): array<int, string>` (splits on blank lines into paragraphs, then greedily joins consecutive paragraphs with `"\n\n"` into chunks no longer than `$maxChars`; a single paragraph longer than `$maxChars` becomes its own chunk unchanged).
- Consumes: nothing.

- [ ] **Step 1: Write the failing tests**

```php
// tests/Unit/Rag/VectorMathTest.php
namespace Tests\Unit\Rag;

use App\Services\Rag\VectorMath;
use Tests\TestCase;

class VectorMathTest extends TestCase
{
    public function test_identical_vectors_have_similarity_of_one()
    {
        $this->assertEqualsWithDelta(1.0, VectorMath::cosineSimilarity([1, 0, 0], [1, 0, 0]), 0.0001);
    }

    public function test_orthogonal_vectors_have_similarity_of_zero()
    {
        $this->assertEqualsWithDelta(0.0, VectorMath::cosineSimilarity([1, 0], [0, 1]), 0.0001);
    }

    public function test_opposite_vectors_have_similarity_of_negative_one()
    {
        $this->assertEqualsWithDelta(-1.0, VectorMath::cosineSimilarity([1, 0], [-1, 0]), 0.0001);
    }
}
```

```php
// tests/Unit/Rag/TextChunkerTest.php
namespace Tests\Unit\Rag;

use App\Services\Rag\TextChunker;
use Tests\TestCase;

class TextChunkerTest extends TestCase
{
    public function test_splits_markdown_into_question_answer_pairs()
    {
        $markdown = "## What is it?\nIt is a thing.\n\n## How much?\nIt costs money.\n";

        $entries = TextChunker::splitFaqMarkdown($markdown);

        $this->assertSame([
            ['question' => 'What is it?', 'answer' => 'It is a thing.'],
            ['question' => 'How much?', 'answer' => 'It costs money.'],
        ], $entries);
    }

    public function test_returns_empty_array_when_markdown_has_no_headers()
    {
        $this->assertSame([], TextChunker::splitFaqMarkdown("just some text\nwith no headers\n"));
    }

    public function test_splits_into_paragraph_chunks_respecting_max_length()
    {
        $text = "AAAA\n\nBBBB\n\nCCCC";

        $chunks = TextChunker::splitIntoParagraphChunks($text, 10);

        $this->assertSame(["AAAA\n\nBBBB", "CCCC"], $chunks);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test tests/Unit/Rag --compact`
Expected: FAIL (classes don't exist)

- [ ] **Step 3: Implement `VectorMath::cosineSimilarity`**

Dot product of the two arrays divided by the product of their Euclidean norms; return `0.0` if either norm is `0.0`.

- [ ] **Step 4: Implement `TextChunker::splitFaqMarkdown` and `TextChunker::splitIntoParagraphChunks`**

For `splitFaqMarkdown`: match lines starting with `## ` as question boundaries (regex split, e.g. `preg_split('/^##\s+/m', $markdown)`), discard the pre-first-header fragment, and for each remaining fragment take the first line as the question and the rest (trimmed) as the answer.
For `splitIntoParagraphChunks`: split `$text` on blank lines (`preg_split('/\n\s*\n/', ...)`), then greedily accumulate paragraphs into a running chunk joined by `"\n\n"`, flushing to a new chunk whenever adding the next paragraph would exceed `$maxChars`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `php artisan test tests/Unit/Rag --compact`
Expected: PASS

- [ ] **Step 6: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Services/Rag/VectorMath.php app/Services/Rag/TextChunker.php tests/Unit/Rag
git commit -m "feat: add cosine similarity and text chunking helpers"
```

---

### Task 3: OpenAI client layer — `EmbeddingService` and `ChatCompletionService`

**Files:**
- Create: `app/Exceptions/Rag/OpenAiRequestException.php` (via `php artisan make:class Exceptions/Rag/OpenAiRequestException --no-interaction`)
- Create: `app/Services/Rag/EmbeddingService.php`, `app/Services/Rag/ChatCompletionService.php` (via `make:class`)
- Test: `tests/Feature/Rag/EmbeddingServiceTest.php`, `tests/Feature/Rag/ChatCompletionServiceTest.php` (via `make:test --phpunit`)

**Interfaces:**
- Produces: `OpenAiRequestException extends \RuntimeException` with static factories `::missingApiKey(): self` and `::requestFailed(string $reason): self`. `EmbeddingService::embed(string $text): array<int, float>` (throws `OpenAiRequestException`). `ChatCompletionService::complete(string $systemPrompt, string $userPrompt): string` (throws `OpenAiRequestException`).
- Consumes: `config('openai.api_key')`, `config('openai.embedding_model')`, `config('openai.chat_model')` (Task 1).

- [ ] **Step 1: Write the failing tests**

```php
// tests/Feature/Rag/EmbeddingServiceTest.php
namespace Tests\Feature\Rag;

use App\Exceptions\Rag\OpenAiRequestException;
use App\Services\Rag\EmbeddingService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EmbeddingServiceTest extends TestCase
{
    public function test_embed_returns_the_vector_from_the_api()
    {
        Http::fake(['*/embeddings' => Http::response(['data' => [['embedding' => [0.1, 0.2, 0.3]]]])]);
        config(['openai.api_key' => 'test-key']);

        $this->assertSame([0.1, 0.2, 0.3], app(EmbeddingService::class)->embed('hello'));
    }

    public function test_embed_throws_when_api_key_is_missing()
    {
        config(['openai.api_key' => null]);

        $this->expectException(OpenAiRequestException::class);

        app(EmbeddingService::class)->embed('hello');
    }

    public function test_embed_throws_when_the_request_fails()
    {
        Http::fake(['*/embeddings' => Http::response(['error' => 'bad request'], 400)]);
        config(['openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(EmbeddingService::class)->embed('hello');
    }

    public function test_embed_throws_when_the_response_shape_is_unexpected()
    {
        Http::fake(['*/embeddings' => Http::response(['unexpected' => true])]);
        config(['openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(EmbeddingService::class)->embed('hello');
    }
}
```

```php
// tests/Feature/Rag/ChatCompletionServiceTest.php
namespace Tests\Feature\Rag;

use App\Exceptions\Rag\OpenAiRequestException;
use App\Services\Rag\ChatCompletionService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChatCompletionServiceTest extends TestCase
{
    public function test_complete_returns_the_message_content_from_the_api()
    {
        Http::fake(['*/chat/completions' => Http::response(['choices' => [['message' => ['content' => 'the answer']]]])]);
        config(['openai.api_key' => 'test-key']);

        $this->assertSame('the answer', app(ChatCompletionService::class)->complete('system', 'user'));
    }

    public function test_complete_throws_when_api_key_is_missing()
    {
        config(['openai.api_key' => null]);

        $this->expectException(OpenAiRequestException::class);

        app(ChatCompletionService::class)->complete('system', 'user');
    }

    public function test_complete_throws_when_the_request_fails()
    {
        Http::fake(['*/chat/completions' => Http::response(['error' => 'server error'], 500)]);
        config(['openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(ChatCompletionService::class)->complete('system', 'user');
    }

    public function test_complete_throws_when_the_response_shape_is_unexpected()
    {
        Http::fake(['*/chat/completions' => Http::response(['unexpected' => true])]);
        config(['openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(ChatCompletionService::class)->complete('system', 'user');
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test tests/Feature/Rag/EmbeddingServiceTest.php tests/Feature/Rag/ChatCompletionServiceTest.php --compact`
Expected: FAIL (classes don't exist)

- [ ] **Step 3: Implement `OpenAiRequestException`**

```php
namespace App\Exceptions\Rag;

class OpenAiRequestException extends \RuntimeException
{
    public static function missingApiKey(): self
    {
        return new self('OpenAI API key is not configured. Set OPENAI_API_KEY in your .env file.');
    }

    public static function requestFailed(string $reason): self
    {
        return new self("OpenAI request failed: {$reason}");
    }
}
```

- [ ] **Step 4: Implement `EmbeddingService::embed`**

Throw `OpenAiRequestException::missingApiKey()` if `config('openai.api_key')` is empty. Otherwise `Http::withToken($apiKey)->post('https://api.openai.com/v1/embeddings', ['model' => config('openai.embedding_model'), 'input' => $text])`; if `$response->failed()`, throw `OpenAiRequestException::requestFailed($response->body())`; read `$response->json('data.0.embedding')` and throw `OpenAiRequestException::requestFailed('unexpected response shape')` if it isn't an array, otherwise return it.

- [ ] **Step 5: Implement `ChatCompletionService::complete`**

Same API-key guard. `Http::withToken($apiKey)->post('https://api.openai.com/v1/chat/completions', ['model' => config('openai.chat_model'), 'messages' => [['role' => 'system', 'content' => $systemPrompt], ['role' => 'user', 'content' => $userPrompt]]])`; same failure handling; read `$response->json('choices.0.message.content')`, throwing on a non-string result, otherwise return it.

- [ ] **Step 6: Run tests to verify they pass**

Run: `php artisan test tests/Feature/Rag/EmbeddingServiceTest.php tests/Feature/Rag/ChatCompletionServiceTest.php --compact`
Expected: PASS

- [ ] **Step 7: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Exceptions/Rag app/Services/Rag/EmbeddingService.php app/Services/Rag/ChatCompletionService.php tests/Feature/Rag/EmbeddingServiceTest.php tests/Feature/Rag/ChatCompletionServiceTest.php
git commit -m "feat: add OpenAI embedding and chat completion client services"
```

---

### Task 4: `RetrievalService`

**Files:**
- Create: `app/Services/Rag/RetrievalService.php` (via `make:class`)
- Test: `tests/Feature/Rag/RetrievalServiceTest.php` (via `make:test --phpunit`)

**Interfaces:**
- Produces: `RetrievalService::retrieveRelevantChunks(string $question, int $topK = 3): Collection<int, array{chunk: DocumentChunk, score: float}>`, sorted by `score` descending, limited to `$topK`, `collect()` (empty) when no `DocumentChunk` rows exist.
- Consumes: `EmbeddingService::embed()` (Task 3, constructor-injected), `DocumentChunk` + `DocumentChunkFactory` (Task 1), `VectorMath::cosineSimilarity()` (Task 2).

- [ ] **Step 1: Write the failing test**

```php
namespace Tests\Feature\Rag;

use App\Models\DocumentChunk;
use App\Services\Rag\RetrievalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RetrievalServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_the_top_k_chunks_ordered_by_similarity_to_the_question()
    {
        Http::fake(['*/embeddings' => Http::response(['data' => [['embedding' => [1, 0, 0]]]])]);
        config(['openai.api_key' => 'test-key']);

        $best = DocumentChunk::factory()->create(['content' => 'best match', 'embedding' => [1, 0, 0]]);
        DocumentChunk::factory()->create(['content' => 'worst match', 'embedding' => [0, 1, 0]]);
        $second = DocumentChunk::factory()->create(['content' => 'second match', 'embedding' => [0.7, 0.7, 0]]);

        $results = app(RetrievalService::class)->retrieveRelevantChunks('anything', topK: 2);

        $this->assertCount(2, $results);
        $this->assertSame($best->id, $results[0]['chunk']->id);
        $this->assertSame($second->id, $results[1]['chunk']->id);
    }

    public function test_returns_an_empty_collection_when_no_chunks_exist()
    {
        Http::fake(['*/embeddings' => Http::response(['data' => [['embedding' => [1, 0, 0]]]])]);
        config(['openai.api_key' => 'test-key']);

        $results = app(RetrievalService::class)->retrieveRelevantChunks('anything');

        $this->assertCount(0, $results);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test tests/Feature/Rag/RetrievalServiceTest.php --compact`
Expected: FAIL (class doesn't exist)

- [ ] **Step 3: Implement `RetrievalService::retrieveRelevantChunks`**

```php
namespace App\Services\Rag;

use App\Models\DocumentChunk;
use Illuminate\Support\Collection;

class RetrievalService
{
    public function __construct(private EmbeddingService $embeddingService) {}

    public function retrieveRelevantChunks(string $question, int $topK = 3): Collection
    {
        $questionEmbedding = $this->embeddingService->embed($question);

        return DocumentChunk::all()
            ->map(fn (DocumentChunk $chunk) => [
                'chunk' => $chunk,
                'score' => VectorMath::cosineSimilarity($questionEmbedding, $chunk->embedding),
            ])
            ->sortByDesc('score')
            ->take($topK)
            ->values();
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test tests/Feature/Rag/RetrievalServiceTest.php --compact`
Expected: PASS

- [ ] **Step 5: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Services/Rag/RetrievalService.php tests/Feature/Rag/RetrievalServiceTest.php
git commit -m "feat: add RetrievalService for similarity-based chunk lookup"
```

---

### Task 5: `PromptBuilder`

**Files:**
- Create: `app/Services/Rag/PromptBuilder.php` (via `make:class`)
- Test: `tests/Unit/Rag/PromptBuilderTest.php` (via `make:test --unit --phpunit`)

**Interfaces:**
- Produces: `PromptBuilder::SYSTEM_PROMPT` (string constant), `PromptBuilder::build(string $question, Collection<int, array{chunk: DocumentChunk, score: float}> $scoredChunks): array{system: string, user: string}`. `user` is `"Context:\n1. {content}\n2. {content}\n...\n\nQuestion: {question}"` when chunks are present, or `"Context:\n(no matching context was found)\n\nQuestion: {question}"` when `$scoredChunks` is empty.
- Consumes: `DocumentChunk` (Task 1, via the `chunk` key — doesn't need a DB row, just an in-memory model instance).

- [ ] **Step 1: Write the failing test**

```php
namespace Tests\Unit\Rag;

use App\Models\DocumentChunk;
use App\Services\Rag\PromptBuilder;
use Illuminate\Support\Collection;
use Tests\TestCase;

class PromptBuilderTest extends TestCase
{
    public function test_build_includes_numbered_context_and_the_question()
    {
        $chunks = collect([
            ['chunk' => new DocumentChunk(['content' => 'Chunk A']), 'score' => 0.9],
            ['chunk' => new DocumentChunk(['content' => 'Chunk B']), 'score' => 0.5],
        ]);

        $prompt = PromptBuilder::build('What is X?', $chunks);

        $this->assertSame(PromptBuilder::SYSTEM_PROMPT, $prompt['system']);
        $this->assertSame("Context:\n1. Chunk A\n2. Chunk B\n\nQuestion: What is X?", $prompt['user']);
    }

    public function test_build_handles_no_matching_context()
    {
        $prompt = PromptBuilder::build('What is X?', collect());

        $this->assertSame("Context:\n(no matching context was found)\n\nQuestion: What is X?", $prompt['user']);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test tests/Unit/Rag/PromptBuilderTest.php --compact`
Expected: FAIL (class doesn't exist)

- [ ] **Step 3: Implement `PromptBuilder`**

```php
namespace App\Services\Rag;

use Illuminate\Support\Collection;

class PromptBuilder
{
    public const SYSTEM_PROMPT = "You are a helpful support assistant. Answer the user's question using only the context below. If the context does not contain the answer, say you don't know rather than guessing.";

    public static function build(string $question, Collection $scoredChunks): array
    {
        $context = $scoredChunks->isEmpty()
            ? '(no matching context was found)'
            : $scoredChunks->values()
                ->map(fn (array $scored, int $index) => ($index + 1).'. '.$scored['chunk']->content)
                ->implode("\n");

        return [
            'system' => self::SYSTEM_PROMPT,
            'user' => "Context:\n{$context}\n\nQuestion: {$question}",
        ];
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test tests/Unit/Rag/PromptBuilderTest.php --compact`
Expected: PASS

- [ ] **Step 5: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Services/Rag/PromptBuilder.php tests/Unit/Rag/PromptBuilderTest.php
git commit -m "feat: add PromptBuilder for assembling RAG prompts"
```

---

### Task 6: Sample FAQ content + `rag:ingest` command

**Files:**
- Create: `resources/rag/faq.md`
- Create: `app/Console/Commands/RagIngestCommand.php` (via `php artisan make:command RagIngestCommand --no-interaction`)
- Test: `tests/Feature/Rag/RagIngestCommandTest.php` (via `make:test --phpunit`)

**Interfaces:**
- Produces: `php artisan rag:ingest` — deletes existing `DocumentChunk::SOURCE_FAQ` rows, then inserts one row per entry parsed from `resources/rag/faq.md`.
- Consumes: `TextChunker::splitFaqMarkdown` (Task 2), `EmbeddingService::embed` (Task 3, injected via `handle()` method injection), `DocumentChunk` (Task 1).

- [ ] **Step 1: Write `resources/rag/faq.md`**

At least 10 entries about a fictional product (e.g. a cloud file-sync tool called "Nimbus"), each formatted as:

```markdown
## What is Nimbus?
Nimbus is a fictional cloud file-sync product used to demonstrate this RAG pipeline.

## How much does Nimbus cost?
...
```

Exact product and wording are the implementer's call; the only constraint is the `## Question` / answer format `TextChunker::splitFaqMarkdown` expects.

- [ ] **Step 2: Write the failing test**

```php
namespace Tests\Feature\Rag;

use App\Models\DocumentChunk;
use App\Services\Rag\TextChunker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RagIngestCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_ingest_stores_one_chunk_per_faq_entry()
    {
        Http::fake(['*/embeddings' => Http::response(['data' => [['embedding' => [0.1, 0.2, 0.3]]]])]);
        config(['openai.api_key' => 'test-key']);

        $expectedCount = count(TextChunker::splitFaqMarkdown(file_get_contents(resource_path('rag/faq.md'))));

        $this->artisan('rag:ingest')->assertExitCode(0);

        $this->assertSame($expectedCount, DocumentChunk::where('source', DocumentChunk::SOURCE_FAQ)->count());
    }

    public function test_rerunning_ingest_replaces_rather_than_duplicates_rows()
    {
        Http::fake(['*/embeddings' => Http::response(['data' => [['embedding' => [0.1, 0.2, 0.3]]]])]);
        config(['openai.api_key' => 'test-key']);

        $this->artisan('rag:ingest')->assertExitCode(0);
        $firstCount = DocumentChunk::count();

        $this->artisan('rag:ingest')->assertExitCode(0);

        $this->assertSame($firstCount, DocumentChunk::count());
    }
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `php artisan test tests/Feature/Rag/RagIngestCommandTest.php --compact`
Expected: FAIL (command doesn't exist)

- [ ] **Step 4: Implement `RagIngestCommand`**

```php
namespace App\Console\Commands;

use App\Models\DocumentChunk;
use App\Services\Rag\EmbeddingService;
use App\Services\Rag\TextChunker;
use Illuminate\Console\Command;

class RagIngestCommand extends Command
{
    protected $signature = 'rag:ingest';

    protected $description = 'Chunk the sample FAQ document, generate embeddings, and store them for retrieval.';

    public function handle(EmbeddingService $embeddingService): int
    {
        $entries = TextChunker::splitFaqMarkdown(file_get_contents(resource_path('rag/faq.md')));

        DocumentChunk::where('source', DocumentChunk::SOURCE_FAQ)->delete();

        foreach ($entries as $entry) {
            $content = "Q: {$entry['question']}\nA: {$entry['answer']}";

            DocumentChunk::create([
                'source' => DocumentChunk::SOURCE_FAQ,
                'content' => $content,
                'embedding' => $embeddingService->embed($content),
            ]);
        }

        $this->info(count($entries).' FAQ chunks ingested.');

        return self::SUCCESS;
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `php artisan test tests/Feature/Rag/RagIngestCommandTest.php --compact`
Expected: PASS

- [ ] **Step 6: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add resources/rag/faq.md app/Console/Commands/RagIngestCommand.php tests/Feature/Rag/RagIngestCommandTest.php
git commit -m "feat: add sample FAQ content and rag:ingest command"
```

---

### Task 7: `/chat` endpoint

**Files:**
- Create: `app/Http/Controllers/ChatController.php` (via `php artisan make:controller ChatController --no-interaction`)
- Modify: `routes/web.php`
- Test: `tests/Feature/Rag/ChatControllerTest.php` (via `make:test --phpunit`)

**Interfaces:**
- Produces: `POST /chat` (name `chat.ask`) → `{"answer": string, "sources": string[]}` on success, `{"error": string}` with status `502` on an `OpenAiRequestException`, `422` on validation failure.
- Consumes: `RetrievalService::retrieveRelevantChunks` (Task 4), `PromptBuilder::build` (Task 5), `ChatCompletionService::complete` (Task 3), `config('openai.top_k')` (Task 1).

- [ ] **Step 1: Write the failing test**

```php
namespace Tests\Feature\Rag;

use App\Models\DocumentChunk;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChatControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_an_answer_and_the_matched_sources()
    {
        DocumentChunk::factory()->create(['content' => 'relevant chunk', 'embedding' => [1, 0, 0]]);
        DocumentChunk::factory()->create(['content' => 'irrelevant chunk', 'embedding' => [0, 1, 0]]);

        Http::fake([
            '*/embeddings' => Http::response(['data' => [['embedding' => [1, 0, 0]]]]),
            '*/chat/completions' => Http::response(['choices' => [['message' => ['content' => 'the answer']]]]),
        ]);
        config(['openai.api_key' => 'test-key']);

        $response = $this->postJson(route('chat.ask'), ['question' => 'What is it?']);

        $response->assertOk()->assertJson([
            'answer' => 'the answer',
            'sources' => ['relevant chunk'],
        ]);
    }

    public function test_rejects_a_missing_question()
    {
        $this->postJson(route('chat.ask'), [])->assertStatus(422);
    }

    public function test_rejects_a_question_over_1000_characters()
    {
        $this->postJson(route('chat.ask'), ['question' => str_repeat('a', 1001)])->assertStatus(422);
    }

    public function test_returns_502_when_the_api_key_is_missing()
    {
        config(['openai.api_key' => null]);

        $this->postJson(route('chat.ask'), ['question' => 'What is it?'])->assertStatus(502);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test tests/Feature/Rag/ChatControllerTest.php --compact`
Expected: FAIL (route/controller don't exist)

- [ ] **Step 3: Add the route in `routes/web.php`**

```php
use App\Http\Controllers\ChatController;

Route::post('chat', [ChatController::class, 'ask'])->name('chat.ask');
```

- [ ] **Step 4: Implement `ChatController::ask`**

```php
namespace App\Http\Controllers;

use App\Exceptions\Rag\OpenAiRequestException;
use App\Services\Rag\ChatCompletionService;
use App\Services\Rag\PromptBuilder;
use App\Services\Rag\RetrievalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function __construct(
        private RetrievalService $retrievalService,
        private ChatCompletionService $chatCompletionService,
    ) {}

    public function ask(Request $request): JsonResponse
    {
        $question = $request->validate([
            'question' => ['required', 'string', 'max:1000'],
        ])['question'];

        try {
            $scoredChunks = $this->retrievalService->retrieveRelevantChunks($question, config('openai.top_k'));
            $prompt = PromptBuilder::build($question, $scoredChunks);
            $answer = $this->chatCompletionService->complete($prompt['system'], $prompt['user']);
        } catch (OpenAiRequestException $exception) {
            return response()->json(['error' => $exception->getMessage()], 502);
        }

        return response()->json([
            'answer' => $answer,
            'sources' => $scoredChunks->pluck('chunk.content')->values(),
        ]);
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `php artisan test tests/Feature/Rag/ChatControllerTest.php --compact`
Expected: PASS

- [ ] **Step 6: Format and commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/ChatController.php routes/web.php tests/Feature/Rag/ChatControllerTest.php
git commit -m "feat: add POST /chat endpoint for the RAG pipeline"
```

---

### Task 8: `ChatWidget` on the homepage

**Files:**
- Create: `resources/js/lib/csrf.ts`
- Create: `resources/js/components/home/chat-widget.tsx`
- Modify: `resources/js/pages/welcome.tsx`

**Interfaces:**
- Produces: `getCsrfTokenFromCookie(): string | null` (reads the `XSRF-TOKEN` cookie Laravel sets, URL-decoded). `ChatWidget` React component (no props), rendered in `welcome.tsx` between `<FinalCtaSection .../>` and `<SiteFooter />`.
- Consumes: `POST /chat` (Task 7) — request body `{ question: string }` with headers `Content-Type: application/json`, `Accept: application/json`, `X-XSRF-TOKEN: <token>`; response `{ answer: string, sources: string[] }` on 200, `{ error: string }` on 422/502.

- [ ] **Step 1: Implement `getCsrfTokenFromCookie`**

```ts
export function getCsrfTokenFromCookie(): string | null {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);

    return match ? decodeURIComponent(match[1]) : null;
}
```

- [ ] **Step 2: Implement `ChatWidget`**

A self-contained component with local state for the question input, a running message list (`{ role: 'user' | 'assistant'; content: string }[]`), a loading flag, and an error string. On submit, call `fetch('/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getCsrfTokenFromCookie() ?? '' }, body: JSON.stringify({ question }) })`; on a non-ok response read `error` from the JSON body and show it; on success append the user question and the assistant answer to the message list and show `sources` under the answer. Match the dark theme and layout conventions already used by sibling components in `resources/js/components/home/` (e.g. `trust-section.tsx`, `info-card.tsx`) — a simple panel is enough, no new design system work.

- [ ] **Step 3: Render it in `welcome.tsx`**

Import `ChatWidget` from `@/components/home/chat-widget` and add `<ChatWidget />` after `<FinalCtaSection isAuthenticated={isAuthenticated} />` and before `<SiteFooter />`.

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: builds without a Vite manifest or TypeScript error.

Run: `npm run types:check`
Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add resources/js/lib/csrf.ts resources/js/components/home/chat-widget.tsx resources/js/pages/welcome.tsx
git commit -m "feat: add homepage chat widget for the RAG assistant"
```

---

### Task 9: Project skill + reference doc

**Files:**
- Create: `.claude/skills/rag-pipeline/SKILL.md`
- Create: `.agents/skills/rag-pipeline/SKILL.md` (identical content — this repo mirrors every skill into both directories)
- Create: `docs/rag-pipeline.md`

**Interfaces:**
- Produces: a skill that triggers when working on any file this plan touched, pointing to `docs/rag-pipeline.md`; a reference doc describing the pipeline for future modification.
- Consumes: the final file paths from Tasks 1-8 (write this task last).

- [ ] **Step 1: Write `docs/rag-pipeline.md`**

Cover: a short textual diagram of the pipeline (ingest: FAQ file → `TextChunker` → `EmbeddingService` → `document_chunks`; query: question → `EmbeddingService` → `RetrievalService` → `PromptBuilder` → `ChatCompletionService` → JSON response → `ChatWidget`); a table mapping each file from Tasks 1-8 to its responsibility; how to add or edit FAQ content (edit `resources/rag/faq.md`, re-run `php artisan rag:ingest`); how to change the embedding/chat model or `top_k` (edit `config/openai.php` or the matching `.env` vars); required `.env` vars (`OPENAI_API_KEY`, optionally `OPENAI_EMBEDDING_MODEL`, `OPENAI_CHAT_MODEL`, `OPENAI_RAG_TOP_K`); how to run just this feature's tests (`php artisan test tests/Unit/Rag tests/Feature/Rag --compact`); and the 502/422 failure behavior from Task 7 as a troubleshooting note.

- [ ] **Step 2: Write `.claude/skills/rag-pipeline/SKILL.md`**

```markdown
---
name: rag-pipeline
description: Activate when creating, reviewing, or modifying any part of the homepage RAG chat assistant - chunking, embeddings, document_chunks, retrieval, prompt construction, the /chat endpoint, rag:ingest, or the ChatWidget component. Read docs/rag-pipeline.md first for the file map and how to change models, FAQ content, or chunking.
---

# RAG chat pipeline

See `docs/rag-pipeline.md` for the full file map, how to add FAQ content, how to change models/top_k, and how to run this feature's tests (`php artisan test tests/Unit/Rag tests/Feature/Rag --compact`).

Key files: `app/Services/Rag/*`, `app/Models/DocumentChunk.php`, `app/Console/Commands/RagIngestCommand.php`, `app/Http/Controllers/ChatController.php`, `resources/rag/faq.md`, `resources/js/components/home/chat-widget.tsx`.
```

- [ ] **Step 3: Copy the same file to `.agents/skills/rag-pipeline/SKILL.md`**

- [ ] **Step 4: Verify**

Confirm every file path named in `docs/rag-pipeline.md` and both `SKILL.md` files actually exists (`git status` should show no path typos against the files created in Tasks 1-8).

- [ ] **Step 5: Commit**

```bash
git add docs/rag-pipeline.md .claude/skills/rag-pipeline .agents/skills/rag-pipeline
git commit -m "docs: add RAG pipeline reference doc and project skill"
```
