<?php

namespace App\Exceptions\Rag;

class OpenAiRequestException extends \RuntimeException
{
    public static function missingApiKey(string $provider): self
    {
        $envVar = match ($provider) {
            'openai' => 'OPENAI_API_KEY',
            'openrouter' => 'OPENROUTER_API_KEY',
            default => null,
        };

        if ($envVar === null) {
            return new self("RAG_PROVIDER '{$provider}' is not configured. Set RAG_PROVIDER to 'openai' or 'openrouter'.");
        }

        return new self("API key for provider '{$provider}' is not configured. Set {$envVar} in your .env file.");
    }

    public static function requestFailed(string $reason): self
    {
        return new self("OpenAI request failed: {$reason}");
    }
}
