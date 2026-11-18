export interface DeviceCommandResponse {
  status?: string;
  errorCode?: number | string;
  ErrorCode?: number | string;
  errorText?: string;
  ErrorText?: string;
  ErrorDescription?: string;
  UUID?: string | number;
}

export type DeviceCommandOutcome = 'pending' | 'completed' | 'dispatched';

export const getDeviceCommandOutcome = (value: unknown): DeviceCommandOutcome => {
  const response = (value || {}) as DeviceCommandResponse;
  const status = response.status?.trim().toLowerCase();
  if (status === 'pending' || status === 'queued') return 'pending';
  if (status === 'completed' || status === 'complete' || status === 'success') return 'completed';
  return 'dispatched';
};

export const assertDeviceCommandSucceeded = (value: unknown): void => {
  const response = (value || {}) as DeviceCommandResponse;
  const errorCode = response.errorCode ?? response.ErrorCode;
  const failed = response.status?.trim().toLowerCase() === 'failed';
  if ((errorCode !== undefined && Number(errorCode) !== 0) || failed) {
    throw new Error(
      response.errorText ||
        response.ErrorText ||
        response.ErrorDescription ||
        'The device command failed'
    );
  }
};

export const getDeviceCommandSuccessTitle = (action: string, value: unknown): string => {
  switch (getDeviceCommandOutcome(value)) {
    case 'pending':
      return `${action} Queued`;
    case 'completed':
      return `${action} Completed`;
    default:
      return `${action} Dispatched`;
  }
};

export const getDeviceCommandResultPayload = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value;
  const response = value as { results?: unknown };
  if (!response.results || typeof response.results !== 'object') {
    return response.results ?? value;
  }
  const results = response.results as { status?: unknown };
  return results.status ?? response.results;
};
