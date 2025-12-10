/* ===========================================================
   FlyClash Converter PRO Edition
   Creator: Itsbad-
   Version: 1.0-PRO
   ===========================================================
   Fitur Utama:
   - Full Protocol Parser (VLESS/VMESS/TROJAN/SS)
   - Auto Best Ping (url-test)
   - Load Balance PRO
   - Failover & Fallback Chain
   - Auto Host/SNI/Path Fix
   - DNS Mode: Normal, ISP Optimized, Custom DoH
   - Advanced Ads Block
   - Output Ready-to-Run FlyClash Script
   - TANPA GIST / TANPA UPLOAD
   =========================================================== */

/* ---------------- utilities ---------------- */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from((r||document).querySelectorAll(s));
const now = ()=> new Date().toISOString();
function tryAtob(s){ try{ return atob(s) }catch(e){return null} }
function isBase64(s){ try{ return btoa(atob(s))===s }catch{ return false } }
function downloadText(fname, content, type='text/plain'){ const b=new Blob([content],{type}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=fname; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); }

/* ---------------- build UI if missing ---------------- */
function ensureUI(){
  if($('#fc-root')) return;
  document.title = 'FlyClash Converter PRO — Itsbad-';
  document.body.innerHTML = '';
  const root = document.createElement('div');
  root.id = 'fc-root';
  root.innerHTML = `
  <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <h1 style="margin:0;font-size:18px">FlyClash Converter — PRO <small style="color:#94a3b8">Itsbad-</small></h1>
    <div style="font-size:12px;color:#94a3b8">${now().slice(0,19).replace('T',' ')}</div>
  </header>
  <main style="display:grid;grid-template-columns:1fr 480px;gap:14px">
    <section style="background:#071233;padding:12px;border-radius:8px">
      <label style="font-size:13px">Input links (multi-line)</label>
      <textarea id="fc-input" placeholder="Tempel vless:// vmess:// trojan:// ss:// (satu per baris)"></textarea>

      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button id="fc-generate" style="background:var(--accent);color:#04212a;padding:8px 10px;border-radius:6px;border:0">Generate</button>
        <button id="fc-clear" style="padding:8px 10px;border-radius:6px;border:0;background:#1f2937">Clear</button>
        <button id="fc-validate" style="padding:8px 10px;border-radius:6px;border:0;background:#06b6d4">Validate</button>

        <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
          <label style="font-size:12px;color:var(--muted)">Mode</label>
          <select id="fc-mode" style="padding:6px;border-radius:6px;background:#031229;color:var(--white);border:1px solid #0b1220">
            <option value="auto">Auto Best Ping</option>
            <option value="manual">Manual</option>
            <option value="loadbalance">Load Balance</option>
            <option value="fallback">Fallback/Failover</option>
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        <div><label style="font-size:12px">Interval (s)</label><input id="fc-interval" type="number" min="1" value="5" style="width:100%;padding:8px;border-radius:6px;background:#031229;border:1px solid #0b1220;color:var(--white)"/></div>
        <div><label style="font-size:12px">Group name</label><input id="fc-group" value="AUTO BEST PING" style="width:100%;padding:8px;border-radius:6px;background:#031229;border:1px solid #0b1220;color:var(--white)"/></div>
      </div>

      <div style="display:flex;gap:10px;align-items:center;margin-top:10px">
        <label style="display:flex;gap:6px;align-items:center"><input id="fc-skip" type="checkbox" checked/>Skip Cert</label>
        <label style="display:flex;gap:6px;align-items:center"><input id="fc-ad" type="checkbox" checked/>Adblock</label>
        <label style="display:flex;gap:6px;align-items:center"><input id="fc-autoadd" type="checkbox" checked/>Auto-insert group</label>
      </div>

      <div id="fc-lb-area" style="margin-top:10px;display:none">
        <label style="font-size:12px">Load Balance ratios (comma)</label>
        <input id="fc-lb" placeholder="50,30,20" style="width:100%;padding:8px;border-radius:6px;background:#031229;border:1px solid #0b1220;color:var(--white)"/>
      </div>

      <div style="margin-top:10px">
        <label style="font-size:12px">DNS (comma)</label>
        <input id="fc-dns" value="223.5.5.5,8.8.8.8" style="width:100%;padding:8px;border-radius:6px;background:#031229;border:1px solid #0b1220;color:var(--white)"/>
      </div>
    </section>

    <section style="display:flex;flex-direction:column;gap:10px">
      <div style="background:#021129;padding:12px;border-radius:8px;flex:1">
        <label style="font-size:13px">Preview — JS Override</label>
        <pre id="fc-js" style="height:100%;background:#061025;border-radius:6px;padding:10px;color:#bfe6ff;font-size:12px"></pre>
      </div>
      <div style="background:#021129;padding:12px;border-radius:8px;flex:1">
        <label style="font-size:13px">Preview — YAML</label>
        <pre id="fc-yaml" style="height:100%;background:#ffffff;border-radius:6px;padding:10px;color:#0b1220;font-size:12px"></pre>
      </div>

      <div style="display:flex;gap:8px">
        <button id="fc-copy-js" style="flex:1;padding:8px;border-radius:6px;background:#10b981;border:0">Copy JS</button>
        <button id="fc-download-js" style="flex:1;padding:8px;border-radius:6px;background:#3b82f6;border:0;color:white">Download JS</button>
        <button id="fc-copy-yaml" style="flex:1;padding:8px;border-radius:6px;background:#f59e0b;border:0">Copy YAML</button>
        <button id="fc-download-yaml" style="flex:1;padding:8px;border-radius:6px;background:#ef4444;border:0;color:white">Download YAML</button>
      </div>
    </section>
  </main>
  <footer style="margin-top:14px;color:#94a3b8;font-size:13px">Notes: Client-side only. For secure gist/push use server. Creator: Itsbad-</footer>
  `;
  document.body.appendChild(root);
}

