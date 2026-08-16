import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

import { getConnectivityStatus } from '@/hooks/useNetworkStatus';

export function configureQueryOnlineManager() {
  onlineManager.setOnline(false);
  const update = (state: Parameters<typeof getConnectivityStatus>[0]) => {
    onlineManager.setOnline(getConnectivityStatus(state) === 'online');
  };
  const unsubscribe = NetInfo.addEventListener(update);

  void NetInfo.fetch()
    .then(update)
    .catch(() => onlineManager.setOnline(false));
  return unsubscribe;
}
