import { useState, useMemo } from "react";
import { useGameState, buyAircraft, leaseAircraft } from "../../game/gameStore.ts";
import { AIRCRAFT_DATABASE } from "../../aircraft/aircraftData.ts";
import type { HistoricalAircraft, AircraftCategory } from "../../aircraft/types.ts";
import { formatMoney } from "../../economy/money.ts";
import { toGameDate } from "../../simulation/gameClock.ts";
import {
  generateRegistration,
  calculateUsedAircraftStats,
  type SeatConfiguration,
} from "../../fleet/types.ts";
import { getAircraftImageUrl } from "../../aircraft/aircraftImages.ts";

interface AircraftMarketScreenProps {
  onNavigateToFleet: () => void;
}

type OrderMode = "buy" | "lease" | null;

const CATEGORIES: { readonly id: AircraftCategory | "all"; readonly label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "narrowbody", label: "Narrowbody" },
  { id: "widebody", label: "Widebody" },
  { id: "jumbo", label: "Jumbo / 4-Engine" },
  { id: "regional", label: "Regional Jets" },
  { id: "turboprop", label: "Turboprop (STOL)" },
  { id: "supersonic", label: "Supersonic" },
];

export default function AircraftMarketScreen({ onNavigateToFleet }: AircraftMarketScreenProps) {
  const { cash, mode, clock, fleet } = useGameState();
  const gameDate = toGameDate(clock);
  const currentYear = gameDate.year;
  const isCareer = mode === "career";

  const [selectedCategory, setSelectedCategory] = useState<AircraftCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  // Modal order state
  const [selectedAircraft, setSelectedAircraft] = useState<HistoricalAircraft | null>(null);
  const [orderMode, setOrderMode] = useState<OrderMode>(null);
  const [isBuyingUsed, setIsBuyingUsed] = useState(false);
  const [customReg, setCustomReg] = useState("");
  const [nickname, setNickname] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Seat Configurator state
  const [economySeats, setEconomySeats] = useState(0);
  const [businessSeats, setBusinessSeats] = useState(0);
  const [firstSeats, setFirstSeats] = useState(0);

  const filteredAircraft = useMemo(() => {
    return AIRCRAFT_DATABASE.filter((ac) => {
      if (selectedCategory !== "all" && ac.category !== selectedCategory) return false;
      const isAvailableInYear = !isCareer || ac.introductionYear <= currentYear;
      if (onlyAvailable && !isAvailableInYear) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = `${ac.manufacturer} ${ac.model}`.toLowerCase();
        if (!matchName.includes(q)) return false;
      }
      return true;
    });
  }, [selectedCategory, onlyAvailable, isCareer, currentYear, searchQuery]);

  // When opening order modal, initialize seat config
  const handleOpenOrder = (ac: HistoricalAircraft, modeType: "buy" | "lease", buyUsed = false) => {
    const isOutOfProd = isCareer && ac.productionEndYear < currentYear;
    const finalBuyUsed = buyUsed || isOutOfProd;

    setSelectedAircraft(ac);
    setOrderMode(modeType);
    setIsBuyingUsed(finalBuyUsed);
    setCustomReg(generateRegistration(fleet));
    setNickname("");
    setFeedback(null);

    // Initial seat config: Default to max capacity in economy
    setEconomySeats(ac.passengerCapacityMax);
    setBusinessSeats(0);
    setFirstSeats(0);
  };

  const handleCloseModal = () => {
    setSelectedAircraft(null);
    setOrderMode(null);
    setFeedback(null);
  };

  // Seat space calculations
  const maxCap = selectedAircraft?.passengerCapacityMax || 0;
  const spaceUsed = economySeats + businessSeats * 2 + firstSeats * 3;
  const remainingSpace = maxCap - spaceUsed;
  const totalConfiguredSeats = economySeats + businessSeats + firstSeats;

  // Preset handlers
  const applyPresetAllEconomy = () => {
    setEconomySeats(maxCap);
    setBusinessSeats(0);
    setFirstSeats(0);
  };

  const applyPresetTwoClass = () => {
    if (maxCap <= 25) {
      applyPresetAllEconomy();
      return;
    }
    const biz = Math.max(4, Math.floor((maxCap * 0.14) / 2) * 2);
    const eco = Math.max(0, maxCap - biz * 2);
    setEconomySeats(eco);
    setBusinessSeats(biz);
    setFirstSeats(0);
  };

  const applyPresetThreeClass = () => {
    if (maxCap <= 70) {
      applyPresetTwoClass();
      return;
    }
    const first = Math.max(2, Math.floor((maxCap * 0.05) / 2) * 2);
    const biz = Math.max(4, Math.floor((maxCap * 0.12) / 2) * 2);
    const eco = Math.max(0, maxCap - first * 3 - biz * 2);
    setEconomySeats(eco);
    setBusinessSeats(biz);
    setFirstSeats(first);
  };

  const handleConfirmOrder = () => {
    if (!selectedAircraft || !orderMode) return;

    if (orderMode === "buy") {
      const seatConfig: SeatConfiguration = {
        economySeats,
        businessSeats,
        firstSeats,
        totalSeats: totalConfiguredSeats,
      };

      const res = buyAircraft(selectedAircraft.id, {
        customRegistration: customReg,
        nickname: nickname.trim() || undefined,
        isUsed: isBuyingUsed,
        seatConfig,
      });

      setFeedback({ success: res.success, message: res.message || "" });
      if (res.success) {
        setCustomReg(generateRegistration(fleet));
      }
    } else {
      // Leased aircraft
      const res = leaseAircraft(selectedAircraft.id, {
        customRegistration: customReg,
        nickname: nickname.trim() || undefined,
      });

      setFeedback({ success: res.success, message: res.message || "" });
      if (res.success) {
        setCustomReg(generateRegistration(fleet));
      }
    }
  };

  return (
    <div className="market-screen">
      {/* Header */}
      <div className="panel market-header">
        <div className="market-header-main">
          <div>
            <h1>Aircraft Market</h1>
            <p className="tagline">
              Historical Catalog · World Year: <b>{currentYear}</b> ({gameDate.day}. {gameDate.month}. {currentYear})
            </p>
          </div>
          <div className="market-stats">
            <div className="stat">
              <span className="stat-label">Available Capital</span>
              <span className="stat-value big gold">{formatMoney(cash)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Current Fleet</span>
              <span className="stat-value big">{fleet.length} planes</span>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="market-filters">
          <div className="market-search">
            <input
              type="text"
              placeholder="Search manufacturer or model (e.g. Boeing, 727, DC-9)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="market-input"
            />
          </div>

          <div className="market-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`cat-btn ${selectedCategory === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {isCareer && (
            <label className="market-toggle">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
              />
              <span>Show only aircraft available in {currentYear}</span>
            </label>
          )}
        </div>
      </div>

      {/* Aircraft Grid */}
      <div className="market-grid">
        {filteredAircraft.length === 0 ? (
          <div className="panel market-empty">
            <p>No aircraft match your filter criteria.</p>
            {onlyAvailable && (
              <button type="button" className="secondary" onClick={() => setOnlyAvailable(false)}>
                Show future aircraft models
              </button>
            )}
          </div>
        ) : (
          filteredAircraft.map((ac) => {
            const isUnlocked = !isCareer || ac.introductionYear <= currentYear;
            const isOutOfProduction = isCareer && ac.productionEndYear < currentYear;
            const usedStats = calculateUsedAircraftStats(ac.historicalPriceUsd, ac.introductionYear, currentYear);

            const canAffordNew = !Number.isFinite(cash) || cash >= ac.historicalPriceUsd;
            const canAffordUsed = !Number.isFinite(cash) || cash >= usedStats.priceUsd;
            const canAffordLease = !Number.isFinite(cash) || cash >= ac.monthlyLeaseRateUsd;

            const imageUrl = getAircraftImageUrl(ac.id);

            return (
              <div
                key={ac.id}
                className={`panel market-card ${!isUnlocked ? "locked" : ""}`}
              >
                {/* Aircraft Artwork */}
                <div className="market-card-img-wrap">
                  <img
                    src={imageUrl}
                    alt={`${ac.manufacturer} ${ac.model}`}
                    className="market-card-img"
                    loading="lazy"
                  />
                  <div className="img-overlay-badges">
                    <span className="ac-cat-badge">{ac.category}</span>
                    {isOutOfProduction && (
                      <span className="tag busy">Out of production ({ac.productionEndYear})</span>
                    )}
                  </div>
                </div>

                <div className="market-card-top">
                  <div>
                    <h3 className="ac-title">
                      {ac.manufacturer} {ac.model}
                    </h3>
                    <small className="ac-years">
                      Introduced: {ac.introductionYear} · Production End: {ac.productionEndYear}
                    </small>
                  </div>
                  {isUnlocked ? (
                    <span className="tag open">Available ({ac.introductionYear})</span>
                  ) : (
                    <span className="tag busy">Unlocks: {ac.introductionYear}</span>
                  )}
                </div>

                {/* Specs: Showing ONLY MAX Capacity */}
                <div className="ac-specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Max Capacity</span>
                    <span className="spec-val gold">{ac.passengerCapacityMax} seats</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Range</span>
                    <span className="spec-val">{ac.rangeKm.toLocaleString("en-US")} km</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Cruise Speed</span>
                    <span className="spec-val">{ac.cruiseSpeedKmh} km/h</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Fuel Burn</span>
                    <span className="spec-val">{ac.fuelBurnKgPerHour.toLocaleString("en-US")} kg/h</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Min. Runway</span>
                    <span className="spec-val">{ac.minRunwayMeters.toLocaleString("en-US")} m</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Cockpit Crew</span>
                    <span className="spec-val">
                      {ac.balancing.cockpitCrew} {ac.balancing.cockpitCrew === 3 ? "(3-crew incl. FE)" : "pilots"}
                    </span>
                  </div>
                </div>

                {/* Pricing row */}
                <div className="market-pricing">
                  <div className="price-col">
                    <span className="price-label">
                      {isOutOfProduction ? "Pre-owned market price:" : "Brand new from factory:"}
                    </span>
                    <span className="price-val gold">
                      {formatMoney(isOutOfProduction ? usedStats.priceUsd : ac.historicalPriceUsd)}
                    </span>
                    {!isOutOfProduction && (
                      <small className="used-price-hint">
                        Pre-owned from {formatMoney(usedStats.priceUsd)}
                      </small>
                    )}
                  </div>
                  <div className="price-col">
                    <span className="price-label">Monthly Lease</span>
                    <span className="price-val cyan">{formatMoney(ac.monthlyLeaseRateUsd)} / mo</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="market-card-actions three-way">
                  {!isOutOfProduction && (
                    <button
                      type="button"
                      className="primary buy-btn"
                      disabled={!isUnlocked || !canAffordNew}
                      onClick={() => handleOpenOrder(ac, "buy", false)}
                      title={!canAffordNew ? "Insufficient cash to purchase brand new" : "Purchase brand new from factory"}
                    >
                      Buy New
                    </button>
                  )}

                  <button
                    type="button"
                    className="secondary buy-used-btn"
                    disabled={!isUnlocked || !canAffordUsed}
                    onClick={() => handleOpenOrder(ac, "buy", true)}
                    title="Purchase pre-owned aircraft from used market at reduced price"
                  >
                    {isOutOfProduction ? "Buy Pre-owned" : "Used Market"}
                  </button>

                  <button
                    type="button"
                    className="secondary lease-btn"
                    disabled={!isUnlocked || !canAffordLease}
                    onClick={() => handleOpenOrder(ac, "lease")}
                    title="Operational lease with random cabin configuration pre-installed by lessor"
                  >
                    Lease
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order & Cabin Configurator Modal */}
      {selectedAircraft && orderMode && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="panel modal-content wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {orderMode === "buy"
                  ? isBuyingUsed
                    ? "Purchase Pre-Owned Aircraft (Used Market)"
                    : "Purchase Brand New Aircraft from Factory"
                  : "Operational Aircraft Lease"}
              </h2>
              <button type="button" className="close-btn" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            {/* Aircraft Header banner */}
            <div className="modal-aircraft-summary with-img">
              <img
                src={getAircraftImageUrl(selectedAircraft.id)}
                alt={selectedAircraft.model}
                className="modal-plane-thumb"
              />
              <div className="modal-summary-text">
                <span className="ac-cat-badge">{selectedAircraft.category}</span>
                <h3>
                  {selectedAircraft.manufacturer} {selectedAircraft.model}
                </h3>
                <p className="modal-era-note">
                  Max Capacity: <b>{selectedAircraft.passengerCapacityMax} seats</b> · Range:{" "}
                  <b>{selectedAircraft.rangeKm.toLocaleString("en-US")} km</b>
                </p>
                {isBuyingUsed && orderMode === "buy" && (
                  <span className="used-badge-tag">
                    ● Pre-owned aircraft: approx.{" "}
                    {calculateUsedAircraftStats(selectedAircraft.historicalPriceUsd, selectedAircraft.introductionYear, currentYear).ageYears}{" "}
                    years old · airframe condition approx.{" "}
                    {calculateUsedAircraftStats(selectedAircraft.historicalPriceUsd, selectedAircraft.introductionYear, currentYear).conditionPct}{" "}
                    %
                  </span>
                )}
              </div>
            </div>

            {feedback ? (
              <div className={`feedback-box ${feedback.success ? "success" : "error"}`}>
                <p>{feedback.message}</p>
                {feedback.success && (
                  <div className="feedback-actions">
                    <button type="button" className="primary" onClick={onNavigateToFleet}>
                      Go to Fleet ✈
                    </button>
                    <button type="button" className="secondary" onClick={handleCloseModal}>
                      Close
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Mode-specific Cabin Configuration section */}
                {orderMode === "buy" ? (
                  <div className="cabin-configurator-box">
                    <div className="config-header">
                      <h4>Cabin Seat Configuration</h4>
                      <span className={`space-badge ${remainingSpace < 0 ? "error" : ""}`}>
                        {remainingSpace >= 0
                          ? `Available space: ${remainingSpace} / ${maxCap} units`
                          : `Capacity exceeded by ${Math.abs(remainingSpace)}!`}
                      </span>
                    </div>

                    {/* Visual cabin distribution bar */}
                    <div className="cabin-visual-bar">
                      <div
                        className="bar-seg economy"
                        style={{ width: `${(economySeats / maxCap) * 100}%` }}
                        title={`Economy: ${economySeats} seats`}
                      />
                      <div
                        className="bar-seg business"
                        style={{ width: `${((businessSeats * 2) / maxCap) * 100}%` }}
                        title={`Business: ${businessSeats} seats (${businessSeats * 2} space units)`}
                      />
                      <div
                        className="bar-seg first"
                        style={{ width: `${((firstSeats * 3) / maxCap) * 100}%` }}
                        title={`First Class: ${firstSeats} seats (${firstSeats * 3} space units)`}
                      />
                    </div>

                    <div className="cabin-legend">
                      <span className="legend-item economy">● Economy: {economySeats}</span>
                      <span className="legend-item business">● Business (2x space): {businessSeats}</span>
                      <span className="legend-item first">● First Class (3x space): {firstSeats}</span>
                      <span className="legend-total">Total passengers: <b>{totalConfiguredSeats} pax</b></span>
                    </div>

                    {/* Quick Presets */}
                    <div className="cabin-presets">
                      <span className="preset-label">Quick Presets:</span>
                      <button type="button" className="preset-btn" onClick={applyPresetAllEconomy}>
                        All Economy ({maxCap} seats)
                      </button>
                      <button type="button" className="preset-btn" onClick={applyPresetTwoClass}>
                        2-Class (Standard)
                      </button>
                      {maxCap > 70 && (
                        <button type="button" className="preset-btn" onClick={applyPresetThreeClass}>
                          3-Class (Long Haul)
                        </button>
                      )}
                    </div>

                    {/* Steppers */}
                    <div className="seat-steppers-grid">
                      <div className="stepper-item">
                        <span className="stepper-label">Economy Class (1:1)</span>
                        <div className="stepper-controls">
                          <button
                            type="button"
                            className="step-btn"
                            disabled={economySeats <= 0}
                            onClick={() => setEconomySeats(Math.max(0, economySeats - 4))}
                          >
                            -
                          </button>
                          <span className="stepper-count">{economySeats}</span>
                          <button
                            type="button"
                            className="step-btn"
                            disabled={remainingSpace < 1}
                            onClick={() => setEconomySeats(economySeats + Math.min(4, remainingSpace))}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="stepper-item">
                        <span className="stepper-label">Business Class (1:2)</span>
                        <div className="stepper-controls">
                          <button
                            type="button"
                            className="step-btn"
                            disabled={businessSeats <= 0}
                            onClick={() => setBusinessSeats(Math.max(0, businessSeats - 2))}
                          >
                            -
                          </button>
                          <span className="stepper-count">{businessSeats}</span>
                          <button
                            type="button"
                            className="step-btn"
                            disabled={remainingSpace < 2}
                            onClick={() => setBusinessSeats(businessSeats + 2)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="stepper-item">
                        <span className="stepper-label">First Class (1:3)</span>
                        <div className="stepper-controls">
                          <button
                            type="button"
                            className="step-btn"
                            disabled={firstSeats <= 0}
                            onClick={() => setFirstSeats(Math.max(0, firstSeats - 2))}
                          >
                            -
                          </button>
                          <span className="stepper-count">{firstSeats}</span>
                          <button
                            type="button"
                            className="step-btn"
                            disabled={remainingSpace < 3}
                            onClick={() => setFirstSeats(firstSeats + 2)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="lease-cabin-notice">
                    <span className="notice-icon">ⓘ</span>
                    <div>
                      <h4>Lessor Pre-Configured Cabin</h4>
                      <p>
                        Under operational leasing, aircraft are supplied directly with existing cabin seating.
                        The seat distribution (Economy / Business / First) is assigned randomly by the lessor
                        upon delivery.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tail registration & nickname */}
                <div className="modal-fields">
                  <label className="field">
                    <span>Tail Registration</span>
                    <input
                      type="text"
                      maxLength={10}
                      value={customReg}
                      onChange={(e) => setCustomReg(e.target.value.toUpperCase())}
                      placeholder="e.g. N101AM, G-BVOZ"
                    />
                    <small>Unique aircraft identifier displayed on the fuselage.</small>
                  </label>

                  <label className="field">
                    <span>Aircraft Nickname (optional)</span>
                    <input
                      type="text"
                      maxLength={32}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="e.g. Spirit of New York, Clipper America"
                    />
                  </label>
                </div>

                {/* Financial breakdown */}
                {(() => {
                  const usedPrice = calculateUsedAircraftStats(
                    selectedAircraft.historicalPriceUsd,
                    selectedAircraft.introductionYear,
                    currentYear,
                  ).priceUsd;
                  const finalCost =
                    orderMode === "buy"
                      ? isBuyingUsed
                        ? usedPrice
                        : selectedAircraft.historicalPriceUsd
                      : selectedAircraft.monthlyLeaseRateUsd;

                  return (
                    <div className="modal-cost-breakdown">
                      <div className="cost-row">
                        <span>Current cash balance:</span>
                        <span className="gold">{formatMoney(cash)}</span>
                      </div>
                      <div className="cost-row">
                        <span>
                          {orderMode === "buy"
                            ? isBuyingUsed
                              ? "Pre-owned market price:"
                              : "Factory purchase price:"
                            : "Initial lease deposit (1st month):"}
                        </span>
                        <span className="red">-{formatMoney(finalCost)}</span>
                      </div>
                      <div className="divider" />
                      <div className="cost-row total">
                        <span>Balance after transaction:</span>
                        <span className="gold">
                          {formatMoney(
                            Number.isFinite(cash) ? cash - finalCost : Infinity,
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="modal-actions">
                  <button type="button" className="secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary"
                    disabled={remainingSpace < 0}
                    onClick={handleConfirmOrder}
                  >
                    {orderMode === "buy"
                      ? isBuyingUsed
                        ? `Confirm Pre-Owned Purchase for ${formatMoney(
                            calculateUsedAircraftStats(
                              selectedAircraft.historicalPriceUsd,
                              selectedAircraft.introductionYear,
                              currentYear,
                            ).priceUsd,
                          )}`
                        : `Confirm Purchase for ${formatMoney(selectedAircraft.historicalPriceUsd)}`
                      : `Confirm Lease for ${formatMoney(selectedAircraft.monthlyLeaseRateUsd)} / mo`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
