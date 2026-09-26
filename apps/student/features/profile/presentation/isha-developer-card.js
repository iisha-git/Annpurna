import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { useGeofence } from '../../crowd/presentation/use-geofence';
import { useCrowdStatus } from '../../crowd/presentation/use-crowd-status';
import * as crowdRepository from '../../crowd/data/crowd-repository';
import { DEFAULT_MESS_COORDINATES } from '@/shared/lib/config';
import { AppText } from '@/shared/ui';
import { colors, fonts, radii, spacing } from '@/shared/theme/tokens';

export default function IshaDeveloperCard({ student }) {
  const geofence = useGeofence();
  const snap = useCrowdStatus();
  const [calibrating, setCalibrating] = useState(false);

  const currentRadius = geofence?.messCoords?.radiusMeters || 10;
  const currentLat = geofence?.currentCoords?.latitude?.toFixed(6) ?? '—';
  const currentLon = geofence?.currentCoords?.longitude?.toFixed(6) ?? '—';
  const accuracy = geofence?.currentCoords?.accuracy
    ? `±${Math.round(geofence.currentCoords.accuracy)}m`
    : '—';
  const distance =
    geofence?.distance != null ? `${Math.round(geofence.distance)}m away` : 'Locating…';

  const handleCalibrate = async () => {
    setCalibrating(true);
    try {
      await geofence.setMessToCurrentLocation();
      Alert.alert(
        'Mess Calibrated',
        `Mess center set to your current GPS: ${currentLat}, ${currentLon}`
      );
    } catch (e) {
      Alert.alert('Calibration Error', e.message || 'Could not fetch current GPS fix');
    } finally {
      setCalibrating(false);
    }
  };

  const handleReset = () => {
    geofence.setMessCoordinates({
      latitude: DEFAULT_MESS_COORDINATES.latitude,
      longitude: DEFAULT_MESS_COORDINATES.longitude,
      radiusMeters: DEFAULT_MESS_COORDINATES.radiusMeters,
    });
    Alert.alert('Reset Complete', 'Mess coordinates restored to default configuration.');
  };

  const handleRadiusChange = (radius) => {
    geofence.setMessCoordinates({ radiusMeters: radius });
  };

  const handleTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍽️ Annpurna Mess',
          body: 'How crowded is the mess right now? Tap to submit your review!',
          data: { action: 'crowd_review_prompt' },
        },
        trigger: null, // immediate
      });
    } catch (e) {
      Alert.alert('Notification Test', e.message || 'Notifications not permitted');
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.crownCircle}>
          <MaterialCommunityIcons name="crown" size={20} color="#FF9D00" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <AppText variant="h3" style={styles.title}>
              Isha's Geofence Controls
            </AppText>
            <View style={styles.adminBadge}>
              <AppText style={styles.adminBadgeText}>SUPERUSER</AppText>
            </View>
          </View>
          <AppText variant="caption" style={styles.subtext}>
            Mobile: +91 7020822465 • Developer Access
          </AppText>
        </View>
      </View>

      {/* Live GPS Telemetry */}
      <View style={styles.telemetryBox}>
        <View style={styles.telemetryRow}>
          <AppText style={styles.telemetryLabel}>Your GPS:</AppText>
          <AppText style={styles.telemetryVal}>
            {currentLat}, {currentLon} ({accuracy})
          </AppText>
        </View>
        <View style={styles.telemetryRow}>
          <AppText style={styles.telemetryLabel}>Mess Target:</AppText>
          <AppText style={styles.telemetryVal}>
            {geofence?.messCoords?.latitude?.toFixed(6)}, {geofence?.messCoords?.longitude?.toFixed(6)}
          </AppText>
        </View>
        <View style={styles.telemetryRow}>
          <AppText style={styles.telemetryLabel}>Distance:</AppText>
          <AppText
            style={[
              styles.telemetryVal,
              geofence.isInside ? styles.statusInside : styles.statusOutside,
            ]}>
            {distance} • {geofence.isInside ? 'INSIDE' : 'OUTSIDE'}
          </AppText>
        </View>
      </View>

      {/* Radius Quick Selector */}
      <View style={styles.sectionRow}>
        <AppText variant="caption" style={styles.sectionTitle}>
          Geofence Boundary Radius:
        </AppText>
        <View style={styles.radiusPills}>
          {[10, 25, 50].map((r) => (
            <Pressable
              key={r}
              onPress={() => handleRadiusChange(r)}
              style={[styles.radiusPill, currentRadius === r && styles.radiusPillActive]}>
              <AppText
                style={[
                  styles.radiusPillText,
                  currentRadius === r && styles.radiusPillTextActive,
                ]}>
                {r}m
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsWrap}>
        <Pressable
          onPress={handleCalibrate}
          disabled={calibrating}
          style={[styles.actionBtn, styles.actionBtnAccent]}>
          <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#0E0B13" />
          <AppText style={styles.actionBtnTextDark}>
            {calibrating ? 'Calibrating…' : 'Set Mess to My GPS'}
          </AppText>
        </Pressable>

        <Pressable
          onPress={() =>
            snap.hasActiveVisit ? crowdRepository.leaveMess() : crowdRepository.enterMess()
          }
          style={[styles.actionBtn, styles.actionBtnOutline]}>
          <MaterialCommunityIcons
            name={snap.hasActiveVisit ? 'exit-run' : 'door-open'}
            size={16}
            color={colors.accent}
          />
          <AppText style={styles.actionBtnTextAccent}>
            {snap.hasActiveVisit ? 'Simulate Exit' : 'Simulate Enter'}
          </AppText>
        </Pressable>

        <Pressable
          onPress={handleTestNotification}
          style={[styles.actionBtn, styles.actionBtnOutline]}>
          <MaterialCommunityIcons name="bell-ring" size={16} color={colors.accent} />
          <AppText style={styles.actionBtnTextAccent}>Test Crowd Alert</AppText>
        </Pressable>

        <Pressable onPress={handleReset} style={[styles.actionBtn, styles.actionBtnMuted]}>
          <MaterialCommunityIcons name="restore" size={16} color={colors.textMuted} />
          <AppText style={styles.actionBtnTextMuted}>Reset to Default GPS</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#171320',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,157,0,0.35)',
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  crownCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,157,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,157,0,0.4)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  adminBadge: {
    backgroundColor: '#FF9D00',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  adminBadgeText: {
    color: '#0E0B13',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtext: {
    color: '#A09CA8',
    marginTop: 2,
  },
  telemetryBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 4,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryLabel: {
    color: '#8A8594',
    fontSize: 12,
  },
  telemetryVal: {
    color: '#E0DDE5',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  statusInside: {
    color: colors.success,
  },
  statusOutside: {
    color: '#FFB84D',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: '#C4C0CC',
  },
  radiusPills: {
    flexDirection: 'row',
    gap: 6,
  },
  radiusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  radiusPillActive: {
    backgroundColor: 'rgba(255,157,0,0.25)',
    borderColor: '#FF9D00',
  },
  radiusPillText: {
    color: '#A09CA8',
    fontSize: 12,
    fontWeight: '600',
  },
  radiusPillTextActive: {
    color: '#FF9D00',
    fontWeight: '700',
  },
  actionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  actionBtnAccent: {
    backgroundColor: '#FF9D00',
  },
  actionBtnTextDark: {
    color: '#0E0B13',
    fontWeight: '700',
    fontSize: 12,
  },
  actionBtnOutline: {
    backgroundColor: 'rgba(255,157,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,157,0,0.3)',
  },
  actionBtnTextAccent: {
    color: '#FF9D00',
    fontWeight: '600',
    fontSize: 12,
  },
  actionBtnMuted: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionBtnTextMuted: {
    color: '#8A8594',
    fontSize: 12,
  },
});
