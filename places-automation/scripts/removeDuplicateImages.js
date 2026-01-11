import fs from "fs";

const placesPath = "data/places.json";
const places = JSON.parse(fs.readFileSync(placesPath, "utf-8"));

let totalRemoved = 0;

for (const place of places) {
  if (!place.medias || place.medias.length === 0) continue;

  const seen = new Set();

  place.medias = place.medias.filter(media => {
    if (media.type !== "image") return true;

    const key = media.url;

    if (seen.has(key)) {
      totalRemoved++;
      return false;
    }

    seen.add(key);
    return true;
  });
}

fs.writeFileSync(placesPath, JSON.stringify(places, null, 2));

console.log(`🧹 Imagens duplicadas removidas: ${totalRemoved}`);
console.log("✅ Limpeza concluída!");
