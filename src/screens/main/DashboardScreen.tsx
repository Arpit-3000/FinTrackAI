import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../theme';
import {
  StatCard,
  TransactionItem,
  QuickActionButton,
  BarChart,
  PieChart,
  SkeletonLoader,
  ErrorView,
} from '../../components';
import { analyticsService } from '../../services';
import { formatCurrency } from '../../utils';
import { API_BASE_URL } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import type { DashboardData } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<MainTabParamList, 'Dashboard'>;

export const DashboardScreen = ({ navigation }: Props) => {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏠 Fetching dashboard data from backend...');
      console.log('API URL:', API_BASE_URL);
      
      const data = await analyticsService.getDashboard();
      
      console.log('✅ Dashboard data received:', data);
      
      setDashboardData(data);
    } catch (err: any) {
      console.error('❌ Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Good Morning! ☀️';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon! 🌤️';
    } else if (hour >= 17 && hour < 21) {
      return 'Good Evening! 🌆';
    } else {
      return 'Good Night! 🌙';
    }
  };

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'add-income') {
      // @ts-ignore - navigation works at runtime
      navigation.navigate('AddTransaction', {});
    } else if (actionId === 'add-expense') {
      // @ts-ignore - navigation works at runtime
      navigation.navigate('AddTransaction', {});
    } else if (actionId === 'budget') {
      // @ts-ignore - navigation works at runtime
      navigation.navigate('Budget');
    } else if (actionId === 'analytics') {
      // @ts-ignore - navigation works at runtime
      navigation.navigate('Analytics');
    } else {
      Alert.alert('Quick Action', `${actionId} action coming soon!`);
    }
  };

  const handleAddTransaction = () => {
    // @ts-ignore - navigation works at runtime
    navigation.navigate('AddTransaction', {});
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error || !dashboardData) {
    return (
      <ErrorView 
        message={error || 'Failed to load dashboard'} 
        onRetry={loadDashboardData}
      />
    );
  }

  const balance = parseFloat(dashboardData.summary.savings);
  const income = parseFloat(dashboardData.summary.income);
  const expense = parseFloat(dashboardData.summary.expense);
  const savingsRate = parseFloat(dashboardData.summary.savingsRate);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Balance */}
        <View>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.username}>{user?.name || 'User'}</Text>
              </View>
              <TouchableOpacity style={styles.notificationButton}>
                <Text style={styles.notificationIcon}>🔔</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(balance)}
              </Text>
              <View style={styles.balanceChange}>
                <Text style={styles.balanceChangeText}>
                  ↑ {savingsRate.toFixed(1)}% savings rate
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          {/* Stat Cards */}
          <View style={styles.statsContainer}>
            <StatCard
              title="Income"
              amount={income}
              change={0}
              percentage={100}
              gradientColors={['#34C759', '#28A745']}
              icon="💵"
              delay={100}
            />
            <StatCard
              title="Expenses"
              amount={expense}
              change={0}
              percentage={expense > 0 && income > 0 ? (expense / income) * 100 : 0}
              gradientColors={['#FF3B30', '#DC3545']}
              icon="💸"
              delay={200}
            />
            <StatCard
              title="Savings"
              amount={balance}
              change={0}
              percentage={savingsRate}
              gradientColors={['#007AFF', '#0056CC']}
              icon="🏦"
              delay={300}
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <QuickActionButton
                title="Income"
                emoji="💰"
                color="#34C759"
                onPress={() => handleQuickAction('add-income')}
                index={0}
              />
              <QuickActionButton
                title="Expense"
                emoji="💸"
                color="#FF3B30"
                onPress={() => handleQuickAction('add-expense')}
                index={1}
              />
              <QuickActionButton
                title="Budget"
                emoji="📊"
                color="#007AFF"
                onPress={() => handleQuickAction('budget')}
                index={2}
              />
              <QuickActionButton
                title="Analytics"
                emoji="📈"
                color="#FF9500"
                onPress={() => handleQuickAction('analytics')}
                index={3}
              />
            </View>
          </View>

          {/* Monthly Spending Chart */}
          {dashboardData.monthlySpending && dashboardData.monthlySpending.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Spending</Text>
              <BarChart data={dashboardData.monthlySpending.map(m => ({
                label: new Date(m.month).toLocaleDateString('en-US', { month: 'short' }),
                amount: m.amount
              }))} />
            </View>
          )}

          {/* Spending by Category */}
          {dashboardData.categoryBreakdown && dashboardData.categoryBreakdown.length > 0 && (
            <View style={styles.section}>
              <PieChart data={dashboardData.categoryBreakdown.map(c => ({
                category: c.category,
                amount: c.amount,
                percentage: parseFloat(c.percentage),
                color: ['#FF9500', '#FF3B30', '#34C759', '#007AFF', '#5856D6', '#FF2D55'][
                  dashboardData.categoryBreakdown.indexOf(c) % 6
                ]
              }))} />
            </View>
          )}

          {/* Recent Transactions */}
          {dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllButton}>See All</Text>
                </TouchableOpacity>
              </View>
              {dashboardData.recentTransactions.slice(0, 5).map((transaction, index) => (
                <TransactionItem
                  key={transaction._id}
                  transaction={transaction}
                  index={index}
                  onPress={() => Alert.alert('Transaction', transaction.description || 'Transaction')}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fab}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleAddTransaction}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.fabIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: spacing.xl * 1.8,
    paddingBottom: spacing.xl * 2.8,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl * 1.2,
  },
  greeting: {
    ...typography.body,
    color: colors.white,
    fontSize: 15,
    marginBottom: spacing.xs,
    opacity: 0.95,
  },
  username: {
    ...typography.h2,
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 26,
  },
  notificationButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationIcon: {
    fontSize: 24,
  },
  balanceContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  balanceLabel: {
    color: colors.white,
    fontSize: 15,
    opacity: 0.9,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  balanceAmount: {
    color: colors.white,
    fontSize: 52,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    letterSpacing: -1,
  },
  balanceChange: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceChangeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
    marginTop: -spacing.xl * 1.8,
  },
  statsContainer: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllButton: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl * 1.2,
    right: spacing.xl,
  },
  fabButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '300',
    marginTop: -2,
  },
});
