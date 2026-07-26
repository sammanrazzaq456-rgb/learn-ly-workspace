import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { z } from "zod";

import { AppShell } from "@/components/app-shell";
import { ChatPanel } from "@/components/document/chat-panel";
import { ExplainPanel } from "@/components/document/explain-panel";
import { InsightsPanel } from "@/components/document/insights-panel";
import { StudyPanel } from "@/components/document/study-panel";
import { SummaryPanel } from "@/components/document/summary-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes } from "@/lib/document-parsing";

const tabSchema = z.object({
  tab: z.enum(["summary", "explain", "study", "chat", "insights"]).catch("summary"),
});

export const Route = createFileRoute("/_authenticated/documents/$documentId/")({
  validateSearch: tabSchema,
  head: () => ({
    meta: [
      { title: "Document workspace — Lumen" },
      {
        name: "description",
        content: "Summaries, explanations, study material, chat and insights for your document.",
      },
      { property: "og:title", content: "Document workspace — Lumen" },
      {
        property: "og:description",
        content: "Summaries, explanations, study material, chat and insights for your document.",
      },
    ],
  }),
  component: DocumentWorkspace,
});

function DocumentWorkspace() {
  const { documentId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .maybeSingle();
      if (error) throw error;
      return row;
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Document">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell title="Document">
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <FileText className="h-9 w-9 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              We couldn't find this document. It may have been deleted.
            </p>
            <Button onClick={() => navigate({ to: "/history" })}>Back to history</Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={data.file_name}
      description={`${data.file_type.toUpperCase()} · ${formatBytes(data.file_size)}${
        data.page_count ? ` · ${data.page_count} pages` : ""
      }`}
    >
      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate({
            to: "/documents/$documentId",
            params: { documentId },
            search: { tab: value as typeof tab },
            replace: true,
          })
        }
      >
        <TabsList className="flex-wrap">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="explain">Explain</TabsTrigger>
          <TabsTrigger value="study">Study</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <SummaryPanel documentId={documentId} fileName={data.file_name} />
        </TabsContent>
        <TabsContent value="explain" className="mt-6">
          <ExplainPanel documentId={documentId} content={data.content} />
        </TabsContent>
        <TabsContent value="study" className="mt-6">
          <StudyPanel documentId={documentId} />
        </TabsContent>
        <TabsContent value="chat" className="mt-6">
          <ChatPanel documentId={documentId} />
        </TabsContent>
        <TabsContent value="insights" className="mt-6">
          <InsightsPanel documentId={documentId} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
