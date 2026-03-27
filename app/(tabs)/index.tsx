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
import type { ChatMessage, Intent } from "@/types/atom";

// ─── Intent Badge Config ──────────────────────────────────────
const INTENT_LABELS: Partial<Record<Intent, { label: string; symbol: string }>> = {
  remember:      { label: "Memory saved",    symbol: "●" },
  recall:        { label: "Recalling",        symbol: "◎" },
  remind:        { label: "Reminder set",     symbol: "◷" },
  goals:         { label: "Goal saved",       symbol: "◈" },
  log_behavior:  { label: "Logged",           symbol: "▣" },
  delete_memory: { label: "Memory deleted",   symbol: "✕" },
  erase_all:     { label: "Data erased",      symbol: "⚠" },
};

// ─── Quick Actions ────────────────────────────────────────────
const QUICK_ACTIONS = [
  "What do you remember?",
  "Set a reminder",
  "My goals",
  "Remember this:",
];

// ─── Message Bubble ───────────────────────────────────────────
function MessageBubble({ message }: { message: ChatMessage }) {
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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAtom,
      ]}>
        <Text style={[
          styles.bubbleText,
          { color: isUser ? "#0A0A0A" : "#FFFFFF" },
        ]}>
          {message.text}
        </Text>
        {hasBadge && intentInfo && (
          <View style={[styles.intentBadge, { backgroundColor: isUser ? "rgba(0,0,0,0.15)" : "#2A2A2A" }]}>
            <Text style={[styles.intentBadgeText, { color: isUser ? "#0A0A0A" : "#888888" }]}>
              {intentInfo.symbol} {intentInfo.label}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────
function TypingIndicator() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAtom]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>A</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleAtom]}>
        <ActivityIndicator size="small" color="#888888" />
      </View>
    </View>
  );
}

// ─── Welcome State ────────────────────────────────────────────
function WelcomeState() {
  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeIconBg}>
        <Text style={styles.welcomeIcon}>A</Text>
      </View>
      <Text style={styles.welcomeTitle}>
        Hi, I'm Atom
      </Text>
      <Text style={styles.welcomeSubtitle}>
        Your personal memory assistant. Tell me what to remember, set reminders, or track your goals.
      </Text>
      <View style={styles.welcomeHints}>
        {[
          { symbol: "◎", text: "\"Remember I prefer email\"" },
          { symbol: "◷", text: "\"Remind me at 6pm to call Ahmed\"" },
          { symbol: "◈", text: "\"My goal is to read more\"" },
          { symbol: "●", text: "\"What do you remember?\"" },
        ].map((hint, i) => (
          <View key={i} style={styles.hintRow}>
            <Text style={styles.hintSymbol}>{hint.symbol}</Text>
            <Text style={styles.hintText}>{hint.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Chat Screen ─────────────────────────────────────────
export default function ChatScreen() {
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
    <MessageBubble message={item} />
  ), []);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>A</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Atom</Text>
            <Text style={styles.headerSubtitle}>● Active</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.5 }]}
        >
          <IconSymbol name="gearshape.fill" size={20} color="#555555" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {state.messages.length === 0 ? (
          <WelcomeState />
        ) : (
          <FlatList
            ref={flatListRef}
            data={state.messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListFooterComponent={state.isTyping ? <TypingIndicator /> : null}
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
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.quickChipText}>{action}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Message Atom..."
              placeholderTextColor="#555555"
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
                { backgroundColor: inputText.trim() && !state.isTyping ? "#FFFFFF" : "#2A2A2A" },
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
            >
              <IconSymbol name="paperplane.fill" size={16} color={inputText.trim() && !state.isTyping ? "#0A0A0A" : "#555555"} />
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2A2A2A",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    color: "#0A0A0A",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: "#4ADE80",
    fontSize: 11,
    marginTop: 1,
    fontWeight: "500",
  },
  headerBtn: {
    padding: 6,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#0A0A0A",
    fontSize: 12,
    fontWeight: "800",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  bubbleUser: {
    backgroundColor: "#FFFFFF",
    borderBottomRightRadius: 4,
  },
  bubbleAtom: {
    backgroundColor: "#141414",
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  intentBadge: {
    marginTop: 6,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  intentBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  welcomeIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  welcomeIcon: {
    fontSize: 32,
    color: "#0A0A0A",
    fontWeight: "900",
    letterSpacing: -1,
  },
  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: -0.8,
  },
  welcomeSubtitle: {
    color: "#888888",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    fontWeight: "400",
  },
  welcomeHints: {
    width: "100%",
    gap: 8,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
    backgroundColor: "#141414",
  },
  hintSymbol: {
    fontSize: 14,
    color: "#888888",
    width: 16,
    textAlign: "center",
  },
  hintText: {
    fontSize: 13,
    color: "#888888",
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
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
    backgroundColor: "#141414",
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  inputBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#2A2A2A",
    backgroundColor: "#0A0A0A",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: "#2A2A2A",
    backgroundColor: "#141414",
    paddingLeft: 18,
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
    color: "#FFFFFF",
    fontWeight: "400",
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
