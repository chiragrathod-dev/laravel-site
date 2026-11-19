<?php

namespace Tests\Unit\Rag;

use App\Services\Rag\TextChunker;
use Tests\TestCase;

class TextChunkerTest extends TestCase
{
    public function test_splits_markdown_into_question_answer_pairs(): void
    {
        $markdown = "## What is it?\nIt is a thing.\n\n## How much?\nIt costs money.\n";

        $entries = TextChunker::splitFaqMarkdown($markdown);

        $this->assertSame([
            ['question' => 'What is it?', 'answer' => 'It is a thing.'],
            ['question' => 'How much?', 'answer' => 'It costs money.'],
        ], $entries);
    }

    public function test_returns_empty_array_when_markdown_has_no_headers(): void
    {
        $this->assertSame([], TextChunker::splitFaqMarkdown("just some text\nwith no headers\n"));
    }

    public function test_splits_into_paragraph_chunks_respecting_max_length(): void
    {
        $text = "AAAA\n\nBBBB\n\nCCCC";

        $chunks = TextChunker::splitIntoParagraphChunks($text, 10);

        $this->assertSame(["AAAA\n\nBBBB", 'CCCC'], $chunks);
    }

    public function test_keeps_paragraph_longer_than_max_length_as_its_own_chunk(): void
    {
        $longParagraph = str_repeat('X', 25);

        $chunks = TextChunker::splitIntoParagraphChunks("short\n\n{$longParagraph}\n\ntail", 10);

        $this->assertSame(['short', $longParagraph, 'tail'], $chunks);
    }
}
