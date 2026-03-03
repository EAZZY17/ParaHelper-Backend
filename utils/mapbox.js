const axios = require("axios");

const MAPBOX_BASE = "https://api.mapbox.com/geocoding/v5/mapbox.places";

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function getNearbyHospitals({ query = "hospital", proximity }) {
  const apiKey = process.env.MAPBOX_API_KEY;
  if (!apiKey) {
    return [];
  }

  const url = `${MAPBOX_BASE}/${encodeURIComponent(query)}.json`;
  const response = await axios.get(url, {
    params: {
      access_token: apiKey,
      proximity: `${proximity.lon},${proximity.lat}`,
      types: "poi",
      limit: 5
    }
  });

  const features = response.data.features || [];
  return features.map((feature) => {
    const [lon, lat] = feature.center || [];
    const distance = lon && lat ? haversineKm(proximity, { lat, lon }) : null;
    return {
      name: feature.text,
      place: feature.place_name,
      distance_km: distance ? distance.toFixed(1) : null
    };
  });
}

module.exports = { getNearbyHospitals };
