import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { FileText, Loader2, Sparkles, Upload as UploadIcon, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { friendlyErrorMessage } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";
import {
  ACCEPTED_TYPES,
  MAX_FILE_BYTES,
  fileExtension,
  formatBytes,
  isSupportedFile,
  parseDocument,
} from "@/lib/document-parsing";
import { cn } from "@/lib/utils";
import type { AiMode } from "@/lib/ai-modes";
import { AI_MODES } from "@/lib/ai-modes";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [
      { title: "Upload a document — Lumen" },
      {
        name: "description",
        content: "Drop a PDF, Word file or paste text and choose what Lumen should do with it.",
      },
      { property: "og:title", content: "Upload a document — Lumen" },
      {
        property: "og:description",
        content: "Drop a PDF, Word file or paste text and choose what Lumen should do with it.",
      },
    ],
  }),
  component: UploadWorkspace,
});

function UploadWorkspace() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pastedTitle, setPastedTitle] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [mode, setMode] = useState<AiMode>("summary");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");

  const pickFile = useCallback((candidate: File) => {
    if (!isSupportedFile(candidate)) {
      toast.error(`Unsupported file. Use ${ACCEPTED_TYPES.join(", ")}`);
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      toast.error("That file is larger than 20 MB");
      return;
    }
    setFile(candidate);
  }, []);

  async function startFromFile() {
    if (!file) return;
    setBusy(true);
    try {
      setStep("Reading your document");
      setProgress(5);
      const parsed = await parseDocument(file, (percent) => setProgress(5 + percent * 0.5));
      if (!parsed.text.trim()) {
        throw new Error("We couldn't find any text in that file. Is it a scanned image?");
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Your session expired. Sign in again.");

      setStep("Saving securely");
      setProgress(65);
      const path = `${userId}/${crypto.randomUUID()}${fileExtension(file.name)}`;
      const { error: storageError } = await supabase.storage
        .from("documents")
        .upload(path, file, { contentType: file.type || "application/octet-stream" });
      if (storageError) throw storageError;

      setProgress(80);
      const { data: doc, error } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          file_name: file.name,
          file_type: fileExtension(file.name).replace(".", ""),
          file_size: file.size,
          file_url: path,
          content: parsed.text,
          page_count: parsed.pageCount,
          processing_status: "processing",
          processing_step: "queued",
        })
        .select("id")
        .single();
      if (error) throw error;

      setProgress(100);
      navigate({
        to: "/documents/$documentId/processing",
        params: { documentId: doc.id },
        search: { mode },
      });
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "Upload failed"));
      setBusy(false);
      setProgress(0);
      setStep("");
    }
  }

  async function startFromText() {
    const text = pastedText.trim();
    if (text.length < 200) {
      toast.error("Paste at least a couple of paragraphs (200+ characters)");
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Your session expired. Sign in again.");

      setStep("Saving your text");
      setProgress(50);
      const { data: doc, error } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          file_name: pastedTitle.trim() || "Pasted text",
          file_type: "txt",
          file_size: new Blob([text]).size,
          content: text,
          processing_status: "processing",
          processing_step: "queued",
        })
        .select("id")
        .single();
      if (error) throw error;

      setProgress(100);
      navigate({
        to: "/documents/$documentId/processing",
        params: { documentId: doc.id },
        search: { mode },
      });
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "Could not save your text"));
      setBusy(false);
      setProgress(0);
      setStep("");
    }
  }

  return (
    <AppShell title="Upload" description="Add a document and choose what Lumen should do">
      <div className="mx-auto max-w-3xl space-y-8">
        <Tabs defaultValue="file">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload a file</TabsTrigger>
            <TabsTrigger value="text">Paste text</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-5">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const dropped = event.dataTransfer.files?.[0];
                if (dropped) pickFile(dropped);
              }}
              className={cn(
                "rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30",
              )}
            >
              <UploadIcon className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-4 font-display text-lg font-semibold">
                Drag &amp; drop your document
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                PDF, DOCX, TXT or Markdown · up to 20 MB
              </p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={(event) => {
                  const chosen = event.target.files?.[0];
                  if (chosen) pickFile(chosen);
                }}
              />
              <Button className="mt-5" onClick={() => inputRef.current?.click()} disabled={busy}>
                Choose a file
              </Button>
            </div>

            {file ? (
              <Card className="mt-4">
                <CardContent className="flex items-center gap-3 pt-6">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  {!busy ? (
                    <button onClick={() => setFile(null)} aria-label="Remove file">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <ModePicker mode={mode} setMode={setMode} />

            {busy ? (
              <div className="mt-6 space-y-2">
                <p className="text-sm text-muted-foreground">{step}</p>
                <Progress value={progress} />
              </div>
            ) : null}

            <Button
              size="lg"
              className="mt-6 w-full"
              disabled={!file || busy}
              onClick={startFromFile}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Process with Lumen
            </Button>
          </TabsContent>

          <TabsContent value="text" className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={pastedTitle}
                maxLength={120}
                onChange={(event) => setPastedTitle(event.target.value)}
                placeholder="Lecture 4 — Thermodynamics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text">Your text</Label>
              <Textarea
                id="text"
                value={pastedText}
                onChange={(event) => setPastedText(event.target.value)}
                placeholder="Paste your notes, an article or a chapter here…"
                className="min-h-64"
                maxLength={200000}
              />
              <p className="text-xs text-muted-foreground">
                {pastedText.trim().length.toLocaleString()} characters
              </p>
            </div>

            <ModePicker mode={mode} setMode={setMode} />

            {busy ? <Progress value={progress} /> : null}

            <Button size="lg" className="w-full" disabled={busy} onClick={startFromText}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Process with Lumen
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function ModePicker({ mode, setMode }: { mode: AiMode; setMode: (value: AiMode) => void }) {
  return (
    <div className="mt-6">
      <p className="text-sm font-medium">What should Lumen do first?</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {AI_MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setMode(option.id)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-colors",
              mode === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40",
            )}
          >
            <option.icon className="h-5 w-5 text-accent" />
            <p className="mt-2 text-sm font-semibold">{option.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
