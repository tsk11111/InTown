import { AuthProvider } from '@/context/auth';
import { ChatProvider } from '@/context/chat';
import { EventsProvider } from '@/context/events';
import { LocationProvider } from '@/context/location';
import { ThemeProvider } from '@/context/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    // Uses system fonts for now - swap with custom fonts here if desired
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider>
    <LocationProvider>
    <AuthProvider>
      <EventsProvider>
      <ChatProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="create-event"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="event/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="events-nearby"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="city-picker"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="chat/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Event Details',
            }}
          />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ChatProvider>
      </EventsProvider>
    </AuthProvider>
    </LocationProvider>
    </ThemeProvider>
  );
}
