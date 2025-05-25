import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { } from 'dotenv/config'; 

const JWT_SECRET = process.env.SECRET_KEY || "pawfinder_super_secret_default_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";

/**
 * funcion asincrona para registrar un usuario
 * @param {object} req - el objeto de solicitud http
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json con el resultado
 */
export async function register(req, res) {
  try {
    const { username, email, password, role, nombreCompleto, nombreRefugio, direccionCompleta, CIF_NIF, telefono, descripcionRefugio, coordenadas, avatar } = req.body;

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

    const newUserInfo = {
      email: email.toLowerCase(), 
      password: hashedPassword, 
      role, 
      avatar: avatar, 
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

        // si se proporciona telefono anadirlo
        if (telefono) {
          newUserInfo.telefono = telefono;
        }
      }

    // si el rol es refugio
    } else if (role === 'Refugio') {
      // validar campos obligatorios para refugio
      if (!nombreRefugio || !direccionCompleta || !CIF_NIF || !telefono) {
        return res.status(400).json({
          message: "Nombre del refugio, dirección, CIF/NIF y teléfono son requeridos para Refugio."
        });
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
      }
      else if (error.message.includes('username_1')) {
        field = 'nombre de usuario';
      }

      return res.status(400).json({
        message: `El ${field} ya existe.`
      });
    }

    // si es un error de validacion de mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message, errors: error.errors
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

      return res.status(403).json({
        message: message
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    // si las contrasenas no coinciden
    if (!passwordMatch) {
      return res.status(401).json({
        message: "Credenciales inválidas."
      });
    }

    const payload = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const userResponse = user.toObject();

    delete userResponse.password;

    // si el avatar es una imagen en base64 y es muy larga eliminarla de la respuesta para no sobrecargarla
    if (userResponse.avatar &&
      userResponse.avatar.startsWith('data:image') &&
      userResponse.avatar.length > 50000) {
      userResponse.avatar = ''; 
    }

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
 * funcion asincrona para validar el token
 * @param {object} req - el objeto de solicitud http (debe contener req user del middleware de autenticacion)
 * @param {object} res - el objeto de respuesta http
 * @returns {Promise<object>} - una respuesta json indicando si el token es valido y los datos del usuario
 */
// 
export async function validateToken(req, res) {
  try {
    // si no hay usuario en req (token invalido o no proporcionado en middleware)
    if (!req.user) {
      return res.status(401).json({
        message: "Usuario no autenticado."
      });
    }

    return res.status(200).json({
      message: "Token válido.", user: req.user
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error interno al validar token."
    });
  }
}