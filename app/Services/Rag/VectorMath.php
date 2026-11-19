<?php

namespace App\Services\Rag;

class VectorMath
{
    /**
     * Cosine similarity between two equal-length vectors, or 0.0 when either has zero magnitude.
     *
     * @param  array<int, float|int>  $a
     * @param  array<int, float|int>  $b
     */
    public static function cosineSimilarity(array $a, array $b): float
    {
        $values = array_values($b);
        $dotProduct = 0.0;
        $squaredNormA = 0.0;
        $squaredNormB = 0.0;

        foreach (array_values($a) as $index => $componentA) {
            $componentB = $values[$index];

            $dotProduct += $componentA * $componentB;
            $squaredNormA += $componentA * $componentA;
            $squaredNormB += $componentB * $componentB;
        }

        if ($squaredNormA === 0.0 || $squaredNormB === 0.0) {
            return 0.0;
        }

        return $dotProduct / (sqrt($squaredNormA) * sqrt($squaredNormB));
    }
}
