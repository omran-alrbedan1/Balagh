import { Link } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/components/layout/Screen';

export default function NotFoundScreen() {
  return (
    <Screen title="Not Found">
      <Text>This screen does not exist.</Text>
      <Link href="/(auth)/login">Go to login</Link>
    </Screen>
  );
}
