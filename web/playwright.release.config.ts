import {defineConfig} from '@playwright/test';
import base from './playwright.config';

process.env.APP_DISTRIBUTION='store';

// Public launch journeys. Historical specs for retired games and replaced menus
// remain available through the default config; their engines stay in npm test.
export default defineConfig({...base,
 testMatch:[
  'admin.spec.ts','arena-controls.spec.ts','arena-reconnect.spec.ts','arena-entry.spec.ts','arena-reliability.spec.ts',
  'asyncChroma.spec.ts','chroma.spec.ts','cinematic.spec.ts','drawing.spec.ts',
  'friend-vision.spec.ts','friend-night.spec.ts','solo-rewards.spec.ts','factory-world.spec.ts','gameplay-stability.spec.ts','home-ux.spec.ts',
  'mobile-catalog.spec.ts','mobile-readiness.spec.ts','phase2.spec.ts',
  'realtime-recovery.spec.ts','robot-practice.spec.ts','selection.spec.ts',
  'snack-teams.spec.ts','survival.spec.ts','table.spec.ts','tokens.spec.ts',
  'tower-combo.spec.ts',
 ],
});
