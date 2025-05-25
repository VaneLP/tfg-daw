import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { } from 'dotenv/config';

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({
          message: "Acceso denegado. Se requiere token."
        });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY || "tu_super_secreto_por_defecto");

    if (!decoded || !decoded.userId) {
      throw new Error("Token inválido");
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res
        .status(404)
        .json({
          message: 'Usuario asociado al token no encontrado.'
        });
    }

    req.user = user;
    next();

  } catch (error) {
  }
}

export function authorize(roles = []) {
  if (typeof roles === 'string') roles = [roles];
  return (req, res, next) => {

    if (!req.user) {
      return res
        .status(401)
        .json({
          message: 'Usuario no autenticado.'
        });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: 'Acceso prohibido. Rol no autorizado.'
        });
    }

    next();
  };
}