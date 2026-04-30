/* ══════════════════════════════════════════
   THE DEEP DIVE — AI PODCAST PLATFORM
   Frontend Logic
══════════════════════════════════════════ */

// ── DOM REFS ──────────────────────────────────────────────────────
const topicInput      = document.getElementById('topicInput');
const startBtn        = document.getElementById('startBtn');
const userInput       = document.getElementById('userInput');
const sendBtn         = document.getElementById('sendBtn');
const continueBtn     = document.getElementById('continueBtn');
const resetBtn        = document.getElementById('resetBtn');
const chatFeed        = document.getElementById('chatFeed');
const feedEmpty       = document.getElementById('feedEmpty');
const loadingBar      = document.getElementById('loadingBar');
const loadingText     = document.getElementById('loadingText');
const podcastStatus   = document.getElementById('podcastStatus');
const epTitle         = document.getElementById('epTitle');
const epMeta          = document.getElementById('epMeta');

// ── STATE ─────────────────────────────────────────────────────────
let isLive         = false;
let turnCount      = 0;
let startTime      = null;
let timerInterval  = null;

// ── HELPER: set status badge ──────────────────────────────────────
function setStatus(mode, label) {
  const dot = podcastStatus.querySelector('.status-dot');
  const lbl = podcastStatus.querySelector('.status-label');
  dot.className = `status-dot ${mode}`;
  lbl.textContent = label;
}

// ── HELPER: set loading state ─────────────────────────────────────
function setLoading(active, message = 'Generating discussion…') {
  if (active) {
    loadingBar.classList.add('active');
    loadingText.textContent = message;
    setStatus('thinking', 'Thinking…');
  } else {
    loadingBar.classList.remove('active');
    if (isLive) setStatus('live', 'Live');
  }
}

// ── HELPER: activate wave animation for a speaker ─────────────────
function activateWave(speaker) {
  const waveIds = { host: 'wave-host', explainer: 'wave-explainer', devil: 'wave-devil' };
  Object.values(waveIds).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const target = waveIds[speaker];
  if (target) {
    const el = document.getElementById(target);
    if (el) el.classList.add('active');
  }
}

function clearWaves() {
  ['wave-host', 'wave-explainer', 'wave-devil'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
}

// ── PARSER: raw AI text → structured turns ────────────────────────
function parseAIResponse(text) {
  /**
   * Splits the AI response into individual speaker lines.
   * Handles: "Host:", "Explainer:", "Devil:" / "Devil's Advocate:"
   */
  const lines = text.split('\n');
  const segments = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const hostMatch      = line.match(/^Host\s*[:\-]\s*(.*)/i);
    const explainerMatch = line.match(/^Explainer\s*[:\-]\s*(.*)/i);
    const devilMatch     = line.match(/^Devil(?:'s Advocate)?\s*[:\-]\s*(.*)/i);

    if (hostMatch) {
      if (current) segments.push(current);
      current = { speaker: 'host', text: hostMatch[1] };
    } else if (explainerMatch) {
      if (current) segments.push(current);
      current = { speaker: 'explainer', text: explainerMatch[1] };
    } else if (devilMatch) {
      if (current) segments.push(current);
      current = { speaker: 'devil', text: devilMatch[1] };
    } else if (current) {
      // continuation of same speaker
      current.text += ' ' + line;
    }
  }
  if (current) segments.push(current);

  return segments;
}

// ── RENDERER: append a user message ──────────────────────────────
function appendUserMessage(message) {
  feedEmpty.style.display = 'none';

  const div = document.createElement('div');
  div.className = 'user-message';
  div.innerHTML = `
    <div class="user-bubble">
      <div class="speech-name">You</div>
      <div>${escapeHTML(message)}</div>
    </div>
    <div class="speech-avatar you-avatar">You</div>
  `;
  chatFeed.appendChild(div);
  scrollToBottom();
}

// ── RENDERER: animate AI segments one-by-one ─────────────────────
async function appendAITurn(segments, turnIndex) {
  feedEmpty.style.display = 'none';

  // Turn wrapper
  const turnDiv = document.createElement('div');
  turnDiv.className = 'podcast-turn';

  // Divider label
  const divider = document.createElement('div');
  divider.className = 'turn-divider';
  divider.innerHTML = `<span class="turn-label">Turn ${turnIndex}</span>`;
  turnDiv.appendChild(divider);

  chatFeed.appendChild(turnDiv);
  scrollToBottom();

  // Append each speaker speech with a small delay for effect
  for (const seg of segments) {
    await delay(320);
    activateWave(seg.speaker);

    const speech = buildSpeechBubble(seg);
    turnDiv.appendChild(speech);
    scrollToBottom();
  }

  clearWaves();
}

function buildSpeechBubble(seg) {
  const meta = {
    host:      { label: 'Host · Alex',       initial: 'A', cls: 'alex'  },
    explainer: { label: 'Explainer · Sam',   initial: 'S', cls: 'sam'   },
    devil:     { label: "Devil · Jamie", initial: 'J', cls: 'jamie' },
  }[seg.speaker] || { label: seg.speaker, initial: '?', cls: '' };

  const div = document.createElement('div');
  div.className = `speech ${meta.cls}`;
  div.innerHTML = `
    <div class="speech-avatar">${meta.initial}</div>
    <div class="speech-body">
      <div class="speech-name">${meta.label}</div>
      <div class="speech-text">${escapeHTML(seg.text)}</div>
    </div>
  `;
  return div;
}

// ── UTIL ──────────────────────────────────────────────────────────
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scrollToBottom() {
  chatFeed.scrollTop = chatFeed.scrollHeight;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateEpMeta() {
  if (!startTime) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');
  epMeta.textContent = `${mins}:${secs} · ${turnCount} turn${turnCount !== 1 ? 's' : ''}`;
}

function setTopic(text) {
  topicInput.value = text;
  topicInput.focus();
}
window.setTopic = setTopic;

// ── API CALLS ─────────────────────────────────────────────────────

async function startPodcast() {
  const topic = topicInput.value.trim();
  if (!topic) {
    topicInput.focus();
    topicInput.style.borderColor = 'var(--jamie)';
    setTimeout(() => { topicInput.style.borderColor = ''; }, 1200);
    return;
  }

  // Reset
  chatFeed.innerHTML = '';
  chatFeed.appendChild(feedEmpty);
  feedEmpty.style.display = 'flex';
  turnCount = 0;
  isLive = false;

  // UI
  setLoading(true, 'Starting your podcast episode…');
  startBtn.disabled = true;
  topicInput.disabled = true;

  try {
    const res = await fetch('/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Failed to start podcast.');
      return;
    }

    // Parse & render
    const segments = parseAIResponse(data.response);
    turnCount++;
    setLoading(false);
    await appendAITurn(segments, turnCount);

    // Go live
    isLive = true;
    startTime = Date.now();
    epTitle.textContent = topic;
    setStatus('live', 'Live');
    userInput.disabled = false;
    sendBtn.disabled = false;
    continueBtn.disabled = false;
    topicInput.value = '';

    timerInterval = setInterval(updateEpMeta, 1000);
    updateEpMeta();

  } catch (err) {
    showError('Network error. Is the Flask server running?');
    console.error(err);
  } finally {
    setLoading(false);
    startBtn.disabled = false;
    topicInput.disabled = false;
  }
}

async function sendUserMessage() {
  const message = userInput.value.trim();
  if (!message || !isLive) return;

  appendUserMessage(message);
  userInput.value = '';
  userInput.disabled = true;
  sendBtn.disabled = true;
  continueBtn.disabled = true;

  setLoading(true, 'Hosts are responding to you…');

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Failed to send message.');
      return;
    }

    const segments = parseAIResponse(data.response);
    turnCount++;
    setLoading(false);
    await appendAITurn(segments, turnCount);
    updateEpMeta();

  } catch (err) {
    showError('Network error. Is the Flask server running?');
    console.error(err);
  } finally {
    setLoading(false);
    userInput.disabled = false;
    sendBtn.disabled = false;
    continueBtn.disabled = false;
    userInput.focus();
  }
}

