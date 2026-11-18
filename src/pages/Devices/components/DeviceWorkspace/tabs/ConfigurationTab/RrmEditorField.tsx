import React, { useState, useEffect, useMemo } from 'react';
import { Box, Flex, Text, Button, Input } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import type { RrmMode, RrmDetailsPayload } from './rrmHelper';
import {
  DEFAULT_RRM_PAYLOAD,
  DEFAULT_RRM_SCHEDULE,
  DEFAULT_RRM_VENDOR,
  parseRrmValue,
  serializeRrmForSubmission,
  isValidCronSchedule,
} from './rrmHelper';

export interface RrmEditorFieldProps {
  value: string;
  onChange: (serializedValue: string) => void;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  selectStyle?: React.CSSProperties;
}

export const RrmEditorField: React.FC<RrmEditorFieldProps> = ({
  value,
  onChange,
  required = false,
  label = 'RRM',
  disabled = false,
  selectStyle,
}) => {
  // Parse incoming value into mode and payload
  const parsed = useMemo(() => parseRrmValue(value), [value]);

  const [mode, setMode] = useState<RrmMode>(parsed.mode);
  const [cachedPayload, setCachedPayload] = useState<RrmDetailsPayload>(parsed.payload);
  const [cachedRawJson, setCachedRawJson] = useState<string>(parsed.rawJson);

  // Keep internal state aligned when parent value changes
  useEffect(() => {
    setMode(parsed.mode);
    setCachedPayload(parsed.payload);
    setCachedRawJson(parsed.rawJson);
  }, [parsed]);

  // Modal state for configuring enabled RRM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'form' | 'json'>('form');
  const [modalVendor, setModalVendor] = useState(cachedPayload.vendor);
  const [modalSchedule, setModalSchedule] = useState(cachedPayload.schedule);
  const [modalJsonText, setModalJsonText] = useState(cachedRawJson);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleModeChange = (newMode: RrmMode) => {
    setMode(newMode);
    if (newMode === 'inherit') {
      onChange('inherit');
    } else if (newMode === 'no') {
      onChange('no');
    } else {
      // Enabled
      const serialized = serializeRrmForSubmission('enabled', cachedPayload, cachedRawJson);
      onChange(serialized);
    }
  };

  const openConfigModal = () => {
    setModalVendor(cachedPayload.vendor || DEFAULT_RRM_VENDOR);
    setModalSchedule(cachedPayload.schedule || DEFAULT_RRM_SCHEDULE);
    setModalJsonText(cachedRawJson || JSON.stringify(DEFAULT_RRM_PAYLOAD, null, 2));
    setModalError(null);
    setModalTab('form');
    setIsModalOpen(true);
  };

  const handleApplyModal = () => {
    setModalError(null);
    if (modalTab === 'form') {
      if (!isValidCronSchedule(modalSchedule)) {
        setModalError('Schedule must be a valid 5-part cron expression (e.g. "*/10 * * * *")');
        return;
      }
      const updatedPayload: RrmDetailsPayload = {
        vendor: modalVendor.trim() || DEFAULT_RRM_VENDOR,
        schedule: modalSchedule.trim(),
        algorithms: cachedPayload.algorithms || [],
      };
      const newJson = JSON.stringify(updatedPayload, null, 2);
      setCachedPayload(updatedPayload);
      setCachedRawJson(newJson);
      const serialized = serializeRrmForSubmission('enabled', updatedPayload, newJson);
      onChange(serialized);
    } else {
      // JSON mode
      try {
        const parsedJson = JSON.parse(modalJsonText);
        if (typeof parsedJson !== 'object' || parsedJson === null) {
          throw new Error('RRM configuration must be a valid JSON object');
        }
        if (!parsedJson.schedule || !isValidCronSchedule(parsedJson.schedule)) {
          throw new Error('Schedule must be a valid 5-part cron expression (e.g. "*/10 * * * *")');
        }
        const updatedPayload: RrmDetailsPayload = {
          vendor: typeof parsedJson.vendor === 'string' ? parsedJson.vendor : DEFAULT_RRM_VENDOR,
          schedule: parsedJson.schedule,
          algorithms: Array.isArray(parsedJson.algorithms) ? parsedJson.algorithms : [],
        };
        setCachedPayload(updatedPayload);
        setCachedRawJson(modalJsonText);
        const serialized = serializeRrmForSubmission('enabled', updatedPayload, modalJsonText);
        onChange(serialized);
      } catch (err: any) {
        setModalError(err.message || 'Invalid JSON format');
        return;
      }
    }
    setIsModalOpen(false);
  };

  const defaultSelectStyle: React.CSSProperties = {
    width: '100%',
    height: '36px',
    paddingLeft: '10px',
    paddingRight: '10px',
    borderRadius: '6px',
    border: `1px solid ${themeColors.input.border}`,
    fontSize: '13px',
    backgroundColor: '#ffffff',
    color: themeColors.text.primary,
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...selectStyle,
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={1}>
        <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </Text>
        {mode === 'enabled' && (
          <Button
            size="xs"
            variant="ghost"
            h="20px"
            px={1.5}
            fontSize="11px"
            color="#0d9488"
            fontWeight="600"
            onClick={openConfigModal}
            disabled={disabled}
            _hover={{ bg: '#f0fdfa' }}
            title="Configure RRM Details"
          >
            <Icon name="sliders" size={12} />
            <Text as="span" ml={1}>
              Configure
            </Text>
          </Button>
        )}
      </Flex>

      <select
        value={mode}
        onChange={(e) => handleModeChange(e.target.value as RrmMode)}
        style={defaultSelectStyle}
        disabled={disabled}
      >
        <option value="inherit">Inherit</option>
        <option value="enabled">Enabled</option>
        <option value="no">Disabled (No)</option>
      </select>

      {mode === 'enabled' && (
        <Flex align="center" gap={1.5} mt={1.5} px={1}>
          <Box w="6px" h="6px" borderRadius="full" bg="#0d9488" />
          <Text
            fontSize="11px"
            color={themeColors.text.muted}
            truncate
            title={`${cachedPayload.vendor} (${cachedPayload.schedule})`}
          >
            {cachedPayload.vendor} &bull; {cachedPayload.schedule}
          </Text>
        </Flex>
      )}

      {/* RRM Configuration Modal */}
      {isModalOpen && (
        <Box
          position="fixed"
          inset="0"
          bg="rgba(5, 12, 23, 0.54)"
          display="grid"
          placeItems="center"
          zIndex="1400"
          p={4}
          onClick={() => setIsModalOpen(false)}
        >
          <Box
            w="min(500px, 95vw)"
            bg="#ffffff"
            borderRadius="8px"
            boxShadow="0 20px 50px rgba(0,0,0,0.25)"
            overflow="hidden"
            border="1px solid"
            borderColor={themeColors.panel.border}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <Flex
              px={5}
              py={3.5}
              borderBottom="1px solid"
              borderColor={themeColors.panel.divider}
              justify="space-between"
              align="center"
              bg="#f8fafc"
            >
              <Box>
                <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                  Configure RRM
                </Text>
                <Text fontSize="12px" color={themeColors.text.muted}>
                  Radio Resource Management provider & execution schedule
                </Text>
              </Box>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                w="26px"
                h="26px"
                p={0}
                aria-label="Close"
              >
                <Icon name="x" size={16} />
              </Button>
            </Flex>

            {/* Tab switch */}
            <Flex borderBottom="1px solid #e2e8f0" px={5} pt={2} gap={4}>
              <Button
                size="xs"
                variant="ghost"
                pb={2}
                borderRadius="0"
                borderBottom={modalTab === 'form' ? '2px solid #0d9488' : 'none'}
                color={modalTab === 'form' ? '#0d9488' : themeColors.text.muted}
                fontWeight="600"
                onClick={() => setModalTab('form')}
              >
                Settings Form
              </Button>
              <Button
                size="xs"
                variant="ghost"
                pb={2}
                borderRadius="0"
                borderBottom={modalTab === 'json' ? '2px solid #0d9488' : 'none'}
                color={modalTab === 'json' ? '#0d9488' : themeColors.text.muted}
                fontWeight="600"
                onClick={() => setModalTab('json')}
              >
                Raw JSON
              </Button>
            </Flex>

            {/* Body */}
            <Box p={5}>
              {modalError && (
                <Box mb={4} p={2.5} bg="#fef2f2" border="1px solid #fecaca" borderRadius="6px">
                  <Text fontSize="12px" color="#dc2626" fontWeight="500">
                    {modalError}
                  </Text>
                </Box>
              )}

              {modalTab === 'form' ? (
                <Flex direction="column" gap={4}>
                  <Box>
                    <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                      Vendor Provider <span style={{ color: '#ef4444' }}>*</span>
                    </Text>
                    <Input
                      value={modalVendor}
                      onChange={(e) => setModalVendor(e.target.value)}
                      placeholder="e.g. telecominfraproject"
                      fontSize="13px"
                      h="36px"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                      Cron Schedule <span style={{ color: '#ef4444' }}>*</span>
                    </Text>
                    <Input
                      value={modalSchedule}
                      onChange={(e) => setModalSchedule(e.target.value)}
                      placeholder="*/10 * * * *"
                      fontSize="13px"
                      h="36px"
                      fontFamily="monospace"
                    />
                    <Text fontSize="11px" color={themeColors.text.muted} mt={1}>
                      Standard 5-part cron schedule (e.g. <code>*/10 * * * *</code> or <code>0 0 * * *</code>).
                    </Text>
                  </Box>

                  <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid #e2e8f0">
                    <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary}>
                      Algorithms Configured: {cachedPayload.algorithms?.length || 0}
                    </Text>
                    <Text fontSize="11px" color={themeColors.text.muted} mt={0.5}>
                      Switch to "Raw JSON" to inspect or edit custom algorithm parameters.
                    </Text>
                  </Box>
                </Flex>
              ) : (
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                    RRM JSON Payload <span style={{ color: '#ef4444' }}>*</span>
                  </Text>
                  <textarea
                    value={modalJsonText}
                    onChange={(e) => setModalJsonText(e.target.value)}
                    rows={8}
                    style={{
                      width: '100%',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      padding: '10px',
                      borderRadius: '6px',
                      border: `1px solid ${themeColors.input.border}`,
                      outline: 'none',
                    }}
                  />
                  <Text fontSize="11px" color={themeColors.text.muted} mt={1}>
                    Must conform to OWPROV <code>ProvObjects::RRMDetails</code> schema.
                  </Text>
                </Box>
              )}
            </Box>

            {/* Footer */}
            <Flex
              px={5}
              py={3.5}
              bg="#f8fafc"
              borderTop="1px solid"
              borderColor={themeColors.panel.divider}
              justify="flex-end"
              gap={3}
            >
              <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" bg="#0d9488" color="#ffffff" _hover={{ bg: '#0f766e' }} onClick={handleApplyModal}>
                Apply
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};
