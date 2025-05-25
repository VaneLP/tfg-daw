import Application from "../models/application.js";
import Pet from "../models/pet.js";
import mongoose from 'mongoose';

/**
 * funcion asincrona para crear una solicitud de adopcion
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado
 */
export async function postOneApplication(req, res) {
    const { mascotaId } = req.params;
    const { mensajeAdoptante } = req.body;
    const currentUser = req.user;

    try {
        // validar si el mascotaid es un objectid valido de mongoose
        if (!mongoose.Types.ObjectId.isValid(mascotaId)) {
            return res.status(400).json({
                message: `ID mascota inválido: ${mascotaId}`
            });
        }

        const pet = await Pet.findById(mascotaId);

        // si no se encuentra la mascota
        if (!pet) {
            return res.status(404).json({
                message: `Mascota ${mascotaId} no encontrada.`
            });
        }

        // verificar que la mascota este disponible para adopcion
        if (pet.estadoAdopcion !== 'Disponible') {
            return res.status(400).json({
                message: `Mascota no disponible.`
            });
        }

        // verificar que el usuario no este intentando adoptar su propia mascota (el refugio)
        if (pet.refugioId.toString() === currentUser._id.toString()) {
            return res.status(400).json({
                message: `No puedes adoptar tu propia mascota.`
            });
        }

        const existingApp = await Application.findOne({ adoptanteId: currentUser._id, mascotaId: mascotaId });

        // si ya existe una solicitud
        if (existingApp) {
            return res.status(400).json({
                message: `Ya has solicitado a ${pet.nombre}.`
            });
        }

        const newApp = new Application({
            adoptanteId: currentUser._id,
            mascotaId: pet._id,
            refugioId: pet.refugioId,
            mensajeAdoptante: mensajeAdoptante || undefined
        });

        const savedApp = await newApp.save();

        return res.status(201).json({
            message: "Solicitud enviada.",
            application: savedApp
        });

    } catch (error) {
        // si es un error de validacion de mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Error validación",
                errors: error.errors
            });
        }

        return res.status(500).json({
            message: 'Error interno enviando solicitud.'
        });
    }
}

/**
 * funcion asincrona para obtener 'mis solicitudes'
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con la lista de solicitudes
 */
export async function getMyApplications(req, res) {
    const currentUser = req.user;
    const { nombreMascota } = req.query;

    try {
        let queryConditions = { adoptanteId: currentUser._id };

        // si se proporciona un filtro de nombre de mascota
        if (nombreMascota) {
            const pets = await Pet.find({ nombre: new RegExp(nombreMascota, 'i') }).select('_id'); // solo obtener ids
            const petIds = pets.map(p => p._id);

            // si no se encontraron mascotas que coincidan con el nombre
            if (petIds.length === 0) {
                return res.status(200).json({ data: [] });
            }

            queryConditions.mascotaId = { $in: petIds };
        }

        const applications = await Application.find(queryConditions)
            //populate() -> permite obtener otros atributos mediante el id
            .populate('mascotaId', 'nombre especie fotos estadoAdopcion')
            .populate('refugioId', 'nombreRefugio telefono email')
            .sort({ fechaSolicitud: -1 });

        return res.status(200).json({
            data: applications
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Error interno obteniendo tus solicitudes.'
        });
    }
}

/**
 * funcion asincrona para obtener 'solicitudes recibidas'
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con la lista de solicitudes recibidas
 */
export async function getReceivedApplications(req, res) {
    const currentUser = req.user;
    const { estadoSolicitud, mascotaId } = req.query;

    try {
        let queryConditions = { refugioId: currentUser._id };

        // si se proporciona un filtro de estado de solicitud y no esta vacio
        if (estadoSolicitud && estadoSolicitud !== "") {
            queryConditions.estadoSolicitud = estadoSolicitud;
        }

        // si se proporciona un filtro de id de mascota no esta vacio y es un objectid valido
        if (mascotaId && mascotaId !== "" && mongoose.Types.ObjectId.isValid(mascotaId)) {
            queryConditions.mascotaId = mascotaId;
        }

        const applications = await Application.find(queryConditions)
            //populate() -> permite obtener otros atributos mediante el id
            .populate('mascotaId', 'nombre especie fotos')
            .populate('adoptanteId', 'nombreCompleto email username')
            .sort({ fechaSolicitud: -1 });

        return res.status(200).json({ data: applications });

    } catch (error) {
        return res.status(500).json({
            message: 'Error interno obteniendo solicitudes recibidas.'
        });
    }
}

/**
 * funcion asincrona para actualizar el estado de una solicitud
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado de la actualizacion
 */
