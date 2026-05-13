import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import {
  NavigationModeContext,
  type NavigationMode,
} from '@/context/NavigationModeContext';

export function AppLayout() {
  const [mode, setMode] = useState<NavigationMode>('current-work');

  return (
    <NavigationModeContext.Provider value={{ mode, setMode }}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex flex-1 flex-col min-h-0 min-w-0">
          <Outlet />
        </main>
      </div>
    </NavigationModeContext.Provider>
  );
}
