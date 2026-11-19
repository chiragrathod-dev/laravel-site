<?php

namespace App\Services\Rag;

use App\Exceptions\Rag\OpenAiRequestException;
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
        $apiKey = config('openai.api_key');

        if (empty($apiKey)) {
            throw OpenAiRequestException::missingApiKey();
        }

        $response = Http::withToken($apiKey)->post('https://api.openai.com/v1/chat/completions', [
            'model' => config('openai.chat_model'),
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
        ]);

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
