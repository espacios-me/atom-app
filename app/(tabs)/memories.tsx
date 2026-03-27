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
const KIND_CONFIG: Record<MemoryKind, { symbol: string; label: string }> = {
  preference: { symbol: "◎", label: "Preference" },
  fact:       { symbol: "●", label: "Fact" },
  person:     { symbol: "◈", label: "Person" },
  project:    { symbol: "▣", label: "Project" },
  note:       { symbol: "◷", label: "Note" },
};

// ─── Importance Stars ─────────────────────────────────────────
function ImportanceStars({ importance }: { importance: number }) {
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
}: {
  memory: Memory;
  onDelete: (id: string) => void;
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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.kindBadge}>
          <Text style={styles.kindSymbol}>{kindCfg.symbol}</Text>
          <Text style={styles.kindLabel}>{kindCfg.label}</Text>
        </View>
        <ImportanceStars importance={memory.importance} />
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.5 }]}
        >
          <IconSymbol name="trash.fill" size={15} color="#555555" />
        </Pressable>
      </View>
      <Text style={styles.cardText}>{memory.text}</Text>
      <Text style={styles.cardDate}>{date}</Text>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyState({ filter }: { filter: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptySymbol}>◎</Text>
      <Text style={styles.emptyTitle}>No memories yet</Text>
      <Text style={styles.emptySubtitle}>
        {filter === "all"
          ? "Tell Atom to \"remember\" something in the Chat tab and it will appear here."
          : `No ${filter} memories saved yet.`}
      </Text>
    </View>
  );
}

// ─── Main Memories Screen ─────────────────────────────────────
export default function MemoriesScreen() {
  const { state, deleteMemory } = useAtom();
  const [activeFilter, setActiveFilter] = useState<MemoryKind | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMemories = useMemo(() => {
    let list = [...state.memories].reverse();
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
      <MemoryCard memory={item} onDelete={deleteMemory} />
    ),
    [deleteMemory]
  );

  const keyExtractor = useCallback((item: Memory) => item.id, []);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Memories</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{state.memories.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <IconSymbol name="magnifyingglass" size={15} color="#555555" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search memories..."
          placeholderTextColor="#555555"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <IconSymbol name="xmark.circle.fill" size={15} color="#555555" />
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
              activeFilter === item.key ? styles.filterChipActive : styles.filterChipInactive,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: activeFilter === item.key ? "#0A0A0A" : "#888888" },
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
        ListEmptyComponent={<EmptyState filter={activeFilter} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#2A2A2A",
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888888",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
    backgroundColor: "#141414",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "400",
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
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#2A2A2A",
  },
  kindSymbol: {
    fontSize: 11,
    color: "#888888",
  },
  kindLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888888",
  },
  stars: {
    flexDirection: "row",
    flex: 1,
  },
  star: {
    fontSize: 11,
    color: "#FBBF24",
  },
  deleteBtn: {
    padding: 4,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#FFFFFF",
    fontWeight: "400",
  },
  cardDate: {
    fontSize: 12,
    color: "#555555",
    fontWeight: "400",
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
    fontWeight: "400",
  },
});
