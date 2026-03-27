import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAtom } from "@/lib/atom-store";
import { useColors } from "@/hooks/use-colors";
import type { Memory, MemoryKind } from "@/types/atom";

// ─── Filter Tabs ──────────────────────────────────────────────
const FILTERS: Array<{ key: MemoryKind | "all"; label: string }> = [
  { key: "all",        label: "All" },
  { key: "preference", label: "Preferences" },
  { key: "fact",       label: "Facts" },
  { key: "person",     label: "People" },
  { key: "project",    label: "Projects" },
  { key: "note",       label: "Notes" },
];

// ─── Kind Badge Config ────────────────────────────────────────
const KIND_CONFIG: Record<MemoryKind, { emoji: string; color: string }> = {
  preference: { emoji: "💡", color: "#6C63FF" },
  fact:       { emoji: "📌", color: "#3B82F6" },
  person:     { emoji: "👤", color: "#10B981" },
  project:    { emoji: "🗂️", color: "#F59E0B" },
  note:       { emoji: "📝", color: "#EC4899" },
};

// ─── Importance Stars ─────────────────────────────────────────
function ImportanceStars({ importance, color }: { importance: number; color: string }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={[styles.star, { opacity: i <= importance ? 1 : 0.2 }]}>
          ★
        </Text>
      ))}
    </View>
  );
}

// ─── Memory Card ──────────────────────────────────────────────
function MemoryCard({
  memory,
  onDelete,
  colors,
}: {
  memory: Memory;
  onDelete: (id: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const kindCfg = KIND_CONFIG[memory.kind];
  const date = new Date(memory.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleDelete = () => {
    Alert.alert("Delete Memory", `Remove "${memory.text.slice(0, 50)}${memory.text.length > 50 ? "…" : ""}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onDelete(memory.id);
        },
      },
    ]);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.kindBadge, { backgroundColor: kindCfg.color + "20" }]}>
          <Text style={styles.kindEmoji}>{kindCfg.emoji}</Text>
          <Text style={[styles.kindLabel, { color: kindCfg.color }]}>
            {memory.kind.charAt(0).toUpperCase() + memory.kind.slice(1)}
          </Text>
        </View>
        <ImportanceStars importance={memory.importance} color={kindCfg.color} />
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
        >
          <IconSymbol name="trash.fill" size={16} color={colors.error} />
        </Pressable>
      </View>
      <Text style={[styles.cardText, { color: colors.foreground }]}>{memory.text}</Text>
      <Text style={[styles.cardDate, { color: colors.muted }]}>{date}</Text>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyState({ filter, colors }: { filter: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🧠</Text>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No memories yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
        {filter === "all"
          ? "Tell Atom to \"remember\" something in the Chat tab and it will appear here."
          : `No ${filter} memories saved yet.`}
      </Text>
    </View>
  );
}

// ─── Main Memories Screen ─────────────────────────────────────
export default function MemoriesScreen() {
  const colors = useColors();
  const { state, deleteMemory } = useAtom();
  const [activeFilter, setActiveFilter] = useState<MemoryKind | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMemories = useMemo(() => {
    let list = [...state.memories].reverse(); // newest first
    if (activeFilter !== "all") {
      list = list.filter((m) => m.kind === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => m.text.toLowerCase().includes(q));
    }
    return list;
  }, [state.memories, activeFilter, searchQuery]);

  const renderItem = useCallback(
    ({ item }: { item: Memory }) => (
      <MemoryCard memory={item} onDelete={deleteMemory} colors={colors} />
    ),
    [deleteMemory, colors]
  );

  const keyExtractor = useCallback((item: Memory) => item.id, []);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Memories</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{state.memories.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search memories..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <IconSymbol name="xmark.circle.fill" size={16} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* Filter Tabs */}
      <FlatList
        horizontal
        data={FILTERS}
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
            <Text
              style={[
                styles.filterChipText,
                { color: activeFilter === item.key ? "#FFFFFF" : colors.muted },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {/* Memory List */}
      <FlatList
        data={filteredMemories}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState filter={activeFilter} colors={colors} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: "600",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
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
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  kindBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  kindEmoji: {
    fontSize: 12,
  },
  kindLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  stars: {
    flexDirection: "row",
    flex: 1,
  },
  star: {
    fontSize: 12,
    color: "#F59E0B",
  },
  deleteBtn: {
    padding: 4,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  cardDate: {
    fontSize: 12,
  },
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
