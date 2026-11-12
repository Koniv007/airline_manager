import { useState } from "react";
import { useGameState, sellAircraft, returnLeasedAircraft } from "../../game/gameStore.ts";
import { formatMoney } from "../../economy/money.ts";
import { calculateFleetValue, calculateResaleValue } from "../../fleet/fleetService.ts";
import type { PlayerAircraft } from "../../fleet/types.ts";
import { getAircraftImageUrl } from "../../aircraft/aircraftImages.ts";

interface FleetScreenProps {
  onNavigateToMarket: () => void;
}

export default function FleetScreen({ onNavigateToMarket }: FleetScreenProps) {
  const { fleet, cash } = useGameState();
  const [selectedActionAircraft, setSelectedActionAircraft] = useState<PlayerAircraft | null>(null);
  const [actionType, setActionType] = useState<"sell" | "return" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const ownedCount = fleet.filter((a) => a.ownership === "purchased").length;
  const leasedCount = fleet.filter((a) => a.ownership === "leased").length;
  const totalFleetValue = calculateFleetValue(fleet);
  const totalPaxCapacity = fleet.reduce((sum, a) => sum + a.passengerCapacity, 0);

  const filteredFleet = fleet.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const str = `${a.registration} ${a.nickname || ""} ${a.manufacturer} ${a.model}`.toLowerCase();
    return str.includes(q);
  });

  const handleOpenAction = (aircraft: PlayerAircraft, type: "sell" | "return") => {
    setSelectedActionAircraft(aircraft);
    setActionType(type);
    setFeedback(null);
  };

  const handleCloseModal = () => {
    setSelectedActionAircraft(null);
    setActionType(null);
    setFeedback(null);
  };

  const handleConfirmAction = () => {
    if (!selectedActionAircraft || !actionType) return;

    if (actionType === "sell") {
      const res = sellAircraft(selectedActionAircraft.id);
      if (res.success) {
        setFeedback(res.message || "Aircraft was successfully sold.");
      } else {
        setFeedback(res.message || "Error selling aircraft.");
      }
    } else {
      const res = returnLeasedAircraft(selectedActionAircraft.id);
      if (res.success) {
        setFeedback(res.message || "Lease was successfully terminated.");
      } else {
        setFeedback(res.message || "Error terminating lease.");
      }
    }
  };

  return (
    <div className="fleet-screen">
      {/* Header */}
      <div className="panel fleet-header">
        <div className="fleet-header-main">
          <div>
            <h1>Fleet Management</h1>
            <p className="tagline">Active aircraft overview, airframe condition, and technical specifications</p>
          </div>
          <button type="button" className="primary" onClick={onNavigateToMarket}>
            + Acquire Aircraft (Market)
          </button>
        </div>

        {/* Stat Cards */}
        <div className="fleet-stats-cards">
          <div className="stat-card">
            <span className="stat-label">Total Fleet</span>
            <span className="stat-value big">{fleet.length}</span>
            <small>aircraft</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">Owned</span>
            <span className="stat-value big gold">{ownedCount}</span>
            <small>aircraft</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">On Operational Lease</span>
            <span className="stat-value big cyan">{leasedCount}</span>
            <small>aircraft</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">Estimated Fleet Value</span>
            <span className="stat-value big gold">{formatMoney(totalFleetValue)}</span>
            <small>fair market value</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Passenger Capacity</span>
            <span className="stat-value big">{totalPaxCapacity.toLocaleString("en-US")}</span>
            <small>seats</small>
          </div>
        </div>
      </div>

      {/* Fleet Content */}
      {fleet.length === 0 ? (
        <div className="panel fleet-empty-state">
          <div className="empty-icon">✈</div>
          <h2>Your hangars are currently empty</h2>
          <p>
            In 1975, your airline begins writing aviation history. With a starting capital of{" "}
            <b>{formatMoney(cash)}</b>, you can purchase your first turboprop (DHC-6 Twin Otter), a
            regional Fokker F28, a reliable DC-9, or take advantage of operational leasing to field a
            Boeing 737 or the iconic Boeing 727.
          </p>
          <button type="button" className="primary big-cta" onClick={onNavigateToMarket}>
            Go to Aircraft Market & Acquire Aircraft ✈
          </button>
        </div>
      ) : (
        <div className="fleet-list-container">
          {fleet.length > 3 && (
            <div className="fleet-search-bar">
              <input
                type="text"
                placeholder="Filter by registration, nickname, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="market-input"
              />
            </div>
          )}

          <div className="fleet-grid">
            {filteredFleet.map((plane) => {
              const isOwned = plane.ownership === "purchased";
              const resaleValue = calculateResaleValue(plane);
              const imageUrl = getAircraftImageUrl(plane.modelId);
              const sc = plane.seatConfiguration || {
                economySeats: plane.passengerCapacity,
                businessSeats: 0,
                firstSeats: 0,
                totalSeats: plane.passengerCapacity,
              };

              return (
                <div key={plane.id} className="panel fleet-card">
                  {/* Plane Illustration */}
                  <div className="fleet-card-img-wrap">
                    <img
                      src={imageUrl}
                      alt={`${plane.manufacturer} ${plane.model}`}
                      className="fleet-card-img"
                      loading="lazy"
                    />
                    <div className="img-overlay-badges">
                      <span className="ac-cat-badge">{plane.category}</span>
                      {plane.isUsed ? (
                        <span className="tag busy">Pre-owned ({plane.ageYears} yrs)</span>
                      ) : (
                        <span className="tag open">Brand New</span>
                      )}
                    </div>
                  </div>

                  <div className="fleet-card-header">
                    <div className="reg-badge-box">
                      <span className="reg-icon">✈</span>
                      <div>
                        <div className="reg-text">{plane.registration}</div>
                        {plane.nickname && <div className="reg-nick">“{plane.nickname}”</div>}
                      </div>
                    </div>
                    <div>
                      {isOwned ? (
                        <span className="badge career">Owned</span>
                      ) : (
                        <span className="badge sandbox">Leased</span>
                      )}
                    </div>
                  </div>

                  <div className="fleet-model-title">
                    <h3>
                      {plane.manufacturer} {plane.model}
                    </h3>
                  </div>

                  {/* Condition & Hours */}
                  <div className="fleet-condition-box">
                    <div className="cond-labels">
                      <span>Airframe Condition</span>
                      <span className="cond-pct">{plane.conditionPct} %</span>
                    </div>
                    <div className="bar">
                      <div className="fill" style={{ width: `${plane.conditionPct}%` }} />
                    </div>
                  </div>

                  {/* Seat Configuration breakdown */}
                  <div className="fleet-cabin-box">
                    <div className="fleet-cabin-header">
                      <span className="spec-label">Cabin Configuration</span>
                      <span className="spec-val gold">{plane.passengerCapacity} seats</span>
                    </div>
                    <div className="cabin-visual-bar mini">
                      <div
                        className="bar-seg economy"
                        style={{ width: `${(sc.economySeats / plane.maxCapacity) * 100}%` }}
                      />
                      <div
                        className="bar-seg business"
                        style={{ width: `${((sc.businessSeats * 2) / plane.maxCapacity) * 100}%` }}
                      />
                      <div
                        className="bar-seg first"
                        style={{ width: `${((sc.firstSeats * 3) / plane.maxCapacity) * 100}%` }}
                      />
                    </div>
                    <div className="fleet-cabin-details">
                      <span>{sc.economySeats} Eco</span>
                      {sc.businessSeats > 0 && <span> · {sc.businessSeats} Biz</span>}
                      {sc.firstSeats > 0 && <span> · {sc.firstSeats} First</span>}
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="ac-specs-grid compact">
                    <div className="spec-item">
                      <span className="spec-label">Range</span>
                      <span className="spec-val">{plane.rangeKm.toLocaleString("en-US")} km</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Cruise Speed</span>
                      <span className="spec-val">{plane.cruiseSpeedKmh} km/h</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Fuel Burn</span>
                      <span className="spec-val">
                        {plane.fuelBurnKgPerHour.toLocaleString("en-US")} kg/h
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Flight Hours</span>
                      <span className="spec-val">{plane.flightHours.toLocaleString("en-US")} h</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Crew</span>
                      <span className="spec-val">
                        {plane.cockpitCrew} cockpit + {plane.cabinCrew} cabin
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Status</span>
                      <span className="spec-val status-idle">● Parked (idle)</span>
                    </div>
                  </div>

                  {/* Ownership & Value Footer */}
                  <div className="fleet-financial-row">
                    {isOwned ? (
                      <div>
                        <span className="spec-label">Estimated Resale Value</span>
                        <span className="price-val gold">{formatMoney(resaleValue)}</span>
                      </div>
                    ) : (
                      <div>
                        <span className="spec-label">Monthly Lease Payment</span>
                        <span className="price-val cyan">
                          {formatMoney(plane.monthlyLeaseUsd)} / mo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="fleet-card-actions">
                    {isOwned ? (
                      <button
                        type="button"
                        className="secondary danger-hover"
                        onClick={() => handleOpenAction(plane, "sell")}
                      >
                        Sell for {formatMoney(resaleValue)}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="secondary danger-hover"
                        onClick={() => handleOpenAction(plane, "return")}
                      >
                        Terminate Lease
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedActionAircraft && actionType && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="panel modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {actionType === "sell"
                  ? "Confirm Aircraft Sale"
                  : "Confirm Lease Termination"}
              </h2>
              <button type="button" className="close-btn" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <div className="modal-aircraft-summary with-img">
              <img
                src={getAircraftImageUrl(selectedActionAircraft.modelId)}
                alt={selectedActionAircraft.model}
                className="modal-plane-thumb"
              />
              <div className="modal-summary-text">
                <h3>
                  {selectedActionAircraft.manufacturer} {selectedActionAircraft.model} (
                  {selectedActionAircraft.registration})
                </h3>
                {selectedActionAircraft.nickname && <p>“{selectedActionAircraft.nickname}”</p>}
              </div>
            </div>

            {feedback ? (
              <div className="feedback-box success">
                <p>{feedback}</p>
                <div className="feedback-actions">
                  <button type="button" className="primary" onClick={handleCloseModal}>
                    Understood
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="confirm-text">
                  {actionType === "sell"
                    ? `Are you sure you want to sell this aircraft? A total of ${formatMoney(
                        calculateResaleValue(selectedActionAircraft),
                      )} will be credited to your company treasury.`
                    : `Are you sure you want to return this aircraft to the lessor? This will save ${formatMoney(
                        selectedActionAircraft.monthlyLeaseUsd,
                      )} per month in recurring lease fees.`}
                </p>

                <div className="modal-actions">
                  <button type="button" className="secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary danger-btn"
                    onClick={handleConfirmAction}
                  >
                    {actionType === "sell" ? "Confirm & Sell" : "Confirm & Return Aircraft"}
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
