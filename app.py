from flask import Flask, request, jsonify, render_template
from groq import Groq

app = Flask(__name__)

client = Groq(api_key="ApiKey")

MODEL = "llama-3.3-70b-versatile"

conversation_history = []
current_topic = ""

SYSTEM_PROMPT = """You are simulating a live podcast called "The Deep Dive" with 3 distinct AI personas:

PERSONA 1 — Host: Alex
Role: Podcast moderator and guide
Personality: Enthusiastic, warm, curious. Drives the narrative forward.

PERSONA 2 — Explainer: Sam
Role: The educator and concept explainer
Personality: Clear, methodical, uses analogies and real-world examples.

PERSONA 3 — Devil's Advocate: Jamie
Role: Critical thinker and contrarian
Personality: Challenges every idea, finds counterexamples, pushes everyone to think harder.

STRICT OUTPUT FORMAT — ALWAYS use this exact structure every single response:

Host: [Alex's dialogue — 2-4 sentences]
Explainer: [Sam's dialogue — 2-4 sentences]
Devil: [Jamie's dialogue — 2-4 sentences]

RULES:
1. Always output ALL THREE speakers in every response in order: Host, Explainer, Devil
2. Build naturally on the previous conversation
3. Keep energy high and engaging
4. When a listener sends a message, Host acknowledges it warmly
5. Be opinionated, entertaining, and intellectually rich
6. Never break character
"""

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/start', methods=['POST'])
def start_podcast():
    global conversation_history, current_topic

    data = request.get_json()
    topic = data.get('topic', '').strip()

    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    conversation_history = []
    current_topic = topic

    opening_prompt = (
        f"Start the podcast with an exciting introduction. "
        f"Today's topic is: '{topic}'. "
        f"Alex opens with energy, Sam gives a crisp overview, "
        f"and Jamie immediately challenges one common assumption. "
        f"Hook the listener in the first sentence."
    )

    conversation_history.append({"role": "user", "content": opening_prompt})

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *conversation_history
            ],
            max_tokens=900,
            temperature=0.85
        )

        ai_response = response.choices[0].message.content.strip()
        conversation_history.append({"role": "assistant", "content": ai_response})

        return jsonify({'response': ai_response, 'topic': topic})

    except Exception as e:
        return jsonify({'error': f'API error: {str(e)}'}), 500


@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '').strip()

    if not user_message:
        return jsonify({'error': 'Message is required'}), 400

    if not conversation_history:
        return jsonify({'error': 'Please start a podcast first.'}), 400

    framed = (
        f"A listener just said: \"{user_message}\". "
        f"Alex acknowledges them warmly, Sam explains or expands, "
        f"and Jamie challenges or complicates it. Then continue the broader discussion."
    )

    conversation_history.append({"role": "user", "content": framed})

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *conversation_history
            ],
            max_tokens=900,
            temperature=0.85
        )

        ai_response = response.choices[0].message.content.strip()
        conversation_history.append({"role": "assistant", "content": ai_response})

        return jsonify({'response': ai_response})

    except Exception as e:
        return jsonify({'error': f'API error: {str(e)}'}), 500


@app.route('/continue', methods=['POST'])
def continue_podcast():
    if not conversation_history:
        return jsonify({'error': 'Please start a podcast first.'}), 400

    continuation = (
        "Continue the discussion naturally. Go deeper into the topic. "
        "Alex transitions to a new angle, Sam provides a fresh insight or analogy, "
        "and Jamie raises a provocative counterpoint."
    )

    conversation_history.append({"role": "user", "content": continuation})

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *conversation_history
            ],
            max_tokens=900,
            temperature=0.9
        )

        ai_response = response.choices[0].message.content.strip()
        conversation_history.append({"role": "assistant", "content": ai_response})

        return jsonify({'response': ai_response})

    except Exception as e:
        return jsonify({'error': f'API error: {str(e)}'}), 500


@app.route('/reset', methods=['POST'])
def reset():
    global conversation_history, current_topic
    conversation_history = []
    current_topic = ""
    return jsonify({'message': 'Podcast reset successfully'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)