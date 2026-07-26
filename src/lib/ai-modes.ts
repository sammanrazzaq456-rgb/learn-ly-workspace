import { Brain, Lightbulb, MessagesSquare, ScrollText, Sparkles } from "lucide-react";

export type AiMode = "summary" | "explain" | "study" | "chat" | "insights";

export const AI_MODES = [
  {
    id: "summary" as const,
    label: "Summarise",
    description: "Short, detailed or chapter-wise summaries",
    icon: ScrollText,
  },
  {
    id: "study" as const,
    label: "Study mode",
    description: "Notes, flashcards, MCQs and questions",
    icon: Brain,
  },
  {
    id: "insights" as const,
    label: "Extract insights",
    description: "Key ideas, quotes, people, timeline",
    icon: Sparkles,
  },
  {
    id: "explain" as const,
    label: "Explain mode",
    description: "Break down difficult passages",
    icon: Lightbulb,
  },
  {
    id: "chat" as const,
    label: "Chat",
    description: "Ask questions about the document",
    icon: MessagesSquare,
  },
];

export const AI_MODE_LABEL: Record<AiMode, string> = {
  summary: "Summary",
  explain: "Explain mode",
  study: "Study mode",
  chat: "Chat",
  insights: "Insights",
};
