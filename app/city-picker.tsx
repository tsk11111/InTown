import { Colors } from '@/constants/colors';
import { CITIES, flag, type City } from '@/constants/cities';
import { Theme } from '@/constants/theme';
import { useLocation } from '@/context/location';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Section {
  title: string;
  data: City[];
}

function buildSections(cities: City[]): Section[] {
  const map: Record<string, City[]> = {};
  for (const c of cities) {
    const letter = c.city[0].toUpperCase();
    if (!map[letter]) map[letter] = [];
    map[letter].push(c);
  }
  return Object.keys(map)
    .sort()
    .map((title) => ({ title, data: map[title] }));
}

export default function CityPickerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { city: selectedCity, setCity } = useLocation();

  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const sections = useMemo<Section[]>(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? CITIES.filter(
          (c) =>
            c.city.toLowerCase().includes(q) ||
            c.country.toLowerCase().includes(q)
        )
      : CITIES;
    return buildSections(filtered);
  }, [query]);

  const totalCount = useMemo(
    () => sections.reduce((n, s) => n + s.data.length, 0),
    [sections]
  );

  const handleSelect = useCallback(
    (city: string) => {
      setCity(city);
      router.back();
    },
    [setCity]
  );

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select your city</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Search bar */}
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search cities or countries…"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            autoFocus={Platform.OS !== 'web'}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Count hint */}
      <View style={[styles.countBar, { backgroundColor: colors.backgroundTertiary }]}>
        <Text style={[styles.countText, { color: colors.textTertiary }]}>
          {totalCount} {totalCount === 1 ? 'city' : 'cities'}
          {query.trim() ? ` matching "${query.trim()}"` : ' available'}
        </Text>
      </View>

      {/* City list */}
      {totalCount === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No cities found</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Try a different spelling or country name.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.city + item.country}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <View
              style={[
                styles.sectionHeader,
                {
                  backgroundColor: colors.backgroundTertiary,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.sectionLetter, { color: colors.primary }]}>
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item, index, section }) => {
            const isLast = index === section.data.length - 1;
            const isSelected = item.city === selectedCity;
            return (
              <TouchableOpacity
                style={[
                  styles.row,
                  {
                    backgroundColor: isSelected
                      ? colors.primaryLight
                      : colors.surface,
                    borderBottomColor: isLast ? 'transparent' : colors.border,
                  },
                ]}
                onPress={() => handleSelect(item.city)}
                activeOpacity={0.65}
              >
                <Text style={styles.rowFlag}>{flag(item.code)}</Text>
                <View style={styles.rowText}>
                  <Text
                    style={[
                      styles.rowCity,
                      { color: isSelected ? colors.primary : colors.text },
                    ]}
                  >
                    {item.city}
                  </Text>
                  <Text style={[styles.rowCountry, { color: colors.textSecondary }]}>
                    {item.country}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Theme.fontSize.base,
    fontWeight: '600',
  },

  searchWrap: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Theme.spacing.md,
    height: 42,
    borderRadius: Theme.radius.md,
    borderWidth: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.fontSize.base,
    paddingVertical: 0,
  },

  countBar: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 6,
  },
  countText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: '500',
  },

  listContent: { paddingBottom: 24 },

  sectionHeader: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
  },
  sectionLetter: {
    fontSize: Theme.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    gap: Theme.spacing.md,
  },
  rowFlag: {
    fontSize: 22,
    lineHeight: 26,
    width: 32,
    textAlign: 'center',
  },
  rowText: { flex: 1 },
  rowCity: {
    fontSize: Theme.fontSize.base,
    fontWeight: '500',
    marginBottom: 1,
  },
  rowCountry: {
    fontSize: Theme.fontSize.sm,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 60,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: Theme.fontSize.lg, fontWeight: '600' },
  emptyText: { fontSize: Theme.fontSize.sm, color: '#888', textAlign: 'center', maxWidth: 220 },
});
