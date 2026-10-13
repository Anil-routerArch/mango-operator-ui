import type { ConfigurationSectionsState } from './types';

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
    bands: [
      {
        id: 'radio-2g',
        band: '2G',
        bandwidth: 5,
        country: 'US',
        channelMode: 'HT',
        channelWidth: 20,
        channel: 'auto',
        mimo: 'None',
        txPower: 20,
        legacyRates: false,
        maximumClients: 64,
        multipleBssid: false,
        allowDfs: true,
        beaconRate: 'None',
        beaconInterval: 100,
        hostapdIfaceRaw: '',
        multicast: 'None',
        ema: false,
        requireMode: 'None',
      },
      {
        id: 'radio-5g',
        band: '5G',
        bandwidth: 5,
        country: 'US',
        channelMode: 'HE',
        channelWidth: 80,
        channel: 'auto',
        mimo: 'None',
        txPower: 20,
        legacyRates: false,
        maximumClients: 64,
        multipleBssid: false,
        allowDfs: true,
        beaconRate: 'None',
        beaconInterval: 100,
        hostapdIfaceRaw: '',
        multicast: 'None',
        ema: false,
        requireMode: 'None',
      },
    ],
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
        'device-name': u.beaconAdvertisement.deviceName,
        'device-serial': u.beaconAdvertisement.deviceSerial,
        'network-id': u.beaconAdvertisement.networkId,
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
        minimumAge: s.fingerprint.minimumAge,
        maximumAge: s.fingerprint.maximumAge,
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
