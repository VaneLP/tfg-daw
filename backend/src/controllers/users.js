import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';

/**
 * funcion asincrona para registrar un usuario
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado
 */
export async function register(req, res) {
    try {
        // extraer datos del cuerpo de la solicitud (req body)
        const { username, email, password, role, nombreCompleto,
            nombreRefugio, direccionCompleta, CIF_NIF, telefono,
            descripcionRefugio, coordenadas, avatar } = req.body;

        // validar que email password y rol esten presentes
        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Email, password y rol son requeridos."
            });
        }

        // validar que el rol sea uno de los permitidos
        if (!['Adoptante', 'Refugio', 'Admin'].includes(role)) {
            return res.status(400).json({
                message: "Rol inválido."
            });
        }

        // si el rol es adoptante o admin
        if (role === 'Adoptante' || role === 'Admin') {
            // validar que el username este presente
            if (!username) {
                return res.status(400).json({
                    message: "Username es requerido para este rol."
                });
            }

            const existingUsername = await User.findOne({ username: username.toLowerCase() });

            // si ya existe
            if (existingUsername) {
                return res.status(400).json({
                    message: "El nombre de usuario ya existe."
                });
            }
        }

        const existingEmail = await User.findOne({ email: email.toLowerCase() });

        // si ya existe
        if (existingEmail) {
            return res.status(400).json({
                message: "El email ya existe."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // crear objeto con la informacion basica del nuevo usuario
        const newUserInfo = {
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            avatar: avatar || undefined,
        };

        // si el rol es adoptante o admin
        if (role === 'Adoptante' || role === 'Admin') {
            // si se proporciono username
            if (username) {
                newUserInfo.username = username.toLowerCase();
            }

            // si el rol es adoptante
            if (role === 'Adoptante') {
                // validar que el nombre completo este presente
                if (!nombreCompleto) {
                    return res.status(400).json({
                        message: "Nombre completo es requerido para Adoptante."
                    });
                }

                newUserInfo.nombreCompleto = nombreCompleto;

                if (telefono) {
                    newUserInfo.telefono = telefono;
                }
            }
        }

        // si el rol es refugio
        if (role === 'Refugio') {
            // validar campos obligatorios para refugio
            if (!nombreRefugio || !direccionCompleta || !CIF_NIF || !telefono) {
                return res.status(400).json({ message: "Nombre del refugio, dirección, CIF/NIF y teléfono son requeridos para Refugio." });
            }

            newUserInfo.nombreRefugio = nombreRefugio;
            newUserInfo.direccionCompleta = direccionCompleta;
            newUserInfo.CIF_NIF = CIF_NIF;
            newUserInfo.telefono = telefono;

            // si se proporciona descripcion del refugio anadirla
            if (descripcionRefugio) {
                newUserInfo.descripcionRefugio = descripcionRefugio;
            }

            // si se proporcionan coordenadas validas anadirlas
            if (coordenadas && typeof coordenadas.lat === 'number' && typeof coordenadas.lon === 'number') {
                newUserInfo.coordenadas = coordenadas;
            }

        }

        const newUser = new User(newUserInfo);

        await newUser.save();

        const userResponse = newUser.toObject();
        delete userResponse.password;

        return res.status(201).json({
            message: `Usuario ${role} creado correctamente. ${role === 'Refugio' ? 'Pendiente de aprobación.' : ''}`, // mensaje adicional si es refugio
            user: userResponse
        });

    } catch (error) {
        // si es un error de mongodb por indice duplicado (codigo 11000)
        if (error.name === 'MongoServerError' && error.code === 11000) {
            let field = 'CIF/NIF'; 

            if (error.message.includes('email_1')) {
                field = 'email';
            } else if (error.message.includes('username_1')) {
                field = 'nombre de usuario';
            }

            return res.status(400).json({
                message: `El ${field} ya existe.`
            });
        }

        // si es un error de validacion de mongoose
        if (error.name === 'ValidationError') {
            // si el error de validacion tiene una estructura especifica de mongoose
            if (error.message.startsWith("User validation failed:") && error.errors) {
                const firstErrorKey = Object.keys(error.errors)[0];
                const specificMessage = error.errors[firstErrorKey].message;

                return res.status(400).json({
                    message: specificMessage,
                    errors: error.errors
                });
            }

            return res.status(400).json({
                message: error.message,
                errors: error.errors
            });
        }

        return res.status(500).json({
            message: "Error interno al registrar el usuario."
        });
    }
}

/**
 * funcion asincrona para iniciar sesion
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el token y datos del usuario si es exitoso
 */
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        // validar que email y password esten presentes
        if (!email || !password) {
            return res.status(400).json({
                message: "Por favor, introduce email y contraseña."
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        // si no se encuentra el usuario
        if (!user) {
            return res.status(401).json({
                message: "Credenciales inválidas."
            });
        }

        // si el usuario es un refugio y su estado de aprobacion no es 'aprobado'
        if (user.role === 'Refugio' && user.estadoAprobacion !== 'Aprobado') {
            let message = 'Tu cuenta de refugio está pendiente de aprobación.';

            if (user.estadoAprobacion === 'Rechazado') {
                message = 'Tu cuenta de refugio ha sido rechazada y no puede acceder.';
            } else if (user.estadoAprobacion === 'Pendiente') {
                message = 'Tu cuenta de refugio aún está pendiente de aprobación. Por favor, espera la confirmación del administrador.';
            } else {
                message = `El estado de tu cuenta de refugio (${user.estadoAprobacion}) no permite el acceso.`;
            }

            return res.status(403).json({ message: message });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        // si las contrasenas no coinciden
        if (!passwordMatch) {
            return res.status(401).json({
                message: "Credenciales inválidas."
            });
        }

        const JWT_SECRET = process.env.SECRET_KEY || "pawfinder_super_secret_default_key";
        const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";
        const payload = { userId: user._id, username: user.username, email: user.email, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const userResponse = user.toObject();

        delete userResponse.password;

        return res.status(200).json({
            message: "Inicio de sesión correcto.", token: token, user: userResponse
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error interno durante el inicio de sesión."
        });
    }
}

/**
 * funcion asincrona para obtener todos los usuarios
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con la lista de usuarios
 */
export async function getAllUsers(req, res) {
    try {
        const users = await User.find({}, { password: 0 }); 

        return res.status(200).json({ data: users });

    } catch (error) {
        return res.status(500).json({
            message: "Error interno al obtener usuarios."
        });
    }
}

/**
 * funcion asincrona para obtener el perfil del usuario
 * @param {object} req - el objeto de solicitud http (debe contener req user del middleware de autenticacion)
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con los datos del perfil del usuario
 */
export async function profile(req, res) {
    try {
        // si no hay usuario en req
        if (!req.user) {
            return res.status(401).json({ message: "No autenticado." });
        }

        const userToSend = req.user.toObject ? req.user.toObject() : { ...req.user };
        delete userToSend.password;

        return res.status(200).json({
            message: `Datos del perfil`, user: userToSend
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error interno al obtener el perfil."
        });
    }
}

/**
 * funcion asincrona para actualizar el perfil del usuario
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado de la actualizacion
 */
export async function updateMyProfile(req, res) {
    const currentUser = req.user;

    // si no hay usuario actual (no autenticado)
    if (!currentUser) {
        return res.status(401).json({
            message: "No autenticado."
        });
    }

    const userId = currentUser._id;

    // extraer los campos del cuerpo de la solicitud excluyendo campos no modificables o especiales
    const {
        password, role, estadoAprobacion, fechaRegistro, 
        createdAt, updatedAt, _id, __v, 
        currentPassword, newPassword, confirmNewPassword, 
        avatarInput, 
        firstName, lastName, 
        ...payload 
    } = req.body;

    const finalUpdateData = {};

    try {
        // si se proporciono firstname o lastname
        if (firstName !== undefined || lastName !== undefined) {
            const userDoc = await User.findById(userId).select('nombreCompleto').lean(); // .lean() para objeto js plano
            const currentNombreCompletoDB = userDoc?.nombreCompleto || '';
            const formFirstName = firstName === undefined ? (currentNombreCompletoDB.split(' ')[0] || '') : firstName.trim();
            const formLastName = lastName === undefined ? (currentNombreCompletoDB.split(' ').slice(1).join(' ') || '') : lastName.trim();
            const newConstructedFullName = `${formFirstName} ${formLastName}`.trim();

            // si el nuevo nombre completo es diferente al actual
            if (newConstructedFullName !== currentNombreCompletoDB) {
                finalUpdateData.nombreCompleto = newConstructedFullName;
            }
        }

        // si se proporciono un email y es diferente al email actual del usuario
        if (payload.email && currentUser.email &&
            payload.email.toLowerCase() !== currentUser.email.toLowerCase()) {
            const newEmailLower = payload.email.toLowerCase();
            const existingUserWithNewEmail = await User.findOne({ email: newEmailLower, _id: { $ne: userId } }); // excluir al usuario actual

            // si ya esta en uso
            if (existingUserWithNewEmail) {
                return res.status(400).json({ message: 'El nuevo email ya está en uso por otra cuenta.' });
            }

            finalUpdateData.email = newEmailLower;
        }

        const allowedDirectFields = ['username', 'telefono', 'avatar']; 

        // si el payload (datos del body) contiene 'coordenadas'
        if (payload.hasOwnProperty('coordenadas')) {
            // si se proporcionan coordenadas y son validas (lat y lon numeros)
            if (payload.coordenadas && typeof payload.coordenadas.lat === 'number' && typeof payload.coordenadas.lon === 'number') {
                // si el usuario no tiene coordenadas o las nuevas son diferentes
                if (!currentUser.coordenadas || currentUser.coordenadas.lat !== payload.coordenadas.lat || currentUser.coordenadas.lon !== payload.coordenadas.lon) {
                    finalUpdateData.coordenadas = payload.coordenadas;
                }

                // si se envia coordenadas como null y el usuario tenia coordenadas (para borrarlas)
            } else if (payload.coordenadas === null && currentUser.coordenadas) {
                finalUpdateData.coordenadas = null;
            }
        }

        // iterar sobre los campos permitidos para actualizacion directa
        for (const key of allowedDirectFields) {
            // si el payload contiene la clave y su valor no es indefinido
            if (payload.hasOwnProperty(key) && payload[key] !== undefined) {
                let currentValue = currentUser[key];
                let newValue = (typeof payload[key] === 'string') ? payload[key].trim() : payload[key];

                if (currentValue !== newValue) {
                    finalUpdateData[key] = newValue;
                }
            }
        }

        // anadir campos especificos de refugio si el rol es refugio
        if (currentUser.role === 'Refugio') {
            const refugioFields = ['nombreRefugio', 'direccionCompleta', 'CIF_NIF', 'descripcionRefugio'];
            
            for (const key of refugioFields) {
                if (payload.hasOwnProperty(key) && payload[key] !== undefined) {
                    let currentValue = currentUser[key];
                    let newValue = (typeof payload[key] === 'string') ? payload[key].trim() : payload[key];
                    
                    if (currentValue !== newValue) {
                        finalUpdateData[key] = newValue;
                    }
                }
            }
        }


        // si no hay ningun cambio para guardar
        if (Object.keys(finalUpdateData).length === 0) {
            return res.status(200).json({
                message: "No hay cambios para guardar.",
                user: currentUser.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } })
            });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { $set: finalUpdateData }, { new: true, runValidators: true }).select('-password');

        // si no se encuentra el usuario tras actualizar (poco probable)
        if (!updatedUser) {
            return res.status(404).json({
                message: "Usuario no encontrado tras actualizar."
            });
        }

        return res.status(200).json({
            message: "Perfil actualizado.",
            user: updatedUser
        });

    } catch (error) {
        // si es un error de validacion de mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Error de validación", errors: error.errors
            });
        }

        // si es un error de indice duplicado de mongodb
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];

            return res.status(400).json({
                message: `El campo '${field}' con valor '${error.keyValue[field]}' ya existe.`
            });
        }

        return res.status(500).json({
            message: "Error interno al actualizar el perfil."
        });
    }
}

