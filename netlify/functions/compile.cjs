// CommonJS, unbundled. Writes ONLY to /tmp.
// Requires: netlify.toml -> [functions] node_bundler = "none"

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

    // All writes in /tmp
    const base    = await fs.mkdtemp(join(tmpdir(), "tectonic-"));
    const workDir = join(base, "work");
    const outDir  = join(base, "out");
    const cache   = join(base, "cache");
    await fs.mkdir(workDir, { recursive: true });
    await fs.mkdir(outDir,  { recursive: true });
    await fs.mkdir(cache,   { recursive: true });

    // Source files (inside /tmp)
    await fs.writeFile(join(workDir, "main.tex"),            mainTex,   "utf8");
    await fs.writeFile(join(workDir, "candidate_blocks.tex"), blocksTex, "utf8");

    const tt = await resolveTectonicPath();

    // Run tectonic with cwd=/tmp/... and cache=/tmp/...
    const pdfBuf = await new Promise((resolve, reject) => {
      const p = spawn(
        tt,
        ["-X", "compile", "main.tex", "--outdir", outDir, "--chatter", "minimal"],
        { stdio: ["ignore", "pipe", "pipe"], cwd: workDir, env: { ...process.env, TECTONIC_CACHE_DIR: cache, TMPDIR: base } }
      );
      let stderr = "";
      p.stderr.on("data", d => { stderr += d.toString(); });
      p.on("error", reject);
      p.on("close", async (code) => {
        if (code !== 0) return reject(new Error(stderr || `tectonic exit ${code}`));
        try { resolve(await fs.readFile(join(outDir, "main.pdf"))); }
        catch (e) { reject(e); }
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
