// script.js
// FlyClash Converter - Full feature client-side script
// Requirements: run in browser. Builds UI, parses links, generates FlyClash JS override + YAML,
// supports modes: auto-best-ping (url-test), manual (select), load-balance, fallback
// Supports: VLESS, VMess (base64+json), Trojan, Shadowsocks (URI & base64)
// Also supports adblock simple rules, DNS settings, skip cert verify, Gist creation (optional)

(function () {
  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s || "");
  const tryAtob = (s) => {
    try {
      return atob(s);
    } catch (e) {
      return null;
    }
  };

  // ---------- Build UI ----------
  function buildUI() {
    const container = document.createElement("div");
    container.style.maxWidth = "1100px";
    container.style.margin = "10px auto";
    container.style.fontFamily = "Inter, system-ui, sans-serif";
    container.innerHTML = `
      <h1 style="font-size:22px;margin-bottom:6px">FlyClash Converter — Full</h1>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:360px;">
          <label><strong>Input Links (multi-line)</strong></label>
          <textarea id="fc-input" style="width:100%;height:220px;padding:8px;margin-top:6px" placeholder="Paste vless:// / vmess:// / trojan:// / ss:// links here (one per line)"></textarea>
          
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
            <button id="fc-generate" style="padding:8px 12px;background:#0ea5e9;color:white;border:0;border-radius:6px">Generate</button>
            <button id="fc-clear" style="padding:8px 12px;border:0;border-radius:6px;background:#e2e8f0">Clear</button>
            <button id="fc-copy-js" style="padding:8px 12px;border:0;border-radius:6px;background:#10b981;color:white">Copy JS</button>
            <button id="fc-download-js" style="padding:8px 12px;border:0;border-radius:6px;background:#7c3aed;color:white">Download JS</button>
            <button id="fc-copy-yaml" style="padding:8px 12px;border:0;border-radius:6px;background:#f59e0b;color:white">Copy YAML</button>
            <button id="fc-download-yaml" style="padding:8px 12px;border:0;border-radius:6px;background:#ef4444;color:white">Download YAML</button>
          </div>

          <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>
              <label>Mode</label>
              <select id="fc-mode" style="width:100%;padding:8px;margin-top:4px">
                <option value="auto-best-ping">Auto Best Ping (url-test)</option>
                <option value="manual">Manual Select (select)</option>
                <option value="load-balance">Load Balance</option>
                <option value="fallback">Fallback</option>
              </select>
            </div>
            <div>
              <label>Interval (s)</label>
              <input id="fc-interval" type="number" min="1" value="5" style="width:100%;padding:8px;margin-top:4px">
            </div>
          </div>

          <div style="display:flex;gap:8px;margin-top:8px">
            <label style="display:flex;align-items:center;gap:6px"><input id="fc-skip-cert" type="checkbox" checked> Skip Cert Verify</label>
            <label style="display:flex;align-items:center;gap:6px"><input id="fc-adblock" type="checkbox" checked> Include Adblock Rules</label>
            <label style="display:flex;align-items:center;gap:6px"><input id="fc-auto-insert" type="checkbox" checked> Auto-insert group to main selectors</label>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
            <div>
              <label>DNS (comma-separated)</label>
              <input id="fc-dns" style="width:100%;padding:8px;margin-top:4px" value="223.5.5.5,8.8.8.8">
            </div>
            <div>
              <label>Group Name</label>
              <input id="fc-group-name" style="width:100%;padding:8px;margin-top:4px" value="AUTO BEST PING">
            </div>
          </div>

          <div id="fc-load-options" style="margin-top:8px;display:none">
            <label>Load Balance Ratios (comma, optional)</label>
            <input id="fc-lb-ratios" style="width:100%;padding:8px;margin-top:4px" placeholder="e.g. 50,30,20">
            <p style="font-size:12px;color:#6b7280;margin-top:4px">Jika jumlah ratios cocok dengan jumlah node, akan dipakai sebagai weights.</p>
          </div>

          <div style="margin-top:8px">
            <label>Optional: GitHub token for Gist (leave empty for anonymous)</label>
            <input id="fc-github-token" style="width:100%;padding:8px;margin-top:4px" placeholder="ghp_xxx (keep secret!)">
            <div style="margin-top:8px;display:flex;gap:8px">
              <button id="fc-create-gist" style="padding:8px 12px;background:#6366f1;color:white;border:0;border-radius:6px">Create Gist</button>
              <a id="fc-gist-link" style="padding:8px 12px;background:#e2e8f0;border-radius:6px;text-decoration:none;color:#111;display:none">Open Gist</a>
            </div>
          </div>
        </div>

        <div style="flex:1;min-width:360px;">
          <label><strong>Preview — JS Override</strong></label>
          <div id="fc-js-preview" style="height:260px;overflow:auto;background:#0f172a;color:#e6eef8;padding:12px;border-radius:6px;margin-top:6px;font-family:monospace;font-size:12px;white-space:pre-wrap"></div>

          <label style="margin-top:10px"><strong>Preview — Clash YAML</strong></label>
          <div id="fc-yaml-preview" style="height:260px;overflow:auto;background:#ffffff;color:#111;padding:12px;border-radius:6px;margin-top:6px;font-family:monospace;font-size:12px;white-space:pre-wrap"></div>
          
          <label style="margin-top:10px"><strong>Parsed Nodes</strong></label>
          <div id="fc-parsed" style="height:160px;overflow:auto;background:#f8fafc;padding:8px;border-radius:6px;margin-top:6px"></div>
        </div>
      </div>

      <div id="fc-footer" style="max-width:1100px;margin:12px auto;color:#6b7280;font-size:13px">
        <p>Note: This tool is client-side. For production, follow README to deploy to Cloudflare Pages. Do not share personal GitHub tokens.</p>
      </div>
    `;

    // Replace body content (but if original had content, keep)
    document.body.innerHTML = "";
    document.body.appendChild(container);
  }

  // ---------- Parsers ----------
  function parseQuery(q) {
    const obj = {};
    if (!q) return obj;
    q.split("&").forEach((p) => {
      const idx = p.indexOf("=");
      if (idx === -1) obj[decodeURIComponent(p)] = "";
      else obj[decodeURIComponent(p.slice(0, idx))] = decodeURIComponent(p.slice(idx + 1));
    });
    return obj;
  }

  function parseVLESS(url) {
    // vless://UUID@server:port?params#name
    const withoutPrefix = url.replace(/^vless:\/\//i, "");
    const hashIdx = withoutPrefix.indexOf("#");
    const name = hashIdx === -1 ? "VLESS" : decodeURIComponent(withoutPrefix.slice(hashIdx + 1));
    const beforeHash = hashIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, hashIdx);
    const queryIdx = beforeHash.indexOf("?");
    const beforeQuery = queryIdx === -1 ? beforeHash : beforeHash.slice(0, queryIdx);
    const q = queryIdx === -1 ? "" : beforeHash.slice(queryIdx + 1);
    const query = parseQuery(q);

    const atIdx = beforeQuery.indexOf("@");
    const userinfo = atIdx === -1 ? "" : beforeQuery.slice(0, atIdx);
    const hostport = atIdx === -1 ? beforeQuery : beforeQuery.slice(atIdx + 1);
    const colonIdx = hostport.lastIndexOf(":");
    const server = colonIdx === -1 ? hostport : hostport.slice(0, colonIdx);
    const port = colonIdx === -1 ? 443 : parseInt(hostport.slice(colonIdx + 1), 10);

    return {
      type: "vless",
      name,
      server,
      port,
      uuid: userinfo,
      tls: query.security === "tls" || query.tls === "true" || true,
      servername: query.sni || query.host || undefined,
      network: query.type || "ws",
      path: query.path || "/",
      host: query.host || undefined,
      raw: url,
    };
  }

  function parseVMess(url) {
    // vmess://base64(json) OR vmess://json...
    const withoutPrefix = url.replace(/^vmess:\/\//i, "");
    if (withoutPrefix.trim().startsWith("{")) {
      const parsedJson = JSON.parse(withoutPrefix);
      return vmessJsonToNode(parsedJson, parsedJson.ps || "VMess");
    }
    const hashIdx = withoutPrefix.indexOf("#");
    const name = hashIdx === -1 ? "VMess" : decodeURIComponent(withoutPrefix.slice(hashIdx + 1));
    const base64 = hashIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, hashIdx);
    const jsonStr = tryAtob(base64);
    if (!jsonStr) {
      // try decode URI encoded JSON
      try {
        const obj = JSON.parse(decodeURIComponent(base64));
        return vmessJsonToNode(obj, name);
      } catch (e) {
        throw new Error("Cannot decode VMess base64");
      }
    }
    const obj = JSON.parse(jsonStr);
    return vmessJsonToNode(obj, name);
  }

  function vmessJsonToNode(obj, name) {
    const net = obj.net || obj.network || "tcp";
    const path = (obj.path || (obj.ws && obj.ws.path) || "/") || "/";
    const host =
      obj.host ||
      (obj.ws && obj.ws.headers && (obj.ws.headers.Host || obj.ws.headers.host)) ||
      obj.sni ||
      undefined;
    const server =
      obj.add ||
      obj.address ||
      (obj.vnext && obj.vnext[0] && obj.vnext[0].address) ||
      "";
    const port = parseInt(obj.port || (obj.vnext && obj.vnext[0] && obj.vnext[0].port) || 443, 10) || 443;
    const uuid = obj.id || obj.uuid || (obj.vnext && obj.vnext[0] && obj.vnext[0].id) || "";
    return {
      type: "vmess",
      name: name || obj.ps || "VMess",
      server,
      port,
      uuid,
      alterId: obj.aid || 0,
      tls: obj.tls === "tls" || obj.tls === true || false,
      network: net,
      path,
      host,
      raw: obj,
    };
  }

  function parseTrojan(url) {
    // trojan://password@server:port?params#name
    const withoutPrefix = url.replace(/^trojan:\/\//i, "");
    const hashIdx = withoutPrefix.indexOf("#");
    const name = hashIdx === -1 ? "Trojan" : decodeURIComponent(withoutPrefix.slice(hashIdx + 1));
    const beforeHash = hashIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, hashIdx);
    const queryIdx = beforeHash.indexOf("?");
    const beforeQuery = queryIdx === -1 ? beforeHash : beforeHash.slice(0, queryIdx);
    const q = queryIdx === -1 ? "" : beforeHash.slice(queryIdx + 1);
    const query = parseQuery(q);

    const atIdx = beforeQuery.indexOf("@");
    const password = atIdx === -1 ? "" : beforeQuery.slice(0, atIdx);
    const hostport = atIdx === -1 ? beforeQuery : beforeQuery.slice(atIdx + 1);
    const colonIdx = hostport.lastIndexOf(":");
    const server = colonIdx === -1 ? hostport : hostport.slice(0, colonIdx);
    const port = colonIdx === -1 ? 443 : parseInt(hostport.slice(colonIdx + 1), 10);

    return {
      type: "trojan",
      name,
      server,
      port,
      password,
      tls: query.sni || true,
      servername: query.sni || undefined,
      network: query.type || "tcp",
      raw: url,
    };
  }

  function parseShadowsocks(url) {
    // ss://method:password@server:port#name OR ss://base64@...
    const withoutPrefix = url.replace(/^ss:\/\//i, "");
    if (withoutPrefix.includes("@") && !withoutPrefix.startsWith("@")) {
      const hashIdx = withoutPrefix.indexOf("#");
      const name = hashIdx === -1 ? "SS" : decodeURIComponent(withoutPrefix.slice(hashIdx + 1));
      const beforeHash = hashIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, hashIdx);
      const atIdx = beforeHash.indexOf("@");
      const methods = beforeHash.slice(0, atIdx);
      const hostport = beforeHash.slice(atIdx + 1);
      const colonIdx = hostport.lastIndexOf(":");
      const server = colonIdx === -1 ? hostport : hostport.slice(0, colonIdx);
      const port = colonIdx === -1 ? 8388 : parseInt(hostport.slice(colonIdx + 1), 10);
      const method = methods.split(":")[0];
      const password = methods.split(":")[1] || "";
      return {
        type: "ss",
        name,
        server,
        port,
        method,
        password,
        network: "tcp",
        raw: url,
      };
    } else {
      // try base64 payload
      const hashIdx = withoutPrefix.indexOf("#");
      const base = hashIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, hashIdx);
      const decoded = tryAtob(base);
      if (!decoded) return { error: true, raw: url, message: "Unsupported SS format" };
      const atIdx = decoded.indexOf("@");
      const methods = decoded.slice(0, atIdx);
      const hostport = decoded.slice(atIdx + 1);
      const colonIdx = hostport.lastIndexOf(":");
      const server = colonIdx === -1 ? hostport : hostport.slice(0, colonIdx);
      const port = colonIdx === -1 ? 8388 : parseInt(hostport.slice(colonIdx + 1), 10);
      const method = methods.split(":")[0];
      const password = methods.split(":")[1] || "";
      return {
        type: "ss",
        name: hashIdx === -1 ? "SS" : decodeURIComponent(withoutPrefix.slice(hashIdx + 1)),
        server,
        port,
        method,
        password,
        network: "tcp",
        raw: url,
      };
    }
  }

  function parseAll(text) {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed = [];
    for (const line of lines) {
      try {
        if (/^vless:\/\//i.test(line)) parsed.push(parseVLESS(line));
        else if (/^vmess:\/\//i.test(line)) parsed.push(parseVMess(line));
        else if (/^trojan:\/\//i.test(line)) parsed.push(parseTrojan(line));
        else if (/^ss:\/\//i.test(line)) parsed.push(parseShadowsocks(line));
        else {
          // try vmess base64
          const maybe = line.replace(/^vmess:\/\//i, "");
          if (tryAtob(maybe)) {
            parsed.push(parseVMess("vmess://" + maybe));
          } else parsed.push({ error: true, raw: line, name: line });
        }
      } catch (e) {
        parsed.push({ error: true, raw: line, name: line, message: e.message });
      }
    }
    return parsed;
  }

  // ---------- Converter to Clash nodes ----------
  function nodeToClash(n, opts) {
    if (!n || n.error) return null;
    if (n.type === "vless") {
      return {
        name: n.name,
        type: "vless",
        server: n.server,
        port: n.port || 443,
        uuid: n.uuid,
        tls: !!n.tls,
        "skip-cert-verify": !!opts.skipCert,
        servername: n.servername || n.host || undefined,
        network: n.network || "ws",
        "ws-opts": {
          path: n.path || "/",
          headers: n.host ? { Host: n.host } : undefined,
        },
      };
    }
    if (n.type === "vmess") {
      return {
        name: n.name,
        type: "vmess",
        server: n.server,
        port: n.port || 443,
        uuid: n.uuid,
        alterId: n.alterId || 0,
        tls: !!n.tls,
        "skip-cert-verify": !!opts.skipCert,
        network: n.network || "tcp",
        "ws-opts": n.network === "ws" ? { path: n.path || "/", headers: n.host ? { Host: n.host } : undefined } : undefined,
      };
    }
    if (n.type === "trojan") {
      return {
        name: n.name,
        type: "trojan",
        server: n.server,
        port: n.port || 443,
        password: n.password,
        tls: !!n.tls,
        "skip-cert-verify": !!opts.skipCert,
        servername: n.servername || undefined,
      };
    }
    if (n.type === "ss") {
      return {
        name: n.name,
        type: "shadowsocks",
        server: n.server,
        port: n.port || 8388,
        cipher: n.method,
        password: n.password,
      };
    }
    return null;
  }

  // ---------- Generator ----------
  function generateAll(parsedNodes, opts) {
    const clashNodes = parsedNodes.map((n) => nodeToClash(n, opts)).filter(Boolean);
    const proxyNames = clashNodes.map((n) => n.name);

    // JS override lines
    const jsLines = [];
    jsLines.push("function main(config) {");
    jsLines.push("    // Auto-generated FlyClash override by FlyClash Converter");
    jsLines.push("    if (!config.proxies) config.proxies = [];\n");

    for (const n of clashNodes) {
      const json = JSON.stringify(n, null, 4).replace(/\n/g, "\n        ");
      jsLines.push(`    // node: ${n.name}`);
      jsLines.push(`    config.proxies.push(${json});\n`);
    }

    jsLines.push("    if (!config['proxy-groups']) config['proxy-groups'] = [];\n");

    // Build the selected group
    const gn = opts.groupName || (opts.mode === "load-balance" ? "LOAD BALANCE" : "AUTO BEST PING");

    if (opts.mode === "auto-best-ping") {
      jsLines.push("    // --- AUTO BEST PING group ---");
      const grp = {
        name: gn,
        type: "url-test",
        url: "https://www.gstatic.com/generate_204",
        interval: Math.max(1, Number(opts.interval) || 5),
        tolerance: 50,
        proxies: proxyNames,
      };
      jsLines.push("    config['proxy-groups'].push(" + JSON.stringify(grp, null, 4).replace(/\n/g, "\n    ") + ");\n");
    } else if (opts.mode === "load-balance") {
      jsLines.push("    // --- LOAD BALANCE group ---");
      const ratios = (opts.lbRatios || "").split(",").map((r) => parseFloat(r)).filter((r) => !isNaN(r));
      const lbObj = { name: gn, type: "load-balance", proxies: proxyNames };
      if (ratios.length === proxyNames.length) lbObj["weights"] = ratios;
      jsLines.push("    config['proxy-groups'].push(" + JSON.stringify(lbObj, null, 4).replace(/\n/g, "\n    ") + ");\n");
    } else if (opts.mode === "fallback") {
      jsLines.push("    // --- FALLBACK group ---");
      const grp = { name: gn, type: "fallback", url: "https://www.gstatic.com/generate_204", interval: Math.max(1, Number(opts.interval) || 5), proxies: proxyNames };
      jsLines.push("    config['proxy-groups'].push(" + JSON.stringify(grp, null, 4).replace(/\n/g, "\n    ") + ");\n");
    } else if (opts.mode === "manual") {
      jsLines.push("    // --- MANUAL SELECT group ---");
      const grp = { name: gn, type: "select", proxies: proxyNames };
      jsLines.push("    config['proxy-groups'].push(" + JSON.stringify(grp, null, 4).replace(/\n/g, "\n    ") + ");\n");
    }

    // Auto insert group to main selectors
    if (opts.autoInsert) {
      jsLines.push("    // Add created group to main selectors if present");
      jsLines.push(
        "    config['proxy-groups'].forEach(g => { if (g.name === '🚀 节点选择' || g.name === 'Proxy' || g.name === 'Auto') { g.proxies = g.proxies || []; g.proxies.push(\"" +
          esc(gn) +
          "\"); } });\n"
      );
    }

    // DNS
    const dnsList = (opts.dns || "223.5.5.5,8.8.8.8").split(",").map((d) => d.trim()).filter(Boolean);
    jsLines.push("    // DNS settings");
    jsLines.push("    config.dns = config.dns || {};");
    jsLines.push("    config.dns.enable = true;");
    jsLines.push("    config.dns.nameserver = " + JSON.stringify(dnsList) + ";\n");

    // Adblock rules
    if (opts.adblock) {
      jsLines.push("    // Adblock rules (simple examples)");
      jsLines.push("    if (!config.rules) config.rules = [];\n");
      const sampleAdRules = [
        "DOMAIN-SUFFIX,ads.google.com,REJECT",
        "DOMAIN-KEYWORD,adservice,REJECT",
        "DOMAIN-SUFFIX,doubleclick.net,REJECT",
        "DOMAIN-SUFFIX,googlesyndication.com,REJECT",
      ];
      for (const r of sampleAdRules) jsLines.push("    config.rules.push(" + JSON.stringify(r) + ");");
      jsLines.push("\n");
    }

    jsLines.push("    return config;");
    jsLines.push("}");

    const js = jsLines.join("\n");

    // Build YAML minimal
    const yamlObj = {
      "port": 7890,
      "socks-port": 7891,
      "allow-lan": true,
      "log-level": "info",
      dns: { enable: true, nameserver: dnsList },
      proxies: clashNodes,
      "proxy-groups": [],
    };

    if (opts.mode === "auto-best-ping") {
      yamlObj["proxy-groups"].push({ name: gn, type: "url-test", url: "https://www.gstatic.com/generate_204", interval: Math.max(1, Number(opts.interval) || 5), tolerance: 50, proxies: proxyNames });
    } else if (opts.mode === "load-balance") {
      const ratios = (opts.lbRatios || "").split(",").map((r) => parseFloat(r)).filter((r) => !isNaN(r));
      const lb = { name: gn, type: "load-balance", proxies: proxyNames };
      if (ratios.length === proxyNames.length) lb.weights = ratios;
      yamlObj["proxy-groups"].push(lb);
    } else if (opts.mode === "fallback") {
      yamlObj["proxy-groups"].push({ name: gn, type: "fallback", url: "https://www.gstatic.com/generate_204", interval: Math.max(1, Number(opts.interval) || 5), proxies: proxyNames });
    } else {
      yamlObj["proxy-groups"].push({ name: gn, type: "select", proxies: proxyNames });
    }

    // Simple YAML dump
    function yamlDump(obj, indent = 0) {
      const pad = " ".repeat(indent);
      if (Array.isArray(obj)) {
        return obj.map((i) => pad + "- " + yamlDump(i, indent + 2).trim()).join("\n");
      } else if (typeof obj === "object" && obj !== null) {
        return Object.entries(obj)
          .map(([k, v]) => {
            if (v === null || v === undefined) return pad + `${k}: `;
            if (Array.isArray(v)) return pad + `${k}:\n` + yamlDump(v, indent + 2);
            if (typeof v === "object") return pad + `${k}:\n` + yamlDump(v, indent + 2);
            return pad + `${k}: ${v}`;
          })
          .join("\n");
      } else {
        return pad + String(obj);
      }
    }

    const yamlText = yamlDump(yamlObj);
    return { js, yamlText, parsed: clashNodes };
  }

  // ---------- Utilities ----------
  function downloadText(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Create Gist (client-side) - optionally use token
  async function createGist(content, filename = "flyclash-override.js", token = "") {
    const body = { files: {} };
    body.files[filename] = { content };
    body.public = false;
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = "token " + token;
      const res = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.html_url) return { ok: true, url: json.html_url, raw: json };
      return { ok: false, error: json };
    } catch (e) {
      return { ok: false, error: e.message || e };
    }
  }

  // ---------- Wire UI ----------
  function wire() {
    const inputEl = $("#fc-input");
    const generateBtn = $("#fc-generate");
    const clearBtn = $("#fc-clear");
    const jsPreview = $("#fc-js-preview");
    const yamlPreview = $("#fc-yaml-preview");
    const parsedDiv = $("#fc-parsed");
    const copyJsBtn = $("#fc-copy-js");
    const downloadJsBtn = $("#fc-download-js");
    const copyYamlBtn = $("#fc-copy-yaml");
    const downloadYamlBtn = $("#fc-download-yaml");
    const modeSel = $("#fc-mode");
    const intervalEl = $("#fc-interval");
    const dnsEl = $("#fc-dns");
    const skipCertEl = $("#fc-skip-cert");
    const adblockEl = $("#fc-adblock");
    const groupNameEl = $("#fc-group-name");
    const lbOptions = $("#fc-load-options");
    const lbRatiosEl = $("#fc-lb-ratios");
    const autoInsertEl = $("#fc-auto-insert");
    const gistTokenEl = $("#fc-github-token");
    const createGistBtn = $("#fc-create-gist");
    const gistLink = $("#fc-gist-link");

    modeSel.addEventListener("change", () => {
      if (modeSel.value === "load-balance") lbOptions.style.display = "block";
      else lbOptions.style.display = "none";
    });

    clearBtn.addEventListener("click", () => {
      inputEl.value = "";
      jsPreview.textContent = "";
      yamlPreview.textContent = "";
      parsedDiv.innerHTML = "";
      gistLink.style.display = "none";
    });

    function renderParsed(parsed) {
      parsedDiv.innerHTML = "";
      parsed.forEach((p, i) => {
        const el = document.createElement("div");
        el.style.padding = "8px";
        el.style.borderBottom = "1px solid #e6eef8";
        if (p.error) {
          el.innerHTML = `<div style="color:#ef4444;font-weight:600">Parse error</div><div style="font-size:12px;color:#334155">${esc(p.raw)}</div>`;
        } else {
          el.innerHTML = `<div style="font-weight:600">${esc(p.name || p.type)}</div><div style="font-size:12px;color:#334155">${esc(typeof p.raw === "string" ? p.raw : JSON.stringify(p.raw))}</div>`;
        }
        parsedDiv.appendChild(el);
      });
    }

    generateBtn.addEventListener("click", () => {
      const text = inputEl.value.trim();
      if (!text) {
        alert("Paste dulu link konfigurasi (vless/vmess/trojan/ss).");
        return;
      }
      const parsed = parseAll(text);
      renderParsed(parsed);

      const opts = {
        mode: modeSel.value,
        interval: Number(intervalEl.value) || 5,
        dns: dnsEl.value,
        skipCert: skipCertEl.checked,
        adblock: adblockEl.checked,
        groupName: groupNameEl.value || undefined,
        lbRatios: lbRatiosEl.value || "",
        autoInsert: autoInsertEl.checked,
      };

      const result = generateAll(parsed.filter((p) => !p.error), opts);
      jsPreview.textContent = result.js;
      yamlPreview.textContent = result.yamlText;
      // store in element dataset for downloads/copy
      jsPreview.dataset.content = result.js;
      yamlPreview.dataset.content = result.yamlText;
    });

    copyJsBtn.addEventListener("click", () => {
      const txt = $("#fc-js-preview").dataset.content || "";
      if (!txt) return alert("Belum ada JS. Klik Generate terlebih dahulu.");
      navigator.clipboard.writeText(txt).then(() => alert("JS Override disalin ke clipboard."));
    });

    downloadJsBtn.addEventListener("click", () => {
      const txt = $("#fc-js-preview").dataset.content || "";
      if (!txt) return alert("Belum ada JS. Klik Generate terlebih dahulu.");
      downloadText("flyclash-override.js", txt);
    });

    copyYamlBtn.addEventListener("click", () => {
      const txt = $("#fc-yaml-preview").dataset.content || "";
      if (!txt) return alert("Belum ada YAML. Klik Generate terlebih dahulu.");
      navigator.clipboard.writeText(txt).then(() => alert("YAML disalin ke clipboard."));
    });

    downloadYamlBtn.addEventListener("click", () => {
      const txt = $("#fc-yaml-preview").dataset.content || "";
      if (!txt) return alert("Belum ada YAML. Klik Generate terlebih dahulu.");
      downloadText("clash-config.yaml", txt);
    });

    createGistBtn.addEventListener("click", async () => {
      const txt = $("#fc-js-preview").dataset.content || "";
      if (!txt) return alert("Belum ada JS. Klik Generate terlebih dahulu.");
      const token = gistTokenEl.value.trim();
      createGistBtn.disabled = true;
      createGistBtn.textContent = "Creating...";
      const res = await createGist(txt, "flyclash-override.js", token);
      createGistBtn.disabled = false;
      createGistBtn.textContent = "Create Gist";
      if (res.ok) {
        gistLink.href = res.url;
        gistLink.style.display = "inline-block";
        gistLink.textContent = "Open Gist";
        alert("Gist created: " + res.url);
      } else {
        alert("Failed to create gist: " + JSON.stringify(res.error));
      }
    });
  }

  // ---------- Init ----------
  buildUI();
  wire();

  // Expose parse function for debugging in console
  window.FlyClashConverter = {
    parseAll,
    generateAll,
    nodeToClash,
  };
})();
