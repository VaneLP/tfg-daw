/**
 * Geocodifica una direccion de texto usando la API de Nominatim (OpenStreetMap)
 * @param {string} addressText - La dirección a geocodificar
 * @returns {Promise<{lat: number, lon: number}|null>} - Un objeto con lat/lon o null si falla
 */
export async function geocodeAddressWithNominatim(addressText) {
    //si es nulo, si no es un string o si esta vacio
    if (!addressText || typeof addressText !== 'string' || addressText.trim() === '') {
        //direccion no valida
        return null;
    }

    // buscar direccion
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressText)}&format=json&limit=1&countrycodes=es&email=tfgdaw.contacto@example.com`;

    try {
        //peticion http
        const response = await fetch(url, {
            method: 'GET',
        });

        //si la respuesta no es ok
        if (!response.ok) {
            //mensaje error
            throw new Error(`Nominatim error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        //si hay datos y contiene resultados
        if (data && data.length > 0) {
            const firstResult = data[0];
            const lat = parseFloat(firstResult.lat);
            const lon = parseFloat(firstResult.lon);

            //si las coordenadas son correctas
            if (!isNaN(lat) && !isNaN(lon)) {
                //las devolvemos
                return { lat, lon };
            }
        }

        //error
        console.warn("No coordinates found (Nominatim) for:", addressText);
        return null;
    } catch (error) {
        //error
        console.error("Error geocoding (Nominatim):", error);
        return null;
    }
}