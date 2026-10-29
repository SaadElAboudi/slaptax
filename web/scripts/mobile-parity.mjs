import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceDigest, treeDigest} from './mobile-provenance.mjs';

export function verifyMobileParity(root) {
    const bundle = resolve(root, 'dist-mobile');
    const manifest = JSON.parse(readFileSync(resolve(bundle, 'mobile-build.json'), 'utf8'));
    if (manifest.sourceHash !== sourceDigest(root)) {
        throw new Error('Native assets are stale: sources changed. Run npm run mobile:sync.');
    }
    if (manifest.bundleHash !== treeDigest(bundle, ['mobile-build.json'])) {
        throw new Error('Mobile build content changed. Run npm run mobile:sync.');
    }
    const expected = treeDigest(bundle);
    // Capacitor may add these generated bridge files when copying the web bundle.
    const bridgeFiles = ['capacitor.js', 'capacitor.js.map', 'cordova.js', 'cordova_plugins.js'];
    for (const path of ['ios/App/App/public', 'android/app/src/main/assets/public']) {
        if (treeDigest(resolve(root, path), bridgeFiles) !== expected) {
            throw new Error(`${path} differs from the current mobile build. Run npm run mobile:sync.`);
        }
    }
    return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        const result = verifyMobileParity(fileURLToPath(new URL('..', import.meta.url)));
        console.log(`PASS shared sources → mobile bundle → Android + iOS (${result.sourceHash.slice(0, 12)})`);
    } catch (error) {
        console.error(`BLOCKED ${error.message}`);
        process.exitCode = 1;
    }
}
