export type TabName =
  | "Dashboard"
  | "Aircraft Market"
  | "Fleet"
  | "World Map"
  | "Routes"
  | "Airports"
  | "Finance"
  | "Research";

interface MenuItem {
  readonly icon: string;
  readonly name: TabName;
  readonly ready: boolean;
}

const ITEMS: readonly MenuItem[] = [
  { icon: "◈", name: "Dashboard", ready: true },
  { icon: "⛁", name: "Aircraft Market", ready: true },
  { icon: "✈", name: "Fleet", ready: true },
  { icon: "◎", name: "World Map", ready: true },
  { icon: "⇄", name: "Routes", ready: false },
  { icon: "▣", name: "Airports", ready: false },
  { icon: "$", name: "Finance", ready: false },
  { icon: "⚗", name: "Research", ready: false },
];

interface SidebarProps {
  readonly activeTab: TabName;
  readonly onSelectTab: (tab: TabName) => void;
}

export default function Sidebar({ activeTab, onSelectTab }: SidebarProps) {
  return (
    <nav className="sidebar">
      {ITEMS.map((i) => {
        const isActive = activeTab === i.name;
        return (
          <button
            key={i.name}
            type="button"
            className={isActive ? "nav active" : "nav"}
            disabled={!i.ready}
            onClick={() => i.ready && onSelectTab(i.name)}
          >
            <span className="nav-name">
              <span className="nav-icon">{i.icon}</span>
              {i.name}
            </span>
            {!i.ready && <small>soon</small>}
          </button>
        );
      })}
    </nav>
  );
}
