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
    // BKK FUTÁR publikus web API kulcs
    const apiKey = 'web-54feeb28-a942-48ae-89a5-9955879ebb2c';
    const url = `https://futar.bkk.hu/api/query/v1/ws/otp/api/where/arrivals-and-departures-for-stop.json?includeReferences=agencies,routes,trips,stops,stations&stopId=${stopId}&minutesBefore=1&minutesAfter=30&key=${apiKey}&version=4&appVersion=3.18.0&locale=hu`;
    
    console.log('Fetching BKK data for stop:', stopId);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://futar.bkk.hu/'
      }
    });
    
    console.log('BKK API status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('BKK error:', text.substring(0, 300));
      
      return res.status(200).json({
        data: {
          entry: { stopId, stopTimes: [] },
          references: { trips: {} }
        }
      });
    }
    
    const data = await response.json();
    console.log('Success! Found', data.data?.entry?.stopTimes?.length || 0, 'stopTimes');
    
    // Szűrjük routeId alapján ha van
    if (routeId && data.data?.entry?.stopTimes) {
      const originalCount = data.data.entry.stopTimes.length;
      data.data.entry.stopTimes = data.data.entry.stopTimes.filter(st => {
        const trip = data.data.references.trips[st.tripId];
        return trip && trip.routeId === routeId;
      });
      console.log(`Filtered from ${originalCount} to ${data.data.entry.stopTimes.length} for routeId ${routeId}`);
    }
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(200).json({
      data: {
        entry: { stopId, stopTimes: [] },
        references: { trips: {} }
      }
    });
  }
}
```

**Commit changes**

---

Várj **1-2 percet** míg deploy-ol, aztán:

**Teszteld:**
```
https://bkk-tracker.vercel.app/api/bkk?stopId=BKK_F02667&routeId=BKK_3140
