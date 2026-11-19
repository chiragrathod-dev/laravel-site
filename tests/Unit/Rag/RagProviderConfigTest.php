<?php

namespace Tests\Unit\Rag;

use App\Services\Rag\RagProviderConfig;
use Tests\TestCase;

class RagProviderConfigTest extends TestCase
{
    public function test_defaults_to_the_openai_provider()
    {
        $config = RagProviderConfig::current();

        $this->assertSame('https://api.openai.com/v1', $config['base_url']);
        $this->assertSame('text-embedding-3-small', $config['embedding_model']);
    }

    public function test_switches_to_the_configured_provider()
    {
        config(['openai.provider' => 'openrouter']);

        $config = RagProviderConfig::current();

        $this->assertSame('https://openrouter.ai/api/v1', $config['base_url']);
        $this->assertSame('openai/text-embedding-3-small', $config['embedding_model']);
    }

    public function test_returns_an_empty_array_for_an_unknown_provider()
    {
        config(['openai.provider' => 'does-not-exist']);

        $this->assertSame([], RagProviderConfig::current());
    }
}
