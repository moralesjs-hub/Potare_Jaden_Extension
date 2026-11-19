import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Keyboard, StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import type { BarResponse } from "../../types/bar";
import { getBars, getFavoriteIds, getActiveCheckInIds, toggleFavorite, updateBarCoordinates } from "../../services/bar_services";
import { useAuth } from "../../context/AuthContext";
import { filterVenues, getMapPin, getVenueDescription } from "../../utils/venueDiscovery";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [bars, setBars] = useState<BarResponse[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [activeBarIds, setActiveBarIds] = useState<number[]>([]);
  const [selectedBar, setSelectedBar] = useState<BarResponse | null>(null);
  const [geocodingCount, setGeocodingCount] = useState(0);
  const [searchError, setSearchError] = useState("");
  const mapRef = useRef<MapView>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [crowd, setCrowd] = useState("");
  const visibleBars = useMemo(() => filterVenues(bars, { search, price, crowd }), [bars, search, price, crowd]);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    if (user) getActiveCheckInIds(user.id).then((ids) => { if (mounted) setActiveBarIds(ids); }).catch(() => undefined);
    return () => { mounted = false; };
  }, [user]));
  const [region, setRegion] = useState({
    latitude: 32.7765,
    longitude: -79.9311,
    latitudeDelta: 0.05,   // zoomed out enough to see all 3 bars
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await getBars();
      if (!mounted) return;
      setBars(data);
      if (user) setFavorites(await getFavoriteIds(user.id));

      let canGeocode = false;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        canGeocode = status === "granted";
        if (canGeocode) {
          const loc = await Location.getCurrentPositionAsync({});
          if (mounted) setRegion((current) => ({ ...current, latitude: loc.coords.latitude, longitude: loc.coords.longitude }));
        }
      } catch { /* Venue browsing remains available without location permission. */ }

      if (canGeocode) {
        let located = data.filter((bar) => bar.latitude != null && bar.longitude != null);
        const missing = data.filter((bar) => (bar.latitude == null || bar.longitude == null) && bar.address);
        if (mounted) setGeocodingCount(missing.length);
        for (const bar of missing) {
          if (!mounted || !bar.address) break;
          try {
            const [place] = await Location.geocodeAsync(bar.address);
            if (place && Number.isFinite(place.latitude) && Number.isFinite(place.longitude) && !(place.latitude === 0 && place.longitude === 0)) {
              await updateBarCoordinates(bar.id, place.latitude, place.longitude);
              const updated = { ...bar, latitude: place.latitude, longitude: place.longitude };
              located = [...located, updated];
              if (mounted) setBars((current) => current.map((item) => item.id === bar.id ? updated : item));
            }
          } catch { /* Keep unresolved venues available in the location list below. */ }
          if (mounted) setGeocodingCount((count) => Math.max(0, count - 1));
        }
        if (mounted && located.length > 1) {
          mapRef.current?.fitToCoordinates(located.map((bar) => ({ latitude: bar.latitude!, longitude: bar.longitude! })), {
            edgePadding: { top: 190, right: 40, bottom: 190, left: 40 }, animated: true,
          });
        }
      }
    };
    load().catch(() => undefined);
    return () => { mounted = false; };
  }, [user]);

  const handleFavorite = async () => {
    if (!user || !selectedBar) return;
    const favorite = await toggleFavorite(user.id, selectedBar.id);
    setFavorites((ids) => favorite ? [...ids, selectedBar.id] : ids.filter((id) => id !== selectedBar.id));
  };

  const handleSearch = async () => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) { setSearchError("Enter a venue name to search."); return; }
    const match = bars.find((bar) => bar.name.toLocaleLowerCase() === query)
      ?? bars.find((bar) => bar.name.toLocaleLowerCase().startsWith(query))
      ?? bars.find((bar) => `${bar.name} ${bar.address ?? ""}`.toLocaleLowerCase().includes(query));
    if (!match) { setSearchError(`No venue found for “${search.trim()}”.`); return; }

    let venue = match;
    if ((venue.latitude == null || venue.longitude == null) && venue.address) {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status === "granted") {
          const [place] = await Location.geocodeAsync(venue.address);
          if (place && Number.isFinite(place.latitude) && Number.isFinite(place.longitude) && !(place.latitude === 0 && place.longitude === 0)) {
            await updateBarCoordinates(venue.id, place.latitude, place.longitude);
            venue = { ...venue, latitude: place.latitude, longitude: place.longitude };
            setBars((current) => current.map((bar) => bar.id === venue.id ? venue : bar));
          }
        }
      } catch { /* Show the venue details even when the platform can't resolve its address. */ }
    }

    setSearchError(venue.latitude == null || venue.longitude == null ? "Venue found, but its address could not be pinned. Check location permission and try again." : "");
    setSearch(venue.name);
    setPrice(null);
    setCrowd("");
    setSelectedBar(venue);
    Keyboard.dismiss();
    const pin = getMapPin(venue);
    if (pin) {
      mapRef.current?.animateToRegion({ ...pin, latitudeDelta: 0.009, longitudeDelta: 0.009 }, 650);
    }
  };

  return (
    <View style={styles.container}>
      {!searchOpen ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Search map" onPress={() => setSearchOpen(true)} style={[styles.searchLauncher, { top: insets.top + 12 }]}>
        <Ionicons name="search" size={20} color="#252630" />
      </TouchableOpacity> : <View style={[styles.filters, { top: insets.top + 8 }]}>
        <View style={styles.searchRow}>
          <TextInput accessibilityLabel="Search venues" value={search} onChangeText={(value) => { setSearch(value); setSearchError(""); }} onSubmitEditing={() => { void handleSearch(); }} returnKeyType="search" submitBehavior="submit" placeholder="Search bars" placeholderTextColor="#8e9098" style={styles.search} />
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Search map for venue" onPress={() => { void handleSearch(); }} style={styles.searchButton}><Ionicons name="search" size={19} color="#fff" /></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close map search" onPress={() => { setSearchOpen(false); setSearch(""); setSearchError(""); }} style={styles.closeSearch}><Ionicons name="close" size={20} color="#565862" /></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[{ label: "Any price", value: null }, { label: "$", value: 1 }, { label: "$$", value: 2 }, { label: "$$$", value: 3 }].map((item) => <TouchableOpacity key={item.label} onPress={() => setPrice(item.value)} style={[styles.filterChip, price === item.value && styles.filterActive]}><Text style={styles.filterText}>{item.label}</Text></TouchableOpacity>)}
          {["Quiet", "Moderate", "Lively"].map((item) => <TouchableOpacity key={item} onPress={() => setCrowd(crowd === item ? "" : item)} style={[styles.filterChip, crowd === item && styles.filterActive]}><Text style={styles.filterText}>{item}</Text></TouchableOpacity>)}
        </ScrollView>
        <Text style={styles.resultCount}>{visibleBars.length} venues{geocodingCount > 0 ? ` · locating ${geocodingCount} addresses…` : ""}</Text>
        {!!searchError && <Text accessibilityRole="alert" style={styles.searchError}>{searchError}</Text>}
      </View>}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
        onPress={Keyboard.dismiss}
      >
        {visibleBars.filter((bar) => getMapPin(bar) != null).map((bar) => (
          <Marker
            key={bar.id}
            coordinate={getMapPin(bar)!}
            pinColor={activeBarIds.includes(bar.id) ? "#20A36A" : "#E63946"}
            title={bar.name}
            onPress={() => setSelectedBar(bar)}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{bar.name}</Text>
                <Text style={styles.calloutDescription}>{getVenueDescription(bar.category, bar.crowdLevel)}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      {visibleBars.some((bar) => bar.latitude == null || bar.longitude == null) && <View style={styles.unlocated}>
        <Text style={styles.unlocatedHeading}>Address needs a map pin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {visibleBars.filter((bar) => bar.latitude == null || bar.longitude == null).map((bar) => <TouchableOpacity key={bar.id} onPress={() => setSelectedBar(bar)} style={styles.unlocatedChip}><Text style={styles.unlocatedText}>{bar.name}</Text></TouchableOpacity>)}
        </ScrollView>
      </View>}
      {selectedBar && <View style={styles.detail}>
        <Text style={styles.detailTitle}>{selectedBar.name}</Text>
        <Text style={styles.calloutAddress}>{selectedBar.address ?? "Address unavailable"}</Text>
        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" onPress={handleFavorite} style={styles.action}>
            <Text style={styles.actionText}>{favorites.includes(selectedBar.id) ? "♥ Saved" : "♡ Save venue"}</Text>
          </TouchableOpacity>
          {selectedBar.latitude != null && selectedBar.longitude != null
            ? <TouchableOpacity accessibilityRole="button" onPress={() => router.push({ pathname: "/(tabs)/compass", params: { venueId: String(selectedBar.id) } })} style={[styles.action, styles.primary]}><Text style={styles.actionText}>Navigate</Text></TouchableOpacity>
            : <Text style={styles.needsPin}>Compass navigation needs a map pin.</Text>}
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close venue details" onPress={() => setSelectedBar(null)} style={styles.close}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  searchLauncher: { position: "absolute", zIndex: 2, right: 16, width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: "#fff", elevation: 7, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  filters: { position: "absolute", zIndex: 2, top: 14, left: 14, right: 14, padding: 10, borderRadius: 18, backgroundColor: "#fff", elevation: 7, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, borderWidth: StyleSheet.hairlineWidth, borderColor: "#dedee3" },
  search: { flex: 1, minWidth: 0, height: 44, borderRadius: 13, backgroundColor: "#f3f3f5", paddingHorizontal: 14, color: "#222", fontSize: 15 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, width: "100%" },
  searchButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#E63946" },
  searchButtonText: { color: "#fff", fontWeight: "800" },
  closeSearch: { width: 38, height: 44, alignItems: "center", justifyContent: "center" },
  searchError: { color: "#b42318", fontSize: 11, marginTop: 5 },
  filterRow: { flexDirection: "row", gap: 6, paddingTop: 8 },
  filterChip: { borderRadius: 15, borderWidth: 1, borderColor: "#ddd", paddingHorizontal: 10, paddingVertical: 6 },
  filterActive: { borderColor: "#E63946", backgroundColor: "#fff0ef" },
  filterText: { color: "#333", fontSize: 11, fontWeight: "600" },
  resultCount: { color: "#666", fontSize: 10, marginTop: 5 },
  unlocated: { position: "absolute", left: 16, right: 16, bottom: 24, padding: 12, borderRadius: 12, backgroundColor: "#fff", elevation: 5 },
  unlocatedHeading: { color: "#333", fontWeight: "700", fontSize: 12, marginBottom: 8 },
  unlocatedChip: { backgroundColor: "#f1f1f3", padding: 8, borderRadius: 10, marginRight: 7 },
  unlocatedText: { color: "#333", fontSize: 11 },
  needsPin: { color: "#777", fontSize: 11, alignSelf: "center" },
  callout: { padding: 6, maxWidth: 200 },
  calloutTitle: { fontWeight: "700", fontSize: 14 },
  calloutDescription: { fontSize: 11, color: "#666", marginTop: 3, lineHeight: 15, maxWidth: 190 },
  calloutAddress: { fontSize: 12, color: "#555", marginTop: 2 },
  detail: { position: "absolute", bottom: 24, left: 16, right: 16, padding: 18, backgroundColor: "#fff", borderRadius: 18, elevation: 8 },
  detailTitle: { color: "#1a1a2e", fontSize: 19, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8, marginTop: 16, alignItems: "center" },
  action: { borderRadius: 10, borderWidth: 1, borderColor: "#ddd", paddingHorizontal: 14, paddingVertical: 11 },
  primary: { backgroundColor: "#E63946", borderColor: "#E63946" },
  actionText: { color: "#1a1a2e", fontWeight: "700" },
  close: { marginLeft: "auto", padding: 8 },
  closeText: { fontSize: 22, color: "#555" },
});
