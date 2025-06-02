import request from 'supertest';
import { expect } from 'chai';
import serverApp from '../app.js';
import mongoose from 'mongoose';
import User from '../models/user.js';
import Pet from '../models/pet.js';
import Application from '../models/application.js';

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

    //si hya conexion
    if (mongoose.connection.readyState === 1) {
        try {
            await Application.deleteMany({});
        } catch (err) {
            console.error("Error limpiando colecciones en before:", err);
        }
    }
});

afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
        try {

        } catch (err) {
            console.error("Error limpiando colecciones en afterEach:", err);
        }
    }
});

describe('Auth Endpoints', () => {
    describe('POST /auth/register', () => {
        it('debería registrar un nuevo adoptante correctamente', async () => {
            const userData = {
                username: 'newadoptante',
                email: 'adoptante@example.com',
                password: 'Password123!',
                role: 'Adoptante',
                nombreCompleto: 'Adoptante Nuevo'
            };

            const res = await request(serverApp).post('/auth/register').send(userData);

            expect(res.status).to.equal(201);
            expect(res.body.message).to.equal('Usuario Adoptante creado correctamente. ');
        });

        it('debería registrar un nuevo refugio correctamente (estado pendiente)', async () => {
            const refugioData = {
                nombreRefugio: 'Refugio Esperanza',
                email: 'refugio@example.com',
                password: 'PasswordRefugio123!',
                role: 'Refugio',
                direccionCompleta: 'Calle Falsa 123',
                CIF_NIF: 'G12345678',
                telefono: '600111222'
            };

            const res = await request(serverApp)
                .post('/auth/register')
                .send(refugioData);

            expect(res.status).to.equal(201);
            expect(res.body.message).to.equal('Usuario Refugio creado correctamente. Pendiente de aprobación.');
        });

        it('debería fallar con 400 si el email ya existe', async () => {
            const userData = {
                username: 'firstuser',
                email: 'taken@example.com',
                password: 'Password123!',
                role: 'Adoptante',
                nombreCompleto: 'First User'
            };

            await request(serverApp).post('/auth/register').send(userData);

            const res = await request(serverApp)
                .post('/auth/register')
                .send({ ...userData, username: 'anotheruser' });

            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('El email ya existe.');
        });

        it('debería fallar con 400 si el nombre de usuario ya existe (para Adoptante)', async () => {
            const userData = {
                username: 'takenuser',
                email: 'unique@example.com',
                password: 'Password123!',
                role: 'Adoptante',
                nombreCompleto: 'Unique User'
            };

            await request(serverApp).post('/auth/register').send(userData);

            const res = await request(serverApp)
                .post('/auth/register')
                .send({ ...userData, email: 'another@example.com' });

            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('El nombre de usuario ya existe.');
        });

        it('debería fallar con 400 si faltan campos requeridos (ej: email)', async () => {
            const res = await request(serverApp)
                .post('/auth/register')
                .send({
                    username: 'testuser',
                    password: 'Password123!',
                    role: 'Adoptante',
                    nombreCompleto: 'Test User'
                });

            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('Email, password y rol son requeridos.');
        });

        it('debería fallar con 400 si el username es requerido para Adoptante por el controlador y no se provee', async () => {
            const res = await request(serverApp)
                .post('/auth/register')
                .send({
                    email: 'nousername@example.com',
                    password: 'Password123!',
                    role: 'Adoptante',
                    nombreCompleto: 'No Username User'
                });

            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('Username es requerido para este rol.');
        });

        it('debería fallar con 400 si nombreCompleto es requerido para Adoptante por el modelo y no se provee', async () => {
            const res = await request(serverApp)
                .post('/auth/register')
                .send({
                    username: 'nonameuser',
                    email: 'noname@example.com',
                    password: 'Password123!',
                    role: 'Adoptante'
                });

            expect(res.status).to.equal(400);
            expect(res.body.message).to.equal('Nombre completo es requerido para Adoptante.');
        });

    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            await request(serverApp)
                .post('/auth/register')
                .send({
                    username: 'loginuser',
                    email: 'login@example.com',
                    password: 'Password123!',
                    role: 'Adoptante',
                    nombreCompleto: 'Login User'
                });
        });

        it('debería loguear un usuario existente con credenciales correctas', async () => {
            const res = await request(serverApp)
                .post('/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'Password123!'
                });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('token');
        });

        it('debería fallar con 401 con contraseña incorrecta', async () => {
            const res = await request(serverApp)
                .post('/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'WrongPassword!'
                });

            expect(res.status).to.equal(401);
            expect(res.body.message).to.equal('Credenciales inválidas.');
        });

        it('debería fallar con 401 si el email no existe', async () => {
            const res = await request(serverApp)
                .post('/auth/login')
                .send({
                    email: 'donotexist@example.com',
                    password: 'Password123!'
                });

            expect(res.status).to.equal(401);
            expect(res.body.message).to.equal('Credenciales inválidas.');
        });

        it('debería fallar con 403 si un refugio no aprobado intenta loguearse', async () => {
            await request(serverApp)
                .post('/auth/register')
                .send({
                    nombreRefugio: 'Refugio Pendiente Login',
                    email: 'pendientelogin@example.com',
                    password: 'RefugioPass!',
                    role: 'Refugio',
                    direccionCompleta: 'Calle Test 123',
                    CIF_NIF: 'G98765432',
                    telefono: '600333444'
                });

            const res = await request(serverApp).post('/auth/login').send({ email: 'pendientelogin@example.com', password: 'RefugioPass!' });

            expect(res.status).to.equal(403);
            expect(res.body.message).to.include('Tu cuenta de refugio aún está pendiente de aprobación.');
        });


        describe('GET /auth/validate', () => {
            let validToken;
            
            beforeEach(async () => {
                const userData = {
                    username: 'validatetokenuser',
                    email: 'validate@example.com',
                    password: 'PasswordValidate123!',
                    role: 'Adoptante',
                    nombreCompleto: 'Validate User'
                };

                await request(serverApp).post('/auth/register').send(userData);

                const loginRes = await request(serverApp)
                    .post('/auth/login')
                    .send({ email: userData.email, password: userData.password });

                validToken = loginRes.body.token;
            });

            it('debería validar un token correcto y devolver datos del usuario', async () => {
                const res = await request(serverApp)
                    .get('/auth/validate')
                    .set('Authorization', `Bearer ${validToken}`);

                expect(res.status).to.equal(200);
                expect(res.body.message).to.equal('Token válido.');
            });

            it('debería fallar con 401 si no se provee token', async () => {
                const res = await request(serverApp).get('/auth/validate');

                expect(res.status).to.equal(401);
                expect(res.body.message).to.equal('Acceso denegado. Se requiere token.');
            });

            it('debería fallar con 401 con un token inválido/malformado', async () => {
                const res = await request(serverApp)
                    .get('/auth/validate')
                    .set('Authorization', 'Bearer invalidtoken123');

                expect(res.status).to.equal(401);
                expect(res.body.message).to.equal('Token inválido.');
            });

        });
    });
});

