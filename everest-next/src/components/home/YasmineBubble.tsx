"use client";

import { useState } from "react";
import { MessageCircle, Sparkles, X } from "lucide-react";

export function YasmineBubble() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(100vw-2rem,22rem)] rounded-2xl border border-white/15 bg-charcoal/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-md">
          <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-everest to-everest-deep text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Yasmine</p>
                <p className="text-xs text-white/50">AI shopping assistant</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Hi — I can help you find the right Everest piece, compare finishes, or explain delivery. (Wire your assistant API here.)
          </p>
          <input
            type="text"
            placeholder="Ask Yasmine…"
            className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-everest focus:outline-none"
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-everest to-everest-deep text-white shadow-lg shadow-everest/30 ring-4 ring-charcoal/80 transition hover:scale-105 hover:shadow-xl"
        aria-label={open ? "Close Yasmine" : "Open Yasmine assistant"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
