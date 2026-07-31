import { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '../theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) => {
  const opacity = new Animated.Value(0.3);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surface,
  },
});

// Preset skeleton components
export const SkeletonCard = () => (
  <View style={styles.card}>
    <SkeletonLoader width="60%" height={20} style={{ marginBottom: spacing.sm }} />
    <SkeletonLoader width="40%" height={16} />
  </View>
);

export const SkeletonTransaction = () => (
  <View style={styles.transaction}>
    <View style={styles.transactionLeft}>
      <SkeletonLoader width={48} height={48} borderRadius={24} style={{ marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <SkeletonLoader width="70%" height={16} style={{ marginBottom: spacing.xs }} />
        <SkeletonLoader width="40%" height={14} />
      </View>
    </View>
    <SkeletonLoader width={60} height={20} />
  </View>
);

export const SkeletonStatCard = () => (
  <View style={styles.statCard}>
    <SkeletonLoader width="50%" height={14} style={{ marginBottom: spacing.sm }} />
    <SkeletonLoader width="80%" height={32} />
  </View>
);

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

Object.assign(styles, skeletonStyles);
