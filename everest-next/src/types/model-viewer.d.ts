import type React from "react";

declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      alt?: string;
      ar?: boolean;
      "auto-rotate"?: boolean;
      "camera-controls"?: boolean;
      "shadow-intensity"?: string;
      "ios-src"?: string;
      "ar-modes"?: string;
    };
  }
}
