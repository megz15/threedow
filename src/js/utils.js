import proj4 from 'proj4';

export function latLngToCartesian(lat, lng) {
    const [x, y] = proj4('EPSG:4326', 'EPSG:3857', [lng, lat]);
    return { x, y };
}