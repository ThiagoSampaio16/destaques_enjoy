import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const placesPath = "data/places.json";
const places = JSON.parse(fs.readFileSync(placesPath, "utf-8"));

const PEXELS_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_KEY = process.env.PIXABAY_API_KEY;

const videosDir = "assets/videos";

if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

async function fetchVideos() {
  for (const place of places) {
    const query = `${place.name} ${place.location.city}`;
    console.log(`🎥 Buscando vídeos de: ${query}`);

    if (!place.medias) place.medias = [];

    let videosAdded = 0;

    // 🔹 1ª tentativa: PEXELS
    try {
      const response = await axios.get(
        "https://api.pexels.com/videos/search",
        {
          headers: { Authorization: PEXELS_KEY },
          params: {
            query,
            per_page: 2
          }
        }
      );

      const videos = response.data.videos.slice(0, 2);

      for (const video of videos) {
        place.medias.push({
          type: "video",
          source: "pexels",
          url: video.video_files[0].link,
          thumbnail: video.image
        });
        videosAdded++;
      }
    } catch (err) {
      console.log("⚠️ Pexels falhou, tentando Pixabay...");
    }

    // 🔹 Fallback: PIXABAY
    if (videosAdded < 2) {
      try {
        const response = await axios.get(
          `https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}`
        );

        const videos = response.data.hits.slice(0, 2 - videosAdded);

        for (const video of videos) {
          const videoUrl = video.videos.medium.url;
          const fileName = `${place.id}_${Date.now()}.mp4`;
          const filePath = path.join(videosDir, fileName);

          const videoStream = await axios.get(videoUrl, {
            responseType: "stream"
          });

          const writer = fs.createWriteStream(filePath);
          videoStream.data.pipe(writer);

          await new Promise(resolve => writer.on("finish", resolve));

          place.medias.push({
            type: "video",
            source: "pixabay",
            url: filePath,
            isLocal: true
          });
        }
      } catch (err) {
        console.log("❌ Pixabay também não retornou vídeos.");
      }
    }
  }

  fs.writeFileSync(placesPath, JSON.stringify(places, null, 2));
  console.log("✅ Vídeos adicionados com sucesso!");
}

fetchVideos();

