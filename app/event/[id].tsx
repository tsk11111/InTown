import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { CATEGORY_EMOJI, useEvents, type OrganizerEvent } from '@/context/events';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrap, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function EventHero({
  event,
  colors,
}: {
  event: OrganizerEvent;
  colors: typeof Colors.light;
}) {
  const categoryKey = event.category.toLowerCase() as keyof typeof colors;
  const catColor = colors[categoryKey] as { bg: string; text: string } | undefined;

  if (event.photos.length > 0) {
    return (
      <Image
        source={{ uri: event.photos[0] }}
        style={styles.heroImage}
        contentFit="cover"
      />
    );
  }

  return (
    <View style={[styles.heroImage, { backgroundColor: catColor?.bg ?? colors.primaryLight }]}>
      <Text style={styles.heroEmoji}>{event.emoji || CATEGORY_EMOJI[event.category]}</Text>
    </View>
  );
}

export default function EventDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEvent } = useEvents();
  const { joinedEventIds, joinEvent, leaveEvent } = useAuth();

  const event = getEvent(id);
  const isJoined = event ? joinedEventIds.includes(event.id) : false;

  if (!event) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>Event not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backFallback}>
          <Text style={[styles.backFallbackText, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categoryKey = event.category.toLowerCase() as keyof typeof colors;
  const catColor = colors[categoryKey] as { bg: string; text: string } | undefined;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Scrollable content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        {/* Hero */}
        <View>
          <EventHero event={event} colors={colors} />
          {/* Back button overlaid on hero */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 12, backgroundColor: 'rgba(0,0,0,0.35)' }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Category badge + Join chat */}
          <View style={styles.topRow}>
            <View style={[styles.badge, { backgroundColor: catColor?.bg ?? colors.primaryLight }]}>
              <Text style={[styles.badgeText, { color: catColor?.text ?? colors.primary }]}>
                {event.category}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.chatBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: event.id } })}
              activeOpacity={0.75}
            >
              <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
              <Text style={[styles.chatBtnText, { color: colors.primary }]}>Join chat</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Info rows */}
          <View style={styles.infoBlock}>
            <InfoRow
              icon="storefront-outline"
              label="Organizer"
              value={event.venue}
              colors={colors}
            />
            <InfoRow
              icon="location-outline"
              label="Location"
              value={event.location}
              colors={colors}
            />
            <InfoRow
              icon="calendar-outline"
              label="Date"
              value={event.date}
              colors={colors}
            />
            <InfoRow
              icon="time-outline"
              label="Time"
              value={event.time}
              colors={colors}
            />
            <InfoRow
              icon="people-outline"
              label="Spots available"
              value={`${event.spots} spots`}
              colors={colors}
            />
            <InfoRow
              icon="ticket-outline"
              label="Price"
              value={event.priceDisplay === 'Free' ? 'Free entry' : `${event.priceDisplay} per person`}
              colors={colors}
            />
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Description */}
          <View style={styles.descBlock}>
            <Text style={[styles.descHeading, { color: colors.text }]}>About this event</Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>
              {event.description}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Join button */}
      <View
        style={[
          styles.joinBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <View style={styles.joinBarInner}>
          <View>
            <Text style={[styles.joinPrice, { color: colors.text }]}>{event.priceDisplay}</Text>
            <Text style={[styles.joinPriceSub, { color: colors.textTertiary }]}>per person</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.joinBtn,
              { backgroundColor: isJoined ? colors.backgroundSecondary : colors.primary,
                borderWidth: isJoined ? 0.5 : 0,
                borderColor: colors.border },
            ]}
            activeOpacity={0.85}
            onPress={() => isJoined ? leaveEvent(event.id) : joinEvent(event.id)}
          >
            <Text style={[styles.joinBtnText, { color: isJoined ? colors.textSecondary : '#fff' }]}>
              {isJoined ? 'Leave event' : 'Join event'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: Theme.fontSize.base },
  backFallback: { padding: 8 },
  backFallbackText: { fontSize: Theme.fontSize.base, fontWeight: '600' },

  heroImage: {
    width: '100%',
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 72 },

  backBtn: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    padding: Theme.spacing.lg,
    gap: Theme.spacing.lg,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
  },
  badgeText: { fontSize: Theme.fontSize.xs, fontWeight: '600' },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    borderWidth: 0.5,
  },
  chatBtnText: { fontSize: Theme.fontSize.xs, fontWeight: '600' },

  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.3,
  },

  divider: { height: 0.5 },

  infoBlock: { gap: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1, gap: 1 },
  infoLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: Theme.fontSize.base, fontWeight: '500' },

  descBlock: { gap: 8 },
  descHeading: { fontSize: Theme.fontSize.md, fontWeight: '600' },
  descText: { fontSize: Theme.fontSize.base, lineHeight: 22 },

  joinBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    paddingTop: 12,
    paddingHorizontal: Theme.spacing.lg,
  },
  joinBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  joinPrice: { fontSize: Theme.fontSize.lg, fontWeight: '700' },
  joinPriceSub: { fontSize: Theme.fontSize.xs, marginTop: 1 },
  joinBtn: {
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: Theme.radius.lg,
  },
  joinBtnText: { color: '#fff', fontSize: Theme.fontSize.base, fontWeight: '600' },
});
