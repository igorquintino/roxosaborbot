// /pages/api/config.js
import fs from "fs/promises";
import path from "path";
import { defaultConfig } from "../../lib/defaultConfig";

const CONFIG_FILE =
  process.env.CONFIG_FILE ||
  path.resolve(process.cwd(), "data", "config.json"); // será criado se não existir
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || process.env.ADMIN_PIN || "";

// cria pasta data/ se necessário
async function ensureDir() {
  const dir = path.dirname(CONFIG_FILE);
  await fs.mkdir(dir, { recursive: true });
}

async function readConfig() {
  try {
    await ensureDir();
    const buf = await fs.readFile(CONFIG_FILE);
    return JSON.parse(buf.toString("utf-8"));
  } catch {
    return defaultConfig;
  }
}

async function writeConfig(data) {
  await ensureDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const cfg = await readConfig();
      return res.status(200).json({ ok: true, data: cfg });
    }

    if (req.method === "PUT") {
      // proteção por PIN no header
      const pin = req.headers["x-admin-pin"];
      if (!ADMIN_PIN || pin !== ADMIN_PIN) {
        return res.status(401).json({ ok: false, error: "PIN inválido" });
      }
      const body = req.body;
      if (!body || typeof body !== "object") {
        return res.status(400).json({ ok: false, error: "JSON inválido" });
      }
      await writeConfig(body);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (e) {
    console.error("CONFIG API ERROR:", e);
    return res.status(500).json({ ok: false, error: "Erro interno" });
  }
}