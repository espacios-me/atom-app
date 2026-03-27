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
import type { Reminder, Recurrence } from "@/types/atom";

// ─── Recurrence Config ────────────────────────────────────────
const RECURRENCE_CONFIG: Record<Recurrence, { label: string }> = {
  none:    { label: "Once" },
  daily:   { label: "Daily" },
  weekly:  { label: "Weekly" },
  monthly: { label: "Monthly" },
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
}: {
  reminder: Reminder;
  onDelete: (id: string) => void;
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
    <View style={[styles.card, isPast && { opacity: 0.5 }]}>
      <View style={styles.cardLeft}>
        <View style={[styles.clockIcon, { backgroundColor: isPast ? "#1A1A1A" : "#FBBF2418" }]}>
          <IconSymbol name="clock.fill" size={17} color={isPast ? "#555555" : "#FBBF24"} />
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.reminderTitle}>{reminder.title}</Text>
        <View style={styles.cardMeta}>
          <Text style={[styles.dueText, { color: isPast ? "#555555" : "#FBBF24" }]}>
            {formatDueDate(reminder.dueAt)}
          </Text>
          {reminder.recurrence !== "none" && (
            <View style={styles.recurrenceBadge}>
              <IconSymbol name="repeat" size={9} color="#888888" />
              <Text style={styles.recurrenceText}>
                {recurrenceCfg.label}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.5 }]}
      >
        <IconSymbol name="trash.fill" size={15} color="#555555" />
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
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, dueAt: string, recurrence: Recurrence) => void;
}) {
  const [title, setTitle] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");

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
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>New Reminder</Text>

          <TextInput
            style={styles.modalInput}
            placeholder="What do you want to be reminded of?"
            placeholderTextColor="#555555"
            value={title}
            onChangeText={setTitle}
            autoFocus
            maxLength={200}
          />

          <Text style={styles.fieldLabel}>DUE DATE & TIME</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="YYYY-MM-DDTHH:MM"
            placeholderTextColor="#555555"
            value={dueAt}
            onChangeText={setDueAt}
          />

          <Text style={styles.fieldLabel}>REPEAT</Text>
          <View style={styles.recurrenceRow}>
            {RECURRENCE_OPTIONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRecurrence(r)}
                style={({ pressed }) => [
                  styles.recurrenceOption,
                  recurrence === r ? styles.recurrenceOptionActive : styles.recurrenceOptionInactive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[
                  styles.recurrenceOptionText,
                  { color: recurrence === r ? "#0A0A0A" : "#888888" },
                ]}>
                  {RECURRENCE_CONFIG[r].label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.modalCancelBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              disabled={!title.trim()}
              style={({ pressed }) => [
                styles.modalAddBtn,
                { backgroundColor: title.trim() ? "#FFFFFF" : "#2A2A2A" },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[styles.modalAddText, { color: title.trim() ? "#0A0A0A" : "#555555" }]}>
                Set Reminder
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptySymbol}>◷</Text>
      <Text style={styles.emptyTitle}>No reminders</Text>
      <Text style={styles.emptySubtitle}>
        Tap + to add a reminder, or tell Atom "Remind me at 6pm to..." in the Chat tab.
      </Text>
    </View>
  );
}

// ─── Main Reminders Screen ────────────────────────────────────
export default function RemindersScreen() {
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

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reminders</Text>
          <Text style={styles.headerSubtitle}>
            {upcoming.length} upcoming
          </Text>
        </View>
        <Pressable
          onPress={() => setShowModal(true)}
          style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.92 }] }]}
        >
          <IconSymbol name="plus" size={20} color="#0A0A0A" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>UPCOMING</Text>
            {upcoming.map((r) => (
              <ReminderCard key={r.id} reminder={r} onDelete={deleteReminder} />
            ))}
          </>
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>PAST</Text>
            {past.map((r) => (
              <ReminderCard key={r.id} reminder={r} onDelete={deleteReminder} />
            ))}
          </>
        )}

        {/* Empty */}
        {state.reminders.length === 0 && <EmptyState />}
      </ScrollView>

      <AddReminderModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAdd}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2A2A2A",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    color: "#555555",
    fontWeight: "400",
  },
  fab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
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
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#555555",
    marginBottom: 4,
    marginTop: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
    backgroundColor: "#141414",
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  cardLeft: {
    flexShrink: 0,
  },
  clockIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 5,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
    color: "#FFFFFF",
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
    backgroundColor: "#2A2A2A",
  },
  recurrenceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888888",
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalSheet: {
    backgroundColor: "#141414",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2A2A2A",
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#555555",
    marginTop: 4,
  },
  modalInput: {
    color: "#FFFFFF",
    backgroundColor: "#0A0A0A",
    borderColor: "#2A2A2A",
    borderWidth: 0.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  recurrenceOptionActive: {
    backgroundColor: "#FFFFFF",
  },
  recurrenceOptionInactive: {
    backgroundColor: "#0A0A0A",
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
  },
  recurrenceOptionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
    backgroundColor: "#0A0A0A",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#888888",
  },
  modalAddBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  modalAddText: {
    fontSize: 15,
    fontWeight: "700",
  },
  // Empty
  emptyContainer: {
    alignItems: "center",
    paddingTop: 72,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptySymbol: {
    fontSize: 40,
    color: "#2A2A2A",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    color: "#555555",
  },
});
