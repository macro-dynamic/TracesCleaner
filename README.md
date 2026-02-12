# 🧹 TracesCleaner

**Detect & Remove Invisible AI Watermarks from Text**

A free, privacy-first tool that finds and removes hidden Unicode characters, zero-width spaces, and other invisible watermarks that AI models embed in generated text.

🔗 **Live Demo:** [https://macro-dynamic.github.io/TracesCleaner/](https://macro-dynamic.github.io/TracesCleaner/)

---

## ✨ Features

- **70+ Hidden Characters Detected** — Zero-width spaces, direction marks, variation selectors, invisible separators, and more
- **Works with All Major AI Models** — ChatGPT, Claude, Gemini, Copilot, DeepSeek, LLaMA, Grok, Mistral, Perplexity
- **Homoglyph Detection** — Catches Cyrillic, Greek, and fullwidth character substitutions
- **Whitespace Anomaly Detection** — Trailing spaces, double spaces, mixed line endings, special space characters
- **Annotated Reveal View** — See exactly where hidden characters are with color-coded badges
- **HTML Tag Stripping** — Optional removal of embedded HTML tags
- **100% Private** — Everything runs in your browser. No data is sent anywhere.
- **PWA / Offline Support** — Install as an app and use offline
- **Dark Theme** — Easy on the eyes

## 🚀 Quick Start

Just open `index.html` in any modern browser — no build step required.

Or serve locally:

```bash
python -m http.server 8080
# Open http://localhost:8080
```

## 🏗️ Project Structure

```
TracesCleaner/
├── index.html                  # Main app
├── invisible-chars.html        # Info: invisible Unicode characters
├── statistical-watermarks.html # Info: statistical watermarking
├── css/
│   └── styles.css              # Dark theme styles
├── js/
│   ├── watermark-detector.js   # Core detection engine
│   └── app.js                  # UI logic
├── img/
│   ├── icon.svg                # App icon (PWA/favicon)
│   └── og-image.svg            # Social sharing image
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker (offline)
└── README.md
```

## 🛠️ How It Works

1. **Paste** your AI-generated text
2. **Clean** removes all invisible watermark characters while preserving real content
3. **Reveal** shows an annotated view highlighting every hidden character
4. **Inject Demo** lets you see how watermarks are embedded

## 📄 License

MIT — use it however you want.
