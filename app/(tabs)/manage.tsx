import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { CATEGORY_EMOJI, useEvents, type OrganizerEvent } from '@/context/events';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function EventRow({
  event,
  colors,
  onEdit,
  onDelete,
}: {
  event: OrganizerEvent;
  colors: typeof Colors.light;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const categoryKey = event.category.toLowerCase() as keyof typeof colors;
  const catColor = colors[categoryKey] as { bg: string; text: string } | undefined;

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {event.photos.length > 0 ? (
        <Image
          source={{ uri: event.photos[0] }}
          style={styles.rowThumb}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.rowEmoji, { backgroundColor: catColor?.bg ?? colors.primaryLight }]}>
          <Text style={styles.rowEmojiText}>{event.emoji || CATEGORY_EMOJI[event.category]}</Text>
        </View>
      )}

      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: event.status === 'active' ? '#22C55E' : '#F59E0B' },
            ]}
          />
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
            {event.title}
          </Text>
        </View>
        <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
          {event.date} · {event.time}
        </Text>
        <View style={styles.rowFooter}>
          <View
            style={[
              styles.badge,
              { backgroundColor: catColor?.bg ?? colors.primaryLight },
            ]}
          >
            <Text style={[styles.badgeText, { color: catColor?.text ?? colors.primary }]}>
              {event.category}
            </Text>
          </View>
          <Text style={[styles.rowPrice, { color: colors.textSecondary }]}>
            {event.priceDisplay}
          </Text>
        </View>
      </View>

      <View style={styles.rowActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={onEdit}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ManageScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { events, deleteEvent } = useEvents();

  const myEvents = events.filter((e) =>
    e.organizerId ? e.organizerId === user?.id : e.venue === (user?.venue ?? user?.name)
  );

  const handleDelete = (event: OrganizerEvent) => {
    Alert.alert(
      'Delete event',
      `Remove "${event.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEvent(event.id),
        },
      ]
    );
  };

  const activeCount = myEvents.filter((e) => e.status === 'active').length;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.backgroundTertiary }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Event Management</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {user?.venue ?? user?.name}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/create-event')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>New Event</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.statsRow,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>{myEvents.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>{activeCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {myEvents.length - activeCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Draft</Text>
        </View>
      </View>

      <FlatList
        data={myEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <EventRow
            event={item}
            colors={colors}
            onEdit={() => router.push({ pathname: '/create-event', params: { id: item.id } })}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No events yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Tap "New Event" to create your first listing.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: '600',
  },
  headerSub: {
    fontSize: Theme.fontSize.sm,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.radius.md,
  },
  createBtnText: {
    color: '#fff',
    fontSize: Theme.fontSize.sm,
    fontWeight: '600',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 0.5,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: Theme.fontSize.xs,
    fontWeight: '500',
  },
  statDivider: {
    width: 0.5,
    height: 32,
  },

  list: { padding: Theme.spacing.md, gap: 10 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Theme.radius.lg,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  rowThumb: {
    width: 60,
    alignSelf: 'stretch',
  },
  rowEmoji: {
    width: 60,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmojiText: { fontSize: 26 },
  rowBody: {
    flex: 1,
    padding: Theme.spacing.md,
    gap: 4,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  rowTitle: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    fontWeight: '500',
  },
  rowMeta: { fontSize: Theme.fontSize.xs },
  rowFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: Theme.radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  rowPrice: { fontSize: Theme.fontSize.xs },

  rowActions: {
    paddingRight: Theme.spacing.md,
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: Theme.radius.sm,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: Theme.fontSize.lg, fontWeight: '600' },
  emptyText: { fontSize: Theme.fontSize.sm, textAlign: 'center', maxWidth: 220 },
});
