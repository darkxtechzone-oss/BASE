// lib/Api.js
//
// FAILI HII NI MPYA - kiungo rahisi cha kuzungumza na API za nje, kama
// zinavyotumiwa na baadhi ya plugins (mfano download/convert APIs).

const config = require('../settings/config');
const fetch = require('node-fetch');

const Api = {
  get: async (endpoint, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${config.api.baseurl}${endpoint}?${query}`);
    return await res.json();
  },
  post: async (endpoint, body = {}) => {
    const res = await fetch(`${config.api.baseurl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  }
};

module.exports = Api;
