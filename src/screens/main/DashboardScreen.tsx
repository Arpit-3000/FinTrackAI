import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
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
import { analyticsService, transactionService } from '../../services';
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

  const calculateFromTransactions = async () => {
    console.log('📊 Calculating dashboard data from transactions...');
    
    try {
      const transactionsResponse = await transactionService.getTransactions({ limit: 1000 });
      const transactions = transactionsResponse.data || [];
      
      console.log(`📝 Found ${transactions.length} transactions`);
      
      if (transactions.length === 0) {
        console.log('⚠️ No transactions found');
        return {
          summary: {
            income: '0',
            expense: '0',
            savings: '0',
            savingsRate: '0',
          },
          recentTransactions: [],
          monthlySpending: [],
          categoryBreakdown: [],
        };
      }
      
      // Calculate totals
      let totalIncome = 0;
      let totalExpense = 0;
      
      transactions.forEach(t => {
        const amount = Math.abs(Number(t.amount) || 0);
        if (t.type === 'income') {
          totalIncome += amount;
        } else if (t.type === 'expense') {
          totalExpense += amount;
        }
      });
      
      const savings = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : '0';
      
      console.log('💰 Calculated Totals:', {
        income: totalIncome,
        expense: totalExpense,
        savings: savings,
        savingsRate: savingsRate + '%'
      });
      
      // Get category breakdown for expenses
      const categoryMap = new Map<string, { amount: number; count: number }>();
      
      transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
          const amount = Math.abs(Number(t.amount) || 0);
          const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
          categoryMap.set(t.category, {
            amount: existing.amount + amount,
            count: existing.count + 1
          });
        });
      
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count,
          percentage: totalExpense > 0 ? ((data.amount / totalExpense) * 100).toFixed(1) : '0'
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      
      // Get monthly spending for last 6 months
      const now = new Date();
      const monthlyMap = new Map<string, number>();
      
      transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
          const date = new Date(t.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const amount = Math.abs(Number(t.amount) || 0);
          monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + amount);
        });
      
      const monthlySpending = Array.from(monthlyMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);
      
      return {
        summary: {
          income: totalIncome.toString(),
          expense: totalExpense.toString(),
          savings: savings.toString(),
          savingsRate: savingsRate,
        },
        recentTransactions: transactions.slice(0, 5),
        monthlySpending,
        categoryBreakdown,
      };
    } catch (err) {
      console.error('❌ Error calculating from transactions:', err);
      throw err;
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏠 Loading dashboard data...');
      console.log('API URL:', API_BASE_URL);
      
      // Always calculate from transactions first
      const calculatedData = await calculateFromTransactions();
      
      console.log('✅ Dashboard data ready:', calculatedData);
      
      setDashboardData(calculatedData);
      
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

  const playNotificationSound = async () => {
    try {
      // Set audio mode for playing sounds
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      // Create and play notification sound
      const { sound } = await Audio.Sound.createAsync(
        // Using a notification bell/ting sound from online source
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        { shouldPlay: true, volume: 0.8 }
      );
      
      console.log('🔔 Playing notification sound');
      
      // Unload sound after playing to free memory
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          console.log('✅ Sound finished and unloaded');
        }
      });
    } catch (error) {
      console.error('❌ Could not play sound:', error);
      // Silent fail - don't disrupt user experience
    }
  };

  const handleNotificationPress = async () => {
    await playNotificationSound();
    Alert.alert(
      'Notifications 🔔',
      'No new notifications',
      [{ text: 'OK' }]
    );
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

  // Safely parse numbers with fallback to 0
  const balance = Number(dashboardData.summary?.savings) || 0;
  const income = Number(dashboardData.summary?.income) || 0;
  const expense = Number(dashboardData.summary?.expense) || 0;
  const savingsRate = Number(dashboardData.summary?.savingsRate) || 0;

  console.log('📊 Parsed Dashboard Values:', {
    balance,
    income,
    expense,
    savingsRate
  });

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
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
              >
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
