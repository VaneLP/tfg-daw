import { View, Map, Feature } from "ol";
import { OSM, Vector as VectorSource } from "ol/source";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { useGeographic } from "ol/proj";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";
import { Point } from "ol/geom";

//llamamos a openlayers
useGeographic();

/**
 * FUncion para crear un marcador en el ampa
 * @param {*} coordinates 
 * @param {*} color 
 * @param {*} fill 
 */
function createMarker(coordinates, color = "#D9534F", fill = "#FFFFFF") {
    const positionFeature = new Feature({ geometry: new Point(coordinates) });

    positionFeature.setStyle(
        new Style({
            image: new CircleStyle({
                radius: 8,
                fill: new Fill({ color: fill }),
                stroke: new Stroke({ color: color, width: 3 }),
            }),
        })
    );

    return positionFeature;
}

/**
 * Funcion para inicializar y mostrar un mapa
 * @param {*} containerId 
 * @param {*} longitude 
 * @param {*} latitude 
 */
async function displayLocationMap(containerId, longitude, latitude) {
    const mapContainer = document.getElementById(containerId);

    //si el mapa no es encontrado
    if (!mapContainer) {
        //error
        return null;
    }

    mapContainer.replaceChildren();

    //si las coordenadas son numeros no son validos
    if (typeof longitude !== 'number' || typeof latitude !== 'number' || isNaN(longitude) || isNaN(latitude)) {
        //error
        const errorP = document.createElement('p');
        errorP.className = 'text-muted text-center p-3 border rounded d-flex align-items-center justify-content-center';
        errorP.textContent = 'Ubicación no disponible o coordenadas incorrectas.';

        mapContainer.appendChild(errorP);
        mapContainer.style.height = '100%';

        return null;
    }

    //coordenadas
    const locationCoordinates = [longitude, latitude];

    try {
        //creamos el mapa
        const view = new View({ center: locationCoordinates, zoom: 15 });

        const map = new Map({
            layers: [new TileLayer({ source: new OSM() })],
            target: containerId,
            view: view,
            controls: [],
        });

        const markerFeature = createMarker(locationCoordinates);

        const vectorLayer = new VectorLayer({
            source: new VectorSource({ features: [markerFeature] }),
            map: map,
        });

        return map;
    } catch (error) {
        //error
        mapContainer.replaceChildren();

        const errorP = document.createElement('p');
        errorP.className = 'text-danger text-center p-3 border rounded d-flex align-items-center justify-content-center';
        errorP.textContent = 'Error al cargar el mapa.';

        mapContainer.appendChild(errorP);

        mapContainer.style.height = '100%';

        return null;
    }
}

export { displayLocationMap };