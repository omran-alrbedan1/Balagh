import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Input } from '@/components/ui/Input';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function LocationPicker() {
  const location = useDraftComplaintStore((state) => state.location);
  const setLocation = useDraftComplaintStore((state) => state.setLocation);
  const [address, setAddress] = useState(location?.address ?? '');
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);

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
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.buttonText}>Use my current location</Text>
          </>
        )}
      </Pressable>

      {location ? (
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>{location.address ?? 'Location captured'}</Text>
          <Text style={styles.locationMeta}>
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </Text>
        </View>
      ) : null}

      {manualMode || !location ? (
        <View style={styles.manual}>
          <Text style={styles.helper}>Or enter the address manually:</Text>
          <Input
            label="Address"
            onBlur={() => {
              if (address) {
                setLocation({ lat: 0, lng: 0, address });
              }
            }}
            onChangeText={setAddress}
            placeholder="Street, city, landmark..."
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
