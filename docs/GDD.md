# GAME DESIGN DOCUMENT (GDD)
# AIRLINE MANAGER 1975–2040

**Verze:** 1.0  
**Datum:** Listopad 2026  
**Status:** Schvalovací fáze (Architektonický návrh & Základní databáze)  
**Autor:** Hlavní herní vývojář & Technický partner  

---

## 1. Herní vize (Game Vision)

**Airline Manager 1975–2040** je hluboká, propracovaná 2D manažerská a ekonomická simulace letecké společnosti. Hráč se ujímá role zakladatele a generálního ředitele (CEO) aerolinky a provádí svou společnost 65 lety dynamického vývoje letectví – od éry regulovaného trhu a kouřících proudových motorů první generace v roce 1975 přes deregulaci, zavedení fly-by-wire a kompozitů až po moderní ultra-úsporné stroje a vizi roku 2040.

### Klíčové pilíře:
- **Čistokrevný manažerský tycoon:** Důraz na strategická rozhodnutí, plánování linek, konfigurace kabin, flotilu, nákup paliva a finanční toky. Žádné 3D pobíhání po letišti, žádný simulátor pilota.
- **Historická autenticita & Dobová ekonomika:** Reálné ceny letadel, paliva i provozních nákladů v nominálních dolarech dané éry. V roce 1975 stojí Boeing 737-200 cca 7,2 milionu USD a galon leteckého paliva kolem $0.35 USD; v roce 2020 stojí A321neo přes 125 milionů USD.
- **3D pouze pro letadla:** Three.js je využit výhradně jako interaktivní hangár / showroom pro 3D modely letadel (inspekce laku, rotace, konfigurace), nikoliv pro 3D letiště.

---

## 2. Jádro herní smyčky (Core Gameplay Loop)

Herní smyčka funguje v reálném čase se zrychleným plynutím herního světa (3,5 minuty reálného času = 1 herní den):

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ANALÝZA TRHU & LETIŠŤ                                    │
│    - Vyhledání lukrativních dvojic měst (poptávka Pax/Cargo)│
│    - Prověření délek drah a poplatků na letištích           │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. VÝBĚR A POŘÍZENÍ LETADLA                                 │
│    - Nákup (nové/olétané) nebo operativní leasing           │
│    - Konfigurace sedadel (Economy / Business / First / Cargo)│
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PLÁNOVÁNÍ TRASY & LETŮ                                   │
│    - Nastavení cen letenek a frekvence                      │
│    - Přiřazení letadla a letového řádu                      │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SIMULACE & FINANČNÍ VYÚČTOVÁNÍ (Tick po ticku)            │
│    - Lety generují tržby dle obsazenosti (Load Factor)      │
│    - Odečítají se náklady: palivo, posádka, údržba, poplatky│
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. EXPANZE, ÚDRŽBA A VÝZKUM                                 │
│    - Pravidelné prohlídky (A/B/C/D-check), modernizace      │
│    - Reinvestice zisku do nových bází, strojů a výzkumu     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Herní módy (Game Modes)

### A. Kariérní mód (Career Mode)
- **Startovní rozpočet:** 5 000 000 USD (reálný kapitál pro rok 1975 – dostačující na akontaci leasingu několika strojů nebo nákup olétaného DC-9/737-200).
- **Historická omezení:** Zapnuta. Letadla se odemykají striktně podle roku uvedení do provozu (např. Concorde v roce 1976, A320 v roce 1988, B777 v 1997, A380 v 2007).
- **Bankrot & Úvěry:** Možnost úvěrů u bank s úrokovou sazbou. Při záporném kapitálu po stanovenou lhůtu nastává bankrot.
- **Cíl:** Vybudovat ze skromné regionální aerolinky globálního giganta s vysokou reputací.

### B. Sandbox mód
- **Startovní rozpočet:** Neomezený ($\infty$) nebo volitelný dle hráče.
- **Volitelný počáteční rok:** Možnost začít v libovolném roce (1975–2040).
- **Historická omezení:** Vypnutelná – hráč si může koupit moderní A350 nebo B787 hned v roce 1975.
- **Cíl:** Experimentování, volná tvorba sítě linek bez rizika bankrotu.

---

## 4. Historická časová osa (Timeline 1975–2040)

- **1975–1978 (Éra regulace a trijetů):**
  - Vysoké ceny paliva (důsledek ropné krize 1973).
  - Vládami regulované ceny letenek (USA CAB).
  - Dominance třímotorových letadel (Boeing 727, DC-10, L-1011) a první nástup širokotrupého dvoumotoráku Airbus A300.
  - Vstup Concorde do komerčního provozu (1976).
