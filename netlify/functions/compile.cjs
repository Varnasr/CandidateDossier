// netlify/functions/compile.cjs
const { spawn }   = require("node:child_process");
const { writeFile, mkdtemp, readFile, access } = require("node:fs/promises");
const { tmpdir }  = require("node:os");
const { join }    = require("node:path");

async function resolveTectonicPath() {
  const candidates = [
    join(__dirname, "bin/tectonic"),                       // bundled next to function
    join(__dirname, "../bin/tectonic"),                    // sometimes one up
    process.env.LAMBDA_TASK_ROOT &&                        // task root (Netlify packs here)
      join(process.env.LAMBDA_TASK_ROOT, "netlify/functions/bin/tectonic"),
    join(process.cwd(), "netlify/functions/bin/tectonic"), // cwd fallback
  ].filter(Boolean);

  for (const p of candidates) {
    try { await access(p); return p; } catch (_) {}
  }
  throw new Error("Tectonic binary not found. Tried:\n" + candidates.join("\n"));
}

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method not allowed" };
    }
    const { mainTex, blocksTex } = JSON.parse(event.body || "{}");
    if (!mainTex || !blocksTex) {
      return { statusCode: 400, body: "mainTex and blocksTex required" };
    }

    const work     = await mkdtemp(join(tmpdir(), "tectonic-"));
    const mainPath = join(work, "main.tex");
    const blkPath  = join(work, "candidate_blocks.tex");
    const outDir   = join(work, "out");

    await writeFile(mainPath, mainTex, "utf8");
    await writeFile(blkPath,  blocksTex, "utf8");

    const tt = await resolveTectonicPath();

    const pdfBuf = await new Promise((resolve, reject) => {
      const p = spawn(tt, ["-X", "compile", mainPath, "--outdir", outDir], {
        stdio: ["ignore", "pipe", "pipe"]
      });
      let stderr = "";
      p.stderr.on("data", d => { stderr += d.toString(); });
      p.on("error", reject);
      p.on("close", async code => {
        if (code !== 0) return reject(new Error(stderr || `tectonic exit ${code}`));
        try { resolve(await readFile(join(outDir, "main.pdf"))); }
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
