import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const placesPath = "data/places.json";
const places = JSON.parse(fs.readFileSync(placesPath, "utf-8"));

const PEXELS_KEY = process.env.PEXELS_API_KEY;

async function fetchPexelsImages() {
  for (const place of places) {
    const query = `${place.name} ${place.location.city}`;
    console.log(`🖼️ Buscando imagens (Pexels): ${query}`);

    if (!place.medias) place.medias = [];

    try {
      const response = await axios.get(
        "https://api.pexels.com/v1/search",
        {
          headers: {
            Authorization: PEXELS_KEY
          },
          params: {
            query,
            per_page: 3
          }
        }
      );

      const images = response.data.photos.slice(0, 3);

      for (const img of images) {
        place.medias.push({
          type: "image",
          source: "pexels",
          url: img.src.large,
          author: img.photographer
        });
      }
    } catch (error) {
      console.log(`❌ Erro ao buscar imagens no Pexels para ${place.name}`);
    }
  }

  fs.writeFileSync(placesPath, JSON.stringify(places, null, 2));
  console.log("✅ Imagens do Pexels adicionadas com sucesso!");
}

fetchPe
