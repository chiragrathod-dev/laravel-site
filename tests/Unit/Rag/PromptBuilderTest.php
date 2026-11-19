<?php

namespace Tests\Unit\Rag;

use App\Models\DocumentChunk;
use App\Services\Rag\PromptBuilder;
use Tests\TestCase;

class PromptBuilderTest extends TestCase
{
    public function test_build_includes_numbered_context_and_the_question(): void
    {
        $chunks = collect([
            ['chunk' => new DocumentChunk(['content' => 'Chunk A']), 'score' => 0.9],
            ['chunk' => new DocumentChunk(['content' => 'Chunk B']), 'score' => 0.5],
        ]);

        $prompt = PromptBuilder::build('What is X?', $chunks);

        $this->assertSame(PromptBuilder::SYSTEM_PROMPT, $prompt['system']);
        $this->assertSame("Context:\n1. Chunk A\n2. Chunk B\n\nQuestion: What is X?", $prompt['user']);
    }

    public function test_build_handles_no_matching_context(): void
    {
        $prompt = PromptBuilder::build('What is X?', collect());

        $this->assertSame("Context:\n(no matching context was found)\n\nQuestion: What is X?", $prompt['user']);
    }
}
