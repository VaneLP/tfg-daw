import { User } from './User.class.js';
import { Pet } from './Pet.class.js';

export class Application {
    //constructor
    constructor({
        _id,
        adoptanteId,
        mascotaId,
        refugioId,
        fechaSolicitud,
        estadoSolicitud,
        mensajeAdoptante
    } = {}) {
        this._id = _id;
        this.adoptanteId = (adoptanteId && typeof adoptanteId === 'object' && adoptanteId._id) ? new User(adoptanteId) : adoptanteId;
        this.mascotaId = (mascotaId && typeof mascotaId === 'object' && mascotaId._id) ? new Pet(mascotaId) : mascotaId;
        this.refugioId = (refugioId && typeof refugioId === 'object' && refugioId._id) ? new User(refugioId) : refugioId;
        this.fechaSolicitud = fechaSolicitud ? new Date(fechaSolicitud) : null;
        this.estadoSolicitud = estadoSolicitud || 'Pendiente';
        this.mensajeAdoptante = mensajeAdoptante;
    }

    // getter para la fecha de solicitud formateada
    get formattedApplicationDate() {
        return this.fechaSolicitud
            ? new Date(this.fechaSolicitud).toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',

                hour: '2-digit',
                minute: '2-digit'
            })
            : 'N/A';
    }

    // getter para el nombre de la mascota
    get petName() {
        return this.mascotaId instanceof Pet ? this.mascotaId.nombre : 'Mascota no disponible';
    }

    // getter para la especie de la mascota
    get petSpecies() {
        return this.mascotaId instanceof Pet ? this.mascotaId.especie : '';
    }

    // getter para la foto de la mascota
    get petMainPhoto() {
        return this.mascotaId instanceof Pet ? this.mascotaId.mainPhoto : '';
    }

    // getter para el nombre del refugio
    get refugioName() {
        return this.refugioId instanceof User ? this.refugioId.displayName : 'Refugio Desconocido';
    }

    // getter para el nombre del adoptante
    get adopterName() {
        return this.adoptanteId instanceof User ? this.adoptanteId.displayName : 'Adoptante Desconocido';
    }

    // getter para la informacion de contacto del adoptante
    get adopterContact() {
        // verificar si adoptanteid es una instancia de user
        if (this.adoptanteId instanceof User) {
            const parts = [];

            // si el adoptante tiene email
            if (this.adoptanteId.email) {
                parts.push(this.adoptanteId.email);
            }

            // si el adoptante tiene telefono
            if (this.adoptanteId.telefono) {
                parts.push(this.adoptanteId.telefono);
            }

            return parts.join(' | ') || 'N/A';
        }

        return 'N/A';
    }
}