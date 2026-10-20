/**
 * Watches assets/images/brands and auto-regenerates brands-data.js
 * Run once while developing: npm run watch-brands
 */
const fs = require("fs");
const { syncBrands, BRANDS_DIR } = require("./sync-brands");

let timer = null;
const debounceSync = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      syncBrands();
    } catch (err) {
      console.error("Brand sync failed:", err.message);
    }
  }, 200);
};

if (!fs.existsSync(BRANDS_DIR)) {
  fs.mkdirSync(BRANDS_DIR, { recursive: true });
}

syncBrands();
fs.watch(BRANDS_DIR, { persistent: true }, debounceSync);
console.log(`Watching ${BRANDS_DIR}`);
console.log("Add/remove/rename images — the trust strip list updates automatically.");
console.log("Press Ctrl+C to stop.");