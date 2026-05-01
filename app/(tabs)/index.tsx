import { CITIES } from '@/constants/cities';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  DEMO_NOW,
  PRICE_OPTIONS,
  useEvents,
  type EventCategory,
  type OrganizerEvent,
  type PriceKey,
} from '@/context/events';
import { useLocation } from '@/context/location';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_H = Dimensions.get('window').height;

type FilterCategory = 'All' | EventCategory;
const FILTER_CATEGORIES: FilterCategory[] = ['All', ...CATEGORIES];
type DateFilter = 'any' | 'today' | 'week' | 'weekend';
const DATE_OPTIONS: { key: DateFilter; label: string }[] = [
  { key: 'any', label: 'Any time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'weekend', label: 'Weekend' },
];


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

export function EventCard({ event, colors, isJoined = false }: { event: OrganizerEvent; colors: typeof Colors.light; isJoined?: boolean }) {
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
        <View style={[styles.badge, { backgroundColor: categoryColor?.bg ?? colors.primaryLight, marginBottom: 6 }]}>
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
            style={[styles.joinBtn, {
              backgroundColor: isJoined ? '#DCFCE7' : colors.primary,
              borderWidth: isJoined ? 1 : 0,
              borderColor: '#86EFAC',
            }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
          >
            <Text style={[styles.joinBtnText, { color: isJoined ? '#16A34A' : '#fff' }]}>
              {isJoined ? 'Joined' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function FilterSheet({
  visible,
  onClose,
  colors,
  filterCities,
  setFilterCities,
  filterPrices,
  setFilterPrices,
  filterDate,
  setFilterDate,
  onReset,
}: {
  visible: boolean;
  onClose: () => void;
  colors: typeof Colors.light;
  filterCities: string[];
  setFilterCities: (v: string[]) => void;
  filterPrices: PriceKey[];
  setFilterPrices: (v: PriceKey[]) => void;
  filterDate: DateFilter;
  setFilterDate: (v: DateFilter) => void;
  onReset: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [citySearch, setCitySearch] = useState('');

  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const lastSnapY = useRef(0);

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_H);
      lastSnapY.current = 0;
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        const next = Math.max(0, lastSnapY.current + gs.dy);
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, gs) => {
        const finalY = lastSnapY.current + gs.dy;
        if (finalY > 80 || gs.vy > 0.8) {
          Animated.timing(translateY, { toValue: SCREEN_H, duration: 220, useNativeDriver: true })
            .start(() => { lastSnapY.current = 0; onClose(); });
        } else {
          lastSnapY.current = 0;
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }).start();
        }
      },
    })
  ).current;

  const addCity = (cityName: string) => {
    if (!filterCities.includes(cityName)) setFilterCities([...filterCities, cityName]);
    setCitySearch('');
  };

  const removeCity = (cityName: string) =>
    setFilterCities(filterCities.filter((c) => c !== cityName));

  const togglePrice = (p: PriceKey) =>
    setFilterPrices(filterPrices.includes(p) ? filterPrices.filter((x) => x !== p) : [...filterPrices, p]);

  const cityResults = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return [];
    return CITIES
      .filter((c) => c.city.toLowerCase().includes(q) && !filterCities.includes(c.city))
      .slice(0, 1);
  }, [citySearch, filterCities]);

  const handleReset = () => {
    onReset();
    setCitySearch('');
  };

  const handleClose = () => {
    Animated.timing(translateY, { toValue: SCREEN_H, duration: 250, useNativeDriver: true })
      .start(() => {
        lastSnapY.current = 0;
        setCitySearch('');
        onClose();
      });
  };

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.sheetOuter, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom + 16, transform: [{ translateY }] }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.handleArea}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            </View>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Filters</Text>
              <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                <Text style={[styles.sheetReset, { color: colors.primary }]}>Reset all</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetBody}
            style={styles.sheetScroll}
            keyboardShouldPersistTaps="handled"
          >

            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.textTertiary }]}>CITY</Text>

              {filterCities.length > 0 && (
                <View style={styles.selectedCityChips}>
                  {filterCities.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.cityChip, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMid }]}
                      onPress={() => removeCity(c)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.cityChipText, { color: colors.primary }]}>{c}</Text>
                      <Ionicons name="close" size={13} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="search-outline" size={15} color={colors.textTertiary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search city…"
                  placeholderTextColor={colors.textTertiary}
                  value={citySearch}
                  onChangeText={setCitySearch}
                  autoCorrect={false}
                />
                {citySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCitySearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={15} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>

              {cityResults.map(({ city: cityName }) => (
                <TouchableOpacity
                  key={cityName}
                  style={[styles.cityRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={() => addCity(cityName)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location-outline" size={15} color={colors.textTertiary} />
                  <Text style={[styles.cityRowName, { color: colors.text }]}>{cityName}</Text>
                  <Ionicons name="add" size={18} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.textTertiary }]}>PRICE</Text>
              <View style={styles.chipWrap}>
                {PRICE_OPTIONS.map((opt) => {
                  const active = filterPrices.includes(opt.key);
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => togglePrice(opt.key)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active ? colors.primaryLight : colors.surface,
                          borderColor: active ? colors.primaryMid : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterChipText, { color: active ? colors.primary : colors.textSecondary }]}>
                        {opt.label}
                      </Text>
                      {active && <Ionicons name="checkmark" size={13} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.textTertiary }]}>DATE</Text>
              <View style={styles.chipWrap}>
                {DATE_OPTIONS.map((opt) => {
                  const active = filterDate === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setFilterDate(opt.key)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active ? colors.primaryLight : colors.surface,
                          borderColor: active ? colors.primaryMid : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterChipText, { color: active ? colors.primary : colors.textSecondary }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.primary }]}
              onPress={handleClose}
              activeOpacity={0.85}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const WEEKEND_DAYS = ['Sâm', 'Dum', 'Sat', 'Sun'];
const MONTH_ABBREVS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function matchesDateFilter(date: string, filter: DateFilter): boolean {
  if (filter === 'any') return true;
  if (date.startsWith('Every') || date.startsWith('Fiecare')) return true;
  const now = DEMO_NOW;
  const day = date.split(' ')[0];
  if (filter === 'today') {
    const monthAbbr = MONTH_ABBREVS[now.getMonth()];
    return date.includes(String(now.getDate())) && date.toLowerCase().includes(monthAbbr.toLowerCase());
  }
  if (filter === 'weekend') return WEEKEND_DAYS.includes(day);
  if (filter === 'week') {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    for (let i = 0; i < MONTH_ABBREVS.length; i++) {
      const abbr = MONTH_ABBREVS[i];
      if (!date.toLowerCase().includes(abbr.toLowerCase())) continue;
      const match = date.match(/(\d+)\s+/);
      if (!match) continue;
      const d = new Date(now.getFullYear(), i, parseInt(match[1]));
      return d >= now && d <= weekEnd;
    }
    return false;
  }
  return true;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, joinedEventIds } = useAuth();
  const { city } = useLocation();
  const { events } = useEvents();

  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterCities, setFilterCities] = useState<string[]>([]);
  const [filterPrices, setFilterPrices] = useState<PriceKey[]>([]);
  const [filterDate, setFilterDate] = useState<DateFilter>('any');

  const activeEvents = useMemo(
    () => events.filter((e) => e.status === 'active' && e.organizerId !== user?.id),
    [events, user?.id]
  );

  const cityEventCount = useMemo(
    () => activeEvents.filter((e) => e.city === city).length,
    [activeEvents, city]
  );

  const activeFilterCount =
    filterCities.length + filterPrices.length + (filterDate !== 'any' ? 1 : 0);

  const filtered = useMemo(() => {
    let result = activeCategory === 'All'
      ? activeEvents
      : activeEvents.filter((e) => e.category === activeCategory);
    if (filterCities.length > 0)
      result = result.filter((e) => e.category === 'Online' || filterCities.includes(e.city));
    if (filterPrices.length > 0)
      result = result.filter((e) => filterPrices.includes(e.price));
    result = result.filter((e) => matchesDateFilter(e.date, filterDate));
    return result;
  }, [activeEvents, activeCategory, filterCities, filterPrices, filterDate]);

  const resetFilters = () => {
    setFilterCities([]);
    setFilterPrices([]);
    setFilterDate('any');
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Events near you</Text>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              {
                backgroundColor: activeFilterCount > 0 ? colors.primaryLight : colors.surface,
                borderColor: activeFilterCount > 0 ? colors.primaryMid : colors.border,
              },
            ]}
            onPress={() => setFilterVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="options-outline"
              size={15}
              color={activeFilterCount > 0 ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.filterBtnText, { color: activeFilterCount > 0 ? colors.primary : colors.textSecondary }]}>
              Filters
            </Text>
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.locationRow}>
          <Text style={[styles.locationText, { color: colors.textSecondary }]}>📍</Text>
          <TouchableOpacity
            onPress={() => router.push('/events-nearby')}
            activeOpacity={0.7}
            style={[styles.locationBadge, { backgroundColor: colors.primaryLight }]}
          >
            <Text style={[styles.locationBadgeText, { color: colors.primary }]}>{city}</Text>
            <Ionicons name="chevron-forward" size={11} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.eventCount, { color: colors.textTertiary }]}>
            · {cityEventCount} events this week
          </Text>
        </View>
      </View>

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
        renderItem={({ item }) => <EventCard event={item} colors={colors} isJoined={joinedEventIds.includes(item.id)} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No events found</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Try adjusting your filters or category.
            </Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity
                onPress={resetFilters}
                style={[styles.resetBtn, { borderColor: colors.primary }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.resetBtnText, { color: colors.primary }]}>Reset filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        colors={colors}
        filterCities={filterCities}
        setFilterCities={setFilterCities}
        filterPrices={filterPrices}
        setFilterPrices={setFilterPrices}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        onReset={resetFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 0.5,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: { fontSize: Theme.fontSize.lg, fontWeight: '500' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: Theme.fontSize.sm },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: Theme.radius.full,
  },
  locationBadgeText: { fontSize: Theme.fontSize.xs, fontWeight: '500' },
  eventCount: { fontSize: Theme.fontSize.sm },

  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    borderWidth: 0.5,
  },
  filterBtnText: { fontSize: Theme.fontSize.sm, fontWeight: '500' },
  filterBadge: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

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
  emptyText: { fontSize: Theme.fontSize.sm, textAlign: 'center' },
  resetBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
  },
  resetBtnText: { fontSize: Theme.fontSize.sm, fontWeight: '600' },

  modalRoot: { flex: 1 },
  sheetOuter: {
    height: SCREEN_H,
    paddingHorizontal: Theme.spacing.lg,
  },
  handleArea: { paddingTop: 12, paddingBottom: 8, alignItems: 'center' },
  sheetScroll: { flex: 1 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: Theme.fontSize.xl, fontWeight: '700' },
  sheetReset: { fontSize: Theme.fontSize.sm, fontWeight: '500' },
  sheetBody: { gap: Theme.spacing.lg, paddingBottom: 8 },
  sheetFooter: {
    paddingTop: Theme.spacing.md,
    borderTopWidth: 0.5,
  },
  closeBtn: {
    height: 50,
    borderRadius: Theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: Theme.fontSize.base, fontWeight: '600' },

  filterSection: { gap: 10 },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.radius.full,
    borderWidth: 0.5,
  },
  filterChipText: { fontSize: Theme.fontSize.sm, fontWeight: '500' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Theme.radius.md,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 6,
  },
  searchInput: { flex: 1, fontSize: Theme.fontSize.sm },
  selectedCityChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radius.full,
    borderWidth: 0.5,
  },
  cityChipText: { fontSize: Theme.fontSize.xs, fontWeight: '600' },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: Theme.radius.md,
    borderWidth: 0.5,
    marginTop: 2,
  },
  cityRowName: { flex: 1, fontSize: Theme.fontSize.sm, fontWeight: '500' },
});
