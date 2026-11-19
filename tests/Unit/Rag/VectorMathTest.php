<?php

namespace Tests\Unit\Rag;

use App\Services\Rag\VectorMath;
use Tests\TestCase;

class VectorMathTest extends TestCase
{
    public function test_identical_vectors_have_similarity_of_one(): void
    {
        $this->assertEqualsWithDelta(1.0, VectorMath::cosineSimilarity([1, 0, 0], [1, 0, 0]), 0.0001);
    }

    public function test_orthogonal_vectors_have_similarity_of_zero(): void
    {
        $this->assertEqualsWithDelta(0.0, VectorMath::cosineSimilarity([1, 0], [0, 1]), 0.0001);
    }

    public function test_opposite_vectors_have_similarity_of_negative_one(): void
    {
        $this->assertEqualsWithDelta(-1.0, VectorMath::cosineSimilarity([1, 0], [-1, 0]), 0.0001);
    }
}
