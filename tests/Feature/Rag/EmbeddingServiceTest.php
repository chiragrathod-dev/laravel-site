<?php

namespace Tests\Feature\Rag;

use App\Exceptions\Rag\OpenAiRequestException;
use App\Services\Rag\EmbeddingService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EmbeddingServiceTest extends TestCase
{
    public function test_embed_returns_the_vector_from_the_api()
    {
        Http::fake(['*/embeddings' => Http::response(['data' => [['embedding' => [0.1, 0.2, 0.3]]]])]);
        config(['openai.api_key' => 'test-key']);

        $this->assertSame([0.1, 0.2, 0.3], app(EmbeddingService::class)->embed('hello'));
    }

    public function test_embed_throws_when_api_key_is_missing()
    {
        config(['openai.api_key' => null]);

        $this->expectException(OpenAiRequestException::class);

        app(EmbeddingService::class)->embed('hello');
    }

    public function test_embed_throws_when_the_request_fails()
    {
        Http::fake(['*/embeddings' => Http::response(['error' => 'bad request'], 400)]);
        config(['openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(EmbeddingService::class)->embed('hello');
    }

    public function test_embed_throws_when_the_response_shape_is_unexpected()
    {
        Http::fake(['*/embeddings' => Http::response(['unexpected' => true])]);
        config(['openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(EmbeddingService::class)->embed('hello');
    }
}
