# 🎙️ AI Podcast Platform

An interactive multi-agent AI system that simulates a live podcast with different perspectives to enhance learning and critical thinking.

---

## 🚀 Features

* 🎭 Multi-agent AI system

  * Host (moderator)
  * Explainer (educator)
  * Devil’s Advocate (critical thinker)

* 💬 Real-time interaction
  Ask questions during the discussion

* 🔁 Dynamic conversation
  Continue and evolve discussions

* 🎯 Multiple modes

  * Discussion mode
  * Interview mode
  * Learning mode

* 🧠 Context-aware responses
  Maintains full conversation history

* 📄 Transcript export
  Download full discussion

---

## 🏗️ Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Python (Flask)
* **LLM:** Groq API (LLaMA 3.3)

---

## ⚙️ How to Run Locally

### 1. Clone repo

```bash
git clone https://github.com/YOUR_USERNAME/ai-podcast-platform.git
cd ai-podcast-platform
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Add API key

Linux/Mac:

```bash
export GROQ_API_KEY=your_api_key_here
```

Windows:

```bash
set GROQ_API_KEY=your_api_key_here
```

### 4. Run server

```bash
python app.py
```

### 5. Open in browser

```
http://127.0.0.1:5000
```

---

## 🧠 How It Works

* User enters a topic
* Backend sends structured prompt to LLM
* AI generates responses from 3 personas
* Frontend parses and displays them dynamically

---

## 📸 Demo Flow

1. Enter topic
2. Start podcast
3. Watch multi-agent discussion
4. Ask questions
5. Continue conversation

---

## 📌 Future Improvements

* 🎤 Voice input/output
* 🌐 Deployment (public link)
* 🧩 More AI personas
* 📊 Learning analytics

---

## 👨‍💻 Author

Adarsh Reddy
