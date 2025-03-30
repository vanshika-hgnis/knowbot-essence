# Knowledge Bot (AI-Powered Knowledge Notebook with Concept Graphs) | Github | Figma

<img width="134" alt="image" src="https://github.com/user-attachments/assets/4acf8247-d052-40db-aebc-7a95708ab3b5" />

- Engineered a Next.js application leveraging LangChain.js, Mistral, and E5-Large embeddings to generate structured responses with RAG-based retrieval.
- Implemented concept graph visualization to enhance contextual understanding alongside AI-generated text responses.
- Optimized LLM inference and retrieval workflows, improving response accuracy and retrieval efficiency.

## Run this application

1. Start App

```bash
npm run dev
```

2. Environment Configration

Creating .env file.

```bash
SUPABASE_URL=
SUPABASE_PRIVATE_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=notebook-files
HUGGINGFACE_MODEL=
MISTRAL_API_KEY=
```

3. Run the APIs.

```bash
cd rag-server

ts-node server.ts
ts-node chat.ts

```
