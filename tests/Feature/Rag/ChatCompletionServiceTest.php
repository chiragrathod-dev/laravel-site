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
        config(['openai.api_key' => 'test-key']);

        $this->assertSame('the answer', app(ChatCompletionService::class)->complete('system', 'user'));
    }

    public function test_complete_throws_when_api_key_is_missing()
    {
        config(['openai.api_key' => null]);

        $this->expectException(OpenAiRequestException::class);

        app(ChatCompletionService::class)->complete('system', 'user');
    }

    public function test_complete_throws_when_the_request_fails()
    {
        Http::fake(['*/chat/completions' => Http::response(['error' => 'server error'], 500)]);
        config(['openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(ChatCompletionService::class)->complete('system', 'user');
    }

    public function test_complete_throws_when_the_response_shape_is_unexpected()
    {
        Http::fake(['*/chat/completions' => Http::response(['unexpected' => true])]);
        config(['openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(ChatCompletionService::class)->complete('system', 'user');
    }

    public function test_complete_throws_when_the_connection_fails()
    {
        Http::fake(['*' => Http::failedConnection()]);
        config(['openai.api_key' => 'test-key']);

        $this->expectException(OpenAiRequestException::class);

        app(ChatCompletionService::class)->complete('system', 'user');
    }
}
