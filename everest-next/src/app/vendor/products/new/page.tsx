import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { ContentShell } from "@/components/ContentShell";

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function createProductWithAlbum(formData: FormData) {
  "use server";
  const { supabase, user } = await requireRole(["vendor", "admin"]);

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (!vendor) return;

  const name = String(formData.get("name") ?? "");
  const slug = toSlug(name);
  const basePrice = Number(formData.get("base_price") ?? 0);

  const { data: product } = await supabase
    .from("products")
    .insert({
      vendor_id: vendor.id,
      name,
      slug,
      description: String(formData.get("description") ?? ""),
      base_price: basePrice,
      dimensions_l: Number(formData.get("dimensions_l") ?? 0),
      dimensions_w: Number(formData.get("dimensions_w") ?? 0),
      dimensions_h: Number(formData.get("dimensions_h") ?? 0)
    })
    .select("id")
    .single();

  if (!product) return;

  const { data: album } = await supabase
    .from("product_albums")
    .insert({
      product_id: product.id,
      name: String(formData.get("album_name") ?? "Default Album"),
      material: String(formData.get("material") ?? "Natural Wood"),
      availability: String(formData.get("availability") ?? "made_to_order"),
      model_url: String(formData.get("model_url") ?? "")
    })
    .select("id")
    .single();

  if (!album) return;

  const imageUrls = String(formData.get("image_urls") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (imageUrls.length) {
    await supabase.from("product_album_images").insert(
      imageUrls.map((url) => ({
        album_id: album.id,
        image_url: url
      }))
    );
  }

  revalidatePath("/vendor");
}

export default async function NewProductPage() {
  await requireRole(["vendor", "admin"]);

  return (
    <ContentShell>
    <section className="space-y-6">
      <h1 className="font-display text-4xl">Create Product + Album</h1>
      <form action={createProductWithAlbum} className="card grid gap-4">
        <input className="input" name="name" placeholder="Product Name (Minimalist Oak Table)" required />
        <textarea className="input min-h-28" name="description" placeholder="Luxury story + craftsmanship details" />
        <div className="grid gap-4 md:grid-cols-4">
          <input className="input" name="base_price" type="number" placeholder="Base price" required />
          <input className="input" name="dimensions_l" type="number" placeholder="Length cm" required />
          <input className="input" name="dimensions_w" type="number" placeholder="Width cm" required />
          <input className="input" name="dimensions_h" type="number" placeholder="Height cm" required />
        </div>
        <input className="input" name="album_name" placeholder="Album name (Natural Wood)" required />
        <input className="input" name="material" placeholder="Material / Color" required />
        <select className="input" name="availability" defaultValue="made_to_order">
          <option value="ready">Ready</option>
          <option value="made_to_order">Made to Order</option>
        </select>
        <input className="input" name="model_url" placeholder="3D model URL (.glb or .gltf) from Supabase Storage" />
        <textarea
          className="input min-h-28"
          name="image_urls"
          placeholder="One image URL per line (from Supabase Storage)"
        />
        <button className="btn-primary">Publish Product</button>
      </form>
    </section>
    </ContentShell>
  );
}
