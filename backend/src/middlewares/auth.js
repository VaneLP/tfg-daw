import jwt from "jsonwebtoken";
import User from "../models/user.js";

const JWT_SECRET = process.env.SECRET_KEY || "pawfinder_super_secret_default_key";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({
          message: "Acceso denegado. Se requiere token."
        });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId) {
      console.log("AUTHENTICATE: Token payload malformed (no userId), sending 401.");
      return res.status(401).json({ message: "Token inválido: payload incorrecto." });
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res
        .status(401)
        .json({
          message: 'Usuario asociado al token no encontrado.'
        });
    }

    req.user = user;
    next();

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido.' });
    }
    return res.status(500).json({ message: 'Error de autenticación interno.' });
  }
}

export function authorize(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({
          message: 'Usuario no autenticado para la autorización.'
        });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: 'Acceso prohibido. Rol no autorizado.'
        });
    }

    next();
  };
}