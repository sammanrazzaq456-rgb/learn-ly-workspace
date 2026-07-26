import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Brain, Check, ChevronLeft, ChevronRight, Flame, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { generateStudyMaterials } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

type Flashcard = { front: string; back: string };
type Mcq = { question: string; options: string[]; answerIndex: number; explanation: string };
type QA = { question: string; answer: string };

export function StudyPanel({ documentId }: { documentId: string }) {
  const queryClient = useQueryClient();
  const run = useServerFn(generateStudyMaterials);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["study", documentId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("study_materials")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return rows?.[0] ?? null;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["study-progress"],
    queryFn: async () => {
      const { data: row } = await supabase.from("study_progress").select("*").maybeSingle();
      return row;
    },
  });

  async function generate() {
    setBusy(true);
    try {
      await run({ data: { documentId } });
      await queryClient.invalidateQueries({ queryKey: ["study", documentId] });
      toast.success("Study material ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not build study material");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <Skeletonish />;

  if (!data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Brain className="h-9 w-9 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            No study material yet. Lumen can build notes, flashcards, MCQs and practice questions.
          </p>
          <Button onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Build study set
          </Button>
        </CardContent>
      </Card>
    );
  }

  const flashcards = (data.flashcards as unknown as Flashcard[]) ?? [];
  const mcqs = (data.mcqs as unknown as Mcq[]) ?? [];
  const shortQuestions = (data.short_questions as unknown as QA[]) ?? [];
  const longQuestions = (data.long_questions as unknown as QA[]) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-sm text-accent">
          <Flame className="h-4 w-4" />
          {progress?.streak_days ?? 0} day streak · {progress?.cards_reviewed ?? 0} cards reviewed
        </div>
        <Button variant="outline" size="sm" onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Regenerate
        </Button>
      </div>

      <Tabs defaultValue="notes">
        <TabsList className="flex-wrap">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="mcqs">MCQs</TabsTrigger>
          <TabsTrigger value="short">Short questions</TabsTrigger>
          <TabsTrigger value="long">Long questions</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Markdown content={data.notes ?? "No notes generated."} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flashcards" className="mt-4">
          <FlashcardDeck cards={flashcards} />
        </TabsContent>

        <TabsContent value="mcqs" className="mt-4">
          <McqQuiz items={mcqs} />
        </TabsContent>

        <TabsContent value="short" className="mt-4">
          <QAList items={shortQuestions} />
        </TabsContent>

        <TabsContent value="long" className="mt-4">
          <QAList items={longQuestions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Skeletonish() {
  return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
}

function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  if (cards.length === 0) return <Empty text="No flashcards in this set." />;
  const card = cards[index];

  async function markReviewed() {
    const next = reviewed + 1;
    setReviewed(next);
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase.from("study_progress").select("*").maybeSingle();
    const sameDay = existing?.last_study_date === today;
    await supabase.from("study_progress").upsert({
      user_id: data.user.id,
      cards_reviewed: (existing?.cards_reviewed ?? 0) + 1,
      streak_days: sameDay ? (existing?.streak_days ?? 1) : (existing?.streak_days ?? 0) + 1,
      last_study_date: today,
    });
  }

  function move(step: number) {
    setFlipped(false);
    setIndex((value) => (value + step + cards.length) % cards.length);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Progress value={((index + 1) / cards.length) * 100} />
      <button
        onClick={() => {
          setFlipped((value) => !value);
          if (!flipped) void markReviewed();
        }}
        className="flex min-h-64 w-full items-center justify-center rounded-3xl border border-border bg-card p-8 text-center transition-colors hover:border-primary/40"
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {flipped ? "Answer" : "Question"}
          </p>
          <p className="mt-4 text-lg font-medium">{flipped ? card.back : card.front}</p>
          <p className="mt-6 text-xs text-muted-foreground">Click to flip</p>
        </div>
      </button>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => move(-1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          {index + 1} / {cards.length}
        </span>
        <Button variant="outline" size="sm" onClick={() => move(1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function McqQuiz({ items }: { items: Mcq[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showKey, setShowKey] = useState(false);

  if (items.length === 0) return <Empty text="No multiple-choice questions in this set." />;

  const correct = items.filter((item, index) => answers[index] === item.answerIndex).length;
  const answered = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm">
        <span>
          {answered} / {items.length} answered · {correct} correct
        </span>
        <Button variant="outline" size="sm" onClick={() => setShowKey((value) => !value)}>
          {showKey ? "Hide answer key" : "Show answer key"}
        </Button>
      </div>

      {items.map((item, index) => (
        <Card key={index}>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm font-medium">
              {index + 1}. {item.question}
            </p>
            <div className="grid gap-2">
              {item.options.map((option, optionIndex) => {
                const chosen = answers[index] === optionIndex;
                const isCorrect = item.answerIndex === optionIndex;
                const reveal = chosen || showKey;
                return (
                  <button
                    key={optionIndex}
                    onClick={() => setAnswers((value) => ({ ...value, [index]: optionIndex }))}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                      reveal && isCorrect
                        ? "border-accent bg-accent/10"
                        : chosen
                          ? "border-destructive bg-destructive/10"
                          : "border-border hover:border-primary/40",
                    )}
                  >
                    {reveal && isCorrect ? (
                      <Check className="h-4 w-4 text-accent" />
                    ) : chosen ? (
                      <X className="h-4 w-4 text-destructive" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-muted-foreground/40" />
                    )}
                    {option}
                  </button>
                );
              })}
            </div>
            {answers[index] !== undefined || showKey ? (
              <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                {item.explanation}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QAList({ items }: { items: QA[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  if (items.length === 0) return <Empty text="Nothing here yet." />;
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <p className="text-sm font-medium">
              {index + 1}. {item.question}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 px-0"
              onClick={() => setOpen((value) => ({ ...value, [index]: !value[index] }))}
            >
              {open[index] ? "Hide model answer" : "Show model answer"}
            </Button>
            {open[index] ? (
              <div className="mt-2 rounded-xl bg-muted/60 p-4">
                <Markdown content={item.answer} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
