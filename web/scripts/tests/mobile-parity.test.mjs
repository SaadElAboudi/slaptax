import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sourceDigest, treeDigest} from '../mobile-provenance.mjs';
import {verifyMobileParity} from '../mobile-parity.mjs';

function fixture(t) {
    const base = mkdtempSync(join(tmpdir(), 'slaptax-parity-'));
    t.after(() => rmSync(base, {recursive: true, force: true}));
    const root = join(base, 'web');
    for (const dir of ['src', 'public', 'scripts', 'dist-mobile']) mkdirSync(join(root, dir), {recursive: true});
    mkdirSync(join(base, 'shared'));
    for (const file of ['index.html', 'package.json', 'package-lock.json', 'vite.config.ts', 'capacitor.config.ts', 'tsconfig.json']) {
        writeFileSync(join(root, file), '{}');
    }
    writeFileSync(join(base, 'shared/game-selection.json'), '["pie"]');
    writeFileSync(join(root, 'src/game.ts'), 'initial gameplay');
    writeFileSync(join(root, 'dist-mobile/index.html'), 'bundled app');
    writeFileSync(join(root, 'dist-mobile/mobile-build.json'), JSON.stringify({
        sourceHash: sourceDigest(root), bundleHash: treeDigest(join(root, 'dist-mobile')),
    }));
    for (const path of ['ios/App/App/public', 'android/app/src/main/assets/public']) {
        cpSync(join(root, 'dist-mobile'), join(root, path), {recursive: true});
        writeFileSync(join(root, path, 'cordova.js'), 'generated bridge');
    }
    return root;
}

test('identical Android and iOS bundles pass, generated bridges are allowed', t => {
    assert.ok(verifyMobileParity(fixture(t)).sourceHash);
});
test('uncommitted gameplay edits invalidate the native build', t => {
    const root = fixture(t);
    writeFileSync(join(root, 'src/game.ts'), 'changed gameplay');
    assert.throws(() => verifyMobileParity(root), /sources changed/);
});
test('adding a shared game invalidates the native build', t => {
    const root = fixture(t);
    writeFileSync(join(root, '../shared/new-game.json'), '{"id":"new"}');
    assert.throws(() => verifyMobileParity(root), /sources changed/);
});
test('altered build content is rejected', t => {
    const root = fixture(t);
    writeFileSync(join(root, 'dist-mobile/index.html'), 'wrong bundle');
    assert.throws(() => verifyMobileParity(root), /build content changed/);
});
for (const platform of ['ios/App/App/public', 'android/app/src/main/assets/public']) {
    test(`stale or extra assets in ${platform} are rejected`, t => {
        const root = fixture(t);
        writeFileSync(join(root, platform, 'stale.js'), 'old game');
        assert.throws(() => verifyMobileParity(root), /differs from the current mobile build/);
    });
}
