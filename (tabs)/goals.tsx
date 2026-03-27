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
} from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAtom } from "@/lib/atom-store";
import { useColors } from "@/hooks/use-colors";
import type { Goal, GoalStatus } from "@/types/atom";

// ─── Status Config ────────────────────────────────────────────
const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; emoji: string }> = {
  active:    { label: "Active",    color: "#10B981", emoji: "🎯" },
  completed: { label: "Done",      color: "#6C63FF", emoji: "✅" },
  paused:    { label: "Paused",    color: "#F59E0B", emoji: "⏸️" },
};

// ─── Filter Tabs ──────────────────────────────────────────────
const STATUS_FILTERS: Array<{ key: GoalStatus | "all"; label: string }> = [
  { key: "all",       label: "All" },
  { key: "active",    label: "Active" },
  { key: "completed", label: "Done" },
  { key: "paused",    label: "Paused" },
];

// ─── Goal Card ────────────────────────────────────────────────
function GoalCard({
  goal,
  onToggle,
  onDelete,
  colors,
}: {
  goal: Goal;
  onToggle: (id: string, current: GoalStatus) => void;
  onDelete: (id: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const statusCfg = STATUS_CONFIG[goal.status];
  const date = new Date(goal.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const handleDelete = () => {
    Alert.alert("Delete Goal", `Remove "${goal.goal.slice(0, 60)}${goal.goal.length > 60 ? "…" : ""}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onDelete(goal.id);
        },
      },
    ]);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardRow}>
        <Pressable
          onPress={() => onToggle(goal.id, goal.status)}
          style={({ pressed }) => [styles.checkBtn, pressed && { opacity: 0.6 }]}
        >
          <IconSymbol
            name={goal.status === "completed" ? "checkmark.circle.fill" : "circle"}
            size={26}
            color={goal.status === "completed" ? colors.primary : colors.border}
          />
        </Pressable>
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.goalText,
              { color: colors.foreground },
              goal.status === "completed" && styles.goalTextDone,
            ]}
          >
            {goal.goal}
          </Text>
          <View style={styles.cardMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + "20" }]}>
              <Text style={[styles.statusText, { color: statusCfg.color }]}>
                {statusCfg.emoji} {statusCfg.label}
              </Text>
            </View>
            <Text style={[styles.dateText, { color: colors.muted }]}>{date}</Text>
          </View>
        </View>
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
        >
          <IconSymbol name="trash.fill" size={16} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Add Goal Modal ───────────────────────────────────────────
function AddGoalModal({
  visible,
  onClose,
  onAdd,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (text: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (!text.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd(text.trim());
    setText("");
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
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Goal</Text>
          <TextInput
            style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="What do you want to achieve?"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            maxLength={500}
          />
          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.modalCancelBtn, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.modalCancelText, { color: colors.muted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              disabled={!text.trim()}
              style={({ pressed }) => [
                styles.modalAddBtn,
                { backgroundColor: text.trim() ? colors.primary : colors.border },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.modalAddText}>Add Goal</Text>
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
      <Text style={styles.emptyIcon}>🎯</Text>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No goals yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
        Tap the + button to add a goal, or tell Atom "My goal is to..." in the Chat tab.
      </Text>
    </View>
  );
}

// ─── Main Goals Screen ────────────────────────────────────────
export default function GoalsScreen() {
  const colors = useColors();
  const { state, addGoal, updateGoal, deleteGoal } = useAtom();
  const [activeFilter, setActiveFilter] = useState<GoalStatus | "all">("all");
  const [showModal, setShowModal] = useState(false);

  const filteredGoals = useMemo(() => {
    let list = [...state.goals].reverse();
    if (activeFilter !== "all") {
      list = list.filter((g) => g.status === activeFilter);
    }
    return list;
  }, [state.goals, activeFilter]);

  const handleToggle = useCallback(
    (id: string, current: GoalStatus) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const next: GoalStatus = current === "completed" ? "active" : "completed";
      updateGoal(id, { status: next });
    },
    [updateGoal]
  );

  const renderItem = useCallback(
    ({ item }: { item: Goal }) => (
      <GoalCard goal={item} onToggle={handleToggle} onDelete={deleteGoal} colors={colors} />
    ),
    [handleToggle, deleteGoal, colors]
  );

  const keyExtractor = useCallback((item: Goal) => item.id, []);

  const activeCount = state.goals.filter((g) => g.status === "active").length;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Goals</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            {activeCount} active {activeCount === 1 ? "goal" : "goals"}
          </Text>
        </View>
        <Pressable
          onPress={() => setShowModal(true)}
          style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary }, pressed && { transform: [{ scale: 0.95 }] }]}
        >
          <IconSymbol name="plus" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setActiveFilter(item.key)}
            style={({ pressed }) => [
              styles.filterChip,
              activeFilter === item.key
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.filterChipText, { color: activeFilter === item.key ? "#FFFFFF" : colors.muted }]}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {/* Goals List */}
      <FlatList
        data={filteredGoals}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState colors={colors} />}
      />

      <AddGoalModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={addGoal}
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
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.5,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkBtn: {
    paddingTop: 2,
  },
  cardContent: {
    flex: 1,
    gap: 8,
  },
  goalText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  goalTextDone: {
    opacity: 0.5,
    textDecorationLine: "line-through",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
  },
  deleteBtn: {
    padding: 4,
    paddingTop: 2,
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
    gap: 16,
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
  modalInput: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
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
