// netlify/functions/compile.js
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Use POST" };
    }

    const { mainTex, blocksTex } = JSON.parse(event.body || "{}");
    if (!mainTex || !blocksTex) {
      return { statusCode: 400, body: "Missing mainTex or blocksTex" };
    }

    const work = mkdtempSync(join(tmpdir(), "latex-"));
    const mainPath = join(work, "main.tex");
    const blocksPath = join(work, "candidate_blocks.tex");
    writeFileSync(mainPath, mainTex, "utf8");
    writeFileSync(blocksPath, blocksTex, "utf8");

    const bin = join(process.cwd(), "netlify", "functions", "bin", "tectonic");

    const runLatex = () =>
      new Promise((resolve, reject) => {
        execFile(
          bin,
          ["-X", "compile", "main.tex", "--keep-logs"],
          { cwd: work },
          (err, stdout, stderr) => {
            if (err) reject(new Error(stderr || stdout || String(err)));
            else resolve(stdout);
          }
        );
      });

    await runLatex();

    const pdf = readFileSync(join(work, "main.pdf"));
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"dossier.pdf\"",
        "Cache-Control": "no-store"
      },
      body: pdf.toString("base64"),
      isBase64Encoded: true
    };
  } catch (e) {
    return { statusCode: 500, body: `Compile error: ${e.message}` };
  }
};
