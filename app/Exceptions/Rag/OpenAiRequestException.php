<?php

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
