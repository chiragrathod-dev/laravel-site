<?php

namespace App\Http\Controllers;

use App\Exceptions\Rag\OpenAiRequestException;
use App\Services\Rag\ChatCompletionService;
use App\Services\Rag\PromptBuilder;
use App\Services\Rag\RetrievalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function __construct(
        private RetrievalService $retrievalService,
        private ChatCompletionService $chatCompletionService,
    ) {}

    public function ask(Request $request): JsonResponse
    {
        $question = $request->validate([
            'question' => ['required', 'string', 'max:1000'],
        ])['question'];

        try {
            $scoredChunks = $this->retrievalService->retrieveRelevantChunks($question, config('openai.top_k'));
            $prompt = PromptBuilder::build($question, $scoredChunks);
            $answer = $this->chatCompletionService->complete($prompt['system'], $prompt['user']);
        } catch (OpenAiRequestException $exception) {
            return response()->json(['error' => $exception->getMessage()], 502);
        }

        return response()->json([
            'answer' => $answer,
            'sources' => $scoredChunks->pluck('chunk.content')->values(),
        ]);
    }
}
