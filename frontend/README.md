# 🛡️ SMS Fraud Detection System

An intelligent SMS fraud detection system that combines traditional machine learning with large language model agents to provide comprehensive analysis of potentially fraudulent messages.

## 🧠 How It Works

### **Two-Tier Analysis Approach**

The system uses a hybrid approach combining the speed of traditional ML with the contextual understanding of LLMs:

```
📱 SMS Message Input
        ↓
┌─────────────────────┐    ┌─────────────────────┐
│   ML Classifier     │    │   4 LLM Agents      │
│   (Fast - 10ms)     │    │   (Smart - 2-3s)    │
│                     │    │                     │
│ • SVM + TF-IDF      │    │ • Content Analysis  │
│ • 93.97% Accuracy   │    │ • Link Security     │
│ • Statistical       │    │ • Sender Verify     │
│   Patterns          │    │ • Context Aware     │
└─────────────────────┘    └─────────────────────┘
        ↓                           ↓
        └───────────┐   ┌───────────┘
                    ↓   ↓
            🎯 Hybrid Decision Engine
                    ↓
            📊 Comprehensive Report
```

### **1. Traditional ML Analysis**

- **Technology**: SVM classifier with TF-IDF vectorization
- **Speed**: ~10ms response time
- **Accuracy**: 93.97% on SMS spam datasets
- **Output**: Prediction (spam/ham), confidence score, class probabilities

### **2. LLM Agent Analysis**

Four specialized AI agents analyze different aspects:

#### **Content Analysis Agent**
- Detects psychological manipulation patterns
- Identifies urgency, fear tactics, and authority pressure
- Analyzes semantic meaning beyond keyword matching

#### **Link Security Agent**  
- Extracts and analyzes URLs
- Checks for domain spoofing and suspicious patterns
- Evaluates redirect chains and URL shorteners

#### **Sender Verification Agent**
- Assesses sender authenticity
- Detects brand impersonation attempts  
- Analyzes phone number patterns and reply-to behaviors

#### **Context Awareness Agent**
- Evaluates timing and frequency patterns
- Considers message expectedness
- Analyzes contextual anomalies

### **3. Hybrid Decision Engine**

- Combines statistical ML predictions with contextual LLM insights
- Handles disagreements between systems intelligently
- Provides detailed explanations for decisions
- Gracefully handles system failures (works even if one component fails)

## 🎯 Example Analysis

**Input Message:**
```
"URGENT! Your account will be suspended. Verify now at fake-bank.com"
```

**ML Result:**
```json
{
  "prediction": "spam",
  "confidence": 0.89,
  "probabilities": {
    "ham": 0.11,
    "spam": 0.89
  }
}
```

**LLM Agent Results:**
```json
{
  "content_agent": {
    "risk_score": 0.85,
    "signals": ["urgency_language", "fear_tactics", "action_pressure"],
    "reasoning": "High-pressure language with artificial urgency"
  },
  "link_agent": {
    "risk_score": 0.92,
    "signals": ["suspicious_domain", "impersonation"],
    "reasoning": "Domain mimics legitimate bank but is not authentic"
  },
  "sender_agent": {
    "risk_score": 0.78,
    "signals": ["brand_impersonation", "unauthorized_sender"],
    "reasoning": "Claims to be from bank without proper verification"
  },
  "context_agent": {
    "risk_score": 0.65,
    "signals": ["unexpected_timing", "unsolicited"],
    "reasoning": "Unexpected account verification request"
  }
}
```

**Final Decision:**
```
🚨 HIGH RISK - LIKELY FRAUD
Both statistical analysis and contextual evaluation indicate fraudulent content with high confidence.
```

## ⚡ Performance Characteristics

| Metric | Value | Description |
|--------|--------|-------------|
| **ML Response Time** | ~10ms | Lightning-fast statistical analysis |
| **LLM Analysis Time** | ~2-3s | Comprehensive contextual evaluation |
| **Total Analysis Time** | ~3s | Complete hybrid analysis |
| **ML Accuracy** | 93.97% | Tested on SMS spam datasets |
| **Concurrent Processing** | Yes | ML and LLM run in parallel |