/**
 * funcion asincrona para aprobar un refugio
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado
 */
export async function approveRefugio(req, res) {
    const { refugioId } = req.params;

    try {
        // validar si el refugioid es un objectid valido de mongoose
        if (!mongoose.Types.ObjectId.isValid(refugioId)) {
            return res.status(400).json({
                message: `ID de refugio inválido`
            });
        }

        const updatedRefugio = await User.findOneAndUpdate(
            { _id: refugioId, role: 'Refugio' },
            { $set: { estadoAprobacion: 'Aprobado' } }, 
            { new: true } 
        ).select('-password'); // excluir la contrasena del resultado

        // si no se encuentra el refugio o no es un refugio
        if (!updatedRefugio) {
            return res.status(404).json({
                message: `Refugio ${refugioId} no encontrado o no es un refugio.`
            });
        }

        return res.status(200).json({
            message: "Refugio aprobado", refugio: updatedRefugio
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error interno aprobando refugio."
        });
    }
}

/**
 * funcion asincrona para rechazar un refugio
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado
 */
export async function rejectRefugio(req, res) {
    const { refugioId } = req.params;

    try {
        // validar si el refugioid es un objectid valido
        if (!mongoose.Types.ObjectId.isValid(refugioId)) {
            return res.status(400).json({
                message: `ID de refugio inválido`
            });
        }

        const updatedRefugio = await User.findOneAndUpdate(
            { _id: refugioId, role: 'Refugio' }, 
            { $set: { estadoAprobacion: 'Rechazado' } }, 
            { new: true }
        ).select('-password'); // excluir contrasena

        // si no se encuentra el refugio o no es un refugio
        if (!updatedRefugio) {
            return res.status(404).json({
                message: `Refugio ${refugioId} no encontrado o no es un refugio.`
            });
        }

        return res.status(200).json({
            message: "Refugio rechazado", refugio: updatedRefugio
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error interno rechazando refugio."
        });
    }
}

