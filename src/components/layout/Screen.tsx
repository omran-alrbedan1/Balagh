import { PropsWithChildren, ReactElement } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
  ScrollView,
  View,
} from 'react-native';

import { PageHeader } from '@/components/layout/PageHeader';

interface ScreenProps extends PropsWithChildren {
  title: string;
  refreshControl?: ReactElement<RefreshControlProps>;
  subtitle?: string;
}

export function Screen({ children, refreshControl, subtitle, title }: ScreenProps) {
  return (
    <View className="flex-1 bg-surface-light">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <PageHeader subtitle={subtitle} title={title} />
        <ScrollView
          contentContainerClassName="gap-4 p-6 pb-8"
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
