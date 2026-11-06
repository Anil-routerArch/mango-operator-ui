import { useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosProv, axiosGw, axiosMdu, axiosFms, getMduBaseUrl } from './client';
import type {
  InventoryTagApiResponse,
  GatewayDeviceApiResponse,
  DeviceWithStatusApiResponse,
  UnifiedFleetDevice,
  PaginatedFleetResponse,
  FleetFetchOptions,
  DeviceDashboardApiResponse,
  BlacklistDevice,
  DeviceStatisticsFrame,
  DeviceStatisticsPayload,
  DeviceHealthCheck,
  DeviceCommandHistory,
  DeviceLog,
  ComputedConfigurationResponse,
  ConfigurationOverridesResponse,
  ConfigurationOverride,
  DeviceCapabilitiesResponse,
  DeviceNote,
} from '@/types/device';
import { normalizePlatformDeviceType } from '@/types/device';

// Helper: Normalize serial numbers/MACs to lowercase alphanumeric string
export const normalizeSerial = (serial: string): string => {
  return serial.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
};

/**
 * Normalizes and formats MAC with colons for display: e.g. "60:cf:84:f2:22:90"
 */
export const formatMacAddress = (serial: string): string => {
  const clean = normalizeSerial(serial);
  if (clean.length === 12) {
    return clean.match(/.{1,2}/g)?.join(':').toLowerCase() || clean;
  }
  return serial;
};

/**
 * Format relative elapsed time (e.g. "8 min ago", "20s ago")
 */
export const formatRelativeTime = (timestamp?: number): string => {
  if (!timestamp || timestamp === 0) return 'Never';
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - timestamp);
  if (diff < 15) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/**
 * Format humanized uptime (e.g. "12d 7h", "1d 16h")
 */
export const formatUptime = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

// ----------------------------------------------------------------------
// 1. Fleet Ingestion & Data Merging Engine (RBAC-Safe & Paginated via MDU)
// ----------------------------------------------------------------------

/**
 * Paginated fleet device fetcher.
 * Uses MDU Service (`GET /api/v1/devices`) as the single authoritative fleet API,
 * which enforces RBAC scoping on inventory and aggregates real-time gateway status.
 * Any errors (e.g. 401, 403, 500) propagate cleanly to React Query.
 */
export const getPaginatedFleetDevices = async (
  options?: FleetFetchOptions
): Promise<PaginatedFleetResponse> => {
  const pageIndex = Math.max(0, options?.pageIndex ?? 0);
  const pageSize = Math.max(1, options?.pageSize ?? 10);
  const unassignedOnly = Boolean(options?.unassignedOnly);

  const res = await axiosMdu.get<PaginatedFleetResponse>('devices', {
    params: {
      pageIndex,
      pageSize,
      unassignedOnly,
    },
  });

  return res.data;
};

/**
 * Hook for paginated fleet devices with RBAC-scoping.
 */
export const usePaginatedFleetDevices = (options?: FleetFetchOptions) => {
  return useQuery({
    queryKey: [
      'paginated-fleet-devices',
      options?.pageIndex ?? 0,
      options?.pageSize ?? 10,
      Boolean(options?.unassignedOnly),
    ],
    queryFn: () => getPaginatedFleetDevices(options),
    refetchInterval: 15000,
    staleTime: 10000,
    placeholderData: (previousData) => previousData,
  });
};

export interface DeviceRealtimeEvent {
  type: 'connection' | 'state' | 'healthcheck';
  serialNumber: string;
  timestamp: number;
  connected?: boolean;
  connectionIp?: string;
  firmware?: string;
  memoryFree?: number;
  memoryTotal?: number;
  memoryPct?: number;
  load?: number[];
  sanity?: number;
}

/**
 * Real-time event stream hook for active viewport devices.
 * Connects to MDU backend WebSocket stream (/api/v1/ws) using the OpenWiFi production protocol:
 * 1. Unauthenticated WebSocket handshake (bypasses browser custom header limitations).
 * 2. In-band first-frame authentication: `ws.send('token:' + token)`.
 * 3. Bidirectional viewport filtering and real-time Kafka event dispatching.
 */
