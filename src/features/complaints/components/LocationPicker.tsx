import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, Region } from 'react-native-maps';

import { Input } from '@/components/ui/Input';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function LocationPicker() {
  const { t } = useTranslation();
  const location = useDraftComplaintStore((state) => state.location);
  const setLocation = useDraftComplaintStore((state) => state.setLocation);
  const [address, setAddress] = useState(location?.address ?? '');
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const initialCoordinate =
    location && location.lat !== 0 && location.lng !== 0
      ? { latitude: location.lat, longitude: location.lng }
      : { latitude: 33.5138, longitude: 36.2765 };
  const [selectedCoordinate, setSelectedCoordinate] = useState(initialCoordinate);

  const handleUseCurrentLocation = async () => {
    setLoading(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setManualMode(true);
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const resolvedAddress = place
        ? [place.street, place.city, place.region].filter(Boolean).join(', ')
        : undefined;

      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        address: resolvedAddress,
      });
      setAddress(resolvedAddress ?? '');
    } catch {
      setManualMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMapLocation = async () => {
    setLoading(true);
    const fallbackAddress = `${selectedCoordinate.latitude.toFixed(5)}, ${selectedCoordinate.longitude.toFixed(5)}`;

    try {
      const [place] = await Location.reverseGeocodeAsync(selectedCoordinate);
      const resolvedAddress = place
        ? [place.street, place.city, place.region].filter(Boolean).join(', ')
        : undefined;
      setLocation({
        lat: selectedCoordinate.latitude,
        lng: selectedCoordinate.longitude,
        address: resolvedAddress || fallbackAddress,
      });
      setAddress(resolvedAddress || fallbackAddress);
    } catch {
      setLocation({
        lat: selectedCoordinate.latitude,
        lng: selectedCoordinate.longitude,
        address: fallbackAddress,
      });
      setAddress(fallbackAddress);
    } finally {
      setLoading(false);
      setMapVisible(false);
      setManualMode(false);
    }
  };

  const region: Region = {
    ...selectedCoordinate,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <View style={styles.container}>
      <Pressable
        disabled={loading}
        onPress={() => void handleUseCurrentLocation()}
        style={styles.button}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <MapPin color="#FFFFFF" size={18} />
            <Text style={styles.buttonText}>{t('complaints.useCurrentLocation')}</Text>
          </>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => setMapVisible((visible) => !visible)}
        style={styles.mapButton}
      >
        <MapPin color={colors.primary} size={18} />
        <Text style={styles.mapButtonText}>{t('complaints.chooseOnMap')}</Text>
      </Pressable>

      {mapVisible ? (
        <View style={styles.mapContainer}>
          <Text style={styles.helper}>{t('complaints.mapHint')}</Text>
          <MapView
            initialRegion={region}
            onPress={({ nativeEvent }) => setSelectedCoordinate(nativeEvent.coordinate)}
            style={styles.map}
          >
            <Marker coordinate={selectedCoordinate} />
          </MapView>
          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={() => void handleConfirmMapLocation()}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{t('complaints.confirmMapLocation')}</Text>
          </Pressable>
        </View>
      ) : null}

      {location ? (
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>
            {location.address ?? t('complaints.locationCaptured')}
          </Text>
          <Text style={styles.locationMeta}>
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </Text>
        </View>
      ) : null}

      {manualMode || !location ? (
        <View style={styles.manual}>
          <Text style={styles.helper}>{t('complaints.locationHelper')}</Text>
          <Input
            label={t('common.address')}
            onBlur={() => {
              if (address) {
                setLocation({ lat: 0, lng: 0, address });
              }
            }}
            onChangeText={setAddress}
            placeholder={t('complaints.addressPlaceholder')}
            value={address}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  container: {
    gap: spacing.md,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 14,
  },
  locationCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
  },
  map: {
    borderRadius: 8,
    height: 260,
    overflow: 'hidden',
    width: '100%',
  },
  mapButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
  },
  mapButtonText: {
    color: colors.primary,
    fontWeight: '800',
  },
  mapContainer: {
    gap: spacing.sm,
  },
  locationMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  locationTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  manual: {
    gap: spacing.sm,
  },
});
