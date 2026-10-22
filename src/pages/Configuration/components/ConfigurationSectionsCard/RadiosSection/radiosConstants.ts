import type { SingleRadioConfigItem } from '../types';

export const RADIO_BANDS: SingleRadioConfigItem['band'][] = [
  '2G',
  '5G',
  '5G-lower',
  '5G-upper',
  '6G',
];

export const BANDWIDTHS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
];

export const CHANNEL_MODES = [
  { value: 'HT', label: 'HT (A,B,G,N)' },
  { value: 'VHT', label: 'VHT (A,B,G,N,AC)' },
  { value: 'HE', label: 'HE (WiFi 6,A,B,G,N,AC,AX)' },
];

export const CHANNEL_WIDTHS = [
  { value: 20, label: '20 MHz' },
  { value: 40, label: '40 MHz' },
  { value: 80, label: '80 MHz' },
  { value: 160, label: '160 MHz' },
];

export const MIMOS = [
  { value: 'None', label: 'None' },
  { value: '1x1', label: '1x1' },
  { value: '2x2', label: '2x2' },
  { value: '3x3', label: '3x3' },
  { value: '4x4', label: '4x4' },
  { value: '5x5', label: '5x5' },
  { value: '6x6', label: '6x6' },
  { value: '7x7', label: '7x7' },
  { value: '8x8', label: '8x8' },
];

export const RATE_OPTIONS = [
  { value: 'None', label: 'None (Empty value)' },
  { value: '1000', label: '1000' },
  { value: '2000', label: '2000' },
  { value: '5500', label: '5500' },
  { value: '6000', label: '6000' },
  { value: '9000', label: '9000' },
  { value: '11000', label: '11000' },
  { value: '12000', label: '12000' },
  { value: '18000', label: '18000' },
  { value: '24000', label: '24000' },
  { value: '36000', label: '36000' },
  { value: '48000', label: '48000' },
  { value: '54000', label: '54000' },
];

export const REQUIRE_MODES = [
  { value: 'None', label: 'None' },
  { value: 'HT', label: 'HT (A,B,G,N)' },
  { value: 'VHT', label: 'VHT (A,B,G,N,AC)' },
  { value: 'HE', label: 'HE (WiFi 6,A,B,G,N,AC,AX)' },
];

export type ChannelsMap = {
  '2G': number[];
  '5G': Record<number, number[]>;
  '5G-lower': Record<number, number[]>;
  '5G-upper': Record<number, number[]>;
  '6G': Record<number, number[]>;
};

// Comprehensive Wi-Fi Channels database across all bands and channel bandwidths
export const CHANNELS: ChannelsMap = {
  // 2.4 GHz includes all standard channels (1 through 14)
  '2G': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  '5G': {
    20: [
      36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144,
      149, 153, 157, 161, 165, 169, 173, 177,
    ],
    40: [
      36, 38, 44, 46, 52, 54, 60, 62, 100, 102, 108, 110, 116, 118, 124, 126, 132, 134, 140, 142,
      149, 151, 157, 159, 165, 167, 173, 175, 184, 192,
    ],
    80: [36, 42, 52, 58, 100, 106, 116, 122, 132, 138, 149, 155, 171],
    160: [50, 114, 163],
  },
  '5G-lower': {
    20: [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144],
    40: [38, 46, 54, 62, 63, 102, 110, 118, 126, 134, 142],
    80: [42, 58, 106, 122, 138],
    160: [50, 114],
  },
  '5G-upper': {
    20: [149, 153, 157, 161, 165, 169, 173, 177],
    40: [151, 159, 167, 175],
    80: [155, 171],
    160: [163],
  },
  '6G': {
    20: [
      1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65, 69, 73, 77, 81, 85, 89, 93, 97, 101, 105, 109,
      113, 117, 121, 125, 129, 133, 137, 141, 145, 149, 153, 157, 161, 165, 169, 173, 177, 181, 185, 189, 193, 197, 201,
      205, 209, 213, 217, 221, 225, 229, 233,
    ],
    40: [
      3, 11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99, 107, 115, 123, 131, 139, 147, 155, 163, 171, 179, 187, 195, 203,
      211, 219, 227,
    ],
    80: [7, 23, 39, 55, 71, 87, 103, 119, 135, 151, 167, 183, 199, 215],
    160: [15, 47, 79, 111, 143, 175, 207],
  },
};

export const getChannelOptionsForBand = (
  band: SingleRadioConfigItem['band'],
  channelWidth: number
): (string | number)[] => {
  let options: (string | number)[] = ['auto'];

  if (band === '2G') {
    options = [...options, ...CHANNELS['2G']];
  } else if (band === '5G-lower') {
    const list = CHANNELS['5G-lower'][channelWidth] || CHANNELS['5G-lower'][20];
    options = [...options, ...list];
  } else if (band === '5G-upper') {
    const list = CHANNELS['5G-upper'][channelWidth] || CHANNELS['5G-upper'][20];
    options = [...options, ...list];
  } else if (band === '5G') {
    const list = CHANNELS['5G'][channelWidth] || CHANNELS['5G'][20];
    options = [...options, ...list];
  } else if (band === '6G') {
    const list = CHANNELS['6G'][channelWidth] || CHANNELS['6G'][20];
    options = [...options, ...list];
  }

  // Ensure unique channels and auto is first, remaining numbers sorted ascending
  const uniqueChannels = Array.from(new Set(options));
  const numericChannels = uniqueChannels
    .filter((c) => c !== 'auto')
    .sort((a, b) => Number(a) - Number(b));

  return ['auto', ...numericChannels];
};