export const useDeviceEventsStream = (serials: string[]) => {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const isAuthenticatedRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const serialsRef = useRef(serials);
  serialsRef.current = serials;

  const serialsKey = useMemo(() => serials.slice().sort().join(','), [serials]);

  const mduBaseUrl = axiosMdu.defaults.baseURL || getMduBaseUrl();
  const token =
    sessionStorage.getItem('access_token') || localStorage.getItem('access_token');

  // Update active viewport serials over the open WebSocket when serials change.
  // Sends empty array [] when viewport is empty to unsubscribe all devices.
  useEffect(() => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && isAuthenticatedRef.current) {
      ws.send(JSON.stringify({ serials }));
    }
  }, [serialsKey]);

  useEffect(() => {
    if (!mduBaseUrl || !token || typeof WebSocket === 'undefined') {
      return;
    }

    let isDisposed = false;

    const connectWebSocket = () => {
      if (isDisposed) return;

      // Construct wss:// URL to /api/v1/ws without exposing token in query string
      const wsUrl = `${mduBaseUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:').replace(/\/+$/, '')}/ws`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (isDisposed) {
          ws.close();
          return;
        }
        // Send in-band first-frame token authentication matching OWPROV pattern
        ws.send(`token:${token}`);
      };

      ws.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);

          // Handle welcome handshake
          if (data.success) {
            isAuthenticatedRef.current = true;
            // Send current viewport serials (sends [] if viewport has no devices)
            ws.send(JSON.stringify({ serials: serialsRef.current }));
            return;
          }

          // Handle incoming device telemetry event
          if (!data?.serialNumber) return;

          const event = data as DeviceRealtimeEvent;
          const normEventSerial = normalizeSerial(event.serialNumber);

          queryClient.setQueriesData<PaginatedFleetResponse>(
            { queryKey: ['paginated-fleet-devices'] },
            (old) => {
              if (!old?.devices) return old;

              const updatedDevices = old.devices.map((dev) => {
                if (normalizeSerial(dev.serialNumber) !== normEventSerial) {
                  return dev;
                }

                const copy = { ...dev };
                if (event.type === 'connection') {
                  if (typeof event.connected === 'boolean') {
                    copy.connected = event.connected;
                  }
                  if (event.connectionIp) {
                    copy.ipAddress = event.connectionIp;
                  }
                  if (event.firmware) {
                    copy.firmware = event.firmware;
                  }
                  if (event.timestamp) {
                    copy.lastContact = event.timestamp;
                  }
                } else if (event.type === 'state') {
                  if (typeof event.memoryPct === 'number') {
                    copy.memoryUsedPct = Math.round(event.memoryPct);
                  }
                  if (Array.isArray(event.load) && event.load.length > 0) {
                    copy.load = event.load[0];
                  }
                  if (event.timestamp) {
                    copy.lastContact = event.timestamp;
                  }
                } else if (event.type === 'healthcheck') {
                  if (typeof event.sanity === 'number') {
                    copy.sanity = event.sanity;
                  }
                  if (event.timestamp) {
                    copy.lastContact = event.timestamp;
                  }
                }

                return copy;
              });

              return {
                ...old,
                devices: updatedDevices,
              };
            }
          );
        } catch (err) {
          console.debug('Failed to parse incoming WebSocket device event:', err);
        }
      };

      ws.onclose = () => {
        isAuthenticatedRef.current = false;
        socketRef.current = null;
        if (!isDisposed) {
          // Reconnect with 5s backoff
          reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, 5000);
        }
      };

      ws.onerror = () => {
        // onclose will automatically trigger reconnect
      };
    };

    connectWebSocket();

    return () => {
      isDisposed = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      isAuthenticatedRef.current = false;
    };
  }, [mduBaseUrl, token]);
};

export interface FleetDevicesResponse {
  devices: UnifiedFleetDevice[];
  totalCount: number;
}

/**
 * Fetches fleet devices from the authoritative MDU service with full pagination aggregation.
 */
export const getFleetDevices = async (
  options?: FleetFetchOptions
): Promise<FleetDevicesResponse> => {
  const pageSize = 500;
  const res = await axiosMdu.get<PaginatedFleetResponse>('devices', {
    params: {
      pageIndex: 0,
      pageSize,
      unassignedOnly: Boolean(options?.unassignedOnly),
    },
  });

  const firstPage = res.data?.devices || [];
  const totalCount = res.data?.totalCount ?? firstPage.length;

  if (totalCount > pageSize && res.data?.totalPages > 1) {
    const totalPages = Math.min(res.data.totalPages, 10);
    const pagePromises = [];
    for (let p = 1; p < totalPages; p++) {
      pagePromises.push(
        axiosMdu
          .get<PaginatedFleetResponse>('devices', {
            params: {
              pageIndex: p,
              pageSize,
              unassignedOnly: Boolean(options?.unassignedOnly),
            },
          })
          .then((r) => r.data?.devices || [])
          .catch(() => [])
      );
    }
    const otherPages = await Promise.all(pagePromises);
    const allDevices = firstPage.concat(...otherPages);
    return { devices: allDevices, totalCount };
  }

  return { devices: firstPage, totalCount };
};

export const useFleetDashboard = (options?: FleetFetchOptions) => {
  return useQuery({
    queryKey: ['fleet-dashboard-devices', options],
    queryFn: () => getFleetDevices(options),
    refetchInterval: 15000,
    staleTime: 10000,
  });
};

export const useFleetDevices = (options?: FleetFetchOptions) => {
  return useQuery({
    queryKey: ['fleet-devices', options],
    queryFn: async () => {
      const res = await getFleetDevices(options);
      return res.devices;
    },
    refetchInterval: 15000,
    staleTime: 10000,
  });
};

// ----------------------------------------------------------------------
// 2. Controller Dashboard
// ----------------------------------------------------------------------

export const getDeviceDashboard = async (): Promise<DeviceDashboardApiResponse> => {
  const res = await axiosGw.get<DeviceDashboardApiResponse>('deviceDashboard');
  return res.data;
};

