import { useEffect, useState } from "react";
import { Alert, Button, Keyboard, StyleSheet, Switch, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { getProfileSettings, saveProfileSettings, updateUsername, type ProfileSettings } from "../../../services/user_services";

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [settings, setSettings] = useState<ProfileSettings>({ bio: "", discoverable: false, activityVisible: false });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    getProfileSettings(user.id).then((value) => { if (mounted) setSettings(value); }).catch(() => setError("Could not load profile settings."));
    return () => { mounted = false; };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const cleanName = username.trim();
    if (cleanName.length < 2) { setError("Username must be at least 2 characters."); return; }
    try {
      await updateUsername(user.id, cleanName);
      await saveProfileSettings(user.id, settings);
      await refreshUser();
      Alert.alert("Saved", "Your profile and privacy settings have been updated.");
      router.back();
    } catch { setError("Could not save your changes. Please try again."); }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.container}>
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
      />
      <Text style={styles.label}>Bio</Text>
      <TextInput style={[styles.input, styles.bio]} value={settings.bio} onChangeText={(bio) => setSettings((current) => ({ ...current, bio }))} placeholder="A little about you" maxLength={160} multiline />
      <View style={styles.privacyRow}><Text style={styles.privacyText}>Discoverable by username</Text><Switch value={settings.discoverable} onValueChange={(discoverable) => setSettings((current) => ({ ...current, discoverable }))} trackColor={{ true: "#E63946" }} /></View>
      <View style={styles.privacyRow}><Text style={styles.privacyText}>Share activity with circle members</Text><Switch value={settings.activityVisible} onValueChange={(activityVisible) => setSettings((current) => ({ ...current, activityVisible }))} trackColor={{ true: "#E63946" }} /></View>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, styles.disabled]}
        value={user?.email}
        editable={false}
      />
      <Button title="Save Changes" onPress={handleSave} />
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#f9f9f9" },
  label: { fontSize: 13, color: "#888", marginBottom: 4, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
    padding: 12, backgroundColor: "#fff", fontSize: 15,
  },
  disabled: { backgroundColor: "#f0f0f0", color: "#aaa" },
  bio: { minHeight: 90, textAlignVertical: "top" },
  privacyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, padding: 12, backgroundColor: "#fff", borderRadius: 10 },
  privacyText: { flex: 1, color: "#333", paddingRight: 12 },
  error: { color: "#c22", marginVertical: 12 },
});
