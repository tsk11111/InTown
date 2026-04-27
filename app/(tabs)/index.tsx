import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { CITIES, flag } from '@/constants/cities';
import { useAuth } from '@/context/auth';
import { useLocation } from '@/context/location';
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  PRICE_OPTIONS,
  useEvents,
  type EventCategory,
  type OrganizerEvent,
  type PriceKey,
} from '@/context/events';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const SHEET_SCROLL_HEIGHT = Dimensions.get('window').height * 0.48;

type FilterCategory = 'All' | EventCategory;
const FILTER_CATEGORIES: FilterCategory[] = ['All', ...CATEGORIES];
type DateFilter = 'any' | 'today' | 'week' | 'weekend';
const DATE_OPTIONS: { key: DateFilter; label: string }[] = [
  { key: 'any', label: 'Any time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'weekend', label: 'Weekend' },
];

// All countries derived from CITIES, deduped and sorted
const ALL_COUNTRIES = Array.from(
  new Map(CITIES.map((c) => [c.country, { country: c.country, code: c.code }])).values()
).sort((a, b) => a.country.localeCompare(b.country));

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

export function EventCard({ event, colors }: { event: OrganizerEvent; colors: typeof Colors.light }) {
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
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showAllCountries, setShowAllCountries] = useState(false);

  const toggleCity = (c: string) =>
    setFilterCities(filterCities.includes(c) ? filterCities.filter((x) => x !== c) : [...filterCities, c]);

  const togglePrice = (p: PriceKey) =>
    setFilterPrices(filterPrices.includes(p) ? filterPrices.filter((x) => x !== p) : [...filterPrices, p]);

  const filteredCountries = useMemo(
    () =>
      countrySearch.trim() === ''
        ? ALL_COUNTRIES
        : ALL_COUNTRIES.filter((c) =>
            c.country.toLowerCase().includes(countrySearch.toLowerCase())
          ),
    [countrySearch]
  );

  const citiesForCountry = useMemo(
    () =>
      selectedCountry
        ? CITIES.filter((c) => c.country === selectedCountry).map((c) => c.city).sort()
        : [],
    [selectedCountry]
  );

  const handleReset = () => {
    onReset();
    setSelectedCountry(null);
    setCountrySearch('');
  };

  const handleClose = () => {
    setSelectedCountry(null);
    setCountrySearch('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalRoot}>
        {/* Tap outside to close - flex:1 pushes sheet to bottom */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>

        {/* Outer wrapper: solid background from rounded top all the way to screen edge */}
        <View style={[styles.sheetOuter, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Filters</Text>
            <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
              <Text style={[styles.sheetReset, { color: colors.primary }]}>Reset all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetBody}
            style={styles.sheetScroll}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── CITY ─────────────────────────────── */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.textTertiary }]}>CITY</Text>

              {selectedCountry ? (
                /* City list for selected country */
                <View style={styles.cityPanel}>
                  <TouchableOpacity
                    style={[styles.backRow, { borderBottomColor: colors.border }]}
                    onPress={() => setSelectedCountry(null)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={16} color={colors.primary} />
                    <Text style={[styles.backRowText, { color: colors.primary }]}>
                      {flag(ALL_COUNTRIES.find((c) => c.country === selectedCountry)?.code ?? '')} {selectedCountry}
                    </Text>
                  </TouchableOpacity>
                  {citiesForCountry.map((cityName) => {
                    const active = filterCities.includes(cityName);
                    return (
                      <TouchableOpacity
                        key={cityName}
                        onPress={() => toggleCity(cityName)}
                        style={[styles.cityRow, { borderBottomColor: colors.border }]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.cityRowName, { color: colors.text }]}>{cityName}</Text>
                        {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                /* Country list */
                <View style={styles.countryPanel}>
                  <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={15} color={colors.textTertiary} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text }]}
                      placeholder="Search country…"
                      placeholderTextColor={colors.textTertiary}
                      value={countrySearch}
                      onChangeText={setCountrySearch}
                      autoCorrect={false}
                    />
                    {countrySearch.length > 0 && (
                      <TouchableOpacity onPress={() => setCountrySearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={15} color={colors.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {(countrySearch.trim() || showAllCountries
                    ? filteredCountries
                    : filteredCountries.slice(0, 5)
                  ).map(({ country, code }) => {
                    const cityCount = CITIES.filter((c) => c.country === country).length;
                    const selectedCount = filterCities.filter((city) =>
                      CITIES.some((c) => c.country === country && c.city === city)
                    ).length;
                    return (
                      <TouchableOpacity
                        key={country}
                        style={[styles.countryRow, { borderBottomColor: colors.border }]}
                        onPress={() => setSelectedCountry(country)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.countryFlag}>{flag(code)}</Text>
                        <Text style={[styles.countryName, { color: colors.text }]}>{country}</Text>
                        {selectedCount > 0 && (
                          <View style={[styles.countryBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.countryBadgeText}>{selectedCount}</Text>
                          </View>
                        )}
                        <Text style={[styles.countryCityCount, { color: colors.textTertiary }]}>
                          {cityCount} {cityCount === 1 ? 'city' : 'cities'}
                        </Text>
                        <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
                      </TouchableOpacity>
                    );
                  })}
                  {!countrySearch.trim() && filteredCountries.length > 5 && (
                    <TouchableOpacity
                      onPress={() => setShowAllCountries((v) => !v)}
                      style={styles.showMoreBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.showMoreText, { color: colors.primary }]}>
                        {showAllCountries
                          ? 'Show less'
                          : `Show all ${filteredCountries.length} countries`}
                      </Text>
                      <Ionicons
                        name={showAllCountries ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* ── PRICE ────────────────────────────── */}
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

            {/* ── DATE ─────────────────────────────── */}
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
        </View>
      </View>
    </Modal>
  );
}

const WEEKEND_DAYS = ['Sâm', 'Dum', 'Sat', 'Sun'];
const MONTH_ABBREVS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function matchesDateFilter(date: string, filter: DateFilter): boolean {
  if (filter === 'any') return true;
  if (date.startsWith('Every') || date.startsWith('Fiecare')) return true;
  const now = new Date();
  const day = date.split(' ')[0];
  if (filter === 'today') {
    const monthAbbr = MONTH_ABBREVS[now.getMonth()];
    return date.includes(String(now.getDate())) && date.toLowerCase().includes(monthAbbr.toLowerCase());
  }
  if (filter === 'weekend') return WEEKEND_DAYS.includes(day);
  if (filter === 'week') return true;
  return true;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
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
      result = result.filter((e) => filterCities.includes(e.city));
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
      {/* Header */}
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

      {/* Events feed */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <EventCard event={item} colors={colors} />}
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
  emptyText: { fontSize: Theme.fontSize.sm, textAlign: 'center' },
  resetBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
  },
  resetBtnText: { fontSize: Theme.fontSize.sm, fontWeight: '600' },

  // Modal / sheet
  modalRoot: { flex: 1 },
  sheetOuter: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: Theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetScroll: { height: SHEET_SCROLL_HEIGHT },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: Theme.fontSize.xl, fontWeight: '700' },
  sheetReset: { fontSize: Theme.fontSize.sm, fontWeight: '500' },
  sheetBody: { gap: Theme.spacing.lg, paddingBottom: 8 },

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

  // Country → city flow
  countryPanel: { gap: 0 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Theme.radius.md,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: Theme.fontSize.sm },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  countryFlag: { fontSize: 20 },
  countryName: { flex: 1, fontSize: Theme.fontSize.sm, fontWeight: '500' },
  countryBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  countryCityCount: { fontSize: Theme.fontSize.xs },

  cityPanel: { gap: 10 },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  cityRowName: { fontSize: Theme.fontSize.base, fontWeight: '500' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backRowText: { fontSize: Theme.fontSize.sm, fontWeight: '600' },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 10 },
  showMoreText: { fontSize: Theme.fontSize.sm, fontWeight: '500' },
});