export const useDeviceDashboard = () => {
  return useQuery({
    queryKey: ['devices-controller-dashboard'],
    queryFn: getDeviceDashboard,
    refetchInterval: 30000,
    staleTime: 20000,
  });
};

// ----------------------------------------------------------------------
// 3. Blacklist APIs
// ----------------------------------------------------------------------

export const getBlacklistDevices = async (): Promise<BlacklistDevice[]> => {
  const res = await axiosMdu.get<{ devices: BlacklistDevice[] }>('devices/blacklist');
  return res.data?.devices || [];
};

export const useBlacklistDevices = () => {
  return useQuery({
    queryKey: ['devices-blacklist'],
    queryFn: getBlacklistDevices,
    staleTime: 15000,
  });
};

export const useCreateBlacklistDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { serialNumber: string; reason: string }) => {
      const clean = payload.serialNumber.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
      const res = await axiosMdu.post('devices/blacklist', {
        serialNumber: clean,
        reason: payload.reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices-blacklist'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview'] });
    },
  });
};

export const useDeleteBlacklistDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serialNumber: string) => {
      const clean = serialNumber.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
      const res = await axiosMdu.delete(`devices/blacklist/${clean}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices-blacklist'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview'] });
    },
  });
};

// ----------------------------------------------------------------------
// 4. Single Device Detail (Aggregated)
// ----------------------------------------------------------------------

export interface SingleDeviceDetailAggregate {
  serialNumber: string;
  tag?: InventoryTagApiResponse;
  gwDevice?: GatewayDeviceApiResponse;
  status?: Record<string, unknown>;
  telemetryError?: string;
}

export const getSingleDeviceDetail = async (serialNumber: string): Promise<SingleDeviceDetailAggregate> => {
  const clean = normalizeSerial(serialNumber);

  const [tagRes, gwRes, statusRes] = await Promise.allSettled([
    axiosProv.get<InventoryTagApiResponse>(`inventory/${clean}`),
    axiosMdu.get<GatewayDeviceApiResponse>(`devices/${clean}`),
    axiosMdu.get<Record<string, unknown>>(`devices/${clean}/status`),
  ]);

  const rejections = [tagRes, gwRes, statusRes]
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason);

  // If any core call returned 401 or 403 authorization error, throw immediately
  const authError = rejections.find(
    (err: any) => err?.response?.status === 401 || err?.response?.status === 403
  );
  if (authError) {
    throw authError;
  }

  const tag = tagRes.status === 'fulfilled' ? tagRes.value.data : undefined;
  const gwDevice = gwRes.status === 'fulfilled' ? gwRes.value.data : undefined;
  const status = statusRes.status === 'fulfilled' ? statusRes.value.data : undefined;

  // If all calls failed, throw the underlying error to expose the real backend code and message
  if (!tag && !gwDevice && !status) {
    if (rejections.length > 0) {
      throw rejections[0];
    }
  }

  let telemetryError: string | undefined;
  if (statusRes.status === 'rejected') {
    const err = statusRes.reason as any;
    telemetryError =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.response?.data?.ErrorDescription ||
      (err?.response?.status ? `HTTP ${err.response.status}: ${err.response.statusText || 'Error fetching status'}` : err?.message);
  }

  return {
    serialNumber,
    tag,
    gwDevice,
    status,
    telemetryError,
  };
};

export const useSingleDeviceDetail = (serialNumber?: string | null) => {
  return useQuery({
    queryKey: ['single-device-detail', serialNumber],
    queryFn: () => (serialNumber ? getSingleDeviceDetail(serialNumber) : null),
    enabled: Boolean(serialNumber),
    refetchInterval: 15000,
  });
};

export const getDeviceCapabilities = async (
  serialNumber: string,
): Promise<DeviceCapabilitiesResponse | null> => {
  const clean = normalizeSerial(serialNumber);
  try {
    const res = await axiosMdu.get<DeviceCapabilitiesResponse>(`devices/${clean}/capabilities`);
    return res.data;
  } catch (err) {
    console.warn('Failed to fetch device capabilities from MDU:', err);
    return null;
  }
};

export const useDeviceCapabilities = (serialNumber?: string | null, enabled = false) => {
  return useQuery({
    queryKey: ['device-capabilities', serialNumber],
    queryFn: () => (serialNumber ? getDeviceCapabilities(serialNumber) : null),
    enabled: Boolean(serialNumber) && enabled,
    staleTime: 30000,
  });
};

// ----------------------------------------------------------------------
// 5. Telemetry, Stats & Wi-Fi Analysis
// ----------------------------------------------------------------------

export const getDeviceStatisticsFrames = async (
  serialNumber: string,
  limit = 30,
  startDate?: number,
  endDate?: number,
): Promise<DeviceStatisticsFrame[]> => {
  const clean = normalizeSerial(serialNumber);
  const timeQuery =
    startDate !== undefined && endDate !== undefined
      ? `&startDate=${startDate}&endDate=${endDate}`
      : '&newest=true';
  const res = await axiosMdu.get<{ data: DeviceStatisticsFrame[] }>(
    `devices/${clean}/statistics?limit=${limit}${timeQuery}`,
  );
  return res.data?.data || [];
};

export const useDeviceStatisticsFrames = (
  serialNumber?: string | null,
  limit = 30,
  startDate?: number,
  endDate?: number,
) => {
  return useQuery({
    queryKey: ['device-stats-frames', serialNumber, limit, startDate, endDate],
    queryFn: () => (serialNumber ? getDeviceStatisticsFrames(serialNumber, limit, startDate, endDate) : []),
    enabled: Boolean(serialNumber),
    staleTime: 15000,
  });
};

export const getDeviceHealthChecks = async (
  serialNumber: string,
  limit = 25,
  startDate?: number,
  endDate?: number,
): Promise<DeviceHealthCheck[]> => {
  const clean = normalizeSerial(serialNumber);
  const timeQuery =
    startDate !== undefined && endDate !== undefined ? `&startDate=${startDate}&endDate=${endDate}` : '';
  const res = await axiosMdu.get<{ values: DeviceHealthCheck[] }>(
    `devices/${clean}/healthchecks?newest=true&limit=${limit}${timeQuery}`,
  );
  return res.data?.values || [];
};

export const useDeviceHealthChecks = (
  serialNumber?: string | null,
  limit = 25,
  enabled = true,
  startDate?: number,
  endDate?: number,
) => {
  return useQuery({
    queryKey: ['device-healthchecks', serialNumber, limit, startDate, endDate],
    queryFn: () => (serialNumber ? getDeviceHealthChecks(serialNumber, limit, startDate, endDate) : []),
    enabled: Boolean(serialNumber) && enabled,
    staleTime: 15000,
  });
};

// ----------------------------------------------------------------------
// 6. Commands & Logs
// ----------------------------------------------------------------------

export const getDeviceCommands = async (
  serialNumber: string,
  limit = 25,
  startDate?: number,
  endDate?: number,
): Promise<DeviceCommandHistory[]> => {
  const clean = normalizeSerial(serialNumber);
  const timeQuery =
    startDate !== undefined && endDate !== undefined ? `&startDate=${startDate}&endDate=${endDate}` : '';
  const res = await axiosMdu.get<{ commands: DeviceCommandHistory[] }>(
    `devices/${clean}/commands?newest=true&limit=${limit}${timeQuery}`,
  );
  return res.data?.commands || [];
};

export const useDeviceCommands = (
  serialNumber?: string | null,
  limit = 25,
  enabled = true,
  startDate?: number,
  endDate?: number,
) => {
  return useQuery({
    queryKey: ['device-commands', serialNumber, limit, startDate, endDate],
    queryFn: () => (serialNumber ? getDeviceCommands(serialNumber, limit, startDate, endDate) : []),
    enabled: Boolean(serialNumber) && enabled,
    staleTime: 15000,
  });
};

export const useDeleteCommand = (defaultSerial?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (arg: string | { commandUuid: string; serialNumber?: string }) => {
      const commandUuid = typeof arg === 'string' ? arg : arg.commandUuid;
      const serial = typeof arg === 'object' && arg.serialNumber ? arg.serialNumber : defaultSerial || '';
      const clean = normalizeSerial(serial);
      if (clean) {
        await axiosMdu.delete(`devices/${clean}/commands/${commandUuid}`);
      } else {
        await axiosGw.delete(`command/${commandUuid}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-commands'] });
    },
  });
};

