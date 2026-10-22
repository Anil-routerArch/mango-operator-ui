import React from 'react';
import { SimpleGrid, VStack } from '@chakra-ui/react';
import { GeneralInfoCard } from '../GeneralInfoCard';
import { SERVICES_OPTIONS } from './servicesConstants';
import { AirtimePolicies } from './AirtimePolicies';
import { DataPlane } from './DataPlane';
import { FacebookWifi } from './FacebookWifi';
import { Fingerprint } from './Fingerprint';
import { DhcpRelay } from './DhcpRelay';
import { Gps } from './Gps';
import { Http } from './Http';
import { Ieee8021x } from './Ieee8021x';
import { Igmp } from './Igmp';
import { Lldp } from './Lldp';
import { Log } from './Log';
import { Mdns } from './Mdns';
import { Ntp } from './Ntp';
import { OnlineCheck } from './OnlineCheck';
import { OpenFlow } from './OpenFlow';
import { QualityOfService } from './QualityOfService';
import { RadiusProxy } from './RadiusProxy';
import { Rtty } from './Rtty';
import { Ssh } from './Ssh';
import { WifiSteering } from './WifiSteering';
import type { ServicesSectionData } from '../types';

export interface ServicesSectionProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  onDeleteSection: () => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  data,
  onChange,
  onDeleteSection,
  disabled = false,
  isDefaultConfig = false,
}) => {
  const activeSubs = data.activeSubsections || [];

  const servicesOptions = React.useMemo(() => {
    if (!isDefaultConfig) return SERVICES_OPTIONS;
    return SERVICES_OPTIONS.map((opt) => {
      if (opt.value === 'open-flow') {
        return {
          ...opt,
          disabled: true,
          disabledReason: 'open-flow is not supported by OpenWiFi Gateway (OWGW) uCentral schema',
        };
      }
      if (opt.value === 'airtime-policies') {
        return {
          ...opt,
          disabled: true,
          disabledReason: 'airtime-policies is not supported by OpenWiFi Gateway (OWGW) uCentral schema (OWGW requires airtime-fairness)',
        };
      }
      return opt;
    });
  }, [isDefaultConfig]);

  const handleSubsectionsChange = (newSubs: string[]) => {
    onChange({
      ...data,
      activeSubsections: newSubs,
    });
  };

  return (
    <VStack gap={4} align="stretch">
      {/* Top Row: General Information & Subsection Picker */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} alignItems="start">
        <GeneralInfoCard
          meta={data.meta}
          onChange={(meta) => onChange({ ...data, meta })}
          onDeleteSection={onDeleteSection}
          subsectionsOptions={servicesOptions}
          activeSubsections={activeSubs}
          onSubsectionsChange={handleSubsectionsChange}
          disabled={disabled}
          isDefaultConfig={isDefaultConfig}
        />

        {/* If LLDP is active, show it next to General */}
        {activeSubs.includes('lldp') && (
          <Lldp data={data} onChange={onChange} disabled={disabled} />
        )}
      </SimpleGrid>

      {/* Grid of Other Active Services Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} alignItems="start">
        {activeSubs.includes('ssh') && <Ssh data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('ntp') && <Ntp data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('http') && <Http data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('mdns') && <Mdns data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('rtty') && <Rtty data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('log') && <Log data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('igmp') && <Igmp data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('gps') && <Gps data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('online-check') && <OnlineCheck data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('open-flow') && <OpenFlow data={data} onChange={onChange} disabled={disabled} isDefaultConfig={isDefaultConfig} />}
        {activeSubs.includes('wifi-steering') && <WifiSteering data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('quality-of-service') && <QualityOfService data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('facebook-wifi') && <FacebookWifi data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('airtime-policies') && <AirtimePolicies data={data} onChange={onChange} disabled={disabled} isDefaultConfig={isDefaultConfig} />}
        {activeSubs.includes('data-plane') && <DataPlane data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('ieee8021x') && <Ieee8021x data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('radius-proxy') && <RadiusProxy data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('dhcp-relay') && <DhcpRelay data={data} onChange={onChange} disabled={disabled} />}
        {activeSubs.includes('fingerprint') && <Fingerprint data={data} onChange={onChange} disabled={disabled} />}
      </SimpleGrid>
    </VStack>
  );
};

