import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type * as GeoJSON from "geojson";
import { WORLD_AIRPORTS, SAMPLE_ROUTES, type WorldAirport } from "../map/airportsData.ts";
import {
  AIRPORT_PLANS,
  INNSBRUCK_PLAN,
  type AirportDetailedPlan,
} from "../map/airportLayouts.ts";

export type BaseMapStyle = "night" | "dark" | "satellite" | "osm";

export default function WorldMapScreen() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  const [currentStyle, setCurrentStyle] = useState<BaseMapStyle>("night");
  const [is3DMode, setIs3DMode] = useState(true);
  const [selectedAirport, setSelectedAirport] = useState<WorldAirport | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<AirportDetailedPlan | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Convert airports to GeoJSON FeatureCollection
  const airportsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
    type: "FeatureCollection",
    features: WORLD_AIRPORTS.map((apt) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [apt.lon, apt.lat],
      },
      properties: {
        id: apt.id,
        iata: apt.iata,
        icao: apt.icao,
        name: apt.name,
        city: apt.city,
        country: apt.country,
        runwayLengthM: apt.runwayLengthM,
        elevationFt: apt.elevationFt,
        passengerDemandIndex: apt.passengerDemandIndex,
        formattedBadge: apt.formattedBadge,
        isHub: apt.isHub ? 1 : 0,
      },
    })),
  };

  // Convert ODbL airport plan polygons (runways, taxiways, aprons, terminals) to GeoJSON
  const airportPlansRunwaysGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
    type: "FeatureCollection",
    features: AIRPORT_PLANS.flatMap((plan) =>
      plan.runways.map((rwy) => ({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [rwy.polygonCoordinates as [number, number][]],
        },
        properties: {
          airportIata: plan.iata,
          name: rwy.name,
          surface: rwy.surface,
          lengthM: rwy.lengthM,
          widthM: rwy.widthM,
          threshold1: rwy.threshold1,
          threshold2: rwy.threshold2,
        },
      }))
    ),
  };

  const airportPlansCenterlinesGeoJSON: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
    type: "FeatureCollection",
    features: [
      ...AIRPORT_PLANS.flatMap((plan) =>
        plan.runways.map((rwy) => ({
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: rwy.centerlineCoordinates as [number, number][],
          },
          properties: {
            type: "runway-centerline",
            name: rwy.name,
          },
        }))
      ),
      ...AIRPORT_PLANS.flatMap((plan) =>
        plan.taxiways.map((twy) => ({
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: twy.centerline as [number, number][],
          },
          properties: {
            type: "taxiway",
            name: twy.name,
          },
        }))
      ),
    ],
  };

  const airportBuildingsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
    type: "FeatureCollection",
    features: AIRPORT_PLANS.flatMap((plan) =>
      plan.buildingsAndAprons.map((b) => ({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [b.polygon as [number, number][]],
        },
        properties: {
          airportIata: plan.iata,
          type: b.type,
          name: b.name,
        },
      }))
    ),
  };

  // Inn River Polygon in Innsbruck valley (from OpenStreetMap)
  const innRiverGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [11.320, 47.258],
              [11.332, 47.256],
              [11.345, 47.255],
              [11.360, 47.259],
              [11.370, 47.264],
              [11.372, 47.266],
              [11.368, 47.266],
              [11.358, 47.261],
              [11.344, 47.257],
              [11.331, 47.258],
              [11.320, 47.260],
              [11.320, 47.258],
            ],
          ],
        },
        properties: {
          name: "Inn River",
        },
      },
    ],
  };

  // Sample Air Routes (FRA -> PRG, PRG -> ZRH) as shown in video
  const routesGeoJSON: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
    type: "FeatureCollection",
    features: SAMPLE_ROUTES.map((route) => {
      const fromApt = WORLD_AIRPORTS.find((a) => a.iata === route.fromIata);
      const toApt = WORLD_AIRPORTS.find((a) => a.iata === route.toIata);
      if (!fromApt || !toApt) return null;
      return {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [fromApt.lon, fromApt.lat],
            [toApt.lon, toApt.lat],
          ],
        },
        properties: {
          id: route.id,
          distanceKm: route.distanceKm,
        },
      };
    }).filter((f): f is GeoJSON.Feature<GeoJSON.LineString> => f !== null),
  };

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Base style specification
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          // 1. CartoDB Dark Matter (Streets, highways, rivers, urban contours)
          "carto-dark-source": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors, © CartoDB, © Overture Maps",
          },
          // 2. NASA GIBS Black Marble (Earth at Night orbital satellite)
          "nasa-night-source": {
            type: "raster",
            tiles: [
              "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            maxzoom: 8,
            attribution: "NASA GIBS / VIIRS Earth at Night",
          },
          // 3. ESRI Satellite
          "esri-satellite-source": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "© Esri, Maxar, Earthstar Geographics",
          },
          // 4. OpenStreetMap Standard
          "osm-source": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
          // 5. Mapzen / AWS Terrarium Elevation DEM for 3D Terrain
          "mapzen-terrain-dem": {
            type: "raster-dem",
            tiles: [
              "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
            ],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 15,
            attribution: "Mapzen / Nextzen Terrain",
          },
        },
        layers: [
          // Base raster layer (Carto Dark)
          {
            id: "base-carto-dark",
            type: "raster",
            source: "carto-dark-source",
            layout: { visibility: "visible" },
          },
          // Night lights layer (blended on top at low zoom)
          {
            id: "base-nasa-night",
            type: "raster",
            source: "nasa-night-source",
            layout: { visibility: "visible" },
            paint: {
              "raster-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                1,
                0.9,
                6,
                0.6,
                9,
                0.0,
              ],
            },
          },
          // Satellite layer (initially hidden)
          {
            id: "base-satellite",
            type: "raster",
            source: "esri-satellite-source",
            layout: { visibility: "none" },
          },
          // OSM layer (initially hidden)
          {
            id: "base-osm",
            type: "raster",
            source: "osm-source",
            layout: { visibility: "none" },
          },
        ],
        sky: {
          "atmosphere-blend": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            5,
            0.8,
            7,
            0,
          ],
        },
      },
      // Center on Europe / Central Alps initially, matching video
      center: [11.3439, 47.2602],
      zoom: 3.8,
      pitch: 0,
      bearing: 0,
      maxPitch: 85,
    });

    mapInstanceRef.current = map;

    // Controls matching the video:
    // 1. GlobeControl (toggles 3D globe vs 2D Mercator)
    map.addControl(new maplibregl.GlobeControl(), "top-right");

    // 2. NavigationControl (Zoom +, Zoom -, and Compass Reset)
    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showCompass: true,
        showZoom: true,
      }),
      "top-right"
    );

    // 3. FullscreenControl
    map.addControl(new maplibregl.FullscreenControl(), "top-right");

    map.on("load", () => {
      // Set initial 3D Globe projection
      map.setProjection({ type: "globe" });

      // Enable 3D Alpine Terrain from Mapzen Terrarium
      try {
        map.setTerrain({
          source: "mapzen-terrain-dem",
          exaggeration: 1.4,
        });
      } catch (err) {
        console.warn("Terrain activation notice:", err);
      }

      // --- Add ODbL Inn River Layer ---
      map.addSource("inn-river-source", {
        type: "geojson",
        data: innRiverGeoJSON,
      });
      map.addLayer({
        id: "inn-river-layer",
        type: "fill",
        source: "inn-river-source",
        minzoom: 11,
        paint: {
          "fill-color": "#1e3a8a",
          "fill-opacity": 0.85,
        },
      });

      // --- Add ODbL Airport Plans (Runways, Taxiways, Aprons, Terminals) ---
      map.addSource("airport-runways-source", {
        type: "geojson",
        data: airportPlansRunwaysGeoJSON,
      });
      map.addLayer({
        id: "airport-runways-layer",
        type: "fill",
        source: "airport-runways-source",
        minzoom: 11,
        paint: {
          "fill-color": "#18181b", // Dark asphalt tarmac
          "fill-opacity": 0.95,
        },
      });
      map.addLayer({
        id: "airport-runways-outline",
        type: "line",
        source: "airport-runways-source",
        minzoom: 11,
        paint: {
          "line-color": "#71717a",
          "line-width": 2,
        },
      });

      // Taxiways & Centerlines
      map.addSource("airport-centerlines-source", {
        type: "geojson",
        data: airportPlansCenterlinesGeoJSON,
      });
      map.addLayer({
        id: "airport-centerlines-layer",
        type: "line",
        source: "airport-centerlines-source",
        minzoom: 11,
        paint: {
          "line-color": [
            "match",
            ["get", "type"],
            "runway-centerline",
            "#ffffff",
            "#fbbf24", // Taxiway yellow
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            11,
            1.5,
            16,
            4,
          ],
          "line-dasharray": [
            "match",
            ["get", "type"],
            "runway-centerline",
            ["literal", [6, 4]],
            ["literal", [1]],
          ],
        },
      });

      // Aprons & Terminals
      map.addSource("airport-buildings-source", {
        type: "geojson",
        data: airportBuildingsGeoJSON,
      });
      map.addLayer({
        id: "airport-buildings-layer",
        type: "fill",
        source: "airport-buildings-source",
        minzoom: 11,
        paint: {
          "fill-color": [
            "match",
            ["get", "type"],
            "apron",
            "#27272a",
            "terminal",
            "#3b82f6",
            "#475569",
          ],
          "fill-opacity": 0.85,
        },
      });
      map.addLayer({
        id: "airport-buildings-outline",
        type: "line",
        source: "airport-buildings-source",
        minzoom: 11,
        paint: {
          "line-color": "#94a3b8",
          "line-width": 1.5,
        },
      });

      // --- Add Sample Flight Routes (Great Circle Arcs) ---
      map.addSource("routes-source", {
        type: "geojson",
        data: routesGeoJSON,
      });
      map.addLayer({
        id: "routes-layer",
        type: "line",
        source: "routes-source",
        paint: {
          "line-color": "#38bdf8",
          "line-width": 2,
          "line-opacity": 0.75,
        },
      });

      // --- Add OurAirports & Wikidata Markers & Badges ---
      map.addSource("airports-source", {
        type: "geojson",
        data: airportsGeoJSON,
      });

      // Airport dot/pin
      map.addLayer({
        id: "airports-pins",
        type: "circle",
        source: "airports-source",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            3.5,
            6,
            5,
            12,
            8,
          ],
          "circle-color": [
            "match",
            ["get", "isHub"],
            1,
            "#f59e0b", // Gold for hubs
            "#38bdf8", // Cyan for regional
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });

      // Airport Badge Label (Formatted exactly like video: e.g. "PRG 1 319", "FRA Frankfurt am Main 1 551", "INN Innsbruck Airport")
      map.addLayer({
        id: "airports-labels",
        type: "symbol",
        source: "airports-source",
        layout: {
          "text-field": ["get", "formattedBadge"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            10,
            6,
            11,
            11,
            13,
            14,
            14,
          ],
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#091220",
          "text-halo-width": 2.5,
        },
      });

      // Click on airport pin -> Inspector
      map.on("click", "airports-pins", (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const props = feat.properties as unknown as WorldAirport;
        setSelectedAirport(props);
        const plan = AIRPORT_PLANS.find((p) => p.iata === props.iata);
        setSelectedPlan(plan || null);
      });

      // Cursor change on hover
      map.on("mouseenter", "airports-pins", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "airports-pins", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
    };
  }, []);

  // Handle Layer Style Changes
  const handleSetBaseStyle = (style: BaseMapStyle) => {
    setCurrentStyle(style);
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    map.setLayoutProperty(
      "base-carto-dark",
      "visibility",
      style === "dark" || style === "night" ? "visible" : "none"
    );
    map.setLayoutProperty(
      "base-nasa-night",
      "visibility",
      style === "night" ? "visible" : "none"
    );
    map.setLayoutProperty(
      "base-satellite",
      "visibility",
      style === "satellite" ? "visible" : "none"
    );
    map.setLayoutProperty(
      "base-osm",
      "visibility",
      style === "osm" ? "visible" : "none"
    );
  };

  // Toggle 3D Globe Projection
  const handleToggle3D = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const nextState = !is3DMode;
    setIs3DMode(nextState);
    map.setProjection({ type: nextState ? "globe" : "mercator" });
  };

  // Fly directly to video showcase: INN Innsbruck Airport
  const handleFlyToInnsbruckVideoView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setSelectedAirport(
      WORLD_AIRPORTS.find((a) => a.iata === "INN") || null
    );
    setSelectedPlan(INNSBRUCK_PLAN);

    // Exact camera angle matching video at frames 00:12 - 00:18
    map.flyTo({
      center: [11.3439, 47.2602],
      zoom: 14.8,
      pitch: 42,
      bearing: 78,
      speed: 1.2,
      curve: 1.42,
      essential: true,
    });
  };

  // Fly to airport
  const handleFlyToAirport = (apt: WorldAirport) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setSelectedAirport(apt);
    const plan = AIRPORT_PLANS.find((p) => p.iata === apt.iata);
    setSelectedPlan(plan || null);

    map.flyTo({
      center: [apt.lon, apt.lat],
      zoom: plan ? 14.5 : 11,
      pitch: plan ? 38 : 20,
      bearing: 0,
      speed: 1.2,
      essential: true,
    });
  };

  // Filter airports for quick search
  const filteredAirports = searchQuery.trim()
    ? WORLD_AIRPORTS.filter(
        (a) =>
          a.iata.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="world-map-screen maplibre-container-screen">
      {/* MapLibre WebGL Canvas Element */}
      <div ref={mapContainerRef} className="maplibre-viewport" />

      {/* Top HUD Header with Quick Airport Bar */}
      <div className="map-hud-header">
        <div className="hud-badge">
          <span className="hud-icon">◎</span>
          <div>
            <span className="hud-title">Aviation World Map & Airport Plans</span>
            <span className="hud-subtitle">
              OpenStreetMap • Protomaps • Overture • OurAirports • Mapzen DEM
            </span>
          </div>
        </div>

        {/* Quick Fly-To Showcase Bar */}
        <div className="video-presets-bar">
          <button
            type="button"
            className="video-demo-btn"
            onClick={handleFlyToInnsbruckVideoView}
            title="Fly into Innsbruck Airport (video demonstration)"
          >
            🎯 INN Innsbruck (Video View)
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => {
              const p = WORLD_AIRPORTS.find((a) => a.iata === "PRG");
              if (p) handleFlyToAirport(p);
            }}
          >
            PRG Prague
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => {
              const f = WORLD_AIRPORTS.find((a) => a.iata === "FRA");
              if (f) handleFlyToAirport(f);
            }}
          >
            FRA Frankfurt
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => {
              const z = WORLD_AIRPORTS.find((a) => a.iata === "ZRH");
              if (z) handleFlyToAirport(z);
            }}
          >
            ZRH Zürich
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => {
              const m = WORLD_AIRPORTS.find((a) => a.iata === "MUC");
              if (m) handleFlyToAirport(m);
            }}
          >
            MUC Munich
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => {
              const j = WORLD_AIRPORTS.find((a) => a.iata === "JFK");
              if (j) handleFlyToAirport(j);
            }}
          >
            JFK New York
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => {
              const h = WORLD_AIRPORTS.find((a) => a.iata === "HND");
              if (h) handleFlyToAirport(h);
            }}
          >
            HND Tokyo
          </button>
        </div>

        {/* Search input */}
        <div className="airport-quick-search">
          <input
            type="text"
            className="search-input"
            placeholder="Search airport (INN, PRG, FRA, ZRH, LHR, JFK...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {filteredAirports.length > 0 && (
            <div className="search-dropdown">
              {filteredAirports.slice(0, 6).map((apt) => (
                <button
                  key={apt.id}
                  type="button"
                  className="search-result-item"
                  onClick={() => {
                    handleFlyToAirport(apt);
                    setSearchQuery("");
                  }}
                >
                  <span className="res-iata">{apt.iata}</span>
                  <span className="res-badge">{apt.formattedBadge}</span>
                  <span className="res-name">
                    {apt.city}, {apt.country}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Left Legend Button (Exact Match to Video: [ℹ Legenda]) */}
      <div className="map-bottom-left-legend">
        <button
          type="button"
          className="legend-toggle-btn"
          onClick={() => setShowLegend(!showLegend)}
        >
          ℹ Legenda
        </button>
      </div>

      {/* Legend Modal / Drawer */}
      {showLegend && (
        <div className="map-legend-drawer panel">
          <div className="legend-head">
            <h3>Legenda & Mapové podklady</h3>
            <button
              type="button"
              className="close-btn"
              onClick={() => setShowLegend(false)}
            >
              ✕
            </button>
          </div>

          <div className="legend-content">
            <div className="legend-section">
              <h4>Označení letišť (OurAirports & Wikidata)</h4>
              <div className="legend-item">
                <span className="dot gold-dot" />
                <span>
                  <strong>Hlavní mezinárodní hub</strong> (PRG, FRA, CDG, ZRH, DXB, JFK...)
                </span>
              </div>
              <div className="legend-item">
                <span className="dot cyan-dot" />
                <span>
                  <strong>Regionální letiště</strong> (INN Innsbruck, SZG Salzburg, LNZ...)
                </span>
              </div>
              <div className="legend-item">
                <span className="label-sample">PRG 1 319 / INN Innsbruck Airport</span>
                <span>IATA kód a kapacitní / výškový index letiště</span>
              </div>
            </div>

            <div className="legend-section">
              <h4>Plány letišť (ODbL)</h4>
              <div className="legend-item">
                <span className="box tarmac-box" />
                <span>Vzletové a přistávací dráhy (RWY) s bílým značením</span>
              </div>
              <div className="legend-item">
                <span className="line yellow-line" />
                <span>Pojezdové dráhy (Taxiways) se žlutým středovým značením</span>
              </div>
              <div className="legend-item">
                <span className="box blue-box" />
                <span>Odbavovací terminály a hangáry</span>
              </div>
            </div>

            <div className="legend-section">
              <h4>Topografie & Sítě</h4>
              <div className="legend-item">
                <span className="line blue-water-line" />
                <span>Říční toky (řeka Inn podél letiště Innsbruck)</span>
              </div>
              <div className="legend-item">
                <span className="box terrain-box" />
                <span>3D terén a horský reliéf (Mapzen Terrarium DEM)</span>
              </div>
            </div>

            <div className="legend-sources">
              <span className="src-title">Zdrojová data:</span>
              <p>
                OpenStreetMap, Protomaps, Overture Maps, OpenHistoricalMap, Natural Earth, OurAirports, Wikidata, Plány letišť (ODbL) a Terén Mapzen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Airport Inspector Overlay */}
      {selectedAirport && (
        <div className="airport-inspector-card panel">
          <div className="inspector-head">
            <div className="iata-box">
              <span className="iata-code">{selectedAirport.iata}</span>
              <span className="icao-code">{selectedAirport.icao}</span>
            </div>
            <button
              type="button"
              className="close-btn"
              onClick={() => {
                setSelectedAirport(null);
                setSelectedPlan(null);
              }}
            >
              ✕
            </button>
          </div>

          <h3 className="airport-name">{selectedAirport.name}</h3>
          <p className="airport-location">
            {selectedAirport.city}, {selectedAirport.country}
          </p>

          <div className="airport-stats-grid">
            <div className="stat-pill">
              <span className="label">Dráha (Runway)</span>
              <span className="val gold">
                {selectedAirport.runwayLengthM.toLocaleString("en-US")} m
              </span>
            </div>
            <div className="stat-pill">
              <span className="label">Nadmořská výška</span>
              <span className="val cyan">{selectedAirport.elevationFt} ft AMSL</span>
            </div>
            <div className="stat-pill">
              <span className="label">Poptávka cestujících</span>
              <span className="val gold">{selectedAirport.passengerDemandIndex} / 100</span>
            </div>
            <div className="stat-pill">
              <span className="label">Typ</span>
              <span className="val">
                {selectedAirport.isHub ? "Mezinárodní Hub" : "Regionální"}
              </span>
            </div>
          </div>

          {selectedPlan && (
            <div className="plan-badge-notice">
              <span className="plan-tag">ODbL Airport Plan Active</span>
              <span className="plan-detail">
                Dráhy: {selectedPlan.runways.map((r) => r.name).join(", ")}
              </span>
            </div>
          )}

          <div className="inspector-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleFlyToAirport(selectedAirport)}
            >
              🎯 Zaměřit letiště (Detail)
            </button>
          </div>
        </div>
      )}

      {/* Bottom Map Style & Projection Switcher */}
      <div className="map-bottom-style-bar">
        <div className="style-pills">
          <button
            type="button"
            className={`style-btn ${currentStyle === "night" ? "active" : ""}`}
            onClick={() => handleSetBaseStyle("night")}
          >
            🌌 Earth at Night (Video Default)
          </button>
          <button
            type="button"
            className={`style-btn ${currentStyle === "dark" ? "active" : ""}`}
            onClick={() => handleSetBaseStyle("dark")}
          >
            🗺 Carto Dark (OSM / Overture)
          </button>
          <button
            type="button"
            className={`style-btn ${currentStyle === "satellite" ? "active" : ""}`}
            onClick={() => handleSetBaseStyle("satellite")}
          >
            🛰 Satelit + 3D Terén
          </button>
          <button
            type="button"
            className={`style-btn ${currentStyle === "osm" ? "active" : ""}`}
            onClick={() => handleSetBaseStyle("osm")}
          >
            🌐 OpenStreetMap
          </button>
        </div>

        <button
          type="button"
          className={`projection-toggle-btn ${is3DMode ? "active" : ""}`}
          onClick={handleToggle3D}
          title="Přepnout projekci mezi 3D glóbusem a 2D mapou"
        >
          {is3DMode ? "🌐 Projekce: 3D Glóbus" : "🗺 Projekce: 2D Mercator"}
        </button>
      </div>
    </div>
  );
}
