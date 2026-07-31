import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../theme';
import { formatCurrencySimple } from '../../utils';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';

export const ProfileScreen = () => {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { isDark, themeMode, setThemeMode } = useTheme();

  // Static menu items
  const menuItems = [
    { id: 'profile', icon: '👤', title: 'Edit Profile', subtitle: 'Update your information' },
    { id: 'notifications', icon: '🔔', title: 'Notifications', subtitle: 'Manage alerts' },
    { id: 'security', icon: '🔒', title: 'Security', subtitle: 'Password & privacy' },
    { id: 'payment', icon: '💳', title: 'Payment Methods', subtitle: 'Manage cards' },
    { id: 'export', icon: '📤', title: 'Export Data', subtitle: 'Download your data' },
    { id: 'help', icon: '❓', title: 'Help & Support', subtitle: 'Get assistance' },
    { id: 'about', icon: 'ℹ️', title: 'About', subtitle: 'Version & info' },
  ];

  const handleMenuPress = (itemId: string) => {
    switch (itemId) {
      case 'profile':
        Alert.alert('Edit Profile', 'Profile editing coming soon!');
        break;
      case 'notifications':
        Alert.alert('Notifications', 'Notification settings coming soon!');
        break;
      case 'security':
        Alert.alert('Security', 'Security settings coming soon!');
        break;
      case 'payment':
        Alert.alert('Payment Methods', 'Payment methods coming soon!');
        break;
      case 'export':
        Alert.alert('Export Data', 'Data export coming soon!');
        break;
      case 'help':
        Alert.alert('Help & Support', 'Help center coming soon!');
        break;
      case 'about':
        Alert.alert(
          'About FinTrack AI',
          'Version 1.0.0\n\nA modern financial tracking app built with React Native.',
        );
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
      { cancelable: true },
    );
  };

  const handleDarkModeToggle = (value: boolean) => {
    // Toggle between light and dark mode
    setThemeMode(value ? 'dark' : 'light');
    Alert.alert(
      'Theme Changed', 
      `${value ? 'Dark' : 'Light'} mode enabled!`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <View>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{user?.avatar || '👤'}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
          {user?.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>30</Text>
          <Text style={styles.statLabel}>Days Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statValue}>124</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹25K</Text>
          <Text style={styles.statLabel}>Total Tracked</Text>
        </View>
      </View>

      {/* Dark Mode Toggle */}
      <View style={styles.darkModeCard}>
        <View style={styles.darkModeLeft}>
          <View style={styles.darkModeIcon}>
            <Text style={styles.darkModeEmoji}>{isDark ? '🌙' : '☀️'}</Text>
          </View>
          <View>
            <Text style={styles.darkModeTitle}>Dark Mode</Text>
            <Text style={styles.darkModeSubtitle}>
              {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
            </Text>
          </View>
        </View>
        <Switch
          value={isDark}
          onValueChange={handleDarkModeToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuEmoji}>{item.icon}</Text>
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.version}>Version 1.0.0</Text>
      <Text style={styles.copyright}>© 2024 FinTrack AI. All rights reserved.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
    paddingTop: spacing.xl * 1.5,
    paddingBottom: spacing.xl * 2,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    fontSize: 50,
  },
  name: {
    ...typography.h2,
    color: colors.white,
    marginBottom: spacing.xs,
    fontWeight: 'bold',
  },
  email: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  verifiedText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xl,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  darkModeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  darkModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  darkModeIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  darkModeEmoji: {
    fontSize: 20,
  },
  darkModeTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  darkModeSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  menuContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuEmoji: {
    fontSize: 20,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  menuArrow: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: colors.error,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  copyright: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontSize: 11,
  },
});
