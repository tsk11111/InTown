import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LOGO = require('../assets/images/InTownlogo.png');

interface Step {
  emoji: string;
  title: string;
  body: string;
  tag?: string;
  activeTab?: 'events' | 'calendar' | 'profile';
  category?: 'social' | 'trips' | 'music' | 'culture' | 'reading';
}

const STEPS: Step[] = [
  {
    emoji: '🏙️',
    title: 'Welcome to InTown!',
    body: "Your guide to discovering events and meeting people in your city. Want a quick tour of the app?",
  },
  {
    emoji: '🔍',
    title: 'Events tab',
    tag: 'TAB 2 OF 3',
    body: 'Browse upcoming events near you. Scroll through the feed or use the category chips: Sports, Music, Culture and more. Tap the Filters button to narrow results by city and price.',
    activeTab: 'events',
    category: 'social',
  },
  {
    emoji: '🎟️',
    title: 'Joining an event',
    tag: 'EVENTS',
    body: 'Tap any event card to open its detail page. Read the description, check the date, venue, and price, then tap "Join event" to sign up. You can leave anytime from the same screen.',
    category: 'trips',
  },
  {
    emoji: '💬',
    title: 'Event chat',
    tag: 'CHAT',
    body: 'On any upcoming event\'s detail page, tap "Join chat" to enter a group chat with other attendees. Messages are visible to everyone who joins. Chat closes once an event ends.',
    category: 'music',
  },
  {
    emoji: '📅',
    title: 'Calendar tab',
    tag: 'TAB 1 OF 3',
    body: 'All the events you\'ve joined appear here. Toggle between Upcoming and Past to see your history. Tap any event to view its details or leave it.',
    activeTab: 'calendar',
    category: 'culture',
  },
  {
    emoji: '👤',
    title: 'Your profile',
    tag: 'TAB 3 OF 3',
    body: 'Tap your name to change it. Under Location, tap City to switch to a different city. Toggle the "New in city" badge and pick your preferred theme: Light, Dark, or System.',
    activeTab: 'profile',
    category: 'reading',
  },
  {
    emoji: '🎊',
    title: "You're all set!",
    body: 'Go explore events, join conversations, and make the most of your city. Have fun!',
  },
];

