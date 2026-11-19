<?php

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
        config(['openai.providers.openai.api_key' => 'test-key']);

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
        config(['openai.providers.openai.api_key' => 'test-key']);

        $results = app(RetrievalService::class)->retrieveRelevantChunks('anything');

        $this->assertCount(0, $results);
    }
}
