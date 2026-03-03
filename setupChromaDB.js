require("dotenv").config();
const { ChromaClient } = require("chromadb");
const { medicalKnowledge } = require("./knowledge/medicalKnowledge");
const { createEmbedding } = require("./utils/embeddings");

async function seedChroma() {
  const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";
  const client = new ChromaClient({ path: chromaUrl });
  const collection = await client.getOrCreateCollection({ name: "parahelper_medical" });

  const ids = [];
  const documents = [];
  const metadatas = [];
  const embeddings = [];

  for (const item of medicalKnowledge) {
    ids.push(item.id);
    documents.push(item.content);
    metadatas.push({ title: item.title, role: item.role });
    const embedding = await createEmbedding(`${item.title}: ${item.content}`);
    embeddings.push(embedding);
  }

  await collection.upsert({ ids, documents, metadatas, embeddings });
  console.log(`[chroma] Seeded ${ids.length} docs`);
}

seedChroma().catch((error) => {
  console.error("[chroma] Seed failed", error);
  process.exit(1);
});
