<?php

namespace Tests\Feature\Rag;

use App\Models\DocumentChunk;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentChunkTest extends TestCase
{
    use RefreshDatabase;

    public function test_embedding_and_metadata_are_cast_to_arrays(): void
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