## 🧪 Model Training & Dataset

### **Training Notebook**
📓 **[View Full Training Process on Google Colab](https://colab.research.google.com/drive/1qtaLwVRkDtL1J2SkBAt23fYaMN7gBZ7t?usp=sharing)**

### **Dataset Overview**
- **Size**: 5,971 SMS messages
- **Labels**: 5 categories (ham, spam, Smishing, smishing, Spam)
- **Distribution**: 
  - Ham (legitimate): 81.1% (4,844 messages)
  - Smishing: 10.3% (616 messages)  
  - Spam: 7.8% (466 messages)
  - Other variants: <1%

### **Training Pipeline**

#### **1. Data Preprocessing**
- **Text Cleaning**: Lowercasing, punctuation removal, number normalization
- **Advanced Processing**: Stopword removal, lemmatization, short word filtering
- **Feature Extraction**: 12 additional statistical features
  - Text statistics (char count, word count, sentence count, avg word length)
  - Special characters (!, ?, $, %)
  - Capital letter ratio, URL presence, phone number detection
  - Urgency keywords, spam keywords, time-related terms

#### **2. Model Comparison**
Multiple algorithms tested with TF-IDF vectorization:
- **Support Vector Machine (SVM)**: 93.97% accuracy ⭐
- **Logistic Regression**: 94.39% accuracy (after hyperparameter tuning)
- **Random Forest**: Comparative performance testing
- **Naive Bayes**: Baseline comparison

#### **3. Hyperparameter Optimization**
**Best SVM Configuration:**
- **Vectorizer**: TF-IDF with n-grams (1,3), max_features=10,000
- **Classifier**: SVM with optimized C parameter
- **Cross-validation**: 5-fold validation for robust evaluation

#### **4. Model Performance**
**Final Test Results:**
```
                precision    recall  f1-score   support
    Smishing       0.89      0.83      0.86       123
        Spam       0.00      0.00      0.00         5
         ham       0.96      0.99      0.98       970
    smishing       0.00      0.00      0.00         4
        spam       0.82      0.67      0.73        93

    accuracy                           0.94      1195
   macro avg       0.53      0.50      0.51      1195
weighted avg       0.94      0.94      0.94      1195
```

#### **5. Sample Predictions**
**Test Message Examples:**
- `"Congratulations! You've won $1000!"` → **Smishing** (99.5% confidence)
- `"Hey, are you free for lunch tomorrow?"` → **Ham** (99.2% confidence)
- `"URGENT: Your account will be suspended"` → **Smishing** (79.3% confidence)
- `"Free iPhone! Text STOP to unsubscribe"` → **Spam** (90.5% confidence)

### **Model Artifacts**
- **Saved Model**: `spam_detection_model.pkl` (SVM + TF-IDF pipeline)
- **Feature Engineering**: Automated text preprocessing and statistical feature extraction
- **Deployment**: Integrated into FastAPI service for real-time inference

## 🏗️ System Architecture

### **Frontend (Next.js)**
- Modern React-based interface
- Real-time analysis visualization
- Responsive design with component library
- Type-safe with TypeScript

### **ML Service (Python/FastAPI)**
- Pre-trained SVM model with TF-IDF vectorization
- RESTful API with automatic documentation
- Efficient text preprocessing pipeline
- Fast inference with scikit-learn

### **LLM Integration (Groq)**
- Four specialized agent prompts
- Parallel processing for speed
- Structured JSON output parsing
- Error handling and graceful degradation

## 🔧 Key Features

### **Accuracy & Speed**
- Combines statistical precision with contextual understanding
- Parallel processing minimizes total analysis time
- High accuracy across different fraud types

### **Explainability**
- Detailed reasoning from both ML and LLM components
- Clear visualization of risk factors
- Transparent decision-making process

### **Robustness**
- Graceful fallback if one system fails
- Input validation and error handling
- Scalable architecture design

### **User Experience**
- Clean, intuitive interface
- Real-time analysis feedback
- Clear risk visualization
- Mobile-responsive design
## 🌐 Multilingual Support (Indian Regional Languages)

This project now supports Indian regional languages (e.g., Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia) by automatically detecting and translating the original text to English before sending it to the ML classifier. LLM agents receive both the translated English text and the original message to reason about context and language-specific signals.

Configuration:
- `TRANSLATION_MODEL` environment variable (optional): choose the LLM model used for translation (defaults to `llama-3.3-70b-versatile`).
 - `TRANSLATION_MODEL` environment variable (optional): choose the LLM model used for translation (defaults to `llama-3.3-70b-versatile`).
 - `AGENT_MODEL` environment variable (optional): choose the default model for Agents (defaults to `llama-3.1-8b-instant`).
 - `DECISION_MODEL` environment variable (optional): choose the model for the decision engine (defaults to `llama-3.3-70b-versatile`).
- The ML service expects an English sentence for the pre-trained SVM model; translation is performed on the frontend before ML prediction.

Notes:
- The system uses the LLM to detect the message language and translate to English. Translation is logged as metadata and preserved for auditing.
- Agent output now includes an explicit `classification` (benign|suspicious|unknown), a `suspicionScore` (0..1, where 1.0 is most suspicious), and a `confidence` (agent's internal confidence). If there is a mismatch (e.g., classification='benign' but high suspicionScore), agents are instructed to reconcile and explain the rationale clearly; the UI surfaces both values.

Agent scoring semantics:
- `suspicionScore`: numeric value between 0 and 1 where higher indicates more suspicious content. Agents use a threshold:
  - suspicionScore >= 0.7 => classification: `suspicious`
  - suspicionScore <= 0.4 => classification: `benign`
  - otherwise => classification: `unknown`
- `classification`: agent's overall judgement, must be one of `benign` | `suspicious` | `unknown`.
- `mismatchExplanation`: when `classification` contradicts `suspicionScore` (outside the threshold heuristic), the agent must include a `mismatchExplanation` detailing why.

Example decision note:
- If an agent returns `classification: "benign"` but `suspicionScore: 0.7`, that means the agent sees a mix: a high numeric suspicion from signals (0.7) but the agent's final judgment is benign after considering factors such as sender reputation or timing. In this case, the agent must set a `mismatchExplanation` explaining why the final classification differs from numeric suspicion.

Language handling in Agents:
- Agents receive both the translated English text and the original language text. They must detect the language and include it in the `language` field.
- Agents must call out transliteration/codemix or local-language clues that could be relevant for matching sender identity or expectedness.
Example (Hindi):
```bash
curl -s -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d '{"text":"आपके खाते को निलंबित कर दिया जाएगा, यहाँ क्लिक करें: fake-bank.in/verify"}' | jq
```
The system will detect 'hi' (Hindi), translate to English, run ML prediction on the English text, and run multi-agent LLM analysis on the translation while preserving the original text for nuance.
- For code-mixed or transliterated text, the translation attempt may be imperfect; agents are asked to flag ambiguous translations in their rationales.


## 🧪 Technical Implementation

### **Machine Learning Pipeline**
1. Text preprocessing (cleaning, tokenization)
2. TF-IDF vectorization
3. SVM classification
4. Confidence calculation
5. JSON response formatting

### **LLM Agent Pipeline**
1. Specialized prompt engineering
2. Parallel API calls to Groq
3. JSON response parsing
4. Score normalization
5. Multi-agent decision fusion

### **Frontend Integration**
1. Form-based SMS input
2. API route handling
3. Real-time result display
4. Error state management
5. Responsive UI updates

---

**🛡️ Protecting users from SMS fraud with intelligent hybrid AI analysis! 🚀**