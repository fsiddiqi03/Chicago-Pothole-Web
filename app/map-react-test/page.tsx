"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapReactTestPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState("Mounting…");
  const [kind, setKind] = useState<"info" | "ok" | "err">("info");

  useEffect(() => {
    const log = (msg: string, k: "info" | "ok" | "err" = "info") => {
      setStatus(msg);
      setKind(k);
      console.log("[react-map-test]", msg);
    };

    if (!TOKEN) {
      log("NEXT_PUBLIC_MAPBOX_TOKEN is undefined in the client bundle.", "err");
      return;
    }

    log(`Container present: ${!!containerRef.current}. Importing mapbox-gl…`);

    let cancelled = false;
    let map: { remove: () => void } | undefined;

    (async () => {
      try {
        const mod: unknown = await import("mapbox-gl");
        log(`Imported. Has .default: ${(mod as { default?: unknown }).default != null}, has .Map: ${(mod as { Map?: unknown }).Map != null}`);

        const mapboxgl =
          ((mod as { default?: { Map?: unknown; accessToken?: string } }).default ??
            (mod as { Map?: unknown; accessToken?: string })) as {
            Map: new (opts: object) => {
              on: (
                evt: string,
                cb: (e?: { error?: { message?: string } }) => void,
              ) => void;
              remove: () => void;
            };
            accessToken: string;
          };

        if (cancelled) return;
        if (!mapboxgl?.Map) {
          log("mapbox-gl resolved but has no Map constructor.", "err");
          return;
        }
        if (!containerRef.current) {
          log("Container ref is null at construction time.", "err");
          return;
        }

        mapboxgl.accessToken = TOKEN;
        log("Constructing Map…");

        const m = new mapboxgl.Map({
          container: containerRef.current,
          center: [-87.6298, 41.8781],
          zoom: 10,
        });
        map = m;
        log("Map constructed. Waiting for load…");

        m.on("load", () => log("✓ Map loaded — Chicago should be visible.", "ok"));
        m.on("error", (e?: { error?: { message?: string } }) => {
          const msg = e?.error?.message ?? "Unknown mapbox error";
          log("Mapbox error event: " + msg, "err");
          console.error("[react-map-test] error event", e);
        });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        log("Threw: " + msg, "err");
        console.error("[react-map-test] threw", err);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100dvh" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 10,
          maxWidth: "min(640px, calc(100% - 16px))",
          padding: "10px 12px",
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.4,
          whiteSpace: "pre-wrap",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          background:
            kind === "err"
              ? "#fee"
              : kind === "ok"
                ? "#e9f7ec"
                : "rgba(255,255,255,0.95)",
          color: kind === "err" ? "#900" : kind === "ok" ? "#1f5132" : "#111",
        }}
      >
        {status}
      </div>
    </div>
  );
}
