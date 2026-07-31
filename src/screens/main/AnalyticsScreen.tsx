import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { colors, spacing, typography } from '../../theme';
import { analyticsService } from '../../services';
import { formatCurrency, formatCurrencySimple } from '../../utils';
import { SkeletonLoader, ErrorView } from '../../components';
import type { MonthlyComparison, TopCategory } from '../../types';

const screenWidth = Dimensions.get('window').width;

export const AnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<MonthlyComparison | null>(null);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [comparisonData, categoriesData] = await Promise.all([
        analyticsService.getMonthlyComparison(),
        analyticsService.getTopCategories('expense', 5)
      ]);
      setComparison(comparisonData);
      setTopCategories(categoriesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: colors.white,
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error || !comparison) {
    return <ErrorView message={error || 'Failed to load analytics'} onRetry={loadAnalytics} />;
  }

  const incomeChange = comparison.changes.income.amount;
  const expenseChange = comparison.changes.expense.amount;
  const incomePercentage = parseFloat(comparison.changes.income.percentage);
  const expensePercentage = parseFloat(comparison.changes.expense.percentage);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Track your spending patterns</Text>
      </View>

      {/* Income vs Expense Overview */}
      <View style={styles.overviewCard}>
        <Text style={styles.cardTitle}>This Month</Text>
        <View style={styles.overviewRow}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Income</Text>
            <Text style={[styles.overviewAmount, { color: colors.success }]}>
              {formatCurrencySimple(comparison.currentMonth.income)}
            </Text>
            <View style={styles.trendBadge}>
              <Text style={styles.trendText}>
                {incomeChange >= 0 ? '↑' : '↓'} {Math.abs(incomePercentage).toFixed(1)}%
              </Text>
            </View>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Expense</Text>
            <Text style={[styles.overviewAmount, { color: colors.error }]}>
              {formatCurrencySimple(comparison.currentMonth.expense)}
            </Text>
            <View style={styles.trendBadge}>
              <Text style={styles.trendText}>
                {expenseChange >= 0 ? '↑' : '↓'} {Math.abs(expensePercentage).toFixed(1)}%
              </Text>
            </View>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Savings</Text>
            <Text style={[styles.overviewAmount, { color: colors.primary }]}>
              {formatCurrencySimple(comparison.currentMonth.savings)}
            </Text>
            <Text style={styles.savingsRate}>
              {((comparison.currentMonth.savings / comparison.currentMonth.income) * 100).toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Monthly Comparison */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Monthly Comparison</Text>
          <Text style={styles.cardSubtitle}>Current vs Previous</Text>
        </View>
        <BarChart
          data={{
            labels: ['Income', 'Expense', 'Savings'],
            datasets: [
              {
                data: [
                  comparison.currentMonth.income / 1000,
                  comparison.currentMonth.expense / 1000,
                  comparison.currentMonth.savings / 1000,
                ],
              },
            ],
          }}
          width={screenWidth - spacing.lg * 2}
          height={220}
          yAxisLabel="₹"
          yAxisSuffix="k"
          chartConfig={{
            ...chartConfig,
            barPercentage: 0.7,
          }}
          style={styles.chart}
          withInnerLines={false}
          fromZero
          showBarTops={false}
        />
      </View>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Spending Categories</Text>
          {topCategories.map((category, index) => {
            const categoryColors = ['#FF9500', '#FF3B30', '#34C759', '#007AFF', '#5856D6'];
            const categoryEmojis = ['🍔', '🚗', '🛍️', '📱', '🎬'];
            
            return (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryIcon, { backgroundColor: categoryColors[index % 5] + '20' }]}>
                    <Text style={styles.categoryEmoji}>{categoryEmojis[index % 5]}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.category}</Text>
                    <Text style={styles.categoryTransactions}>
                      {category.count} transactions
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryAmount}>{formatCurrencySimple(category.total)}</Text>
                  <Text style={styles.categoryPercentage}>
                    {parseFloat(category.percentage).toFixed(1)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Previous Month Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Previous Month</Text>
        <View style={styles.dailyGrid}>
          <View style={styles.dailyItem}>
            <Text style={styles.dailyLabel}>Income</Text>
            <Text style={[styles.dailyAmount, { color: colors.success }]}>
              {formatCurrencySimple(comparison.previousMonth.income)}
            </Text>
          </View>
          <View style={styles.dailyItem}>
            <Text style={styles.dailyLabel}>Expense</Text>
            <Text style={[styles.dailyAmount, { color: colors.error }]}>
              {formatCurrencySimple(comparison.previousMonth.expense)}
            </Text>
          </View>
          <View style={styles.dailyItem}>
            <Text style={styles.dailyLabel}>Savings</Text>
            <Text style={[styles.dailyAmount, { color: colors.primary }]}>
              {formatCurrencySimple(comparison.previousMonth.savings)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  overviewCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  overviewAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  trendBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  overviewDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  savingsRate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  categoryTransactions: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  categoryPercentage: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dailyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  dailyItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: spacing.xs,
  },
  dailyLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dailyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
