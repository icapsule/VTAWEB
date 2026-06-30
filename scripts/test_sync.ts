import { db } from '../src/server/db';
import { rankings } from '../src/server/db/schema';
import dotenv from 'dotenv';
dotenv.config();

// We'll just test if we can hit the API and the DB.

async function testRapidAPI() {
  const url = `https://tennis-api-atp-wta-itf.p.rapidapi.com/tennis/v2/atp/ranking/singles?date=2026-06-22`;
  const resp = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
      'X-RapidAPI-Host': 'tennis-api-atp-wta-itf.p.rapidapi.com'
    }
  });
  
  console.log("RapidAPI status:", resp.status);
  const rawData = await resp.json();
  const dataList = Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData) ? rawData : []);
  
  for (const item of dataList.slice(0, 5)) {
    console.log("Raw item:", item);
  }
}

async function testDB() {
  console.log("Testing DB connection...");
  try {
    const res = await db.select().from(rankings).limit(1);
    console.log("DB select success. Data:", res);
  } catch (err) {
    console.error("DB connection error:", err);
  }
}

async function run() {
  await testRapidAPI();
  await testDB();
}

run();
