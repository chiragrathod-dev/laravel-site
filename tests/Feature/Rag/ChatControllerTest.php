<?php

namespace Tests\Feature\Rag;

use App\Models\DocumentChunk;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChatControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_an_answer_and_the_matched_sources()
    {
        DocumentChunk::factory()->create(['content' => 'relevant chunk', 'embedding' => [1, 0, 0]]);
        DocumentChunk::factory()->create(['content' => 'irrelevant chunk', 'embedding' => [0, 1, 0]]);

        Http::fake([
            '*/embeddings' => Http::response(['data' => [['embedding' => [1, 0, 0]]]]),
            '*/chat/completions' => Http::response(['choices' => [['message' => ['content' => 'the answer']]]]),
        ]);
        config(['openai.api_key' => 'test-key']);

        $response = $this->postJson(route('chat.ask'), ['question' => 'What is it?']);

        $response->assertOk()->assertJson([
            'answer' => 'the answer',
            'sources' => ['relevant chunk'],
        ]);
    }

    public function test_rejects_a_missing_question()
    {
        $this->postJson(route('chat.ask'), [])->assertStatus(422);
    }

    public function test_rejects_a_question_over_1000_characters()
    {
        $this->postJson(route('chat.ask'), ['question' => str_repeat('a', 1001)])->assertStatus(422);
    }

    public function test_returns_502_when_the_api_key_is_missing()
    {
        config(['openai.api_key' => null]);

        $this->postJson(route('chat.ask'), ['question' => 'What is it?'])->assertStatus(502);
    }
}
