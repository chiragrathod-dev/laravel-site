<?php

namespace Database\Factories;

use App\Models\DocumentChunk;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentChunk>
 */
class DocumentChunkFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'source' => DocumentChunk::SOURCE_FAQ,
            'content' => fake()->sentence(),
            'embedding' => [
                fake()->randomFloat(4, -1, 1),
                fake()->randomFloat(4, -1, 1),
                fake()->randomFloat(4, -1, 1),
            ],
            'metadata' => null,
        ];
    }
}
