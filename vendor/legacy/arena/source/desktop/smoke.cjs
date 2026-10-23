'use strict';
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {randomUUID} = require('node:crypto');
const env = {...process.env};
delete env.ELECTRON_RUN_AS_NODE;
const temporaryReport = path.join(os.tmpdir(), 'pokemon-arena-smoke-' + randomUUID() + '.json');
env.ARENA_SMOKE_REPORT = temporaryReport;
const binary = process.argv[2] ? path.resolve(process.argv[2]) : require('electron');
const args = process.argv[2] ? ['--arena-smoke-test'] : ['.', '--arena-smoke-test'];
const result = spawnSync(binary, args, {cwd: path.join(__dirname, '..'), env, encoding: 'utf8', timeout: 170000, windowsHide: true});
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
if (result.error) console.error(result.error.message);
let report;
try { report = JSON.parse(fs.readFileSync(temporaryReport, 'utf8')); }
catch { console.error('Desktop application did not produce a smoke-test report.'); }
finally { if (fs.existsSync(temporaryReport)) fs.unlinkSync(temporaryReport); }
if (result.status !== 0 || report?.ok !== true) process.exit(1);
if (!result.stdout?.includes('ARENA_DESKTOP_SMOKE')) console.log('ARENA_DESKTOP_SMOKE ' + JSON.stringify(report));
