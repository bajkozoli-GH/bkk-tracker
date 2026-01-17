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
    const apiKey = 'web-54feeb28-a942-48ae-89a5-9955879ebb2c';
    const url = `https://futar.bkk.hu/api/query/v1/ws/otp/api/where/arrivals-and-departures-for-stop.json?includeReferences=agencies,routes,trips,stops,stations&stopId=${stopId}&minutesBefore=1&minutesAfter=30&key=${apiKey}&version=4&appVersion=3.18.0&locale=hu`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://futar.bkk.hu/'
      }
    });
    
    if (!response.ok) {
      return res.status(200).json({
        data: {
          entry: { stopId, stopTimes: [] },
          references: { trips: {} }
        }
      });
    }
    
    const data = await response.json();
    
    if (routeId && data.data?.entry?.stopTimes) {
      data.data.entry.stopTimes = data.data.entry.stopTimes.filter(st => {
        const trip = data.data.references.trips[st.tripId];
        return trip && trip.routeId === routeId;
      });
    }
    
    return res.status(200).json(data);
    
  } catch (error) {
    return res.status(200).json({
      data: {
        entry: { stopId, stopTimes: [] },
        references: { trips: {} }
      }
    });
  }
}
