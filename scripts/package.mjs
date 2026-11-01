import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
function run(command,args){const result=spawnSync(command,args,{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
run(process.execPath,['--experimental-vm-modules','scripts/check.mjs']);run(process.execPath,['--test',...fs.readdirSync('tests').filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/'+f)]);
fs.mkdirSync('dist',{recursive:true});const cli='node_modules/.bin/aix';if(!fs.existsSync(cli))throw Error('Run npm ci to install the pinned AIX CLI.');
run(cli,['pack','app','-o','dist/wormhole-crossing.aix','--engine','^0.19.1']);run(cli,['list','dist/wormhole-crossing.aix']);
run('python3',['scripts/source-zip.py']);
const artifact='dist/wormhole-crossing.aix',binary=fs.readFileSync(artifact);fs.writeFileSync('verification/package.json',JSON.stringify({tool:'@yodaos-pkg/aix-cli 0.10.1',engine:'^0.19.1',file:artifact,bytes:binary.length,sha256:createHash('sha256').update(binary).digest('hex'),deviceTested:false},null,2)+'\n');console.log('Real AIX artifact ready: '+binary.length+' bytes');
