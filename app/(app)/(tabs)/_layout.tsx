import { Tabs } from 'expo-router';
import { FileText, Home, PlusCircle, User } from 'lucide-react-native';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 70 + Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="complaints/index"
        options={{
          title: 'My Complaints',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="complaints/new"
        options={{
          title: 'New Complaint',
          tabBarIcon: ({ color, focused, size }) => (
            <View
              style={[
                styles.createIcon,
                focused ? styles.createIconActive : styles.createIconInactive,
              ]}
            >
              <PlusCircle color={focused ? '#FFFFFF' : color} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="complaints/[id]" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
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
  createIconActive: {
    backgroundColor: colors.primary,
  },
  createIconInactive: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: colors.border,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    elevation: 14,
    paddingHorizontal: 8,
    paddingTop: 7,
    shadowColor: colors.shadow,
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
