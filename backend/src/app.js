import { } from 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';

import authRouter from './routes/auth.js';
import userRouter from './routes/users.js';
import petRouter from './routes/pets.js';
import applicationRouter from './routes/applications.js';
import blogRouter from './routes/blog.js';

import User from './models/user.js';
import Pet from './models/pet.js';
import Application from './models/application.js';
import Blog from './models/blogPost.js';

import mongoose from 'mongoose';


const { Types: { ObjectId } } = mongoose;

const app = express();
const PORT = process.env.PORT || 3000;

// Conexion a la BBDD
connectDB();

//-- Middlewares globales

// Habilitando CORS para todas las solicitudes
// cualquier dominio podra acceder a los recursos
// app.use(cors());
app.use(cors({
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // Coincidiendo con el segundo ejemplo
}));

// app.use(express.json()); // Permite trabajar con JSON en las solicitudes
// problema limitacion url -- imagenes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware para inyectar el modelo en las rutas
app.use((req, res, next) => {
  req.context = {
    models: { User, Pet, Application, Blog },
    ObjectId
  };
  next();
});

//-- Rutas
// Definicion de las rutas del proceso de Autenticacion
app.use('/auth', authRouter);

// Definicion de las rutas de la informacion de Usuarios
app.use('/users', userRouter);

// Definicion de las rutas de la informacion de Mascotas
app.use('/pets', petRouter);

// Definicion de las rutas de la informacion de Solicitudes
app.use('/applications', applicationRouter);

// Definicion de las rutas de la informacion del Blog
app.use('/blog', blogRouter);


// Middleware de manejo de errores centralizado
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'production' ? {} : err,
  });
});

//--

// Punto de entrada al servidor
app.get("/", (req, res) => {
  res.json({ message: "¡API de PawFinder funcionando!" });
});

// Puerto de escucha
export default app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto: ${PORT}`);
});