- **1978–1989 (Éra deregulace a nástup dvoučlenných posádek):**
  - Uvolnění trhu, vznik ostré konkurence a nízkonákladového modelu.
  - Přechod z 3členných posádek (s palubním inženýrem) na digitální 2členné kokpity (B757, B767, A320).
  - Příchod technologie Fly-by-Wire (A320 v roce 1988).
- **1990–2005 (Globalizace, ETOPS a hub-and-spoke):**
  - Dálkové dvoumotorové lety přes oceány (B777, A330).
  - Vznik globálních aliancí aerolinek.
  - Přísnější hlukové a emisní limity (Stage 3/4).
- **2006–2020 (Superjumba vs. Point-to-Point nová generace):**
  - Nástup Airbusu A380 (2007) vs. efektivních kompozitních dálkových letounů (B787 Dreamliner, A350).
  - Příchod re-engined narrowbody generace (A320neo, B737 MAX) s 15–20% úsporou paliva.
- **2021–2040 (Udržitelnost a digitalizace):**
  - SAF (udržitelné letecké palivo), uhlíkové kompenzace a optimalizace letových hladin.
  - Generační obměna flotil za nejúspornější stroje.

---

## 5. Hlavní herní systémy

### A. Správa společnosti (Airline Management)
- Název aerolinky, IATA kód (2 znaky), ICAO kód (3 znaky), země původu, domovské letiště (HQ Base).
- Firemní identita (barvy, logo).
- Reputace společnosti (0–100 %): ovlivňuje poptávku, závisí na spolehlivosti letů, stáří flotily a cenotvorbě.

### B. Flotila (Aircraft Fleet)
- Každé letadlo ve flotile má:
  - Registrační značku (např. N101AA, OK-XAA).
  - Vlastnický stav: Vlastněno (zakoupeno) vs. Operativní leasing (měsíční splátka).
  - Stáří (v herních letech) a celkový počet nalétaných hodin / cyklů.
  - Technický stav (Condition %): klesá s každým letem.
  - Servisní status: V provozu, Plánovaný servis (A/B/C/D check), Uzemněno.
  - Konfigurace kabiny: volba poměru Economy / Business / First / Cargo.

### C. Databáze a trh letadel (Aircraft Market)
- **Katalog nových letounů:** přímo od výrobců (dodací lhůta nebo okamžité dodání).
- **Trh ojetých letadel (Used Market):** levnější stroje se sníženým stavem a starší historií (klíčové pro začátek hry v roce 1975).
- **Leasingový trh:** nižší počáteční investice, ale stálý měsíční fixní náklad.

### D. Trasy a letové řády (Routes & Scheduling)
- Vytvoření trasy mezi dvěma odemčenými letišti.
- Ortodromická vzdálenost (Great Circle Distance) v km počítaná podle Haversinova vzorce.
- Přiřazení letadla s dostatečným doletem a odpovídajícím požadavkem na dráhu (Runway Requirement).
- Výpočet letového času = (Vzdálenost / Cestovní rychlost) + čas vzletu/přiblížení + Turnaround (doba otočky na zemi).
- Cenotvorba letenek (Economy, Business, First, Cargo $/kg).

### E. Letiště (Airports)
- Globální síť klíčových letišť (Praha PRG, Londýn LHR, New York JFK, Tokio HND, Frankfurt FRA atd.).
- Data letiště: IATA, ICAO, název, město, stát, GPS souřadnice, nadmořská výška, délka nejdelší dráhy (m), kategorie velikosti (1–10), poplatky za přistání a handling.
- Slotový systém na přetížených mega-letištích.

### F. Ekonomika a finance (Economy Engine)
- **Příjmy:** Prodej letenek (Pax Demand × Load Factor × Ticket Price), Cargo tržby.
- **Provozní náklady (Direct Operating Costs):**
  - Palivo = `letové hodiny × spotřeba (kg/h) × cena paliva ($/kg)`.
  - Posádka = platy pilotů (kokpit 2 vs. 3 osoby) + palubní průvodčí.
  - Údržba = hodinová amortizace + periodické velké prohlídky.
  - Letištní poplatky = poplatek za přistání na obou letištích + poplatek za cestujícího.
- **Fixní náklady:** Splátky leasingu, úroky z úvěrů, personál centrály.

---

## 6. Struktura databáze letadel (Aircraft Database Schema)

V databázi striktně oddělujeme:
1. **Ověřená historická fakta:** Výrobce, model, roky výroby, kapacita, dolet, rychlost, rozměry, reálná dobová katalogová cena.
2. **Balancovací parametry pro hru (Game-Balancing):** Doba obratu na zemi (Turnaround), servisní náročnost na letovou hodinu, leasingové koeficienty. Tyto hodnoty mají v kódu příznak `isEstimatedBalancing: true`.

