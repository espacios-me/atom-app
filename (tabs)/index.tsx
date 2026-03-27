import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAtom } from "@/lib/atom-store";
import { useColors } from "@/hooks/use-colors";
import type { ChatMessage, Intent } from "@/types/atom";

// ─── Intent Badge Config ──────────────────────────────────────
const INTENT_LABELS: Partial<Record<Intent, { label: string; emoji: string }>> = {
  remember:      { label: "Memory saved",    emoji: "🧠" },
  recall:        { label: "Recalling",        emoji: "💭" },
  remind:        { label: "Reminder set",     emoji: "⏰" },
  goals:         { label: "Goal saved",       emoji: "🎯" },
  log_behavior:  { label: "Logged",           emoji: "📊" },
  delete_memory: { label: "Memory deleted",   emoji: "🗑️" },
  erase_all:     { label: "Data erased",      emoji: "⚠️" },
};

// ─── Quick Actions ────────────────────────────────────────────
const QUICK_ACTIONS = [
  "What do you remember?",
  "Set a reminder",
  "My goals",
  "Remember this:",
];

// ─── Message Bubble ───────────────────────────────────────────
function MessageBubble({ message, colors }: { message: ChatMessage; colors: ReturnType<typeof useColors> }) {
  const isUser = message.role === "user";
  const intentInfo = message.intent ? INTENT_LABELS[message.intent] : null;
  const hasBadge = intentInfo && (
    (message.memoriesSaved ?? 0) > 0 ||
    (message.goalsSaved ?? 0) > 0 ||
    message.reminderSet
  );

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAtom]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>A</Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser
          ? [styles.bubbleUser, { backgroundColor: colors.primary }]
          : [styles.bubbleAtom, { backgroundColor: colors.surface, borderColor: colors.border }],
      ]}>
        <Text style={[
          styles.bubbleText,
          { color: isUser ? "#FFFFFF" : colors.foreground },
        ]}>
          {message.text}
        </Text>
        {hasBadge && intentInfo && (
          <View style={[styles.intentBadge, { backgroundColor: isUser ? "rgba(255,255,255,0.2)" : colors.background }]}>
            <Text style={[styles.intentBadgeText, { color: isUser ? "#FFFFFF" : colors.primary }]}>
              {intentInfo.emoji} {intentInfo.label}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────
function TypingIndicator({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAtom]}>
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.avatarText}>A</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleAtom, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    </View>
  );
}

// ─── Welcome State ────────────────────────────────────────────
function WelcomeState({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.welcomeContainer}>
      <View style={[styles.welcomeIconBg, { backgroundColor: colors.surface }]}>
        <Text style={styles.welcomeIcon}>🧠</Text>
      </View>
      <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
        Hi, I'm Atom
      </Text>
      <Text style={[styles.welcomeSubtitle, { color: colors.muted }]}>
        Your personal memory assistant. Tell me what to remember, set reminders, or track your goals.
      </Text>
      <View style={styles.welcomeHints}>
        {[
          { emoji: "💡", text: "\"Remember I prefer email\"" },
          { emoji: "⏰", text: "\"Remind me at 6pm to call Ahmed\"" },
          { emoji: "🎯", text: "\"My goal is to read more\"" },
          { emoji: "💭", text: "\"What do you remember?\"" },
        ].map((hint, i) => (
          <View key={i} style={[styles.hintRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.hintEmoji}>{hint.emoji}</Text>
            <Text style={[styles.hintText, { color: colors.muted }]}>{hint.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Chat Screen ─────────────────────────────────────────
export default function ChatScreen() {
  const colors = useColors();
  const { state, sendMessage } = useAtom();
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await sendMessage(text);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [inputText, sendMessage]);

  const handleQuickAction = useCallback((action: string) => {
    setInputText(action);
  }, []);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <MessageBubble message={item} colors={colors} />
  ), [colors]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.headerAvatarText}>A</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Atom</Text>
            <Text style={[styles.headerSubtitle, { color: colors.success }]}>● Active</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
        >
          <IconSymbol name="gearshape.fill" size={22} color={colors.muted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {state.messages.length === 0 ? (
          <WelcomeState colors={colors} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={state.messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListFooterComponent={state.isTyping ? <TypingIndicator colors={colors} /> : null}
          />
        )}

        {/* Quick Actions (only when empty) */}
        {state.messages.length === 0 && (
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action}
                onPress={() => handleQuickAction(action)}
                style={({ pressed }) => [
                  styles.quickChip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.quickChipText, { color: colors.primary }]}>{action}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Message Atom..."
              placeholderTextColor={colors.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || state.isTyping}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: inputText.trim() && !state.isTyping ? colors.primary : colors.border },
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerBtn: {
    padding: 6,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubbleRowAtom: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAtom: {
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  intentBadge: {
    marginTop: 6,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  intentBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  welcomeIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  welcomeIcon: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  welcomeHints: {
    width: "100%",
    gap: 8,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  hintEmoji: {
    fontSize: 18,
  },
  hintText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  inputBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 120,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
