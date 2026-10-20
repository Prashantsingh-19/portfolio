# Earnings Intelligence Copilot

## Earnings Intelligence Copilot: what it is
Earnings Intelligence Copilot is a RAG-style research prototype Prashant built in Python and Streamlit. It helps analysts find and compare management commentary across earnings-call transcripts. It retrieves relevant transcript excerpts, shows the evidence behind each result (company, ticker, quarter, source and relevance), and highlights guidance on capital expenditure and margins. The design principle: analyst-facing outputs must stay traceable to source material rather than relying on unsupported summaries.

## Earnings Intelligence Copilot: how it works
Transcript CSVs are parsed for metadata and split into overlapping text chunks to keep context across long calls. A local TF-IDF and cosine-similarity retrieval layer finds relevant chunks, so it runs without an API key. Keyword-driven extraction pulls capex and margin statements and applies explainable positive, neutral or negative outlook signals. The Streamlit interface supports search, cross-company comparison, monitoring and CSV upload of new transcript collections by company, sector and quarter. Unit tests cover retrieval, guidance scoring and chunking.

## Earnings Intelligence Copilot: scope and roadmap
The Earnings Intelligence Copilot demo ships with illustrative transcript excerpts across technology, financial-services and consumer sectors. It is a research prototype, not investment advice and not a source of live company guidance. The roadmap includes embedding-based vector retrieval (ChromaDB, FAISS or Pinecone), public or licensed investor-relations transcripts, metadata filtering, an LLM tool-calling agent, source validation, evaluation datasets and governance controls.