export const getDeviceLogs = async (
  serialNumber: string,
  logType: 0 | 1 | 2 = 0,
  limit = 25,
  startDate?: number,
  endDate?: number,
): Promise<DeviceLog[]> => {
  const clean = normalizeSerial(serialNumber);
  const timeQuery =
    startDate !== undefined && endDate !== undefined ? `&startDate=${startDate}&endDate=${endDate}` : '';
  const res = await axiosMdu.get<{ values: DeviceLog[] }>(
    `devices/${clean}/logs?newest=true&limit=${limit}&logType=${logType}${timeQuery}`,
  );
  return res.data?.values || [];
};

export const useDeviceLogs = (
  serialNumber?: string | null,
  logType: 0 | 1 | 2 = 0,
  limit = 25,
  enabled = true,
  startDate?: number,
  endDate?: number,
) => {
  return useQuery({
    queryKey: ['device-logs', serialNumber, logType, limit, startDate, endDate],
    queryFn: () => (serialNumber ? getDeviceLogs(serialNumber, logType, limit, startDate, endDate) : []),
    enabled: Boolean(serialNumber) && enabled,
    staleTime: 15000,
  });
};

// ----------------------------------------------------------------------
// 7. Computed Config & Overrides (OWPROV Model)
// ----------------------------------------------------------------------

export const getComputedConfig = async (serialNumber: string): Promise<ComputedConfigurationResponse> => {
  const clean = normalizeSerial(serialNumber);
  const res = await axiosProv.get<ComputedConfigurationResponse>(`inventory/${clean}?config=true&explain=true`);
  return res.data;
};

export const useComputedConfig = (serialNumber?: string | null) => {
  return useQuery({
    queryKey: ['device-computed-config', serialNumber],
    queryFn: () => (serialNumber ? getComputedConfig(serialNumber) : null),
    enabled: Boolean(serialNumber),
    staleTime: 30000,
  });
};