/* ---------------- parse helpers ---------------- */
function parseQuery(q){ const o={}; if(!q) return o; q.split('&').forEach(p=>{ const i=p.indexOf('='); if(i===-1) o[decodeURIComponent(p)]=''; else o[decodeURIComponent(p.slice(0,i))]=decodeURIComponent(p.slice(i+1)); }); return o; }

/* VLESS */
function parseVLESS(raw){
  try{
    const s = raw.replace(/^vless:\/\//i,''); const hash = s.indexOf('#'); const name = hash===-1?undefined:decodeURIComponent(s.slice(hash+1));
    const beforeHash = hash===-1? s : s.slice(0,hash);
    const qIdx = beforeHash.indexOf('?'); const qStr = qIdx===-1? '': beforeHash.slice(qIdx+1); const beforeQ = qIdx===-1? beforeHash: beforeHash.slice(0,qIdx);
    const query = parseQuery(qStr);
    const at = beforeQ.indexOf('@'); const user = at===-1? '': beforeQ.slice(0,at); const hostport = at===-1? beforeQ: beforeQ.slice(at+1);
    const colon = hostport.lastIndexOf(':'); const host = colon===-1? hostport: hostport.slice(0,colon); const port = colon===-1?443:parseInt(hostport.slice(colon+1),10);
    return { proto:'vless', type:'vless', name:(name||user||`${host}:${port}`)+'-'+Math.random().toString(36).slice(2,6), uuid:user, host, port, network:query.type||'ws', path:query.path||'/', sni:query.sni||query.host||host, security:query.security||'tls', raw };
  }catch(e){ return { error:true, raw, message:e.message } }
}

/* VMess */
function parseVMess(raw){
  try{
    const s = raw.replace(/^vmess:\/\//i,''); let j=null;
    if(s.trim().startsWith('{')) j=JSON.parse(s);
    else { const dec = tryAtob(s); if(!dec) throw new Error('vmess decode failed'); j=JSON.parse(dec); }
    const server = j.add || (j.vnext && j.vnext[0] && j.vnext[0].address) || '';
    const port = parseInt(j.port || (j.vnext && j.vnext[0] && j.vnext[0].port) || 443,10);
    const uuid = j.id || j.uuid || (j.vnext&&j.vnext[0]&&j.vnext[0].id)||'';
    const net = j.net||j.network||'tcp'; const path = j.path || (j.ws && j.ws.path) || '/';
    const host = (j.host || (j.ws && j.ws.headers && (j.ws.headers.Host||j.ws.headers.host)) || j.sni) || server;
    return { proto:'vmess', type:'vmess', name:(j.ps||`${server}:${port}`)+'-'+Math.random().toString(36).slice(2,6), server, port, uuid, network:net, path, host, tls: j.tls==='tls'||j.tls===true||false, raw };
  }catch(e){ return { error:true, raw, message:e.message } }
}

/* Trojan */
function parseTrojan(raw){
  try{
    const s = raw.replace(/^trojan:\/\//i,''); const hash = s.indexOf('#'); const name = hash===-1?undefined:decodeURIComponent(s.slice(hash+1));
    const beforeHash = hash===-1? s : s.slice(0,hash); const qIdx = beforeHash.indexOf('?'); const qStr = qIdx===-1? '': beforeHash.slice(qIdx+1); const beforeQ = qIdx===-1? beforeHash : beforeHash.slice(0,qIdx);
    const query = parseQuery(qStr);
    const at = beforeQ.indexOf('@'); const password = at===-1? '': beforeQ.slice(0,at); const hostport = at===-1? beforeQ : beforeQ.slice(at+1);
    const colon = hostport.lastIndexOf(':'); const host = colon===-1? hostport : hostport.slice(0,colon); const port = colon===-1?443:parseInt(hostport.slice(colon+1),10);
    return { proto:'trojan', type:'trojan', name:(name||`${host}:${port}`)+'-'+Math.random().toString(36).slice(2,6), password, host, port, sni: query.sni || host, raw };
  }catch(e){ return { error:true, raw, message:e.message } }
}

/* Shadowsocks */
function parseSS(raw){
  try{
    const s = raw.replace(/^ss:\/\//i,''); if(s.includes('@') && !s.startsWith('@')){
      const hash = s.indexOf('#'); const name = hash===-1?undefined:decodeURIComponent(s.slice(hash+1));
      const beforeHash = hash===-1? s : s.slice(0,hash); const at = beforeHash.indexOf('@'); const methods = beforeHash.slice(0,at); const hostport = beforeHash.slice(at+1);
      const colon = hostport.lastIndexOf(':'); const host = colon===-1? hostport: hostport.slice(0,colon); const port = colon===-1?8388:parseInt(hostport.slice(colon+1),10);
      const method = methods.split(':')[0]; const password = methods.split(':')[1]||'';
      return { proto:'ss', type:'shadowsocks', name:(name||`${host}:${port}`)+'-'+Math.random().toString(36).slice(2,6), server:host, port, cipher:method, password, raw };
    } else {
      const hash = s.indexOf('#'); const base = hash===-1? s : s.slice(0,hash); const decoded = tryAtob(base);
      if(!decoded) throw new Error('ss decode failed'); const at = decoded.indexOf('@'); const methods = decoded.slice(0,at); const hostport = decoded.slice(at+1);
      const colon = hostport.lastIndexOf(':'); const host = colon===-1? hostport: hostport.slice(0,colon); const port = colon===-1?8388:parseInt(hostport.slice(colon+1),10);
      const method = methods.split(':')[0]; const password = methods.split(':')[1]||'';
      return { proto:'ss', type:'shadowsocks', name:(hash===-1?`${host}:${port}`:decodeURIComponent(s.slice(hash+1)))+'-'+Math.random().toString(36).slice(2,6), server:host, port, cipher:method, password, raw };
    }
  }catch(e){ return { error:true, raw, message:e.message } }
}

/* dispatch */
function parseAny(line){
  if(!line || !line.trim()) return null;
  const l = line.trim();
  if(/^vless:\/\//i.test(l)) return parseVLESS(l);
  if(/^vmess:\/\//i.test(l)) return parseVMess(l);
  if(/^trojan:\/\//i.test(l)) return parseTrojan(l);
  if(/^ss:\/\//i.test(l)) return parseSS(l);
  const m = l.replace(/^vmess:\/\//i,''); if(isBase64(m)) return parseVMess('vmess://'+m);
  return { error:true, raw:l, message:'Unknown format' };
}

/* ---------------- convert to clash node ---------------- */
function nodeToClash(node, opts={}){
  if(!node || node.error) return null;
  const skipCert = !!opts.skipCert;
  const proto = (node.proto||node.type||'').toLowerCase();
  if(proto==='vless'){
    return {
      name: node.name,
      type: 'vless',
      server: node.host,
      port: node.port||443,
      uuid: node.uuid||'',
      tls: true,
      'skip-cert-verify': skipCert,
      servername: node.sni||node.host,
      network: node.network||'ws',
      'ws-opts': { path: node.path||'/', headers: node.sni?{Host:node.sni}:{Host:node.host} }
    };
  }
  if(proto==='vmess'){
    return {
      name: node.name,
      type: 'vmess',
      server: node.server,
      port: node.port||443,
      uuid: node.uuid||'',
      alterId: node.alterId||0,
      tls: !!node.tls,
      'skip-cert-verify': skipCert,
      network: node.network||'ws',
      'ws-opts': node.network==='ws'?{ path: node.path||'/', headers: node.host?{Host:node.host}:{}}:undefined
    };
  }
  if(proto==='trojan'){
    return {
      name: node.name,
      type: 'trojan',
      server: node.host,
      port: node.port||443,
      password: node.password||'',
      tls: true,
      'skip-cert-verify': skipCert,
      servername: node.sni||node.host
    };
  }
  if(proto==='ss' || proto==='shadowsocks'){
    return {
      name: node.name,
      type: 'shadowsocks',
      server: node.server,
      port: node.port||8388,
      cipher: node.cipher,
      password: node.password
    };
  }
  return null;
}

/* ---------------- groups / dns / adblock ---------------- */
function buildGroupObj(names, opts){
  const groupName = opts.groupName || (opts.mode==='loadbalance'?'LOAD BALANCE':'AUTO BEST PING');
  if(opts.mode==='auto' || opts.mode==='auto-best-ping'){
    return { name: groupName, type:'url-test', url:opts.testUrl||'https://www.gstatic.com/generate_204', interval: Math.max(1,Number(opts.interval)||5), tolerance: opts.tolerance||150, proxies: names };
  }
  if(opts.mode==='loadbalance' || opts.mode==='load-balance'){
    const weights = (opts.lb||'').split(',').map(x=>{ const v=parseFloat(x); return isNaN(v)?null:v }).filter(v=>v!==null);
    const obj = { name: groupName, type:'load-balance', proxies: names };
    if(weights.length===names.length) obj.weights = weights;
    return obj;
  }
  if(opts.mode==='fallback'){
    return { name: groupName, type:'fallback', url:opts.testUrl||'https://www.gstatic.com/generate_204', interval: Math.max(1,Number(opts.interval)||5), proxies: names };
  }
  return { name: groupName, type:'select', proxies: names };
}

function dnsForMode(mode){
  if(mode==='isp') return ['1.1.1.1','8.8.8.8','223.5.5.5'];
  return ['8.8.8.8','1.1.1.1'];
}

function adblockList(){
  return [
    "DOMAIN-SUFFIX,ads.google.com,REJECT",
    "DOMAIN-SUFFIX,doubleclick.net,REJECT",
    "DOMAIN-KEYWORD,adservice,REJECT",
    "DOMAIN-SUFFIX,googlesyndication.com,REJECT",
    "DOMAIN-SUFFIX,adservice.google.co.id,REJECT",
    "DOMAIN-KEYWORD,tracker,REJECT",
    "DOMAIN-KEYWORD,analytics,REJECT"
  ];
}

/* ---------------- main generator ---------------- */
function makeOverride(clashNodes, opts){
  const dnsNames = (opts.dns || '223.5.5.5,8.8.8.8').split(',').map(x=>x.trim()).filter(Boolean);
  const proxiesBlock = clashNodes.map(n=>JSON.stringify(n,null,4).replace(/\n/g,'\n        ')).join(',\n');
  const names = clashNodes.map(n=>n.name);
  const groupObj = buildGroupObj(names, opts);
  const autoInsertCode = opts.autoInsert?`
    try {
      (config['proxy-groups']||[]).forEach(g=>{
        if(g.name==='🚀 节点选择' || g.name==='Proxy' || g.name==='Auto'){ g.proxies=g.proxies||[]; if(!g.proxies.includes("${groupObj.name}")) g.proxies.push("${groupObj.name}"); }
      });
    } catch(e) {} `:'';
  const adRules = (opts.adblock)? adblockList() : [];
  const lines = [];
  lines.push('// FlyClash override generated by FlyClash Converter PRO — Itsbad-');
  lines.push('function main(config){');
  lines.push('  // DNS');
  lines.push('  config.dns = config.dns || {};');
  lines.push('  config.dns.enable = true;');
  lines.push('  config.dns.nameserver = '+JSON.stringify(dnsNames)+';');
  lines.push('');
  lines.push('  if(!config.proxies) config.proxies = [];');
  if(proxiesBlock) lines.push('  // PROXIES\\n  '+proxiesBlock+'\\n');
  lines.push('  if(!config[\"proxy-groups\"]) config[\"proxy-groups\"] = [];');
  lines.push('  config[\"proxy-groups\"].push('+JSON.stringify(groupObj,null,4).replace(/\n/g,'\\n  ')+');');
  if(autoInsertCode) lines.push(autoInsertCode);
  if(adRules.length){
    lines.push('  config.rules = config.rules || [];');
    adRules.forEach(r=> lines.push('  config.rules.push('+JSON.stringify(r)+');'));
  }
  lines.push('  return config;');
  lines.push('}');
  return lines.join('\\n');
}

/* ---------------- UI wiring ---------------- */
function wire(){
  const inEl = $('#fc-input'), gen = $('#fc-generate'), clear = $('#fc-clear'), val = $('#fc-validate');
  const jsPre = $('#fc-js'), yamlPre = $('#fc-yaml');
  const modeSel = $('#fc-mode'), interval = $('#fc-interval'), group = $('#fc-group'), skip = $('#fc-skip'), ad = $('#fc-ad'), lbArea = $('#fc-lb-area'), lb = $('#fc-lb'), dns = $('#fc-dns'), autoadd = $('#fc-autoadd');
  const copyJS = $('#fc-copy-js'), downJS = $('#fc-download-js'), copyY = $('#fc-copy-yaml'), downY = $('#fc-download-yaml');

  modeSel.addEventListener('change', ()=>{ if(modeSel.value==='loadbalance') lbArea.style.display='block'; else lbArea.style.display='none'; });

  clear.addEventListener('click', ()=>{ inEl.value=''; jsPre.textContent=''; yamlPre.textContent=''; });

  val.addEventListener('click', ()=>{
    const lines = (inEl.value||'').split(/\\r?\\n/).map(l=>l.trim()).filter(Boolean);
    const parsed = lines.map(l=>parseAny(l));
    const ok = parsed.filter(p=>p && !p.error).length;
    alert(`Lines: ${lines.length}, Valid: ${ok}, Invalid: ${lines.length-ok}`);
  });

  gen.addEventListener('click', ()=>{
    const lines = (inEl.value||'').split(/\\r?\\n/).map(l=>l.trim()).filter(Boolean);
    if(!lines.length) return alert('Paste links first');
    const parsed = lines.map(l=>parseAny(l)).filter(Boolean);
    const good = parsed.filter(p=>!p.error), bad = parsed.filter(p=>p.error);
    if(!good.length) return alert('No valid links found!');
    const clashNodes = good.map(n=>nodeToClash(n, { skipCert: !!skip.checked })).filter(Boolean);
    const opts = { mode: modeSel.value, interval: Number(interval.value)||5, groupName: group.value||undefined, skipCert:!!skip.checked, adblock:!!ad.checked, lb: lb.value||'', dns: dns.value||'', autoInsert: !!autoadd.checked };
    const js = makeOverride(clashNodes, opts);
    jsPre.textContent = js;
    jsPre.dataset.content = js;
    // create simple YAML preview (minimal)
    const yaml = `port: 7890\\nallow-lan: true\\nproxies:\\n${clashNodes.map(n=>'  - '+n.name).join('\\n')}\\nproxy-groups:\\n  - ${opts.groupName||'AUTO BEST PING'}`;
    yamlPre.textContent = yaml;
    yamlPre.dataset.content = yaml;
    if(bad.length) console.warn('Bad entries', bad);
  });

  copyJS.addEventListener('click', ()=>{ const t = $('#fc-js').dataset.content||''; if(!t) return alert('Generate first'); navigator.clipboard.writeText(t).then(()=>alert('JS copied')) });
  downJS.addEventListener('click', ()=>{ const t = $('#fc-js').dataset.content||''; if(!t) return alert('Generate first'); downloadText('flyclash-override.js', t, 'application/javascript') });
  copyY.addEventListener('click', ()=>{ const t = $('#fc-yaml').dataset.content||''; if(!t) return alert('Generate first'); navigator.clipboard.writeText(t).then(()=>alert('YAML copied')) });
  downY.addEventListener('click', ()=>{ const t = $('#fc-yaml').dataset.content||''; if(!t) return alert('Generate first'); downloadText('clash-config.yaml', t, 'text/yaml') });

}

/* ---------------- init ---------------- */
(function(){ ensureUI(); wire(); window.FlyClashPRO = { parseAny, parseVLESS, parseVMess, parseTrojan, parseSS, nodeToClash, makeOverride }; })();
