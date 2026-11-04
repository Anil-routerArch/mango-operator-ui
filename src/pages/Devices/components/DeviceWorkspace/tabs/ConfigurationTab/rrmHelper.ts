/**
 * RRM (Radio Resource Management) helper utilities for OWPROV integration.
 *
 * OWPROV Backend Contract:
 * - Valid values for `deviceRules.rrm` are strictly:
 *   1. "inherit"
 *   2. "no"
 *   3. A valid serialized JSON string representing `ProvObjects::RRMDetails` with
 *      `vendor`, `schedule` (valid 5-part cron expression), and `algorithms` array.
 * - Legacy UI values ("yes", "on", "off") are rejected with HTTP 400 Bad Request: InvalidRRM.
 */

export interface RrmAlgorithm {
  name: string;
  parameters?: string;
}

export interface RrmDetailsPayload {
  vendor: string;
  schedule: string;
  algorithms: RrmAlgorithm[];
}

export type RrmMode = 'inherit' | 'enabled' | 'no';

export const DEFAULT_RRM_SCHEDULE = '*/10 * * * *';
export const DEFAULT_RRM_VENDOR = 'telecominfraproject';

export const DEFAULT_RRM_PAYLOAD: RrmDetailsPayload = {
  vendor: DEFAULT_RRM_VENDOR,
  schedule: DEFAULT_RRM_SCHEDULE,
  algorithms: [],
};

/**
 * Validates whether a cron string has 5 whitespace-separated fields.
 */
export function isValidCronSchedule(cron: string): boolean {
  if (!cron || typeof cron !== 'string') return false;
  const parts = cron.trim().split(/\s+/);
  return parts.length === 5 && parts.every((p) => p.length > 0);
}

/**
 * Checks whether an incoming value represents a structured RRM configuration.
 */
export function isStructuredRrm(val: unknown): boolean {
  if (!val) return false;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    return typeof obj.vendor === 'string' || typeof obj.schedule === 'string' || Array.isArray(obj.algorithms);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return typeof parsed === 'object' && parsed !== null;
      } catch {
        return false;
      }
    }
  }
  return false;
}

/**
 * Parses raw RRM values into normalized mode, structured payload, and raw JSON string.
 * Preserves existing structured configurations instead of resetting them.
 */
export function parseRrmValue(raw: unknown): {
  mode: RrmMode;
  payload: RrmDetailsPayload;
  rawJson: string;
} {
  const defaultJson = JSON.stringify(DEFAULT_RRM_PAYLOAD, null, 2);

  if (!raw || raw === 'inherit') {
    return { mode: 'inherit', payload: DEFAULT_RRM_PAYLOAD, rawJson: defaultJson };
  }
  if (raw === 'no' || raw === 'off') {
    return { mode: 'no', payload: DEFAULT_RRM_PAYLOAD, rawJson: defaultJson };
  }
  // Legacy UI values ('yes', 'on') converted to valid enabled payload
  if (raw === 'yes' || raw === 'on') {
    return { mode: 'enabled', payload: DEFAULT_RRM_PAYLOAD, rawJson: defaultJson };
  }

  // Structured Object
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as any;
    const payload: RrmDetailsPayload = {
      vendor: typeof obj.vendor === 'string' && obj.vendor.trim() ? obj.vendor.trim() : DEFAULT_RRM_VENDOR,
      schedule:
        typeof obj.schedule === 'string' && isValidCronSchedule(obj.schedule)
          ? obj.schedule.trim()
          : DEFAULT_RRM_SCHEDULE,
      algorithms: Array.isArray(obj.algorithms) ? obj.algorithms : [],
    };
    return {
      mode: 'enabled',
      payload,
      rawJson: JSON.stringify(payload, null, 2),
    };
  }

  // Serialized JSON string
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'object' && parsed !== null) {
          const payload: RrmDetailsPayload = {
            vendor:
              typeof parsed.vendor === 'string' && parsed.vendor.trim()
                ? parsed.vendor.trim()
                : DEFAULT_RRM_VENDOR,
            schedule:
              typeof parsed.schedule === 'string' && isValidCronSchedule(parsed.schedule)
                ? parsed.schedule.trim()
                : DEFAULT_RRM_SCHEDULE,
            algorithms: Array.isArray(parsed.algorithms) ? parsed.algorithms : [],
          };
          return {
            mode: 'enabled',
            payload,
            rawJson: JSON.stringify(parsed, null, 2),
          };
        }
      } catch {
        // Fall back to inherit
      }
    }
  }

  return { mode: 'inherit', payload: DEFAULT_RRM_PAYLOAD, rawJson: defaultJson };
}

/**
 * Serializes RRM settings strictly complying with OWPROV `ValidRRM` validation:
 * - 'inherit' -> "inherit"
 * - 'no' -> "no"
 * - 'enabled' -> serialized JSON string containing vendor, schedule, and algorithms
 */
export function serializeRrmForSubmission(
  mode: RrmMode,
  customPayload?: RrmDetailsPayload,
  rawJson?: string
): string {
  if (mode === 'inherit') return 'inherit';
  if (mode === 'no') return 'no';

  // Mode is 'enabled'
  if (rawJson && rawJson.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawJson);
      if (typeof parsed === 'object' && parsed !== null) {
        if (!parsed.vendor || typeof parsed.vendor !== 'string') {
          parsed.vendor = DEFAULT_RRM_VENDOR;
        }
        if (!parsed.schedule || !isValidCronSchedule(parsed.schedule)) {
          parsed.schedule = DEFAULT_RRM_SCHEDULE;
        }
        if (!Array.isArray(parsed.algorithms)) {
          parsed.algorithms = [];
        }
        return JSON.stringify(parsed);
      }
    } catch {
      // Fallback below
    }
  }

  if (customPayload) {
    return JSON.stringify({
      vendor: customPayload.vendor || DEFAULT_RRM_VENDOR,
      schedule: isValidCronSchedule(customPayload.schedule) ? customPayload.schedule : DEFAULT_RRM_SCHEDULE,
      algorithms: Array.isArray(customPayload.algorithms) ? customPayload.algorithms : [],
    });
  }

  return JSON.stringify(DEFAULT_RRM_PAYLOAD);
}

/**
 * Normalizes any incoming RRM value into a string guaranteed to be accepted by OWPROV.
 */
export function normalizeRrmForSubmission(raw: unknown): string {
  const { mode, payload, rawJson } = parseRrmValue(raw);
  return serializeRrmForSubmission(mode, payload, rawJson);
}
