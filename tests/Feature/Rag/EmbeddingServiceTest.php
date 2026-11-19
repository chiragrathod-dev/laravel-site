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
        config(['openai.providers.openai.api_key' => 'test-key']);

        $this->assertSame([0.1, 0.2, 0.3], app(EmbeddingService::class)->embed('hello'));
    }

    public function test_embed_throws_when_api_key_is_missing()
    {
        config(['openai.providers.openai.api_key' => null]);

        $this->expectException(OpenAiRequestException::class);

        app(EmbeddingService::class)->embed('hello');
    }

    public function test_embed_throws_when_the_request_fails()
    {
        Http::fake(['*/embeddings' => Http::response(['error' => 'bad request'], 400)]);
        config(['openai.providers.openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(EmbeddingService::class)->embed('hello');
    }

    public function test_embed_throws_when_the_response_shape_is_unexpected()
    {
        Http::fake(['*/embeddings' => Http::response(['unexpected' => true])]);
        config(['openai.providers.openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(EmbeddingService::class)->embed('hello');
    }

    public function test_embed_throws_when_the_connection_fails()
    {
        Http::fake(['*' => Http::failedConnection()]);
        config(['openai.providers.openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(EmbeddingService::class)->embed('hello');
    }

    public function test_embed_uses_the_openrouter_endpoint_when_that_provider_is_configured()
    {
        config(['openai.provider' => 'openrouter']);
        config(['openai.providers.openrouter.api_key' => 'test-key']);
        Http::fake(['openrouter.ai/*' => Http::response(['data' => [['embedding' => [0.4, 0.5, 0.6]]]])]);

        $embedding = app(EmbeddingService::class)->embed('hello');

        $this->assertSame([0.4, 0.5, 0.6], $embedding);
        Http::assertSent(fn ($request) => str_contains($request->url(), 'openrouter.ai/api/v1/embeddings'));
    }

    public function test_embed_throws_a_clean_error_for_an_unknown_provider()
    {
        config(['openai.provider' => 'does-not-exist']);

        $this->expectException(OpenAiRequestException::class);

        app(EmbeddingService::class)->embed('hello');
    }
}
