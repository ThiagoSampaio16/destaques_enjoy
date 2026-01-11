import { execSync } from "child_process";

const scripts = [
  "scripts/fetchPixabayImages.js",
  "scripts/fetchPexelsImages.js",
  "scripts/fetchUnsplashImages.js",
  "scripts/generateDescriptions.js",
];

try {
  for (const script of scripts) {
    console.log(`\n🚀 Executando: ${script}`);
    execSync(`node ${script}`, { stdio: "inherit" });
  }

  console.log("\n✅ PIPELINE FINALIZADA COM SUCESSO!");
} catch (error) {
  console.error("❌ Erro ao executar a pipeline:", error.message);
}