const MOCK_TABS: {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { key: 'calendar', label: 'Calendar', icon: 'calendar-outline', activeIcon: 'calendar' },
  { key: 'events', label: 'Events', icon: 'compass-outline', activeIcon: 'compass' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

function MockTabBar({ activeTab, colors }: { activeTab?: string; colors: typeof Colors.light }) {
  if (!activeTab) return null;
  return (
    <View style={[mockStyles.container, { borderColor: colors.border }]}>
      <Text style={[mockStyles.label, { color: colors.textTertiary }]}>TAP HERE IN THE APP</Text>
      <View style={[mockStyles.bar, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {MOCK_TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <View key={tab.key} style={mockStyles.tab}>
              {active && <View style={[mockStyles.indicator, { backgroundColor: colors.primary }]} />}
              <Ionicons
                name={active ? tab.activeIcon : tab.icon}
                size={24}
                color={active ? colors.primary : colors.tabIconDefault}
              />
              <Text style={[mockStyles.tabLabel, { color: active ? colors.primary : colors.tabIconDefault, fontWeight: active ? '600' : '400' }]}>
                {tab.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const mockStyles = StyleSheet.create({
  container: { marginTop: Theme.spacing.lg, alignItems: 'center', gap: 8 },
  label: { fontSize: Theme.fontSize.xs, fontWeight: '600', letterSpacing: 0.5 },
  bar: {
    flexDirection: 'row',
    borderRadius: Theme.radius.xl,
    borderWidth: 0.5,
    overflow: 'hidden',
    width: '100%',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3, position: 'relative' },
  indicator: { position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, borderRadius: 1 },
  tabLabel: { fontSize: Theme.fontSize.xs },
});

export default function TutorialScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isWelcome = step === 0;
  const isDone = step === STEPS.length - 1;
  const isTourStep = !isWelcome && !isDone;
  const progress = step / (STEPS.length - 1);

  const catColors = current.category
    ? (colors[current.category as keyof typeof colors] as { bg: string; text: string })
    : null;
  const illustrationBg = catColors?.bg ?? colors.primaryLight;
  const illustrationText = catColors?.text ?? colors.primary;

  const goNext = () => {
    if (isDone) {
      router.replace('/city-onboarding');
    } else {
      setStep((s) => s + 1);
    }
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1));
  const skip = () => router.replace('/city-onboarding');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        {isTourStep ? (
          <Text style={[styles.stepCounter, { color: colors.textTertiary }]}>
            {step} of {STEPS.length - 2}
          </Text>
        ) : (
          <View />
        )}
        {isTourStep && (
          <TouchableOpacity onPress={skip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {isWelcome ? (
          <Image source={LOGO} style={styles.logoImg} contentFit="contain" />
        ) : (
          <View style={[styles.illustration, { backgroundColor: illustrationBg }]}>
            <Text style={styles.emoji}>{current.emoji}</Text>
          </View>
        )}

        {current.tag && (
          <View style={[styles.tag, { backgroundColor: illustrationBg }]}>
            <Text style={[styles.tagText, { color: illustrationText }]}>{current.tag}</Text>
          </View>
        )}

        <Text style={[styles.title, { color: colors.text }]}>{current.title}</Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>{current.body}</Text>

        <MockTabBar activeTab={current.activeTab} colors={colors} />
      </View>

      <View style={styles.bottom}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progress * 100}%` },
            ]}
          />
        </View>

        {isWelcome ? (
          <View style={styles.welcomeButtons}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={goNext}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Show me around</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ghostBtn, { borderColor: colors.border }]}
              onPress={skip}
              activeOpacity={0.7}
            >
              <Text style={[styles.ghostBtnText, { color: colors.textSecondary }]}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        ) : isDone ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={goNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Get started</Text>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={goPrev}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
              <Text style={[styles.navBtnText, { color: colors.textSecondary }]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnNext, { backgroundColor: colors.primary }]}
              onPress={goNext}
              activeOpacity={0.85}
            >
              <Text style={[styles.navBtnText, { color: '#fff' }]}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    minHeight: 44,
  },
  stepCounter: { fontSize: Theme.fontSize.sm, fontWeight: '500' },
  skipText: { fontSize: Theme.fontSize.sm, fontWeight: '500' },

  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xl,
    alignItems: 'center',
  },

  logoImg: {
    width: 240,
    height: 110,
    marginBottom: Theme.spacing.xl,
  },

  illustration: {
    width: 130,
    height: 130,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xl,
  },
  emoji: { fontSize: 60 },

  tag: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    marginBottom: Theme.spacing.md,
  },
  tagText: { fontSize: Theme.fontSize.xs, fontWeight: '700', letterSpacing: 0.6 },

  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },

  body: {
    fontSize: Theme.fontSize.base,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 340,
  },

  bottom: {
    paddingHorizontal: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xl,
    gap: Theme.spacing.lg,
  },

  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },

  welcomeButtons: { gap: Theme.spacing.sm },
  primaryBtn: {
    height: 52,
    borderRadius: Theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: Theme.fontSize.base, fontWeight: '600' },

  ghostBtn: {
    height: 48,
    borderRadius: Theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  ghostBtnText: { fontSize: Theme.fontSize.base, fontWeight: '500' },

  navButtons: { flexDirection: 'row', gap: Theme.spacing.sm },
  navBtn: {
    flex: 1,
    height: 50,
    borderRadius: Theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 0.5,
  },
  navBtnNext: { borderWidth: 0 },
  navBtnText: { fontSize: Theme.fontSize.base, fontWeight: '600' },
});
