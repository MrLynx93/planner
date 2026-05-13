import { createContext, useContext } from 'react';

export type NavigationMode = 'current-work' | 'management';

interface NavigationModeContextValue {
  mode: NavigationMode;
  setMode: (mode: NavigationMode) => void;
}

export const NavigationModeContext = createContext<NavigationModeContextValue>({
  mode: 'current-work',
  setMode: () => {},
});

export function useNavigationMode() {
  return useContext(NavigationModeContext);
}
