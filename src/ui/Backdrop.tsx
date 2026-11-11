// Animated sky behind the menu screens: twinkling stars, drifting clouds, a plane flying by.
export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="stars" />
      <div className="cloud c1" />
      <div className="cloud c2" />
      <div className="cloud c3" />
      <svg className="flyby" viewBox="0 0 24 24" width="38" height="38">
        <path fill="#fff" transform="rotate(90 12 12)"
          d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
      <div className="contrail" />
    </div>
  );
}
