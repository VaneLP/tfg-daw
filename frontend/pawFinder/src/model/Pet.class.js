import { User } from './User.class.js';

export class Pet {
    //constructor
    constructor({
        _id,
        refugioId,
        nombre,
        especie,
        raza,
        edad,
        genero,
        tamano,
        descripcion,
        fotos,
        estadoAdopcion,
        fechaPublicacion,
    }) {
        this._id = _id;
        this.refugioId = (refugioId && typeof refugioId === 'object' && refugioId._id) ? new User(refugioId) : refugioId;
        this.nombre = nombre || 'Sin Nombre';
        this.especie = especie || 'N/A';
        this.raza = raza || 'Mestizo';
        this.edad = edad || 'N/A';
        this.genero = genero || 'N/A';
        this.tamano = tamano || 'N/A';
        this.descripcion = descripcion || 'Sin descripción.';
        this.fotos = Array.isArray(fotos) ? fotos : [];
        this.estadoAdopcion = estadoAdopcion || 'Disponible';
        this.fechaPublicacion = fechaPublicacion ? new Date(fechaPublicacion) : null;
    }

    // getter foto
    get mainPhoto() {
        return this.fotos.length > 0 ? this.fotos[0] : '';
    }

    // getter para la fecha de publicacion formateada
    get formattedPublicationDate() {
        return this.fechaPublicacion ? this.fechaPublicacion.toLocaleDateString() : 'N/A';
    }

    // getter para informacion basica de la mascota
    get basicInfo() {
        return `${this.especie} | ${this.genero} | ${this.edad}`;
    }

    // getter para el nombre del refugio
    get refugioName() {
        return this.refugioId instanceof User ? this.refugioId.displayName : 'Refugio Desconocido';
    }
}