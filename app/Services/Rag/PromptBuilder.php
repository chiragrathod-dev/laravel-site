<?php

namespace App\Services\Rag;

use App\Models\DocumentChunk;
use Illuminate\Support\Collection;

class PromptBuilder
{
    public const SYSTEM_PROMPT = "You are a helpful support assistant. Answer the user's question using only the context below. If the context does not contain the answer, say you don't know rather than guessing.";

    /**
     * Assemble the system and user prompts for a RAG completion request.
     *
     * @param  Collection<int, array{chunk: DocumentChunk, score: float}>  $scoredChunks
     * @return array{system: string, user: string}
     */
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
