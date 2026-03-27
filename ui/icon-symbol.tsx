// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for Atom app.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "brain": "psychology",
  "target": "track-changes",
  "bell.fill": "notifications",
  "gearshape.fill": "settings",
  // Chat
  "paperplane.fill": "send",
  "bubble.left.fill": "chat-bubble",
  "mic.fill": "mic",
  // Memories
  "bookmark.fill": "bookmark",
  "star.fill": "star",
  "star": "star-border",
  "trash.fill": "delete",
  "magnifyingglass": "search",
  // Goals
  "checkmark.circle.fill": "check-circle",
  "circle": "radio-button-unchecked",
  "plus": "add",
  "plus.circle.fill": "add-circle",
  // Reminders
  "clock.fill": "schedule",
  "calendar": "calendar-today",
  "repeat": "repeat",
  // General
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "ellipsis": "more-horiz",
  "info.circle": "info",
  "person.fill": "person",
  "tag.fill": "label",
  "wand.and.stars": "auto-fix-high",
  "exclamationmark.triangle.fill": "warning",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
