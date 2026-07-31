import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { formatCurrency } from '../utils';

interface Transaction {
  _id: string;
  description?: string;
  category: string;
  emoji?: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  createdAt: string;
}

interface TransactionItemProps {
  transaction: Transaction;
  index: number;
  onPress?: () => void;
}

export const TransactionItem = ({ transaction, index, onPress }: TransactionItemProps) => {
  const translateXAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateXAnim, {
        toValue: 0,
        delay: index * 100,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        delay: index * 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const isIncome = transaction.type === 'income';
  const transactionDate = new Date(transaction.date);
  const time = transactionDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View style={{ transform: [{ translateX: translateXAnim }], opacity: opacityAnim }}>
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconContainer, { backgroundColor: isIncome ? colors.success + '20' : colors.error + '20' }]}>
          <Text style={styles.emoji}>{transaction.emoji || (isIncome ? '💰' : '💸')}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{transaction.description || transaction.category}</Text>
          <Text style={styles.category}>{transaction.category} • {time}</Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: isIncome ? colors.success : colors.error }]}>
            {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  category: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
