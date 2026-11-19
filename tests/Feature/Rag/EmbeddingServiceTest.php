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

        try {
            app(EmbeddingService::class)->embed('hello');
            $this->fail('Expected an OpenAiRequestException.');
        } catch (OpenAiRequestException $e) {
            $this->assertStringContainsString('OPENAI_API_KEY', $e->getMessage());
        }
    }

    public function test_embed_names_the_right_env_var_when_the_openrouter_key_is_missing()
    {
        config(['openai.provider' => 'openrouter']);
        config(['openai.providers.openrouter.api_key' => null]);

        try {
            app(EmbeddingService::class)->embed('hello');
            $this->fail('Expected an OpenAiRequestException.');
        } catch (OpenAiRequestException $e) {
            $this->assertStringContainsString('OPENROUTER_API_KEY', $e->getMessage());
        }
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

    public function test_embed_throws_a_clean_error_for_an_unknown_provider_without_falling_back()
    {
        config(['openai.provider' => 'does-not-exist']);
        config(['openai.providers.openai.api_key' => 'test-key']);
        Http::fake();

        try {
            app(EmbeddingService::class)->embed('hello');
            $this->fail('Expected an OpenAiRequestException.');
        } catch (OpenAiRequestException $e) {
            $this->assertStringContainsString('does-not-exist', $e->getMessage());
        }

        Http::assertNothingSent();
    }
}
