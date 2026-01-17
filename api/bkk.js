export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { stopId, routeId } = req.query;

  if (!stopId) {
    return res.status(400).json({ error: 'stopId is required' });
  }

  try {
    // BKK FUTÁR internal API - ezt használja a weboldaluk is
    const url = `https://futar.bkk.hu/bkk-utvonaltervezo-api/ws/otp/api/where/arrivals-and-departures-for-stop.json?stopId=${stopId}&onlyDepartures=false`;
    
    console.log('Fetching from BKK FUTÁR API:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://futar.bkk.hu/',
        'Accept': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text.substring(0, 300));
      
      // Üres válasz hibás stopId esetén
      return res.status(200).json({
        data: {
          entry: { stopId, stopTimes: [] },
          references: { trips: {} }
        }
      });
    }
    
    const data = await response.json();
    console.log('Success! StopTimes count:', data.data?.entry?.stopTimes?.length || 0);
    
    // Ha van routeId szűrés, alkalmazzuk
    if (routeId && data.data?.entry?.stopTimes) {
      data.data.entry.stopTimes = data.data.entry.stopTimes.filter(st => {
        const trip = data.data.references.trips[st.tripId];
        return trip && trip.routeId === routeId;
      });
    }
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('BKK API Error:', error.message);
    return res.status(200).json({
      data: {
        entry: { stopId, stopTimes: [] },
        references: { trips: {} }
      }
    });
  }
}
