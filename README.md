<img width="1536" height="250" alt="ChatGPT Image Dec 22, 2025, 11_02_23 PM" src="https://github.com/user-attachments/assets/7aadea7a-9a7f-4ee0-a87d-bd810fec4e0d" />


 PyPal AI Verse — Chatbot with RAG (ChatGPT-like Clone)

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react)
![FAISS](https://img.shields.io/badge/FAISS-Vector%20Search-blue)
![Ollama](https://img.shields.io/badge/Ollama-Mistral-orange)
![JWT](https://img.shields.io/badge/Auth-JWT-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

> **PyPal AI Verse** is a **ChatGPT-like AI chatbot** with **Retrieval-Augmented Generation (RAG)** that provides **document-grounded answers** using uploaded PDFs.

---

## ✨ Key Highlights

- 🔐 Secure **JWT Authentication**
- 🤖 LLM inference using **Ollama (Mistral)**
- 📄 Upload & query **PDF documents**
- 🧠 **FAISS-based semantic search**
- ⚡ Streaming responses (ChatGPT-style)
- 👤 Per-user isolated vector stores
- 📊 Admin & user dashboards

---

## 🧠 What is RAG?

**Retrieval-Augmented Generation (RAG)** combines:
1. **Vector search** over user documents
2. **LLM reasoning** on retrieved context

This ensures:
- ❌ No hallucinations
- ✅ Answers strictly based on documents
- ✅ Enterprise-grade accuracy

---

## 🏗️ System Architecture

User
│
▼
React Frontend
│
▼
FastAPI Backend
│
├─ Normal Chat (No PDFs)
│
└─ RAG Chat (PDFs Exist)
│
├─ PDF Upload
├─ Text Extraction
├─ Chunking
├─ Embeddings
├─ FAISS Vector Store
└─ Context → LLM (Mistral)


---

## 🔄 RAG Flow (Step-by-Step)

1. User uploads PDF (`/rag/upload`)
2. Text extracted & chunked
3. Embeddings generated (384-dim)
4. Stored in **FAISS per user**
5. User query embedded
6. Top-K similar chunks retrieved
7. Context injected into LLM prompt
8. Document-grounded response streamed

---

## 🧰 Tech Stack

### Backend
- **FastAPI**
- **MongoDB**
- **FAISS**
- **Ollama (Mistral)**
- **JWT Auth**
- **Python**

### Frontend
- **React.js**
- **Tailwind CSS**
- **Fetch API**

---

## 📁 Project Structure

app/
├── auth/ # JWT authentication
├── rag/ # RAG pipeline
│ ├── embeddings.py
│ ├── retriever.py
│ └── service.py
├── chat/ # Streaming chat
├── indexes/ # FAISS indexes
│ ├── username.index
│ └── username.index.pkl
└── main.py


---

## 📦 Vector Store Details

- 🔢 Embedding Dimension: **384**
- 📐 Similarity Metric: **Inner Product**
- 👤 Isolation: **Per user**
- 📁 Storage:

indexes/
├── user1.index
├── user1.index.pkl


---

## 🔐 Authentication Flow

- **Signup** → Password hashed → JWT issued
- **Login** → Token generated
- JWT required for:
- `/chat`
- `/rag/upload`
- `/rag/documents`

---

## 🌐 API Endpoints

| Endpoint | Method | Description |
|-------|------|------------|
| `/auth/signup` | POST | Register user |
| `/auth/login` | POST | Login |
| `/rag/upload` | POST | Upload PDF |
| `/rag/documents` | GET | List PDFs |
| `/rag/documents/{id}` | DELETE | Delete PDF |
| `/chat` | POST | Stream chat response |

---

## ▶️ Running the Project

### Backend
```bash
uvicorn app.main:app --reload


Frontend

npm install
npm start

⚠️ Limitations

Scanned PDFs (OCR) not supported yet

Non-Unicode Hindi PDFs may misbehave

No long-term chat memory (yet)

🚀 Future Enhancements

OCR support for scanned PDFs

Multilingual embeddings

Conversation memory

Admin analytics dashboard

Multi-document reasoning

🎯 Use Cases

📚 Knowledge-base chatbot

⚖️ Legal document assistant

🏢 Enterprise document Q&A

📄 Internal company policies chatbot

📌 Status

✅ RAG pipeline working
✅ FAISS retrieval verified
✅ Streaming responses enabled
✅ Production-ready backend

👨‍💻 Author

Shobhit Pal
AI / Backend Engineer
FastAPI • RAG • LLM • FAISS


---
⭐ If you find this project useful, give it a star!

### ✅ Next time hum kya kar sakte hain
- Short README version
- Enterprise-grade README
- Architecture PNG diagram
- Resume-ready project explanation

Jab bolega, tab next step 🚀
