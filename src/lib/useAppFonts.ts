import { useFonts } from 'expo-font';
import { PirataOne_400Regular } from '@expo-google-fonts/pirata-one';
import {
  Cinzel_400Regular,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
  Cinzel_800ExtraBold,
  Cinzel_900Black,
} from '@expo-google-fonts/cinzel';
import {
  IMFellEnglish_400Regular,
  IMFellEnglish_400Regular_Italic,
} from '@expo-google-fonts/im-fell-english';

/** Loads every typeface in the Cartographer's Cache system. Gate render on this. */
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    PirataOne_400Regular,
    Cinzel_400Regular,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    Cinzel_800ExtraBold,
    Cinzel_900Black,
    IMFellEnglish_400Regular,
    IMFellEnglish_400Regular_Italic,
  });
  return loaded;
}
