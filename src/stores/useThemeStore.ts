import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, OceanColors, ForestColors, SunsetColors, LightColors, reevaluateStyles } from '@/lib/theme';
import { ThemeColors } from '@/lib/colors';

export type ThemeName = 'parchment' | 'dark' | 'ocean' | 'forest' | 'sunset';

interface ThemeState {
  themeName: ThemeName;
  colors: ThemeColors;
  setTheme: (name: ThemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeName: 'parchment',
      colors: LightColors,
      setTheme: (name) => {
        let newColors = LightColors;
        if (name === 'dark') newColors = DarkColors;
        else if (name === 'ocean') newColors = OceanColors;
        else if (name === 'forest') newColors = ForestColors;
        else if (name === 'sunset') newColors = SunsetColors;
        
        reevaluateStyles(newColors);
        set({ themeName: name, colors: newColors });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          reevaluateStyles(state.colors);
        }
      },
    }
  )
);

export function useTheme() {
  return useThemeStore();
}
