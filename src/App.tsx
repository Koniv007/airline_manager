import { useEffect, useState } from "react";
import { auth } from "./auth/auth.ts";
import type { User } from "./auth/authService.ts";
import { enterWorld, tick } from "./game/gameStore.ts";
import type { WorldMode } from "./worlds/worldRules.ts";
import type { GameServer } from "./worlds/serverList.ts";
import AuthScreen from "./ui/screens/AuthScreen.tsx";
import WorldSelectScreen from "./ui/screens/WorldSelectScreen.tsx";
import ServerSelectScreen from "./ui/screens/ServerSelectScreen.tsx";
import TopBar from "./ui/TopBar.tsx";
import Sidebar from "./ui/Sidebar.tsx";
import Dashboard from "./ui/Dashboard.tsx";

type Screen = { name: "worlds" } | { name: "servers"; mode: WorldMode } | { name: "game" };

export default function App() {
  const [user, setUser] = useState<User | null>(() => auth.getCurrentUser());
  const [screen, setScreen] = useState<Screen>({ name: "worlds" });

  // One game tick per real second.
  useEffect(() => {
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!user) {
    return <AuthScreen onAuthenticated={(u) => { setUser(u); setScreen({ name: "worlds" }); }} />;
  }

  if (screen.name === "worlds") {
    return (
      <WorldSelectScreen
        user={user}
        onSelect={(mode) => setScreen({ name: "servers", mode })}
        onSignOut={() => { auth.signOut(); setUser(null); }}
      />
    );
  }

  if (screen.name === "servers") {
    return (
      <ServerSelectScreen
        user={user}
        mode={screen.mode}
        onBack={() => setScreen({ name: "worlds" })}
        onJoin={(server: GameServer) => { enterWorld(server, { id: user.id, displayName: user.displayName, isGuest: user.isGuest }); setScreen({ name: "game" }); }}
      />
    );
  }

  return (
    <div className="app">
      <TopBar onLeave={() => setScreen({ name: "worlds" })} />
      <Sidebar />
      <main className="content">
        <Dashboard />
      </main>
    </div>
  );
}
