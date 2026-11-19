<?php

namespace App\Services\Rag;

use App\Exceptions\Rag\OpenAiRequestException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class ChatCompletionService
{
    /**
     * Request a chat completion from the OpenAI API and return the assistant's reply content.
     *
     * @throws OpenAiRequestException
     */
    public function complete(string $systemPrompt, string $userPrompt): string
    {
        $config = RagProviderConfig::current();
        $apiKey = $config['api_key'] ?? null;

        if (empty($apiKey)) {
            throw OpenAiRequestException::missingApiKey(config('openai.provider', 'openai'));
        }

        try {
            $response = Http::withToken($apiKey)->post("{$config['base_url']}/chat/completions", [
                'model' => $config['chat_model'],
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
            ]);
        } catch (ConnectionException $e) {
            throw OpenAiRequestException::requestFailed($e->getMessage());
        }

        if ($response->failed()) {
            throw OpenAiRequestException::requestFailed($response->body());
        }

        $content = $response->json('choices.0.message.content');

        if (! is_string($content)) {
            throw OpenAiRequestException::requestFailed('unexpected response shape');
        }

        return $content;
    }
}
