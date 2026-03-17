#!/usr/bin/env node
/**
 * Downloads all Cloudinary images used in the project to public/assets.
 * Run: node scripts/download-cloudinary-assets.mjs
 * Then use paths like /assets/filename.png in the app.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "assets");

const CLOUDINARY_URLS = [
  "https://res.cloudinary.com/pitz/image/upload/v1756484286/Screenshot_2025-08-29_191548_two36s.png",
  "https://res.cloudinary.com/pitz/image/upload/v1756925670/success_wdhc19.png",
  "https://res.cloudinary.com/pitz/image/upload/v1756484240/Frame_34947_qeutak.png",
  "https://res.cloudinary.com/pitz/image/upload/v1756925740/Frame_34947_khxqxo.png",
  "https://res.cloudinary.com/pitz/image/upload/v1756579504/Frame_36261_1_d9cnq1.png",
  "https://res.cloudinary.com/pitz/image/upload/v1755500509/Frame_36261_ledmyw.png",
  "https://res.cloudinary.com/pitz/image/upload/v1753424863/Screenshot_2025-07-25_092724_rjinec.png",
  "https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png",
  "https://res.cloudinary.com/pitz/image/upload/v1765784047/alert-circle_1_ujybne.png",
  "https://res.cloudinary.com/pitz/image/upload/v1752248530/image_7_jijlik.png",
  "https://res.cloudinary.com/pitz/image/upload/v1752248529/2b5c7d80-7bcd-4cfb-8bd9-d1760a752afc.png_mhuppr.png",
  "https://res.cloudinary.com/pitz/image/upload/v1752561097/Group_9_gen9av.png",
  "https://res.cloudinary.com/pitz/image/upload/v1749724441/wallet-01_hugnf4.png",
  "https://res.cloudinary.com/pitz/image/upload/v1752243765/Vector_2_xauedx.png",
  "https://res.cloudinary.com/pitz/image/upload/v1764572384/bad9edd9da5201cb8f8f9cea35bf46f4fb541bd6_lplbyc.png",
  "https://res.cloudinary.com/pitz/image/upload/v1764663236/Group_7_ichuyz.png",
  "https://res.cloudinary.com/pitz/image/upload/v1761576566/Omaya_green-logo_yva2ah_1_huqqlj.webp",
  "https://res.cloudinary.com/pitz/image/upload/v1764568507/uil_exchange_1_okxkvb.png",
  "https://res.cloudinary.com/pitz/image/upload/v1747237692/users-profiles-left_e2oejc.png",
  "https://res.cloudinary.com/pitz/image/upload/v1747237691/Group_164002_fgt2kf.png",
  "https://res.cloudinary.com/pitz/image/upload/v1746710370/coins-rotate_d278mb.png",
  "https://res.cloudinary.com/pitz/image/upload/v1762878377/images_2_qysivu.jpg",
  "https://res.cloudinary.com/pitz/image/upload/v1763908134/Group_3_ocyc3p.png",
  "https://res.cloudinary.com/pitz/image/upload/v1765268255/Container_17_n6i2xm.png",
  "https://res.cloudinary.com/pitz/image/upload/v1765870778/iPhone_13_Mockup_1_wnbmqk.png",
  "https://res.cloudinary.com/pitz/image/upload/v1766121183/Container_14_omqgii.png",
  "https://res.cloudinary.com/pitz/image/upload/v1764667057/salam_vizvxy.svg",
  "https://res.cloudinary.com/pitz/image/upload/v1765959050/Button_muu3er.png",
  "https://res.cloudinary.com/pitz/image/upload/v1765346728/Container_37_fpyfvs.png",
  "https://res.cloudinary.com/pitz/image/upload/v1750918504/tether_1_yim48g.png",
  "https://res.cloudinary.com/pitz/image/upload/v1747039472/download_1_qytuya.png",
  "https://res.cloudinary.com/pitz/image/upload/v1752429993/Express_1_ggdxth.png",
  "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg",
  "https://res.cloudinary.com/pitz/image/upload/v1747237691/svgexport-54_1_ldjke6.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1748884335/image_7_dqkxkj.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746787514/Google_Play-Icon-Logo.wine_dqxxk7.svg",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1747288173/dark_apple_rwpgwi.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746538734/united_kingdom_zud79x.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1747216099/somali_jq5e97.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1748532872/TRC20_ffibtg.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746707947/create_account_gzbijn.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746707947/verify_i9k3dd.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746707947/Transfermoney_hnssjb.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746707947/exchange_gmhyus.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746793801/FXPRIMUS-logo_2_k8ikwb.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746793801/Perfect_Money_Logo_2_niaa2j.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746793800/Group_164023_bluiv9.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746793800/Bitcoin-1_b6ku56.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746793800/Tether_ttkeym.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746793800/ICMCapital_1_qte6tt.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746539125/Appstore_nqe65y.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746539313/googleplay_1_w8djf0.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1748885082/Vector_se1lvr.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1747133499/Omaya_green-logo_yva2ah.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1746551283/qr-code-bc94057f452f4806af70fd34540f72ad_3_jk8lq1.png",
  "https://res.cloudinary.com/dmoqammol/image/upload/v1763650633/Group_34253_ysx2s5.png",
  "https://res.cloudinary.com/pitz/image/upload/v1764575266/Container_9_e1cnzo.png",
  "https://res.cloudinary.com/pitz/image/upload/v1764575158/Container_5_aj1cpq.png",
  "https://res.cloudinary.com/pitz/image/upload/v1764575266/Container_8_c6iouu.png",
  "https://res.cloudinary.com/pitz/image/upload/v1764575156/Container_7_ffwiyh.png",
  "https://res.cloudinary.com/pitz/image/upload/v1764574482/Container_ihax20.png",
  "https://res.cloudinary.com/pitz/image/upload/v1764574805/Container_2_yazuhu.png",
  "https://res.cloudinary.com/pitz/image/upload/v1764575591/Container_11_tss9j7.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1747313820/link-svgrepo-com_pnpakl.svg",
  "https://res.cloudinary.com/pitz/image/upload/v1764942946/alert-circle_llaycw.png",
  "https://res.cloudinary.com/pitz/image/upload/v1763388449/Icon_1_kiuery.png",
  "https://res.cloudinary.com/pitz/image/upload/v1763388449/annotation-check_ergtxp.png",
  "https://res.cloudinary.com/pitz/image/upload/v1763388449/calendar-03_rnsmmq.png",
  "https://res.cloudinary.com/pitz/image/upload/v1746710369/TRC20_tvugf8.png",
  "https://res.cloudinary.com/pitz/image/upload/v1763727113/Frame_34634_zwzons.png",
  "https://res.cloudinary.com/dam1sxczj/image/upload/v1748601844/Icon_1_yzegcg.png",
];

function getFilename(url) {
  const parts = url.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  return last || "unknown";
}

async function download(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} => ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const manifest = {};
  let ok = 0;
  let fail = 0;

  for (const url of CLOUDINARY_URLS) {
    const filename = getFilename(url);
    const localPath = path.join(OUT_DIR, filename);
    const publicPath = `/assets/${filename}`;
    manifest[url] = publicPath;

    try {
      const buf = await download(url);
      fs.writeFileSync(localPath, buf);
      console.log("OK", filename);
      ok++;
    } catch (e) {
      console.error("FAIL", filename, e.message);
      fail++;
    }
  }

  const manifestPath = path.join(ROOT, "lib", "constants", "cloudinary-asset-paths.json");
  const manifestDir = path.dirname(manifestPath);
  if (!fs.existsSync(manifestDir)) fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log("\nManifest written to lib/constants/cloudinary-asset-paths.json");

  // Replace Cloudinary URLs in source files with /assets/ paths
  const extDirs = [
    path.join(ROOT, "app"),
    path.join(ROOT, "components"),
    path.join(ROOT, "features"),
    path.join(ROOT, "utils"),
    path.join(ROOT, "lib"),
  ];
  let replaceCount = 0;
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && e.name !== "node_modules") walk(full);
      else if (e.isFile() && /\.(tsx?|jsx?)$/.test(e.name)) {
        let content = fs.readFileSync(full, "utf8");
        let changed = false;
        for (const [url, publicPath] of Object.entries(manifest)) {
          const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const re = new RegExp(escaped, "g");
          if (re.test(content)) {
            content = content.replace(re, publicPath);
            changed = true;
            replaceCount++;
          }
        }
        if (changed) fs.writeFileSync(full, content, "utf8");
      }
    }
  }
  for (const d of extDirs) walk(d);
  console.log("Replaced", replaceCount, "URL occurrence(s) in source with /assets/ paths.");
  console.log("Done:", ok, "ok,", fail, "failed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
