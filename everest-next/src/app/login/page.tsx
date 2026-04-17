import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function signIn(formData: FormData) {
  "use server";
  const supabase = createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  await supabase.auth.signInWithPassword({ email, password });
  redirect("/");
}

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md space-y-5">
      <h1 className="font-display text-4xl">Login</h1>
      <form action={signIn} className="card grid gap-4">
        <input className="input" type="email" name="email" placeholder="you@everest.com" required />
        <input className="input" type="password" name="password" placeholder="Password" required />
        <button className="btn-primary">Sign in</button>
      </form>
    </section>
  );
}
