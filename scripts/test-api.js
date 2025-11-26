#!/usr/bin/env node

/**
 * Test script to verify College Football Data API connection
 * Usage: node --env-file=.env scripts/test-api.js
 */

const API_BASE_URL = 'https://api.collegefootballdata.com';
const API_KEY = process.env.VITE_CFB_API_KEY;

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
    const confResponse = await fetch(`${API_BASE_URL}/conferences`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!confResponse.ok) {
      throw new Error(`HTTP ${confResponse.status}: ${confResponse.statusText}`);
    }

    const conferences = await confResponse.json();
    console.log(`  SUCCESS: Found ${conferences.length} conferences`);
    console.log(`  Sample: ${conferences.slice(0, 3).map(c => c.name).join(', ')}...\n`);

    // Test 2: Fetch teams (slightly larger dataset)
    console.log('Test 2: Fetching FBS teams...');
    const teamsResponse = await fetch(`${API_BASE_URL}/teams?division=fbs`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!teamsResponse.ok) {
      throw new Error(`HTTP ${teamsResponse.status}: ${teamsResponse.statusText}`);
    }

    const teams = await teamsResponse.json();
    console.log(`  SUCCESS: Found ${teams.length} FBS teams`);
    console.log(`  Sample: ${teams.slice(0, 3).map(t => t.school).join(', ')}...\n`);

    // Test 3: Fetch a single game week
    console.log('Test 3: Fetching 2024 Week 1 games...');
    const gamesResponse = await fetch(`${API_BASE_URL}/games?year=2024&week=1`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!gamesResponse.ok) {
      throw new Error(`HTTP ${gamesResponse.status}: ${gamesResponse.statusText}`);
    }

    const games = await gamesResponse.json();
    console.log(`  SUCCESS: Found ${games.length} games in Week 1 2024`);
    if (games.length > 0) {
      const game = games[0];
      console.log(`  Sample: ${game.away_team} @ ${game.home_team}\n`);
    }

    console.log('===========================================');
    console.log('ALL TESTS PASSED! API connection is working.');
    console.log('===========================================');

  } catch (error) {
    console.error('ERROR:', error.message);

    if (error.message.includes('401')) {
      console.log('\nYour API key appears to be invalid.');
      console.log('Please verify your key at https://collegefootballdata.com/');
    } else if (error.message.includes('403')) {
      console.log('\nAccess forbidden. Your API key may have been revoked or rate-limited.');
    } else if (error.message.includes('fetch')) {
      console.log('\nNetwork error. Check your internet connection.');
    }

    process.exit(1);
  }
}

testApiConnection();
