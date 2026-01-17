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
    
    console.log('Fetching:', url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BKK-Tracker-App'
      }
    });
    
    console.log('BKK API status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('BKK API error:', errorText);
      return res.status(502).json({ 
        error: 'BKK API returned an error',
        status: response.status,
        details: errorText.substring(0, 200)
      });
    }
    
    const data = await response.json();
    
    console.log('BKK API success for stopId:', stopId);
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('BKK API Error:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch BKK data',
      details: error.message 
    });
  }
}
