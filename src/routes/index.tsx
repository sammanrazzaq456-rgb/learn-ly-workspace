import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  Highlighter,
  Layers,
  MessageSquareText,
  Quote,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — Turn any document into study material" },
      {
        name: "description",
        content:
          "Upload a PDF, DOCX or notes and get AI summaries, explanations, flashcards, quizzes and answers in seconds.",
      },
      { property: "og:title", content: "Lumen — Turn any document into study material" },
      {
        property: "og:description",
        content:
          "Upload a PDF, DOCX or notes and get AI summaries, explanations, flashcards, quizzes and answers in seconds.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: FileText,
    title: "Instant summaries",
    body: "Short, detailed or chapter-wise summaries with reading time and word count.",
  },
  {
    icon: Highlighter,
    title: "Explain mode",
    body: "Side-by-side original text and a beginner, intermediate or advanced explanation.",
  },
  {
    icon: Layers,
    title: "Study mode",
    body: "Notes, flashcards, MCQs, short and long questions with a full answer key.",
  },
  {
    icon: MessageSquareText,
    title: "Chat with your document",
    body: "Ask anything and get answers grounded in the pages you uploaded.",
  },
  {
    icon: Brain,
    title: "Extract insights",
    body: "Key ideas, quotes, themes, vocabulary, people and a timeline of dates.",
  },
  {
    icon: BookOpen,
    title: "Everything saved",
    body: "A searchable history of every upload and every AI mode you used.",
  },
];

const steps = [
  {
    icon: Upload,
    title: "Upload or paste",
    body: "Drop a PDF, DOCX or TXT file — or paste raw text straight into the workspace.",
  },
  {
    icon: Wand2,
    title: "Pick an AI mode",
    body: "Summarise, explain, generate study material, extract insights or just start chatting.",
  },
  {
    icon: Sparkles,
    title: "Study and revise",
    body: "Copy, download, regenerate and come back later — your library keeps everything.",
  },
];

const testimonials = [
  {
    quote:
      "I turned a 240-page pharmacology PDF into flashcards over one coffee. My revision time halved.",
    name: "Aisha R.",
    role: "Medical student",
  },
  {
    quote:
      "Explain mode is the killer feature. Beginner level for the first pass, advanced before the exam.",
    name: "Tomás L.",
    role: "Engineering undergrad",
  },
  {
    quote:
      "I use it for case law. Chat with the document finds the paragraph I half-remember every time.",
    name: "Priya M.",
    role: "Law trainee",
  },
];

const faqs = [
  {
    q: "Which file types can I upload?",
    a: "PDF, DOCX and TXT files up to 20 MB, or paste text directly if you do not have a file.",
  },
  {
    q: "Do I need my own AI key?",
    a: "No. Lumen ships with AI built in — create an account and start processing documents immediately.",
  },
  {
    q: "Is my material private?",
    a: "Yes. Documents are tied to your account and only readable by you. You can delete any document or your whole account at any time.",
  },
  {
    q: "Can I export what Lumen generates?",
    a: "Summaries, study material and insights can be copied or downloaded as text files, and your history can be exported as CSV.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="surface-grain relative overflow-hidden border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                AI study companion
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
                Turn any document into
                <span className="text-primary"> study material</span> you actually use.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                Upload a PDF, DOCX or paste your notes. Lumen writes the summary, explains the hard
                parts, builds flashcards and quizzes, and answers your questions — all grounded in
                your own material.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth" search={{ mode: "signin" }}>
                    Sign In
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Free to start · No credit card · PDF, DOCX, TXT
              </p>
            </div>

            <div className="glass-card rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 text-primary" />
                organic-chemistry-ch4.pdf
              </div>
              <div className="mt-4 space-y-3">
                {["Summary generated", "12 flashcards ready", "8 MCQs with answer key"].map(
                  (line) => (
                    <div
                      key={line}
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-foreground">{line}</span>
                      <span className="text-xs text-accent-foreground/70">done</span>
                    </div>
                  ),
                )}
              </div>
              <div className="mt-5 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
                <p className="font-medium">“Why is the SN2 reaction stereospecific?”</p>
                <p className="mt-2 text-muted-foreground">
                  Because the nucleophile attacks from the side opposite the leaving group,
                  inverting configuration at the carbon centre — see page 74.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Six ways to work through a document
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every mode reads the document you uploaded — no generic answers, no hallucinated
            syllabus.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/70 transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <feature.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How it works</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                    <step.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Students using Lumen</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <Card key={item.name} className="border-border/70">
                <CardContent className="pt-6">
                  <Quote className="h-6 w-6 text-accent" />
                  <p className="mt-4 text-sm leading-relaxed text-foreground">{item.quote}</p>
                  <p className="mt-5 text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="mt-8">
              {faqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Your next study session starts with one upload.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/about">Learn more</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
