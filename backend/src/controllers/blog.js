import BlogPost from '../models/blogPost.js';
import mongoose from 'mongoose';

/**
 * funcion asincrona para obtener todas las entradas del blog
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con la lista de entradas y datos de paginacion
 */
export async function getAllBlogPosts(req, res) {
    try {
        const { page = 1, limit = 4 } = req.query;
        const currentPage = parseInt(page, 10);
        const itemsPerPage = parseInt(limit, 10);
        const skip = (currentPage - 1) * itemsPerPage;
        let query = BlogPost.find();
        const totalItems = await BlogPost.countDocuments();

        query = query
            //populate() -> permite obtener otros atributos mediante el id
            .populate('autorId', 'username nombreRefugio role avatar')
            .sort({ fechaPublicacion: -1 })
            .skip(skip)
            .limit(itemsPerPage);

        const posts = await query.exec();

        return res.status(200).json({
            data: posts,
            pagination: {
                currentPage: currentPage,
                itemsPerPage: itemsPerPage,
                totalItems: totalItems,
                totalPages: Math.ceil(totalItems / itemsPerPage)
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error interno al obtener los artículos."
        });
    }
}

/**
 * funcion asincrona para obtener una entrada de blog por id
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con los datos de la entrada del blog
 */
export async function getBlogPostById(req, res) {
    const { postId } = req.params;

    try {
        // validar si el postid es un objectid valido de mongoose
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                message: `ID inválido: ${postId}`
            });
        }

        const post = await BlogPost.findById(postId)
            //populate() -> permite obtener otros atributos mediante el id
            .populate('autorId', 'username nombreRefugio role avatar');

        // si no se encuentra la entrada
        if (!post) {
            return res.status(404).json({
                message: `Artículo ${postId} no encontrado.`
            });
        }

        return res.status(200).json(post);

    } catch (error) {
        res.status(500).json({
            message: "Error interno."
        });
    }
}

/**
 * funcion asincrona para crear una entrada de blog
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado de la creacion
 */
export async function createBlogPost(req, res) {
    const currentUser = req.user;

    try {
        // verificar que el rol del usuario sea 'refugio' o 'admin'
        if (!['Refugio', 'Admin'].includes(currentUser.role)) {
            return res.status(403).json({
                message: "No autorizado para crear posts."
            });
        }

        const { titulo, contenido, imagenDestacada } = req.body;

        // validar que titulo y contenido esten presentes
        if (!titulo || !contenido) {
            return res.status(400).json({
                message: "El título y el contenido son obligatorios."
            });
        }

        const newPost = new BlogPost({
            titulo,
            contenido,
            imagenDestacada: imagenDestacada || null,
            autorId: currentUser._id
        });

        const savedPost = await newPost.save();
        const populatedPost = await BlogPost.findById(savedPost._id)
            //populate() -> permite obtener otros atributos mediante el id
            .populate('autorId', 'username nombreRefugio role avatar');

        return res.status(201).json({
            message: "Artículo creado correctamente.", post: populatedPost
        });

    } catch (error) {
        // si es un error de validacion de mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Error de validación", errors: error.errors
            });
        }

        return res.status(500).json({
            message: "Error interno al crear el artículo."
        });
    }
}

/**
 * funcion asincrona para actualizar una entrada de blog
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado de la actualizacion
 */
export async function updateBlogPost(req, res) {
    const { postId } = req.params;
    const currentUser = req.user;

    try {
        // validar si el postid es un objectid valido
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                message: `ID de post inválido: ${postId}`
            });
        }

        const post = await BlogPost.findById(postId);

        // si no se encuentra la entrada
        if (!post) {
            return res.status(404).json({
                message: `Artículo con ID ${postId} no encontrado.`
            });
        }

        // verificar permisos: el usuario actual debe ser el autor de la entrada o un administrador
        if (post.autorId.toString() !== currentUser._id.toString() && currentUser.role !== 'Admin') {
            return res.status(403).json({
                message: "No tienes permiso para editar este artículo."
            });
        }

        const { titulo, contenido, imagenDestacada } = req.body;
        const updateData = {};

        // si se proporciona titulo anadirlo a los datos de actualizacion
        if (titulo !== undefined) {
            updateData.titulo = titulo;
        }

        // si se proporciona contenido anadirlo
        if (contenido !== undefined) {
            updateData.contenido = contenido;
        }

        // si se proporciona imagendestacada anadirla
        if (imagenDestacada !== undefined) {
            updateData.imagenDestacada = imagenDestacada;
        }

        // si no hay datos para actualizar
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "No se proporcionaron datos para actualizar."
            });
        }

        const updatedPost = await BlogPost.findByIdAndUpdate(postId, updateData, { new: true, runValidators: true })
            //populate() -> permite obtener otros atributos mediante el id    
            .populate('autorId', 'username nombreRefugio role avatar');

        // si no se encuentra la entrada tras actualizar (poco probable)
        if (!updatedPost) {
            return res.status(404).json({
                message: `Artículo ${postId} no encontrado durante la actualización.`
            });
        }

        return res.status(200).json({
            message: "Artículo actualizado correctamente.", post: updatedPost
        });

    } catch (error) {
        // si es un error de validacion de mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Error de validación", errors: error.errors
            });
        }

        return res.status(500).json({
            message: "Error interno al actualizar el artículo."
        });
    }
}

/**
 * funcion asincrona para eliminar una entrada de blog
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado de la eliminacion
 */
export async function deleteBlogPost(req, res) {
    const { postId } = req.params;
    const currentUser = req.user;

    try {
        // validar si el postid es un objectid valido
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                message: `ID de post inválido: ${postId}`
            });
        }

        const post = await BlogPost.findById(postId);

        // si no se encuentra la entrada
        if (!post) {
            return res.status(404).json({
                message: `Artículo con ID ${postId} no encontrado.`
            });
        }

        // verificar permisos para eliminar
        if (post.autorId.toString() !== currentUser._id.toString() && currentUser.role !== 'Admin') {
            return res.status(403).json({
                message: "No tienes permiso para eliminar este artículo."
            });
        }

        const deleteResult = await BlogPost.findByIdAndDelete(postId);

        // si no se elimino la entrada (poco probable si se encontro antes)
        if (!deleteResult) {
            return res.status(404).json({
                message: `Artículo con ID ${postId} no se pudo eliminar.`
            });
        }

        return res.status(200).json({
            message: `Artículo con ID ${postId} eliminado.`
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor al eliminar el artículo."
        });
    }
}