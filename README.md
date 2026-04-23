# ResearchMind 🧠

ResearchMind is an academic intelligence platform that allows researchers to upload, analyze, and converse with academic papers. This platform leverages modern React frontend practices and a Django backend to deliver rapid insights via PDF extraction and an AI chat interface.

## Tech Stack

### Backend
- **Django 4.x** - Web framework
- **Django REST Framework (DRF)** - API layer
- **PyPDF2** - PDF text extraction
- **scikit-learn** - Machine learning for clustering
- **Optional: OpenAI GPT-4** - AI chat capabilities

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS
- **D3 v7** - Data visualization (force-directed graphs)
- **Framer Motion** - Animation library
- **TanStack Query v5** - Data fetching and caching

## Features

- **PDF Upload** - Upload and process academic papers
- **arXiv Import** - Import papers directly from arXiv
- **AI Chat** - Conversational interface powered by OpenAI (with extractive fallback when API key not configured)
- **Citation Graph** - Interactive D3.js force-directed citation network visualization
- **Topic Clustering** - Automatic topic discovery using TF-IDF + KMeans/DBSCAN
- **Paper Library** - Full library management with search, filter, and sort capabilities
- **Chat History** - Persistent chat sessions with context preservation

## Prerequisites

Before running the project, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Python** (3.9 or higher)
- **npm** or **yarn**

## Environment Variables

### Backend (.env)
Create a `.env` file in the `backend/` directory with the following variables:

```env
SECRET_KEY=django-insecure-change-me-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
OPENAI_API_KEY=your-openai-api-key-here
LOG_LEVEL=INFO
```

### Frontend (.env)
Create a `.env` file in the `frontend/` directory with the following variables:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_BASE_URL=ws://127.0.0.1:8000
```

## 🚀 Running the Project Locally

### Quick Start (Windows)
```bash
# Run the setup script
SETUP_ALL.bat
```

### Manual Setup

#### 1. Backend Setup (Django)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate your virtual environment (create one if you haven't already):
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run database migrations:
   ```bash
   python manage.py migrate
   ```
5. Start the Django development server:
   ```bash
   python manage.py runserver
   ```
   *The backend will run at `http://127.0.0.1:8000/`*

#### 2. Frontend Setup (React/Vite)

1. Open a **new terminal window** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the required Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:5173/` (or the port specified by Vite).*

---

## ⚙️ How to Use

1. **Upload Papers**: Visit the "Upload New" section in the web application to upload PDFs or import arXiv links.
2. **Library**: Go to "My Papers" to see all your processed documents.
3. **Chat**: Click on "Chat with Paper" to launch the AI conversation interface and explore insights.
4. **Citation Graph**: Visualize citation networks with interactive D3.js graphs.
5. **Topic Clustering**: Explore automatically discovered topic clusters in your paper library.

---

## Known Limitations

- **No WebSocket Server**: Chat functionality uses HTTP fallback instead of WebSocket connections
- **SQLite Only**: The current configuration uses SQLite. For production, swap `DATABASE_URL` to use PostgreSQL
- **No Background Workers**: PDF processing is synchronous. For production, consider implementing background task queues like Celery

---

## Testing

Run the test suite:

```bash
cd backend
pytest tests/test_papers_api.py
```

---

Enjoy using ResearchMind to augment your academic workflow!