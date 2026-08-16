import { Tabs } from 'expo-router';
import { FileText, Home, PlusCircle, UserRound } from 'lucide-react-native';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUnreadCount } from '@/features/notifications/hooks/useUnreadCount';
import { formatUnreadBadge } from '@/features/notifications/utils/badge';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const unreadCount = useUnreadCount().data?.data.count ?? 0;
  const insets = useSafeAreaInsets();
  const tabBarHeight = 70 + Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: false,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: tabBarHeight,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="complaints/index"
        options={{
          href: '/(app)/(tabs)/complaints',
          title: t('navigation.complaints'),
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="complaints/new"
        options={{
          title: t('navigation.newComplaint'),
          tabBarIcon: ({ color, focused, size }) => (
            <View
              style={[
                styles.createIcon,
                focused
                  ? [styles.createIconActive, { backgroundColor: colors.primary }]
                  : styles.createIconInactive,
              ]}
            >
              <PlusCircle color={focused ? '#FFFFFF' : color} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarBadge: formatUnreadBadge(unreadCount),
          tabBarBadgeStyle: {
            backgroundColor: colors.danger,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '800',
          },
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="complaints/[id]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createIcon: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  createIconActive: {},
  createIconInactive: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    elevation: 14,
    paddingHorizontal: 8,
    paddingTop: 7,
    shadowColor: '#041630',
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.16,
    shadowRadius: 18,
  },
  tabItem: {
    borderRadius: 14,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 1,
  },
});
