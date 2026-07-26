import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Brain,
  FileText,
  Flame,
  Lightbulb,
  MessagesSquare,
  ScrollText,
  Sparkles,
  Upload,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lumen" },
      { name: "description", content: "Your documents, study stats and recent AI activity." },
      { property: "og:title", content: "Dashboard — Lumen" },
      {
        property: "og:description",
        content: "Your documents, study stats and recent AI activity.",
      },
    ],
  }),
  component: Dashboard,
});

const FEATURE_LABEL: Record<string, string> = {
  summary: "Summary",
  explain: "Explain mode",
  study: "Study mode",
  chat: "Chat",
  insights: "Insights",
  upload: "Upload",
};

function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      const [documents, summaries, materials, progress, history, profile] = await Promise.all([
        supabase
          .from("documents")
          .select("id, file_name, file_type, processing_status, upload_date")
          .order("upload_date", { ascending: false })
          .limit(5),
        supabase.from("summaries").select("id", { count: "exact", head: true }),
        supabase.from("study_materials").select("id", { count: "exact", head: true }),
        supabase.from("study_progress").select("*").maybeSingle(),
        supabase
          .from("history")
          .select("id, ai_feature_used, last_accessed, document_id, documents(file_name)")
          .order("last_accessed", { ascending: false })
          .limit(6),
        supabase.from("profiles").select("full_name").maybeSingle(),
      ]);

      const { count: documentCount } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true });

      return {
        name:
          profile.data?.full_name?.split(" ")[0] ??
          (user?.email ? user.email.split("@")[0] : "there"),
        documents: documents.data ?? [],
        documentCount: documentCount ?? 0,
        summaryCount: summaries.count ?? 0,
        materialCount: materials.count ?? 0,
        streak: progress.data?.streak_days ?? 0,
        history: history.data ?? [],
      };
    },
  });
}

function Dashboard() {
  const { data, isLoading, isError, refetch } = useDashboardData();

  return (
    <AppShell title="Dashboard" description="Everything you're studying, in one place">
      {isError ? (
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm text-muted-foreground">We couldn't load your dashboard.</p>
            <Button onClick={() => refetch()}>Try again</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <section className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-7">
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h2 className="mt-1 font-display text-3xl font-bold capitalize">
              {isLoading ? <Skeleton className="h-9 w-48" /> : data?.name}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Upload a document and Lumen will summarise it, explain the hard parts and build
              practice material from it.
            </p>
            <Button asChild className="mt-5" size="lg">
              <Link to="/upload">
                <Upload className="h-4 w-4" /> Upload a document
              </Link>
            </Button>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Documents" value={data?.documentCount} icon={FileText} loading={isLoading} />
            <Stat label="Summaries" value={data?.summaryCount} icon={ScrollText} loading={isLoading} />
            <Stat label="Study sets" value={data?.materialCount} icon={Brain} loading={isLoading} />
            <Stat
              label="Day streak"
              value={data?.streak}
              icon={Flame}
              loading={isLoading}
              accent
            />
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Quick actions
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction to="/upload" icon={Sparkles} title="Summarise" text="Turn a document into a clear summary" />
              <QuickAction to="/upload" icon={Lightbulb} title="Explain" text="Break down the difficult passages" />
              <QuickAction to="/upload" icon={Brain} title="Study" text="Flashcards, MCQs and questions" />
              <QuickAction to="/upload" icon={MessagesSquare} title="Chat" text="Ask your document anything" />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent documents</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/history">
                    View all <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading ? (
                  <>
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </>
                ) : data && data.documents.length > 0 ? (
                  data.documents.map((doc) => (
                    <Link
                      key={doc.id}
                      to="/documents/$documentId"
                      params={{ documentId: doc.id }}
                      className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:bg-muted/60"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.file_type.toUpperCase()} ·{" "}
                          {new Date(doc.upload_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs capitalize text-muted-foreground">
                        {doc.processing_status}
                      </span>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    text="No documents yet. Upload your first PDF, Word file or notes."
                    ctaLabel="Upload a document"
                  />
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Recent AI activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </>
                ) : data && data.history.length > 0 ? (
                  data.history.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {FEATURE_LABEL[item.ai_feature_used] ?? item.ai_feature_used}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.documents?.file_name ?? "Document"} ·{" "}
                          {new Date(item.last_accessed).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Your AI activity will appear here.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  label: string;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <span
          className={
            accent
              ? "flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent"
              : "flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
          }
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <p className="text-2xl font-bold">{value ?? 0}</p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  text,
}: {
  to: "/upload";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/50"
    >
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </Link>
  );
}

function EmptyState({ text, ctaLabel }: { text: string; ctaLabel: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <FileText className="h-8 w-8 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button asChild size="sm">
        <Link to="/upload">{ctaLabel}</Link>
      </Button>
    </div>
  );
}
