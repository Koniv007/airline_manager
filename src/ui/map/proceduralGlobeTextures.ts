import * as THREE from "three";

export type GlobeMapType = "satellite" | "light" | "dark";

/** Geographic point [lon, lat] */
type Coord = readonly [number, number];

/** Continent & major landmass polygons */
interface Landmass {
  readonly name: string;
  readonly points: readonly Coord[];
  readonly biome?: "ice" | "desert" | "savanna" | "forest" | "temperate";
}

/** National borders / boundaries (polyline segments) */
interface BorderPath {
  readonly name: string;
  readonly points: readonly Coord[];
}

/** Major city light hubs for orbital night view */
interface CityLightHub {
  readonly name: string;
  readonly lon: number;
  readonly lat: number;
  readonly intensity: number;
  readonly radius: number;
}

// =============================================================================
// COMPREHENSIVE GLOBAL LANDMASSES & ISLANDS DATABASE
// =============================================================================
export const LANDMASSES: readonly Landmass[] = [
  // 1. North America Mainland
  {
    name: "North America",
    points: [
      [-168, 65], [-162, 70], [-150, 71], [-130, 70], [-120, 69], [-105, 69],
      [-95, 68], [-83, 64], [-80, 58], [-75, 58], [-65, 58], [-55, 52],
      [-60, 47], [-64, 45], [-70, 42], [-74, 40], [-76, 35], [-81, 26],
      [-82, 24], [-84, 30], [-88, 30], [-94, 29], [-97, 26], [-97, 20],
      [-90, 16], [-84, 10], [-77, 8], [-80, 9], [-85, 13], [-89, 14],
      [-95, 17], [-105, 23], [-110, 24], [-115, 30], [-120, 34], [-124, 39],
      [-124, 48], [-128, 52], [-135, 57], [-145, 60], [-155, 58], [-165, 54],
      [-168, 60], [-168, 65],
    ],
    biome: "temperate",
  },
  // 2. Central America / Baja California
  {
    name: "Baja California",
    points: [
      [-115, 32], [-113, 29], [-110, 24], [-110, 23], [-112, 24], [-114, 27],
      [-117, 32], [-115, 32],
    ],
    biome: "desert",
  },
  // 3. South America Mainland
  {
    name: "South America",
    points: [
      [-77, 8], [-73, 11], [-67, 10], [-60, 8], [-52, 4], [-44, -2],
      [-36, -5], [-35, -7], [-37, -13], [-39, -18], [-43, -23], [-48, -28],
      [-53, -34], [-60, -38], [-65, -43], [-67, -55], [-72, -54], [-75, -50],
      [-74, -43], [-72, -37], [-70, -25], [-76, -14], [-81, -5], [-79, 1],
      [-77, 8],
    ],
    biome: "forest",
  },
  // 4. Eurasia Mainland (Europe + Asia)
  {
    name: "Eurasia",
    points: [
      // Europe
      [-9, 36], [-9, 43], [-4, 43.5], [-1, 46], [-4, 48], [-1, 49],
      [2, 51], [7, 54], [8, 57], [10, 58], [12, 55], [18, 55],
      [22, 57], [25, 60], [30, 60], [33, 65], [40, 67], [50, 68],
      // Siberia / Arctic
      [60, 70], [75, 73], [90, 74], [105, 77], [120, 74], [140, 72],
      [160, 70], [170, 66], [180, 65], [170, 60], [160, 55], [156, 51],
      [143, 49], [136, 45], [130, 42], [128, 38], [122, 37], [120, 31],
      // East & South Asia
      [115, 22], [109, 21], [107, 16], [105, 10], [101, 3], [98, 12],
      [92, 21], [88, 22], [82, 16], [80, 13], [77, 8], [73, 16],
      [70, 21], [67, 24], [60, 25],
      // Middle East
      [56, 25], [54, 23], [58, 21], [54, 16], [48, 13], [44, 12],
      [40, 20], [35, 28], [34, 32], [35, 36], [29, 41],
      // Southern Europe / Mediterranean
      [26, 40], [23, 38], [21, 37], [23, 40], [18, 41], [15, 40],
      [15, 42], [12, 44], [3, 43], [-1, 41], [-2, 37], [-9, 36],
    ],
    biome: "temperate",
  },
  // 5. Scandinavia (Norway & Sweden)
  {
    name: "Scandinavia",
    points: [
      [5, 59], [5, 62], [10, 64], [14, 68], [24, 71], [30, 70],
      [27, 65], [22, 63], [18, 59], [13, 56], [10, 58], [5, 59],
    ],
    biome: "temperate",
  },
  // 6. Africa Mainland
  {
    name: "Africa",
    points: [
      [-5, 36], [2, 36], [10, 37], [12, 33], [20, 32], [26, 31],
      [32, 31], [34, 27], [38, 22], [43, 12], [51, 11], [48, 6],
      [42, 0], [40, -6], [38, -15], [35, -23], [32, -29], [28, -34],
      [20, -34], [18, -34], [15, -28], [12, -18], [12, -8], [9, 3],
      [4, 5], [0, 5], [-8, 5], [-12, 5], [-17, 12], [-17, 17],
      [-17, 21], [-13, 28], [-8, 32], [-5, 36],
    ],
    biome: "desert",
  },
  // 7. Australia Mainland
  {
    name: "Australia",
    points: [
      [114, -22], [116, -17], [122, -15], [130, -12], [137, -12], [142, -10],
      [144, -14], [149, -20], [153, -28], [151, -34], [148, -37], [140, -38],
      [135, -34], [128, -33], [120, -34], [115, -34], [113, -26], [114, -22],
    ],
    biome: "savanna",
  },
  // 8. Greenland
  {
    name: "Greenland",
    points: [
      [-44, 60], [-35, 65], [-25, 70], [-18, 77], [-22, 82], [-32, 83],
      [-45, 83], [-55, 81], [-60, 77], [-55, 72], [-50, 66], [-44, 60],
    ],
    biome: "ice",
  },
  // 9. Antarctica (polar ice perimeter)
  {
    name: "Antarctica",
    points: [
      [-180, -70], [-140, -72], [-100, -71], [-70, -64], [-55, -63],
      [-30, -70], [0, -69], [40, -68], [80, -66], [120, -65],
      [150, -68], [170, -70], [180, -70], [180, -90], [-180, -90], [-180, -70],
    ],
    biome: "ice",
  },

  // =========================================================================
  // COMPLETE ISLANDS (Previously missing ones restored with high fidelity!)
  // =========================================================================
  // Great Britain
  {
    name: "Great Britain",
    points: [
      [-5, 50], [-3, 50.5], [1, 51], [1.5, 52.5], [0, 54], [-1, 56],
      [-2, 58], [-4, 58.5], [-5, 57], [-4.5, 55], [-3, 53], [-5, 51.5], [-5, 50],
    ],
    biome: "temperate",
  },
  // Ireland
  {
    name: "Ireland",
    points: [
      [-9.5, 51.5], [-8, 51.5], [-6, 52.2], [-6, 53.5], [-5.8, 54.5],
      [-7.5, 55.2], [-9.5, 54.5], [-10, 53], [-9.5, 51.5],
    ],
    biome: "temperate",
  },
  // Iceland
  {
    name: "Iceland",
    points: [
      [-24, 64], [-22, 63.5], [-14, 64.5], [-14, 66], [-18, 66.5],
      [-23, 66], [-24, 64],
    ],
    biome: "ice",
  },
  // Madagascar
  {
    name: "Madagascar",
    points: [
      [44, -13], [49, -12], [50, -16], [48, -25], [45, -25], [43.5, -20],
      [44, -13],
    ],
    biome: "savanna",
  },
  // Japan - Honshu
  {
    name: "Japan - Honshu",
    points: [
      [131, 34], [135, 34], [139, 35.5], [141, 38], [141.5, 41],
      [140, 40.5], [136, 36.5], [132, 34.5], [131, 34],
    ],
    biome: "forest",
  },
  // Japan - Hokkaido
  {
    name: "Japan - Hokkaido",
    points: [
      [140, 42], [144, 43], [145, 44.5], [142, 45.5], [141, 43.5], [140, 42],
    ],
    biome: "forest",
  },
  // Japan - Kyushu & Shikoku
  {
    name: "Japan - South",
    points: [
      [129.5, 31.5], [131.5, 31.5], [132, 33.5], [134, 33.5], [133, 34],
      [130, 33], [129.5, 31.5],
    ],
    biome: "forest",
  },
  // New Zealand - North Island
  {
    name: "New Zealand North",
    points: [
      [173, -35], [175, -36], [178, -38], [177, -40], [175, -41.5],
      [174, -39], [173, -35],
    ],
    biome: "forest",
  },
  // New Zealand - South Island
  {
    name: "New Zealand South",
    points: [
      [172, -41], [174, -42], [170, -46], [167, -46], [168, -44],
      [171, -42], [172, -41],
    ],
    biome: "forest",
  },
  // Indonesia - Sumatra
  {
    name: "Sumatra",
    points: [
      [95, 5.5], [99, 2], [104, -2], [106, -5], [103, -4], [98, 0], [95, 5.5],
    ],
    biome: "forest",
  },
  // Indonesia - Java
  {
    name: "Java",
    points: [
      [106, -6], [112, -7], [114, -8], [111, -8], [106, -7], [106, -6],
    ],
    biome: "forest",
  },
  // Indonesia / Malaysia - Borneo
  {
    name: "Borneo",
    points: [
      [109, 1], [114, 4.5], [118, 5], [119, 1], [116, -3], [111, -3], [109, 1],
    ],
    biome: "forest",
  },
  // Indonesia - Sulawesi
  {
    name: "Sulawesi",
    points: [
      [120, 1], [124, 1.5], [122, -1], [123, -5], [120, -5], [119, -2], [120, 1],
    ],
    biome: "forest",
  },
  // New Guinea / Papua
  {
    name: "New Guinea",
    points: [
      [131, -1], [140, -3], [149, -9], [147, -10], [140, -8], [135, -4], [131, -1],
    ],
    biome: "forest",
  },
  // Philippines - Luzon & Mindanao
  {
    name: "Philippines",
    points: [
      [120, 18], [122, 16], [124, 13], [126, 8], [125, 6], [122, 7],
      [121, 13], [120, 18],
    ],
    biome: "forest",
  },
  // Taiwan
  {
    name: "Taiwan",
    points: [
      [120, 22], [122, 25], [121, 25.5], [120, 23], [120, 22],
    ],
    biome: "forest",
  },
  // Sri Lanka
  {
    name: "Sri Lanka",
    points: [
      [79.8, 6], [81.8, 7], [81.5, 9], [80, 9.5], [79.8, 6],
    ],
    biome: "forest",
  },
  // Caribbean - Cuba
  {
    name: "Cuba",
    points: [
      [-84, 22], [-80, 23], [-75, 20], [-76, 19.5], [-81, 21.5], [-84, 22],
    ],
    biome: "forest",
  },
  // Caribbean - Hispaniola (Haiti / Dominican Republic)
  {
    name: "Hispaniola",
    points: [
      [-74, 18.5], [-69, 19.5], [-68.5, 18.2], [-72, 18], [-74, 18.5],
    ],
    biome: "forest",
  },
  // Mediterranean - Sicily, Sardinia, Corsica
  {
    name: "Sicily",
    points: [
      [12.5, 38], [15.5, 38.2], [15, 36.6], [12.5, 38],
    ],
    biome: "temperate",
  },
  {
    name: "Sardinia & Corsica",
    points: [
      [8.5, 39], [9.5, 39.5], [9.5, 42.8], [8.7, 42.5], [8.5, 39],
    ],
    biome: "temperate",
  },
  {
    name: "Crete & Cyprus",
    points: [
      [23.5, 35.5], [26, 35.2], [25, 35], [23.5, 35.5],
    ],
    biome: "temperate",
  },
  {
    name: "Cyprus",
    points: [
      [32.3, 35.1], [34.5, 35.5], [33.8, 34.8], [32.3, 35.1],
    ],
    biome: "temperate",
  },
  // Hawaii (Big Island + Maui + Oahu)
  {
    name: "Hawaii",
    points: [
      [-160, 22], [-158, 21.5], [-155, 19], [-156, 19], [-159, 21], [-160, 22],
    ],
    biome: "forest",
  },
  // Australia - Tasmania
  {
    name: "Tasmania",
    points: [
      [145, -41], [148, -41], [148, -43.5], [145, -43], [145, -41],
    ],
    biome: "temperate",
  },
  // Arctic - Svalbard
  {
    name: "Svalbard",
    points: [
      [12, 77], [22, 80], [18, 80], [12, 77],
    ],
    biome: "ice",
  },
];

