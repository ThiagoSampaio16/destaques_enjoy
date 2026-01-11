import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

/* ===============================
   CONFIGURAÇÃO DO DOTENV (FIX)
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY);

/* ===============================
   CONSTANTES
================================ */
const placesPath = path.resolve(__dirname, "../data/places.json");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/* ===============================
   LEITURA SEGURA DO JSON
================================ */
let places = [];

try {
  const fileContent = fs.readFileSync(placesPath, "utf-8");

  if (fileContent.trim()) {
    places = JSON.parse(fileContent);
  } else {
    console.warn("⚠️ places.json está vazio. Usando array vazio.");
    places = [];
  }
} catch (error) {
  console.error("❌ Erro ao ler places.json:", error.message);
  process.exit(1);
}

/* ===============================
   FUNÇÕES
================================ */
function isDescriptionLong(description) {
  return description && description.trim().length > 100;
}

async function generateDescription(place) {
  const prompt = `Gere uma descrição detalhada e atrativa para o lugar turístico "${place.name}" localizado em ${place.location.city}, ${place.location.state}.

Categorias: ${place.categories.join(", ")}
Tags: ${place.tags.join(", ")}

A descrição deve:
- Ter entre 150-250 palavras
- Ser informativa e envolvente
- Destacar características principais
- Ser adequada para um aplicativo de turismo
- Estar em português do Brasil

Retorne apenas a descrição, sem introduções ou explicações adicionais.`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.log(
      `❌ Erro ao gerar descrição para ${place.name}: ${error.response?.status || ""} ${error.message}`
    );
    return null;
  }
}

/* ===============================
   PROCESSO PRINCIPAL
================================ */
async function generateAllDescriptions() {
  if (!GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY não encontrada no .env");
    process.exit(1);
  }

  console.log("\n🚀 Iniciando geração de descrições com Groq...\n");

  let updated = 0;
  let skipped = 0;

  for (const place of places) {
    const hasLongDescription = isDescriptionLong(place.description);

    if (hasLongDescription) {
      console.log(`⏭️  ${place.name} - Descrição já existe (mantida)`);
      skipped++;
      continue;
    }

    console.log(`⏳ Gerando descrição para: ${place.name}`);

    const description = await generateDescription(place);

    if (description) {
      place.description = description;
      place.ai_generated_description = true;
      updated++;
      console.log(`✅ Descrição gerada com sucesso!\n`);
    } else {
      console.log(`⚠️  Falha ao gerar descrição\n`);
    }

    // Delay para evitar rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  fs.writeFileSync(placesPath, JSON.stringify(places, null, 2));

  console.log("\n=== RESUMO ===");
  console.log(`✅ Descrições geradas: ${updated}`);
  console.log(`⏭️  Descrições mantidas: ${skipped}`);
  console.log("💾 Arquivo atualizado com sucesso!");
}

/* ===============================
   EXECUÇÃO
================================ */
generateAllDescriptions().catch(error => {
  console.error("❌ Erro fatal:", error.message);
  process.exit(1);
});
