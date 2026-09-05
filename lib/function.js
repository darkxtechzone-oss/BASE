// lib/function.js
//
// FAILI HII NI MPYA - vitendea kazi (helpers) vinavyotumiwa na message.js.

const axios = require('axios');

const getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: { DNT: 1, 'Upgrade-Insecure-Request': 1 },
      ...options,
      responseType: 'arraybuffer'
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

const fetchJson = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
      },
      ...options
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await axios.get(url, { signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === 'CanceledError' || err.name === 'AbortError') {
      throw new Error(`Request timed out after ${ms}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// dechtml: inatumika kwenye baadhi ya APIs za zamani zenye majibu
// yaliyofichwa (encoded) kama HTML/JS - hapa ni nakala rahisi isiyoharibu
// kama muundo haufanani, inarudisha buffer ile ile ya awali.
const dechtml = async (buffer) => {
  try {
    const html = buffer.toString('utf8');
    if (/atob\(/.test(html)) {
      const match = html.match(/atob\(["'`]([^"'`]+)["'`]\)/);
      if (match) {
        const decoded = Buffer.from(match[1], 'base64');
        return decoded;
      }
    }
    return Buffer.from(html, 'utf8');
  } catch (e) {
    return buffer;
  }
};

const runtime = (seconds) => {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  getBuffer,
  fetchJson,
  fetchWithTimeout,
  dechtml,
  runtime,
  sleep
};