// =============================================================================
// PROMINENT NATIONAL & REGIONAL BORDERS (Clear, crisp country outlines)
// =============================================================================
export const COUNTRY_BORDERS: readonly BorderPath[] = [
  // --- EUROPE ---
  // Czech Republic (distinctive Bohemian / Moravian basin)
  {
    name: "Czechia",
    points: [
      [12.2, 50.3], [14.3, 51.0], [15.1, 50.8], [16.8, 50.5], [17.5, 50.2],
      [18.8, 49.5], [18.3, 49.2], [17.2, 48.8], [15.5, 48.9], [14.0, 48.6],
      [12.8, 49.3], [12.2, 50.3],
    ],
  },
  // Slovakia
  {
    name: "Slovakia",
    points: [
      [17.2, 48.8], [18.8, 49.5], [19.5, 49.4], [22.5, 49.0], [22.2, 48.4],
      [19.0, 48.1], [17.2, 48.8],
    ],
  },
  // France / Spain / Portugal
  {
    name: "France-Spain Pyrenees",
    points: [[-1.8, 43.4], [0.5, 42.8], [3.1, 42.4]],
  },
  {
    name: "Spain-Portugal",
    points: [[-6.5, 41.8], [-8.8, 41.8], [-8.5, 40.0], [-7.0, 39.0], [-7.4, 37.2]],
  },
  // France-Germany / Benelux / Switzerland / Italy
  {
    name: "France-Germany-Alps",
    points: [
      [2.5, 51.1], [6.0, 50.0], [8.0, 49.0], [7.5, 47.6],
      [6.8, 45.8], [7.5, 44.5], [7.5, 43.7],
    ],
  },
  {
    name: "Germany-Poland (Oder-Neisse)",
    points: [[14.2, 53.9], [14.6, 52.3], [15.0, 50.8]],
  },
  {
    name: "Poland-Eastern Border (Belarus/Ukraine)",
    points: [[23.5, 54.0], [23.7, 52.0], [24.0, 50.5], [22.5, 49.0]],
  },
  {
    name: "Italy-Alpine Border (Switzerland/Austria)",
    points: [[6.8, 45.8], [8.5, 46.5], [10.5, 46.8], [12.5, 46.7], [13.7, 46.5]],
  },
  {
    name: "UK - Northern Ireland / Republic of Ireland",
    points: [[-8.0, 54.5], [-7.2, 54.1], [-6.5, 54.0]],
  },
  {
    name: "Scandinavia: Norway-Sweden",
    points: [[11.5, 59.0], [12.5, 62.0], [14.5, 65.0], [20.0, 68.5], [24.0, 69.5]],
  },
  {
    name: "Sweden-Finland",
    points: [[24.0, 66.0], [21.0, 68.5], [20.0, 68.5]],
  },
  {
    name: "Finland-Russia",
    points: [[28.0, 60.5], [30.0, 63.0], [30.0, 66.0], [31.5, 69.5]],
  },

  // --- NORTH AMERICA ---
  // USA - Canada (49th parallel + Great Lakes + East)
  {
    name: "USA-Canada 49th Parallel",
    points: [
      [-123.0, 49.0], [-115.0, 49.0], [-105.0, 49.0], [-95.0, 49.0],
      [-89.5, 48.0], [-84.0, 45.8], [-82.0, 43.0], [-79.0, 43.5],
      [-75.0, 45.0], [-71.5, 45.0], [-67.0, 45.0],
    ],
  },
  {
    name: "USA-Canada Alaska Border",
    points: [[-141.0, 60.0], [-141.0, 70.0]],
  },
  // USA - Mexico (Rio Grande)
  {
    name: "USA-Mexico Border",
    points: [
      [-117.1, 32.5], [-114.7, 32.7], [-108.2, 31.8], [-106.5, 31.8],
      [-104.5, 29.5], [-100.5, 28.5], [-97.5, 26.0],
    ],
  },
  {
    name: "Mexico-Guatemala",
    points: [[-92.2, 14.6], [-91.0, 16.0], [-89.2, 17.8]],
  },

  // --- SOUTH AMERICA ---
  {
    name: "Chile-Argentina (Andes)",
    points: [
      [-69.0, -18.0], [-68.5, -23.0], [-69.8, -30.0], [-70.0, -38.0],
      [-72.0, -45.0], [-68.5, -55.0],
    ],
  },
  {
    name: "Brazil-Argentina-Paraguay",
    points: [[-57.5, -30.0], [-54.0, -25.5], [-58.0, -20.0]],
  },
  {
    name: "Brazil Northern Border (Colombia/Venezuela)",
    points: [[-70.0, -4.0], [-67.5, 1.5], [-60.5, 5.0], [-52.0, 4.0]],
  },
  {
    name: "Peru-Bolivia",
    points: [[-69.5, -16.0], [-70.0, -10.0]],
  },

  // --- ASIA & MIDDLE EAST ---
  {
    name: "Russia-China-Mongolia",
    points: [
      [87.0, 49.0], [95.0, 51.5], [105.0, 50.0], [115.0, 50.0],
      [120.0, 53.0], [130.0, 48.0], [135.0, 48.0], [131.0, 43.0],
    ],
  },
  {
    name: "China-India (Himalayas)",
    points: [[75.0, 36.0], [80.0, 31.0], [88.0, 27.5], [97.0, 28.5]],
  },
  {
    name: "India-Pakistan",
    points: [[68.0, 24.0], [71.0, 28.0], [74.5, 32.5], [75.0, 36.0]],
  },
  {
    name: "Korean DMZ (38th parallel)",
    points: [[126.0, 38.0], [128.5, 38.5]],
  },
  {
    name: "Saudi Arabia-Gulf Borders",
    points: [
      [36.0, 29.5], [42.0, 31.0], [47.5, 29.5], [51.0, 24.0],
      [55.0, 22.0], [52.0, 16.5], [43.0, 16.5],
    ],
  },
  {
    name: "Turkey-Syria-Iraq-Iran",
    points: [
      [36.0, 36.0], [42.0, 37.0], [44.5, 37.0], [48.0, 30.0],
      [61.0, 25.0],
    ],
  },

  // --- AFRICA ---
  {
    name: "Egypt-Libya / Sudan",
    points: [[25.0, 31.5], [25.0, 22.0], [36.0, 22.0]],
  },
  {
    name: "Algeria-Morocco-Tunisia",
    points: [
      [-2.0, 35.0], [-5.0, 32.0], [-8.5, 28.0], [8.0, 37.0], [11.5, 33.0],
    ],
  },
  {
    name: "South Africa Borders",
    points: [[16.5, -28.5], [20.0, -26.0], [27.0, -22.0], [32.0, -26.0]],
  },
  {
    name: "Nigeria & Gulf of Guinea borders",
    points: [[3.0, 6.5], [3.5, 13.5], [13.5, 13.5], [14.0, 9.0], [9.0, 4.5]],
  },
];

