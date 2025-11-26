#!/usr/bin/env node

/**
 * Test script to verify College Football Data API connection
 * Usage: node --env-file=.env scripts/test-api.js
 */

import { spawnSync } from 'child_process';

const API_BASE_URL = 'https://api.collegefootballdata.com';
const API_KEY = process.env.VITE_CFB_API_KEY;

function curlGet(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  const result = spawnSync('curl', [
    '-s',
    url,
    '-H', `Authorization: Bearer ${API_KEY}`
  ], { encoding: 'utf-8' });

  if (result.error) {
    throw result.error;
  }
  if (result.stderr) {
    console.error('curl stderr:', result.stderr);
  }
  return JSON.parse(result.stdout);
}

async function testApiConnection() {
  console.log('=== College Football Data API Connection Test ===\n');

  // Check if API key is configured
  if (!API_KEY) {
    console.error('ERROR: VITE_CFB_API_KEY is not set in your .env file');
    console.log('\nTo fix this:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Add your API key from https://collegefootballdata.com/');
    process.exit(1);
  }

  console.log('API Key: ' + API_KEY.substring(0, 8) + '...' + API_KEY.substring(API_KEY.length - 4));
  console.log('Base URL:', API_BASE_URL);
  console.log('\nTesting connection...\n');

  try {
    // Test 1: Fetch conferences (lightweight endpoint)
    console.log('Test 1: Fetching conferences...');
    const conferences = curlGet('/conferences');
    console.log(`  SUCCESS: Found ${conferences.length} conferences`);
    console.log(`  Sample: ${conferences.slice(0, 3).map(c => c.name).join(', ')}...\n`);

    // Test 2: Fetch teams (slightly larger dataset)
    console.log('Test 2: Fetching FBS teams...');
    const teams = curlGet('/teams?division=fbs');
    console.log(`  SUCCESS: Found ${teams.length} FBS teams`);
    console.log(`  Sample: ${teams.slice(0, 3).map(t => t.school).join(', ')}...\n`);

    // Test 3: Fetch a single game week
    console.log('Test 3: Fetching 2024 Week 1 games...');
    const games = curlGet('/games?year=2024&week=1');
    console.log(`  SUCCESS: Found ${games.length} games in Week 1 2024`);
    if (games.length > 0) {
      const game = games[0];
      console.log(`  Sample: ${game.awayTeam} @ ${game.homeTeam}\n`);
    }

    console.log('===========================================');
    console.log('ALL TESTS PASSED! API connection is working.');
    console.log('===========================================');
    console.log('\nNote: The API has Cloudflare protection that may block');
    console.log('Node.js HTTP clients in some environments. Browser requests');
    console.log('via Vite will work normally.');

  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

testApiConnection();
