'use strict';
const CACHE='hp-request-sheet-v1.2.1';
const FILES=['./','index.html','app.css?v=1.2.1','config.js','manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hp-request-sheet-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);
 // Never cache API, auth, admin pages or third-party resources.
 if(event.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.includes('admin'))return;
 if(!FILES.some(f=>new URL(f,self.registration.scope).pathname===u.pathname))return;
 event.respondWith(fetch(event.request,{cache:'no-cache'}).then(r=>{if(r.ok){const copy=r.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(event.request,copy)));}return r;}).catch(async()=>{const cached=await caches.match(event.request);if(cached)return cached;if(event.request.mode==='navigate')return caches.match(new URL('index.html',self.registration.scope));throw new Error('offline');}));
});
