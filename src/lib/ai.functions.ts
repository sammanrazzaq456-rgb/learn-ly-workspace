import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const documentInput = z.object({ documentId: z.string().uuid() });

const SYSTEM = `You are Lumen, a study assistant. Answer strictly from the supplied document.
If the document does not contain the answer, say so plainly. Never invent facts, quotes or dates.`;

function gatewayError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("429")) throw new Error("Rate limit reached. Try again in a moment.");
  if (message.includes("402")) throw new Error("AI credits exhausted. Add credits to continue.");
  throw new Error(message);
}

async function loadDocument(supabase: any, documentId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, content")
    .eq("id", documentId)
    .single();
  if (error || !data) throw new Error("Document not found");
  if (!data.content?.trim()) throw new Error("This document has no readable text.");
  return data as { id: string; file_name: string; content: string };
}

async function touchHistory(supabase: any, userId: string, documentId: string, feature: string) {
  await supabase
    .from("history")
    .upsert(
      { user_id: userId, document_id: documentId, ai_feature_used: feature, last_accessed: new Date().toISOString() },
      { onConflict: "user_id,document_id,ai_feature_used" },
    );
}

/* ---------------------------------- summary --------------------------------- */

export const generateSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    documentInput.extend({ summaryType: z.enum(["short", "detailed", "chapter"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { getGateway, DEFAULT_MODEL, clampContent } = await import("@/lib/ai-gateway.server");
    const doc = await loadDocument(context.supabase, data.documentId);

    const instruction =
      data.summaryType === "short"
        ? "Write a tight summary of at most 200 words capturing only the core argument."
        : data.summaryType === "detailed"
          ? "Write a thorough summary (600-900 words) in markdown with headings and bullet points."
          : "Write a chapter-by-chapter (or section-by-section) summary in markdown, one heading per section with 2-4 bullets each.";

    try {
      const { text } = await generateText({
        model: getGateway()(DEFAULT_MODEL),
        system: SYSTEM,
        prompt: `${instruction}\n\nDocument: ${doc.file_name}\n\n${clampContent(doc.content)}`,
      });

      const wordCount = text.trim().split(/\s+/).length;
      const { data: row, error } = await context.supabase
        .from("summaries")
        .insert({
          user_id: context.userId,
          document_id: doc.id,
          summary_type: data.summaryType,
          summary_text: text,
          word_count: wordCount,
          reading_time: Math.max(1, Math.round(wordCount / 200)),
        })
        .select()
        .single();
      if (error) throw error;
      await touchHistory(context.supabase, context.userId, doc.id, "summary");
      return row;
    } catch (error) {
      gatewayError(error);
    }
  });

/* -------------------------------- explanation ------------------------------- */

export const generateExplanation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    documentInput
      .extend({
        originalText: z.string().trim().min(1).max(12000),
        level: z.enum(["beginner", "intermediate", "advanced"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { getGateway, DEFAULT_MODEL } = await import("@/lib/ai-gateway.server");
    try {
      const { output } = await generateText({
        model: getGateway()(DEFAULT_MODEL),
        system: SYSTEM,
        output: Output.object({
          schema: z.object({
            explanation: z.string(),
            terms: z.array(z.object({ term: z.string(), definition: z.string() })),
          }),
        }),
        prompt: `Explain the following passage for a ${data.level} reader, in markdown. Then list the difficult terms with short definitions.\n\nPassage:\n${data.originalText}`,
      });

      const { data: row, error } = await context.supabase
        .from("explanations")
        .insert({
          user_id: context.userId,
          document_id: data.documentId,
          original_text: data.originalText,
          explanation: output.explanation,
          difficulty_level: data.level,
          terms: output.terms,
        })
        .select()
        .single();
      if (error) throw error;
      await touchHistory(context.supabase, context.userId, data.documentId, "explain");
      return row;
    } catch (error) {
      gatewayError(error);
    }
  });

/* ------------------------------ study materials ----------------------------- */

export const generateStudyMaterials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => documentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { getGateway, DEFAULT_MODEL, clampContent } = await import("@/lib/ai-gateway.server");
    const doc = await loadDocument(context.supabase, data.documentId);

    try {
      const { output } = await generateText({
        model: getGateway()(DEFAULT_MODEL),
        system: SYSTEM,
        output: Output.object({
          schema: z.object({
            notes: z.string(),
            flashcards: z.array(z.object({ front: z.string(), back: z.string() })).min(6),
            mcqs: z
              .array(
                z.object({
                  question: z.string(),
                  options: z.array(z.string()).length(4),
                  answerIndex: z.number().int().min(0).max(3),
                  explanation: z.string(),
                }),
              )
              .min(5),
            shortQuestions: z.array(z.object({ question: z.string(), answer: z.string() })).min(4),
            longQuestions: z.array(z.object({ question: z.string(), answer: z.string() })).min(2),
          }),
        }),
        prompt: `Build study material from this document. Notes in markdown, 10 flashcards, 8 multiple-choice questions with 4 options each, 5 short questions and 3 long questions with model answers.\n\nDocument: ${doc.file_name}\n\n${clampContent(doc.content)}`,
      });

      const answerKey = {
        mcqs: output.mcqs.map((item, index) => ({
          number: index + 1,
          answer: item.options[item.answerIndex],
          explanation: item.explanation,
        })),
        short: output.shortQuestions.map((item, index) => ({ number: index + 1, answer: item.answer })),
        long: output.longQuestions.map((item, index) => ({ number: index + 1, answer: item.answer })),
      };

      const { data: row, error } = await context.supabase
        .from("study_materials")
        .insert({
          user_id: context.userId,
          document_id: doc.id,
          notes: output.notes,
          flashcards: output.flashcards,
          mcqs: output.mcqs,
          short_questions: output.shortQuestions,
          long_questions: output.longQuestions,
          answer_key: answerKey,
        })
        .select()
        .single();
      if (error) throw error;
      await touchHistory(context.supabase, context.userId, doc.id, "study");
      return row;
    } catch (error) {
      gatewayError(error);
    }
  });

/* ---------------------------------- insights -------------------------------- */

export const generateInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => documentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { getGateway, DEFAULT_MODEL, clampContent } = await import("@/lib/ai-gateway.server");
    const doc = await loadDocument(context.supabase, data.documentId);

    try {
      const { output } = await generateText({
        model: getGateway()(DEFAULT_MODEL),
        system: SYSTEM,
        output: Output.object({
          schema: z.object({
            keyIdeas: z.array(z.string()),
            importantQuotes: z.array(z.object({ quote: z.string(), context: z.string() })),
            themes: z.array(z.object({ theme: z.string(), description: z.string() })),
            definitions: z.array(z.object({ term: z.string(), definition: z.string() })),
            vocabulary: z.array(z.object({ word: z.string(), meaning: z.string() })),
            people: z.array(z.object({ name: z.string(), role: z.string() })),
            importantDates: z.array(z.object({ date: z.string(), event: z.string() })),
            timeline: z.array(z.object({ when: z.string(), what: z.string() })),
          }),
        }),
        prompt: `Extract insights from this document. Quotes must be verbatim. Leave a list empty if the document has nothing for it.\n\nDocument: ${doc.file_name}\n\n${clampContent(doc.content)}`,
      });

      const { data: row, error } = await context.supabase
        .from("insights")
        .insert({
          user_id: context.userId,
          document_id: doc.id,
          key_ideas: output.keyIdeas,
          important_quotes: output.importantQuotes,
          themes: output.themes,
          definitions: output.definitions,
          vocabulary: output.vocabulary,
          people: output.people,
          important_dates: output.importantDates,
          timeline: output.timeline,
        })
        .select()
        .single();
      if (error) throw error;
      await touchHistory(context.supabase, context.userId, doc.id, "insights");
      return row;
    } catch (error) {
      gatewayError(error);
    }
  });

