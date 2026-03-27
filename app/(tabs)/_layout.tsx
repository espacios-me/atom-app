import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#555555",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: "#0A0A0A",
          borderTopColor: "#2A2A2A",
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="bubble.left.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: "Memories",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="bookmark.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="target" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: "Reminders",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="bell.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
