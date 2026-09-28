/**
 * Single Source of Truth for Mango Cloud Theme Colors
 * Extracted directly from Figma design export (/home/iotina/Downloads/src)
 * 
 * To change any color across the entire application, simply modify the hex value here.
 * All Chakra UI components, design tokens, and CSS variables derive from this file.
 */
export const themeColors = {
  // Brand & Action Colors
  brand: {
    // Primary Action Green (e.g. .primary { background: #078429; color: #fff; })
    primary: '#078429',
    primaryHover: '#067022',
    primaryActive: '#055c1c',
    primaryLight: '#f0fbf2',

    // Interactive Action Blue (e.g. .tabs button.on:after { background: #0869ff; }, .assign, links)
    accent: '#0869ff',
    accentHover: '#0654cc',
    accentActive: '#0763dc',
    accentLight: '#f6faff',
    accentBorder: '#b8d1f7',

    // Mango Brand Logo (.mango gradient and leaf)
    mangoGradientStart: '#ffcf22',
    mangoGradientEnd: '#ff9500',
    mangoLeaf: '#1a9c52',
  },

  // Navigation Sidebar (.sidebar gradient: linear-gradient(150deg, #031d3c, #002b55))
  sidebar: {
    bg: '#031d3c',
    bgGradientStart: '#031d3c',
    bgGradientEnd: '#002b55',
    activeBg: '#24558a', // .navgroup button.active
    hoverBg: '#0e3766',
    border: '#1e293b',
    text: '#ffffff',
    categoryText: '#b9c8d9', // .navgroup p
    icon: '#ffffff',
    collapseIcon: '#ffffff',
  },

  // Canvas & Surfaces
  canvas: {
    bg: '#f8fafc', // :root background
    mainBg: '#ffffff', // main canvas background
  },

  // Panel & Card Surfaces (.panel { border: 1px solid #d7dce4; background: #fff; })
  panel: {
    bg: '#ffffff',
    border: '#d7dce4',
    header: '#101624',
    divider: '#e0e4ea',
  },

  // Typography Colors
  text: {
    title: '#070b13', // header h1
    primary: '#111b31', // :root color
    secondary: '#475569', // header p, stat span, small
    muted: '#65758b', // label small
    subtle: '#536177', // assignment small, detail-head p
    required: '#e21b2f', // label > b required asterisk
    inverse: '#ffffff', // buttons / dark surfaces
    link: '#0665e9', // text links
  },

  // Form Controls & Inputs
  input: {
    bg: '#ffffff',
    border: '#cdd5df', // input, select, textarea border
    filterBorder: '#ccd3dd', // .filters label border
    focusOutline: '#176cff', // input:focus outline
    placeholder: '#94a3b8',
    cancelBg: '#ffffff',
    cancelBorder: '#cdd5df',
    iconBtnBorder: '#cbd5e1', // .icon-btn
  },

  // Status Badges (.status { border: 1px solid #a6ddb1; background: #f0fbf2; color: #167930; })
  status: {
    active: {
      bg: '#f0fbf2',
      text: '#167930',
      border: '#a6ddb1',
    },
    suspended: {
      bg: '#f5f6f8',
      text: '#475569',
      border: '#d4dae2',
    },
    pending: {
      bg: '#fef3c7',
      text: '#b45309',
      border: '#fde68a',
    },
    error: {
      bg: '#fee2e2',
      text: '#b91c1c',
      border: '#fecaca',
    },
  },

  // KPI Metric Stat Cards (.stat { border: 1px solid #d9dee6; })
  kpi: {
    border: '#d9dee6',
    totalUsers: '#0666ed', // .stat-icon
    activeUsers: '#159b44', // .stat-icon.green
    suspendedUsers: '#ff7300', // .stat-icon.orange
    mfaEnabled: '#6814c7', // .stat-icon.purple
  },

  // Architecture & Effective Access Banners (.info-banner, .notice)
  infoBanner: {
    bg: '#f6faff',
    border: '#b8d1f7',
    iconBorder: '#76a9fa',
    iconColor: '#0768fb',
    arrowColor: '#94a3b8',
  },
  notice: {
    bg: '#f2f7ff',
    border: '#7dafef',
    text: '#111b31',
  },

  // User Avatars (.avatar.blue, .purple, .teal, .orange, .green)
  avatar: {
    blue: '#1262dd',
    purple: '#7b28d5',
    teal: '#0b9ca1',
    orange: '#f47b05',
    green: '#269c37',
  },

  // Scoped Access Assignments & Buttons (.assignment, .assign)
  assignment: {
    border: '#cdd5df',
    pillBg: '#f3f7ff',
    pillText: '#0763dc',
    pillBorder: '#bcd2f8',
    assignDashedBorder: '#0871ff', // .assign
    assignText: '#0763dc',
  },

  // Table Row Selection & Highlights
  table: {
    rowBorder: '#e0e4ea',
    selectedBg: '#fbfdff',
    selectedBorder: '#5a96ff', // .table .selected
    headerText: '#111b31',
  },

  // Modal Dialogs (.modal-backdrop { background: rgba(5,12,23,.54); })
  modal: {
    backdrop: 'rgba(5, 12, 23, 0.54)',
    bg: '#ffffff',
    border: '#dce1e7',
    icon: '#0769f8',
    toggleActive: '#0872ff', // .toggle-card i
  },

  // Policy Resource Permissions Badges (.resource-row em)
  policyActions: {
    read: {
      bg: '#edf5ff',
      text: '#0967e6',
      border: '#8bb9ff',
    },
    create: {
      bg: '#f0fbf3',
      text: '#137a36',
      border: '#8dcda1',
    },
    update: {
      bg: '#fff4f0',
      text: '#f05f2b',
      border: '#f4a88d',
    },
  },
} as const;

export type ThemeColors = typeof themeColors;
