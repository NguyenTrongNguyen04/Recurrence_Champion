import React from 'react';
import { HomeIcon, BeakerIcon, PlayIcon, ChartBarIcon, ClockIcon, CogIcon } from './components/icons/Icons';

export const NAV_ITEMS = [
  { path: '/home', label: 'Home', icon: <HomeIcon /> },
  { path: '/analyze', label: 'Analyze', icon: <BeakerIcon /> },
  { path: '/runs', label: 'Test Runs', icon: <PlayIcon /> },
  { path: '/dashboard', label: 'Dashboard', icon: <ChartBarIcon /> },
  { path: '/history', label: 'History', icon: <ClockIcon /> },
  { path: '/settings', label: 'Settings', icon: <CogIcon /> },
];
