# 🛡️ SMS Fraud Detection System

A hybrid AI-powered system that combines traditional machine learning with large language models to detect fraudulent SMS messages.

## 🏗️ Architecture

```
📱 Next.js Frontend (Vercel)
    ↓ 
🧠 4 LLM Agents (Groq) + 🤖 ML Model (Render)
    ↓
🎯 Hybrid Decision Engine
```

## ✨ Features

- **🚀 Hybrid Analysis**: Traditional ML (93.97% accuracy) + LLM contextual understanding
- **⚡ Parallel Processing**: ML and LLM agents run simultaneously
- **🎨 Beautiful UI**: Clear visualization of both ML and LLM results
- **🌐 Production Ready**: Vercel + Render deployment configuration
- **🔄 Graceful Fallback**: Works even if one system fails

## 🛠️ Tech Stack

### Frontend & LLM
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Groq API** - Fast LLM inference (4 specialized agents)

### ML Backend  
- **FastAPI** - Python web framework
- **scikit-learn** - SVM + TF-IDF model (93.97% accuracy)
- **NLTK** - Text preprocessing
- **Uvicorn** - ASGI server

## 🚀 Quick Start

### Development Setup
```bash
# 1. Install dependencies
npm install
python -m venv .venv
.venv/Scripts/activate  # Windows
source .venv/bin/activate  # macOS/Linux
pip install -r ml_service/requirements.txt

# 2. Set up environment variables
cp .env.local.example .env.local
# Add your GROQ_API_KEY

# 3. Start both services
./start-dev.bat  # Windows
./start-dev.sh   # macOS/Linux
```

### Manual Start
```bash
# Terminal 1: ML Service
cd ml_service
python app.py

# Terminal 2: Next.js App
npm run dev
```

## 🌐 Deployment

### Production Deployment (Vercel + Render)

1. **Deploy ML Service to Render**:
   - Push `ml_service/` to Git
   - Import to Render dashboard
   - Use provided `Dockerfile` and `render.yaml`

2. **Deploy Next.js to Vercel**:
   ```bash
   npx vercel --prod
   ```
   
3. **Configure Environment Variables in Vercel**:
   - `GROQ_API_KEY`: Your Groq API key
   - `ML_SERVICE_URL`: Your Render service URL

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🧪 How It Works

### 1. **Traditional ML Analysis** (Fast - ~10ms)
- SVM classifier with TF-IDF vectorization
- Trained on SMS dataset with 93.97% accuracy
- Returns: prediction, confidence, class probabilities

### 2. **LLM Agent Analysis** (Contextual - ~2-3s)
- **Content Analysis Agent**: Semantic patterns, psychological manipulation
- **Link Security Agent**: URL analysis, domain reputation
- **Sender Verification Agent**: Identity verification, spoofing detection
- **Context Awareness Agent**: Timing, frequency, expectedness

### 3. **Hybrid Decision Engine**
- Combines both ML and LLM insights
- Explains reasoning from both approaches
- Handles disagreements intelligently

## 📊 Example Analysis

**Input**: `"URGENT! Your account will be suspended. Verify now at fake-bank.com"`

**ML Result**: 
- Prediction: `spam` (89% confidence)
- Probabilities: `{ham: 0.11, spam: 0.89}`

**LLM Analysis**:
- Content: High urgency, fear tactics (0.85 risk)
- Link: Suspicious domain, not official bank (0.92 risk)
- Sender: Impersonation indicators (0.78 risk)
- Context: Unexpected timing (0.65 risk)

**Final Decision**: `HIGH RISK` - "Both ML statistical analysis and contextual LLM evaluation identify this as a fraudulent message"

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key for LLM agents | `gsk_...` |
| `ML_SERVICE_URL` | URL of the ML service | `https://your-service.onrender.com` |

### Customization

- **ML Model**: Replace `spam_detection_model.pkl` with your trained model
- **LLM Agents**: Modify system prompts in `/app/api/analyze/route.ts`
- **UI**: Customize components in `/components/`

## 📈 Performance

- **ML Service**: ~10ms response time
- **LLM Agents**: ~2-3s parallel processing
- **Total Analysis**: ~3s for comprehensive hybrid analysis
- **Accuracy**: 93.97% (traditional ML) + contextual understanding (LLM)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with both services
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** for fast LLM inference
- **Vercel** for excellent Next.js hosting
- **Render** for reliable Python service hosting
- **scikit-learn** for ML capabilities

---

**🛡️ Protecting users from SMS fraud with the power of hybrid AI! 🚀**