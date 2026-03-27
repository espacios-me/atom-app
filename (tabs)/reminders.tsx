import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAtom } from "@/lib/atom-store";
import { useColors } from "@/hooks/use-colors";
import type { Reminder, Recurrence } from "@/types/atom";

// ─── Recurrence Config ────────────────────────────────────────
const RECURRENCE_CONFIG: Record<Recurrence, { label: string; color: string }> = {
  none:    { label: "Once",    color: "#6C63FF" },
  daily:   { label: "Daily",   color: "#10B981" },
  weekly:  { label: "Weekly",  color: "#3B82F6" },
  monthly: { label: "Monthly", color: "#F59E0B" },
};

// ─── Format Date ──────────────────────────────────────────────
function formatDueDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (days === 0) return `Today at ${timeStr}`;
  if (days === 1) return `Tomorrow at ${timeStr}`;
  if (days === -1) return `Yesterday at ${timeStr}`;
  if (days < 0) return `${dateStr} at ${timeStr}`;
  if (days < 7) return `${date.toLocaleDateString("en-US", { weekday: "long" })} at ${timeStr}`;
  return `${dateStr} at ${timeStr}`;
}

// ─── Reminder Card ────────────────────────────────────────────
function ReminderCard({
  reminder,
  onDelete,
  colors,
}: {
  reminder: Reminder;
  onDelete: (id: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const recurrenceCfg = RECURRENCE_CONFIG[reminder.recurrence];
  const isPast = new Date(reminder.dueAt) < new Date();

  const handleDelete = () => {
    Alert.alert("Delete Reminder", `Remove "${reminder.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onDelete(reminder.id);
        },
      },
    ]);
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isPast && { opacity: 0.6 },
      ]}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.clockIcon, { backgroundColor: isPast ? colors.border : colors.warning + "20" }]}>
          <IconSymbol name="clock.fill" size={18} color={isPast ? colors.muted : colors.warning} />
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.reminderTitle, { color: colors.foreground }]}>{reminder.title}</Text>
        <View style={styles.cardMeta}>
          <Text style={[styles.dueText, { color: isPast ? colors.muted : colors.warning }]}>
            {formatDueDate(reminder.dueAt)}
          </Text>
          {reminder.recurrence !== "none" && (
            <View style={[styles.recurrenceBadge, { backgroundColor: recurrenceCfg.color + "20" }]}>
              <IconSymbol name="repeat" size={10} color={recurrenceCfg.color} />
              <Text style={[styles.recurrenceText, { color: recurrenceCfg.color }]}>
                {recurrenceCfg.label}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
      >
        <IconSymbol name="trash.fill" size={16} color={colors.error} />
      </Pressable>
    </View>
  );
}

// ─── Add Reminder Modal ───────────────────────────────────────
const RECURRENCE_OPTIONS: Recurrence[] = ["none", "daily", "weekly", "monthly"];

function AddReminderModal({
  visible,
  onClose,
  onAdd,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, dueAt: string, recurrence: Recurrence) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [title, setTitle] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");

  // Default to tomorrow at 9am
  const defaultDue = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };
  const [dueAt, setDueAt] = useState(defaultDue);

  const handleAdd = () => {
    if (!title.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd(title.trim(), new Date(dueAt).toISOString(), recurrence);
    setTitle("");
    setDueAt(defaultDue());
    setRecurrence("none");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Reminder</Text>

          <TextInput
            style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="What do you want to be reminded of?"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            autoFocus
            maxLength={200}
          />

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Due Date & Time</Text>
          <TextInput
            style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="YYYY-MM-DDTHH:MM"
            placeholderTextColor={colors.muted}
            value={dueAt}
            onChangeText={setDueAt}
          />

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Repeat</Text>
          <View style={styles.recurrenceRow}>
            {RECURRENCE_OPTIONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRecurrence(r)}
                style={({ pressed }) => [
                  styles.recurrenceOption,
                  recurrence === r
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.recurrenceOptionText, { color: recurrence === r ? "#FFFFFF" : colors.muted }]}>
                  {RECURRENCE_CONFIG[r].label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.modalCancelBtn, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.modalCancelText, { color: colors.muted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              disabled={!title.trim()}
              style={({ pressed }) => [
                styles.modalAddBtn,
                { backgroundColor: title.trim() ? colors.primary : colors.border },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.modalAddText}>Set Reminder</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyState({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⏰</Text>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No reminders</Text>
      <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
        Tap + to add a reminder, or tell Atom "Remind me at 6pm to..." in the Chat tab.
      </Text>
    </View>
  );
}

// ─── Main Reminders Screen ────────────────────────────────────
export default function RemindersScreen() {
  const colors = useColors();
  const { state, addReminder, deleteReminder } = useAtom();
  const [showModal, setShowModal] = useState(false);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const sorted = [...state.reminders].sort(
      (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    );
    return {
      upcoming: sorted.filter((r) => new Date(r.dueAt) >= now),
      past: sorted.filter((r) => new Date(r.dueAt) < now).reverse(),
    };
  }, [state.reminders]);

  const handleAdd = useCallback(
    (title: string, dueAt: string, recurrence: Recurrence) => {
      addReminder({ title, dueAt, recurrence });
    },
    [addReminder]
  );

  const renderItem = useCallback(
    ({ item }: { item: Reminder }) => (
      <ReminderCard reminder={item} onDelete={deleteReminder} colors={colors} />
    ),
    [deleteReminder, colors]
  );

  const keyExtractor = useCallback((item: Reminder) => item.id, []);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Reminders</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            {upcoming.length} upcoming
          </Text>
        </View>
        <Pressable
          onPress={() => setShowModal(true)}
          style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary }, pressed && { transform: [{ scale: 0.95 }] }]}
        >
          <IconSymbol name="plus" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>UPCOMING</Text>
            {upcoming.map((r) => (
              <ReminderCard key={r.id} reminder={r} onDelete={deleteReminder} colors={colors} />
            ))}
          </>
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>PAST</Text>
            {past.map((r) => (
              <ReminderCard key={r.id} reminder={r} onDelete={deleteReminder} colors={colors} />
            ))}
          </>
        )}

        {/* Empty */}
        {state.reminders.length === 0 && <EmptyState colors={colors} />}
      </ScrollView>

      <AddReminderModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAdd}
        colors={colors}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  cardLeft: {
    flexShrink: 0,
  },
  clockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  dueText: {
    fontSize: 12,
    fontWeight: "500",
  },
  recurrenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recurrenceText: {
    fontSize: 11,
    fontWeight: "600",
  },
  deleteBtn: {
    padding: 4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 0.5,
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginTop: 4,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 14,
    fontSize: 15,
  },
  recurrenceRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  recurrenceOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  recurrenceOptionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalAddBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  modalAddText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Empty
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