/**
 * funcion asincrona para obtener refugios pendientes
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con la lista de refugios pendientes
 */
export async function getPendingRefugios(req, res) {
    try {
        const pending = await User.find({ role: 'Refugio', estadoAprobacion: 'Pendiente' }).select('-password');

        return res.status(200).json({ data: pending });

    } catch (error) {
        return res.status(500).json({
            message: "Error interno obteniendo refugios pendientes."
        });
    }
}

/**
 *funcion asincrona para eliminar un usuario por id
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado de la eliminacion
 */
export async function deleteUserById(req, res) {
    const { userId } = req.params;
    const adminUser = req.user;

    try {
        // validar si el userid es un objectid valido
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: `ID de usuario inválido: ${userId}`
            });
        }

        // verificar que el administrador no este intentando eliminarse a si mismo
        if (userId === adminUser._id.toString()) {
            return res.status(400).json({
                message: "Un administrador no puede eliminarse a sí mismo por esta vía."
            });
        }

        const userToDelete = await User.findById(userId);

        // si no se encuentra el usuario
        if (!userToDelete) {
            return res.status(404).json({
                message: `Usuario con ID ${userId} no encontrado.`
            });
        }

        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            message: `Usuario ${userToDelete.username || userToDelete.email} y sus datos asociados (si aplica) han sido eliminados.`
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error interno del servidor al eliminar el usuario."
        });
    }
}