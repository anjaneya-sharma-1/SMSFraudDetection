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