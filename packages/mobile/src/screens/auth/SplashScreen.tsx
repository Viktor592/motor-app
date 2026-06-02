// ═══════════════════════════════════════════════════
// МОТОР — Splash Screen
// ═══════════════════════════════════════════════════
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@motor/shared';
import { Colors, Spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const scaleHex   = useRef(new Animated.Value(0)).current;
  const fadeWords  = useRef(new Animated.Value(0)).current;
  const fadeSub    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // hex grows in
      Animated.spring(scaleHex, {
        toValue: 1, friction: 5, tension: 60, useNativeDriver: true,
      }),
      // wordmark fades
      Animated.timing(fadeWords, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
      // tagline fades
      Animated.timing(fadeSub, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }),
      // hold
      Animated.delay(900),
    ]).start(() => {
      // TODO: check stored token → Auth or Main
      navigation.replace('Auth');
    });
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.void} />

      {/* Grid lines */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={[styles.gridLine, { top: (i + 1) * 64 }]}
          />
        ))}
      </View>

      {/* Hex logo */}
      <Animated.View style={[styles.hexWrap, { transform: [{ scale: scaleHex }] }]}>
        <View style={styles.hex}>
          <Text style={styles.hexLetter}>М</Text>
        </View>
      </Animated.View>

      {/* Wordmark */}
      <Animated.Text style={[styles.wordmark, { opacity: fadeWords }]}>
        МОТОР
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: fadeSub }]}>
        AI-ЭКОСИСТЕМА АВТОСЕРВИСА
      </Animated.Text>

      {/* Bottom version */}
      <Text style={styles.version}>v 1.1 · BETA</Text>
    </View>
  );
}

const HEX_SIZE = 88;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.void,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,98,0,0.05)',
  },
  hexWrap: {
    marginBottom: Spacing.xl,
  },
  hex: {
    width: HEX_SIZE,
    height: HEX_SIZE,
    backgroundColor: Colors.ore,
    // React Native doesn't support clip-path — use rotation trick for hexagon
    transform: [{ rotate: '30deg' }],
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.ore,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  hexLetter: {
    fontSize: 40,
    color: '#000',
    fontWeight: '900',
    transform: [{ rotate: '-30deg' }],
  },
  wordmark: {
    fontSize: 56,
    letterSpacing: 8,
    color: Colors.chalk,
    fontWeight: '900',
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: 10,
    letterSpacing: 3,
    color: Colors.dust,
    textTransform: 'uppercase',
  },
  version: {
    position: 'absolute',
    bottom: Spacing.xxl,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.soot,
    textTransform: 'uppercase',
  },
});
