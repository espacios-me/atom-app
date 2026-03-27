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
import { useColors } from "@/hooks/use-colors";


// ─── Section Header ───────────────────────────────────────────
function SectionHeader({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.muted }]}>{title.toUpperCase()}</Text>
  );
}

// ─── Settings Row ─────────────────────────────────────────────
function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  colors,
  rightElement,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  colors: ReturnType<typeof useColors>;
  rightElement?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && onPress && { opacity: 0.7 },
      ]}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: destructive ? colors.error + "20" : colors.primary + "20" }]}>
          <IconSymbol name={icon as any} size={18} color={destructive ? colors.error : colors.primary} />
        </View>
        <Text style={[styles.rowLabel, { color: destructive ? colors.error : colors.foreground }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={[styles.rowValue, { color: colors.muted }]}>{value}</Text>}
        {rightElement}
        {onPress && !rightElement && (
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        )}
      </View>
    </Pressable>
  );
}

// ─── Main Settings Screen ─────────────────────────────────────
export default function SettingsScreen() {
  const colors = useColors();
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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Chat</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <SectionHeader title="Your Data" colors={colors} />
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{memoriesCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Memories</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{goalsCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Active Goals</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>{remindersCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Reminders</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <SectionHeader title="Danger Zone" colors={colors} />
        <SettingsRow
          icon="trash.fill"
          label="Erase All Data"
          onPress={handleEraseAll}
          destructive
          colors={colors}
        />

        {/* About */}
        <SectionHeader title="About" colors={colors} />
        <SettingsRow
          icon="info.circle"
          label="Version"
          value="1.0.0"
          colors={colors}
        />
        <SettingsRow
          icon="wand.and.stars"
          label="Powered by"
          value="OpenAI GPT-4"
          colors={colors}
        />

        <Text style={[styles.footer, { color: colors.muted }]}>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 60,
  },
  backText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  statsCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: "hidden",
    marginBottom: 4,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 0.5,
    marginVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 0.5,
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
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 32,
  },
});
