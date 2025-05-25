import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    role: {
        type: String,
        required: true,
        enum: ['Adoptante', 'Refugio', 'Admin']
    },
    telefono: {
        type: String,
        trim: true
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    nombreCompleto: {
        type: String,
        trim: true
    },
    nombreRefugio: {
        type: String,
        trim: true
    },
    direccionCompleta: {
        type: String,
        trim: true
    },
    provincia: {
        type: String,
        trim: true
    },
    CIF_NIF: {
        type: String,
        trim: true
    },
    descripcionRefugio: {
        type: String,
        trim: true
    },
    coordenadas: {
        lat: { type: Number },
        lon: { type: Number }
    },
    estadoAprobacion: {
        type: String,
        enum: ['Pendiente', 'Aprobado', 'Rechazado'],
    },
}, { timestamps: true });

// middleware pre-save para validaciones y logica antes de guardar un usuario
userSchema.pre('save', async function (next) { 
    // si el rol es adoptante o admin
    if (this.role === 'Adoptante' || this.role === 'Admin') {
        // si no se proporciona username
        if (!this.username) {
            return next(new Error(`Username es requerido para el rol ${this.role}.`));
        }

        // si el username se modifico o es un nuevo documento
        if (this.isModified('username') || this.isNew) {
            const query = { username: this.username.toLowerCase() };

            // si no es un nuevo documento excluir el id actual de la busqueda (para permitir guardar sin cambiar username)
            if (!this.isNew) {
                query._id = { $ne: this._id };
            }

            const existingUser = await mongoose.model('User').findOne(query);

            // si ya existe un usuario con ese username
            if (existingUser) {
                return next(new Error('El nombre de usuario ya existe. Por favor, elige otro.'));
            }
        }

    // si el rol es refugio
    } else if (this.role === 'Refugio') {
        this.username = undefined;

        // si es un nuevo refugio
        if (this.isNew) {
            this.estadoAprobacion = 'Pendiente';
        }
    }

    // si el rol es adoptante y no se proporciona nombre completo
    if (this.role === 'Adoptante' && !this.nombreCompleto) {
        return next(new Error('Nombre completo es requerido para Adoptante.'));
    }

    // si el rol es refugio
    if (this.role === 'Refugio') {
        // si no se proporcionan los campos obligatorios para refugio
        if (!this.nombreRefugio || !this.direccionCompleta || !this.CIF_NIF || !this.telefono) {
            return next(new Error('Nombre refugio, dirección, CIF/NIF y teléfono son requeridos para Refugio.'));
        }
    }

    next();
});

const User = mongoose.model('User', userSchema);

export default User;