import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const placesPath = "places.json";
const places = JSON.parse(fs.readFileSync(placesPath, "utf-8"));

const UNSPLASH_KEY = process.env.UNSPLASH_API_KEY;

async function fetchUnsplashImages() {
  for (const place of places) {
    const query = `${place.name} ${place.location.city}`;
    console.log(`🖼️ Buscando imagens (Unsplash): ${query}`);

    if (!place.medias) place.medias = [];

    try {
      const response = await axios.get(
        "https://api.unsplash.com/search/photos",
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_KEY}`
          },
          params: {
            query,
            per_page: 3,
            orientation: "landscape"
          }
        }
      );

      const images = response.data.results.slice(0, 3);

      for (const img of images) {
        place.medias.push({
          type: "image",
          source: "unsplash",
          url: img.urls.regular,
          author: img.user.name
        });
      }
    } catch (error) {
      console.log(`❌ Erro ao buscar imagens no Unsplash para ${place.name}`);
    }
  }

  fs.writeFileSync(placesPath, JSON.stringify(places, null, 2));
  console.log("✅ Imagens do Unsplash adicionadas com sucesso!");
}

fetchUnsplashImages();
