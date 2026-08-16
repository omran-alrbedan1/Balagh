import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export type ConnectivityStatus = 'unknown' | 'online' | 'offline';

export function getConnectivityStatus(state: NetInfoState): ConnectivityStatus {
  if (state.isConnected === false) {
    return 'offline';
  }

  if (state.isConnected === true && state.isInternetReachable === true) {
    return 'online';
  }

  if (state.isInternetReachable === false) {
    return 'offline';
  }

  return 'unknown';
}

export async function fetchConnectivityStatus(): Promise<ConnectivityStatus> {
  return getConnectivityStatus(await NetInfo.fetch());
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<ConnectivityStatus>('unknown');

  useEffect(() => {
    let mounted = true;
    const update = (state: NetInfoState) => {
      if (mounted) {
        setStatus(getConnectivityStatus(state));
      }
    };
    const unsubscribe = NetInfo.addEventListener(update);

    void NetInfo.fetch()
      .then(update)
      .catch(() => {
        if (mounted) {
          setStatus('unknown');
        }
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isLoading: status === 'unknown',
  };
}
