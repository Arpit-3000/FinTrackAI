import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { formatCurrencySimple } from '../utils';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface PieChartProps {
  data: CategoryData[];
}

export const PieChart = ({ data }: PieChartProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spending by Category</Text>
      
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={styles.category}>{item.category}</Text>
            </View>
            <View style={styles.legendRight}>
              <Text style={styles.amount}>{formatCurrencySimple(item.amount)}</Text>
              <Text style={styles.percentage}>{item.percentage.toFixed(1)}%</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.donutContainer}>
        {data.map((item, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                backgroundColor: item.color,
                width: `${item.percentage}%`,
              },
            ]}
          />
        ))}
      </View>
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
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
    fontSize: 20,
    fontWeight: '700',
  },
  legendContainer: {
    marginBottom: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: spacing.sm,
  },
  emoji: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  category: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  percentage: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  donutContainer: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
});
