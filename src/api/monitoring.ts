import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosMdu } from './client';

export interface AnalyticsBoardDevice {
  serialNumber: string;
  connected: boolean;
  deviceType: string;
  health: number;
  memory: number;
  uptime: number;
  lastContact: number;
  associations_2g: number;
  associations_5g: number;
  associations_6g: number;
  lastFirmware?: string;
  connectionIp?: string;
}

export interface VenueMonitoringSummary {
  connectedDevices: number;
  disconnectedDevices: number;
  totalDevices: number;
  avgHealth: number;
  avgMemoryUsed: number;
  twoGAssociations: number;
  fiveGAssociations: number;
  sixGAssociations: number;
  totalAssociations: number;
}

export interface VenueMonitoringResponse {
  active: boolean;
  venueId: string;
  boardId?: string;
  interval?: number;
  retention?: number;
  summary?: VenueMonitoringSummary;
  devices?: AnalyticsBoardDevice[];
}

export interface StartVenueMonitoringRequest {
  name?: string;
  interval?: number;
  retention?: number;
  monitorSubVenues?: boolean;
}

export interface ClientLifecycleEntry {
  timestamp: number;
  rssi?: number;
  noise?: number;
  rx_bytes?: number;
  tx_bytes?: number;
  rx_bitrate?: number;
  tx_bitrate?: number;
  bssid?: string;
  ssid?: string;
  ipv4?: string;
  ipv6?: string;
  channel?: number;
  connected?: number;
  station_id?: string;
  [key: string]: unknown;
}

export const useVenueMonitoring = (venueId?: string) =>
  useQuery({
    queryKey: ['venue-monitoring', venueId],
    queryFn: async () => {
      const { data } = await axiosMdu.get<VenueMonitoringResponse>(
        `venues/${encodeURIComponent(venueId!)}/monitoring`
      );
      return data;
    },
    enabled: Boolean(venueId),
    refetchInterval: (query) => (query.state.data?.active ? 15_000 : false),
  });

export const useStartVenueMonitoring = (venueId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: StartVenueMonitoringRequest) => {
      const { data } = await axiosMdu.post<VenueMonitoringResponse>(
        `venues/${encodeURIComponent(venueId)}/monitoring`,
        req
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-monitoring', venueId] });
      queryClient.invalidateQueries({ queryKey: ['scope-details'] });
    },
  });
};

export const useStopVenueMonitoring = (venueId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosMdu.delete<VenueMonitoringResponse>(
        `venues/${encodeURIComponent(venueId)}/monitoring`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-monitoring', venueId] });
      queryClient.invalidateQueries({ queryKey: ['scope-details'] });
    },
  });
};

export const useVenueMonitoringClients = (venueId?: string, enabled = true) =>
  useQuery({
    queryKey: ['venue-monitoring-clients', venueId],
    queryFn: async () => {
      const { data } = await axiosMdu.get<{ entries: string[] }>(
        `venues/${encodeURIComponent(venueId!)}/monitoring/clients`
      );
      return data.entries || [];
    },
    enabled: Boolean(venueId && enabled),
    staleTime: 60_000,
  });

export const useVenueClientLifecycle = (
  venueId?: string,
  clientMac?: string,
  options?: { fromDate?: number; endDate?: number; limit?: number; offset?: number }
) =>
  useQuery({
    queryKey: ['venue-client-lifecycle', venueId, clientMac, options],
    queryFn: async () => {
      const { data } = await axiosMdu.get<{ entries: ClientLifecycleEntry[] }>(
        `venues/${encodeURIComponent(venueId!)}/monitoring/clients/${encodeURIComponent(clientMac!)}`,
        { params: options }
      );
      return data.entries || [];
    },
    enabled: Boolean(venueId && clientMac),
  });
