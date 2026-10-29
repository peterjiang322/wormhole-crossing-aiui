import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {fileURLToPath} from 'node:url';
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
let checks=0;function check(ok,message){checks++;if(!ok)throw Error(message);}
const config=JSON.parse(fs.readFileSync('app/app.json','utf8'));check(Array.isArray(config.permissions)&&config.permissions.length===0,'offline game must not request unrelated permissions');
check(config.pages.length===1,'single page route');for(const route of config.pages)check(fs.existsSync('app/'+route+'.ink'),'missing route');check(fs.existsSync('app/'+config.icon),'missing icon');
for(const file of walk('app').filter(f=>/\.(js|ink)$/.test(f))){let source=fs.readFileSync(file,'utf8'),js=source;
 if(file.endsWith('.ink')){
  const parts=Object.fromEntries(['script def','script setup','page','style'].map(tag=>[tag,source.match(new RegExp('<'+tag+'>([\\s\\S]*?)<\\/'+tag.split(' ')[0]+'>'))?.[1]]));
  check(Object.values(parts).every(Boolean),'ink requires four blocks');JSON.parse(parts['script def']);js=parts['script setup'];
  check(!/\bwx:|\bv-if|\bv-for/.test(parts.page),'use ink: directives');
  check(!/(?:^|[;{\s])(?:animation(?:-[\w-]+)?|visibility|font-variant|white-space|word-break)\s*:|position\s*:\s*sticky/.test(parts.style),'unsupported WXSS');
  for(const [,event]of parts.page.matchAll(/bindtap="(\w+)"/g))check(new RegExp('\\b'+event+'\\s*\\(').test(js),'missing event '+event);
  check(parts.page.includes('left: {{menuTrackLeft}}px')&&!parts.page.includes('scroll-into-view='),'numeric translated menu rail');
 }
 new vm.SourceTextModule(js,{identifier:file});checks++;
 for(const [,importPath]of js.matchAll(/from\s*['"]([^'"]+)['"]/g))if(importPath.startsWith('.'))check(fs.existsSync(path.resolve(path.dirname(file),importPath)),'missing import '+file+' '+importPath);
 check(!/\b(?:window|document|requestAnimationFrame|AudioContext|localStorage)\b/.test(js),'browser-only API in native source '+file);
}
for(const file of ['gate.wav','finish.wav'])check(fs.existsSync('app/assets/'+file),'missing sound');
check(fs.readFileSync('app/lib/imu.js','utf8').includes('sampleNod'),'missing complete nod handling');
const menu=fs.readFileSync('app/lib/menu-controller.js','utf8');check(menu.includes('menuScrollLeft'),'menu asset needs numeric scrolling');
if(fs.existsSync('marketing/product.json')){
 const product=JSON.parse(fs.readFileSync('marketing/product.json','utf8'));
 check(product.usps.length===3,'exactly 3 truthful USPs');check(product.intentDescription===config.agentPrompt,'intent/app metadata mismatch');check(fs.readFileSync('marketing/intent.md','utf8').trim()===config.agentPrompt,'intent document mismatch');
 for(const file of ['intro.md','xiaohongshu.md','cover.png','cover-prompt.txt','logo-prompt.txt'])check(fs.existsSync('marketing/'+file),'missing marketing '+file);
}
fs.mkdirSync('verification',{recursive:true});fs.writeFileSync('verification/static-checks.json',JSON.stringify({checks,passed:true,level:'L1 source checks; not device validation',permissions:config.permissions},null,2)+'\n');console.log('Static checks passed: '+checks);
