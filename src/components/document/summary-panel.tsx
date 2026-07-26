import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, Copy, Download, Loader2, RefreshCw, ScrollText } from "lucide-react";
import { toast } from "sonner";

import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, friendlyErrorMessage } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";
import { generateSummary } from "@/lib/ai.functions";

type SummaryType = "short" | "detailed" | "chapter";

export function SummaryPanel({ documentId, fileName }: { documentId: string; fileName: string }) {
  const queryClient = useQueryClient();
  const run = useServerFn(generateSummary);
  const [type, setType] = useState<SummaryType>("detailed");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["summaries", documentId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("summaries")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return rows;
    },
  });

  const current = data?.find((row) => row.summary_type === type);

  async function generate() {
    setBusy(true);
    try {
      await run({ data: { documentId, summaryType: type } });
      await queryClient.invalidateQueries({ queryKey: ["summaries", documentId] });
      toast.success("Summary ready");
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "Could not generate summary"));
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    if (!current) return;
    void navigator.clipboard.writeText(current.summary_text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!current) return;
    const blob = new Blob([current.summary_text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.replace(/\.[^.]+$/, "")}-${type}-summary.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={type} onValueChange={(value) => setType(value as SummaryType)}>
          <TabsList>
            <TabsTrigger value="short">Short</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
            <TabsTrigger value="chapter">Chapter-wise</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copy} disabled={!current}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy
          </Button>
          <Button variant="outline" size="sm" onClick={download} disabled={!current}>
            <Download className="h-4 w-4" /> Download
          </Button>
          <Button size="sm" onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {current ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="We couldn't load your summaries"
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : current ? (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4 text-xs text-muted-foreground">
              {current.word_count?.toLocaleString()} words · {current.reading_time} min read ·{" "}
              {new Date(current.created_at).toLocaleString()}
            </p>
            <Markdown content={current.summary_text} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          illustration={false}
          icon={ScrollText}
          title={`No ${type} summary yet`}
          description="Lumen will read the document and write this summary for you."
          action={
            <Button onClick={generate} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Generate summary
            </Button>
          }
        />
      )}
    </div>
  );
}