export const getDeviceOverrides = async (serialNumber: string): Promise<ConfigurationOverride[]> => {
  const clean = normalizeSerial(serialNumber);
  try {
    const res = await axiosProv.get<ConfigurationOverridesResponse>(`configurationOverrides/${clean}`);
    return res.data?.overrides || [];
  } catch (err: any) {
    if (err?.response?.status === 404) return [];
    throw err;
  }
};

export const useDeviceOverrides = (serialNumber?: string | null) => {
  return useQuery({
    queryKey: ['device-overrides', serialNumber],
    queryFn: () => (serialNumber ? getDeviceOverrides(serialNumber) : []),
    enabled: Boolean(serialNumber),
  });
};

export const useUpdateDeviceOverrides = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { serialNumber: string; overrides: ConfigurationOverride[]; source?: string }) => {
      const clean = normalizeSerial(payload.serialNumber);
      const source = payload.source || 'device';
      const res = await axiosProv.put(`configurationOverrides/${clean}?source=${source}`, {
        serialNumber: clean,
        overrides: payload.overrides,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      const clean = normalizeSerial(variables.serialNumber);
      queryClient.invalidateQueries({ queryKey: ['device-overrides', clean] });
      queryClient.invalidateQueries({ queryKey: ['device-overrides', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['device-computed-config', clean] });
      queryClient.invalidateQueries({ queryKey: ['device-computed-config', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', clean] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['paginated-fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-devices'] });
    },
  });
};

// ----------------------------------------------------------------------
// 8. Device Actions (RPCs to GW & PROV)
// ----------------------------------------------------------------------

export const usePushDeviceConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serialNumber: string) => {
      const clean = normalizeSerial(serialNumber);
      const res = await axiosProv.get(`inventory/${clean}?applyConfiguration=true`);
      return res.data;
    },
    onSuccess: (_, serialNumber) => {
      const clean = normalizeSerial(serialNumber);
      queryClient.invalidateQueries({ queryKey: ['device-commands', clean] });
      queryClient.invalidateQueries({ queryKey: ['device-commands', serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', clean] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['device-computed-config', clean] });
      queryClient.invalidateQueries({ queryKey: ['device-computed-config', serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-fleet-devices'] });
    },
  });
};

export const useRebootDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { serialNumber: string; when?: number }) => {
      const clean = normalizeSerial(payload.serialNumber);
      const res = await axiosMdu.post(`devices/${clean}/reboot`, {
        serialNumber: clean,
        when: payload.when || 0,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      const clean = normalizeSerial(variables.serialNumber);
      queryClient.invalidateQueries({ queryKey: ['device-commands', clean] });
      queryClient.invalidateQueries({ queryKey: ['device-commands', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['device-record', clean] });
      queryClient.invalidateQueries({ queryKey: ['device-record', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', clean] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-fleet-devices'] });
    },
  });
};

export const useBlinkDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { serialNumber: string; pattern?: string; duration?: number }) => {
      const clean = normalizeSerial(payload.serialNumber);
      const res = await axiosMdu.post(`devices/${clean}/leds`, {
        serialNumber: clean,
        when: 0,
        pattern: payload.pattern || 'blink',
        duration: payload.duration || 30,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['device-commands', variables.serialNumber] });
    },
  });
};

export interface WifiScanCommandPayload {
  serialNumber: string;
  dfs?: boolean;
  bandwidth?: string;
  activeScan?: boolean;
  verbose?: boolean;
}

export interface WifiScanResult {
  scan?: Array<{
    bssid?: string;
    ssid?: string;
    channel?: number;
    signal?: number;
    rssi?: number;
    capability?: string;
    meshId?: string;
  }>;
  status?: string;
}

export const useWifiScanDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: WifiScanCommandPayload): Promise<WifiScanResult> => {
      const clean = normalizeSerial(payload.serialNumber);
      const res = await axiosMdu.post(`devices/${clean}/wifiscan`, {
        serialNumber: clean,
        override_dfs: payload.dfs ?? true,
        bandwidth: payload.bandwidth && payload.bandwidth !== '' ? payload.bandwidth : undefined,
        activeScan: payload.activeScan ?? false,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['device-commands', variables.serialNumber] });
    },
  });
};

export const useFactoryResetDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { serialNumber: string; keepRedirector?: boolean }) => {
      const clean = normalizeSerial(payload.serialNumber);
      const res = await axiosMdu.post(`devices/${clean}/factory`, {
        serialNumber: clean,
        keepRedirector: payload.keepRedirector ?? true,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      const clean = normalizeSerial(variables.serialNumber);
      queryClient.invalidateQueries({ queryKey: ['device-commands', clean] });
      queryClient.invalidateQueries({ queryKey: ['device-commands', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', clean] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-fleet-devices'] });
    },
  });
};

