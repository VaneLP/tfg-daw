const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class Auth {
    /**
     * metodo para iniciar sesion
     * @param {string} email - el correo electronico del usuario
     * @param {string} password - la contrasena del usuario
     * @returns {Promise<object|null>} - un objeto con los datos del usuario si el login es exitoso o null si falla
     */
    static async login(email, password) {
        try {
            // peticion http
            const resp = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                // cuerpo de la peticion con email y password
                body: JSON.stringify({ email, password }),
                headers: { 'Content-Type': 'application/json' }
            });

            const responseData = await resp.json().catch(() => null);

            // si la respuesta no es ok
            if (!resp.ok) {
                // error
                throw new Error(responseData?.message || `Error ${resp.status}: ${resp.statusText}`);
            }

            // si la respuesta contiene datos, token y usuario
            if (responseData && responseData.token && responseData.user) {
                // guardar token en el almacenamiento local
                localStorage.setItem("token", responseData.token);

                // guardar datos del usuario en el almacenamiento local
                localStorage.setItem("user", JSON.stringify(responseData.user));

                // devolver los datos del usuario
                return responseData.user;

            // si no hay datos
            } else {
                // error
                throw new Error("Respuesta de login inválida desde el servidor.");
            }
        } catch (error) {
            // error
            throw error;
        }
    }

    /**
     * metodo para registrar un usuario
     * @param {object} userData - los datos del usuario a registrar
     * @returns {Promise<object>} - un objeto con la respuesta del servidor
     */
    static async register(userData) {
        try {
            // peticion http
            const resp = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                // cuerpo de la peticion con los datos del usuario
                body: JSON.stringify(userData),
                headers: { 'Content-Type': 'application/json' }
            });

            const responseData = await resp.json().catch(() => null);

            // si la respuesta no es ok
            if (!resp.ok) {
                // error
                throw new Error(responseData?.message || `Error ${resp.status}: ${resp.statusText}`);
            }

            // devolver la respuesta
            return responseData;

        } catch (error) {
            //error
            throw error;
        }
    }

    /**
     * metodo para verificar el token     
     * @returns {Promise<object>} - un objeto con los datos del usuario si el token es valido
     */
    static async checkToken() {
        const token = localStorage.getItem("token");

        // si no hay token
        if (!token) {
            // cerrar sesion
            this.logout();

            // error
            throw new Error("No hay token almacenado.");
        }

        try {
            // peticion http
            const resp = await fetch(`${API_URL}/auth/validate`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const responseData = await resp.json().catch(() => null);

            // si la respuesta no es ok
            if (!resp.ok) {
                // cerrar sesion
                this.logout();
                // error 
                throw new Error(responseData?.message || `Token inválido (Status: ${resp.status})`);
            }

            // si la respuesta contiene datos y usuario
            if (responseData && responseData.user) {
                localStorage.setItem("user", JSON.stringify(responseData.user));

                // devolver los datos del usuario
                return responseData.user;

            // si no hay datos
            } else {
                // cerrar sesion
                this.logout();
                // error
                throw new Error("Respuesta de validación de token inválida.");
            }
        } catch (error) {
            // cerrar sesio
            this.logout();
            throw error;
        }
    }

    /**
     * metodo para cerrar sesion
     */
    static logout() {
        // eliminar token
        localStorage.removeItem("token");

        // eliminar datos del usuario 
        localStorage.removeItem("user");
    }

    /**
     * metodo para obtener el token
     * @returns {string|null} - el token almacenado o null si no existe
     */
    static getToken() {
        // devolver el token
        return localStorage.getItem("token");
    }

    /**
     *metodo estatico para obtener el usuario actual
     * @returns {object|null} - un objeto con los datos del usuario o null si no hay usuario logueado o los datos estan corruptos
     */
    static getCurrentUser() {
        const userString = localStorage.getItem("user");

        try {
            // si hay user parsearlo como json si no devolver nulo
            return userString ? JSON.parse(userString) : null;

        } catch (e) {
            // cerrar sesion
            this.logout();
            // devolver nulo
            return null;
        }
    }

    /**
     * metodo estatico para actualizar los datos del usuario actual
     * @param {object|null} userData - los nuevos datos del usuario o null para eliminar los datos
     */
    static updateCurrentUser(userData) {
        // si hay datos de usuario
        if (userData) {
            // guardar los datos
            localStorage.setItem("user", JSON.stringify(userData));

        // si no se proporcionan datos o son nulos
        } else {
            // eliminar los datos
            localStorage.removeItem("user");
        }
    }
}

export { Auth };