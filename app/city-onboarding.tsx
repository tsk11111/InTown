import { Colors } from '@/constants/colors';
import { CITIES, flag, type City } from '@/constants/cities';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useLocation } from '@/context/location';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CityOnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { city: currentCity, setCity } = useLocation();
  const { updateCity } = useAuth();
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? CITIES.filter((c) => c.city.toLowerCase().includes(q)) : CITIES;
  }, [search]);

  const handlePick = (c: City) => {
    setPicked(c.city);
    setCity(c.city);
    updateCity(c.city);
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.top}>
        <Text style={[styles.title, { color: colors.text }]}>Where are you?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We'll show you events happening near you.
        </Text>

        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search city…"
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((c) => {
          const active = c.city === picked;
          return (
            <TouchableOpacity
              key={c.city}
              style={[
                styles.row,
                { borderBottomColor: colors.border },
                active && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => handlePick(c)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{flag(c.code)}</Text>
              <View style={styles.rowText}>
                <Text style={[styles.cityName, { color: colors.text }]}>{c.city}</Text>
                <Text style={[styles.countryName, { color: colors.textTertiary }]}>{c.country}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  top: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Theme.fontSize.base,
    lineHeight: 22,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Theme.radius.md,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: Theme.fontSize.base },

  list: { flex: 1 },
  listContent: { paddingHorizontal: Theme.spacing.xl },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    gap: 12,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  flag: { fontSize: 22 },
  rowText: { flex: 1 },
  cityName: { fontSize: Theme.fontSize.base, fontWeight: '500' },
  countryName: { fontSize: Theme.fontSize.xs, marginTop: 1 },

  footer: {
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderTopWidth: 0.5,
  },
  continueBtn: {
    height: 52,
    borderRadius: Theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: { color: '#fff', fontSize: Theme.fontSize.base, fontWeight: '600' },
});