// =============================================================================
// MAJOR METROPOLITAN CITY LIGHT CLUSTERS (Glow on night/satellite)
// =============================================================================
export const CITY_LIGHTS: readonly CityLightHub[] = [
  // Europe
  { name: "Prague", lon: 14.4, lat: 50.1, intensity: 0.95, radius: 10 },
  { name: "London", lon: -0.1, lat: 51.5, intensity: 1.0, radius: 22 },
  { name: "Paris", lon: 2.3, lat: 48.8, intensity: 1.0, radius: 20 },
  { name: "Frankfurt / Rhine", lon: 8.7, lat: 50.1, intensity: 0.95, radius: 18 },
  { name: "Benelux / Randstad", lon: 4.9, lat: 52.3, intensity: 0.95, radius: 20 },
  { name: "Madrid", lon: -3.7, lat: 40.4, intensity: 0.9, radius: 14 },
  { name: "Rome / Milan", lon: 12.5, lat: 42.0, intensity: 0.9, radius: 16 },
  { name: "Moscow", lon: 37.6, lat: 55.7, intensity: 0.95, radius: 18 },
  // North America
  { name: "New York BosWash Corridor", lon: -74.0, lat: 40.7, intensity: 1.0, radius: 32 },
  { name: "Chicago Megalopolis", lon: -87.6, lat: 41.8, intensity: 0.95, radius: 24 },
  { name: "Los Angeles Basin", lon: -118.2, lat: 34.0, intensity: 1.0, radius: 26 },
  { name: "San Francisco Bay", lon: -122.4, lat: 37.7, intensity: 0.9, radius: 18 },
  { name: "Texas Triangle (Dallas/Houston)", lon: -96.8, lat: 31.0, intensity: 0.9, radius: 22 },
  { name: "Toronto / Montreal", lon: -79.4, lat: 43.7, intensity: 0.85, radius: 18 },
  // Asia & Middle East
  { name: "Tokyo Greater Area", lon: 139.7, lat: 35.7, intensity: 1.0, radius: 32 },
  { name: "Osaka / Nagoya", lon: 135.5, lat: 34.7, intensity: 0.9, radius: 20 },
  { name: "Shanghai Yangtze Delta", lon: 121.5, lat: 31.2, intensity: 1.0, radius: 28 },
  { name: "Beijing / Tianjin", lon: 116.4, lat: 39.9, intensity: 0.95, radius: 24 },
  { name: "Pearl River (HK / Shenzhen / Guangzhou)", lon: 114.1, lat: 22.3, intensity: 1.0, radius: 26 },
  { name: "Seoul", lon: 127.0, lat: 37.5, intensity: 0.95, radius: 18 },
  { name: "Singapore", lon: 103.8, lat: 1.3, intensity: 0.9, radius: 12 },
  { name: "Bangkok", lon: 100.5, lat: 13.7, intensity: 0.85, radius: 14 },
  { name: "Dubai / UAE / Doha", lon: 55.3, lat: 25.2, intensity: 0.95, radius: 18 },
  { name: "Mumbai", lon: 72.8, lat: 19.0, intensity: 0.9, radius: 16 },
  { name: "Delhi", lon: 77.2, lat: 28.6, intensity: 0.9, radius: 18 },
  // South America & Africa & Oceania
  { name: "São Paulo / Rio", lon: -46.6, lat: -23.5, intensity: 0.95, radius: 24 },
  { name: "Buenos Aires", lon: -58.4, lat: -34.6, intensity: 0.85, radius: 16 },
  { name: "Cairo / Nile Delta", lon: 31.2, lat: 30.0, intensity: 0.95, radius: 20 },
  { name: "Johannesburg", lon: 28.0, lat: -26.2, intensity: 0.8, radius: 14 },
  { name: "Sydney / Melbourne", lon: 151.2, lat: -33.8, intensity: 0.9, radius: 18 },
];

