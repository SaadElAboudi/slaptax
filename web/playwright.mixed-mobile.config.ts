import {defineConfig} from '@playwright/test';
import base from './playwright.config';

export default defineConfig({...base,
 testMatch:'mixed-mobile-duel.spec.ts',
 testIgnore:[],
 timeout:100000,
 projects:[{name:'webkit-chromium'}],
});
