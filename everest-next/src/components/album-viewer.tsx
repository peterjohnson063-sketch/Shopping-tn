"use client";

import { useMemo, useState } from "react";

type Album = {
  id: string;
  name: string;
  material: string;
  availability: "ready" | "made_to_order";
  model_url: string | null;
  images: { id: string; image_url: string; alt_text: string | null }[];
};

export default function AlbumViewer({ albums }: { albums: Album[] }) {
  const [activeAlbumId, setActiveAlbumId] = useState(albums[0]?.id);
  const current = useMemo(() => albums.find((a) => a.id === activeAlbumId) ?? albums[0], [albums, activeAlbumId]);

  if (!current) return <p className="text-sm text-zinc-500">No variation album uploaded yet.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {albums.map((album) => (
          <button
            key={album.id}
            className={album.id === current.id ? "btn-primary" : "btn-light"}
            onClick={() => setActiveAlbumId(album.id)}
          >
            {album.name}
          </button>
        ))}
      </div>

      <div className="card">
        <p className="mb-4 text-sm text-zinc-500">
          Material: {current.material} | Availability:{" "}
          {current.availability === "ready" ? "Ready Stock" : "Made to Order"}
        </p>
        {current.model_url ? (
          <model-viewer
            src={current.model_url}
            ar
            auto-rotate
            camera-controls
            shadow-intensity="1"
            className="h-[420px] w-full rounded-2xl bg-zinc-100"
          />
        ) : (
          <div className="flex h-[420px] items-center justify-center rounded-2xl bg-zinc-100 text-sm text-zinc-500">
            No 3D model for this variation.
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {current.images.map((img) => (
          <img
            key={img.id}
            src={img.image_url}
            alt={img.alt_text ?? current.name}
            className="h-56 w-full rounded-xl object-cover"
          />
        ))}
      </div>
    </div>
  );
}
