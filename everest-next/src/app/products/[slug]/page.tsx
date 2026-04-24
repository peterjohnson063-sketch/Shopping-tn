import AlbumViewer from "@/components/album-viewer";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ContentShell } from "@/components/ContentShell";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, name, description, dimensions_l, dimensions_w, dimensions_h")
    .eq("slug", params.slug)
    .single();

  if (!product) notFound();

  const { data: albums } = await supabase
    .from("product_albums")
    .select("id, name, material, availability, model_url, images:product_album_images(id, image_url, alt_text)")
    .eq("product_id", product.id)
    .order("created_at", { ascending: true });

  return (
    <ContentShell>
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-5">
        <h1 className="font-display text-4xl">{product.name}</h1>
        <p className="text-zinc-600">{product.description}</p>
        <div className="card">
          <h2 className="mb-3 font-display text-2xl">Specifications</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-zinc-100">
                <td className="py-2 text-zinc-500">Length</td>
                <td className="py-2">{product.dimensions_l} cm</td>
              </tr>
              <tr className="border-b border-zinc-100">
                <td className="py-2 text-zinc-500">Width</td>
                <td className="py-2">{product.dimensions_w} cm</td>
              </tr>
              <tr>
                <td className="py-2 text-zinc-500">Height</td>
                <td className="py-2">{product.dimensions_h} cm</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <AlbumViewer albums={(albums as any[]) ?? []} />
    </div>
    </ContentShell>
  );
}
