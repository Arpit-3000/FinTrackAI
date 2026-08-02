import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';

export const ProfileScreen = () => {
  const { logout } = useAuth();
  const { user } = useAuthStore();

  // Premium menu items with Ionicons
  const menuItems = [
    { id: 'profile', icon: 'person-outline', title: 'Edit Profile', subtitle: 'Update your information', color: colors.accent },
    { id: 'notifications', icon: 'notifications-outline', title: 'Notifications', subtitle: 'Manage alerts', color: colors.warning },
    { id: 'security', icon: 'shield-checkmark-outline', title: 'Security', subtitle: 'Password & privacy', color: colors.success },
    { id: 'payment', icon: 'card-outline', title: 'Payment Methods', subtitle: 'Manage cards', color: colors.chartBlue },
    { id: 'export', icon: 'download-outline', title: 'Export Data', subtitle: 'Download your data', color: colors.info },
    { id: 'help', icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get assistance', color: colors.chartPurple },
    { id: 'about', icon: 'information-circle-outline', title: 'About', subtitle: 'Version & info', color: colors.textSecondary },
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
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header - matching Transaction page style */}
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="settings-outline" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{user?.name || 'User'}</Text>
            <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
            {user?.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Menu Items - matching Transaction page style */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button - updated styling */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.white} />
        <Text style={styles.logoutText}>Logout</Text>
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
  
  // Header - matching Transaction page
  header: {
    paddingTop: spacing.huge,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.displaySmall,
    color: colors.text,
  },
  editButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(198, 122, 77, 0.15)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // User Card - matching Transaction page style
  userCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatar: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    marginLeft: spacing.xxs,
  },
  
  // Menu Items - matching Transaction page
  menuContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    ...typography.titleMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  
  // Logout Button - matching Transaction page
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: colors.error,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
    gap: spacing.sm,
  },
  logoutText: {
    ...typography.titleMedium,
    color: colors.white,
    fontWeight: '700',
  },
  
  // Version info
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
