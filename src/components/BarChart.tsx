import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '../theme';
import { formatCurrencySimple } from '../utils';

interface ChartData {
  label: string;
  amount: number;
}

interface BarChartProps {
  data: ChartData[];
}

export const BarChart = ({ data }: BarChartProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  const maxAmount = Math.max(...data.map(item => item.amount), 1);

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {data.map((item, index) => (
          <Bar
            key={index}
            label={item.label}
            amount={item.amount}
            maxAmount={maxAmount}
            index={index}
          />
        ))}
      </View>
    </View>
  );
};

interface BarProps {
  label: string;
  amount: number;
  maxAmount: number;
  index: number;
}

const Bar = ({ label, amount, maxAmount, index }: BarProps) => {
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: maxAmount > 0 ? (amount / maxAmount) * 150 : 0,
      delay: 800 + index * 100,
      useNativeDriver: false, // height cannot use native driver
      tension: 40,
      friction: 7,
    }).start();
  }, [amount, maxAmount, index]);

  return (
    <View style={styles.barContainer}>
      <View style={styles.barWrapper}>
        <Animated.View style={[styles.bar, { height: heightAnim }]} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.amount}>{formatCurrencySimple(amount)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    width: 32,
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  bar: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 10,
  },
  label: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  amount: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
});