### Příklad reprezentace v TypeScriptu:
```typescript
interface HistoricalAircraft {
  id: string;                      // např. "b737-200"
  manufacturer: string;            // "Boeing"
  model: string;                   // "737-200 Advanced"
  category: AircraftCategory;      // "narrowbody"
  firstFlightYear: number;         // 1967
  introductionYear: number;        // 1971
  productionEndYear: number;       // 1988
  passengerCapacityMax: number;    // 130
  passengerCapacityTypical2Class: number; // 115
  cargoCapacityKg: number;         // 7 800 kg
  rangeKm: number;                 // 3 520 km
  cruiseSpeedKmh: number;          // 796 km/h
  minRunwayMeters: number;         // 1 980 m
  historicalPriceUsd: number;      // 7 200 000 USD (v cenách roku 1975)
  monthlyLeaseRateUsd: number;     // 65 000 USD
  fuelBurnKgPerHour: number;       // 2 550 kg/h
  balancing: {
    turnaroundMinutes: number;     // 40 min
    cockpitCrew: number;           // 2
    cabinCrew: number;             // 3
    maintenanceCostPerHourUsd: number; // 580 USD
    isEstimatedBalancing: true;
  };
}
```

---

## 7. Struktura databáze letišť (Airport Database Schema)

```typescript
interface Airport {
  id: string;               // "JFK"
  iata: string;             // "JFK"
  icao: string;             // "KJFK"
  name: string;             // "John F. Kennedy International Airport"
  city: string;             // "New York"
  country: string;          // "United States"
  coordinates: {
    lat: number;            // 40.6413
    lon: number;            // -73.7781
  };
  longestRunwayMeters: number; // 4 423 m (dostačující pro jakékoliv letadlo)
  sizeCategory: 1 | 2 | 3 | 4 | 5; // 1 = lokální, 5 = globální megahub
  landingFeeUsd: number;    // Základní poplatek v cenách dané éry
  basePaxDemand: number;    // Základní roční poptávka
}
```

---

## 8. Ekonomický design (Realistické dobové ceny)

### Cenová hladina v roce 1975:
- **Kupní síla dolaru:** 1 USD v roce 1975 odpovídá přibližně 5,50–6,00 USD v roce 2026.
- **Katalogové ceny nových letadel 1975:**
  - *DHC-6 Twin Otter:* ~$850 000 USD
  - *Fokker F28:* ~$4 800 000 USD
  - *DC-9-30:* ~$6 500 000 USD
  - *Boeing 737-200:* ~$7 200 000 USD
  - *Boeing 727-200:* ~$10 500 000 USD
  - *Airbus A300B4:* ~$23 000 000 USD
  - *McDonnell Douglas DC-10-30:* ~$26 000 000 USD
  - *Boeing 747-200B:* ~$33 000 000 USD
  - *Concorde (1976):* ~$46 000 000 USD
- **Letecké palivo (Jet-A1):**
  - V roce 1975 po první ropné krizi: cca **$0.35 za US galon** (~$0.11 / kg).
  - V roce 2008 na vrcholu: ~$3.50+ za galon.
- **Tržby z letenek:**
  - Letenka New York – Londýn v roce 1975 stála cca **$350–$450 USD** v Economy Class (v dnešních penězích přes $2 200 USD). Létání bylo luxusnější záležitostí s vyšší marží na sedadlo než v dnešní éře nízkonákladovek.

---

## 9. Simulace tras a letů (Route & Flight Engine)

1. **Výpočet vzdálenosti:**
   $$\Delta\sigma = 2 \arcsin \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}$$
   $$\text{Distance} = R \cdot \Delta\sigma \quad (R \approx 6371\text{ km})$$
2. **Omezení trasy:**
   - `Aircraft.rangeKm >= Distance`
   - `Airport.longestRunwayMeters >= Aircraft.minRunwayMeters`
3. **Poptávkový model (Demand & Load Factor):**
   - Spojení měst generuje denní poptávku cestujících na základě velikosti letišť a vzdálenosti (gravitační model).
   - Faktor obsazenosti (Load Factor) se odvíjí od:
     $$\text{Load Factor} = f(\text{Ticket Price}, \text{Airline Reputation}, \text{Flight Frequency})$$
4. **Zisk z letu (Flight Profit):**
   $$\text{Profit} = \text{Revenue}_{\text{pax}} + \text{Revenue}_{\text{cargo}} - \text{Fuel Cost} - \text{Crew Cost} - \text{Airport Fees} - \text{Maintenance Amortization}$$

