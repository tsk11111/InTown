import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useLocation } from '@/context/location';
import { useThemePreference, type ThemePreference } from '@/context/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.settingsGroup}>{children}</View>;
}

function SettingsRow({
  label,
  value,
  onPress,
  destructive,
  colors,
  rightElement,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  colors: typeof Colors.light;
  rightElement?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text
        style={[
          styles.settingsLabel,
          {
            color: destructive ? '#A32D2D' : colors.text,
          },
        ]}
      >
        {label}
      </Text>
      {rightElement ?? (
        value !== undefined && (
          <Text style={[styles.settingsValue, { color: colors.textSecondary }]}>{value} ›</Text>
        )
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, logout, updateName, updatePhoto, isOrganizer } = useAuth();
  const { preference, setPreference } = useThemePreference();
  const { city } = useLocation();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [newInCity, setNewInCity] = useState(true);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const nameInputRef = useRef<TextInput>(null);
  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      updatePhoto(result.assets[0].uri);
    }
  };

  const openNameModal = () => {
    setNameInput(user?.name ?? '');
    setNameModalVisible(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed.length >= 2) updateName(trimmed);
    setNameModalVisible(false);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8} style={styles.avatarWrap}>
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={styles.avatarPhoto} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, { backgroundColor: isOrganizer ? '#FEF3C7' : colors.primaryLight }]}>
                <Text style={[styles.avatarText, { color: isOrganizer ? '#B45309' : colors.primary }]}>
                  {initials}
                </Text>
              </View>
            )}
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={11} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileName, { color: colors.text }]}>{user?.name}</Text>
          {isOrganizer ? (
            <View style={[styles.newInCityBadge, { backgroundColor: '#FEF3C7', marginTop: 6 }]}>
              <Text style={[styles.newInCityText, { color: '#B45309' }]}>Event Organizer</Text>
            </View>
          ) : (
            <Text style={[styles.profileCity, { color: colors.textSecondary }]}>
              {city} · since March 2025
            </Text>
          )}
          {!isOrganizer && (
            <View style={[styles.newInCityBadge, { backgroundColor: '#E1F5EE', opacity: newInCity ? 1 : 0 }]}>
              <Text style={[styles.newInCityText, { color: '#0F6E56' }]}>New in city</Text>
            </View>
          )}
        </View>

        <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>PERSONAL</Text>
        <SettingsGroup>
          <SettingsRow
            label="Name"
            value={user?.name}
            colors={colors}
            onPress={openNameModal}
          />
        </SettingsGroup>

        <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>STATUS</Text>
        <SettingsGroup>
          <SettingsRow
            label="Show 'New in city' badge"
            colors={colors}
            rightElement={
              <Switch
                value={newInCity}
                onValueChange={setNewInCity}
                trackColor={{ false: colors.border, true: colors.primaryMid }}
                thumbColor={newInCity ? colors.primary : colors.textTertiary}
              />
            }
          />
        </SettingsGroup>

        <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>LOCATION</Text>
        <SettingsGroup>
          <SettingsRow
            label="City"
            value={city}
            colors={colors}
            onPress={() => router.push('/city-picker')}
          />
        </SettingsGroup>

        <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>APPEARANCE</Text>
        <View style={[styles.themeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.themeLabel, { color: colors.text }]}>Theme</Text>
          <View style={[styles.themeSegment, { backgroundColor: colors.backgroundSecondary }]}>
            {(
              [
                { key: 'light', label: 'Light', icon: 'sunny' },
                { key: 'system', label: 'System', icon: 'phone-portrait' },
                { key: 'dark', label: 'Dark', icon: 'moon' },
              ] as { key: ThemePreference; label: string; icon: string }[]
            ).map(({ key, label, icon }) => {
              const active = preference === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.themeOption,
                    active && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setPreference(key)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={icon as React.ComponentProps<typeof Ionicons>['name']}
                    size={14}
                    color={active ? '#fff' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: active ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>ACCOUNT</Text>
        <SettingsGroup>
          <SettingsRow
            label="Notifications"
            colors={colors}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primaryMid }}
                thumbColor={notificationsEnabled ? colors.primary : colors.textTertiary}
              />
            }
          />
        </SettingsGroup>

        <Text style={[styles.groupLabel, { color: colors.textTertiary }]}> </Text>
        <SettingsGroup>
          <SettingsRow label="Log out" destructive colors={colors} onPress={handleLogout} />
        </SettingsGroup>

      </ScrollView>

      <Modal
        visible={nameModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setNameModalVisible(false)}>
          <View style={styles.nameOverlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.nameSheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.nameSheetTitle, { color: colors.text }]}>Change name</Text>
          <TextInput
            ref={nameInputRef}
            style={[styles.nameInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Your name"
            placeholderTextColor={colors.textTertiary}
            value={nameInput}
            onChangeText={setNameInput}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={saveName}
          />
          <TouchableOpacity
            style={[styles.nameSaveBtn, { backgroundColor: colors.primary }]}
            onPress={saveName}
            activeOpacity={0.85}
          >
            <Text style={styles.nameSaveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  headerTitle: { fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.medium },

  scroll: { padding: Theme.spacing.md, paddingBottom: 40 },

  profileCard: {
    borderRadius: Theme.radius.lg,
    borderWidth: 0.5,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarText: { fontSize: Theme.fontSize.xl, fontWeight: Theme.fontWeight.medium },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: { fontSize: Theme.fontSize.base, fontWeight: Theme.fontWeight.medium },
  profileCity: { fontSize: Theme.fontSize.sm, marginTop: 4 },
  newInCityBadge: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  newInCityText: { fontSize: Theme.fontSize.xs, fontWeight: Theme.fontWeight.medium },

  groupLabel: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.medium,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
    paddingBottom: 6,
    marginTop: 4,
  },
  settingsGroup: { marginBottom: Theme.spacing.lg, gap: 1 },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderRadius: Theme.radius.md,
  },
  settingsLabel: { fontSize: Theme.fontSize.md },
  settingsValue: { fontSize: Theme.fontSize.sm },

  themeCard: {
    borderRadius: Theme.radius.lg,
    borderWidth: 0.5,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeLabel: {
    fontSize: Theme.fontSize.md,
    fontWeight: '500',
  },
  themeSegment: {
    flexDirection: 'row',
    borderRadius: Theme.radius.md,
    padding: 3,
    gap: 2,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  themeOptionText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: '600',
  },

  nameOverlay: { flex: 1 },
  nameSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: 12,
    paddingBottom: 40,
    gap: Theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  nameSheetTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '700',
  },
  nameInput: {
    height: 46,
    borderRadius: Theme.radius.md,
    borderWidth: 0.5,
    paddingHorizontal: Theme.spacing.md,
    fontSize: Theme.fontSize.base,
  },
  nameSaveBtn: {
    height: 50,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSaveBtnText: {
    color: '#fff',
    fontSize: Theme.fontSize.base,
    fontWeight: '600',
  },
});