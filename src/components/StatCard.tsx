import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../theme';
import { formatCurrency } from '../utils';

interface StatCardProps {
  title: string;
  amount: number;
  change: number;
  percentage: number;
  gradientColors: [string, string];
  icon: string;
  delay?: number;
}

export const StatCard = ({
  title,
  amount,
  change,
  percentage,
  gradientColors,
  icon,
  delay = 0,
}: StatCardProps) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: delay,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        delay: delay,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const isPositive = change >= 0;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>{icon}</Text>
          {change !== 0 && (
            <View style={styles.changeContainer}>
              <Text style={styles.changeText}>
                {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.amount}>{formatCurrency(amount)}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%` }]} />
          </View>
          <Text style={styles.percentage}>{percentage.toFixed(0)}%</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  gradient: {
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    minHeight: 160,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 36,
  },
  changeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  changeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    color: colors.white,
    fontSize: 15,
    opacity: 0.95,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  amount: {
    color: colors.white,
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  percentage: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    minWidth: 40,
  },
});
