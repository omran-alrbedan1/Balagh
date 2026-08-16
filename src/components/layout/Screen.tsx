import { PropsWithChildren, ReactElement } from 'react';
import { RefreshControlProps, ScrollView, StyleSheet, View } from 'react-native';

import { KeyboardAwareFormScrollView } from '@/components/layout/KeyboardAwareFormScrollView';
import { PageHeader } from '@/components/layout/PageHeader';

interface ScreenProps extends PropsWithChildren {
  title: string;
  keyboardAware?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  subtitle?: string;
}

export function Screen({
  children,
  keyboardAware = false,
  refreshControl,
  subtitle,
  title,
}: ScreenProps) {
  const content = keyboardAware ? (
    <KeyboardAwareFormScrollView
      contentContainerStyle={styles.content}
      refreshControl={refreshControl}
    >
      {children}
    </KeyboardAwareFormScrollView>
  ) : (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );

  return (
    <View className="flex-1 bg-surface-light">
      <View className="flex-1">
        <PageHeader subtitle={subtitle} title={title} />
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 24,
    paddingBottom: 32,
  },
});
