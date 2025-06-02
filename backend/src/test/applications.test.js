import request from 'supertest';
import { expect } from 'chai';
import serverApp from '../app.js';
import mongoose from 'mongoose';
import User from '../models/user.js';
import Pet from '../models/pet.js';
import Application from '../models/application.js';

let adoptanteToken;
let adoptanteUser;
let refugioToken;
let refugioUser;
let petToApply;
let petNotAvailable;

//se ejecuta una vez antes de todas las pruebas en este archivo
before(async () => {
  // comprueba si la conexion a mongoose esta activa
  if (mongoose.connection.readyState === 0) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // vuelve a comprobar la conexion
    if (mongoose.connection.readyState === 0) {
      throw new Error("La base de datos no puede conectarse");
    }
  }

  try {
    //elimina las colecciones
    await User.deleteMany({});
    await Pet.deleteMany({});
    await Application.deleteMany({});

  } catch (err) {
    console.error("Error limpiando colecciones en before:", err);
    throw err;
  }

  // datos para crear un usuario de tipo refugio
  const refugioData = {
    nombreRefugio: 'Refugio AppTestUniqueA',
    email: 'refugioapp.unique.a@example.com',
    password: 'Password123!',
    role: 'Refugio',
    direccionCompleta: 'Calle Refugio App Unique A 123',
    CIF_NIF: 'G9876543B',
    telefono: '600777889'
  };

  // registra el usuario refugi
  const regResRefugio = await request(serverApp).post('/auth/register').send(refugioData);

  //si el registro falla
  if (regResRefugio.status !== 201) {

    throw new Error(`el registro del refugio fallo con estado ${regResRefugio.status}: ${regResRefugio.body.message || 'sin mensaje'}`);
  }

  //actualizamos el estado 
  const refugioDb = await User.findOneAndUpdate(
    { email: refugioData.email },
    { estadoAprobacion: 'Aprobado' },
    { new: true }
  );

  //  si el refugio no fue encontrado y no esta aprobado 
  if (!refugioDb || refugioDb.estadoAprobacion !== 'Aprobado') {
    throw new Error('fallo al encontrar y aprobar el refugio despues del registro');
  }

  refugioUser = refugioDb;

  const loginResRefugio = await request(serverApp).post('/auth/login').send({ email: refugioData.email, password: refugioData.password });

  //si no hay token o falla el refistro
  if (loginResRefugio.status !== 200 || !loginResRefugio.body.token) {
    throw new Error(`el inicio de sesion del refugio fallo con estado ${loginResRefugio.status}: ${loginResRefugio.body.message || 'no se recibio token'}`);
  }

  refugioToken = loginResRefugio.body.token;

  // datos para crear un usuario de tipo adoptante
  const adoptanteData = {
    username: 'adoptanteapp.unique.a',
    email: 'adoptanteapp.unique.a@example.com',
    password: 'Password123!',
    role: 'Adoptante',
    nombreCompleto: 'Adoptante App Test Unique A'
  };

  const regResAdoptante = await request(serverApp).post('/auth/register').send(adoptanteData);

  //si no se registra
  if (regResAdoptante.status !== 201) {
    throw new Error(`el registro del adoptante fallo con estado  ${regResAdoptante.status}: ${regResAdoptante.body.message || 'sin mensaje'}`);
  }

  const adoptanteDb = await User.findOne({ email: adoptanteData.email });

  //si hay adoptante
  if (!adoptanteDb) {
    throw new Error('fallo al encontrar el adoptante despues del registro');
  }
  adoptanteUser = adoptanteDb;

  const loginResAdoptante = await request(serverApp).post('/auth/login').send({ email: adoptanteData.email, password: adoptanteData.password });

  //si no hay token o falla el registro
  if (loginResAdoptante.status !== 200 || !loginResAdoptante.body.token) {
    throw new Error(`el inicio de sesion del adoptante fallo con estado ${loginResAdoptante.status}: ${loginResAdoptante.body.message || 'no se recibio token'}`);
  }

  adoptanteToken = loginResAdoptante.body.token;

  if (!refugioUser || !refugioToken || !adoptanteUser || !adoptanteToken) {
    console.error("Data at the time of the final check:", {
      refugioUserExists: !!refugioUser, refugioUserObj: refugioUser,
      refugioTokenExists: !!refugioToken, refugioTokenValue: refugioToken,
      adoptanteUserExists: !!adoptanteUser, adoptanteUserObj: adoptanteUser,
      adoptanteTokenExists: !!adoptanteToken, adoptanteTokenValue: adoptanteToken,
    });

    throw new Error('fallo la configuracion de la prueba: faltan datos de usuario o tokens para las pruebas de solicitudes');
  }

  //si no existe el refugio o su id
  if (!refugioUser || !refugioUser._id) {
    throw new Error('falta el usuario refugio o su _id antes de crear mascotas');
  }

  petToApply = new Pet({
    nombre: 'Buddy Aplicable',
    especie: 'Perro',
    genero: 'Macho',
    descripcion: 'Listo para aplicar',
    refugioId: refugioUser._id,
    estadoAdopcion: 'Disponible'
  });

  await petToApply.save();

  petNotAvailable = new Pet({
    nombre: 'Rocky No Disponible',
    especie: 'Perro',
    genero: 'Macho',
    descripcion: 'Ya no está disponible',
    refugioId: refugioUser._id,
    estadoAdopcion: 'Adoptado'
  });
  await petNotAvailable.save();
});

