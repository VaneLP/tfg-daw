export class User {
    //constructor
    constructor({
        _id,
        username,
        email,
        avatar,
        role,
        telefono,
        fechaRegistro,
        nombreCompleto,
        nombreRefugio,
        direccionCompleta,
        CIF_NIF,
        descripcionRefugio,
        estadoAprobacion,
        coordenadas
    }) {
        this._id = _id;
        this.username = username;
        this.email = email;
        this.avatar = avatar || '';
        this.role = role;
        this.telefono = telefono;
        this.fechaRegistro = fechaRegistro ? new Date(fechaRegistro) : null;
        this.nombreCompleto = nombreCompleto;
        this.nombreRefugio = nombreRefugio;
        this.direccionCompleta = direccionCompleta;
        this.CIF_NIF = CIF_NIF;
        this.descripcionRefugio = descripcionRefugio;
        this.estadoAprobacion = estadoAprobacion;
        this.coordenadas = coordenadas;
    }

    // getter nombre
    get displayName() {
        return this.nombreCompleto || this.nombreRefugio || this.username || 'Usuario Desconocido';
    }

    // getter fecha de registro formateada
    get formattedRegistrationDate() {
        return this.fechaRegistro ? this.fechaRegistro.toLocaleDateString() : 'N/A';
    }

    // metodo para verificar si el usuario es adoptante
    isAdoptante() {
        return this.role === 'Adoptante';
    }

    // metodo para verificar si el usuario es refugio
    isRefugio() {
        return this.role === 'Refugio';
    }

    //verifica si el usuario es  admin
    isAdmin() {
        return this.role === 'Admin';
    }

    // metodo para verificar si el refugio esta aprobado
    isRefugioAprobado() {
        return this.isRefugio() && this.estadoAprobacion === 'Aprobado';
    }
}