import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { CITIES, flag } from '@/constants/cities';
import { useAuth } from '@/context/auth';
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  PRICE_OPTIONS,
  useEvents,
  type EventCategory,
  type EventStatus,
  type PriceKey,
} from '@/context/events';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.72;

const ALL_COUNTRIES = Array.from(
  new Map(CITIES.map((c) => [c.country, { country: c.country, code: c.code }])).values()
).sort((a, b) => a.country.localeCompare(b.country));

function SectionLabel({ text, colors }: { text: string; colors: typeof Colors.light }) {
  return <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{text}</Text>;
}

function Field({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

function CityPickerModal({
  visible,
  value,
  onSelect,
  onClose,
  colors,
}: {
  visible: boolean;
  value: string;
  onSelect: (city: string) => void;
  onClose: () => void;
  colors: typeof Colors.light;
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'country' | 'city'>('country');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const reset = () => {
    setStep('country');
    setSelectedCountry(null);
    setSearch('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const filteredCountries = useMemo(
    () =>
      search.trim()
        ? ALL_COUNTRIES.filter((c) => c.country.toLowerCase().includes(search.toLowerCase()))
        : ALL_COUNTRIES,
    [search]
  );

  const citiesForCountry = useMemo(
    () =>
      selectedCountry
        ? CITIES.filter((c) => c.country === selectedCountry)
            .map((c) => c.city)
            .sort()
        : [],
    [selectedCountry]
  );

  const filteredCities = useMemo(
    () =>
      search.trim()
        ? citiesForCountry.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
        : citiesForCountry,
    [citiesForCountry, search]
  );

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
        <View
          style={[
            styles.pickerSheet,
            { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.pickerHeader}>
            {step === 'city' ? (
              <TouchableOpacity
                onPress={() => { setStep('country'); setSearch(''); }}
                style={styles.pickerBack}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color={colors.primary} />
                <Text style={[styles.pickerBackText, { color: colors.primary }]}>
                  {flag(ALL_COUNTRIES.find((c) => c.country === selectedCountry)?.code ?? '')}{' '}
                  {selectedCountry}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Select city</Text>
            )}
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={styles.pickerClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={15} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={step === 'country' ? 'Search country…' : 'Search city…'}
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={15} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={{ height: SHEET_HEIGHT }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {step === 'country'
              ? filteredCountries.map(({ country, code }) => (
                  <TouchableOpacity
                    key={country}
                    style={[styles.listRow, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setSelectedCountry(country);
                      setSearch('');
                      setStep('city');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rowFlag}>{flag(code)}</Text>
                    <Text style={[styles.rowName, { color: colors.text }]}>{country}</Text>
                    <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))
              : filteredCities.map((cityName) => (
                  <TouchableOpacity
                    key={cityName}
                    style={[styles.listRow, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      onSelect(cityName);
                      reset();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.rowName, { color: colors.text, flex: 1 }]}>{cityName}</Text>
                    {value === cityName && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function CreateEventScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { addEvent, updateEvent, getEvent } = useEvents();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState(user?.venue ?? '');
  const [city, setCity] = useState('');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Social');
  const [price, setPrice] = useState<PriceKey>('free');
  const [spots, setSpots] = useState('20');
  const [status, setStatus] = useState<EventStatus>('active');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);

  useEffect(() => {
    if (id) {
      const event = getEvent(id);
      if (event) {
        setTitle(event.title);
        setVenue(event.venue);
        setCity(event.city ?? '');
        // neighbourhood is the location string minus the city suffix
        const loc = event.location ?? '';
        const cityIndex = loc.lastIndexOf(`, ${event.city}`);
        setNeighbourhood(cityIndex !== -1 ? loc.slice(0, cityIndex) : loc);
        setDate(event.date);
        setTime(event.time);
        setDescription(event.description);
        setCategory(event.category);
        setPrice(event.price);
        setSpots(String(event.spots));
        setStatus(event.status);
        setPhotos(event.photos);
      }
    }
  }, [id]);

  const pickPhoto = async () => {
    const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to add event images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const getPriceDisplay = (key: PriceKey) =>
    PRICE_OPTIONS.find((p) => p.key === key)?.label ?? key;

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing info', 'Please add an event name.');
      return;
    }
    if (!city) {
      Alert.alert('Missing info', 'Please select a city.');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const location = neighbourhood.trim() ? `${neighbourhood.trim()}, ${city}` : city;

    const payload = {
      organizerId: user?.id,
      title: title.trim(),
      venue: venue.trim() || (user?.venue ?? user?.name ?? ''),
      location,
      city,
      date: date.trim() || 'TBC',
      time: time.trim() || 'TBC',
      description: description.trim(),
      category,
      price,
      priceDisplay: getPriceDisplay(price),
      spots: parseInt(spots, 10) || 20,
      status,
      photos,
      emoji: CATEGORY_EMOJI[category],
    };

    if (isEditing && id) {
      updateEvent(id, payload);
      setSaving(false);
      router.back();
    } else {
      const newId = addEvent(payload);
      setSaving(false);
      router.replace({ pathname: '/event/[id]', params: { id: newId } });
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.border,
      color: colors.text,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? 'Edit Event' : 'New Event'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.statusToggle,
              {
                backgroundColor: status === 'active' ? '#DCFCE7' : '#FEF3C7',
                borderColor: status === 'active' ? '#86EFAC' : '#FCD34D',
              },
            ]}
            onPress={() => setStatus((s) => (s === 'active' ? 'draft' : 'active'))}
            activeOpacity={0.8}
          >
            <View style={[styles.statusDot, { backgroundColor: status === 'active' ? '#22C55E' : '#F59E0B' }]} />
            <Text style={[styles.statusLabel, { color: status === 'active' ? '#15803D' : '#B45309' }]}>
              {status === 'active' ? 'Active' : 'Draft'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photos */}
          <SectionLabel text="PHOTOS" colors={colors} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {photos.map((uri, index) => (
              <View key={index} style={styles.photoSlot}>
                <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
                <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(index)} activeOpacity={0.8}>
                  <Ionicons name="close-circle" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 5 && (
              <TouchableOpacity
                style={[styles.photoAdd, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={pickPhoto}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={24} color={colors.primary} />
                <Text style={[styles.photoAddText, { color: colors.primary }]}>Add photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Basic info */}
          <SectionLabel text="EVENT DETAILS" colors={colors} />

          <Field label="Event name *" colors={colors}>
            <TextInput
              style={inputStyle}
              placeholder="e.g. Chess Night at The Garden"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
            />
          </Field>

          <Field label="Venue" colors={colors}>
            <TextInput
              style={inputStyle}
              placeholder="Venue name"
              placeholderTextColor={colors.textTertiary}
              value={venue}
              onChangeText={setVenue}
            />
          </Field>

          {/* City picker */}
          <Field label="City *" colors={colors}>
            <TouchableOpacity
              style={[
                styles.input,
                styles.cityPicker,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: city ? colors.primaryMid : colors.border,
                },
              ]}
              onPress={() => setCityPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cityPickerText, { color: city ? colors.text : colors.textTertiary }]}>
                {city || 'Select city…'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </Field>

          <Field label="Neighbourhood / Address" colors={colors}>
            <TextInput
              style={inputStyle}
              placeholder="e.g. Centru Vechi"
              placeholderTextColor={colors.textTertiary}
              value={neighbourhood}
              onChangeText={setNeighbourhood}
            />
          </Field>

          <View style={styles.row2}>
            <View style={styles.halfCol}>
              <Field label="Date" colors={colors}>
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. Every Tuesday"
                  placeholderTextColor={colors.textTertiary}
                  value={date}
                  onChangeText={setDate}
                />
              </Field>
            </View>
            <View style={styles.halfCol}>
              <Field label="Time" colors={colors}>
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. 7:00 PM"
                  placeholderTextColor={colors.textTertiary}
                  value={time}
                  onChangeText={setTime}
                />
              </Field>
            </View>
          </View>

          <Field label="Description" colors={colors}>
            <TextInput
              style={[inputStyle, styles.textarea]}
              placeholder="Tell people what to expect - the vibe, what's included, who it's for..."
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Field>

          {/* Category */}
          <SectionLabel text="CATEGORY" colors={colors} />
          <View style={styles.chips}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              const catKey = cat.toLowerCase() as keyof typeof colors;
              const catColor = colors[catKey] as { bg: string; text: string } | undefined;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? (catColor?.bg ?? colors.primaryLight) : colors.backgroundSecondary,
                      borderColor: active ? (catColor?.text ?? colors.primary) : colors.border,
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: active ? (catColor?.text ?? colors.primary) : colors.textSecondary,
                        fontWeight: active ? '600' : '400',
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Price */}
          <SectionLabel text="PRICE PER PERSON" colors={colors} />
          <View style={styles.priceRow}>
            {PRICE_OPTIONS.map(({ key, label }) => {
              const active = price === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.priceBtn,
                    {
                      backgroundColor: active ? colors.primary : colors.backgroundSecondary,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setPrice(key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.priceBtnText, { color: active ? '#fff' : colors.textSecondary }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Spots */}
          <SectionLabel text="CAPACITY" colors={colors} />
          <Field label="Available spots" colors={colors}>
            <TextInput
              style={[inputStyle, styles.spotsInput]}
              placeholder="20"
              placeholderTextColor={colors.textTertiary}
              value={spots}
              onChangeText={(t) => setSpots(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
          </Field>

          <View style={styles.bottomPad} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create event'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CityPickerModal
        visible={cityPickerVisible}
        value={city}
        onSelect={(c) => { setCity(c); setCityPickerVisible(false); }}
        onClose={() => setCityPickerVisible(false)}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 0.5,
    gap: Theme.spacing.md,
  },
  headerBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: Theme.fontSize.lg, fontWeight: '600' },
  headerActions: {},
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radius.full,
    borderWidth: 0.5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: Theme.fontSize.xs, fontWeight: '600' },

  scroll: { padding: Theme.spacing.lg, gap: Theme.spacing.sm },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: Theme.spacing.md,
    marginBottom: 4,
  },

  photoRow: { gap: 10, paddingVertical: 4 },
  photoSlot: { position: 'relative' },
  photoThumb: { width: 120, height: 80, borderRadius: Theme.radius.md },
  photoRemove: { position: 'absolute', top: -8, right: -8 },
  photoAdd: {
    width: 120,
    height: 80,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddText: { fontSize: Theme.fontSize.xs, fontWeight: '500' },

  field: { gap: 6 },
  fieldLabel: { fontSize: Theme.fontSize.sm, fontWeight: '500' },

  input: {
    height: 44,
    borderRadius: Theme.radius.md,
    borderWidth: 0.5,
    paddingHorizontal: Theme.spacing.md,
    fontSize: Theme.fontSize.base,
  },
  cityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityPickerText: { fontSize: Theme.fontSize.base },
  textarea: { height: 100, paddingTop: Theme.spacing.md },
  spotsInput: { width: 100 },

  row2: { flexDirection: 'row', gap: Theme.spacing.md },
  halfCol: { flex: 1 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.radius.full,
    borderWidth: 0.5,
  },
  chipText: { fontSize: Theme.fontSize.sm },

  priceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priceBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Theme.radius.md,
    borderWidth: 0.5,
  },
  priceBtnText: { fontSize: Theme.fontSize.sm, fontWeight: '500' },

  bottomPad: { height: Theme.spacing.xl },

  footer: { padding: Theme.spacing.lg, borderTopWidth: 0.5 },
  saveBtn: { height: 50, borderRadius: Theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { color: '#fff', fontSize: Theme.fontSize.base, fontWeight: '600' },

  // City picker modal
  modalRoot: { flex: 1 },
  pickerSheet: {
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
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerTitle: { fontSize: Theme.fontSize.lg, fontWeight: '700' },
  pickerBack: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickerBackText: { fontSize: Theme.fontSize.sm, fontWeight: '600' },
  pickerClose: { padding: 4 },
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
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  rowFlag: { fontSize: 20 },
  rowName: { flex: 1, fontSize: Theme.fontSize.base, fontWeight: '500' },
});
