// Menu items for later milestones are shown disabled so the layout is final from the start.
const ITEMS = [
  { icon: "◈", name: "Dashboard", ready: true },
  { icon: "◎", name: "World Map", ready: false },
  { icon: "✈", name: "Fleet", ready: false },
  { icon: "⛁", name: "Aircraft Market", ready: false },
  { icon: "⇄", name: "Routes", ready: false },
  { icon: "▣", name: "Airports", ready: false },
  { icon: "$", name: "Finance", ready: false },
  { icon: "⚗", name: "Research", ready: false },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      {ITEMS.map((i) => (
        <button key={i.name} className={i.ready ? "nav active" : "nav"} disabled={!i.ready}>
          <span className="nav-name"><span className="nav-icon">{i.icon}</span>{i.name}</span>
          {!i.ready && <small>soon</small>}
        </button>
      ))}
    </nav>
  );
}
