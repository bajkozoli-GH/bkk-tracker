import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

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
    // BKK GTFS-RT Trip Updates feed
    const gtfsUrl = 'https://gtfs.bkk.hu/gtfs_rt/tripupdates.pb';
    
    console.log('Fetching GTFS-RT data...');
    
    const response = await fetch(gtfsUrl);
    
    if (!response.ok) {
      throw new Error(`GTFS-RT API returned ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );
    
    console.log(`GTFS feed entities: ${feed.entity.length}`);
    
    // Szűrjük a stopId-hoz tartozó érkezéseket
    const arrivals = [];
    
    for (const entity of feed.entity) {
      if (!entity.tripUpdate) continue;
      
      const trip = entity.tripUpdate.trip;
      
      // Ha van routeId szűrés, ellenőrizzük
      if (routeId && trip.routeId !== routeId) continue;
      
      for (const stopTimeUpdate of entity.tripUpdate.stopTimeUpdate || []) {
        if (stopTimeUpdate.stopId === stopId) {
          const arrivalTime = stopTimeUpdate.arrival?.time || stopTimeUpdate.departure?.time;
          
          if (arrivalTime) {
            arrivals.push({
              routeId: trip.routeId,
              tripId: trip.tripId,
              headsign: trip.tripId, // A headsign külön API-ból jönne
              arrivalTime: Number(arrivalTime),
              predictedArrivalTime: Number(arrivalTime)
            });
          }
        }
      }
    }
    
    // Rendezzük idő szerint
    arrivals.sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    console.log(`Found ${arrivals.length} arrivals for stop ${stopId}`);
    
    // BKK API-hoz hasonló formátum
    const result = {
      data: {
        entry: {
          stopId: stopId,
          stopTimes: arrivals.map(arr => ({
            tripId: arr.tripId,
            arrivalTime: arr.arrivalTime,
            predictedArrivalTime: arr.predictedArrivalTime
          }))
        },
        references: {
          trips: arrivals.reduce((acc, arr) => {
            acc[arr.tripId] = {
              routeId: arr.routeId,
              tripHeadsign: arr.headsign,
              tripId: arr.tripId
            };
            return acc;
          }, {})
        }
      }
    };
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('GTFS-RT Error:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch GTFS-RT data',
      details: error.message 
    });
  }
}
```

**Commit changes**

---

### **3️⃣ Várj 2-3 percet**

A Vercel újra build-eli a projektet (most telepíti a `gtfs-realtime-bindings` library-t).

---

### **4️⃣ Tesztelés:**

**Nyisd meg:**
```
https://bkk-tracker.vercel.app/api/bkk?stopId=BKK_F02667&routeId=BKK_3140
```

**Mit vársz:**
- JSON adatokat `stopTimes` tömbbel ✅
- Vagy hibaüzenetet

**Aztán próbáld a főoldalt:**
```
https://bkk-tracker.vercel.app
