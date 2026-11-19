<?php

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
        config(['openai.providers.openai.api_key' => 'test-key']);

        $expectedCount = count(TextChunker::splitFaqMarkdown(file_get_contents(resource_path('rag/faq.md'))));

        $this->artisan('rag:ingest')->assertExitCode(0);

        $this->assertSame($expectedCount, DocumentChunk::where('source', DocumentChunk::SOURCE_FAQ)->count());
    }

    public function test_rerunning_ingest_replaces_rather_than_duplicates_rows()
    {
        Http::fake(['*/embeddings' => Http::response(['data' => [['embedding' => [0.1, 0.2, 0.3]]]])]);
        config(['openai.providers.openai.api_key' => 'test-key']);

        $this->artisan('rag:ingest')->assertExitCode(0);
        $firstCount = DocumentChunk::count();

        $this->artisan('rag:ingest')->assertExitCode(0);

        $this->assertSame($firstCount, DocumentChunk::count());
    }
}
