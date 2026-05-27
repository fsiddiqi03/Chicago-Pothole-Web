"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type * as MB from "mapbox-gl";
import { ChevronDown, Crosshair, MapPin, SlidersHorizontal } from "lucide-react";

import type {
  MapStatusFilter,
  PotholeFeature,
  PotholeFeatureCollection,
  PotholeFeatureProperties,
  WardFeature,
  WardFeatureCollection,
} from "@/types/map";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MapFilters, type WardOption } from "@/components/map/MapFilters";
import { PotholeDetailPanel } from "@/components/map/PotholeDetailPanel";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const CHICAGO_CENTER: [number, number] = [-87.6298, 41.8781];
const CHICAGO_ZOOM = 10.5;
const MOBILE_QUERY = "(max-width: 767px)";
const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

// Colors echo the rest of the site; amber/green are map-only status hues.
const RED = "#c8102e";
const AMBER = "#f59e0b";
const GREEN = "#10b981";
const GRAY = "#9ca3af";

const OVERLAY_CARD =
  "rounded-lg border border-neutral-300/80 bg-paper/95 shadow-[0_2px_12px_rgba(0,0,0,0.07)] backdrop-blur-sm";

/**
 * Build the "spotlight" mask: a world-covering polygon with the selected ward's
 * rings punched out as holes, so everything outside the ward reads as dimmed.
 */
function buildSpotlightMask(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const world: GeoJSON.Position[] = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ];
  const holes: GeoJSON.Position[][] =
    geometry.type === "Polygon"
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((poly) => poly[0]);

  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [world, ...holes] },
  };
}

/** Bounding box [west, south, east, north] over every coordinate in a geometry. */
function bboxOf(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): [number, number, number, number] {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  const rings =
    geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      if (lng < w) w = lng;
      if (lng > e) e = lng;
      if (lat < s) s = lat;
      if (lat > n) n = lat;
    }
  }
  return [w, s, e, n];
}

function legendEntries(status: MapStatusFilter): { color: string; label: string }[] {
  const past = { color: RED, label: "Past 7-day target" };
  const within = { color: AMBER, label: "Open, within 7 days" };
  const done = { color: GREEN, label: "Completed" };
  const canceled = { color: GRAY, label: "Canceled" };
  switch (status) {
    case "open":
      return [past, within];
    case "completed":
      return [done];
    case "canceled":
      return [canceled];
    default:
      return [past, within, done, canceled];
  }
}

