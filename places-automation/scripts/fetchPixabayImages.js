import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const places = JSON.parse(fs.readFileSync("places.json", "utf-8"));

const PIXABAY_KEY = process.env.PIXABAY_API_KEY;

async function fetchImages() {
  for (const place of places) {
    const query = `${place.name} ${place.location.city}`;
    console.log(`Buscando imagens de: ${query}`);

    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(
      query
    )}&image_type=photo&per_page=5`;

    const response = await axios.get(url);

    place.medias = response.data.hits.map(img => ({
      type: "image",
      source: "pixabay",
      url: img.largeImageURL,
      author: img.user
    }));
  }

  fs.writeFileSync("data/places.json", JSON.stringify(places, null, 2));
  console.log("✅ Imagens adicionadas com sucesso!");
}

fetchImages();
