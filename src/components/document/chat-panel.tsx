import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, MessagesSquare, Quote, Send } from "lucide-react";
import { toast } from "sonner";

import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, friendlyErrorMessage } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";
import { askDocument, suggestQuestions } from "@/lib/ai.functions";

export function ChatPanel({ documentId }: { documentId: string }) {
  const queryClient = useQueryClient();
  const ask = useServerFn(askDocument);
  const suggest = useServerFn(suggestQuestions);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading, isError, refetch } = useQuery({
    queryKey: ["chats", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: suggestions } = useQuery({
    queryKey: ["chat-suggestions", documentId],
    queryFn: () => suggest({ data: { documentId } }),
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setMessage("");
    setBusy(true);
    try {
      await ask({ data: { documentId, message: value } });
      await queryClient.invalidateQueries({ queryKey: ["chats", documentId] });
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "Lumen couldn't answer that"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[32rem] flex-col rounded-2xl border border-border">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {isError ? (
          <ErrorState title="We couldn't load this conversation" onRetry={() => refetch()} />
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading conversation…</p>
        ) : messages && messages.length > 0 ? (
          messages.map((item) => (
            <div key={item.id} className="space-y-3">
              <div className="flex justify-end">
                <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {item.user_message}
                </p>
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                <Markdown content={item.ai_response} />
                {item.source_reference ? (
                  <p className="mt-3 flex gap-2 border-l-2 border-accent pl-3 text-xs italic text-muted-foreground">
                    <Quote className="h-3.5 w-3.5 shrink-0" />
                    {item.source_reference}
                  </p>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="Start the conversation"
            description="Ask anything about this document — Lumen answers only from its contents and shows you the source."
          />
        )}
        {busy ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Lumen is reading…
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {suggestions && suggestions.length > 0 && (!messages || messages.length === 0) ? (
        <div className="flex flex-wrap gap-2 border-t border-border p-4">
          {suggestions.map((question) => (
            <button
              key={question}
              onClick={() => send(question)}
              className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/50 hover:bg-muted"
            >
              {question}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(message);
        }}
        className="flex gap-2 border-t border-border p-4"
      >
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask about this document…"
          maxLength={2000}
        />
        <Button type="submit" disabled={busy || !message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
