import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-0 min-w-0">
        <TopBar />
        <main className="flex flex-1 flex-col min-h-0 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
