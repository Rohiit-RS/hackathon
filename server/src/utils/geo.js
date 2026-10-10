// Haversine distance and geographical utilities for CivicTrack

/**
 * Calculate distance between two coordinates in meters using the Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in meters
 */
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Supported municipal boundary (Kancheepuram / Chennai Metro Region)
 * Center: 12.8342, 79.7036 (Radius ~ 35km)
 */
const CITY_BOUNDARY = {
  centerLat: 12.8342,
  centerLng: 79.7036,
  maxRadiusMeters: 35000,
  minLat: 12.60,
  maxLat: 13.15,
  minLng: 79.50,
  maxLng: 80.35,
  cityName: 'Kancheepuram Municipal Corporation'
};

/**
 * Check if a coordinate is within the municipal boundary
 */
function isWithinCityBoundary(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (lat < CITY_BOUNDARY.minLat || lat > CITY_BOUNDARY.maxLat) return false;
  if (lng < CITY_BOUNDARY.minLng || lng > CITY_BOUNDARY.maxLng) return false;
  return getDistanceInMeters(lat, lng, CITY_BOUNDARY.centerLat, CITY_BOUNDARY.centerLng) <= CITY_BOUNDARY.maxRadiusMeters;
}

/**
 * Compare EXIF location and device GPS
 * If difference > 200m, flags as unverified
 */
function verifyLocationConsistency(exifLat, exifLng, deviceLat, deviceLng, maxDiffMeters = 200) {
  if (!exifLat || !exifLng || !deviceLat || !deviceLng) {
    return { isConsistent: true, diffMeters: 0, reason: 'Single location source provided' };
  }
  const diff = getDistanceInMeters(exifLat, exifLng, deviceLat, deviceLng);
  return {
    isConsistent: diff <= maxDiffMeters,
    diffMeters: Math.round(diff),
    reason: diff <= maxDiffMeters 
      ? 'EXIF and device GPS matched within threshold' 
      : `EXIF and device GPS differ by ${Math.round(diff)}m (> ${maxDiffMeters}m limit)`
  };
}

module.exports = {
  getDistanceInMeters,
  CITY_BOUNDARY,
  isWithinCityBoundary,
  verifyLocationConsistency
};
