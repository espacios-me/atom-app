import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAtom } from "@/lib/atom-store";

// ─── Section Header ───────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>
  );
}

// ─── Settings Row ─────────────────────────────────────────────
function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  rightElement,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  rightElement?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && { opacity: 0.6 },
      ]}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: destructive ? "#F8717118" : "#FFFFFF18" }]}>
          <IconSymbol name={icon as any} size={17} color={destructive ? "#F87171" : "#FFFFFF"} />
        </View>
        <Text style={[styles.rowLabel, { color: destructive ? "#F87171" : "#FFFFFF" }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {rightElement}
        {onPress && !rightElement && (
          <IconSymbol name="chevron.right" size={14} color="#555555" />
        )}
      </View>
    </Pressable>
  );
}

// ─── Main Settings Screen ─────────────────────────────────────
export default function SettingsScreen() {
  const { state, eraseAll } = useAtom();

  const handleEraseAll = () => {
    Alert.alert(
      "Erase All Data",
      "This will permanently delete all your memories, goals, reminders, and chat history. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase Everything",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            eraseAll();
            router.back();
          },
        },
      ]
    );
  };

  const memoriesCount = state.memories.length;
  const goalsCount = state.goals.filter((g) => g.status === "active").length;
  const remindersCount = state.reminders.filter((r) => r.status === "scheduled").length;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
        >
          <IconSymbol name="chevron.left" size={22} color="#FFFFFF" />
          <Text style={styles.backText}>Chat</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <SectionHeader title="Your Data" />
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{memoriesCount}</Text>
            <Text style={styles.statLabel}>Memories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#4ADE80" }]}>{goalsCount}</Text>
            <Text style={styles.statLabel}>Active Goals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#FBBF24" }]}>{remindersCount}</Text>
            <Text style={styles.statLabel}>Reminders</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <SectionHeader title="Danger Zone" />
        <SettingsRow
          icon="trash.fill"
          label="Erase All Data"
          onPress={handleEraseAll}
          destructive
        />

        {/* About */}
        <SectionHeader title="About" />
        <SettingsRow
          icon="info.circle"
          label="Version"
          value="1.0.0"
        />
        <SettingsRow
          icon="wand.and.stars"
          label="Powered by"
          value="OpenAI GPT-4"
        />

        <Text style={styles.footer}>
          Atom — Personal Memory Assistant{"\n"}
          Based on the Atom Feasibility Thesis (March 2026)
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2A2A2A",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 60,
  },
  backText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#555555",
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  statsCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
    backgroundColor: "#141414",
    overflow: "hidden",
    marginBottom: 4,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 3,
    color: "#555555",
    fontWeight: "500",
  },
  statDivider: {
    width: 0.5,
    backgroundColor: "#2A2A2A",
    marginVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
    backgroundColor: "#141414",
    marginBottom: 4,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowValue: {
    fontSize: 14,
    color: "#555555",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 32,
    color: "#555555",
    fontWeight: "400",
  },
});
