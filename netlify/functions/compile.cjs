// netlify/functions/compile.cjs
// CommonJS, unbundled. All writes go to /tmp (Lambda's writable area).

const { spawn } = require("node:child_process");
const fs = require("node:fs").promises;
const { tmpdir } = require("node:os");
const { join } = require("node:path");

async function resolveTectonicPath() {
  const { access } = require("node:fs").promises;
  const candidates = [
    join(__dirname, "bin/tectonic"),
    join(__dirname, "../bin/tectonic"),
    process.env.LAMBDA_TASK_ROOT && join(process.env.LAMBDA_TASK_ROOT, "netlify/functions/bin/tectonic"),
    join(process.cwd(), "netlify/functions/bin/tectonic"),
  ].filter(Boolean);
  for (const p of candidates) {
    try { await access(p); return p; } catch {}
  }
  throw new Error("Tectonic binary not found. Tried:\n" + candidates.join("\n"));
}

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); return p; }

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method not allowed" };
    }

    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch {}
    const { mainTex, blocksTex } = body;
    if (!mainTex || !blocksTex) {
      return { statusCode: 400, body: "mainTex and blocksTex required" };
    }

    // ---- Writable sandbox in /tmp ----
    const base      = await fs.mkdtemp(join(tmpdir(), "tectonic-"));
    const workDir   = await ensureDir(join(base, "work"));
    const outDir    = await ensureDir(join(base, "out"));
    const cacheDir  = await ensureDir(join(base, "cache"));        // Tectonic cache
    const homeDir   = await ensureDir(join(base, "home"));         // $HOME
    const xdgCache  = await ensureDir(join(base, "xdg-cache"));    // XDG_CACHE_HOME (fontconfig, etc.)
    const xdgConfig = await ensureDir(join(base, "xdg-config"));   // XDG_CONFIG_HOME
    const texmfHome = await ensureDir(join(base, "texmfhome"));    // TEXMFHOME
    const texmfVar  = await ensureDir(join(base, "texmf-var"));    // TEXMFVAR

    // Source files inside /tmp
    await fs.writeFile(join(workDir, "main.tex"),             mainTex,   "utf8");
    await fs.writeFile(join(workDir, "candidate_blocks.tex"), blocksTex, "utf8");

    const tt = await resolveTectonicPath();

    // Compose a very explicit env so nothing escapes /tmp
    const env = {
      ...process.env,
      HOME: homeDir,
      TMPDIR: base,
      TECTONIC_CACHE_DIR: cacheDir,
      XDG_CACHE_HOME: xdgCache,
      XDG_CONFIG_HOME: xdgConfig,
      TEXMFHOME: texmfHome,
      TEXMFVAR: texmfVar,
    };

    // Run tectonic against sources in /tmp and write PDF to /tmp/out
    const pdfBuf = await new Promise((resolve, reject) => {
      const p = spawn(
        tt,
        ["-X", "compile", "main.tex", "--outdir", outDir],
        { stdio: ["ignore", "pipe", "pipe"], cwd: workDir, env }
      );
      let stderr = "";
      p.stderr.on("data", d => { stderr += d.toString(); });
      p.on("error", reject);
      p.on("close", async (code) => {
        if (code !== 0) return reject(new Error(stderr || `tectonic exit ${code}`));
        try {
          resolve(await fs.readFile(join(outDir, "main.pdf")));
        } catch (e) { reject(e); }
      });
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/pdf" },
      body: pdfBuf.toString("base64"),
      isBase64Encoded: true
    };
  } catch (err) {
    return { statusCode: 500, body: "Compile error: " + err.message };
  }
};