describe('Applications Endpoints', () => {
  describe('POST /applications/pet/:mascotaId/apply', () => {
    it('un adoptante autenticado debería poder solicitar una mascota disponible', async () => {
      const res = await request(serverApp)
        .post(`/applications/pet/${petToApply._id}/apply`)
        .set('Authorization', `Bearer ${adoptanteToken}`)
        .send({ mensajeAdoptante: 'Me encantaría adoptar a Buddy.' });

      expect(res.status).to.equal(201);
      expect(res.body.message).to.equal('Solicitud enviada.');
      expect(res.body.application.mascotaId.toString()).to.equal(petToApply._id.toString());
      expect(res.body.application.adoptanteId.toString()).to.equal(adoptanteUser._id.toString());
    });

    it('debería fallar con 400 si la mascota no está disponible', async () => {
      const res = await request(serverApp)
        .post(`/applications/pet/${petNotAvailable._id}/apply`)
        .set('Authorization', `Bearer ${adoptanteToken}`)
        .send({ mensajeAdoptante: 'Intento aplicar a mascota no disponible.' });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Mascota no disponible.');
    });

    it('debería fallar con 404 si la mascotaId no existe', async () => {
      const nonExistentPetId = new mongoose.Types.ObjectId();
      const res = await request(serverApp)
        .post(`/applications/pet/${nonExistentPetId}/apply`)
        .set('Authorization', `Bearer ${adoptanteToken}`)
        .send({ mensajeAdoptante: 'Intento aplicar a mascota inexistente.' });

      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal('Mascota no encontrada.');
    });
  });

  describe('GET /applications/my (Adoptante)', () => {
    beforeEach(async () => {
      if (adoptanteUser && adoptanteUser._id) {
        await Application.deleteMany({ adoptanteId: adoptanteUser._id });
      }
    });

    it('debería devolver las solicitudes (status 200) del adoptante autenticado', async () => {
      if (!adoptanteUser || !petToApply || !petToApply.refugioId) {
        throw new Error("faltan datos para la configuracion de la prueba 'get /applications/my");
      }
      await new Application({
        adoptanteId: adoptanteUser._id,
        mascotaId: petToApply._id,
        refugioId: petToApply.refugioId,
        mensajeAdoptante: "Solicitud de prueba para GET /my"
      }).save();

      const res = await request(serverApp)
        .get('/applications/my')
        .set('Authorization', `Bearer ${adoptanteToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array').with.lengthOf(1);
      expect(res.body.data[0].adoptanteId.toString()).to.equal(adoptanteUser._id.toString())
    });

    it('debería devolver un array vacío (status 200) si el adoptante no tiene solicitudes', async () => {
      const res = await request(serverApp)
        .get('/applications/my')
        .set('Authorization', `Bearer ${adoptanteToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array').to.be.empty;
    });
  });
});