import Pet from "../models/pet.js";
import Application from "../models/application.js";
import mongoose from 'mongoose';

/**
 * funcion asincrona para obtener todas las mascotas
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con la lista de mascotas y datos de paginacion
 */
export async function getAllPets(req, res) {
    try {
        const { especie, tamano, edad, genero, refugioId, select, page = 1, limit = 6 } = req.query;
        const filters = {};

        // si se proporciona un refugioid 
        if (refugioId) {
            filters.refugioId = refugioId;

            // si no se proporciona refugioid 
        } else {
            filters.estadoAdopcion = 'Disponible';
        }

        // anadir filtros adicionales si se proporcionan
        if (especie) {
            filters.especie = especie;
        }

        if (tamano) {
            filters.tamano = tamano;
        }

        if (edad) {
            filters.edad = edad;
        }

        if (genero) {
            filters.genero = genero;
        }

        const currentPage = parseInt(page, 10);
        const itemsPerPage = parseInt(limit, 10);
        const skip = (currentPage - 1) * itemsPerPage;

        let query = Pet.find(filters);

        const totalItems = await Pet.countDocuments(filters);

        // si el parametro 'select' es 'nombre'
        if (select === 'nombre') {
            query = query.select('nombre _id');

            // si no se especifica 'select' o es diferente de 'nombre'
        } else {
            query = query
                //populate() -> permite obtener otros atributos mediante el id
                .populate('refugioId', 'nombreRefugio telefono email');
        }

        query = query.sort({ fechaPublicacion: -1 }).skip(skip).limit(itemsPerPage);

        const pets = await query.exec();

        return res.status(200).json({
            data: pets,
            pagination: {
                currentPage: currentPage,
                itemsPerPage: itemsPerPage,
                totalItems: totalItems,
                totalPages: Math.ceil(totalItems / itemsPerPage)
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error interno al obtener las mascotas"
        });
    }
}

/**
 * funcion asincrona para obtener una mascota
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con los datos de la mascota
 */
export async function getOnePet(req, res) {
    const { mascotaId } = req.params;

    try {
        // validar si el mascotaid es un objectid valido de mongoose
        if (!mongoose.Types.ObjectId.isValid(mascotaId)) {
            return res.status(400).json({
                message: `ID mascota inválido: ${mascotaId}`
            });
        }

        const pet = await Pet.findById(mascotaId)
            //populate() -> permite obtener otros atributos mediante el id
            .populate({
                path: 'refugioId',
                select: 'nombreRefugio provincia telefono email direccionCompleta descripcionRefugio coordenadas nombreCompleto'
            });

        // si no se encuentra la mascota
        if (!pet) {
            return res.status(404).json({
                message: `Mascota con ID ${mascotaId} no encontrada.`
            });
        }

        return res.status(200).json(pet);

    } catch (error) {
        return res.status(500).json({
            message: `Error interno al obtener la mascota con ID ${mascotaId}`
        });
    }
}

/**
 * funcion asincrona para crear una mascota
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado de la creacion
 */
export async function postOnePet(req, res) {
    try {
        const currentUser = req.user;

        // verificar que el rol del usuario sea 'refugio'
        if (currentUser.role !== 'Refugio') {
            return res.status(403).json({
                message: "Solo los refugios pueden crear mascotas."
            });
        }

        const { nombre, especie, genero, descripcion, fotos, ...petData } = req.body;

        // validar campos obligatorios (nombre especie genero descripcion)
        if (!nombre || !especie || !genero || !descripcion) {
            return res.status(400).json({
                message: `Nombre, especie, género y descripción son obligatorios`
            });
        }

        const fotosToSave = Array.isArray(fotos) ? fotos : (fotos ? [fotos] : []);

        // crear una nueva instancia del modelo pet con los datos
        const newPet = new Pet({
            ...petData,
            nombre,
            especie,
            genero,
            descripcion,
            fotos: fotosToSave,
            refugioId: currentUser._id,
            estadoAdopcion: 'Disponible'
        });

        const savedPet = await newPet.save();

        return res.status(201).json({
            message: "Mascota creada", pet: savedPet
        });

    } catch (error) {
        // si es un error de validacion de mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Error de validación", errors: error.errors
            });
        }

        return res.status(500).json({
            message: 'Error interno al agregar la mascota'
        });
    }
}

/**
 * funcion asincrona para actualizar una mascota
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado de la actualizacion
 */
export async function updateOnePet(req, res) {
    const { mascotaId } = req.params;
    const currentUser = req.user;

    try {
        // validar si el mascotaid es un objectid valido
        if (!mongoose.Types.ObjectId.isValid(mascotaId)) {
            return res.status(400).json({
                message: `ID inválido`
            });
        }

        const pet = await Pet.findById(mascotaId);

        // si no se encuentra la mascota
        if (!pet) {
            return res.status(404).json({
                message: `Mascota no encontrada.`
            });
        }

        // verificar permisos: el usuario actual debe ser el propietario del refugio de la mascota o un administrador
        if (pet.refugioId.toString() !== currentUser._id.toString() && currentUser.role !== 'Admin') {
            return res.status(403).json({
                message: "No autorizado."
            });
        }

        const { refugioId, fechaPublicacion, createdAt, updatedAt, _id, __v, fotos, ...updateData } = req.body;

        // si se proporciona el campo 'fotos' en el body
        if (fotos !== undefined) {
            updateData.fotos = Array.isArray(fotos) ? fotos : (fotos ? [fotos] : []);
        }

        const updatedPet = await Pet.findByIdAndUpdate(mascotaId, { $set: updateData }, { new: true, runValidators: true })
            //populate() -> permite obtener otros atributos mediante el id    
            .populate('refugioId', 'nombreRefugio');

        // si no se encuentra la mascota tras actualizar (poco probable)
        if (!updatedPet) {
            return res.status(404).json({
                message: 'Mascota no encontrada tras actualizar.'
            });
        }

        return res.status(200).json({
            message: "Mascota actualizada", pet: updatedPet
        });

    } catch (error) {
        // si es un error de validacion de mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Error validación", errors: error.errors
            });
        }

        return res.status(500).json({
            message: `Error interno actualizando mascota`
        });
    }
}

/**
 * funcion asincrona para eliminar una mascota
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado de la eliminacion
 */
export async function deleteOnePet(req, res) {
    const { mascotaId } = req.params;
    const currentUser = req.user;

    try {
        // validar si el mascotaid es un objectid valido
        if (!mongoose.Types.ObjectId.isValid(mascotaId)) {
            return res.status(400).json({
                message: `ID inválido: ${mascotaId}`
            });
        }

        const pet = await Pet.findById(mascotaId);

        // si no se encuentra la mascota
        if (!pet) {
            return res.status(404).json({
                message: `Mascota ${mascotaId} no encontrada.`
            });
        }

        // verificar permisos para eliminar
        if (pet.refugioId.toString() !== currentUser._id.toString() && currentUser.role !== 'Admin') {
            return res.status(403).json({
                message: "No autorizado."
            });
        }

        await Application.deleteMany({ mascotaId: mascotaId });

        const deletedResult = await Pet.deleteOne({ _id: mascotaId });

        // si no se elimino ningun documento (poco probable si se encontro antes)
        if (deletedResult.deletedCount === 0) {
            return res.status(404).json({
                message: `Mascota ${mascotaId} no encontrada al intentar eliminar.`
            });
        }

        return res.status(200).json({
            message: `Mascota eliminada.`
        });

    } catch (error) {
        return res.status(500).json({
            message: `Error interno al eliminar la mascota`
        });
    }
}