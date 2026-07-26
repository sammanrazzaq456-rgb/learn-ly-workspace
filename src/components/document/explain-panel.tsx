import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Lightbulb, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { friendlyErrorMessage } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";
import { generateExplanation } from "@/lib/ai.functions";

type Level = "beginner" | "intermediate" | "advanced";
type Term = { term: string; definition: string };

export function ExplainPanel({ documentId, content }: { documentId: string; content: string }) {
  const queryClient = useQueryClient();
  const run = useServerFn(generateExplanation);
  const [level, setLevel] = useState<Level>("intermediate");
  const [passage, setPassage] = useState(content.slice(0, 1500));
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["explanations", documentId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("explanations")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return rows?.[0] ?? null;
    },
  });

  async function explain(nextLevel: Level = level) {
    const text = passage.trim();
    if (text.length < 40) {
      toast.error("Select or paste a longer passage to explain");
      return;
    }
    setBusy(true);
    try {
      await run({ data: { documentId, originalText: text.slice(0, 12000), level: nextLevel } });
      await queryClient.invalidateQueries({ queryKey: ["explanations", documentId] });
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "Could not explain this passage"));
    } finally {
      setBusy(false);
    }
  }

  const terms = (data?.terms as unknown as Term[] | null) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={level}
          onValueChange={(value) => {
            setLevel(value as Level);
          }}
        >
          <TabsList>
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLevel("beginner");
              void explain("beginner");
            }}
            disabled={busy}
          >
            <Wand2 className="h-4 w-4" /> Simplify
          </Button>
          <Button size="sm" onClick={() => explain()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
            Explain
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Original text
            </p>
            <Textarea
              value={passage}
              onChange={(event) => setPassage(event.target.value)}
              className="min-h-[26rem] font-mono text-xs leading-relaxed"
              maxLength={12000}
            />
            <p className="text-xs text-muted-foreground">
              Paste or edit the passage you want explained.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Lumen explains
            </p>
            {busy ? (
              <div className="flex min-h-[20rem] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : data ? (
              <>
                <div className="mt-3">
                  <Markdown content={data.explanation} />
                </div>
                {terms.length > 0 ? (
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Difficult terms
                    </p>
                    <dl className="mt-3 space-y-3">
                      {terms.map((item) => (
                        <div key={item.term} className="rounded-xl bg-muted/60 p-3">
                          <dt className="text-sm font-semibold text-accent">{item.term}</dt>
                          <dd className="text-sm text-muted-foreground">{item.definition}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="flex min-h-[20rem] items-center justify-center text-center text-sm text-muted-foreground">
                Choose a difficulty level and hit Explain.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
