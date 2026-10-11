// Public submission API. The gateway verifies the public anon JWT.
// Service-role credentials exist only in Supabase runtime secrets.
const origin = 'https://study-navi.github.io';
const allowed = new Set(['name','contact','platform','agency','profile_url','colors','bg','ng_color','mood','motif','motif_other','ng_motif','font','layout','reference','features','features_other','deadline','assets','message','consent','input_mode','color_notes','bg_notes','mood_notes','font_notes','layout_notes','platform_other','deadline_other','assets_other']);
const lists = new Set(['platform','colors','mood','motif','features']);
Deno.serve(async req => {
 const headers = {'Content-Type':'application/json','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store','Vary':'Origin'};
 const reply = (v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers});
 if(req.headers.get('origin') && req.headers.get('origin')!==origin)return reply({error:'この送信元は許可されていません'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'送信方法が違います'},405);
 if(Number(req.headers.get('content-length')||0)>30000)return reply({error:'入力が長すぎます'},413);
 try {
  const raw=await req.text();if(new TextEncoder().encode(raw).length>30000)return reply({error:'入力が長すぎます'},413);
  const {id,data,website}=JSON.parse(raw);
  if(website)return reply({error:'入力内容を確認してください'},400);
  if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return reply({error:'受付番号が不正です'},400);
  if(!data||typeof data!=='object'||Array.isArray(data)||data.consent!==true)return reply({error:'同意・入力内容を確認してください'},400);
  if(new TextEncoder().encode(JSON.stringify(data)).length>22000)return reply({error:'全体の入力内容が長すぎます。文章を少し短くしてください'},413);
  for(const [key,value] of Object.entries(data)){
   if(!allowed.has(key))return reply({error:'入力項目が不正です'},400);
   if(key==='consent')continue;
   if(lists.has(key)){if(!Array.isArray(value)||value.length>(key==='colors'?3:24)||value.some(x=>typeof x!=='string'||x.length>150))return reply({error:'選択内容が不正です'},400);}
   else if(typeof value!=='string'||value.length>(['message','reference','features_other','motif_other','color_notes','bg_notes','mood_notes','font_notes','layout_notes','platform_other','deadline_other','assets_other'].includes(key)?3000:key==='profile_url'?2000:300))return reply({error:'入力が長すぎます'},400);
  }
  if(typeof data.name!=='string'||!data.name.trim()||data.name.length>100||typeof data.contact!=='string'||!data.contact.trim())return reply({error:'活動名と連絡先は必須です'},400);
  if(data.profile_url&&!/^https?:\/\//i.test(data.profile_url))return reply({error:'プロフィールURLを確認してください'},400);
  const url=Deno.env.get('SUPABASE_URL')!;const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth={apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json'};
  const db=async(path:string,init:RequestInit={})=>{const r=await fetch(url+'/rest/v1/'+path,{...init,headers:{...auth,...init.headers}});if(!r.ok)throw new Error('db');return r;};
  // Retry receipt: UUID and exact data must match. Never return another answer.
  const prior=await (await db('hp_requests?id=eq.'+id+'&select=id,created_at,data')).json();
  const canonical=(o:Record<string,unknown>)=>JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a],[b])=>a.localeCompare(b))));
  if(prior.length){if(canonical(prior[0].data)!==canonical(data))return reply({error:'同じ受付番号で内容が変わっています'},409);return reply({id:prior[0].id,created_at:prior[0].created_at});}
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('cf-connecting-ip')||'unknown';
  const ipHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret+ip)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const recent=await db('hp_requests?ip_hash=eq.'+ipHash+'&created_at=gte.'+encodeURIComponent(new Date(Date.now()-3600000).toISOString())+'&select=id&limit=11');
  if((await recent.json()).length>=10)return reply({error:'送信回数が多いため、1時間ほど待ってお試しください'},429);
  const result=await (await db('hp_requests?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify({id,data,ip_hash:ipHash})})).json();
  const row=result[0]|| (await (await db('hp_requests?id=eq.'+id+'&select=id,created_at,data')).json())[0];
  if(!row||canonical(row.data)!==canonical(data))return reply({error:'保存結果を確認できませんでした'},409);
  return reply({id:row.id,created_at:row.created_at},201);
 }catch{return reply({error:'保存できませんでした。通信を確認して再送してください'},503);}
});
