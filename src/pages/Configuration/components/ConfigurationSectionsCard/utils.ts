import type {
  ConfigurationSectionsState,
  SubsectionKey,
  SectionMeta,
  SingleRadioConfigItem,
  SingleSsidConfigItem,
  InterfaceEthernetItem,
} from './types';

export const getInitialSectionsState = (): ConfigurationSectionsState => ({
  activeSections: [],
  globals: {
    meta: { name: 'Globals', description: 'Global networking configuration', weight: 1 },
    ipv4Network: '192.168.1.0/24',
    ipv6Network: 'fd00::/64',
  },
  unit: {
    meta: { name: 'Unit', description: 'Hardware physical device controls', weight: 1 },
    name: 'OpenWiFi Unit',
    location: 'Building A, Floor 1',
    hostname: '',
    timezone: 'None',
    ledsActive: true,
    randomPassword: false,
    beaconAdvertisement: {
      enabled: false,
      deviceName: '',
      deviceSerial: '',
      networkId: 1024,
    },
  },
  metrics: {
    meta: { name: 'Metrics', description: 'Telemetry reporting telemetry intervals', weight: 1 },
    activeSubsections: [],
    dhcpSnooping: {
      filters: [],
    },
    health: {
      interval: 60,
      dhcpLocal: true,
      dhcpRemote: false,
      dnsLocal: true,
      dnsRemote: true,
    },
    statistics: {
      interval: 60,
      types: [],
    },
    realtime: {
      types: [],
    },
    wifiScan: {
      interval: 60,
    },
    wifiFrames: {
      filters: [],
    },
    telemetry: {
      interval: 60,
      types: [],
    },
  },
  services: {
    meta: { name: 'Services', description: 'Administrative and discovery daemons', weight: 1 },
    activeSubsections: [],
    airtimePolicies: {
      dnsMatch: ['*'],
      dnsWeight: 256,
    },
    dataPlane: {
      ingressFilters: [],
    },
    facebookWifi: {
      vendorId: '',
      gatewayId: '',
      secret: '',
    },
    fingerprint: {
      mode: 'always',
      minimumAge: 60,
      maximumAge: 60,
      periodicity: 600,
    },
    dhcpRelay: {
      selectPorts: ['LAN*'],
      vlans: [],
    },
    gps: {
      baudRate: 2400,
      adjustTime: false,
    },
    http: {
      httpPort: 80,
    },
    ieee8021x: {
      useLocalCertificates: false,
      caCertificate: '',
      caCertificateFilename: '',
      privateKey: '',
      privateKeyFilename: '',
      serverCertificate: '',
      serverCertificateFilename: '',
      users: [],
    },
    igmp: {
      enable: false,
    },
    lldp: {
      describe: 'OpenWiFi AP',
      location: '',
    },
    log: {
      host: '',
      port: 5912,
      proto: 'udp',
      size: 1000,
    },
    mdns: {
      enable: false,
    },
    ntp: {
      servers: ['0.pool.ntp.org', '1.pool.ntp.org'],
      localServer: false,
    },
    onlineCheck: {
      action: [],
      pingHosts: [],
      downloadHosts: [],
      checkInterval: 60,
      checkThreshold: 1,
    },
    openFlow: {
      controller: '',
      mode: 'ssl',
      caCertificate: '',
      caCertificateFilename: '',
      privateKey: '',
      privateKeyFilename: '',
      sslCertificate: '',
      sslCertificateFilename: '',
    },
    qualityOfService: {
      selectPorts: ['WAN*'],
      bandwidthUp: 0,
      bandwidthDown: 0,
      bulkDetection: false,
      bulkDetectionDscp: 'CS0',
      bulkDetectionPacketsPerSecond: 0,
      classifier: [],
    },
    radiusProxy: {
      realms: [],
    },
    rtty: {
      host: '',
      port: 5912,
      token: '',
    },
    ssh: {
      port: 22,
      passwordAuthentication: true,
    },
    wifiSteering: {
      mode: 'local',
      assocSteering: false,
      autoChannel: false,
      requiredProbeSnr: 0,
      requiredRoamSnr: 0,
      loadKickThreshold: 0,
    },
  },
  radios: {
    meta: { name: 'Radios', description: 'Wi-Fi radio frequency bands', weight: 1 },
    bands: [],
  },
  interfaces: {
    meta: { name: 'Interfaces', description: '', weight: 1 },
    interfaces: [],
  },
  thirdParty: {
    meta: { name: 'Third Party', description: '', weight: 0 },
    customProperties: {},
    configuration: '{}',
  },
});

