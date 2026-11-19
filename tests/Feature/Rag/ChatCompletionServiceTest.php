<?php

namespace Tests\Feature\Rag;

use App\Exceptions\Rag\OpenAiRequestException;
use App\Services\Rag\ChatCompletionService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChatCompletionServiceTest extends TestCase
{
    public function test_complete_returns_the_message_content_from_the_api()
    {
        Http::fake(['*/chat/completions' => Http::response(['choices' => [['message' => ['content' => 'the answer']]]])]);
        config(['openai.providers.openai.api_key' => 'test-key']);

        $this->assertSame('the answer', app(ChatCompletionService::class)->complete('system', 'user'));
    }

    public function test_complete_throws_when_api_key_is_missing()
    {
        config(['openai.providers.openai.api_key' => null]);

        $this->expectException(OpenAiRequestException::class);

        app(ChatCompletionService::class)->complete('system', 'user');
    }

    public function test_complete_throws_when_the_request_fails()
    {
        Http::fake(['*/chat/completions' => Http::response(['error' => 'server error'], 500)]);
        config(['openai.providers.openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(ChatCompletionService::class)->complete('system', 'user');
    }

    public function test_complete_throws_when_the_response_shape_is_unexpected()
    {
        Http::fake(['*/chat/completions' => Http::response(['unexpected' => true])]);
        config(['openai.providers.openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(ChatCompletionService::class)->complete('system', 'user');
    }

    public function test_complete_throws_when_the_connection_fails()
    {
        Http::fake(['*' => Http::failedConnection()]);
        config(['openai.providers.openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(ChatCompletionService::class)->complete('system', 'user');
    }

    public function test_complete_uses_the_openrouter_endpoint_when_that_provider_is_configured()
    {
        config(['openai.provider' => 'openrouter']);
        config(['openai.providers.openrouter.api_key' => 'test-key']);
        Http::fake(['openrouter.ai/*' => Http::response(['choices' => [['message' => ['content' => 'the answer']]]])]);

        $answer = app(ChatCompletionService::class)->complete('system', 'user');

        $this->assertSame('the answer', $answer);
        Http::assertSent(fn ($request) => str_contains($request->url(), 'openrouter.ai/api/v1/chat/completions'));
    }

    public function test_complete_throws_a_clean_error_for_an_unknown_provider()
    {
        config(['openai.provider' => 'does-not-exist']);

        $this->expectException(OpenAiRequestException::class);

        app(ChatCompletionService::class)->complete('system', 'user');
    }
}
