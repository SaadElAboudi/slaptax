import {createHash} from 'node:crypto';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';

// Shared gameplay and frontend inputs; backend code has its own test/release gate.
const inputs = ['src', 'public', '../shared', 'index.html', 'package.json', 'package-lock.json',
    'vite.config.ts', 'capacitor.config.ts', 'tsconfig.json', 'scripts'];

export function treeEntries(root, excluded = []) {
    const entries = [];
    function visit(relative) {
        if (excluded.includes(relative)) return;
        const absolute = join(root, relative);
        if (statSync(absolute).isDirectory()) {
            for (const name of readdirSync(absolute).sort()) visit(relative ? `${relative}/${name}` : name);
        } else {
            entries.push([relative, createHash('sha256').update(readFileSync(absolute)).digest('hex')]);
        }
    }
    visit('');
    return entries;
}

function digest(entries) {
    return createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

export function treeDigest(root, excluded = []) {
    return digest(treeEntries(root, excluded));
}

export function sourceDigest(root) {
    return digest(inputs.flatMap(input => treeEntries(join(root, input))
        .map(([path, hash]) => [`${input}/${path}`, hash])));
}
