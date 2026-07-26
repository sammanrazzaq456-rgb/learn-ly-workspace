import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Clock3, Download, FileText, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";
import { AI_MODE_LABEL } from "@/lib/ai-modes";
import { formatBytes } from "@/lib/document-parsing";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — Lumen" },
      { name: "description", content: "Every document you've uploaded and what Lumen did with it." },
      { property: "og:title", content: "History — Lumen" },
      {
        property: "og:description",
        content: "Every document you've uploaded and what Lumen did with it.",
      },
    ],
  }),
  component: History,
});

function History() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [feature, setFeature] = useState("all");
  const [range, setRange] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const [documents, history] = await Promise.all([
        supabase.from("documents").select("*").order("upload_date", { ascending: false }),
        supabase.from("history").select("document_id, ai_feature_used, last_accessed"),
      ]);
      if (documents.error) throw documents.error;
      return { documents: documents.data ?? [], history: history.data ?? [] };
    },
  });

  const rows = useMemo(() => {
    if (!data) return [];
    const now = Date.now();
    return data.documents
      .map((doc) => ({
        ...doc,
        features: data.history
          .filter((item) => item.document_id === doc.id)
          .map((item) => item.ai_feature_used),
        lastAccessed:
          data.history
            .filter((item) => item.document_id === doc.id)
            .map((item) => item.last_accessed)
            .sort()
            .at(-1) ?? doc.upload_date,
      }))
      .filter((doc) => doc.file_name.toLowerCase().includes(search.trim().toLowerCase()))
      .filter((doc) => feature === "all" || doc.features.includes(feature))
      .filter((doc) => {
        if (range === "all") return true;
        const days = range === "7" ? 7 : 30;
        return now - new Date(doc.upload_date).getTime() <= days * 86400000;
      });
  }, [data, search, feature, range]);

  async function remove(id: string, fileUrl: string | null) {
    if (!window.confirm("Delete this document and everything generated from it?")) return;
    if (fileUrl) await supabase.storage.from("documents").remove([fileUrl]);
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete this document");
      return;
    }
    toast.success("Document deleted");
    await queryClient.invalidateQueries({ queryKey: ["history"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  function exportHistory() {
    const csv = [
      "file_name,file_type,size_bytes,uploaded,features",
      ...rows.map((row) =>
        [
          `"${row.file_name.replace(/"/g, '""')}"`,
          row.file_type,
          row.file_size,
          new Date(row.upload_date).toISOString(),
          `"${row.features.join(" | ")}"`,
        ].join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "lumen-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      title="History"
      description="Everything you've uploaded"
      actions={
        <Button variant="outline" size="sm" onClick={exportHistory} disabled={rows.length === 0}>
          <Download className="h-4 w-4" /> Export
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documents…"
              className="pl-9"
            />
          </div>
          <Select value={feature} onValueChange={setFeature}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="AI mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All AI modes</SelectItem>
              {Object.entries(AI_MODE_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any time</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isError ? (
          <ErrorState
            title="We couldn't load your history"
            description="This is usually a temporary connection problem."
            onRetry={() => refetch()}
          />
        ) : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : rows.length === 0 ? (
          data && data.documents.length > 0 ? (
            <EmptyState
              illustration={false}
              icon={Clock3}
              title="No matches"
              description="No documents match your search or filters. Try a different term or clear the filters."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setFeature("all");
                    setRange("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="You haven't uploaded anything yet"
              description="Your documents and everything Lumen makes from them will live here."
              action={
                <Button asChild>
                  <Link to="/upload">Upload a document</Link>
                </Button>
              }
            />
          )
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <Card key={row.id}>
                <CardContent className="flex flex-wrap items-center gap-4 pt-6">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-48 flex-1">
                    <Link
                      to="/documents/$documentId"
                      params={{ documentId: row.id }}
                      search={{ tab: "summary" }}
                      className="truncate text-sm font-semibold hover:underline"
                    >
                      {row.file_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {row.file_type.toUpperCase()} · {formatBytes(row.file_size)} · uploaded{" "}
                      {new Date(row.upload_date).toLocaleDateString()} · last opened{" "}
                      {new Date(row.lastAccessed).toLocaleDateString()}
                    </p>
                    {row.features.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {row.features.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {AI_MODE_LABEL[item as keyof typeof AI_MODE_LABEL] ?? item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        to="/documents/$documentId"
                        params={{ documentId: row.id }}
                        search={{ tab: "summary" }}
                      >
                        Reopen
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(row.id, row.file_url)}
                      aria-label={`Delete ${row.file_name}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
