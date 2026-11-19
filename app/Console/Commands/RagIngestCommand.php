<?php

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
