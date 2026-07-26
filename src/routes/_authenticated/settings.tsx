import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Lumen" },
      { name: "description", content: "Profile, appearance, AI model, notifications and privacy." },
      { property: "og:title", content: "Settings — Lumen" },
      {
        property: "og:description",
        content: "Profile, appearance, AI model, notifications and privacy.",
      },
    ],
  }),
  component: Settings,
});

const MODELS = [
  { value: "google/gemini-3.6-flash", label: "Lumen Fast — balanced, best for most work" },
  { value: "google/gemini-2.5-pro", label: "Lumen Deep — slower, strongest reasoning" },
  { value: "google/gemini-2.5-flash-lite", label: "Lumen Lite — quickest, simple documents" },
];

const LANGUAGES = ["English", "Español", "Français", "Deutsch", "हिन्दी", "العربية"];

function Settings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const removeAccount = useServerFn(deleteMyAccount);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [aiModel, setAiModel] = useState(MODELS[0].value);
  const [language, setLanguage] = useState("English");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [saveHistory, setSaveHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const [profile, settings, user] = await Promise.all([
        supabase.from("profiles").select("*").maybeSingle(),
        supabase.from("user_settings").select("*").maybeSingle(),
        supabase.auth.getUser(),
      ]);
      return {
        profile: profile.data,
        settings: settings.data,
        email: user.data.user?.email ?? "",
      };
    },
  });

  useEffect(() => {
    if (!data) return;
    setFullName(data.profile?.full_name ?? "");
    setEmail(data.email);
    if (data.settings) {
      setAiModel(data.settings.ai_model || MODELS[0].value);
      setLanguage(data.settings.language || "English");
      setEmailNotifications(data.settings.email_notifications);
      setStudyReminders(data.settings.study_reminders);
      setSaveHistory(data.settings.save_history);
    }
  }, [data]);

  async function save() {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Session expired");

      const [profileResult, settingsResult] = await Promise.all([
        supabase
          .from("profiles")
          .upsert({ id: userId, full_name: fullName.trim().slice(0, 100), email }),
        supabase.from("user_settings").upsert({
          user_id: userId,
          ai_model: aiModel,
          language,
          email_notifications: emailNotifications,
          study_reminders: studyReminders,
          save_history: saveHistory,
          theme,
          updated_at: new Date().toISOString(),
        }),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (settingsResult.error) throw settingsResult.error;

      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (
      !window.confirm(
        "Delete your account? Every document, summary and study set will be permanently removed.",
      )
    )
      return;
    setDeleting(true);
    try {
      await removeAccount();
      await supabase.auth.signOut();
      queryClient.clear();
      toast.success("Your account has been deleted");
      navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete your account");
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Settings" description="Profile, appearance, AI and privacy">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>How you appear inside Lumen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={fullName}
                maxLength={100}
                disabled={isLoading}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled />
              <p className="text-xs text-muted-foreground">
                Contact support to change your sign-in email.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance &amp; language</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row label="Dark mode" description="Use the dark scholarly theme.">
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(value) => setTheme(value ? "dark" : "light")}
              />
            </Row>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Lumen will respond in this language where possible.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI model</CardTitle>
            <CardDescription>Pick the balance of speed and depth you prefer.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row label="Email notifications" description="Product news and account emails.">
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </Row>
            <Row label="Study reminders" description="Nudges to keep your streak alive.">
              <Switch checked={studyReminders} onCheckedChange={setStudyReminders} />
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row label="Save history" description="Keep a record of documents and AI activity.">
              <Switch checked={saveHistory} onCheckedChange={setSaveHistory} />
            </Row>
            <p className="text-xs text-muted-foreground">
              Your documents are private to your account and never used to train models.
            </p>
          </CardContent>
        </Card>

        <Button onClick={save} disabled={saving || isLoading} size="lg" className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </Button>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <ShieldAlert className="h-4 w-4" /> Delete account
            </CardTitle>
            <CardDescription>
              Permanently removes your account, documents and everything Lumen generated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={deleteAccount} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Delete my account
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
