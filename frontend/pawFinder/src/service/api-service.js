import { Auth } from './auth-service.js';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';

/**
 * funcion para construir la cadena de consulta
 * @param {object} params - un objeto con los parametros para la cadena de consulta
 * @returns {string} - la cadena de consulta formateada o una cadena vacia si no hay parametros
 */
function buildQueryString(params) {
    const q = new URLSearchParams();

    for (const key in params) {
        // si el valor del parametro no es indefinido nulo o vacio
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            // añadir clave-valor a la cadena de consulta
            q.append(key, params[key]);
        }
    }

    const queryString = q.toString();

    // devolver la cadena de consulta con un signo de interrogacion al principio si no esta vacia o una cadena vacia
    return queryString ? `?${queryString}` : '';
}

/**
 * funcion para realizar peticiones a la api
 * @param {string} endpoint - el endpoint de la api al que se hara la peticion 
 * @param {string} [method='GET'] - el metodo http a utilizar 
 * @param {object|null} [body=null] - el cuerpo de la peticion para metodos como post o put
 *
 * @returns {Promise<object>} - la respuesta de la api parseada como json
 */
async function fetchApi(endpoint, method = 'GET', body = null) {
    const token = Auth.getToken();
    const headers = {};

    // si existe un token
    if (token) {
        // añadir autorizacion con el token bearer
        headers['Authorization'] = `Bearer ${token}`;
    }

    // si hay un cuerpo y el metodo es post, put o patch
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        // añadir content-type para json
        headers['Content-Type'] = 'application/json';
    }

    const options = { method, headers };

    // si hay un cuerpo y el metodo es post, put o patch
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        // añadir el cuerpo a las opciones
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        let responseData;
        const contentType = response.headers.get("content-type");

        // si el estado de la respuesta es 204 (
        if (response.status === 204) {
            // mensaje exito 
            responseData = { message: 'Operación completada con éxito.' };

        // si el tipo de contenido es json
        } else if (contentType && contentType.includes("application/json")) {
            responseData = await response.json().catch(e => {

                //error
                return { message: response.statusText || "Respuesta del servidor no es JSON válido." };
            });

        // si no es json ni 204
        } else {
            const textResponse = await response.text().catch(() => "No se pudo leer la respuesta del servidor.");
            
            // error
            responseData = { message: textResponse || `Respuesta no JSON: ${response.status}` };
        }

        // si la respuesta no es ok
        if (!response.ok) {
            const errorMessage = responseData?.message || `Error ${response.status}: ${response.statusText}`;
            
            //error
            throw new Error(errorMessage);
        }

        // si responseData existe y la propiedad data no es indefinida
        if (responseData && responseData.data !== undefined) {
            // devolver datos
            return responseData;
        }

        return { data: responseData, message: responseData.message || 'Operación completada' };

    } catch (error) {
        //error
        throw error;
    }
}

export const apiService = {
    //animales
    getPets: (queryParams = {}) => fetchApi(`/pets${buildQueryString(queryParams)}`, 'GET'), getPetById: (mascotaId) => fetchApi(`/pets/${mascotaId}`, 'GET'),
    createPet: (petData) => fetchApi('/pets', 'POST', petData),
    updatePet: (mascotaId, petData) => fetchApi(`/pets/${mascotaId}`, 'PUT', petData),
    deletePet: (mascotaId) => fetchApi(`/pets/${mascotaId}`, 'DELETE'),

    //solicitufes
    createApplication: (mascotaId, messageText) => fetchApi(`/applications/pet/${mascotaId}/apply`, 'POST', { mensajeAdoptante: messageText }),
    getMyApplications: (queryParams = {}) => fetchApi(`/applications/my${buildQueryString(queryParams)}`, 'GET'),
    getReceivedApplications: (queryParams = {}) => fetchApi(`/applications/received${buildQueryString(queryParams)}`, 'GET'),
    updateApplicationStatus: (appId, newStatus) => fetchApi(`/applications/${appId}/status`, 'PUT', { estadoSolicitud: newStatus }),
    checkUserApplicationForPet: (mascotaId) => fetchApi(`/applications/check-user-app/pet/${mascotaId}`, 'GET'),
    getApplicationsForPet: (mascotaId) => fetchApi(`/applications/for-pet/${mascotaId}`, 'GET'),

    //perfil
    getMyProfile: () => fetchApi('/users/profile', 'GET'),
    updateMyProfile: (profileData) => fetchApi('/users/profile', 'PUT', profileData),

    //usuarios
    getAllUsers: () => fetchApi('/users', 'GET'),
    approveRefugio: (refugioId) => fetchApi(`/users/admin/refugios/${refugioId}/approve`, 'PUT'),
    rejectRefugio: (refugioId) => fetchApi(`/users/admin/refugios/${refugioId}/reject`, 'PUT'),
    getPendingRefugios: () => fetchApi('/users/admin/refugios/pending', 'GET'),
    deleteUser: (userId) => fetchApi(`/users/${userId}`, 'DELETE'),

    //blog
    getBlogPosts: (queryParams = {}) => fetchApi(`/blog${buildQueryString(queryParams)}`, 'GET'), getBlogPostById: (postId) => fetchApi(`/blog/${postId}`, 'GET'),
    createBlogPost: (postData) => fetchApi('/blog', 'POST', postData),
    updateBlogPost: (postId, postData) => fetchApi(`/blog/${postId}`, 'PUT', postData),
    deleteBlogPost: (postId) => fetchApi(`/blog/${postId}`, 'DELETE'),
};