import { Link } from 'expo-router';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout/Screen';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('notFound.title')}>
      <Text>{t('notFound.message')}</Text>
      <Link href="/(auth)/login">{t('notFound.goToLogin')}</Link>
    </Screen>
  );
}
