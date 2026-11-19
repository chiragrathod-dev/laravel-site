import { Loader2Icon, SendHorizontalIcon } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCsrfTokenFromCookie } from '@/lib/csrf';
import { ask } from '@/routes/chat';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
}

interface ChatSuccessResponse {
    answer: string;
    sources: string[];
}

interface ChatErrorResponse {
    error?: string;
    message?: string;
}

export function ChatWidget() {
    const inputId = useId();
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedQuestion = question.trim();

        if (trimmedQuestion === '' || isLoading) {
            return;
        }

        setError(null);
        setIsLoading(true);
        setMessages((current) => [
            ...current,
            { role: 'user', content: trimmedQuestion },
        ]);
        setQuestion('');

        try {
            const response = await fetch(ask.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCsrfTokenFromCookie() ?? '',
                },
                body: JSON.stringify({ question: trimmedQuestion }),
            });

            if (!response.ok) {
                const body = (await response
                    .json()
                    .catch(() => ({}))) as ChatErrorResponse;
                setError(
                    body.error ??
                        body.message ??
                        'Something went wrong while contacting the assistant. Please try again.',
                );

                return;
            }

            const body = (await response.json()) as ChatSuccessResponse;

            setMessages((current) => [
                ...current,
                {
                    role: 'assistant',
                    content: body.answer,
                    sources: body.sources,
                },
            ]);
        } catch {
            setError(
                'Something went wrong while contacting the assistant. Please try again.',
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <section className="bg-zinc-950 py-20">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-center text-2xl font-semibold text-balance text-zinc-50 sm:text-3xl">
                    Ask the Pebble FAQ assistant.
                </h2>
                <p className="mt-4 text-center text-sm leading-relaxed text-zinc-400">
                    Answers come from a sample FAQ for Pebble, a fictional
                    note-taking app, used to demonstrate a RAG pipeline.
                </p>

                <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
                    <div className="flex max-h-96 flex-col gap-4 overflow-y-auto pr-1">
                        {messages.length === 0 && !isLoading && (
                            <p className="text-sm text-zinc-500">
                                No messages yet — ask a question to get started.
                            </p>
                        )}

                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={
                                    message.role === 'user'
                                        ? 'ml-auto max-w-[85%] rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20 px-4 py-2 text-sm text-zinc-100'
                                        : 'mr-auto max-w-[85%] rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200'
                                }
                            >
                                <p className="leading-relaxed whitespace-pre-wrap">
                                    {message.content}
                                </p>

                                {message.sources &&
                                    message.sources.length > 0 && (
                                        <div className="mt-3 border-t border-zinc-800 pt-2">
                                            <p className="text-xs font-medium text-zinc-500">
                                                Sources
                                            </p>
                                            <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-zinc-500">
                                                {message.sources.map(
                                                    (source, sourceIndex) => (
                                                        <li key={sourceIndex}>
                                                            {source}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="mr-auto flex items-center gap-2 text-sm text-zinc-500">
                                <Loader2Icon
                                    className="size-4 animate-spin"
                                    aria-hidden="true"
                                />
                                Thinking…
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="mt-4 text-sm text-red-400" role="alert">
                            {error}
                        </p>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="mt-6 flex items-center gap-3"
                    >
                        <label htmlFor={inputId} className="sr-only">
                            Ask a question
                        </label>
                        <Input
                            id={inputId}
                            type="text"
                            value={question}
                            onChange={(event) =>
                                setQuestion(event.target.value)
                            }
                            placeholder="e.g. Can I use Pebble offline?"
                            maxLength={1000}
                            disabled={isLoading}
                            className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-pink-500/50"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || question.trim() === ''}
                            className="bg-gradient-to-r from-red-500 to-pink-500 text-white hover:opacity-90"
                        >
                            <SendHorizontalIcon
                                className="size-4"
                                aria-hidden="true"
                            />
                            Send
                        </Button>
                    </form>
                </div>
            </div>
        </section>
    );
}