export const compileStateToUCentralJson = (state: ConfigurationSectionsState): string => {
  const doc: Record<string, unknown> = {};

  if (state.activeSections.includes('globals')) {
    doc.globals = {
      'ipv4-network': state.globals.ipv4Network,
      'ipv6-network': state.globals.ipv6Network,
    };
  }

  if (state.activeSections.includes('unit')) {
    const u = state.unit;
    const unitObj: Record<string, unknown> = {
      name: u.name,
      location: u.location,
      'leds-active': u.ledsActive,
      'random-password': u.randomPassword,
    };
    if (u.hostname) unitObj.hostname = u.hostname;
    if (u.timezone && u.timezone !== 'None') unitObj.timezone = u.timezone;
    if (u.beaconAdvertisement?.enabled) {
      unitObj['beacon-advertisement'] = {
        'device-name': typeof u.beaconAdvertisement.deviceName === 'boolean' ? u.beaconAdvertisement.deviceName : Boolean(u.beaconAdvertisement.deviceName),
        'device-serial': typeof u.beaconAdvertisement.deviceSerial === 'boolean' ? u.beaconAdvertisement.deviceSerial : Boolean(u.beaconAdvertisement.deviceSerial),
        'network-id': Number(u.beaconAdvertisement.networkId) || 1024,
      };
    }
    doc.unit = unitObj;
  }

  if (state.activeSections.includes('metrics')) {
    const m = state.metrics;
    const metricsObj: Record<string, unknown> = {};
    if (m.activeSubsections.includes('statistics')) {
      metricsObj.statistics = { interval: m.statistics.interval, types: m.statistics.types };
    }
    if (m.activeSubsections.includes('health')) {
      metricsObj.health = {
        interval: m.health.interval,
        'dhcp-local': m.health.dhcpLocal,
        'dhcp-remote': m.health.dhcpRemote,
        'dns-local': m.health.dnsLocal,
        'dns-remote': m.health.dnsRemote,
      };
    }
    if (m.activeSubsections.includes('wifi-frames')) {
      metricsObj['wifi-frames'] = { filters: m.wifiFrames.filters };
    }
    if (m.activeSubsections.includes('dhcp-snooping')) {
      metricsObj['dhcp-snooping'] = { filters: m.dhcpSnooping.filters };
    }
    if (m.activeSubsections.includes('realtime')) {
      metricsObj.realtime = { types: m.realtime.types };
    }
    if (m.activeSubsections.includes('telemetry')) {
      metricsObj.telemetry = { interval: m.telemetry.interval, types: m.telemetry.types };
    }
    if (m.activeSubsections.includes('wifi-scan')) {
      metricsObj['wifi-scan'] = { interval: m.wifiScan.interval };
    }
    doc.metrics = metricsObj;
  }

  if (state.activeSections.includes('services')) {
    const s = state.services;
    const servicesObj: Record<string, unknown> = {};
    const subs = s.activeSubsections;

    if (subs.includes('lldp')) {
      servicesObj.lldp = { describe: s.lldp.describe || 'OpenWiFi AP', location: s.lldp.location };
    }
    if (subs.includes('ssh')) {
      servicesObj.ssh = { port: s.ssh.port || 22, 'password-authentication': s.ssh.passwordAuthentication };
    }
    if (subs.includes('ntp')) {
      servicesObj.ntp = { servers: s.ntp.servers, 'local-server': s.ntp.localServer };
    }
    if (subs.includes('http')) {
      servicesObj.http = { 'http-port': s.http.httpPort || 80 };
    }
    if (subs.includes('mdns')) {
      servicesObj.mdns = { enable: s.mdns.enable };
    }
    if (subs.includes('rtty')) {
      servicesObj.rtty = { host: s.rtty.host, port: s.rtty.port, token: s.rtty.token };
    }
    if (subs.includes('log')) {
      servicesObj.log = { host: s.log.host, port: s.log.port, proto: s.log.proto, size: s.log.size };
    }
    if (subs.includes('igmp')) {
      servicesObj.igmp = { enable: s.igmp.enable };
    }
    if (subs.includes('online-check')) {
      const act = Array.isArray(s.onlineCheck.action)
        ? s.onlineCheck.action
        : (s.onlineCheck.action ? [s.onlineCheck.action] : []);
      servicesObj['online-check'] = {
        action: act,
        'ping-hosts': s.onlineCheck.pingHosts,
        'download-hosts': s.onlineCheck.downloadHosts,
        'check-interval': s.onlineCheck.checkInterval,
        'check-threshold': s.onlineCheck.checkThreshold,
      };
    }
    if (subs.includes('open-flow')) {
      servicesObj['open-flow'] = {
        controller: s.openFlow.controller,
        mode: s.openFlow.mode,
        ...(s.openFlow.caCertificate ? { 'ca-certificate': s.openFlow.caCertificate } : {}),
        ...(s.openFlow.caCertificateFilename ? { 'ca-certificate-filename': s.openFlow.caCertificateFilename } : {}),
        ...(s.openFlow.privateKey ? { 'private-key': s.openFlow.privateKey } : {}),
        ...(s.openFlow.privateKeyFilename ? { 'private-key-filename': s.openFlow.privateKeyFilename } : {}),
        ...(s.openFlow.sslCertificate ? { 'ssl-certificate': s.openFlow.sslCertificate } : {}),
        ...(s.openFlow.sslCertificateFilename ? { 'ssl-certificate-filename': s.openFlow.sslCertificateFilename } : {}),
      };
    }
    if (subs.includes('wifi-steering')) {
      servicesObj['wifi-steering'] = {
        mode: s.wifiSteering.mode,
        'assoc-steering': s.wifiSteering.assocSteering,
        'auto-channel': s.wifiSteering.autoChannel,
        'required-probe-snr': s.wifiSteering.requiredProbeSnr,
        'required-roam-snr': s.wifiSteering.requiredRoamSnr,
        'load-kick-threshold': s.wifiSteering.loadKickThreshold,
      };
    }
    if (subs.includes('quality-of-service')) {
      const qos = s.qualityOfService;
      const qosObj: Record<string, unknown> = {
        'select-ports': qos.selectPorts,
        'bandwidth-up': qos.bandwidthUp,
        'bandwidth-down': qos.bandwidthDown,
      };
      if (qos.bulkDetection) {
        qosObj['bulk-detection'] = {
          dscp: qos.bulkDetectionDscp || 'CS0',
          'packets-per-second': qos.bulkDetectionPacketsPerSecond || 0,
        };
      }
      if (qos.classifier && qos.classifier.length > 0) {
        qosObj.classifier = qos.classifier.map((c) => ({
          dscp: c.dscp,
          ports: c.ports.map((p) => ({
            protocol: p.protocol,
            port: p.port,
            'range-end': p.rangeEnd,
            reclassify: p.reclassify,
          })),
          dns: c.dns.map((d) => ({
            fqdn: d.fqdn,
            'suffix-matching': d.suffixMatching,
            reclassify: d.reclassify,
          })),
        }));
      }
      servicesObj['quality-of-service'] = qosObj;
    }
    if (subs.includes('facebook-wifi')) {
      servicesObj['facebook-wifi'] = {
        'vendor-id': s.facebookWifi.vendorId,
        'gateway-id': s.facebookWifi.gatewayId,
        secret: s.facebookWifi.secret,
      };
    }
    if (subs.includes('airtime-policies')) {
      servicesObj['airtime-policies'] = {
        'dns-match': s.airtimePolicies.dnsMatch,
        'dns-weight': s.airtimePolicies.dnsWeight,
      };
    }
    if (subs.includes('data-plane')) {
      servicesObj['data-plane'] = { 'ingress-filters': s.dataPlane.ingressFilters };
    }
    if (subs.includes('ieee8021x')) {
      servicesObj.ieee8021x = {
        'use-local-certificates': s.ieee8021x.useLocalCertificates,
        ...(s.ieee8021x.caCertificate ? { 'ca-certificate': s.ieee8021x.caCertificate } : {}),
        ...(s.ieee8021x.caCertificateFilename ? { 'ca-certificate-filename': s.ieee8021x.caCertificateFilename } : {}),
        ...(s.ieee8021x.privateKey ? { 'private-key': s.ieee8021x.privateKey } : {}),
        ...(s.ieee8021x.privateKeyFilename ? { 'private-key-filename': s.ieee8021x.privateKeyFilename } : {}),
        ...(s.ieee8021x.serverCertificate ? { 'server-certificate': s.ieee8021x.serverCertificate } : {}),
        ...(s.ieee8021x.serverCertificateFilename ? { 'server-certificate-filename': s.ieee8021x.serverCertificateFilename } : {}),
        users: s.ieee8021x.users.map((u) => ({
          mac: u.mac,
          'user-name': u.userName,
          password: u.password,
          'vlan-id': u.vlanId,
        })),
      };
    }
    if (subs.includes('radius-proxy')) {
      servicesObj['radius-proxy'] = {
        realms: s.radiusProxy.realms.map((r) => ({
          realm: r.realm,
          port: r.port,
          'auto-discover': r.autoDiscover,
          secret: r.secret,
          'use-local-certificates': r.useLocalCertificates,
          ...(r.caCertificate ? { 'ca-certificate': r.caCertificate } : {}),
          ...(r.caCertificateFilename ? { 'ca-certificate-filename': r.caCertificateFilename } : {}),
          ...(r.certificate ? { certificate: r.certificate } : {}),
          ...(r.certificateFilename ? { 'certificate-filename': r.certificateFilename } : {}),
          ...(r.privateKey ? { 'private-key': r.privateKey } : {}),
          ...(r.privateKeyFilename ? { 'private-key-filename': r.privateKeyFilename } : {}),
          ...(r.privateKeyPassword ? { 'private-key-password': r.privateKeyPassword } : {}),
        })),
      };
    }
    if (subs.includes('gps')) {
      servicesObj.gps = { 'baud-rate': s.gps.baudRate, 'adjust-time': s.gps.adjustTime };
    }
    if (subs.includes('dhcp-relay')) {
      servicesObj['dhcp-relay'] = {
        'select-ports': s.dhcpRelay.selectPorts,
        vlans: s.dhcpRelay.vlans.map((v) => ({
          vlan: v.vlan,
          'relay-server': v.relayServer,
          'circuit-id-format': v.circuitIdFormat,
          'remote-id-format': v.remoteIdFormat,
        })),
      };
    }
    if (subs.includes('fingerprint')) {
      servicesObj.fingerprint = {
        mode: s.fingerprint.mode,
        'minimum-age': s.fingerprint.minimumAge,
        'maximum-age': s.fingerprint.maximumAge,
        periodicity: s.fingerprint.periodicity,
      };
    }
    doc.services = servicesObj;
  }

  if (state.activeSections.includes('radios')) {
    doc.radios = state.radios.bands.map((b) => {
      const radioObj: Record<string, unknown> = {
        band: b.band,
        bandwidth: Number(b.bandwidth) || 5,
        channel: b.channel === 'auto' ? 'auto' : Number(b.channel) || 'auto',
        'channel-mode': b.channelMode,
        'channel-width': Number(b.channelWidth) || 20,
        country: b.country === 'United States' ? 'US' : (b.country || 'US'),
        'tx-power': Number(b.txPower) || 0,
        'maximum-clients': Number(b.maximumClients) || 64,
        'allow-dfs': Boolean(b.allowDfs),
        'beacon-interval': Number(b.beaconInterval) || 100,
      };

      if (b.mimo && b.mimo !== 'None' && b.mimo !== '') radioObj.mimo = b.mimo;
      if (b.legacyRates) radioObj['legacy-rates'] = true;
      if (b.requireMode && b.requireMode !== 'None' && b.requireMode !== '') radioObj['require-mode'] = b.requireMode;
      if (b.hostapdIfaceRaw) radioObj['hostapd-iface-raw'] = [b.hostapdIfaceRaw];

      // rates
      const ratesObj: Record<string, number> = {};
      if (b.beaconRate && b.beaconRate !== 'None' && b.beaconRate !== '') {
        ratesObj.beacon = Number(b.beaconRate);
      }
      if (b.multicast && b.multicast !== 'None' && b.multicast !== '') {
        ratesObj.multicast = Number(b.multicast);
      }
      if (Object.keys(ratesObj).length > 0) {
        radioObj.rates = ratesObj;
      }

      // he
      const heObj: Record<string, unknown> = {};
      if (b.multipleBssid) heObj['multiple-bssid'] = true;
      if (b.ema) heObj.ema = true;
      if (b.bssColor !== undefined && b.bssColor !== null && String(b.bssColor).trim() !== '') {
        heObj['bss-color'] = Number(b.bssColor);
      }
      if (Object.keys(heObj).length > 0) {
        radioObj.he = heObj;
      }

      return radioObj;
    });
  }

  if (state.activeSections.includes('interfaces')) {
    doc.interfaces = state.interfaces.interfaces.map((iface) => {
      const ifaceObj: Record<string, unknown> = {
        name: iface.name,
        role: iface.role,
        ethernet:
          iface.ethernet && iface.ethernet.length > 0
            ? iface.ethernet.map((eth) => ({
                'select-ports': eth.selectPorts,
                ...(eth.macaddr ? { macaddr: eth.macaddr } : {}),
                multicast: eth.multicast,
                learning: eth.learning,
                'reverse-path': eth.reversePath,
                'vlan-tag': eth.vlanTag,
              }))
            : [{ 'select-ports': iface.selectPorts || [] }],
      };
      if (iface.isolateHosts) ifaceObj['isolate-hosts'] = true;
      if (iface.services.length > 0) ifaceObj.services = iface.services;
      if (iface.hostapdBssRaw) ifaceObj['hostapd-bss-raw'] = iface.hostapdBssRaw;

      if (iface.ipv4 && iface.ipv4.addressing !== 'none') {
        const ipv4Obj: Record<string, unknown> = {
          addressing: iface.ipv4.addressing,
        };
        if (iface.ipv4.addressing === 'static') {
          if (iface.ipv4.subnet) ipv4Obj.subnet = iface.ipv4.subnet;
          if (iface.ipv4.gateway) ipv4Obj.gateway = iface.ipv4.gateway;
          if (iface.ipv4.sendHostname !== undefined) ipv4Obj['send-hostname'] = iface.ipv4.sendHostname;
          if (iface.ipv4.useDns && iface.ipv4.useDns.length > 0) ipv4Obj['use-dns'] = iface.ipv4.useDns;
        }
        if (iface.ipv4.dhcpServer) {
          const dhcpData = iface.ipv4.dhcp || {};
          const dhcpObj: Record<string, unknown> = {
            'lease-first': dhcpData.leaseFirst ?? iface.ipv4.leaseFirst ?? 1,
            'lease-count': dhcpData.leaseCount ?? iface.ipv4.leaseCount ?? 128,
            'lease-time': dhcpData.leaseTime || iface.ipv4.leaseTime || '6h',
          };
          if (dhcpData.relayServer) dhcpObj['relay-server'] = dhcpData.relayServer;
          if (dhcpData.circuitIdFormat) dhcpObj['circuit-id-format'] = dhcpData.circuitIdFormat;
          if (dhcpData.remoteIdFormat) dhcpObj['remote-id-format'] = dhcpData.remoteIdFormat;
          ipv4Obj.dhcp = dhcpObj;

          if (dhcpData.reservedAddresses && dhcpData.reservedAddresses.length > 0) {
            ipv4Obj['dhcp-leases'] = dhcpData.reservedAddresses.map((res) => ({
              macaddr: res.macaddr,
              'static-lease-offset': res.staticLeaseOffset,
              'lease-time': res.leaseTime,
              'publish-hostname': res.publishHostname,
            }));
          }
        }
        ifaceObj.ipv4 = ipv4Obj;
      }

      if (iface.ipv6 && iface.ipv6.addressing !== 'none') {
        const ipv6Obj: Record<string, unknown> = {
          addressing: iface.ipv6.addressing,
        };
        if (iface.ipv6.addressing === 'static') {
          if (iface.ipv6.subnet) ipv6Obj.subnet = iface.ipv6.subnet;
          if (iface.ipv6.gateway) ipv6Obj.gateway = iface.ipv6.gateway;
          if (iface.ipv6.prefixSize !== undefined) ipv6Obj['prefix-size'] = iface.ipv6.prefixSize;
          if (iface.ipv6.dhcpv6 && iface.ipv6.dhcpv6.enabled) {
            ipv6Obj.dhcpv6 = {
              mode: iface.ipv6.dhcpv6.mode || 'hybrid',
              ...(iface.ipv6.dhcpv6.announceDns && iface.ipv6.dhcpv6.announceDns.length > 0
                ? { 'announce-dns': iface.ipv6.dhcpv6.announceDns }
                : {}),
              'filter-prefix': iface.ipv6.dhcpv6.filterPrefix || '::/0',
            };
          }
        }
        ifaceObj.ipv6 = ipv6Obj;
      }

      if (iface.vlan && iface.vlan.enabled && iface.vlan.id) {
        ifaceObj.vlan = { id: iface.vlan.id };
      }

      if (iface.tunnel && iface.tunnel.proto && iface.tunnel.proto !== 'none') {
        ifaceObj.tunnel = { proto: iface.tunnel.proto, ...(iface.tunnel.peer ? { peer: iface.tunnel.peer } : {}) };
      }

      if (iface.ssids && iface.ssids.length > 0) {
        ifaceObj.ssids = iface.ssids.map((s) => {
          const ssidObj: Record<string, unknown> = {
            name: s.name,
            'bss-mode': s.bssMode,
            'wifi-bands': s.wifiBands,
            encryption: {
              proto: s.encryption.proto,
              ...(s.encryption.proto !== 'open' && s.encryption.proto !== 'none' && s.encryption.key
                ? { key: s.encryption.key }
                : {}),
              ...(s.encryption.ieee80211w ? { ieee80211w: s.encryption.ieee80211w } : {}),
              ...(s.encryption.keyCaching !== undefined ? { 'key-caching': s.encryption.keyCaching } : {}),
            },
          };

          if (s.radius?.server) {
            ssidObj.radius = {
              server: s.radius.server,
              port: s.radius.port || 1812,
              secret: s.radius.secret,
            };
          }

          if (s.passPoint?.enabled) {
            ssidObj['pass-point'] = {
              ...(s.passPoint.venueName?.length ? { 'venue-name': s.passPoint.venueName } : {}),
              ...(s.passPoint.venueUrl?.length ? { 'venue-url': s.passPoint.venueUrl } : {}),
              ...(s.passPoint.domainName?.length ? { 'domain-name': s.passPoint.domainName } : {}),
            };
          }

          if (s.advanced) {
            if (s.advanced.hiddenSsid) ssidObj['hidden-ssid'] = true;
            if (s.advanced.services && s.advanced.services.length > 0) {
              ssidObj.services = s.advanced.services;
            }
            if (s.advanced.maximumClients !== undefined) {
              ssidObj['maximum-clients'] = s.advanced.maximumClients;
            }
            if (s.advanced.filsDiscoveryInterval !== undefined) {
              ssidObj['fils-discovery-interval'] = s.advanced.filsDiscoveryInterval;
            }
            if (s.advanced.purpose) {
              ssidObj.purpose = s.advanced.purpose;
            }
            if (s.advanced.dtimPeriod !== undefined) {
              ssidObj['dtim-period'] = s.advanced.dtimPeriod;
            }
            if (s.advanced.isolateClients) ssidObj['isolate-clients'] = true;
            if (s.advanced.powerSave) ssidObj['power-save'] = true;
            if (s.advanced.broadcastTime) ssidObj['broadcast-time'] = true;
            if (s.advanced.unicastConversion) ssidObj['unicast-conversion'] = true;
            if (s.advanced.proxyArp) ssidObj['proxy-arp'] = true;
            if (s.advanced.disassocLowAck) ssidObj['disassoc-low-ack'] = true;
            if (s.advanced.vendorElements) ssidObj['vendor-elements'] = s.advanced.vendorElements;
            if (s.advanced.tipInformationElement !== undefined) {
              ssidObj['tip-information-element'] = s.advanced.tipInformationElement;
            }
            if (s.advanced.multiPsk && s.advanced.multiPsk.length > 0) {
              ssidObj['multi-psk'] = s.advanced.multiPsk.map((item) => ({
                ...(item.mac ? { mac: item.mac } : {}),
                key: item.key,
                'vlan-id': item.vlanId,
              }));
            }
          }

          if (s.rateLimit?.enabled) {
            ssidObj['rate-limit'] = {
              'ingress-rate': s.rateLimit.ingressRate || 0,
              'egress-rate': s.rateLimit.egressRate || 0,
            };
          }

          if (s.rrm?.enabled) {
            ssidObj.rrm = {
              ...(s.rrm.neighborReporting ? { 'neighbor-reporting': true } : {}),
              ...(s.rrm.lci ? { lci: s.rrm.lci } : {}),
              ...(s.rrm.civicLocation ? { 'civic-location': s.rrm.civicLocation } : {}),
              ...(s.rrm.ftmResponder ? { 'ftm-responder': true } : {}),
              ...(s.rrm.stationaryAp ? { 'stationary-ap': true } : {}),
            };
          }

          if (s.captivePortal?.mode && s.captivePortal.mode !== 'none') {
            ssidObj.captive = {
              ...(s.captivePortal.walledGardenFqdn?.length ? { 'walled-garden-fqdn': s.captivePortal.walledGardenFqdn } : {}),
              ...(s.captivePortal.walledGardenIpaddr?.length ? { 'walled-garden-ipaddr': s.captivePortal.walledGardenIpaddr } : {}),
              ...(s.captivePortal.idleTimeout !== undefined ? { 'idle-timeout': s.captivePortal.idleTimeout } : {}),
              ...(s.captivePortal.sessionTimeout !== undefined ? { 'session-timeout': s.captivePortal.sessionTimeout } : {}),
            };
          }

          if (s.accessControlList?.enabled) {
            ssidObj['access-control-list'] = {
              mode: s.accessControlList.mode || 'allow',
              'mac-address': s.accessControlList.macAddress || [],
            };
          }

          if (s.roaming?.state && s.roaming.state !== 'off') {
            if (s.roaming.state === 'custom') {
              ssidObj.roaming = {
                'message-exchange': s.roaming.messageExchange || 'air',
                'generate-psk': Boolean(s.roaming.generatePsk),
                ...(s.roaming.domainIdentifier ? { 'domain-identifier': s.roaming.domainIdentifier } : {}),
                ...(s.roaming.pmkR0KeyHolder ? { 'pmk-r0-key-holder': s.roaming.pmkR0KeyHolder } : {}),
                ...(s.roaming.pmkR1KeyHolder ? { 'pmk-r1-key-holder': s.roaming.pmkR1KeyHolder } : {}),
              };
            } else {
              ssidObj.roaming = true;
            }
          }

          return ssidObj;
        });
      }

      return ifaceObj;
    });
  }

  if (state.activeSections.includes('third-party')) {
    if (state.thirdParty.configuration) {
      try {
        doc['third-party'] = JSON.parse(state.thirdParty.configuration);
      } catch {
        doc['third-party'] = state.thirdParty.customProperties || {};
      }
    } else {
      doc['third-party'] = state.thirdParty.customProperties || {};
    }
  }

  return JSON.stringify(doc, null, 2);
};
export interface ModularConfigBlock {
  name: string;
  description: string;
  weight: number;
  configuration: string;
}

