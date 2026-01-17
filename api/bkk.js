javascriptimport fetch from 'node-fetch';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { stopId } = req.query;

  if (!stopId) {
    return res.status(400).json({ error: 'stopId is required' });
  }

  try {
    const url = `https://futar.bkk.hu/api/query/v1/ws/otp/api/where/arrivals-and-departures-for-stop.json?stopId=${stopId}&minutesBefore=0&minutesAfter=60`;
    
    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error('BKK API Error:', error);
    res.status(500).json({ error: 'Failed to fetch BKK data' });
  }
}
