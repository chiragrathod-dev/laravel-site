<?php

namespace App\Services\Rag;

class RagProviderConfig
{
    /**
     * @return array{base_url?: string, api_key?: string|null, embedding_model?: string, chat_model?: string}
     */
    public static function current(): array
    {
        $provider = config('openai.provider', 'openai');

        return config("openai.providers.{$provider}", []);
    }
}