export function PotholeMap() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ---- Filter state, read from the URL (the source of truth) ----------------
  const statusParam = searchParams.get("status");
  const status: MapStatusFilter =
    statusParam === "completed" ||
    statusParam === "canceled" ||
    statusParam === "all"
      ? statusParam
      : "open";
  const wardParam = searchParams.get("ward");
  const ward = wardParam && /^\d+$/.test(wardParam) ? Number(wardParam) : null;
  const potholeId = searchParams.get("pothole");

  // ---- Refs that survive re-renders -----------------------------------------
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MB.Map | null>(null);
  const wardsRef = useRef<WardFeature[]>([]);
  const lastEasedRef = useRef<string | null>(null);
  // Map listeners are bound once but must reach the latest callbacks; an effect
  // keeps this pointing at the current render's closures.
  const handlersRef = useRef<{
    openPothole: (props: PotholeFeatureProperties) => void;
    closePanel: () => void;
    expandCluster: (feature: MB.GeoJSONFeature) => void;
  }>(null!);

  // ---- React state -----------------------------------------------------------
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Surface mapbox-gl init/auth/style/WebGL errors that would otherwise leave
  // the canvas silently blank.
  const [mapError, setMapError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [features, setFeatures] = useState<PotholeFeature[]>([]);
  const [wardOptions, setWardOptions] = useState<WardOption[]>([]);
  // null = follow the CSS breakpoint default; boolean = explicit user choice.
  const [introOpen, setIntroOpen] = useState<boolean | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // The ward filter is applied client-side so changing it never refetches.
  const shown = useMemo(
    () =>
      ward == null ? features : features.filter((f) => f.properties.ward_id === ward),
    [features, ward],
  );
  const visibleCount = shown.length;
  const selected = useMemo<PotholeFeatureProperties | null>(() => {
    if (!potholeId) return null;
    return features.find((f) => f.properties.id === potholeId)?.properties ?? null;
  }, [potholeId, features]);

  // ---- URL writer ------------------------------------------------------------
  function setParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value == null) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const openPothole = (props: PotholeFeatureProperties) => {
    setParams({ pothole: props.id });
  };
  const closePanel = () => {
    if (searchParams.get("pothole")) setParams({ pothole: null });
  };
  const expandCluster = (feature: MB.GeoJSONFeature) => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("potholes") as MB.GeoJSONSource;
    const clusterId = feature.properties?.cluster_id as number;
    const center = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      map.easeTo({ center, zoom: err || zoom == null ? map.getZoom() + 2 : zoom });
    });
  };

  useEffect(() => {
    handlersRef.current = { openPothole, closePanel, expandCluster };
  });

  // ---- Initialize the map once ----------------------------------------------
  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;
    let map: MB.Map | undefined;

    (async () => {
      try {
        // Dynamic import keeps mapbox-gl (which touches `window`) out of SSR.
        // Under Turbopack's ESM interop the default export is the runtime
        // namespace; under some bundlers the module *is* the namespace, so we
        // accept either shape to stay resilient.
        const mod = (await import("mapbox-gl")) as unknown as {
          default?: typeof import("mapbox-gl").default;
        } & typeof import("mapbox-gl").default;
        const mapboxgl = mod.default ?? mod;
        if (cancelled || !containerRef.current) return;
        if (!mapboxgl?.Map) {
          setMapError("Mapbox GL failed to load (no Map constructor).");
          return;
        }
        mapboxgl.accessToken = TOKEN;

        map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: CHICAGO_CENTER,
          zoom: CHICAGO_ZOOM,
          minZoom: 8,
        });
        mapRef.current = map;

        // Surface auth/style/tile/WebGL errors that otherwise leave the canvas
        // silently blank. Only the *first* error is shown — further ones are
        // logged so we don't spam the user once something goes wrong.
        let surfaced = false;
        map.on("error", (e: { error?: Error }) => {
          const msg = e?.error?.message ?? "Unknown Mapbox error";
          if (!surfaced) {
            surfaced = true;
            setMapError(msg);
          }
          console.error("[mapbox]", e?.error ?? e);
        });

        map.on("load", () => {
          if (!map || cancelled) return;
          // Async init means the container may have been 0×0 when the Map was
          // created; explicitly resize once layout has settled so the canvas
          // actually paints. (Mapbox's ResizeObserver doesn't always fire when
          // the container started at non-zero — this is a defensive no-op.)
          try {
            map.resize();
          } catch {
            /* noop */
          }

          map.addSource("potholes", {
            type: "geojson",
            data: EMPTY_FC,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });
          map.addSource("wards", { type: "geojson", data: EMPTY_FC });
          map.addSource("ward-mask", { type: "geojson", data: EMPTY_FC });

          // Draw order: dimming mask, ward outline, then pothole points on top.
          map.addLayer({
            id: "ward-mask-fill",
            type: "fill",
            source: "ward-mask",
            paint: { "fill-color": "#0a0a0a", "fill-opacity": 0.35 },
          } as unknown as MB.LayerSpecification);

          map.addLayer({
            id: "ward-outline",
            type: "line",
            source: "wards",
            filter: ["==", ["get", "id"], -1],
            paint: { "line-color": RED, "line-width": 3 },
          } as unknown as MB.LayerSpecification);

          map.addLayer({
            id: "clusters",
            type: "circle",
            source: "potholes",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": RED,
              "circle-opacity": 0.9,
              "circle-stroke-color": "#fafaf7",
              "circle-stroke-width": 1.5,
              "circle-radius": ["step", ["get", "point_count"], 18, 25, 26, 100, 34],
            },
          } as unknown as MB.LayerSpecification);

          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "potholes",
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
            },
            paint: { "text-color": "#ffffff" },
          } as unknown as MB.LayerSpecification);

          map.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: "potholes",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-radius": 6,
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#fafaf7",
              "circle-color": [
                "case",
                ["==", ["get", "over_sla"], true],
                RED,
                ["in", ["get", "status"], ["literal", ["open", "dup_open"]]],
                AMBER,
                ["in", ["get", "status"], ["literal", ["completed", "dup_closed"]]],
                GREEN,
                GRAY,
              ],
            },
          } as unknown as MB.LayerSpecification);

          // One click handler: clusters expand, single pins open the panel,
          // empty space closes it.
          map.on("click", (e: MB.MapMouseEvent) => {
            const m = mapRef.current;
            if (!m) return;
            const feats = m.queryRenderedFeatures(e.point, {
              layers: ["clusters", "unclustered-point"],
            });
            if (feats.length === 0) {
              handlersRef.current.closePanel();
              return;
            }
            const f = feats[0];
            if (f.properties && "point_count" in f.properties) {
              handlersRef.current.expandCluster(f);
            } else if (f.properties) {
              handlersRef.current.openPothole(
                f.properties as unknown as PotholeFeatureProperties,
              );
            }
          });

          for (const layer of ["clusters", "unclustered-point"]) {
            map.on("mouseenter", layer, () => {
              if (mapRef.current) mapRef.current.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", layer, () => {
              if (mapRef.current) mapRef.current.getCanvas().style.cursor = "";
            });
          }

          setMapReady(true);
        });
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setMapError(`Map failed to initialize: ${msg}`);
          console.error("[mapbox init]", err);
        }
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current = null;
      map?.remove();
    };
  }, []);

  // ---- Fetch ward boundaries once -------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/map/wards");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as WardFeatureCollection;
        if (cancelled) return;
        wardsRef.current = data.features;
        setWardOptions(
          data.features
            .map((f) => ({ id: f.properties.id, alderman: f.properties.current_alderman }))
            .sort((a, b) => a.id - b.id),
        );
      } catch {
        // Wards are non-critical — the pothole map still works without them.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Fetch potholes whenever the status bucket changes (not on ward) ------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/map/potholes?status=${status}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as PotholeFeatureCollection;
        if (cancelled) return;
        setFeatures(data.features);
      } catch {
        if (!cancelled) {
          setFeatures([]);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, retryNonce]);

  // ---- Push the (ward-filtered) pothole set into the map source -------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource("potholes") as MB.GeoJSONSource | undefined;
    source?.setData({
      type: "FeatureCollection",
      features: shown,
    } as GeoJSON.FeatureCollection);
  }, [shown, mapReady]);

  // ---- Ward source, spotlight mask, outline, and fit ------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const wardsSource = map.getSource("wards") as MB.GeoJSONSource | undefined;
    if (wardsSource && wardsRef.current.length) {
      wardsSource.setData({
        type: "FeatureCollection",
        features: wardsRef.current,
      } as unknown as GeoJSON.FeatureCollection);
    }

    const maskSource = map.getSource("ward-mask") as MB.GeoJSONSource | undefined;
    const selectedWard =
      ward == null ? undefined : wardsRef.current.find((f) => f.properties.id === ward);

    if (selectedWard) {
      maskSource?.setData(
        buildSpotlightMask(selectedWard.geometry) as unknown as GeoJSON.FeatureCollection,
      );
      map.setFilter("ward-outline", ["==", ["get", "id"], ward] as MB.FilterSpecification);
      const [w, s, e, n] = bboxOf(selectedWard.geometry);
      map.fitBounds(
        [
          [w, s],
          [e, n],
        ],
        { padding: 80, duration: 700 },
      );
    } else {
      maskSource?.setData(EMPTY_FC);
      map.setFilter("ward-outline", ["==", ["get", "id"], -1] as MB.FilterSpecification);
    }
  }, [ward, mapReady, wardOptions]);

  // ---- Ease to a deep-linked / freshly-clicked pothole ----------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!selected) {
      lastEasedRef.current = null;
      return;
    }
    if (!map || !mapReady || lastEasedRef.current === selected.id) return;
    const feat = features.find((f) => f.properties.id === selected.id);
    if (feat) {
      map.easeTo({
        center: feat.geometry.coordinates,
        zoom: Math.max(map.getZoom(), 14),
      });
      lastEasedRef.current = selected.id;
    }
  }, [selected, mapReady, features]);

  const selectedAlderman = selected
    ? wardOptions.find((w) => w.id === selected.ward_id)?.alderman ?? null
    : null;

  const isEmpty = !loading && !error && visibleCount === 0;

  // Toggling from the CSS-managed default: read the breakpoint in the handler
  // (allowed outside render) and flip to an explicit choice.
  const toggleIntro = () =>
    setIntroOpen((prev) =>
      prev === null ? window.matchMedia(MOBILE_QUERY).matches : !prev,
    );

  if (!TOKEN) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center bg-paper px-6">
        <div className={cn(OVERLAY_CARD, "max-w-md p-8 text-center")}>
          <h1 className="font-display text-2xl text-ink">Map unavailable</h1>
          <p className="mt-3 text-sm text-neutral-500">
            The map needs a Mapbox token. Set{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> in{" "}
            <code className="font-mono text-xs">.env.local</code> and restart the dev
            server.
          </p>
        </div>
      </div>
    );
  }

  const filters = (
    <MapFilters
      wards={wardOptions}
      status={status}
      ward={ward}
      onStatusChange={(s) =>
        setParams({ status: s === "open" ? null : s, pothole: null })
      }
      onWardChange={(w) => setParams({ ward: w == null ? null : String(w) })}
    />
  );

  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden bg-paper">
      {/* Mapbox adds class `mapboxgl-map` to this div with `position: relative`,
          which overrides Tailwind's `.absolute` (same specificity, later in
          source order) and collapses `inset-0` to 0×0. Use h/w-full so the
          container fills the parent regardless of which `position` value wins. */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Indeterminate loading bar */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden transition-opacity duration-500",
          loading ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="map-loadbar h-full w-1/4 bg-chicago-red" />
      </div>

      {/* Intro overlay — top-left */}
      <div
        className={cn(
          OVERLAY_CARD,
          "absolute top-4 left-4 z-20 w-[min(360px,calc(100%-9.5rem))] overflow-hidden",
        )}
      >
        <button
          type="button"
          onClick={toggleIntro}
          aria-expanded={introOpen === null ? undefined : introOpen}
          className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left focus-visible:ring-2 focus-visible:ring-chicago-blue focus-visible:outline-none"
        >
          <span className="font-mono text-[0.65rem] tracking-[0.22em] text-chicago-red/90 uppercase">
            Every open pothole
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-neutral-400 transition-transform",
              introOpen === null
                ? "rotate-0 md:rotate-180"
                : introOpen && "rotate-180",
            )}
          />
        </button>
        <div
          className={cn(
            "px-5 pb-5",
            introOpen === null ? "hidden md:block" : introOpen ? "block" : "hidden",
          )}
        >
          <h1 className="font-display text-3xl leading-[1.05] tracking-tight text-ink">
            Chicago&apos;s open potholes
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">
            Every report currently in the city&apos;s 311 system. Filter by ward or
            status. Click a pin to see details.
          </p>
          <p
            aria-live="polite"
            className="mt-4 border-t border-neutral-300 pt-3 font-mono text-xs tracking-wide text-neutral-500"
          >
            {isEmpty ? (
              <span className="text-chicago-red">No potholes match your filters.</span>
            ) : (
              <>
                <span className="font-semibold text-ink">
                  {visibleCount.toLocaleString("en-US")}
                </span>{" "}
                visible on the map
              </>
            )}
          </p>
        </div>
      </div>

      {/* Filters — desktop card top-right */}
      <div className={cn(OVERLAY_CARD, "absolute top-4 right-4 z-20 hidden w-72 p-5 md:block")}>
        <p className="mb-4 font-mono text-[0.65rem] tracking-[0.22em] text-neutral-500 uppercase">
          Filter
        </p>
        {filters}
      </div>

      {/* Filters — mobile trigger top-right */}
      <button
        type="button"
        onClick={() => setMobileFiltersOpen(true)}
        className={cn(
          OVERLAY_CARD,
          "absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink md:hidden",
        )}
      >
        <SlidersHorizontal className="size-4" />
        Filter
      </button>

      {/* Legend — bottom-left, raised above the Mapbox logo */}
      <div className={cn(OVERLAY_CARD, "absolute bottom-11 left-4 z-20 px-4 py-3")}>
        <ul className="space-y-1.5">
          {legendEntries(status).map((entry) => (
            <li
              key={entry.label}
              className="flex items-center gap-2.5 text-xs text-neutral-600"
            >
              <span
                className="size-2.5 rounded-full ring-1 ring-black/5"
                style={{ backgroundColor: entry.color }}
              />
              {entry.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Reset view — bottom-right, raised above the attribution */}
      <button
        type="button"
        onClick={() =>
          mapRef.current?.easeTo({
            center: CHICAGO_CENTER,
            zoom: CHICAGO_ZOOM,
            bearing: 0,
            pitch: 0,
          })
        }
        className={cn(
          OVERLAY_CARD,
          "absolute right-4 bottom-11 z-20 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:text-chicago-red focus-visible:ring-2 focus-visible:ring-chicago-blue focus-visible:outline-none",
        )}
      >
        <Crosshair className="size-4" />
        Reset view
      </button>

      {/* Error toast — Mapbox init/auth/style errors take priority over the
          data-fetch error since a broken map masks the data anyway. */}
      {(mapError || error) && (
        <div
          role="alert"
          className={cn(
            OVERLAY_CARD,
            "absolute top-20 left-1/2 z-30 flex max-w-[min(640px,calc(100%-2rem))] -translate-x-1/2 items-center gap-3 px-4 py-2.5 text-sm text-ink",
          )}
        >
          <MapPin className="size-4 shrink-0 text-chicago-red" />
          <span className="min-w-0 break-words">
            {mapError ? `Map error: ${mapError}` : "Unable to load map data."}
          </span>
          {!mapError && (
            <button
              type="button"
              onClick={() => setRetryNonce((n) => n + 1)}
              className="font-medium text-chicago-red underline underline-offset-2 focus-visible:outline-none"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Mobile filter sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl bg-paper">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">Filter potholes</SheetTitle>
            <SheetDescription className="sr-only">
              Filter the map by ward and status.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-8">{filters}</div>
        </SheetContent>
      </Sheet>

      {/* Pothole detail panel */}
      <PotholeDetailPanel
        pothole={selected}
        alderman={selectedAlderman}
        open={selected != null}
        onOpenChange={(o) => {
          if (!o) closePanel();
        }}
      />
    </div>
  );
}
