#!/usr/bin/env node
/**
 * Start a single Expo Metro server for student or teacher.
 * Android, iOS, and web clients that connect to this server all receive
 * the same bundle and hot-reload together when you save files.
 *
 * Usage:
 *   node scripts/start-expo-unified.mjs student
 *   node scripts/start-expo-unified.mjs student --ios --android --web
 *   node scripts/start-expo-unified.mjs teacher --ios --android
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appArg = process.argv.find((arg) => arg === 'student' || arg === 'teacher');
const app = appArg ?? 'student';
const platformFlags = process.argv.filter((arg) => ['--ios', '--android', '--web'].includes(arg));

const ports = { student: 8081, teacher: 8082 };
const port = ports[app];
const cwd = path.join(root, 'apps/mobile', app);

const args = ['expo', 'start', '--port', String(port), '--clear', '--lan', ...platformFlags];

console.log('');
console.log(`▶ ${app} app · Metro on port ${port}`);
console.log('  One bundler updates Android, iOS, and web at the same time.');
if (platformFlags.length === 0) {
  console.log('  Press i (iOS), a (Android), or w (web) in this terminal to open clients.');
} else {
  console.log(`  Opening: ${platformFlags.join(', ')}`);
}
console.log('');

const child = spawn('npx', args, { cwd, stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 0));
