import { User } from './User.class.js';

export class BlogPost {
    //constructor
    constructor({
        _id,
        titulo,
        contenido,
        imagenDestacada,
        autorId,
        fechaPublicacion,
    }) {
        this._id = _id;
        this.titulo = titulo || 'Sin Título';
        this.contenido = contenido || 'Contenido no disponible.';
        this.imagenDestacada = imagenDestacada || '/img/placeholder-blog.png';
        this.autorId = (autorId && typeof autorId === 'object' && autorId._id) ? new User(autorId) : autorId;
        this.fechaPublicacion = fechaPublicacion ? new Date(fechaPublicacion) : null;
    }

    // getter para la fecha de publicacion formateada
    get formattedPublicationDate() {
        return this.fechaPublicacion ? this.fechaPublicacion.toLocaleDateString() : 'Fecha desconocida';
    }

    // getter para el nombre del autor
    get authorName() {
        return this.autorId instanceof User ? this.autorId.displayName : (typeof this.autorId === 'string' ? 'Autor Desconocido' : 'Equipo PawFinder');
    }

    // getter para un extracto del contenido
    get excerpt() {
        const textContent = this.contenido || "";
        const limit = 150;

        // si la longitud del contenido es menor o igual al limite 
        if (textContent.length <= limit) {
            //devolver el contenido
            return textContent;
        }

        let truncated = textContent.substring(0, limit);
        const lastSpace = truncated.lastIndexOf(' ');

        // si se encontro un espacio
        if (lastSpace > 0) {
            //truncar para evitar palabras cortadas
            truncated = truncated.substring(0, lastSpace);
        }

        // devolver el texto truncado con puntos suspensivos
        return truncated + "...";
    }
}