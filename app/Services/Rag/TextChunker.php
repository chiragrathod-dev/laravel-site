<?php

namespace App\Services\Rag;

class TextChunker
{
    /**
     * Split FAQ-style markdown into question/answer pairs, one per "## " header.
     *
     * @return array<int, array{question: string, answer: string}>
     */
    public static function splitFaqMarkdown(string $markdown): array
    {
        $fragments = preg_split('/^##[ \t]+/m', $markdown);
        $entries = [];

        foreach (array_slice($fragments, 1) as $fragment) {
            [$questionLine, $answer] = array_pad(preg_split('/\R/', $fragment, 2), 2, '');

            $entries[] = [
                'question' => trim($questionLine),
                'answer' => trim($answer),
            ];
        }

        return $entries;
    }

    /**
     * Split text into paragraphs on blank lines, then greedily join consecutive paragraphs
     * with a blank line into chunks no longer than $maxChars. A paragraph longer than
     * $maxChars is kept whole as its own chunk.
     *
     * @return array<int, string>
     */
    public static function splitIntoParagraphChunks(string $text, int $maxChars = 500): array
    {
        $paragraphs = array_values(array_filter(
            preg_split('/\n\s*\n/', $text),
            fn (string $paragraph): bool => trim($paragraph) !== '',
        ));

        $chunks = [];
        $currentChunk = null;

        foreach ($paragraphs as $paragraph) {
            if ($currentChunk === null) {
                $currentChunk = $paragraph;

                continue;
            }

            $candidate = $currentChunk."\n\n".$paragraph;

            if (mb_strlen($candidate) <= $maxChars) {
                $currentChunk = $candidate;

                continue;
            }

            $chunks[] = $currentChunk;
            $currentChunk = $paragraph;
        }

        if ($currentChunk !== null) {
            $chunks[] = $currentChunk;
        }

        return $chunks;
    }
}
