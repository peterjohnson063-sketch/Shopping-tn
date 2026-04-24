import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { ContentShell } from "@/components/ContentShell";

const SAHEL_REGIONS = ["Tripoli", "Benghazi", "Misrata", "Zliten", "Sirte", "Ajdabiya", "Sebha"];

async function createVendor(formData: FormData) {
  "use server";
  const { supabase } = await requireRole(["admin"]);

  const payload = {
    company_name: String(formData.get("company_name") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim(),
    specialist_type: String(formData.get("specialist_type") ?? "").trim(),
    account_status: String(formData.get("account_status") ?? "active").trim(),
    owner_user_id: String(formData.get("owner_user_id") ?? "").trim() || null
  };

  if (!payload.company_name || !payload.location || !payload.specialist_type) return;
  await supabase.from("vendors").insert(payload);
  revalidatePath("/admin/vendors");
}

export default async function AdminVendorsPage() {
  const { supabase } = await requireRole(["admin"]);
  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, company_name, location, specialist_type, account_status, created_at")
    .order("created_at", { ascending: false });

  return (
    <ContentShell>
    <section className="space-y-6">
      <h1 className="font-display text-4xl">Vendor Management</h1>
      <form action={createVendor} className="card grid gap-4 md:grid-cols-2">
        <input className="input" name="company_name" placeholder="Company Name" required />
        <select className="input" name="location" required>
          {SAHEL_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input className="input" name="specialist_type" placeholder="Specialist Type (Najjar, Upholstery...)" required />
        <select className="input" name="account_status" defaultValue="active">
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="onboarding">Onboarding</option>
        </select>
        <input className="input md:col-span-2" name="owner_user_id" placeholder="Optional Supabase user id for vendor login" />
        <button className="btn-primary md:col-span-2">Create Vendor</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-500">
            <tr>
              <th className="pb-3">Company</th>
              <th className="pb-3">Location</th>
              <th className="pb-3">Specialist</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(vendors ?? []).map((v) => (
              <tr key={v.id} className="border-t border-zinc-100">
                <td className="py-3">{v.company_name}</td>
                <td className="py-3">{v.location}</td>
                <td className="py-3">{v.specialist_type}</td>
                <td className="py-3 capitalize">{v.account_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
    </ContentShell>
  );
}
