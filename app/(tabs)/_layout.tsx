import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#E63946",
        tabBarStyle: { backgroundColor: "#1a1a2e" },
        headerStyle: { backgroundColor: "#1a1a2e" },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ size }) => (
            <Ionicons name="map" size={size} color="#E63946" />
          ),
        }}
      />
      <Tabs.Screen
        name="compass"
        options={{
          title: "Explore",
          tabBarIcon: ({ size }) => (
            <Ionicons name="compass" size={size} color="#E63946" />
          ),
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: "Group",
          tabBarIcon: ({ size }) => (
            <Ionicons name="people" size={size} color="#E63946" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ size }) => (
            <Ionicons name="person-circle" size={size} color="#E63946" />
          ),
        }}
      />
    </Tabs>
  );
}
