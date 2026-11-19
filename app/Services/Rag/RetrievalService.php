<?php

namespace App\Services\Rag;

use App\Exceptions\Rag\OpenAiRequestException;
use App\Models\DocumentChunk;
use Illuminate\Support\Collection;

class RetrievalService
{
    public function __construct(private EmbeddingService $embeddingService) {}

    /**
     * Find the stored chunks most similar to the question, best match first.
     *
     * @return Collection<int, array{chunk: DocumentChunk, score: float}>
     *
     * @throws OpenAiRequestException
     */
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