/** Convert longitude (-180..180) and latitude (-90..90) to canvas (x, y) */
export function toCanvasCoords(lon: number, lat: number, width: number, height: number): [number, number] {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

/** Draws high-detail coordinate grid (meridians and parallels) */
function drawGraticules(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokeStyle: string,
  lineWidth = 1,
) {
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;

  // Parallels every 15 deg
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Equator & Tropics highlighted
  const equatorY = height / 2;
  const cancerY = ((90 - 23.44) / 180) * height;
  const capricornY = ((90 - -23.44) / 180) * height;

  ctx.lineWidth = lineWidth * 1.8;
  ctx.beginPath();
  ctx.moveTo(0, equatorY);
  ctx.lineTo(width, equatorY);
  ctx.stroke();

  ctx.lineWidth = lineWidth * 1.1;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, cancerY);
  ctx.lineTo(width, cancerY);
  ctx.moveTo(0, capricornY);
  ctx.lineTo(width, capricornY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Meridians every 15 deg
  ctx.lineWidth = lineWidth;
  for (let lon = -180; lon <= 180; lon += 15) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  ctx.restore();
}

/** Draws crisp national borders */
function drawCountryBorders(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  lineWidth = 2,
  isDashed = false,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  if (isDashed) {
    ctx.setLineDash([6, 4]);
  }

  for (const border of COUNTRY_BORDERS) {
    if (border.points.length < 2) continue;
    ctx.beginPath();
    const [x0, y0] = toCanvasCoords(border.points[0][0], border.points[0][1], width, height);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < border.points.length; i++) {
      const [x, y] = toCanvasCoords(border.points[i][0], border.points[i][1], width, height);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/** Draws metropolitan city light clusters for orbital space view */
function drawCityLights(ctx: CanvasRenderingContext2D, width: number, height: number, tint: "gold" | "cyan") {
  ctx.save();
  for (const city of CITY_LIGHTS) {
    const [cx, cy] = toCanvasCoords(city.lon, city.lat, width, height);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, city.radius);

    if (tint === "gold") {
      grad.addColorStop(0, `rgba(255, 235, 170, ${0.9 * city.intensity})`);
      grad.addColorStop(0.3, `rgba(250, 180, 70, ${0.6 * city.intensity})`);
      grad.addColorStop(0.7, `rgba(220, 120, 30, ${0.25 * city.intensity})`);
      grad.addColorStop(1, "rgba(220, 120, 30, 0)");
    } else {
      grad.addColorStop(0, `rgba(220, 250, 255, ${0.95 * city.intensity})`);
      grad.addColorStop(0.3, `rgba(56, 189, 248, ${0.6 * city.intensity})`);
      grad.addColorStop(0.7, `rgba(14, 116, 144, ${0.25 * city.intensity})`);
      grad.addColorStop(1, "rgba(14, 116, 144, 0)");
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, city.radius, 0, Math.PI * 2);
    ctx.fill();

    // Core bright pinpoint
    ctx.fillStyle = tint === "gold" ? "#ffffff" : "#cffafe";
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1.8, city.radius * 0.15), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// =============================================================================
// TEXTURE GENERATOR ENGINE (Ultra sharp 4096 x 2048 canvas)
// =============================================================================
export function generateGlobeTexture(type: GlobeMapType): THREE.CanvasTexture {
  const width = 4096;
  const height = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  if (type === "satellite") {
    // =========================================================================
    // 1. SATELLITE (DEFAULT) - Ultra realistic orbital views with real borders
    // =========================================================================
    // Multi-stop oceanic gradient (deep marine trenches, continental shelf glow)
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
    oceanGrad.addColorStop(0, "#05162e");
    oceanGrad.addColorStop(0.18, "#092448");
    oceanGrad.addColorStop(0.4, "#0b2f5c");
    oceanGrad.addColorStop(0.5, "#0d3668");
    oceanGrad.addColorStop(0.6, "#0b2f5c");
    oceanGrad.addColorStop(0.82, "#092448");
    oceanGrad.addColorStop(1, "#05162e");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // Continental shelf turquoise glow around landmasses
    for (const land of LANDMASSES) {
      if (land.points.length < 3) continue;
      ctx.beginPath();
      const [x0, y0] = toCanvasCoords(land.points[0][0], land.points[0][1], width, height);
      ctx.moveTo(x0, y0);
      for (let i = 1; i < land.points.length; i++) {
        const [x, y] = toCanvasCoords(land.points[i][0], land.points[i][1], width, height);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(22, 101, 140, 0.45)";
      ctx.lineWidth = 14;
      ctx.stroke();
    }

    // Draw Landmasses & Biomes
    for (const land of LANDMASSES) {
      if (land.points.length < 3) continue;
      ctx.beginPath();
      const [x0, y0] = toCanvasCoords(land.points[0][0], land.points[0][1], width, height);
      ctx.moveTo(x0, y0);
      for (let i = 1; i < land.points.length; i++) {
        const [x, y] = toCanvasCoords(land.points[i][0], land.points[i][1], width, height);
        ctx.lineTo(x, y);
      }
      ctx.closePath();

      if (land.biome === "ice") {
        // Polar glacial ice
        ctx.fillStyle = "#edf4fc";
      } else if (land.biome === "desert") {
        // Sahara & Arabian golden terracotta desert
        const desertGrad = ctx.createLinearGradient(0, 0, 0, height);
        desertGrad.addColorStop(0.25, "#c29b53"); // Sahara
        desertGrad.addColorStop(0.48, "#2e532b"); // Congo rainforest
        desertGrad.addColorStop(0.7, "#a67f3f"); // Kalahari
        ctx.fillStyle = desertGrad;
      } else if (land.biome === "savanna") {
        // Australian outback red earth & savanna
        const ausGrad = ctx.createLinearGradient(0, 0, 0, height);
        ausGrad.addColorStop(0.55, "#ad6239");
        ausGrad.addColorStop(0.68, "#87733f");
        ausGrad.addColorStop(0.75, "#4d6b38");
        ctx.fillStyle = ausGrad;
      } else if (land.biome === "forest") {
        // Amazon / SE Asia tropical lush rainforest
        ctx.fillStyle = "#1e4d26";
      } else {
        // European / North American temperate woodland
        const tempGrad = ctx.createLinearGradient(0, 0, 0, height);
        tempGrad.addColorStop(0.18, "#32442d"); // Taiga
        tempGrad.addColorStop(0.3, "#3d6232"); // Temperate
        tempGrad.addColorStop(0.45, "#466e3b");
        ctx.fillStyle = tempGrad;
      }
      ctx.fill();

      // Sharp natural coastline outline
      ctx.strokeStyle = "#4d805c";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Snowy Mountain Ridges (Himalayas, Alps, Rockies, Andes)
    ctx.strokeStyle = "rgba(245, 250, 255, 0.75)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    // Himalayas
    ctx.beginPath();
    const [h0x, h0y] = toCanvasCoords(74, 35, width, height);
    const [h1x, h1y] = toCanvasCoords(94, 28, width, height);
    ctx.moveTo(h0x, h0y);
    ctx.lineTo(h1x, h1y);
    ctx.stroke();
    // Alps
    ctx.beginPath();
    const [a0x, a0y] = toCanvasCoords(6, 45, width, height);
    const [a1x, a1y] = toCanvasCoords(14, 47, width, height);
    ctx.moveTo(a0x, a0y);
    ctx.lineTo(a1x, a1y);
    ctx.stroke();
    // Rockies
    ctx.beginPath();
    const [r0x, r0y] = toCanvasCoords(-120, 52, width, height);
    const [r1x, r1y] = toCanvasCoords(-106, 36, width, height);
    ctx.moveTo(r0x, r0y);
    ctx.lineTo(r1x, r1y);
    ctx.stroke();
    // Andes
    ctx.beginPath();
    const [an0x, an0y] = toCanvasCoords(-72, -10, width, height);
    const [an1x, an1y] = toCanvasCoords(-70, -45, width, height);
    ctx.moveTo(an0x, an0y);
    ctx.lineTo(an1x, an1y);
    ctx.stroke();

    // PROMINENT NATIONAL COUNTRY BORDERS (Crisp luminous golden borders!)
    drawCountryBorders(ctx, width, height, "rgba(255, 222, 130, 0.65)", 3, false);

    // City lights glowing on orbital night view
    drawCityLights(ctx, width, height, "gold");

    // Polar ice caps
    ctx.fillStyle = "#f3f8fe";
    ctx.fillRect(0, 0, width, height * 0.075);
    ctx.fillRect(0, height * 0.885, width, height * 0.115);

    // Subtle atmospheric clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.11)";
    for (let c = 0; c < 45; c++) {
      const cx = (c * 97) % width;
      const cy = 350 + Math.sin(c * 1.5) * 500;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 260, 65, 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Precise graticules
    drawGraticules(ctx, width, height, "rgba(255, 255, 255, 0.08)", 1);

  } else if (type === "light") {
    // =========================================================================
    // 2. LIGHT ATLAS - Prestigious cartographic atlas with sharp borders
    // =========================================================================
    // Crisp pale slate-blue ocean
    ctx.fillStyle = "#dce6f0";
    ctx.fillRect(0, 0, width, height);

    // Clean white limestone landmasses
    for (const land of LANDMASSES) {
      if (land.points.length < 3) continue;
      ctx.beginPath();
      const [x0, y0] = toCanvasCoords(land.points[0][0], land.points[0][1], width, height);
      ctx.moveTo(x0, y0);
      for (let i = 1; i < land.points.length; i++) {
        const [x, y] = toCanvasCoords(land.points[i][0], land.points[i][1], width, height);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = land.biome === "ice" ? "#f8fafc" : "#ffffff";
      ctx.fill();

      // Sharp slate coastline
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Deep slate country borders
    drawCountryBorders(ctx, width, height, "#1e293b", 3, false);

    // Clear graticules
    drawGraticules(ctx, width, height, "rgba(71, 85, 105, 0.22)", 1);

  } else {
    // =========================================================================
    // 3. DARK TACTICAL - Cyberpunk / NORAD high-contrast command center
    // =========================================================================
    // Deep obsidian universe ocean
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, width, height);

    // Dark indigo continents
    for (const land of LANDMASSES) {
      if (land.points.length < 3) continue;
      ctx.beginPath();
      const [x0, y0] = toCanvasCoords(land.points[0][0], land.points[0][1], width, height);
      ctx.moveTo(x0, y0);
      for (let i = 1; i < land.points.length; i++) {
        const [x, y] = toCanvasCoords(land.points[i][0], land.points[i][1], width, height);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = "#0a192f";
      ctx.fill();

      // Neon cyan coastline edge
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Neon electric borders
    drawCountryBorders(ctx, width, height, "#38bdf8", 3, true);

    // Tactical cyan city nodes
    drawCityLights(ctx, width, height, "cyan");

    // Tactical glowing coordinate grid
    drawGraticules(ctx, width, height, "rgba(56, 189, 248, 0.2)", 1.2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}
