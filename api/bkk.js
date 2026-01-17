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
    // BKK OpenData API - publikus, nincs authentication
    const url = `https://futar.bkk.hu/api/query/v1/ws/otp/api/where/arrivals-and-departures-for-stop.json?stopId=${stopId}&minutesBefore=0&minutesAfter=60&onlyDepartures=false`;
    
    console.log('Fetching BKK:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'hu-HU,hu;q=0.9',
        'Referer': 'https://futar.bkk.hu/',
        'Origin': 'https://futar.bkk.hu'
      }
    });
    
    console.log('Response status:', response.status);
    
    const text = await response.text();
    console.log('Response preview:', text.substring(0, 200));
    
    if (!response.ok) {
      console.error('BKK error response:', text.substring(0, 500));
      return res.status(200).json({
        data: {
          entry: {
            stopTimes: []
          }
        }
      });
    }
    
    const data = JSON.parse(text);
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(200).json({
      data: {
        entry: {
          stopTimes: []
        }
      }
    });
  }
}
