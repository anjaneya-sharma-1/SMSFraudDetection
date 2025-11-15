#!/bin/bash
# Test script for multilingual flow (frontend /api/analyze)
# Ensure both the frontend and ml_service are running (or deploy endpoints set via env variables)

# Example Hindi message
TEXT="आपके बैंक खाते में अनियमित गतिविधि का पता चला है। अपनी जानकारी अपडेट करने के लिए यहाँ क्लिक करें: fake-bank.in/verify"

curl -s -X POST http://127.0.0.1:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$TEXT\"}" | jq

# Output will show language detection and translatedText in 'input' along with ML/LLM agent analysis

# Example Punjabi delivery update (expected but regional language)
TEXT_PA="ਤੁਹਾਡਾ ਪਾਰਸਲ ਡਿਲਿਵਰੀ ਹੋ ਗਿਆ ਹੈ, ਲਿੰਕ: fake-delivery.in/track"
curl -s -X POST http://127.0.0.1:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$TEXT_PA\"}" | jq

# This will show agents report a 'language: pa' field, a suspicionScore and classification; if classification is 'benign' but suspicionScore is high, check mismatchExplanation field.
