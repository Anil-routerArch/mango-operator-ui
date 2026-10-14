import React from 'react';
import { SimpleGrid, VStack } from '@chakra-ui/react';
import { GeneralInfoCard } from '../GeneralInfoCard';
import { METRICS_SUBSECTIONS_OPTIONS } from './metricsConstants';
import { DhcpSnooping } from './DhcpSnooping';
import { Health } from './Health';
import { Statistics } from './Statistics';
import { Realtime } from './Realtime';
import { WifiScan } from './WifiScan';
import { WifiFrames } from './WifiFrames';
import { Telemetry } from './Telemetry';
import type { MetricsSectionData } from '../types';

export interface MetricsSectionProps {
  data: MetricsSectionData;
  onChange: (data: MetricsSectionData) => void;
  onDeleteSection: () => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

export const MetricsSection: React.FC<MetricsSectionProps> = ({
  data,
  onChange,
  onDeleteSection,
  disabled = false,
  isDefaultConfig = false,
}) => {
  const activeSubs = data.activeSubsections || [];

  const handleSubsectionsChange = (newSubs: string[]) => {
    onChange({
      ...data,
      activeSubsections: newSubs,
    });
  };

  return (
    <VStack gap={4} align="stretch">
      {/* Top Row: General Information & DhcpSnooping if active */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} alignItems="start">
        <GeneralInfoCard
          meta={data.meta}
          onChange={(meta) => onChange({ ...data, meta })}
          onDeleteSection={onDeleteSection}
          subsectionsOptions={METRICS_SUBSECTIONS_OPTIONS}
          activeSubsections={activeSubs}
          onSubsectionsChange={handleSubsectionsChange}
          disabled={disabled}
          isDefaultConfig={isDefaultConfig}
        />

        {activeSubs.includes('dhcp-snooping') && (
          <DhcpSnooping data={data} onChange={onChange} disabled={disabled} />
        )}
      </SimpleGrid>

      {/* Grid of Other Active Metrics Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} alignItems="start">
        {activeSubs.includes('health') && (
          <Health data={data} onChange={onChange} disabled={disabled} />
        )}
        {activeSubs.includes('statistics') && (
          <Statistics data={data} onChange={onChange} disabled={disabled} />
        )}
        {activeSubs.includes('realtime') && (
          <Realtime data={data} onChange={onChange} disabled={disabled} />
        )}
        {activeSubs.includes('wifi-scan') && (
          <WifiScan data={data} onChange={onChange} disabled={disabled} />
        )}
        {activeSubs.includes('wifi-frames') && (
          <WifiFrames data={data} onChange={onChange} disabled={disabled} />
        )}
        {activeSubs.includes('telemetry') && (
          <Telemetry data={data} onChange={onChange} disabled={disabled} />
        )}
      </SimpleGrid>
    </VStack>
  );
};

