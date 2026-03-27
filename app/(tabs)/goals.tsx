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
import type { Goal, GoalStatus } from "@/types/atom";

// ─── Status Config ────────────────────────────────────────────
const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  active:    { label: "Active",    color: "#4ADE80" },
  completed: { label: "Done",      color: "#888888" },
  paused:    { label: "Paused",    color: "#FBBF24" },
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
}: {
  goal: Goal;
  onToggle: (id: string, current: GoalStatus) => void;
  onDelete: (id: string) => void;
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
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Pressable
          onPress={() => onToggle(goal.id, goal.status)}
          style={({ pressed }) => [styles.checkBtn, pressed && { opacity: 0.5 }]}
        >
          <IconSymbol
            name={goal.status === "completed" ? "checkmark.circle.fill" : "circle"}
            size={24}
            color={goal.status === "completed" ? "#FFFFFF" : "#2A2A2A"}
          />
        </Pressable>
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.goalText,
              goal.status === "completed" && styles.goalTextDone,
            ]}
          >
            {goal.goal}
          </Text>
          <View style={styles.cardMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + "18" }]}>
              <Text style={[styles.statusText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
            <Text style={styles.dateText}>{date}</Text>
          </View>
        </View>
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.5 }]}
        >
          <IconSymbol name="trash.fill" size={15} color="#555555" />
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
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (text: string) => void;
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
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>New Goal</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="What do you want to achieve?"
            placeholderTextColor="#555555"
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            maxLength={500}
          />
          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.modalCancelBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              disabled={!text.trim()}
              style={({ pressed }) => [
                styles.modalAddBtn,
                { backgroundColor: text.trim() ? "#FFFFFF" : "#2A2A2A" },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[styles.modalAddText, { color: text.trim() ? "#0A0A0A" : "#555555" }]}>
                Add Goal
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
      <Text style={styles.emptySymbol}>◈</Text>
      <Text style={styles.emptyTitle}>No goals yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button to add a goal, or tell Atom "My goal is to..." in the Chat tab.
      </Text>
    </View>
  );
}

// ─── Main Goals Screen ────────────────────────────────────────
export default function GoalsScreen() {
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
      <GoalCard goal={item} onToggle={handleToggle} onDelete={deleteGoal} />
    ),
    [handleToggle, deleteGoal]
  );

  const keyExtractor = useCallback((item: Goal) => item.id, []);

  const activeCount = state.goals.filter((g) => g.status === "active").length;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Goals</Text>
          <Text style={styles.headerSubtitle}>
            {activeCount} active {activeCount === 1 ? "goal" : "goals"}
          </Text>
        </View>
        <Pressable
          onPress={() => setShowModal(true)}
          style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.92 }] }]}
        >
          <IconSymbol name="plus" size={20} color="#0A0A0A" />
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
              activeFilter === item.key ? styles.filterChipActive : styles.filterChipInactive,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[
              styles.filterChipText,
              { color: activeFilter === item.key ? "#0A0A0A" : "#888888" },
            ]}>
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
        ListEmptyComponent={<EmptyState />}
      />

      <AddGoalModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={addGoal}
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
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#FFFFFF",
  },
  filterChipInactive: {
    backgroundColor: "#141414",
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
    backgroundColor: "#141414",
    padding: 16,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkBtn: {
    paddingTop: 1,
  },
  cardContent: {
    flex: 1,
    gap: 8,
  },
  goalText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  goalTextDone: {
    color: "#555555",
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
    color: "#555555",
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
    gap: 16,
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
  modalInput: {
    color: "#FFFFFF",
    backgroundColor: "#0A0A0A",
    borderColor: "#2A2A2A",
    borderWidth: 0.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
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
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  modalAddText: {
    fontSize: 15,
    fontWeight: "700",
  },
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
