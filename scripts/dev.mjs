import { spawn } from 'node:child_process';
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const child = spawn('python3', ['-m', 'http.server', '--bind', option('--host', '127.0.0.1'), option('--port', '4173')], { stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code ?? 0; });
