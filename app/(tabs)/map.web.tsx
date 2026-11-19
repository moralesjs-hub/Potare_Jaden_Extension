import { useEffect, useMemo, useState } from "react";
import { FlatList, Keyboard, StyleSheet, Text, View, TextInput, TouchableWithoutFeedback } from "react-native";
import { getBars } from "../../services/bar_services";
import type { BarResponse } from "../../types/bar";
import { filterVenues } from "../../utils/venueDiscovery";

export default function MapWebScreen() {
  const [venues, setVenues] = useState<BarResponse[]>([]);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const venuesFiltered = useMemo(() => filterVenues(venues, { search, price, crowd: "" }), [venues, search, price]);

  useEffect(() => {
    let mounted = true;
    getBars().then((items) => { if (mounted) setVenues(items); })
      .catch(() => { if (mounted) setError(true); });
    return () => { mounted = false; };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}><View style={styles.screen}>
      <Text style={styles.kicker}>PŌTĀRE · CHARLESTON</Text>
      <Text style={styles.title}>Find your next spot</Text>
      <Text style={styles.subtitle}>Venue map is available on iOS and Android. Explore the saved venues here.</Text>
      <TextInput accessibilityLabel="Search venues" value={search} onChangeText={setSearch} placeholder="Search venues or addresses" placeholderTextColor="#898b94" style={styles.search} />
      <View style={styles.priceFilters}>{[null, 1, 2, 3].map((tier) => <Text key={String(tier)} onPress={() => setPrice(tier)} style={[styles.priceChip, price === tier && styles.priceActive]}>{tier === null ? "Any price" : "$".repeat(tier)}</Text>)}</View>
      {error ? <Text style={styles.empty}>Could not load venues. Reopen the screen to retry.</Text> : (
        <FlatList data={venuesFiltered} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No venues yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.address}>{item.address ?? "Address unavailable"}</Text>
              <Text style={styles.coordinates}>{item.category} · {item.crowdLevel} · {"$".repeat(item.priceTier)}</Text>
              {item.latitude != null && item.longitude != null && <Text style={styles.coordinates}>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</Text>}
            </View>
          )}
        />
      )}
    </View></TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 22, paddingTop: 28, backgroundColor: "#101114" },
  kicker: { color: "#f27668", fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  title: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 8 },
  subtitle: { color: "#a3a4aa", fontSize: 14, lineHeight: 21, marginTop: 8 },
  list: { paddingTop: 20, paddingBottom: 24 },
  search: { marginTop: 16, borderRadius: 10, backgroundColor: "#1b1d22", borderWidth: 1, borderColor: "#303139", padding: 12, color: "#fff" },
  priceFilters: { flexDirection: "row", gap: 8, marginTop: 9 },
  priceChip: { color: "#c7c8ce", borderWidth: 1, borderColor: "#3c3e46", borderRadius: 14, paddingVertical: 6, paddingHorizontal: 10, overflow: "hidden" },
  priceActive: { color: "#fff", backgroundColor: "#e45f53", borderColor: "#e45f53" },
  card: { padding: 17, borderRadius: 16, backgroundColor: "#1b1d22", marginBottom: 12, borderWidth: 1, borderColor: "#303139" },
  name: { color: "#fff", fontSize: 17, fontWeight: "700" },
  address: { color: "#b7b8bf", marginTop: 7, fontSize: 13 },
  coordinates: { color: "#83858d", marginTop: 6, fontSize: 11 },
  empty: { color: "#a3a4aa", marginTop: 24, lineHeight: 20 },
});
