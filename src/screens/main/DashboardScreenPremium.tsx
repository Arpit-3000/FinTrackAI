import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { SkeletonLoader, ErrorView } from '../../components';
import { transactionService } from '../../services';
import { formatCurrency } from '../../utils';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainTabParamList, 'Dashboard'>;

interface DashboardData {
  balance: number;
  cardNumber: string;
  cardHolder: string;
  validThru: string;
  weeklyData: { day: string; amount: number }[];
  recentTransactions: any[];
  weeklyChange: number;
}

export const DashboardScreen = ({ navigation }: Props) => {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const transactionsResponse = await transactionService.getTransactions({ limit: 1000 });
      const transactions = transactionsResponse.data || [];

      // Calculate balance
      let totalIncome = 0;
      let totalExpense = 0;

      transactions.forEach((t) => {
        const amount = Math.abs(Number(t.amount) || 0);
        if (t.type === 'income') {
          totalIncome += amount;
        } else if (t.type === 'expense') {
          totalExpense += amount;
        }
      });

      const balance = totalIncome - totalExpense;

      // Calculate weekly data (last 7 days)
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const weeklyData = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = weekDays[date.getDay()];

        const dayTotal = transactions
          .filter((t) => {
            const tDate = new Date(t.date);
            return (
              tDate.getDate() === date.getDate() &&
              tDate.getMonth() === date.getMonth() &&
              tDate.getFullYear() === date.getFullYear()
            );
          })
          .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

        weeklyData.push({ day: dayName, amount: dayTotal });
      }

      // Calculate weekly change
      const thisWeekTotal = weeklyData.reduce((sum, d) => sum + d.amount, 0);
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(lastWeekStart.getDate() - 13);
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

      const lastWeekTotal = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          return tDate >= lastWeekStart && tDate <= lastWeekEnd;
        })
        .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

      const weeklyChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

      setDashboardData({
        balance,
        cardNumber: '**** **** **** 0023',
        cardHolder: user?.name || 'User',
        validThru: '08/25',
        weeklyData,
        recentTransactions: transactions.slice(0, 5),
        weeklyChange,
      });
    } catch (err: any) {
      console.error('❌ Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const playNotificationSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        { shouldPlay: true, volume: 0.8 }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('❌ Could not play sound:', error);
    }
  };

  const handleNotificationPress = async () => {
    await playNotificationSound();
    Alert.alert('Notifications', 'No new notifications', [{ text: 'OK' }]);
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error || !dashboardData) {
    return <ErrorView message={error || 'Failed to load dashboard'} onRetry={loadDashboardData} />;
  }

  // Find min and max for chart scaling
  const amounts = dashboardData.weeklyData.map((d) => d.amount);
  const maxAmount = Math.max(...amounts);
  const minAmount = Math.min(...amounts);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Dark Header */}
        <View style={styles.darkHeader}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7}>
              <Text style={styles.backIcon}>←</Text>
              <Text style={styles.backIcon}>⟲</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNotificationPress} activeOpacity={0.7}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingIcon}>☀️</Text>
            <Text style={styles.greeting}>{getGreeting()}</Text>
          </View>

          <Text style={styles.welcomeText}>Welcome, {user?.name || 'User'}</Text>

          {/* Premium Card */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['#3A3A3A', '#2B2B2B', '#4A4A4A']}
              style={styles.premiumCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Contactless Icon */}
              <View style={styles.contactlessIcon}>
                <View style={styles.contactlessWave} />
                <View style={[styles.contactlessWave, { marginLeft: -8 }]} />
                <View style={[styles.contactlessWave, { marginLeft: -8 }]} />
              </View>

              {/* Balance Label */}
              <Text style={styles.balanceLabel}>Available Credit</Text>

              {/* Balance Amount */}
              <Text style={styles.balanceAmount}>₹{dashboardData.balance.toLocaleString('en-IN')}</Text>

              {/* Card Number */}
              <Text style={styles.cardNumber}>{dashboardData.cardNumber}</Text>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>Card Holder</Text>
                  <Text style={styles.cardValue}>{dashboardData.cardHolder}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardLabel}>Valid Thru</Text>
                  <Text style={styles.cardValue}>{dashboardData.validThru}</Text>
                </View>
              </View>

              {/* Card Chip */}
              <View style={styles.cardChipContainer}>
                <View style={styles.cardChip1} />
                <View style={styles.cardChip2} />
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Light Content Area */}
        <View style={styles.lightContent}>
          {/* Analytics Section */}
          <View style={styles.analyticsCard}>
            <View style={styles.analyticHeader}>
              <Text style={styles.sectionTitle}>Analytics</Text>
              <View style={styles.dailyBadge}>
                <Text style={styles.dailyText}>Daily</Text>
                <View style={styles.dailyDot} />
              </View>
            </View>

            {/* Chart */}
            <View style={styles.chartContainer}>
              {/* Change Indicator */}
              <View style={styles.changeIndicator}>
                <View style={styles.changeIcon}>
                  <Text style={styles.changeEmoji}>📉</Text>
                </View>
                <Text style={[styles.changeAmount, { color: dashboardData.weeklyChange >= 0 ? colors.success : colors.expense }]}>
                  {dashboardData.weeklyChange >= 0 ? '+' : ''}₹{Math.abs(dashboardData.weeklyChange * 100).toFixed(2)}
                </Text>
              </View>

              {/* Weekly Chart */}
              <View style={styles.chart}>
                {dashboardData.weeklyData.map((item, index) => {
                  const heightPercentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  const isWednesday = item.day === 'Wed';

                  return (
                    <View key={index} style={styles.chartColumn}>
                      <View style={styles.chartBarContainer}>
                        {/* Highlight for Wednesday */}
                        {isWednesday && (
                          <View style={styles.highlightBar}>
                            <Text style={styles.highlightAmount}>₹{item.amount.toFixed(0)}</Text>
                          </View>
                        )}
                        {/* Chart Bar */}
                        <View
                          style={[
                            styles.chartBar,
                            {
                              height: `${Math.max(heightPercentage, 5)}%`,
                              backgroundColor: isWednesday ? colors.text : colors.accent,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartLabel}>{item.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activitySection}>
            <View style={styles.activityHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Transactions')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {dashboardData.recentTransactions.map((transaction, index) => (
              <View key={transaction._id || index} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: colors.accent + '20' }]}>
                    <Text style={styles.transactionEmoji}>🏠</Text>
                  </View>
                  <View>
                    <Text style={styles.transactionTitle}>{transaction.description || 'Transaction'}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.transactionAmount}>
                  ₹{Math.abs(Number(transaction.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.massive,
  },
  darkHeader: {
    backgroundColor: colors.cardDark,
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.accent,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '600',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  greetingIcon: {
    fontSize: 16,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
  },
  welcomeText: {
    ...typography.displayMedium,
    color: colors.white,
    marginBottom: spacing.xl,
  },
  cardContainer: {
    marginTop: spacing.base,
  },
  premiumCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 200,
    ...shadows.xl,
  },
  contactlessIcon: {
    flexDirection: 'row',
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
  },
  contactlessWave: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
    opacity: 0.4,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.displaySmall,
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  cardNumber: {
    ...typography.titleMedium,
    color: colors.white,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    ...typography.captionSmall,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  cardValue: {
    ...typography.titleMedium,
    color: colors.white,
  },
  cardChipContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cardChip1: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    opacity: 0.8,
  },
  cardChip2: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    opacity: 0.8,
  },
  lightContent: {
    padding: spacing.lg,
  },
  analyticsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  analyticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    gap: spacing.xs,
  },
  dailyText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  dailyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  chartContainer: {
    position: 'relative',
  },
  changeIndicator: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
    zIndex: 10,
  },
  changeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  changeEmoji: {
    fontSize: 24,
  },
  changeAmount: {
    ...typography.titleMedium,
    fontWeight: '700',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: spacing.xxxl,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  chartBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  chartBar: {
    width: '60%',
    borderTopLeftRadius: borderRadius.xs,
    borderTopRightRadius: borderRadius.xs,
  },
  highlightBar: {
    position: 'absolute',
    top: -spacing.xl,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  highlightAmount: {
    ...typography.captionSmall,
    color: colors.text,
    fontWeight: '600',
  },
  chartLabel: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },
  activitySection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  viewAllText: {
    ...typography.titleSmall,
    color: colors.accent,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionEmoji: {
    fontSize: 24,
  },
  transactionTitle: {
    ...typography.titleMedium,
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  transactionDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  transactionAmount: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '700',
  },
});
