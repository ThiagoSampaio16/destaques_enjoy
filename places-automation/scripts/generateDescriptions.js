const fs = require("fs");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// DEBUG
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "OK" : "NÃO ENCONTRADA");

if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY não encontrada no .env");
  process.exit(1);
}

const placesPath = "data/places.json";

// Verificação de arquivo
if (!fs.existsSync(placesPath)) {
  console.error("❌ data/places.json não existe");
  process.exit(1);
}

const fileContent = fs.readFileSync(placesPath, "utf-8").trim();

if (!fileContent) {
  console.error("❌ places.json está vazio");
  process.exit(1);
}

const places = JSON.parse(fileContent);

console.log(`📦 Lugares carregados: ${places.length}`);

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function generateDescription(place) {
  const prompt = `
Gere uma descrição detalhada e atrativa para o lugar "${place.name}" localizado em ${place.location.city}, ${place.location.state}.

Categoria: ${place.category}
Subcategoria: ${place.subcategory}
Tags: ${place.tags.join(", ")}

Regras:
- 150 a 250 palavras
- Português do Brasil
- Texto envolvente para app de turismo
- Retorne SOMENTE a descrição
`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 512   // ← VALOR SEGURO
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error(
      `❌ ${place.name}:`,
      err.response?.data || err.message
    );
    return null;
  }
}

(async function run() {
  console.log("🚀 Iniciando geração de descrições...\n");

  let updated = 0;

  for (const place of places) {
    if (place.description && place.description.length > 100) {
      console.log(`⏭️  ${place.name} (já tem descrição)`);
      continue;
    }

    console.log(`⏳ Gerando descrição para: ${place.name}`);

    const desc = await generateDescription(place);

    if (desc) {
      place.description = desc;
      place.ai_generated = true;
      updated++;
      console.log("✅ OK\n");
    } else {
      console.log("⚠️  Falhou\n");
    }

    await new Promise(r => setTimeout(r, 1200));
  }

  fs.writeFileSync(placesPath, JSON.stringify(places, null, 2));
  console.log("💾 Arquivo salvo");
  console.log(`✅ Descrições geradas: ${updated}`);
})();
