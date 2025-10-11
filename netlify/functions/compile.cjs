// netlify/functions/compile.cjs
// CommonJS, unbundled. Writes ONLY to /tmp. Self-heals malformed LaTeX.

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
  for (const p of candidates) { try { await access(p); return p; } catch {} }
  throw new Error("Tectonic binary not found. Tried:\n" + candidates.join("\n"));
}

// Minimal, safe main template (works on Tectonic)
const FALLBACK_MAIN = String.raw`
\documentclass[12pt]{article}
\usepackage[a4paper,margin=1in]{geometry}
\usepackage{tabularx,array}
\usepackage{hyperref}
\usepackage{bookmark}
\usepackage{lmodern}
\newcolumntype{Y}{>{\raggedright\arraybackslash}X}
\title{Candidate Dossier}
\author{Ummidvaar Dastaavez}
\date{\today}
\begin{document}
\maketitle
\tableofcontents
\bigskip
\section*{Candidate Blocks}
\input{candidate_blocks.tex}
\end{document}
`.trimStart();

// Very light sanitizer for blocks: remove BOM/CR, strip leading \\ and \end* on first line
function sanitizeBlocks(input) {
  let s = (input || "").replace(/^\uFEFF/, "").replace(/\r/g, "");
  s = s.replace(/^\s*\\\\\s*/,'');       // kill leading \\ (common cause of "There's no line here to end")
  s = s.replace(/^\s*\\end\{[^\}]+\}\s*/, ''); // defensive: don't start with an \end
  if (!s.trim()) {
    s = String.raw`% generated placeholder
\noindent\textit{No candidate blocks were provided. Upload a CSV to generate them.}`;
  }
  return s;
}

// Validate main: must contain \documentclass; otherwise use fallback
function normalizeMain(mainTex) {
  const s = (mainTex || "").replace(/^\uFEFF/, "").replace(/\r/g, "");
  if (/\\documentclass/.test(s)) return s;
  return FALLBACK_MAIN;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method not allowed" };
    }

    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch {}
    let { mainTex, blocksTex } = body;

    // Self-heal LaTeX inputs
    mainTex   = normalizeMain(mainTex);
    blocksTex = sanitizeBlocks(blocksTex);

    // Workdirs strictly under /tmp
    const base    = await fs.mkdtemp(join(tmpdir(), "tectonic-"));
    const workDir = join(base, "work");
    const outDir  = join(base, "out");
    const cache   = join(base, "cache");
    const homeDir = join(base, "home");
    const xdgCache= join(base, "xdg-cache");
    const xdgConf = join(base, "xdg-config");
    const texmfH  = join(base, "texmfhome");
    const texmfV  = join(base, "texmf-var");
    await Promise.all([
      fs.mkdir(workDir,{recursive:true}), fs.mkdir(outDir,{recursive:true}),
      fs.mkdir(cache,{recursive:true}),   fs.mkdir(homeDir,{recursive:true}),
      fs.mkdir(xdgCache,{recursive:true}),fs.mkdir(xdgConf,{recursive:true}),
      fs.mkdir(texmfH,{recursive:true}),  fs.mkdir(texmfV,{recursive:true})
    ]);

    await fs.writeFile(join(workDir,"main.tex"),             mainTex,   "utf8");
    await fs.writeFile(join(workDir,"candidate_blocks.tex"), blocksTex, "utf8");

    const tt = await resolveTectonicPath();
    const env = {
      ...process.env,
      HOME: homeDir,
      TMPDIR: base,
      TECTONIC_CACHE_DIR: cache,
      XDG_CACHE_HOME: xdgCache,
      XDG_CONFIG_HOME: xdgConf,
      TEXMFHOME: texmfH,
      TEXMFVAR: texmfV,
    };

    const pdfBuf = await new Promise((resolve, reject) => {
      const p = spawn(tt, ["-X", "compile", "main.tex", "--outdir", outDir], {
        stdio: ["ignore","pipe","pipe"],
        cwd: workDir,
        env
      });
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
