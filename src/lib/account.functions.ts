import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Deletes the signed-in user's stored files, rows and auth account. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: files } = await supabaseAdmin.storage.from("documents").list(userId);
    if (files && files.length > 0) {
      await supabaseAdmin.storage
        .from("documents")
        .remove(files.map((file) => `${userId}/${file.name}`));
    }

    await supabaseAdmin.from("documents").delete().eq("user_id", userId);
    await supabaseAdmin.from("study_progress").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_settings").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