---

## 10. Struktura uživatelského rozhraní (UI/UX)

- **Barevné schéma:** Tmavě modrá, námořnická (Navy #0a1128, #101f42), břidlicová šedá, zlatavé akcenty pro peníze (#fbbf24), čistá bílá typografie.
- **Rozvržení (Layout):**
  - **TopBar:** Logo aerolinky, IATA kód, aktuální herní datum a čas, celková hotovost, indikátor serveru/světa.
  - **Sidebar:** Navigace mezi hlavními sekcemi:
    - ◈ **Dashboard** (Přehled společnosti, statistiky, notifikace)
    - ⛁ **Aircraft Market** (Katalog letadel dle roku, nákup/leasing)
    - ✈ **Fleet** (Moje flotila, stav letadel, konfigurace)
    - ⇄ **Routes** (Tvorba a správa linek, letové řády)
    - ▣ **Airports & Map** (2D mapa světa, báze a letiště)
    - $ **Finance** (Výsledovka P&L, rozpad nákladů a tržeb, úvěry)
    - ⚗ **Research** (Technologie a modernizace)
    - ⚙ **Settings / Profile** (Značka, ICAO, IATA)
  - **3D Aircraft Viewer Modal:** Okno pro prohlížení vybraného letadla ve 3D (Three.js) přímo z katalogu nebo flotily.

---

## 11. Technická architektura (Technical Architecture)

- **Frontend:** React 19 + TypeScript + Vite.
- **State Management:** `useSyncExternalStore` (reaktivní store bez zbytečných externích knihoven, rychlý a lehký).
- **Styling:** CSS s čistou strukturou tříd a konzistentním design systémem.
- **3D Viewer:** Three.js / Canvas renderující procedurálně přesné nebo low-poly GLTF modely s PBR materiály a orbitální kamerou.
- **Persistence & Ukládání:** Lokální úložiště (`localStorage` s verzováním schématu), připravené na synchronizaci se serverovým backendem / Supabase.
- **Testování:** Nativní Node.js test runner (`node --test`), 100% pokrytí výpočtů fyziky, ekonomiky a historické dostupnosti.

---

## 12. Plán vývoje (Development Roadmap)

- **Milestone 1 (Základy flotily & Trh letadel):**
  - Databáze historických letadel (rok 1975–2040) s reálnými dobovými cenami.
  - Obrazovka *Aircraft Market*: filtrování, řazení, nákup nového stroje / operativní leasing.
  - Obrazovka *Fleet*: seznam zakoupených letadel, registrace, stav opotřebení, prodej.
- **Milestone 2 (Databáze letišť & 2D Mapa světa):**
  - Databáze 50+ světových letišť s GPS, délkami drah a IATA/ICAO kódy.
  - Interaktivní 2D mapa (SVG / Canvas) zobrazující letiště, báze a dosah letadel.
- **Milestone 3 (Plánování linek & Letová simulace):**
  - Tvorba linky mezi dvěma letišti, přiřazení letadla, výpočet vzdálenosti a letového času.
  - Generování tržeb z letů, spotřeba paliva a opotřebení letadla v reálném čase.
- **Milestone 4 (Finanční ředitelství & P&L):**
  - Kompletní přehled zisků a ztrát (P&L), účtování paliva, platů posádek a poplatků.
  - Bankovní půjčky a investice.
- **Milestone 5 (3D Hangár letadel):**
  - Three.js viewer s rotací, zoomem a inspekcí modelu letadla.
- **Milestone 6 (Výzkum, události & Rozšířený multiplayer):**
  - Historické události (ropné šoky, deregulace), výzkum efektivity a multiplayer statistiky.

---

## 13. Navrhované MVP (Minimum Viable Playable Version)

**Definice MVP:**
Hráč může:
1. Spustit hru v roce 1975 s $5 000 000 USD (nebo v Sandboxu).
2. Otevřít **Aircraft Market** a prohlédnout si dobově dostupná letadla (B737-200, B727-200, DC-9-30, A300, 747-200, DHC-6 Twin Otter) s autentickými cenami a parametry.
3. Koupit nebo pronajmout své první letadlo a pojmenovat ho.
4. Zobrazit své letadlo v sekci **Fleet**.
5. Vybrat dvě letiště (např. Londýn LHR – Frankfurt FRA nebo New York JFK – Boston BOS) a otevřít linku.
6. Vidět, jak letadlo létá, vydělává peníze, pálí palivo a opotřebovává se s každým dnem simulačního času.