export const compileStateToModularConfigurationElements = (
  state: ConfigurationSectionsState
): ModularConfigBlock[] => {
  const blocks: ModularConfigBlock[] = [];
  const fullJsonStr = compileStateToUCentralJson(state);
  let parsedFull: Record<string, unknown>;
  try {
    parsedFull = JSON.parse(fullJsonStr);
  } catch {
    parsedFull = {};
  }

  for (const section of state.activeSections) {
    const meta =
      section === 'globals'
        ? state.globals.meta
        : section === 'unit'
        ? state.unit.meta
        : section === 'metrics'
        ? state.metrics.meta
        : section === 'services'
        ? state.services.meta
        : section === 'radios'
        ? state.radios.meta
        : section === 'interfaces'
        ? state.interfaces.meta
        : state.thirdParty.meta;

    const jsonKey = section;
    if (parsedFull[jsonKey] !== undefined) {
      blocks.push({
        name: meta?.name || section.charAt(0).toUpperCase() + section.slice(1),
        description: meta?.description || '',
        weight: Number.isFinite(meta?.weight) ? meta.weight : 1,
        configuration: JSON.stringify({ [jsonKey]: parsedFull[jsonKey] }, null, 2),
      });
    }
  }

  return blocks;
};

export const parseUCentralJsonToSectionsState = (
  raw: unknown
): ConfigurationSectionsState => {
  const base = getInitialSectionsState();
  if (!raw) return base;

  let doc: Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      doc = JSON.parse(raw);
    } catch {
      return base;
    }
  } else if (typeof raw === 'object' && raw !== null) {
    doc = raw as Record<string, unknown>;
  } else {
    return base;
  }

  if (!doc || typeof doc !== 'object') return base;

  // Handle array of OWPROV modular configuration blocks
  if (Array.isArray(doc)) {
    const mergedDoc: Record<string, unknown> = {};
    for (const block of doc) {
      if (!block || typeof block !== 'object') continue;
      const b = block as { name?: string; description?: string; weight?: number; configuration?: unknown };
      let parsedBlock: Record<string, unknown> | null;
      if (typeof b.configuration === 'string') {
        try {
          parsedBlock = JSON.parse(b.configuration);
        } catch {
          parsedBlock = null;
        }
      } else if (typeof b.configuration === 'object' && b.configuration !== null) {
        parsedBlock = b.configuration as Record<string, unknown>;
      } else {
        parsedBlock = block as Record<string, unknown>;
      }

      if (parsedBlock && typeof parsedBlock === 'object') {
        Object.assign(mergedDoc, parsedBlock);
        const sectionKeys = ['globals', 'unit', 'metrics', 'services', 'radios', 'interfaces', 'third-party'] as const;
        for (const k of sectionKeys) {
          if (k in parsedBlock) {
            const stateKey = k === 'third-party' ? 'thirdParty' : k;
            if (b.name) (base[stateKey] as { meta: SectionMeta }).meta.name = b.name;
            if (b.description !== undefined) (base[stateKey] as { meta: SectionMeta }).meta.description = b.description;
            if (b.weight !== undefined) (base[stateKey] as { meta: SectionMeta }).meta.weight = Number(b.weight) || 1;
          }
        }
      }
    }
    doc = mergedDoc;
  }

  const detectedSections: SubsectionKey[] = [];

  // 1. Globals
  if (doc.globals && typeof doc.globals === 'object') {
    detectedSections.push('globals');
    const g = doc.globals as Record<string, unknown>;
    base.globals.ipv4Network = String(g['ipv4-network'] ?? g.ipv4Network ?? base.globals.ipv4Network);
    base.globals.ipv6Network = String(g['ipv6-network'] ?? g.ipv6Network ?? base.globals.ipv6Network);
  }

  // 2. Unit
  if (doc.unit && typeof doc.unit === 'object') {
    detectedSections.push('unit');
    const u = doc.unit as Record<string, unknown>;
    base.unit.name = String(u.name ?? base.unit.name);
    base.unit.location = String(u.location ?? base.unit.location);
    if (u.hostname) base.unit.hostname = String(u.hostname);
    if (u.timezone) base.unit.timezone = String(u.timezone);
    if (u['leds-active'] !== undefined) base.unit.ledsActive = Boolean(u['leds-active']);
    else if (u.ledsActive !== undefined) base.unit.ledsActive = Boolean(u.ledsActive);
    if (u['random-password'] !== undefined) base.unit.randomPassword = Boolean(u['random-password']);
    else if (u.randomPassword !== undefined) base.unit.randomPassword = Boolean(u.randomPassword);

    const ba = (u['beacon-advertisement'] || u.beaconAdvertisement) as Record<string, unknown> | undefined;
    if (ba && typeof ba === 'object') {
      base.unit.beaconAdvertisement = {
        enabled: ba.enabled !== undefined ? Boolean(ba.enabled) : true,
        deviceName: String(ba['device-name'] ?? ba.deviceName ?? ''),
        deviceSerial: String(ba['device-serial'] ?? ba.deviceSerial ?? ''),
        networkId: Number(ba['network-id'] ?? ba.networkId ?? 1024),
      };
    }
  }

  // 3. Metrics
  if (doc.metrics && typeof doc.metrics === 'object') {
    detectedSections.push('metrics');
    const m = doc.metrics as Record<string, unknown>;
    const subs: string[] = [];

    if (m.statistics && typeof m.statistics === 'object') {
      subs.push('statistics');
      const stats = m.statistics as Record<string, unknown>;
      base.metrics.statistics = {
        interval: Number(stats.interval ?? 60),
        types: Array.isArray(stats.types) ? stats.types.map(String) : [],
      };
    }
    if (m.health && typeof m.health === 'object') {
      subs.push('health');
      const h = m.health as Record<string, unknown>;
      base.metrics.health = {
        interval: Number(h.interval ?? 60),
        dhcpLocal: h['dhcp-local'] !== undefined ? Boolean(h['dhcp-local']) : (h.dhcpLocal !== undefined ? Boolean(h.dhcpLocal) : true),
        dhcpRemote: h['dhcp-remote'] !== undefined ? Boolean(h['dhcp-remote']) : (h.dhcpRemote !== undefined ? Boolean(h.dhcpRemote) : false),
        dnsLocal: h['dns-local'] !== undefined ? Boolean(h['dns-local']) : (h.dnsLocal !== undefined ? Boolean(h.dnsLocal) : true),
        dnsRemote: h['dns-remote'] !== undefined ? Boolean(h['dns-remote']) : (h.dnsRemote !== undefined ? Boolean(h.dnsRemote) : true),
      };
    }
    const wf = (m['wifi-frames'] || m.wifiFrames) as Record<string, unknown> | undefined;
    if (wf && typeof wf === 'object') {
      subs.push('wifi-frames');
      base.metrics.wifiFrames = {
        filters: Array.isArray(wf.filters) ? wf.filters.map(String) : [],
      };
    }
    const ds = (m['dhcp-snooping'] || m.dhcpSnooping) as Record<string, unknown> | undefined;
    if (ds && typeof ds === 'object') {
      subs.push('dhcp-snooping');
      base.metrics.dhcpSnooping = {
        filters: Array.isArray(ds.filters) ? ds.filters.map(String) : [],
      };
    }
    if (m.realtime && typeof m.realtime === 'object') {
      subs.push('realtime');
      const rt = m.realtime as Record<string, unknown>;
      base.metrics.realtime = {
        types: Array.isArray(rt.types) ? rt.types.map(String) : [],
      };
    }
    if (m.telemetry && typeof m.telemetry === 'object') {
      subs.push('telemetry');
      const tel = m.telemetry as Record<string, unknown>;
      base.metrics.telemetry = {
        interval: Number(tel.interval ?? 60),
        types: Array.isArray(tel.types) ? tel.types.map(String) : [],
      };
    }
    const ws = (m['wifi-scan'] || m.wifiScan) as Record<string, unknown> | undefined;
    if (ws && typeof ws === 'object') {
      subs.push('wifi-scan');
      base.metrics.wifiScan = {
        interval: Number(ws.interval ?? 60),
      };
    }

    base.metrics.activeSubsections = subs;
  }

  // 4. Services
  if (doc.services && typeof doc.services === 'object') {
    detectedSections.push('services');
    const s = doc.services as Record<string, unknown>;
    const subs: string[] = [];

    if (s.lldp && typeof s.lldp === 'object') {
      subs.push('lldp');
      const lldp = s.lldp as Record<string, unknown>;
      base.services.lldp = {
        describe: String(lldp.describe ?? 'OpenWiFi AP'),
        location: String(lldp.location ?? ''),
      };
    }
    if (s.ssh && typeof s.ssh === 'object') {
      subs.push('ssh');
      const ssh = s.ssh as Record<string, unknown>;
      base.services.ssh = {
        port: Number(ssh.port ?? 22),
        passwordAuthentication: ssh['password-authentication'] !== undefined
          ? Boolean(ssh['password-authentication'])
          : (ssh.passwordAuthentication !== undefined ? Boolean(ssh.passwordAuthentication) : true),
      };
    }
    if (s.ntp && typeof s.ntp === 'object') {
      subs.push('ntp');
      const ntp = s.ntp as Record<string, unknown>;
      base.services.ntp = {
        servers: Array.isArray(ntp.servers) ? ntp.servers.map(String) : ['0.pool.ntp.org', '1.pool.ntp.org'],
        localServer: Boolean(ntp['local-server'] ?? ntp.localServer),
      };
    }
    if (s.http && typeof s.http === 'object') {
      subs.push('http');
      const http = s.http as Record<string, unknown>;
      base.services.http = {
        httpPort: Number(http['http-port'] ?? http.httpPort ?? 80),
      };
    }
    if (s.mdns && typeof s.mdns === 'object') {
      subs.push('mdns');
      const mdns = s.mdns as Record<string, unknown>;
      base.services.mdns = {
        enable: Boolean(mdns.enable),
      };
    }
    if (s.rtty && typeof s.rtty === 'object') {
      subs.push('rtty');
      const rtty = s.rtty as Record<string, unknown>;
      base.services.rtty = {
        host: String(rtty.host ?? ''),
        port: Number(rtty.port ?? 5912),
        token: String(rtty.token ?? ''),
      };
    }
    if (s.log && typeof s.log === 'object') {
      subs.push('log');
      const log = s.log as Record<string, unknown>;
      base.services.log = {
        host: String(log.host ?? ''),
        port: Number(log.port ?? 5912),
        proto: log.proto === 'tcp' ? 'tcp' : 'udp',
        size: Number(log.size ?? 1000),
      };
    }
    if (s.igmp && typeof s.igmp === 'object') {
      subs.push('igmp');
      const igmp = s.igmp as Record<string, unknown>;
      base.services.igmp = {
        enable: Boolean(igmp.enable),
      };
    }
    const oc = (s['online-check'] || s.onlineCheck) as Record<string, unknown> | undefined;
    if (oc && typeof oc === 'object') {
      subs.push('online-check');
      base.services.onlineCheck = {
        action: Array.isArray(oc.action) ? oc.action.map(String) : (oc.action ? [String(oc.action)] : []),
        pingHosts: Array.isArray(oc['ping-hosts'] ?? oc.pingHosts) ? ((oc['ping-hosts'] ?? oc.pingHosts) as unknown[]).map(String) : [],
        downloadHosts: Array.isArray(oc['download-hosts'] ?? oc.downloadHosts) ? ((oc['download-hosts'] ?? oc.downloadHosts) as unknown[]).map(String) : [],
        checkInterval: Number(oc['check-interval'] ?? oc.checkInterval ?? 60),
        checkThreshold: Number(oc['check-threshold'] ?? oc.checkThreshold ?? 1),
      };
    }
    const of = (s['open-flow'] || s.openFlow) as Record<string, unknown> | undefined;
    if (of && typeof of === 'object') {
      subs.push('open-flow');
      base.services.openFlow = {
        controller: String(of.controller ?? ''),
        mode: String(of.mode ?? 'ssl'),
        caCertificate: String(of['ca-certificate'] ?? of.caCertificate ?? ''),
        caCertificateFilename: of['ca-certificate-filename'] ?? of.caCertificateFilename ? String(of['ca-certificate-filename'] ?? of.caCertificateFilename) : undefined,
        privateKey: String(of['private-key'] ?? of.privateKey ?? ''),
        privateKeyFilename: of['private-key-filename'] ?? of.privateKeyFilename ? String(of['private-key-filename'] ?? of.privateKeyFilename) : undefined,
        sslCertificate: String(of['ssl-certificate'] ?? of.sslCertificate ?? ''),
        sslCertificateFilename: of['ssl-certificate-filename'] ?? of.sslCertificateFilename ? String(of['ssl-certificate-filename'] ?? of.sslCertificateFilename) : undefined,
      };
    }
    const ws = (s['wifi-steering'] || s.wifiSteering) as Record<string, unknown> | undefined;
    if (ws && typeof ws === 'object') {
      subs.push('wifi-steering');
      base.services.wifiSteering = {
        mode: ws.mode === 'cloud' ? 'cloud' : 'local',
        assocSteering: Boolean(ws['assoc-steering'] ?? ws.assocSteering),
        autoChannel: Boolean(ws['auto-channel'] ?? ws.autoChannel),
        requiredProbeSnr: Number(ws['required-probe-snr'] ?? ws.requiredProbeSnr ?? 0),
        requiredRoamSnr: Number(ws['required-roam-snr'] ?? ws.requiredRoamSnr ?? 0),
        loadKickThreshold: Number(ws['load-kick-threshold'] ?? ws.loadKickThreshold ?? 0),
      };
    }
    const qos = (s['quality-of-service'] || s.qualityOfService) as Record<string, unknown> | undefined;
    if (qos && typeof qos === 'object') {
      subs.push('quality-of-service');
      const classifierRaw = Array.isArray(qos.classifier) ? (qos.classifier as Record<string, unknown>[]) : [];
      base.services.qualityOfService = {
        selectPorts: Array.isArray(qos['select-ports'] ?? qos.selectPorts) ? ((qos['select-ports'] ?? qos.selectPorts) as unknown[]).map(String) : ['WAN*'],
        bandwidthUp: Number(qos['bandwidth-up'] ?? qos.bandwidthUp ?? 0),
        bandwidthDown: Number(qos['bandwidth-down'] ?? qos.bandwidthDown ?? 0),
        bulkDetection: Boolean(qos['bulk-detection'] ?? qos.bulkDetection),
        bulkDetectionDscp: String((qos['bulk-detection'] as Record<string, unknown> | undefined)?.dscp ?? qos.bulkDetectionDscp ?? 'CS0'),
        bulkDetectionPacketsPerSecond: Number((qos['bulk-detection'] as Record<string, unknown> | undefined)?.['packets-per-second'] ?? qos.bulkDetectionPacketsPerSecond ?? 0),
        classifier: classifierRaw.map((c: Record<string, unknown>) => ({
          dscp: String(c.dscp ?? 'CS0'),
          ports: Array.isArray(c.ports) ? (c.ports as Record<string, unknown>[]).map((p: Record<string, unknown>) => ({
            protocol: String(p.protocol ?? 'any'),
            port: Number(p.port ?? 0),
            rangeEnd: Number(p['range-end'] ?? p.rangeEnd ?? 0),
            reclassify: Boolean(p.reclassify),
          })) : [],
          dns: Array.isArray(c.dns) ? (c.dns as Record<string, unknown>[]).map((d: Record<string, unknown>) => ({
            fqdn: String(d.fqdn ?? ''),
            suffixMatching: Boolean(d['suffix-matching'] ?? d.suffixMatching),
            reclassify: Boolean(d.reclassify),
          })) : [],
        })),
      };
    }
    const fb = (s['facebook-wifi'] || s.facebookWifi) as Record<string, unknown> | undefined;
    if (fb && typeof fb === 'object') {
      subs.push('facebook-wifi');
      base.services.facebookWifi = {
        vendorId: String(fb['vendor-id'] ?? fb.vendorId ?? ''),
        gatewayId: String(fb['gateway-id'] ?? fb.gatewayId ?? ''),
        secret: String(fb.secret ?? ''),
      };
    }
    const ap = (s['airtime-policies'] || s.airtimePolicies) as Record<string, unknown> | undefined;
    if (ap && typeof ap === 'object') {
      subs.push('airtime-policies');
      base.services.airtimePolicies = {
        dnsMatch: Array.isArray(ap['dns-match'] ?? ap.dnsMatch) ? ((ap['dns-match'] ?? ap.dnsMatch) as unknown[]).map(String) : ['*'],
        dnsWeight: Number(ap['dns-weight'] ?? ap.dnsWeight ?? 256),
      };
    }
    const dp = (s['data-plane'] || s.dataPlane) as Record<string, unknown> | undefined;
    if (dp && typeof dp === 'object') {
      subs.push('data-plane');
      const ingressRaw = Array.isArray(dp['ingress-filters'] ?? dp.ingressFilters)
        ? ((dp['ingress-filters'] ?? dp.ingressFilters) as Record<string, unknown>[])
        : [];
      base.services.dataPlane = {
        ingressFilters: ingressRaw.map((f: Record<string, unknown>) => ({
          name: String(f.name ?? ''),
          program: String(f.program ?? ''),
        })),
      };
    }
    if (s.ieee8021x && typeof s.ieee8021x === 'object') {
      subs.push('ieee8021x');
      const dot1x = s.ieee8021x as Record<string, unknown>;
      const usersRaw = Array.isArray(dot1x.users) ? (dot1x.users as Record<string, unknown>[]) : [];
      base.services.ieee8021x = {
        useLocalCertificates: Boolean(dot1x['use-local-certificates'] ?? dot1x.useLocalCertificates),
        caCertificate: String(dot1x['ca-certificate'] ?? dot1x.caCertificate ?? ''),
        caCertificateFilename: dot1x['ca-certificate-filename'] ?? dot1x.caCertificateFilename ? String(dot1x['ca-certificate-filename'] ?? dot1x.caCertificateFilename) : undefined,
        privateKey: String(dot1x['private-key'] ?? dot1x.privateKey ?? ''),
        privateKeyFilename: dot1x['private-key-filename'] ?? dot1x.privateKeyFilename ? String(dot1x['private-key-filename'] ?? dot1x.privateKeyFilename) : undefined,
        serverCertificate: String(dot1x['server-certificate'] ?? dot1x.serverCertificate ?? ''),
        serverCertificateFilename: dot1x['server-certificate-filename'] ?? dot1x.serverCertificateFilename ? String(dot1x['server-certificate-filename'] ?? dot1x.serverCertificateFilename) : undefined,
        users: usersRaw.map((u: Record<string, unknown>) => ({
          mac: String(u.mac ?? ''),
          userName: String(u['user-name'] ?? u.userName ?? ''),
          password: String(u.password ?? ''),
          vlanId: Number(u['vlan-id'] ?? u.vlanId ?? 0),
        })),
      };
    }
    const rp = (s['radius-proxy'] || s.radiusProxy) as Record<string, unknown> | undefined;
    if (rp && typeof rp === 'object') {
      subs.push('radius-proxy');
      const realmsRaw = Array.isArray(rp.realms) ? (rp.realms as Record<string, unknown>[]) : [];
      base.services.radiusProxy = {
        realms: realmsRaw.map((r: Record<string, unknown>) => ({
          realm: String(r.realm ?? ''),
          port: Number(r.port ?? 1812),
          autoDiscover: Boolean(r['auto-discover'] ?? r.autoDiscover),
          secret: String(r.secret ?? ''),
          useLocalCertificates: Boolean(r['use-local-certificates'] ?? r.useLocalCertificates),
          caCertificate: r['ca-certificate'] ?? r.caCertificate ? String(r['ca-certificate'] ?? r.caCertificate) : undefined,
          caCertificateFilename: r['ca-certificate-filename'] ?? r.caCertificateFilename ? String(r['ca-certificate-filename'] ?? r.caCertificateFilename) : undefined,
          certificate: r.certificate ? String(r.certificate) : undefined,
          certificateFilename: r['certificate-filename'] ?? r.certificateFilename ? String(r['certificate-filename'] ?? r.certificateFilename) : undefined,
          privateKey: r['private-key'] ?? r.privateKey ? String(r['private-key'] ?? r.privateKey) : undefined,
          privateKeyFilename: r['private-key-filename'] ?? r.privateKeyFilename ? String(r['private-key-filename'] ?? r.privateKeyFilename) : undefined,
          privateKeyPassword: r['private-key-password'] ?? r.privateKeyPassword ? String(r['private-key-password'] ?? r.privateKeyPassword) : undefined,
        })),
      };
    }
    if (s.gps && typeof s.gps === 'object') {
      subs.push('gps');
      const gps = s.gps as Record<string, unknown>;
      base.services.gps = {
        baudRate: Number(gps['baud-rate'] ?? gps.baudRate ?? 2400),
        adjustTime: Boolean(gps['adjust-time'] ?? gps.adjustTime),
      };
    }
    const dr = (s['dhcp-relay'] || s.dhcpRelay) as Record<string, unknown> | undefined;
    if (dr && typeof dr === 'object') {
      subs.push('dhcp-relay');
      const vlansRaw = Array.isArray(dr.vlans) ? (dr.vlans as Record<string, unknown>[]) : [];
      base.services.dhcpRelay = {
        selectPorts: Array.isArray(dr['select-ports'] ?? dr.selectPorts) ? ((dr['select-ports'] ?? dr.selectPorts) as unknown[]).map(String) : ['LAN*'],
        vlans: vlansRaw.map((v: Record<string, unknown>) => ({
          vlan: Number(v.vlan ?? 0),
          relayServer: String(v['relay-server'] ?? v.relayServer ?? ''),
          circuitIdFormat: String(v['circuit-id-format'] ?? v.circuitIdFormat ?? ''),
          remoteIdFormat: String(v['remote-id-format'] ?? v.remoteIdFormat ?? ''),
        })),
      };
    }
    if (s.fingerprint && typeof s.fingerprint === 'object') {
      subs.push('fingerprint');
      const fp = s.fingerprint as Record<string, unknown>;
      base.services.fingerprint = {
        mode: (fp.mode as 'always' | 'polled' | 'final' | 'raw-data') || 'always',
        minimumAge: Number(fp['minimum-age'] ?? fp.minimumAge ?? 60),
        maximumAge: Number(fp['maximum-age'] ?? fp.maximumAge ?? 60),
        periodicity: Number(fp.periodicity ?? 600),
      };
    }

    base.services.activeSubsections = subs;
  }

  // 5. Radios
  if (Array.isArray(doc.radios) && doc.radios.length > 0) {
    detectedSections.push('radios');
    const radiosList = doc.radios as Record<string, unknown>[];
    base.radios.bands = radiosList.map((r: Record<string, unknown>, idx: number) => {
      const bandRaw = r.band || (idx === 0 ? '2G' : '5G');
      const band: SingleRadioConfigItem['band'] =
        bandRaw === '2G' || bandRaw === '5G' || bandRaw === '5G-lower' || bandRaw === '5G-upper' || bandRaw === '6G'
          ? bandRaw
          : '2G';

      const heObj = r.he as Record<string, unknown> | undefined;
      const ratesObj = r.rates as Record<string, unknown> | undefined;

      return {
        id: r.id ? String(r.id) : `radio-${band.toLowerCase()}-${idx + 1}`,
        band,
        bandwidth: Number(r.bandwidth ?? 5),
        country: r.country ? String(r.country) : 'US',
        channelMode: String(r['channel-mode'] ?? r.channelMode ?? (band === '6G' ? 'HE' : 'HT')),
        channelWidth: Number(r['channel-width'] ?? r.channelWidth ?? 20),
        channel: r.channel !== undefined ? String(r.channel) : 'auto',
        mimo: r.mimo ? String(r.mimo) : 'None',
        txPower: Number(r['tx-power'] ?? r.txPower ?? 0),
        legacyRates: Boolean(r['legacy-rates'] ?? r.legacyRates),
        maximumClients: Number(r['maximum-clients'] ?? r.maximumClients ?? 64),
        multipleBssid: Boolean(heObj?.['multiple-bssid'] ?? r['multiple-bssid'] ?? r.multipleBssid),
        allowDfs: r['allow-dfs'] !== undefined ? Boolean(r['allow-dfs']) : (r.allowDfs !== undefined ? Boolean(r.allowDfs) : true),
        beaconRate: ratesObj?.beacon !== undefined ? String(ratesObj.beacon) : (r.beaconRate !== undefined ? String(r.beaconRate) : 'None'),
        beaconInterval: Number(r['beacon-interval'] ?? r.beaconInterval ?? 100),
        hostapdIfaceRaw: Array.isArray(r['hostapd-iface-raw'])
          ? (r['hostapd-iface-raw'] as string[]).join('\n')
          : (r['hostapd-iface-raw'] ? String(r['hostapd-iface-raw']) : (r.hostapdIfaceRaw ? String(r.hostapdIfaceRaw) : '')),
        multicast: ratesObj?.multicast !== undefined ? String(ratesObj.multicast) : (r.multicast !== undefined ? String(r.multicast) : 'None'),
        ema: Boolean(heObj?.ema ?? r.ema),
        bssColor: heObj?.['bss-color'] !== undefined ? Number(heObj['bss-color']) : (r.bssColor !== undefined ? Number(r.bssColor) : undefined),
        requireMode: r['require-mode'] ? String(r['require-mode']) : (r.requireMode ? String(r.requireMode) : 'None'),
      };
    });
  }

  // 6. Interfaces
  if (Array.isArray(doc.interfaces) && doc.interfaces.length > 0) {
    detectedSections.push('interfaces');
    const ifaceList = doc.interfaces as Record<string, unknown>[];
    base.interfaces.interfaces = ifaceList.map((iface: Record<string, unknown>, idx: number) => {
      const role: 'upstream' | 'downstream' = iface.role === 'downstream' ? 'downstream' : 'upstream';
      const name = iface.name ? String(iface.name) : (role === 'upstream' ? 'WAN' : `LAN${idx || 1}`);
      const id = iface.id ? String(iface.id) : `iface-${name.toLowerCase()}-${idx + 1}`;

      let ethernet: InterfaceEthernetItem[] | undefined = undefined;
      if (Array.isArray(iface.ethernet)) {
        const ethList = iface.ethernet as Record<string, unknown>[];
        ethernet = ethList.map((eth: Record<string, unknown>) => ({
          selectPorts: Array.isArray(eth['select-ports'] ?? eth.selectPorts)
            ? (((eth['select-ports'] ?? eth.selectPorts) as unknown[]).map(String))
            : [],
          macaddr: eth.macaddr ? String(eth.macaddr) : undefined,
          multicast: Boolean(eth.multicast),
          learning: eth.learning !== undefined ? Boolean(eth.learning) : true,
          isolate: eth.isolate !== undefined ? Boolean(eth.isolate) : undefined,
          reversePath: Boolean(eth['reverse-path'] ?? eth.reversePath),
          vlanTag: String(eth['vlan-tag'] ?? eth.vlanTag ?? 'auto'),
        }));
      }

      const selectPorts: string[] =
        ethernet && ethernet.length > 0
          ? Array.from(new Set(ethernet.flatMap((e) => e.selectPorts)))
          : (Array.isArray(iface['select-ports'] ?? iface.selectPorts)
              ? ((iface['select-ports'] ?? iface.selectPorts) as unknown[]).map(String)
              : []);

      const services: string[] = Array.isArray(iface.services) ? (iface.services as unknown[]).map(String) : [];

      const ipv4Raw = (iface.ipv4 as Record<string, unknown> | undefined) || {};
      const hasDhcp = Boolean(ipv4Raw.dhcp || ipv4Raw['dhcp-leases'] || ipv4Raw.dhcpServer);
      const dhcpRaw = (ipv4Raw.dhcp as Record<string, unknown> | undefined) || {};
      const leasesRaw = Array.isArray(ipv4Raw['dhcp-leases'])
        ? (ipv4Raw['dhcp-leases'] as Record<string, unknown>[])
        : (Array.isArray(dhcpRaw.reservedAddresses) ? (dhcpRaw.reservedAddresses as Record<string, unknown>[]) : []);

      const ipv4 = {
        addressing: (ipv4Raw.addressing || 'dynamic') as 'dynamic' | 'static' | 'none',
        resource: ipv4Raw.resource ? String(ipv4Raw.resource) : undefined,
        subnet: ipv4Raw.subnet ? String(ipv4Raw.subnet) : undefined,
        gateway: ipv4Raw.gateway ? String(ipv4Raw.gateway) : undefined,
        sendHostname: ipv4Raw['send-hostname'] !== undefined ? Boolean(ipv4Raw['send-hostname']) : (ipv4Raw.sendHostname !== undefined ? Boolean(ipv4Raw.sendHostname) : true),
        useDns: Array.isArray(ipv4Raw['use-dns'] ?? ipv4Raw.useDns) ? ((ipv4Raw['use-dns'] ?? ipv4Raw.useDns) as unknown[]).map(String) : undefined,
        dhcpServer: hasDhcp,
        dhcp: {
          leaseFirst: Number(dhcpRaw['lease-first'] ?? dhcpRaw.leaseFirst ?? ipv4Raw['lease-first'] ?? 10),
          leaseCount: Number(dhcpRaw['lease-count'] ?? dhcpRaw.leaseCount ?? ipv4Raw['lease-count'] ?? 100),
          leaseTime: String(dhcpRaw['lease-time'] ?? dhcpRaw.leaseTime ?? ipv4Raw['lease-time'] ?? '6h'),
          relayServer: String(dhcpRaw['relay-server'] ?? dhcpRaw.relayServer ?? ''),
          circuitIdFormat: String(dhcpRaw['circuit-id-format'] ?? dhcpRaw.circuitIdFormat ?? ''),
          remoteIdFormat: String(dhcpRaw['remote-id-format'] ?? dhcpRaw.remoteIdFormat ?? ''),
          reservedAddresses: leasesRaw.map((l: Record<string, unknown>) => ({
            macaddr: String(l.macaddr ?? ''),
            staticLeaseOffset: l['static-lease-offset'] !== undefined ? Number(l['static-lease-offset']) : (l.staticLeaseOffset !== undefined ? Number(l.staticLeaseOffset) : undefined),
            leaseTime: String(l['lease-time'] ?? l.leaseTime ?? '6h'),
            publishHostname: Boolean(l['publish-hostname'] ?? l.publishHostname),
          })),
        },
        dns: Array.isArray(ipv4Raw.dns) ? (ipv4Raw.dns as unknown[]).map(String) : undefined,
        leaseFirst: Number(dhcpRaw['lease-first'] ?? ipv4Raw['lease-first'] ?? 10),
        leaseCount: Number(dhcpRaw['lease-count'] ?? ipv4Raw['lease-count'] ?? 100),
        leaseTime: String(dhcpRaw['lease-time'] ?? ipv4Raw['lease-time'] ?? '6h'),
      };

      const ipv6Raw = (iface.ipv6 as Record<string, unknown> | undefined) || {};
      const dhcpv6Raw = ipv6Raw.dhcpv6 as Record<string, unknown> | undefined;
      const ipv6 = {
        addressing: (ipv6Raw.addressing || 'none') as 'dynamic' | 'static' | 'none',
        resource: ipv6Raw.resource ? String(ipv6Raw.resource) : undefined,
        subnet: ipv6Raw.subnet ? String(ipv6Raw.subnet) : undefined,
        gateway: ipv6Raw.gateway ? String(ipv6Raw.gateway) : undefined,
        prefixSize: ipv6Raw['prefix-size'] !== undefined ? Number(ipv6Raw['prefix-size']) : (ipv6Raw.prefixSize !== undefined ? Number(ipv6Raw.prefixSize) : 64),
        dhcpv6: {
          enabled: Boolean(dhcpv6Raw),
          mode: ((dhcpv6Raw?.mode as string) || 'hybrid') as 'hybrid' | 'stateless' | 'stateful' | 'relay',
          announceDns: Array.isArray(dhcpv6Raw?.['announce-dns'] ?? dhcpv6Raw?.announceDns) ? ((dhcpv6Raw?.['announce-dns'] ?? dhcpv6Raw?.announceDns) as unknown[]).map(String) : [],
          filterPrefix: String(dhcpv6Raw?.['filter-prefix'] ?? dhcpv6Raw?.filterPrefix ?? '::/0'),
        },
      };

      const vlanRaw = (iface.vlan as Record<string, unknown> | undefined) || {};
      const vlan = {
        enabled: Boolean(vlanRaw.id !== undefined || vlanRaw.enabled),
        resource: vlanRaw.resource ? String(vlanRaw.resource) : undefined,
        id: vlanRaw.id !== undefined ? Number(vlanRaw.id) : 1080,
      };

      const tunRaw = (iface.tunnel as Record<string, unknown> | undefined) || {};
      const tunnel = {
        proto: tunRaw.proto ? String(tunRaw.proto) : (tunRaw.peer ? 'mesh' : 'none'),
        resource: tunRaw.resource ? String(tunRaw.resource) : undefined,
        peer: tunRaw.peer ? String(tunRaw.peer) : undefined,
      };

      const ssidsRaw = Array.isArray(iface.ssids) ? (iface.ssids as Record<string, unknown>[]) : [];
      const ssids: SingleSsidConfigItem[] = ssidsRaw.map((s: Record<string, unknown>, sIdx: number) => {
        const sName = s.name ? String(s.name) : `SSID-${sIdx + 1}`;
        const sId = s.id ? String(s.id) : `ssid-${sName.toLowerCase()}-${sIdx + 1}`;
        const bssMode = (s['bss-mode'] || s.bssMode || 'ap') as SingleSsidConfigItem['bssMode'];
        const wifiBands = Array.isArray(s['wifi-bands'] ?? s.wifiBands)
          ? ((s['wifi-bands'] ?? s.wifiBands) as SingleSsidConfigItem['wifiBands'])
          : (['2G', '5G'] as SingleSsidConfigItem['wifiBands']);

        const encRaw = (s.encryption as Record<string, unknown> | undefined) || {};
        let proto = String(encRaw.proto ?? encRaw.protocol ?? s.security ?? 'none').toLowerCase();
        if (proto === 'wpa2-psk' || proto === 'wpa2_psk') proto = 'psk2';
        else if (proto === 'wpa-psk' || proto === 'wpa_psk') proto = 'psk';
        else if (proto === 'wpa3-sae' || proto === 'wpa3_sae') proto = 'sae';
        else if (proto === 'open') proto = 'none';

        const encryption = {
          proto,
          key: String(encRaw.key ?? s.key ?? ''),
          ieee80211w: ((encRaw.ieee80211w ?? s.ieee80211w ?? 'disabled') as 'disabled' | 'optional' | 'required'),
          keyCaching: encRaw['key-caching'] !== undefined ? Boolean(encRaw['key-caching']) : (encRaw.keyCaching !== undefined ? Boolean(encRaw.keyCaching) : true),
        };

        const radRaw = s.radius as Record<string, unknown> | undefined;
        const radius = radRaw
          ? {
              server: radRaw.server ? String(radRaw.server) : undefined,
              port: radRaw.port !== undefined ? Number(radRaw.port) : 1812,
              secret: radRaw.secret ? String(radRaw.secret) : undefined,
              accountingServer: radRaw['accounting-server'] ?? radRaw.accountingServer ? String(radRaw['accounting-server'] ?? radRaw.accountingServer) : undefined,
              accountingPort: radRaw['accounting-port'] ?? radRaw.accountingPort ? Number(radRaw['accounting-port'] ?? radRaw.accountingPort) : undefined,
              accountingSecret: radRaw['accounting-secret'] ?? radRaw.accountingSecret ? String(radRaw['accounting-secret'] ?? radRaw.accountingSecret) : undefined,
            }
          : undefined;

        const ppRaw = (s['pass-point'] || s.passPoint) as Record<string, unknown> | undefined;
        const passPoint = ppRaw
          ? {
              enabled: true,
              venueName: Array.isArray(ppRaw['venue-name'] ?? ppRaw.venueName) ? ((ppRaw['venue-name'] ?? ppRaw.venueName) as unknown[]).map(String) : undefined,
              venueUrl: Array.isArray(ppRaw['venue-url'] ?? ppRaw.venueUrl) ? ((ppRaw['venue-url'] ?? ppRaw.venueUrl) as unknown[]).map(String) : undefined,
              domainName: Array.isArray(ppRaw['domain-name'] ?? ppRaw.domainName) ? ((ppRaw['domain-name'] ?? ppRaw.domainName) as unknown[]).map(String) : undefined,
            }
          : undefined;

        const advRaw = (s.advanced as Record<string, unknown> | undefined) || {};
        const multiPskRaw = Array.isArray(s['multi-psk'])
          ? (s['multi-psk'] as Record<string, unknown>[])
          : (Array.isArray(advRaw.multiPsk) ? (advRaw.multiPsk as Record<string, unknown>[]) : []);
        const advanced = {
          hiddenSsid: Boolean(s['hidden-ssid'] ?? advRaw.hiddenSsid),
          services: Array.isArray(s.services ?? advRaw.services) ? ((s.services ?? advRaw.services) as unknown[]).map(String) : [],
          maximumClients: s['maximum-clients'] !== undefined ? Number(s['maximum-clients']) : (advRaw.maximumClients !== undefined ? Number(advRaw.maximumClients) : 64),
          filsDiscoveryInterval: s['fils-discovery-interval'] !== undefined ? Number(s['fils-discovery-interval']) : (advRaw.filsDiscoveryInterval !== undefined ? Number(advRaw.filsDiscoveryInterval) : 20),
          purpose: s.purpose ? String(s.purpose) : (advRaw.purpose ? String(advRaw.purpose) : ''),
          dtimPeriod: s['dtim-period'] !== undefined ? Number(s['dtim-period']) : (advRaw.dtimPeriod !== undefined ? Number(advRaw.dtimPeriod) : 2),
          isolateClients: Boolean(s['isolate-clients'] ?? advRaw.isolateClients),
          powerSave: Boolean(s['power-save'] ?? advRaw.powerSave),
          broadcastTime: Boolean(s['broadcast-time'] ?? advRaw.broadcastTime),
          unicastConversion: Boolean(s['unicast-conversion'] ?? advRaw.unicastConversion),
          proxyArp: Boolean(s['proxy-arp'] ?? advRaw.proxyArp),
          disassocLowAck: Boolean(s['disassoc-low-ack'] ?? advRaw.disassocLowAck),
          vendorElements: s['vendor-elements'] ? String(s['vendor-elements']) : (advRaw.vendorElements ? String(advRaw.vendorElements) : ''),
          tipInformationElement: s['tip-information-element'] !== undefined ? Boolean(s['tip-information-element']) : (advRaw.tipInformationElement !== undefined ? Boolean(advRaw.tipInformationElement) : true),
          multiPsk: multiPskRaw.map((m: Record<string, unknown>) => ({
            mac: m.mac ? String(m.mac) : undefined,
            key: String(m.key ?? ''),
            vlanId: Number(m['vlan-id'] ?? m.vlanId ?? 0),
          })),
          rrm: Boolean(s.rrm ?? advRaw.rrm),
        };

        const rlRaw = (s['rate-limit'] || s.rateLimit) as Record<string, unknown> | undefined;
        const rateLimit = rlRaw
          ? {
              enabled: true,
              ingressRate: Number(rlRaw['ingress-rate'] ?? rlRaw.ingressRate ?? 0),
              egressRate: Number(rlRaw['egress-rate'] ?? rlRaw.egressRate ?? 0),
            }
          : undefined;

        const rrmRaw = s.rrm as Record<string, unknown> | undefined;
        const rrm = (rrmRaw && typeof rrmRaw === 'object')
          ? {
              enabled: true,
              neighborReporting: Boolean(rrmRaw['neighbor-reporting'] ?? rrmRaw.neighborReporting),
              lci: rrmRaw.lci ? String(rrmRaw.lci) : '',
              civicLocation: rrmRaw['civic-location'] ?? rrmRaw.civicLocation ? String(rrmRaw['civic-location'] ?? rrmRaw.civicLocation) : '',
              ftmResponder: Boolean(rrmRaw['ftm-responder'] ?? rrmRaw.ftmResponder),
              stationaryAp: Boolean(rrmRaw['stationary-ap'] ?? rrmRaw.stationaryAp),
            }
          : undefined;

        const capRaw = (s.captive || s['captive-portal'] || s.captivePortal) as Record<string, unknown> | undefined;
        const captivePortal = (capRaw && typeof capRaw === 'object')
          ? {
              mode: capRaw.mode ? String(capRaw.mode) : 'click-to-continue',
              walledGardenFqdn: Array.isArray(capRaw['walled-garden-fqdn'] ?? capRaw.walledGardenFqdn) ? ((capRaw['walled-garden-fqdn'] ?? capRaw.walledGardenFqdn) as unknown[]).map(String) : [],
              walledGardenIpaddr: Array.isArray(capRaw['walled-garden-ipaddr'] ?? capRaw.walledGardenIpaddr) ? ((capRaw['walled-garden-ipaddr'] ?? capRaw.walledGardenIpaddr) as unknown[]).map(String) : [],
              idleTimeout: capRaw['idle-timeout'] !== undefined ? Number(capRaw['idle-timeout']) : (capRaw.idleTimeout !== undefined ? Number(capRaw.idleTimeout) : undefined),
              sessionTimeout: capRaw['session-timeout'] !== undefined ? Number(capRaw['session-timeout']) : (capRaw.sessionTimeout !== undefined ? Number(capRaw.sessionTimeout) : undefined),
            }
          : undefined;

        const aclRaw = (s['access-control-list'] || s.accessControlList) as Record<string, unknown> | undefined;
        const accessControlList = (aclRaw && typeof aclRaw === 'object')
          ? {
              enabled: true,
              mode: (aclRaw.mode === 'deny' ? 'deny' : 'allow') as 'allow' | 'deny',
              macAddress: Array.isArray(aclRaw['mac-address'] ?? aclRaw.macAddress) ? ((aclRaw['mac-address'] ?? aclRaw.macAddress) as unknown[]).map(String) : [],
            }
          : undefined;

        let roaming: SingleSsidConfigItem['roaming'] = undefined;
        if (s.roaming === true) {
          roaming = { state: 'on', messageExchange: 'air', generatePsk: false };
        } else if (s.roaming && typeof s.roaming === 'object') {
          const roamObj = s.roaming as Record<string, unknown>;
          roaming = {
            state: 'custom',
            messageExchange: ((roamObj['message-exchange'] ?? roamObj.messageExchange ?? 'air') as 'air' | 'ds'),
            generatePsk: Boolean(roamObj['generate-psk'] ?? roamObj.generatePsk),
            domainIdentifier: roamObj['domain-identifier'] ?? roamObj.domainIdentifier ? String(roamObj['domain-identifier'] ?? roamObj.domainIdentifier) : '',
            pmkR0KeyHolder: roamObj['pmk-r0-key-holder'] ?? roamObj.pmkR0KeyHolder ? String(roamObj['pmk-r0-key-holder'] ?? roamObj.pmkR0KeyHolder) : '',
            pmkR1KeyHolder: roamObj['pmk-r1-key-holder'] ?? roamObj.pmkR1KeyHolder ? String(roamObj['pmk-r1-key-holder'] ?? roamObj.pmkR1KeyHolder) : '',
          };
        }

        return {
          id: sId,
          name: sName,
          resource: s.resource ? String(s.resource) : undefined,
          bssMode,
          wifiBands,
          encryption,
          radius,
          passPoint,
          advanced,
          rateLimit,
          rrm,
          captivePortal,
          accessControlList,
          roaming,
        };
      });

      return {
        id,
        name,
        role,
        selectPorts,
        ethernet,
        isolateHosts: Boolean(iface['isolate-hosts'] ?? iface.isolateHosts),
        services,
        hostapdBssRaw: Array.isArray(iface['hostapd-bss-raw'])
          ? ((iface['hostapd-bss-raw'] as unknown[]).map(String)).join('\n')
          : (iface['hostapd-bss-raw'] ? String(iface['hostapd-bss-raw']) : ''),
        ipv4,
        ipv6,
        vlan,
        tunnel,
        ssids,
      };
    });
  }

  // 7. Third Party
  if (doc['third-party'] || doc.thirdParty) {
    detectedSections.push('third-party');
    const tp = doc['third-party'] ?? doc.thirdParty;
    base.thirdParty.customProperties = typeof tp === 'object' && tp !== null ? (tp as Record<string, unknown>) : {};
    base.thirdParty.configuration = JSON.stringify(base.thirdParty.customProperties, null, 2);
  }

  // Desired order of tabs
  const sectionPrecedence: SubsectionKey[] = [
    'interfaces',
    'radios',
    'services',
    'metrics',
    'unit',
    'globals',
    'third-party',
  ];

  base.activeSections = sectionPrecedence.filter((sec) => detectedSections.includes(sec));

  return base;
};

