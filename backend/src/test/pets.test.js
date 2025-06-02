import request from 'supertest';
import { expect } from 'chai';
import serverApp from '../app.js';
import mongoose from 'mongoose';
import Pet from '../models/pet.js';
import User from '../models/user.js';
import Application from '../models/application.js';

let refugioUser;
let refugioToken;
let adoptanteUser;
let adoptanteToken;

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

  //si hay conexion
  if (mongoose.connection.readyState === 1) {
    try {
      await Application.deleteMany({});
    } catch (err) {
      console.error("Error limpiando colecciones en before:", err);
      throw err;
    }
  }

  const refugioData = {
    nombreRefugio: 'Refugio PetTestUniqueP',
    email: 'refugiopets.unique.p@example.com',
    password: 'Password123!',
    role: 'Refugio',
    direccionCompleta: '123 Test St P, Test City',
    CIF_NIF: 'G0000001R',
    telefono: '600000003',
  };

  const regResRefugio = await request(serverApp).post('/auth/register').send(refugioData);

  //si falla el registro
  if (regResRefugio.status !== 201) {
    throw new Error(`Refugio fallo en el registro: ${regResRefugio.body.message || 'No hay mensaje'}`);
  }

  refugioUser = await User.findOneAndUpdate(
    { email: refugioData.email },
    { estadoAprobacion: 'Aprobado' },
    { new: true }
  );

  //si no esta aprobado o no se encuentra
  if (!refugioUser || refugioUser.estadoAprobacion !== 'Aprobado') {
    throw new Error('fallo la configuracion de la prueba: no se pudo encontrar o aprobar refugiouser');
  }

  const loginResRefugio = await request(serverApp)
    .post('/auth/login')
    .send({ email: refugioData.email, password: refugioData.password });

  //si no hay token o no se registro
  if (loginResRefugio.status !== 200 || !loginResRefugio.body.token) {
    throw new Error(`Refugio fallo login: ${loginResRefugio.body.message || 'No token'}`);
  }

  refugioToken = loginResRefugio.body.token;

  const adoptanteData = {
    username: 'adoptantepets.unique.p',
    email: 'adoptantepets.unique.p@example.com',
    password: 'Password123!',
    role: 'Adoptante',
    nombreCompleto: 'Adoptante PetTest Unique P'
  };

  const regResAdoptante = await request(serverApp).post('/auth/register').send(adoptanteData);

  //si fallo el incio de sesion
  if (regResAdoptante.status !== 201) {
    throw new Error(`Adoptante resgistro fallado: ${regResAdoptante.body.message || 'No hay mensaje'}`);
  }

  adoptanteUser = await User.findOne({ email: adoptanteData.email });

  //si no hay adoptante
  if (!adoptanteUser) {
    throw new Error('Adoptante no encontrado despues del registro.');
  }

  const loginResAdoptante = await request(serverApp)
    .post('/auth/login')
    .send({ email: adoptanteData.email, password: adoptanteData.password });

  //si fallo el incio de sesion o no hay token
  if (loginResAdoptante.status !== 200 || !loginResAdoptante.body.token) {
    throw new Error(`Adoptante login failed: ${loginResAdoptante.body.message || 'No token'}`);
  }
  adoptanteToken = loginResAdoptante.body.token;

  if (!refugioToken) throw new Error('refugioToken no establecido en la configuracion de pets.test.js');
  if (!adoptanteToken) throw new Error('adoptanteToken no establecido en la configuracion de pets.test.js');
  if (!adoptanteUser) throw new Error('adoptanteUser no establecido en la configuracion de pets.test.js');
  if (!refugioUser) throw new Error('refugioUser no establecido en la configuracion de pets.test.js');
});


describe('Pets Endpoints', () => {
  describe('POST /pets', () => {
    it('debería crear una nueva mascota (status 201) si el usuario es un Refugio autenticado y aprobado', async () => {
      const petData = {
        nombre: 'Firulais Test',
        especie: 'Perro',
        genero: 'Macho',
        descripcion: 'Amigable y juguetón',
      };

      const res = await request(serverApp)
        .post('/pets')
        .set('Authorization', `Bearer ${refugioToken}`)
        .send(petData);

      expect(res.status).to.equal(201);
      expect(res.body.message).to.equal('Mascota creada');
      expect(res.body.pet.nombre).to.equal(petData.nombre);
      expect(res.body.pet.refugioId.toString()).to.equal(refugioUser._id.toString());
    });

    it('debería fallar con 401 al crear mascota si el usuario no está autenticado', async () => {
      const petData = {
        nombre: 'SinAuth Test',
        especie: 'Gato',
        genero: 'Hembra',
        descripcion: 'Curiosa'
      };

      const res = await request(serverApp).post('/pets').send(petData);

      expect(res.status).to.equal(401);
    });


    it('debería fallar con 403 al crear mascota si el usuario no es Refugio', async () => {
      const petData = {
        nombre: 'NoRefugio Test',
        especie: 'Perro',
        genero: 'Macho',
        descripcion: 'Juguetón'
      };

      const res = await request(serverApp)
        .post('/pets')
        .set('Authorization', `Bearer ${adoptanteToken}`)

        .send(petData);
      expect(res.status).to.equal(403);
      expect(res.body.message).to.equal('Acceso prohibido. Rol no autorizado.');
    });
  });

  describe('GET /pets', () => {
    it('debería devolver una lista de mascotas disponibles ordenadas por fechaPublicacion descendente', async () => {
      if (!refugioUser || !refugioUser._id) {
        throw new Error('refugiouser no esta definido para la prueba get /pets');
      }

      await Pet.deleteMany({});
      await Pet.insertMany([
        {
          nombre: 'Coco Test',
          especie: 'Perro',
          genero: 'Macho',
          descripcion: 'Juguetón',
          refugioId: refugioUser._id,
          estadoAdopcion: 'Disponible',
          fechaPublicacion: new Date('2024-03-20T10:00:00Z')
        },
        {
          nombre: 'Max Test',
          especie: 'Perro',
          genero: 'Macho',
          descripcion: 'Leal',
          refugioId: refugioUser._id,
          estadoAdopcion: 'Disponible',
          fechaPublicacion: new Date('2024-03-15T10:00:00Z')
        },
        {
          nombre: 'Luna Test',
          especie: 'Gato',
          genero: 'Hembra',
          descripcion: 'Independiente',
          refugioId: refugioUser._id,
          estadoAdopcion: 'Adoptado',
          fechaPublicacion: new Date('2024-03-10T10:00:00Z')
        },
      ]);

      const res = await request(serverApp).get('/pets');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array').with.lengthOf(2);

      const petNames = res.body.data.map(p => p.nombre);

      expect(petNames).to.deep.equal(['Coco Test', 'Max Test']);
    });
  });
});