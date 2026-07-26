import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock, Loader2, Quote, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, friendlyErrorMessage } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";
import { generateInsights } from "@/lib/ai.functions";

type Pair = Record<string, string>;

export function InsightsPanel({ documentId }: { documentId: string }) {
  const queryClient = useQueryClient();
  const run = useServerFn(generateInsights);
  const [busy, setBusy] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["insights", documentId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("insights")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return rows?.[0] ?? null;
    },
  });

  async function generate() {
    setBusy(true);
    try {
      await run({ data: { documentId } });
      await queryClient.invalidateQueries({ queryKey: ["insights", documentId] });
      toast.success("Insights extracted");
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "Could not extract insights"));
    } finally {
      setBusy(false);
    }
  }

  if (isError)
    return <ErrorState title="We couldn't load these insights" onRetry={() => refetch()} />;

  if (isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;

  if (!data) {
    return (
      <EmptyState
        title="No insights extracted yet"
        description="Pull out key ideas, quotes, themes, vocabulary, people and dates in one pass."
        action={
          <Button onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Extract insights
          </Button>
        }
      />
    );
  }

  const keyIdeas = (data.key_ideas as unknown as string[]) ?? [];
  const quotes = (data.important_quotes as unknown as Pair[]) ?? [];
  const themes = (data.themes as unknown as Pair[]) ?? [];
  const definitions = (data.definitions as unknown as Pair[]) ?? [];
  const vocabulary = (data.vocabulary as unknown as Pair[]) ?? [];
  const people = (data.people as unknown as Pair[]) ?? [];
  const dates = (data.important_dates as unknown as Pair[]) ?? [];
  const timeline = (data.timeline as unknown as Pair[]) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Regenerate
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {keyIdeas.length > 0 ? (
          <Section title="Key ideas">
            <ul className="space-y-2">
              {keyIdeas.map((idea) => (
                <li key={idea} className="flex gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {idea}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {quotes.length > 0 ? (
          <Section title="Important quotes">
            <div className="space-y-3">
              {quotes.map((item, index) => (
                <blockquote key={index} className="border-l-2 border-accent pl-3">
                  <p className="flex gap-2 text-sm italic">
                    <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    {item.quote}
                  </p>
                  {item.context ? (
                    <p className="mt-1 text-xs text-muted-foreground">{item.context}</p>
                  ) : null}
                </blockquote>
              ))}
            </div>
          </Section>
        ) : null}

        {themes.length > 0 ? (
          <Section title="Themes">
            <PairList items={themes} keyName="theme" valueName="description" />
          </Section>
        ) : null}

        {definitions.length > 0 ? (
          <Section title="Definitions">
            <PairList items={definitions} keyName="term" valueName="definition" />
          </Section>
        ) : null}

        {vocabulary.length > 0 ? (
          <Section title="Vocabulary">
            <PairList items={vocabulary} keyName="word" valueName="meaning" />
          </Section>
        ) : null}

        {people.length > 0 ? (
          <Section title="People mentioned" icon={Users}>
            <PairList items={people} keyName="name" valueName="role" />
          </Section>
        ) : null}

        {dates.length > 0 ? (
          <Section title="Important dates" icon={CalendarClock}>
            <PairList items={dates} keyName="date" valueName="event" />
          </Section>
        ) : null}

        {timeline.length > 0 ? (
          <Section title="Timeline">
            <ol className="relative space-y-4 border-l border-border pl-5">
              {timeline.map((item, index) => (
                <li key={index}>
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-semibold">{item.when}</p>
                  <p className="text-sm text-muted-foreground">{item.what}</p>
                </li>
              ))}
            </ol>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon ? <Icon className="h-4 w-4 text-accent" /> : null}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PairList({
  items,
  keyName,
  valueName,
}: {
  items: Pair[];
  keyName: string;
  valueName: string;
}) {
  return (
    <dl className="space-y-3">
      {items.map((item, index) => (
        <div key={index}>
          <dt className="text-sm font-semibold">{item[keyName]}</dt>
          <dd className="text-sm text-muted-foreground">{item[valueName]}</dd>
        </div>
      ))}
    </dl>
  );
}
