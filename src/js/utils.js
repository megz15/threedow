import proj4 from 'proj4';

// Define the WGS84 projection (GeoJSON is typically in this format)
const wgs84 = 'EPSG:4326';
const webMercator = 'EPSG:3857';  // Conversion to 3D Cartesian

export function latLngToCartesian(lat, lng) {
    const [x, y] = proj4(wgs84, webMercator, [lng, lat]);
    return { x, y };
}