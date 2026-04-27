import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useLocation } from '@/context/location';
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  useEvents,
  type EventCategory,
  type OrganizerEvent,
} from '@/context/events';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type FilterCategory = 'All' | EventCategory;
const FILTER_CATEGORIES: FilterCategory[] = ['All', ...CATEGORIES];

function CategoryChip({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: typeof Colors.light;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primaryLight : colors.surface,
          borderColor: active ? colors.primaryMid : colors.border,
        },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, { color: active ? colors.primary : colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function EventCard({ event, colors }: { event: OrganizerEvent; colors: typeof Colors.light }) {
  const categoryColor = colors[event.category.toLowerCase() as keyof typeof colors] as
    | { bg: string; text: string }
    | undefined;
  const hasPhoto = event.photos.length > 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
    >
      {hasPhoto ? (
        <Image source={{ uri: event.photos[0] }} style={styles.cardImage} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.cardImage, { backgroundColor: categoryColor?.bg ?? colors.primaryLight }]}>
          <Text style={styles.cardEmoji}>{event.emoji || CATEGORY_EMOJI[event.category]}</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={[styles.badge, { backgroundColor: categoryColor?.bg ?? colors.primaryLight }]}>
          <Text style={[styles.badgeText, { color: categoryColor?.text ?? colors.primary }]}>
            {event.category}
          </Text>
        </View>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{event.title}</Text>
        <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
          🏠 {event.venue} · {event.location}
        </Text>
        <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
          📅 {event.date} · {event.time}
        </Text>
        <View style={styles.cardFooter}>
          <View>
            <Text style={[styles.cardCost, { color: colors.text }]}>{event.priceDisplay} / person</Text>
            <Text style={[styles.cardSpots, { color: colors.textTertiary }]}>{event.spots} spots available</Text>
          </View>
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
          >
            <Text style={styles.joinBtnText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EventsNearbyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { city } = useLocation();
  const { events } = useEvents();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All');

  const cityEvents = useMemo(
    () => events.filter((e) => e.status === 'active' && e.city === city),
    [events, city]
  );

  const filtered = useMemo(
    () =>
      activeCategory === 'All'
        ? cityEvents
        : cityEvents.filter((e) => e.category === activeCategory),
    [cityEvents, activeCategory]
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Events in {city}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {cityEvents.length} {cityEvents.length === 1 ? 'event' : 'events'} this week
          </Text>
        </View>
      </View>

      {/* Category chips */}
      <View style={[styles.categoryBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {FILTER_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onPress={() => setActiveCategory(cat)}
              colors={colors}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <EventCard event={item} colors={colors} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No events in {city}</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Check back soon or explore other cities.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 2 },
  headerText: { gap: 1 },
  headerTitle: { fontSize: Theme.fontSize.lg, fontWeight: '600' },
  headerSub: { fontSize: Theme.fontSize.sm },

  categoryBar: { borderBottomWidth: 0.5 },
  categoryScroll: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    borderWidth: 0.5,
  },
  chipText: { fontSize: Theme.fontSize.sm, fontWeight: '500' },

  feed: { padding: Theme.spacing.md, gap: 12 },

  card: { borderRadius: Theme.radius.lg, borderWidth: 0.5, overflow: 'hidden' },
  cardImage: { height: 140, alignItems: 'center', justifyContent: 'center', width: '100%' },
  cardEmoji: { fontSize: 44 },
  cardBody: { padding: Theme.spacing.md },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: Theme.radius.full,
    marginBottom: 6,
  },
  badgeText: { fontSize: Theme.fontSize.xs, fontWeight: '500' },
  cardTitle: { fontSize: Theme.fontSize.md, fontWeight: '500', marginBottom: 4 },
  cardMeta: { fontSize: Theme.fontSize.sm, marginBottom: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  cardCost: { fontSize: Theme.fontSize.md, fontWeight: '500' },
  cardSpots: { fontSize: Theme.fontSize.xs, marginTop: 1 },
  joinBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: Theme.radius.md },
  joinBtnText: { color: '#FFFFFF', fontSize: Theme.fontSize.sm, fontWeight: '500' },

  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: Theme.fontSize.md, fontWeight: '600' },
  emptyText: { fontSize: Theme.fontSize.sm, textAlign: 'center', maxWidth: 220 },
});
