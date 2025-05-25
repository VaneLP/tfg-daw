import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
    adoptanteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mascotaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true
    },
    refugioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fechaSolicitud: {
        type: Date, default:
            Date.now
    },
    estadoSolicitud: {
        type: String,
        required: true,
        enum: ['Pendiente', 'Contactado', 'Aprobada', 'Rechazada'],
        default: 'Pendiente'
    },
    mensajeAdoptante: {
        type: String,
        trim: true
    },
}, {
    timestamps: true
});

const Application = mongoose.model('Application', applicationSchema);
export default Application;