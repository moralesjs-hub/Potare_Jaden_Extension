import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import { getCheckIns } from "../../../services/bar_services";
import { getProfileSettings, type ProfileSettings } from "../../../services/user_services";

type CheckIn = Awaited<ReturnType<typeof getCheckIns>>[number];

export default function UserProfileScreen() {
  const { user, signOut } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [profileSettings, setProfileSettings] = useState<ProfileSettings | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    Promise.all([getCheckIns(user.id), getProfileSettings(user.id)]).then(([rows, profile]) => {
      if (mounted) { setCheckIns(rows); setProfileSettings(profile); }
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user?.username?.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.username}>{user?.username}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      {!!profileSettings?.bio && <Text style={styles.bio}>{profileSettings.bio}</Text>}
      {profileSettings && <View style={styles.privacyCard}>
        <Text style={styles.privacyTitle}>Privacy</Text>
        <View style={styles.privacyLine}><Text style={styles.privacyLabel}>Discoverable by username</Text><Text style={styles.privacyValue}>{profileSettings.discoverable ? "On" : "Off"}</Text></View>
        <View style={styles.privacyLine}><Text style={styles.privacyLabel}>Share activity with circles</Text><Text style={styles.privacyValue}>{profileSettings.activityVisible ? "On" : "Off"}</Text></View>
      </View>}

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{checkIns.length}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{user?.stats?.events_attended ?? 0}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
      </View>

      <View style={styles.history}>
        <Text style={styles.historyTitle}>Recent check-ins</Text>
        {checkIns.length === 0 ? <Text style={styles.historyEmpty}>Your check-ins will show up here.</Text> : (
          <View>{checkIns.slice(0, 5).map((item) => <View key={item.id} style={styles.visitRow}>
              <Text style={styles.visitName}>{item.name}</Text>
              <Text style={styles.visitDate}>{new Date(item.checkedInAt + "Z").toLocaleDateString()}</Text>
            </View>)}</View>
        )}
      </View>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push("/(tabs)/profile/edit-profile")}
      >
        <Ionicons name="create-outline" size={20} color="#333" />
        <Text style={styles.menuText}>Edit Profile</Text>
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push("/(tabs)/profile/settings")}
      >
        <Ionicons name="settings-outline" size={20} color="#333" />
        <Text style={styles.menuText}>Settings</Text>
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f9f9f9" },
  container: { flexGrow: 1, alignItems: "center", padding: 24, paddingBottom: 36 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#E63946", justifyContent: "center", alignItems: "center",
    marginTop: 24, marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "700" },
  username: { fontSize: 22, fontWeight: "700", color: "#1a1a2e" },
  email: { fontSize: 14, color: "#888", marginBottom: 24 },
  bio: { color: "#666", textAlign: "center", marginTop: -14, marginBottom: 20, lineHeight: 20 },
  privacyCard: { alignSelf: "stretch", backgroundColor: "#fff", borderRadius: 12, padding: 13, marginBottom: 18 },
  privacyTitle: { color: "#1a1a2e", fontWeight: "700", marginBottom: 8 },
  privacyLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  privacyLabel: { color: "#555", fontSize: 12 },
  privacyValue: { color: "#1a1a2e", fontSize: 12, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 24, marginBottom: 32 },
  history: { width: "100%", marginBottom: 14 },
  historyTitle: { alignSelf: "flex-start", fontSize: 16, fontWeight: "700", color: "#1a1a2e", marginBottom: 10 },
  historyEmpty: { alignSelf: "flex-start", fontSize: 13, color: "#888", paddingVertical: 12 },
  visitRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ddd" },
  visitName: { color: "#333", fontWeight: "600" },
  visitDate: { color: "#888", fontSize: 12 },
  statBox: { alignItems: "center" },
  statNum: { fontSize: 24, fontWeight: "700", color: "#E63946" },
  statLabel: { fontSize: 12, color: "#888" },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 12, padding: 16,
    width: "100%", marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  menuText: { flex: 1, fontSize: 15 },
  logoutBtn: {
    marginTop: 16, backgroundColor: "#E63946",
    borderRadius: 12, padding: 16, width: "100%", alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