export async function updateOneApplicationStatus(req, res) {
    const { applicationId } = req.params;
    const { estadoSolicitud: newStatus } = req.body;
    const currentUser = req.user;

    try {
        // validar si el applicationid es un objectid valido
        if (!mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({
                message: `ID solicitud inválido: ${applicationId}`
            });
        }

        const validStates = ['Pendiente', 'Contactado', 'Aprobada', 'Rechazada'];

        // validar que el nuevo estado sea uno de los validos
        if (!newStatus || !validStates.includes(newStatus)) {
            return res.status(400).json({
                message: `Estado inválido.`
            });
        }

        const application = await Application.findById(applicationId);

        // si no se encuentra la solicitud
        if (!application) {
            return res.status(404).json({
                message: `Solicitud ${applicationId} no encontrada.`
            });
        }

        const mascotaDeAplicacion = await Pet.findById(application.mascotaId);

        // si no se encuentra la mascota
        if (!mascotaDeAplicacion) {
            return res.status(404).json({
                message: "Mascota de la solicitud no encontrada."
            });
        }

        // verificar permisos: el usuario actual debe ser el propietario del refugio de la mascota o un administrador
        if (mascotaDeAplicacion.refugioId.toString() !== currentUser._id.toString() && currentUser.role !== 'Admin') {
            return res.status(403).json({
                message: "No autorizado para modificar esta solicitud."
            });
        }

        const oldAppStatus = application.estadoSolicitud;

        application.estadoSolicitud = newStatus;

        const updatedApplication = await application.save();

        // si el nuevo estado es 'aprobada'
        if (newStatus === 'Aprobada') {
            await Pet.findByIdAndUpdate(mascotaDeAplicacion._id, { estadoAdopcion: 'Adoptado' });

            await Application.updateMany(
                { mascotaId: mascotaDeAplicacion._id, _id: { $ne: applicationId }, estadoSolicitud: 'Pendiente' },
                { $set: { estadoSolicitud: 'Rechazada' } }
            );

            // si el estado anterior era 'aprobada' y el nuevo estado es diferente 
        } else if (oldAppStatus === 'Aprobada' && (newStatus === 'Pendiente' || newStatus === 'Rechazada' || newStatus === 'Contactado')) {
            const otherApprovedApps = await Application.countDocuments({ mascotaId: mascotaDeAplicacion._id, estadoSolicitud: 'Aprobada', _id: { $ne: applicationId } });

            // si no hay otras solicitudes aprobadas y la mascota estaba como 'adoptado'
            if (otherApprovedApps === 0 && mascotaDeAplicacion.estadoAdopcion === 'Adoptado') {
                await Pet.findByIdAndUpdate(mascotaDeAplicacion._id, { estadoAdopcion: 'Disponible' });
            }
        }

        return res.status(200).json({
            message: "Estado actualizado",
            application: updatedApplication
        });

    } catch (error) {
        // si es un error de validacion de mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Error validación", errors: error.errors
            });
        }

        return res.status(500).json({
            message: 'Error interno actualizando solicitud.'
        });
    }
}

/**
 * funcion asincrona para obtener solicitudes para una mascota
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con la lista de solicitudes
 */
export async function getApplicationsForPet(req, res) {
    const { mascotaId } = req.params;
    const currentUser = req.user;

    try {
        // validar si el mascotaid es un objectid valido
        if (!mongoose.Types.ObjectId.isValid(mascotaId)) {
            return res.status(400).json({
                message: 'ID de mascota inválido'
            });
        }

        const pet = await Pet.findById(mascotaId);

        // si no se encuentra la mascota
        if (!pet) {
            return res.status(404).json({
                message: 'Mascota no encontrada'
            });
        }

        // verificar permisos: el usuario debe ser admin o el propietario del refugio de la mascota
        if (currentUser.role !== 'Admin' && pet.refugioId.toString() !== currentUser._id.toString()) {
            return res.status(403).json({
                message: 'No autorizado para ver estas solicitudes.'
            });
        }

        const applications = await Application.find({ mascotaId })
            //populate() -> permite obtener otros atributos mediante el id
            .populate('adoptanteId', 'nombreCompleto username email')
            .sort({ fechaSolicitud: -1 });

        return res.status(200).json({ data: applications });

    } catch (error) {
        return res.status(500).json({
            message: 'Error interno obteniendo solicitudes para la mascota'
        });
    }
}

/**
 * funcion asincrona para verificar la solicitud de un usuario para una mascota
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json indicando si existe solicitud y su estado
 */
export async function checkUserApplicationForPet(req, res) {
    const { mascotaId } = req.params;
    const currentUser = req.user;

    try {
        // validar si el mascotaid es un objectid valido
        if (!mongoose.Types.ObjectId.isValid(mascotaId)) {
            return res.status(400).json({
                message: 'ID de mascota inválido'
            });
        }

        const application = await Application.findOne({
            mascotaId: mascotaId,
            adoptanteId: currentUser._id
        });

        // si se encuentra una solicitud
        if (application) {
            return res.status(200).json({ hasApplication: true, status: application.estadoSolicitud });

            // si no se encuentra una solicitud
        } else {
            return res.status(200).json({ hasApplication: false });
        }

    } catch (error) {
        return res.status(500).json({
            message: 'Error interno del servidor al verificar la solicitud.'
        });
    }
}