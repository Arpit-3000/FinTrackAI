import { useEffect, useRef } from 'react';
import { Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, spacing } from '../theme';

interface QuickActionButtonProps {
  title: string;
  emoji: string;
  color: string;
  onPress: () => void;
  index: number;
}

export const QuickActionButton = ({ title, emoji, color, onPress, index }: QuickActionButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: 600 + index * 100,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
  }, [index]);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: color + '15' }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.title, { color }]} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  button: {
    padding: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 95,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    numberOfLines: 1,
  },
});
