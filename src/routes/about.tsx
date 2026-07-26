import { createFileRoute, Link } from "@tanstack/react-router";
import { Cpu, Heart, Mail, Map } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Lumen — our mission and technology" },
      {
        name: "description",
        content:
          "Why we built Lumen, the technology behind it, what's on the roadmap and how to reach us.",
      },
      { property: "og:title", content: "About Lumen — our mission and technology" },
      {
        property: "og:description",
        content:
          "Why we built Lumen, the technology behind it, what's on the roadmap and how to reach us.",
      },
    ],
  }),
  component: About,
});

const roadmap = [
  { when: "Now", what: "Summaries, explain mode, study mode, chat, insights and history." },
  { when: "Next", what: "Shared study sets, spaced repetition scheduling and audio recaps." },
  { when: "Later", what: "Course-level workspaces, citations across documents and mobile apps." },
];

function About() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About Lumen</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Lumen is an AI study companion for people who have more reading than time. Upload a
          document and it becomes something you can actually study from.
        </p>

        <section className="mt-14">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Heart className="h-5 w-5 text-accent" /> Our mission
          </h2>
          <p className="mt-3 text-muted-foreground">
            Understanding shouldn't depend on how fast you can read. We want every student,
            researcher and professional to get to the ideas in a document quickly, then have the
            tools to remember them — summaries to orient, explanations to unblock, and practice
            material to make it stick.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Cpu className="h-5 w-5 text-accent" /> The technology
          </h2>
          <p className="mt-3 text-muted-foreground">
            Documents are parsed in your browser, stored privately against your account, and passed
            to frontier language models that are prompted to answer strictly from your material.
            Every generated artefact — summary, explanation, flashcard set, chat answer — is saved
            so you can revisit or regenerate it. Your files are readable only by you and can be
            deleted at any time.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Map className="h-5 w-5 text-accent" /> Roadmap
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {roadmap.map((item) => (
              <Card key={item.when}>
                <CardContent className="pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {item.when}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.what}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Mail className="h-5 w-5 text-accent" /> Contact
          </h2>
          <p className="mt-3 text-muted-foreground">
            Questions, bugs or feature requests: email{" "}
            <a className="font-medium text-primary hover:underline" href="mailto:hello@lumen.study">
              hello@lumen.study
            </a>
            . We read everything.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get Started
            </Link>
          </Button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
