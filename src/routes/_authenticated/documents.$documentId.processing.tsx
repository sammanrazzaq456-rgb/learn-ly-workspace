import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileText, Loader2 } from "lucide-react";
import { z } from "zod";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { AI_MODE_LABEL } from "@/lib/ai-modes";
import {
  generateInsights,
  generateStudyMaterials,
  generateSummary,
} from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/documents/$documentId/processing")({
  validateSearch: z.object({
    mode: z.enum(["summary", "explain", "study", "chat", "insights"]).catch("summary"),
  }),
  head: () => ({
    meta: [
      { title: "Processing your document — Lumen" },
      { name: "description", content: "Lumen is reading and analysing your document." },
      { property: "og:title", content: "Processing your document — Lumen" },
      { property: "og:description", content: "Lumen is reading and analysing your document." },
    ],
  }),
  component: Processing,
});

const STEPS = [
  "Reading the document",
  "Understanding structure",
  "Analysing key content",
  "Generating your material",
  "Finishing up",
];

function Processing() {
  const { documentId } = Route.useParams();
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const cancelled = useRef(false);
  const started = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const runSummary = useServerFn(generateSummary);
  const runStudy = useServerFn(generateStudyMaterials);
  const runInsights = useServerFn(generateInsights);

  const { data: doc } = useQuery({
    queryKey: ["document", documentId, "meta"],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("documents")
        .select("file_name, file_type, file_size, page_count, content")
        .eq("id", documentId)
        .single();
      if (queryError) throw queryError;
      return data;
    },
  });

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    const stepper = window.setInterval(
      () => setStepIndex((value) => Math.min(value + 1, STEPS.length - 2)),
      2600,
    );
    return () => {
      window.clearInterval(timer);
      window.clearInterval(stepper);
    };
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        if (mode === "summary") await runSummary({ data: { documentId, summaryType: "detailed" } });
        if (mode === "study") await runStudy({ data: { documentId } });
        if (mode === "insights") await runInsights({ data: { documentId } });
        if (cancelled.current) return;

        await supabase
          .from("documents")
          .update({ processing_status: "ready", processing_step: null })
          .eq("id", documentId);

        setStepIndex(STEPS.length - 1);
        navigate({
          to: "/documents/$documentId",
          params: { documentId },
          search: { tab: mode },
          replace: true,
        });
      } catch (runError) {
        if (cancelled.current) return;
        const message = runError instanceof Error ? runError.message : "Processing failed";
        setError(message);
        await supabase
          .from("documents")
          .update({ processing_status: "failed", processing_error: message })
          .eq("id", documentId);
      }
    })();
  }, [documentId, mode, navigate, runInsights, runStudy, runSummary]);

  async function cancel() {
    cancelled.current = true;
    await supabase
      .from("documents")
      .update({ processing_status: "ready", processing_step: null })
      .eq("id", documentId);
    navigate({ to: "/documents/$documentId", params: { documentId }, search: { tab: mode } });
  }

  const percent = error ? 100 : Math.round(((stepIndex + 1) / STEPS.length) * 100);
  const remaining = Math.max(0, 25 - elapsed);

  return (
    <AppShell title="AI processing" description={`Preparing ${AI_MODE_LABEL[mode].toLowerCase()}`}>
      <div className="mx-auto max-w-xl">
        <Card>
          <CardContent className="pt-8">
            {error ? (
              <div className="text-center">
                <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
                <h2 className="mt-4 text-lg font-semibold">Processing failed</h2>
                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                <div className="mt-6 flex justify-center gap-2">
                  <Button onClick={() => window.location.reload()}>Try again</Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate({
                        to: "/documents/$documentId",
                        params: { documentId },
                        search: { tab: mode },
                      })
                    }
                  >
                    Open document
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </span>
                </div>

                <h2 className="mt-6 text-center font-display text-xl font-bold">
                  {STEPS[stepIndex]}…
                </h2>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  About {remaining}s remaining
                </p>

                <div className="mt-6">
                  <Progress value={percent} />
                </div>

                <div className="mt-6 space-y-1 rounded-xl bg-muted/50 p-4 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="truncate">{doc?.file_name ?? "Your document"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {doc?.file_type?.toUpperCase()}
                    {doc?.page_count ? ` · ${doc.page_count} pages` : ""}
                    {doc?.content ? ` · ${doc.content.split(/\s+/).length.toLocaleString()} words` : ""}
                  </p>
                </div>

                <ol className="mt-6 space-y-2">
                  {STEPS.map((label, index) => (
                    <li
                      key={label}
                      className={
                        index <= stepIndex
                          ? "flex items-center gap-2 text-sm text-foreground"
                          : "flex items-center gap-2 text-sm text-muted-foreground/60"
                      }
                    >
                      <span
                        className={
                          index <= stepIndex
                            ? "h-1.5 w-1.5 rounded-full bg-accent"
                            : "h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
                        }
                      />
                      {label}
                    </li>
                  ))}
                </ol>

                <Button variant="ghost" className="mt-6 w-full" onClick={cancel}>
                  Cancel
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