/* ------------------------------------ chat ---------------------------------- */

export const askDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    documentInput.extend({ message: z.string().trim().min(1).max(2000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { getGateway, DEFAULT_MODEL, clampContent } = await import("@/lib/ai-gateway.server");
    const doc = await loadDocument(context.supabase, data.documentId);

    try {
      const { output } = await generateText({
        model: getGateway()(DEFAULT_MODEL),
        system: SYSTEM,
        output: Output.object({
          schema: z.object({
            answer: z.string(),
            sourceReference: z.string().describe("Short verbatim excerpt the answer came from, or empty"),
          }),
        }),
        prompt: `Question: ${data.message}\n\nDocument: ${doc.file_name}\n\n${clampContent(doc.content)}`,
      });

      const { data: row, error } = await context.supabase
        .from("chats")
        .insert({
          user_id: context.userId,
          document_id: doc.id,
          user_message: data.message,
          ai_response: output.answer,
          source_reference: output.sourceReference || null,
        })
        .select()
        .single();
      if (error) throw error;
      await touchHistory(context.supabase, context.userId, doc.id, "chat");
      return row;
    } catch (error) {
      gatewayError(error);
    }
  });

/* --------------------------- suggested chat questions ------------------------ */

export const suggestQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => documentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { getGateway, DEFAULT_MODEL, clampContent } = await import("@/lib/ai-gateway.server");
    const doc = await loadDocument(context.supabase, data.documentId);
    try {
      const { output } = await generateText({
        model: getGateway()(DEFAULT_MODEL),
        system: SYSTEM,
        output: Output.object({ schema: z.object({ questions: z.array(z.string()).max(4) }) }),
        prompt: `Suggest 4 short, useful questions a student might ask about this document.\n\n${clampContent(doc.content, 12000)}`,
      });
      return output.questions;
    } catch (error) {
      gatewayError(error);
    }
  });
