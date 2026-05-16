export async function getCoordinatesFromAddress(address: string) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || !address) return null;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address,
    )}&key=${apiKey}`;

    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      return null;
    }

    const location = data.results[0].geometry.location;

    return {
      latitude: location.lat,
      longitude: location.lng,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
