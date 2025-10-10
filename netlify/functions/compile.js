// netlify/functions/compile.js
import { spawn } from "node:child_process";
import { writeFile, mkdtemp, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Expose redirect path AND make sure the binary is bundled with this function
export const config = {
  path: "/api/compile",
  included_files: ["netlify/functions/bin/tectonic"]
};

async function resolveTectonicPath() {
  const candidates = [
    // 1) Next to the function bundle (preferred)
    join(__dirname, "../bin/tectonic"),
    join(__dirname, "bin/tectonic"),
    // 2) Lambda task root (where Netlify places bundled assets)
    process.env.LAMBDA_TASK_ROOT && join(process.env.LAMBDA_TASK_ROOT, "netlify/functions/bin/tectonic"),
    // 3) CWD (sometimes /var/task)
    join(process.cwd(), "netlify/functions/bin/tectonic"),
  ].filter(Boolean);

  for (const p of candidates) {
    try { await access(p); return p; } catch(_) {}
  }
  throw new Error("Tectonic binary not found in bundle. Expected at one of:\n" + candidates.join("\n"));
}

export default async (req, res) => {
  try {
    if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }
    const { mainTex, blocksTex } = req.body || {};
    if (!mainTex || !blocksTex) { res.status(400).send("mainTex and blocksTex required"); return; }

    const work = await mkdtemp(join(tmpdir(), "tectonic-"));
    const mainPath = join(work, "main.tex");
    const blocksPath = join(work, "candidate_blocks.tex");
    const outDir = join(work, "out");
    await writeFile(mainPath, mainTex, "utf8");
    await writeFile(blocksPath, blocksTex, "utf8");

    const tt = await resolveTectonicPath();

    const pdf = await new Promise((resolve, reject) => {
      const p = spawn(tt, ["-X", "compile", mainPath, "--outdir", outDir], {
        stdio: ["ignore", "pipe", "pipe"]
      });
      let stderr = "";
      p.stderr.on("data", d => { stderr += d.toString(); });
      p.on("error", reject);
      p.on("close", async (code) => {
        if (code !== 0) return reject(new Error(stderr || `tectonic exit ${code}`));
        try { resolve(await readFile(join(outDir, "main.pdf"))); }
        catch (e) { reject(e); }
      });
    });

    res.set("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (err) {
    res.status(500).send(`Compile error: ${err.message}`);
  }
};
