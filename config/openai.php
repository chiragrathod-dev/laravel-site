<?php

return [

    'provider' => env('RAG_PROVIDER', 'openai'),

    'providers' => [
        'openai' => [
            'base_url' => 'https://api.openai.com/v1',
            'api_key' => env('OPENAI_API_KEY'),
            'embedding_model' => env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
            'chat_model' => env('OPENAI_CHAT_MODEL', 'gpt-4o-mini'),
        ],

        'openrouter' => [
            'base_url' => 'https://openrouter.ai/api/v1',
            'api_key' => env('OPENROUTER_API_KEY'),
            'embedding_model' => env('OPENROUTER_EMBEDDING_MODEL', 'openai/text-embedding-3-small'),
            'chat_model' => env('OPENROUTER_CHAT_MODEL', 'openai/gpt-4o-mini'),
        ],
    ],

    'top_k' => (int) env('OPENAI_RAG_TOP_K', 3),

];
