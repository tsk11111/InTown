import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { CATEGORY_EMOJI, useEvents, type OrganizerEvent } from '@/context/events';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MONTH_MAP: Record<string, number> = {
  ian: 0, feb: 1, mar: 2, apr: 3, mai: 4, iun: 5,
  iul: 6, aug: 7, sep: 8, oct: 9, noi: 10, dec: 11,
  jan: 0, may: 4, jun: 5, jul: 6, nov: 10,
};

function isPastEvent(date: string): boolean {
  const lower = date.toLowerCase();
  let month = -1;
  for (const [key, val] of Object.entries(MONTH_MAP)) {
    if (lower.includes(key)) { month = val; break; }
  }
  if (month === -1) return false;
  const dayMatch = date.match(/\d+/);
  if (!dayMatch) return false;
  const day = parseInt(dayMatch[0], 10);
  const now = new Date();
  const eventDate = new Date(now.getFullYear(), month, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return eventDate < today;
}

function SectionLabel({
  text,
  colors,
}: {
  text: string;
  colors: typeof Colors.light;
}) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{text}</Text>
  );
}

function EventRow({
  event,
  isPast,
  colors,
  onLeave,
  onEdit,
}: {
  event: OrganizerEvent;
  isPast: boolean;
  colors: typeof Colors.light;
  onLeave?: () => void;
  onEdit?: () => void;
}) {
  const categoryKey = event.category.toLowerCase() as keyof typeof colors;
  const catColor = colors[categoryKey] as { bg: string; text: string } | undefined;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isPast && styles.rowPast,
      ]}
      activeOpacity={0.75}
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
    >
      <View style={[styles.rowIcon, { backgroundColor: catColor?.bg ?? colors.primaryLight }]}>
        <Text style={styles.rowEmoji}>{event.emoji || CATEGORY_EMOJI[event.category]}</Text>
      </View>

      <View style={styles.rowInfo}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={[styles.rowVenue, { color: colors.textSecondary }]} numberOfLines={1}>
          {event.venue} · {event.city}
        </Text>
        <Text style={[styles.rowDate, { color: isPast ? colors.textTertiary : colors.primary }]}>
          {event.date}{event.time ? ` · ${event.time}` : ''}
        </Text>
      </View>

      {!isPast && onEdit && (
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={onEdit}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      )}

      {!isPast && onLeave && (
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={onLeave}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.actionBtnText, { color: colors.textTertiary }]}>Leave</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function MyEventsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isOrganizer, joinedEventIds, leaveEvent } = useAuth();
  const { events } = useEvents();
  const [showingPast, setShowingPast] = useState(false);

  const createdEvents = useMemo(
    () => (isOrganizer ? events.filter((e) => e.organizerId === user?.id) : []),
    [events, user?.id, isOrganizer]
  );

  const displayedCreated = useMemo(
    () => showingPast
      ? createdEvents.filter((e) => isPastEvent(e.date))
      : createdEvents.filter((e) => !isPastEvent(e.date)),
    [createdEvents, showingPast]
  );

  const joinedEvents = useMemo(
    () => events.filter((e) => joinedEventIds.includes(e.id)),
    [events, joinedEventIds]
  );

  const displayedJoined = useMemo(
    () => showingPast
      ? joinedEvents.filter((e) => isPastEvent(e.date))
      : joinedEvents.filter((e) => !isPastEvent(e.date)),
    [joinedEvents, showingPast]
  );

  const handleLeave = (event: OrganizerEvent) => {
    Alert.alert(
      'Leave event',
      `Leave "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => leaveEvent(event.id) },
      ]
    );
  };

  const hasAnything = displayedCreated.length > 0 || displayedJoined.length > 0;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar</Text>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            {
              backgroundColor: showingPast ? colors.primaryLight : colors.backgroundSecondary,
              borderColor: showingPast ? colors.primaryMid : colors.border,
            },
          ]}
          onPress={() => setShowingPast((v) => !v)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showingPast ? 'calendar-outline' : 'time-outline'}
            size={13}
            color={showingPast ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.toggleText, { color: showingPast ? colors.primary : colors.textSecondary }]}>
            {showingPast ? 'Upcoming' : 'Past events'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, !hasAnything && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
      >
        {/* Created events section (organizer only) */}
        {isOrganizer && (
          <>
            <SectionLabel text="YOUR EVENTS" colors={colors} />
            {displayedCreated.length > 0 ? (
              displayedCreated.map((item) => (
                <EventRow
                  key={item.id}
                  event={item}
                  isPast={showingPast}
                  colors={colors}
                  onEdit={() => router.push({ pathname: '/create-event', params: { id: item.id } })}
                />
              ))
            ) : (
              <View style={[styles.sectionEmpty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionEmptyText, { color: colors.textSecondary }]}>
                  {showingPast ? 'No past events created.' : 'No upcoming events created.'}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Joined events section */}
        <SectionLabel
          text={isOrganizer ? 'EVENTS JOINED' : 'YOUR EVENTS'}
          colors={colors}
        />
        {displayedJoined.length > 0 ? (
          displayedJoined.map((item) => (
            <EventRow
              key={item.id}
              event={item}
              isPast={showingPast}
              colors={colors}
              onLeave={() => handleLeave(item)}
            />
          ))
        ) : (
          !isOrganizer && !showingPast ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} style={styles.emptyIcon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>You are not part of any events</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Once you join an event/trip it will show up here.
              </Text>
              <TouchableOpacity
                style={[styles.browseBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.85}
              >
                <Text style={styles.browseBtnText}>Browse events</Text>
              </TouchableOpacity>
            </View>
          ) : !isOrganizer && showingPast ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={colors.textTertiary} style={styles.emptyIcon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No past events</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Events you've attended will appear here.
              </Text>
            </View>
          ) : (
            <View style={[styles.sectionEmpty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionEmptyText, { color: colors.textSecondary }]}>
                {showingPast ? 'No past events joined.' : 'No upcoming events joined.'}
              </Text>
            </View>
          )
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: Theme.fontSize.lg, fontWeight: '500' },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    borderWidth: 0.5,
  },
  toggleText: { fontSize: Theme.fontSize.xs, fontWeight: '600' },

  list: { padding: Theme.spacing.md, gap: 8 },
  listEmpty: { flex: 1 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: Theme.spacing.md,
    marginBottom: 4,
  },

  sectionEmpty: {
    borderRadius: Theme.radius.lg,
    borderWidth: 0.5,
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  sectionEmptyText: { fontSize: Theme.fontSize.sm },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Theme.radius.lg,
    borderWidth: 0.5,
    padding: Theme.spacing.md,
    gap: 12,
  },
  rowPast: { opacity: 0.6 },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowEmoji: { fontSize: 22 },

  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: Theme.fontSize.md, fontWeight: '500', marginBottom: 2 },
  rowVenue: { fontSize: Theme.fontSize.sm, marginBottom: 2 },
  rowDate: { fontSize: Theme.fontSize.xs, fontWeight: '500' },

  actionBtn: {
    borderWidth: 0.5,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  actionBtnText: { fontSize: Theme.fontSize.xs, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { marginBottom: 4 },
  emptyTitle: { fontSize: Theme.fontSize.base, fontWeight: '600', textAlign: 'center' },
  emptySubtitle: { fontSize: Theme.fontSize.sm, textAlign: 'center', maxWidth: 240, marginBottom: 8 },
  browseBtn: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Theme.radius.md,
  },
  browseBtnText: { color: '#fff', fontSize: Theme.fontSize.sm, fontWeight: '600' },

  bottomPad: { height: 32 },
});