async function continuePodcast() {
  if (!isLive) return;

  continueBtn.disabled = true;
  userInput.disabled = true;
  sendBtn.disabled = true;

  setLoading(true, 'Continuing the discussion…');

  try {
    const res = await fetch('/continue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Failed to continue podcast.');
      return;
    }

    const segments = parseAIResponse(data.response);
    turnCount++;
    setLoading(false);
    await appendAITurn(segments, turnCount);
    updateEpMeta();

  } catch (err) {
    showError('Network error.');
    console.error(err);
  } finally {
    setLoading(false);
    continueBtn.disabled = false;
    userInput.disabled = false;
    sendBtn.disabled = false;
  }
}

async function resetPodcast() {
  try {
    await fetch('/reset', { method: 'POST' });
  } catch (_) {}

  clearInterval(timerInterval);
  timerInterval = null;
  isLive = false;
  turnCount = 0;
  startTime = null;

  chatFeed.innerHTML = '';
  chatFeed.appendChild(feedEmpty);
  feedEmpty.style.display = 'flex';

  epTitle.textContent = '—';
  epMeta.textContent  = 'No episode running';

  userInput.value = '';
  topicInput.value = '';
  userInput.disabled = true;
  sendBtn.disabled = true;
  continueBtn.disabled = true;

  clearWaves();
  setStatus('idle', 'Idle');
}

// ── ERROR DISPLAY ─────────────────────────────────────────────────
function showError(message) {
  const div = document.createElement('div');
  div.style.cssText = `
    padding: 12px 16px;
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-radius: 8px;
    color: #ff6b6b;
    font-size: 13px;
    animation: fadeUp 0.3s ease;
  `;
  div.textContent = '⚠ ' + message;
  feedEmpty.style.display = 'none';
  chatFeed.appendChild(div);
  scrollToBottom();
}

// ── EVENT LISTENERS ───────────────────────────────────────────────
startBtn.addEventListener('click', startPodcast);
sendBtn.addEventListener('click', sendUserMessage);
continueBtn.addEventListener('click', continuePodcast);
resetBtn.addEventListener('click', resetPodcast);

topicInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') startPodcast();
});

userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendUserMessage();
  }
});
