import { useCallback, useEffect, useState } from "react";
import { Alert, Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";
import { addCircleMember, createCircle, deleteCircle, getBars, getCircles, setCircleTarget } from "../../services/bar_services";
import type { Circle } from "../../services/bar_services";
import type { BarResponse } from "../../types/bar";

export default function GroupScreen() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [venues, setVenues] = useState<BarResponse[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [circleName, setCircleName] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const active = circles.find((circle) => circle.id === activeId) ?? circles[0] ?? null;

  const refresh = useCallback(async () => {
    if (!user) return;
    const [nextCircles, nextVenues] = await Promise.all([getCircles(user.id), getBars()]);
    setCircles(nextCircles);
    setVenues(nextVenues);
    setActiveId((current) => nextCircles.some((circle) => circle.id === current) ? current : nextCircles[0]?.id ?? null);
  }, [user]);

  useEffect(() => { queueMicrotask(() => { void refresh().catch(() => setError("Could not load your outings. Please retry.")); }); }, [refresh]);

  const createOuting = async () => {
    const name = circleName.trim();
    if (!user || name.length < 2) { setError("Give the outing a name with at least 2 characters."); return; }
    setBusy(true); setError("");
    try { const id = await createCircle(user.id, name); setCircleName(""); await refresh(); setActiveId(id); }
    catch { setError("Could not create the outing. Please try again."); }
    finally { setBusy(false); }
  };

  const invite = async () => {
    if (!user || !active || !inviteName.trim()) return;
    setBusy(true); setError("");
    try { await addCircleMember(active.id, user.id, inviteName); setInviteName(""); await refresh(); }
    catch { setError("Could not add that person. Check the username and make sure you own this outing."); }
    finally { setBusy(false); }
  };

  const changeTarget = async (barId: number | null) => {
    if (!user || !active) return;
    try { await setCircleTarget(active.id, user.id, barId); await refresh(); }
    catch { setError("Could not update the meetup spot."); }
  };

  const removeOuting = async () => {
    if (!user || !active || active.ownerId !== user.id) return;
    setBusy(true);
    setError("");
    try {
      const removed = await deleteCircle(active.id, user.id);
      if (!removed) throw new Error("Outing could not be deleted.");
      await refresh();
    } catch {
      setError("Could not delete this outing. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmRemoveOuting = () => {
    if (Platform.OS === "web") {
      if (globalThis.confirm(`Delete “${active?.name ?? "this outing"}”? This cannot be undone.`)) void removeOuting();
      return;
    }
    Alert.alert("Delete outing?", `Delete ${active?.name ?? "this outing"} and remove its members?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { void removeOuting(); } },
    ]);
  };

  return <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}><ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.subtitle}>Make a plan, choose a meetup spot, and keep your circle together.</Text>
    <View style={styles.createRow}>
      <TextInput accessibilityLabel="Outing name" value={circleName} onChangeText={setCircleName} placeholder="Name this outing" placeholderTextColor="#898b94" style={styles.input} maxLength={48} />
      <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={createOuting} style={styles.primary}><Text style={styles.primaryText}>Create</Text></TouchableOpacity>
    </View>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {!active ? <View style={styles.empty}><Text style={styles.emptyTitle}>No outings yet</Text><Text style={styles.emptyText}>Create an outing above to pick a meetup venue and invite people by username.</Text></View> : <>
      {circles.length > 1 && <ScrollView horizontal style={styles.tabs} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {circles.map((item) => <TouchableOpacity key={item.id} onPress={() => setActiveId(item.id)} style={[styles.pill, item.id === active.id && styles.pillActive]}><Text style={[styles.pillText, item.id === active.id && styles.pillTextActive]}>{item.name}</Text></TouchableOpacity>)}
      </ScrollView>}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{active.name}</Text>
        <Text style={styles.sectionLabel}>MEETUP SPOT</Text>
        <Text style={styles.target}>{active.targetName ?? "Choose a venue together"}</Text>
        {!!active.targetBarId && <TouchableOpacity onPress={() => router.push({ pathname: "/(tabs)/compass", params: { venueId: String(active.targetBarId) } })}><Text style={styles.clearTarget}>Navigate to meetup spot →</Text></TouchableOpacity>}
        <View style={styles.venueChoices}>{venues.map((venue) => <TouchableOpacity key={venue.id} onPress={() => changeTarget(venue.id)} style={[styles.venueChip, active.targetBarId === venue.id && styles.venueChipActive]}><Text style={[styles.venueText, active.targetBarId === venue.id && styles.venueTextActive]}>{venue.name}</Text></TouchableOpacity>)}</View>
        {!!active.targetBarId && <TouchableOpacity onPress={() => changeTarget(null)}><Text style={styles.clearTarget}>Clear meetup spot</Text></TouchableOpacity>}
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>People · {active.members.length}</Text>
        {active.members.map((member) => <View key={member.id} style={styles.memberRow}><View style={styles.avatar}><Text style={styles.avatarLetter}>{member.username.slice(0, 1).toUpperCase()}</Text></View><View style={styles.memberInfo}><Text style={styles.memberName}>{member.username}{member.id === active.ownerId ? " · host" : ""}</Text><Text style={styles.memberStatus}>{member.venue ? `Last checked in at ${member.venue}` : "No recent check-in"}</Text></View><View style={[styles.statusDot, member.venue ? styles.activeDot : null]} /></View>)}
        {active.ownerId === user?.id && <View style={styles.inviteRow}><TextInput accessibilityLabel="Username to invite" value={inviteName} onChangeText={setInviteName} placeholder="Invite by username" placeholderTextColor="#898b94" style={styles.input} autoCapitalize="none" maxLength={32} /><TouchableOpacity accessibilityRole="button" disabled={busy} onPress={invite} style={styles.secondary}><Text style={styles.secondaryText}>Invite</Text></TouchableOpacity></View>}
        <Text style={styles.note}>Invites add an existing account on this device. Live location sharing requires a server and explicit consent.</Text>
      </View>
      {active.ownerId === user?.id && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={confirmRemoveOuting} style={styles.deleteOuting}><Text style={styles.deleteOutingText}>Delete outing</Text></TouchableOpacity>}
    </>}
  </ScrollView></TouchableWithoutFeedback>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#101114" }, content: { padding: 20, paddingBottom: 42, flexGrow: 1 }, eyebrow: { color: "#f27668", fontSize: 11, fontWeight: "800", letterSpacing: 2 }, title: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 5 }, subtitle: { color: "#a3a4aa", lineHeight: 21, marginTop: 6, marginBottom: 18 },
  createRow: { flexDirection: "row", gap: 9 }, input: { flex: 1, backgroundColor: "#1b1d22", borderRadius: 12, borderWidth: 1, borderColor: "#33353e", paddingHorizontal: 13, paddingVertical: 12, color: "#fff", minWidth: 0 }, primary: { backgroundColor: "#e45f53", borderRadius: 12, paddingHorizontal: 18, justifyContent: "center" }, primaryText: { color: "#fff", fontWeight: "800" }, error: { color: "#ff938b", marginTop: 10 }, deleteOuting: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#633a3d", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10, marginTop: 16, marginBottom: 16 }, deleteOutingText: { color: "#ff938b", fontWeight: "700", fontSize: 13 },
  tabs: { flexGrow: 0, marginTop: 17, marginBottom: 4 }, pill: { borderWidth: 1, borderColor: "#3a3b43", borderRadius: 18, paddingVertical: 9, paddingHorizontal: 14, marginRight: 8 }, pillActive: { backgroundColor: "#e45f53", borderColor: "#e45f53" }, pillText: { color: "#c8c9ce", fontWeight: "600" }, pillTextActive: { color: "#fff" }, card: { backgroundColor: "#1b1d22", borderRadius: 16, padding: 17, marginTop: 14, borderWidth: 1, borderColor: "#303139" }, sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 15 }, sectionLabel: { color: "#8d8f98", fontSize: 10, fontWeight: "800", letterSpacing: 1.4 }, target: { color: "#fff", fontSize: 15, fontWeight: "600", marginTop: 6 }, venueChoices: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 13 }, venueChip: { borderWidth: 1, borderColor: "#454751", paddingVertical: 8, paddingHorizontal: 11, borderRadius: 20 }, venueChipActive: { backgroundColor: "#39302f", borderColor: "#e45f53" }, venueText: { color: "#d3d4d8", fontSize: 12 }, venueTextActive: { color: "#ff9b90" }, clearTarget: { color: "#ff9b90", marginTop: 12, fontSize: 12, fontWeight: "700" },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#3a3b43" }, avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#343039", alignItems: "center", justifyContent: "center", marginRight: 11 }, avatarLetter: { color: "#ff9b90", fontWeight: "800" }, memberInfo: { flex: 1 }, memberName: { color: "#fff", fontWeight: "700" }, memberStatus: { color: "#9c9ea6", fontSize: 11, marginTop: 3 }, statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#686a72" }, activeDot: { backgroundColor: "#5ed19a" }, inviteRow: { flexDirection: "row", gap: 8, marginTop: 14 }, secondary: { borderWidth: 1, borderColor: "#e45f53", borderRadius: 12, paddingHorizontal: 14, justifyContent: "center" }, secondaryText: { color: "#ff9b90", fontWeight: "700" }, note: { color: "#858790", fontSize: 11, lineHeight: 16, marginTop: 12 }, empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }, emptyTitle: { color: "#fff", fontSize: 21, fontWeight: "800" }, emptyText: { color: "#a3a4aa", textAlign: "center", lineHeight: 21, marginTop: 8 },
});
