import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "vendor" | "client";

export async function requireRole(allowedRoles: AppRole[]) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role as AppRole)) {
    redirect("/");
  }

  return { user, role: profile.role as AppRole, supabase };
}
