<?php

namespace App\Services\Rag;

use App\Exceptions\Rag\OpenAiRequestException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class EmbeddingService
{
    /**
     * Request an embedding vector for the given text from the OpenAI API.
     *
     * @return array<int, float>
     *
     * @throws OpenAiRequestException
     */
    public function embed(string $text): array
    {
        $config = RagProviderConfig::current();
        $apiKey = $config['api_key'] ?? null;

        if (empty($apiKey)) {
            throw OpenAiRequestException::missingApiKey();
        }

        try {
            $response = Http::withToken($apiKey)->post("{$config['base_url']}/embeddings", [
                'model' => $config['embedding_model'],
                'input' => $text,
            ]);
        } catch (ConnectionException $e) {
            throw OpenAiRequestException::requestFailed($e->getMessage());
        }

        if ($response->failed()) {
            throw OpenAiRequestException::requestFailed($response->body());
        }

        $embedding = $response->json('data.0.embedding');

        if (! is_array($embedding)) {
            throw OpenAiRequestException::requestFailed('unexpected response shape');
        }

        return $embedding;
    }
}
