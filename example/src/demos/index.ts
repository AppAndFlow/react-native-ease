import type { ComponentType } from 'react';

import { BackgroundColorDemo } from './BackgroundColorDemo';
import { BannerDemo } from './BannerDemo';
import { BorderRadiusDemo } from './BorderRadiusDemo';
import { ButtonDemo } from './ButtonDemo';
import { CombinedDemo } from './CombinedDemo';
import { ComparisonDemo } from './ComparisonDemo';
import { CustomEasingDemo } from './CustomEasingDemo';
import { DelayDemo } from './DelayDemo';
import { EnterDemo } from './EnterDemo';
import { ExitDemo } from './ExitDemo';
import { FadeDemo } from './FadeDemo';
import { InterruptDemo } from './InterruptDemo';
import { PulseDemo } from './PulseDemo';
import { RotateDemo } from './RotateDemo';
import { ScaleDemo } from './ScaleDemo';
import { SlideDemo } from './SlideDemo';
import { StyleReRenderDemo } from './StyleReRenderDemo';
import { StyledCardDemo } from './StyledCardDemo';
import { TransformOriginDemo } from './TransformOriginDemo';

interface DemoEntry {
  component: ComponentType;
  title: string;
  section: string;
}

export const demos: Record<string, DemoEntry> = {
  'button': { component: ButtonDemo, title: 'Button', section: 'Basic' },
  'fade': { component: FadeDemo, title: 'Fade', section: 'Basic' },
  'slide': { component: SlideDemo, title: 'Slide', section: 'Basic' },
  'enter': { component: EnterDemo, title: 'Enter', section: 'Basic' },
  'exit': { component: ExitDemo, title: 'Exit', section: 'Basic' },
  'rotate': { component: RotateDemo, title: 'Rotate', section: 'Transform' },
  'scale': { component: ScaleDemo, title: 'Scale', section: 'Transform' },
  'transform-origin': {
    component: TransformOriginDemo,
    title: 'Transform Origin',
    section: 'Transform',
  },
  'custom-easing': {
    component: CustomEasingDemo,
    title: 'Custom Easing',
    section: 'Timing',
  },
  'delay': { component: DelayDemo, title: 'Delay', section: 'Timing' },
  'combined': { component: CombinedDemo, title: 'Combined', section: 'Timing' },
  'styled-card': {
    component: StyledCardDemo,
    title: 'Styled Card',
    section: 'Style',
  },
  'border-radius': {
    component: BorderRadiusDemo,
    title: 'Border Radius',
    section: 'Style',
  },
  'background-color': {
    component: BackgroundColorDemo,
    title: 'Background Color',
    section: 'Style',
  },
  'style-rerender': {
    component: StyleReRenderDemo,
    title: 'Style Re-Render',
    section: 'Style',
  },
  'pulse': { component: PulseDemo, title: 'Pulse', section: 'Loop' },
  'banner': { component: BannerDemo, title: 'Banner', section: 'Loop' },
  'interrupt': {
    component: InterruptDemo,
    title: 'Interrupt',
    section: 'Advanced',
  },
  'comparison': {
    component: ComparisonDemo,
    title: 'Comparison',
    section: 'Advanced',
  },
};

interface SectionData {
  title: string;
  data: { key: string; title: string }[];
}

const sectionOrder = [
  'Basic',
  'Transform',
  'Timing',
  'Style',
  'Loop',
  'Advanced',
];

export function getDemoSections(): SectionData[] {
  const grouped = new Map<string, { key: string; title: string }[]>();

  for (const [key, entry] of Object.entries(demos)) {
    const list = grouped.get(entry.section) ?? [];
    list.push({ key, title: entry.title });
    grouped.set(entry.section, list);
  }

  return sectionOrder
    .filter((s) => grouped.has(s))
    .map((s) => ({ title: s, data: grouped.get(s)! }));
}