export const useConfigureDeviceDirect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { serialNumber: string; configuration: Record<string, unknown> }) => {
      const clean = normalizeSerial(payload.serialNumber);
      const now = Math.floor(Date.now() / 1000);
      const res = await axiosMdu.post(`devices/${clean}/configure`, {
        when: 0,
        UUID: now,
        serialNumber: clean,
        configuration: {
          ...payload.configuration,
          uuid: now,
        },
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      const clean = normalizeSerial(variables.serialNumber);
      queryClient.invalidateQueries({ queryKey: ['device-record', clean] });
      queryClient.invalidateQueries({ queryKey: ['device-record', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['device-commands', clean] });
      queryClient.invalidateQueries({ queryKey: ['device-commands', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', clean] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['device-computed-config', clean] });
      queryClient.invalidateQueries({ queryKey: ['device-computed-config', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-fleet-devices'] });
    },
  });
};

export const useUpdateInventoryTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { serialNumber: string; data: Partial<InventoryTagApiResponse> }) => {
      const clean = normalizeSerial(payload.serialNumber);
      const res = await axiosProv.put(`inventory/${clean}`, payload.data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      const clean = normalizeSerial(variables.serialNumber);
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', clean] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['single-device-detail', clean] });
      queryClient.invalidateQueries({ queryKey: ['single-device-detail', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['paginated-fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['device-computed-config', clean] });
      queryClient.invalidateQueries({ queryKey: ['device-computed-config', variables.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['devices-controller-dashboard'] });
    },
  });
};

export const useDeleteDeviceFromFleet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serialNumber: string) => {
      const clean = normalizeSerial(serialNumber);
      const res = await axiosMdu.delete(`devices/${clean}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-fleet-devices'] });
      queryClient.invalidateQueries({ queryKey: ['devices-controller-dashboard'] });
    },
  });
};

export interface DeviceRttyResponse {
  server: string;
  viewport: number;
  connectionId: string;
}

export const getDeviceRtty = async (serialNumber: string): Promise<DeviceRttyResponse> => {
  const clean = normalizeSerial(serialNumber);
  const res = await axiosMdu.get<DeviceRttyResponse>(`devices/${clean}/rtty`);
  return res.data;
};

export const useDeviceLastStats = (serialNumber?: string | null) => {
  return useQuery({
    queryKey: ['device-last-stats', serialNumber],
    queryFn: async () => {
      if (!serialNumber) return null;
      const clean = normalizeSerial(serialNumber);
      try {
        const res = await axiosMdu.get<{ data?: DeviceStatisticsPayload; raw?: DeviceStatisticsPayload }>(
          `devices/${clean}/statistics?lastOnly=true`,
        );
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: !!serialNumber,
    refetchInterval: 30000,
  });
};

export const useLaunchRttySession = () => {
  return useMutation({
    mutationFn: async (payload: { serialNumber: string }): Promise<DeviceRttyResponse> => {
      const clean = normalizeSerial(payload.serialNumber);
      const res = await axiosMdu.get<DeviceRttyResponse>(`devices/${clean}/rtty`);
      return res.data;
    },
  });
};

// Re-usable Hook Aliases
export const useUnifiedFleetDevices = useFleetDashboard;
export const useDeviceOverview = (serialNumber?: string | null) => {
  return useQuery<UnifiedFleetDevice | null>({
    queryKey: ['single-device-overview', serialNumber],
    queryFn: async () => {
      if (!serialNumber) return null;
      const clean = normalizeSerial(serialNumber);

      const [tagRes, gwRes, statusRes, statsRes] = await Promise.allSettled([
        axiosProv.get<InventoryTagApiResponse>(`inventory/${clean}?withExtendedInfo=true`),
        axiosMdu.get<GatewayDeviceApiResponse>(`devices/${clean}`),
        axiosMdu.get<DeviceWithStatusApiResponse>(`devices/${clean}/status`),
        axiosMdu.get<{ data?: DeviceStatisticsPayload; raw?: DeviceStatisticsPayload }>(
          `devices/${clean}/statistics?lastOnly=true`,
        ),
      ]);

      const tag = tagRes.status === 'fulfilled' ? tagRes.value.data : undefined;
      const gw = gwRes.status === 'fulfilled' ? gwRes.value.data : undefined;
      const status = statusRes.status === 'fulfilled' ? statusRes.value.data : undefined;
      const stats = statsRes.status === 'fulfilled' ? statsRes.value.data : undefined;

      const rejections = [tagRes, gwRes, statusRes, statsRes]
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => r.reason);

      // If any core call returned 401 or 403 authorization error, throw immediately
      const authError = rejections.find(
        (err: any) => err?.response?.status === 401 || err?.response?.status === 403
      );
      if (authError) {
        throw authError;
      }

      // If neither inventory tag nor gateway device nor status record was found, throw the backend error
      if (!tag && !gw && !status) {
        if (rejections.length > 0) {
          throw rejections[0];
        }
        return null;
      }

      let telemetryError: string | undefined;
      if (statusRes.status === 'rejected') {
        const err = statusRes.reason as any;
        telemetryError =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.response?.data?.ErrorDescription ||
          (err?.response?.status ? `HTTP ${err.response.status}: ${err.response.statusText || 'Error fetching status'}` : err?.message);
      }

      const isConnected = Boolean(status?.connected);
      const sanityScore = status?.sanity ?? (isConnected ? 100 : 0);

      const lastContactNum = status?.lastContact
        ? typeof status.lastContact === 'string'
          ? parseInt(status.lastContact, 10)
          : status.lastContact
        : undefined;

      const statsPayload = stats?.raw || stats?.data;

      const resolvedPlatform = normalizePlatformDeviceType(
        gw?.deviceType,
        tag?.devClass,
        status?.deviceType,
        tag?.deviceType || gw?.compatible,
      );
      const resolvedModel = gw?.compatible || tag?.deviceType || '-';
      const resolvedManufacturer = gw?.manufacturer || undefined;

      const unified: UnifiedFleetDevice = {
        serialNumber,
        name: tag?.name || gw?.compatible || serialNumber,
        description: tag?.description,
        model: resolvedModel,
        deviceGroup: tag?.deviceGroup || resolvedPlatform,
        deviceType: tag?.deviceType || resolvedModel,
        manufacturer: resolvedManufacturer,
        devicePassword: gw?.devicePassword || undefined,
        connected: isConnected,
        connectReason: status?.connectReason || undefined,
        sanity: sanityScore,
        ipAddress: status?.ipAddress || '-',
        macAddress: gw?.macAddress || serialNumber,
        locale: gw?.locale || status?.locale || undefined,
        revision: gw?.firmware ? gw.firmware.replace(/^TIP-/, '') : undefined,
        certificateExpiry: gw?.certificateExpiryDate,
        certificateExpiryDate: gw?.certificateExpiryDate,
        certificateIssuerName: status?.certificateIssuerName || undefined,
        createdTimestamp: gw?.createdTimestamp || tag?.created,
        modified: gw?.modified || tag?.modified,
        notes: gw?.notes || [],
        unitLoad: statsPayload?.unit?.load,
        unitUptime: statsPayload?.unit?.uptime || (status?.started ? Math.floor(Date.now() / 1000) - status.started : undefined),
        unitLocaltime: statsPayload?.unit?.localtime,
        unitMemoryTotal: statsPayload?.unit?.memory?.total,
        unitMemoryFree: statsPayload?.unit?.memory?.free,
        memoryUsedPct: status?.memoryUsed,
        load: status?.load,
        temperature: status?.temperature,
        firmware: gw?.firmware || status?.firmware || '-',
        uptimeSeconds: status?.started ? Math.floor(Date.now() / 1000) - status.started : undefined,
        lastContact: lastContactNum,
        lastContactTimestamp: lastContactNum,
        lastContactText: formatRelativeTime(lastContactNum),
        entityId: tag?.entity,
        entityName: tag?.extendedInfo?.entity?.name,
        venueId: tag?.venue,
        venueName: tag?.extendedInfo?.venue?.name,
        subscriberId: tag?.subscriber,
        subscriberEmail: tag?.extendedInfo?.subscriber?.email,
        configId: tag?.deviceConfiguration,
        configName: tag?.extendedInfo?.deviceConfiguration?.name,
        configuration: (tag?.extendedInfo?.deviceConfiguration as any)?.configuration || undefined,
        blacklisted: Boolean(status?.blackListed || gw?.blackListed),
        simulated: Boolean(status?.simulated || gw?.simulated),
        restricted: Boolean(status?.restrictedDevice || gw?.restrictedDevice),
        associationsTotal:
          (status?.associations_2G || 0) + (status?.associations_5G || 0) + (status?.associations_6G || 0),
        associations_2G: status?.associations_2G || 0,
        associations_5G: status?.associations_5G || 0,
        associations_6G: status?.associations_6G || 0,
        rxBytes: status?.rxBytes || 0,
        txBytes: status?.txBytes || 0,
        lastStats: stats ? { raw: stats.raw || stats.data } : undefined,
        provTag: tag,
        gwDevice: gw,
        rawStatus: status,
        telemetryError,
      };

      return unified;
    },
    enabled: !!serialNumber,
    refetchInterval: 15000,
  });
};
export const useDeviceComputedConfiguration = useComputedConfig;
export const useAddDeviceToBlacklist = useCreateBlacklistDevice;
export const useRemoveDeviceFromBlacklist = useDeleteBlacklistDevice;
export const useBlinkDeviceLeds = useBlinkDevice;
export const useUpdateDeviceTag = () => {
  const mutation = useUpdateInventoryTag();
  return {
    ...mutation,
    mutateAsync: (args: {
      serialNumber: string;
      payload?: Partial<InventoryTagApiResponse>;
      data?: Partial<InventoryTagApiResponse>;
    }) =>
      mutation.mutateAsync({
        serialNumber: args.serialNumber,
        data: args.payload || args.data || {},
      }),
  };
};

export const getMacOuis = async (macList: string[]) => {

  if (!macList || macList.length === 0) return {};
  const res = await axiosGw.get<{ tagList: Array<{ tag: string; value: string }> }>(
    `/ouis?macList=${macList.join(',')}`,
  );
  const map: Record<string, string> = {};
  for (const item of res.data?.tagList || []) {
    map[item.tag.toLowerCase()] = item.value;
  }
  return map;
};

// ----------------------------------------------------------------------
// 8. Device Record & Notes via MDU (with RBAC)
// ----------------------------------------------------------------------

export interface DeviceRecordResponse {
  serialNumber: string;
  deviceType?: string;
  macAddress?: string;
  manufacturer?: string;
  notes?: DeviceNote[];
  [key: string]: unknown;
}

export const getDeviceRecord = async (serialNumber: string): Promise<DeviceRecordResponse> => {
  const clean = normalizeSerial(serialNumber);
  const res = await axiosMdu.get<DeviceRecordResponse>(`devices/${clean}`);
  return res.data;
};

export const useDeviceRecord = (serialNumber?: string | null) => {
  return useQuery({
    queryKey: ['device-record', serialNumber],
    queryFn: () => (serialNumber ? getDeviceRecord(serialNumber) : null),
    enabled: Boolean(serialNumber),
    staleTime: 15000,
  });
};

export const addDeviceNote = async (
  serialNumber: string,
  noteText: string,
): Promise<DeviceRecordResponse> => {
  const clean = normalizeSerial(serialNumber);
  const trimmed = noteText.trim();
  const res = await axiosMdu.put<DeviceRecordResponse>(`devices/${clean}`, {
    serialNumber: clean,
    notes: [{ note: trimmed, created: 0 }],
  });
  return res.data;
};

// ----------------------------------------------------------------------
// 9. Full OpenWiFi Device Commands (proxied via MDU with RBAC)
// ----------------------------------------------------------------------

export const useUpgradeFirmware = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      serialNumber,
      uri,
      keepRedirector = true,
    }: {
      serialNumber: string;
      uri: string;
      keepRedirector?: boolean;
    }) => {
      const clean = normalizeSerial(serialNumber);
      const { data } = await axiosMdu.post(`devices/${clean}/upgrade`, {
        serialNumber: clean,
        when: 0,
        keepRedirector,
        uri,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['device-commands', variables.serialNumber] });
    },
  });
};

export const useGetEventQueue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      serialNumber,
      types = ['dhcp-snooping', 'wifi-frames'],
    }: {
      serialNumber: string;
      types?: string[];
    }) => {
      const clean = normalizeSerial(serialNumber);
      const { data } = await axiosMdu.post(`devices/${clean}/eventqueue`, {
        serialNumber: clean,
        types,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['device-commands', variables.serialNumber] });
    },
  });
};

export const useTraceDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      serialNumber,
      type = 'duration',
      network = 'up',
      duration = 20,
      packets = 100,
    }: {
      serialNumber: string;
      type?: 'duration' | 'packets';
      network?: 'up' | 'down';
      duration?: number;
      packets?: number;
    }) => {
      const clean = normalizeSerial(serialNumber);
      const payload: Record<string, unknown> = {
        serialNumber: clean,
        network,
        when: 0,
      };
      if (type === 'duration') payload.duration = duration;
      if (type === 'packets') payload.packets = packets;
      const { data } = await axiosMdu.post(`devices/${clean}/trace`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['device-commands', variables.serialNumber] });
    },
  });
};

export const useReEnrollDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serialNumber: string) => {
      const clean = normalizeSerial(serialNumber);
      const { data } = await axiosMdu.post(`devices/${clean}/reenroll`, {
        serialNumber: clean,
        when: 0,
      });
      return data;
    },
    onSuccess: (_, serialNumber) => {
      queryClient.invalidateQueries({ queryKey: ['device-commands', serialNumber] });
    },
  });
};

export const useExecuteScript = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      serialNumber,
      script,
      type = 'shell',
    }: {
      serialNumber: string;
      script: string;
      type?: string;
    }) => {
      const clean = normalizeSerial(serialNumber);
      const { data } = await axiosMdu.post(`devices/${clean}/script`, {
        serialNumber: clean,
        type,
        script,
        when: 0,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['device-commands', variables.serialNumber] });
    },
  });
};

export const useStartTelemetry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      serialNumber,
      interval = 3,
      lifetime = 300,
      types = ['wifi-frames', 'dhcp-snooping', 'state'],
    }: {
      serialNumber: string;
      interval?: number;
      lifetime?: number;
      types?: string[];
    }) => {
      const clean = normalizeSerial(serialNumber);
      const { data } = await axiosMdu.post(`devices/${clean}/telemetry`, {
        serialNumber: clean,
        interval,
        lifetime,
        types,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['device-commands', variables.serialNumber] });
    },
  });
};

export interface DeviceTypeInfoResponse {
  deviceTypes?: string[];
  deviceClasses?: string[];
  deviceTypesByClass?: Record<string, string[]>;
}

export const getDeviceTypeInfo = async (): Promise<DeviceTypeInfoResponse | null> => {
  try {
    const res = await axiosFms.get<DeviceTypeInfoResponse>('firmwares?deviceSet=true');
    return res.data;
  } catch (err) {
    console.warn('Failed to fetch device type info from FMS:', err);
    return null;
  }
};

export const useGetDeviceTypeInfo = () => {
  return useQuery({
    queryKey: ['get-device-type-info'],
    queryFn: getDeviceTypeInfo,
    staleTime: Infinity,
  });
};



