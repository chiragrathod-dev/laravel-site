---
name: rag-pipeline
description: Activate when creating, reviewing, or modifying any part of the homepage RAG chat assistant - chunking, embeddings, document_chunks, retrieval, prompt construction, the /chat endpoint, rag:ingest, or the ChatWidget component. Read docs/rag-pipeline.md first for the file map and how to change models, FAQ content, or chunking.
---

# RAG chat pipeline

See `docs/rag-pipeline.md` for the full file map, how to add FAQ content, how to change models/top_k, and how to run this feature's tests (`php artisan test tests/Unit/Rag tests/Feature/Rag --compact`).

Key files: `app/Services/Rag/*`, `app/Models/DocumentChunk.php`, `app/Console/Commands/RagIngestCommand.php`, `app/Http/Controllers/ChatController.php`, `resources/rag/faq.md`, `resources/js/components/home/chat-widget.tsx`.
