import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { CATEGORY_EMOJI, DEMO_NOW, isEventPast, useEvents, type OrganizerEvent } from '@/context/events';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function isPastEvent(date: string): boolean {
  return isEventPast(date, '11:59 PM');
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
  const insets = useSafeAreaInsets();
  const { user, isOrganizer, joinedEventIds, leaveEvent } = useAuth();
  const { events } = useEvents();
  const [showingPast, setShowingPast] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<OrganizerEvent | null>(null);

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

  const handleLeave = (event: OrganizerEvent) => setLeaveTarget(event);

  const hasAnything = displayedCreated.length > 0 || displayedJoined.length > 0;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
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

      <Modal
        visible={leaveTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setLeaveTarget(null)}
      >
        <TouchableWithoutFeedback onPress={() => setLeaveTarget(null)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.leaveSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.leaveIconWrap, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="exit-outline" size={26} color="#DC2626" />
          </View>
          <Text style={[styles.leaveTitle, { color: colors.text }]}>Leave event?</Text>
          <Text style={[styles.leaveBody, { color: colors.textSecondary }]}>
            You'll be removed from{' '}
            <Text style={{ color: colors.text, fontWeight: '600' }}>{leaveTarget?.title}</Text>
            {' '}and lose access to the group chat.
          </Text>
          <TouchableOpacity
            style={styles.leaveConfirmBtn}
            onPress={() => {
              if (leaveTarget) leaveEvent(leaveTarget.id);
              setLeaveTarget(null);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.leaveConfirmText}>Leave event</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.leaveCancelBtn, { borderColor: colors.border }]}
            onPress={() => setLeaveTarget(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.leaveCancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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

  modalOverlay: { flex: 1 },
  leaveSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xl,
    alignItems: 'center',
    gap: Theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  leaveIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveTitle: { fontSize: Theme.fontSize.xl, fontWeight: '700' },
  leaveBody: { fontSize: Theme.fontSize.base, textAlign: 'center', lineHeight: 22 },
  leaveConfirmBtn: {
    width: '100%',
    height: 50,
    borderRadius: Theme.radius.lg,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  leaveConfirmText: { color: '#fff', fontSize: Theme.fontSize.base, fontWeight: '600' },
  leaveCancelBtn: {
    width: '100%',
    height: 50,
    borderRadius: Theme.radius.lg,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveCancelText: { fontSize: Theme.fontSize.base, fontWeight: '500' },
});
