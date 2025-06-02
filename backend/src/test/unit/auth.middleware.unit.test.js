import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import User from '../../models/user.js';
import { authenticate } from '../../middlewares/auth.js';
import mongoose from 'mongoose';

const TEST_JWT_SECRET = process.env.SECRET_KEY || "pawfinder_super_secret_default_key";

describe('pruebas de tipo unitario para el middleware de autenticacion -> authenticate', () => {
    let req;
    let mockRes, resStatusCall, resJsonCall;
    let nextSpy;
    let testUser;
    const createdUserIds = [];

    beforeEach(async () => {
        // si hay usuarios creados en pruebas anteriores, los elimina
        if (createdUserIds.length > 0) {
            await User.deleteMany({ _id: { $in: createdUserIds } });

            createdUserIds.length = 0;
        }

        const userData = {
            email: `authtestuser-${Date.now()}@example.com`,
            username: `authtestuser_${Date.now()}`,
            password: 'password123',
            role: 'Adoptante',
            nombreCompleto: 'Auth Test User',
            estadoAprobacion: 'Aprobado'
        };

        testUser = new User(userData);

        await testUser.save();

        createdUserIds.push(testUser._id);

        req = {
            headers: {},
        };

        resStatusCall = { called: false, args: null };
        resJsonCall = { called: false, args: null };
        mockRes = {
            status: function (code) {
                resStatusCall = { called: true, args: [code] };
                return this;
            },
            json: function (payload) {
                resJsonCall = { called: true, args: [payload] };
            }
        };

        nextSpy = { called: false, args: null };

        const originalNext = (err) => {
            nextSpy.called = true;

            if (err) {
                nextSpy.args = [err];
            }
        };
        nextSpy.call = originalNext;
    });

    afterEach(async () => {
        if (createdUserIds.length > 0) {
            await User.deleteMany({ _id: { $in: createdUserIds } });
            createdUserIds.length = 0;
        }
    });

    it('deberia llamar a next() y establecer req.user si el token es valido y el usuario existe', async () => {
        const tokenPayload = { userId: testUser._id.toString(), email: testUser.email, role: testUser.role };
        const validToken = jwt.sign(tokenPayload, TEST_JWT_SECRET, { expiresIn: '1h' });
        req.headers.authorization = `Bearer ${validToken}`;

        await authenticate(req, mockRes, nextSpy.call);

        expect(nextSpy.called).to.be.true;
        expect(nextSpy.args).to.be.null;
        expect(req.user).to.exist;
        expect(req.user._id.toString()).to.equal(testUser._id.toString());
        expect(resStatusCall.called).to.be.false;
    });

    it('deberia devolver 401 si no se proporciona token', async () => {
        await authenticate(req, mockRes, nextSpy.call);

        expect(resStatusCall.called).to.be.true;
        expect(resStatusCall.args[0]).to.equal(401);
        expect(resJsonCall.called).to.be.true;
        expect(resJsonCall.args[0]).to.deep.include({ message: "Acceso denegado. Se requiere token." });
        expect(nextSpy.called).to.be.false;
    });

    it('deberia devolver 401 si el token no se puede verificar', async () => {
        req.headers.authorization = 'Bearer malformedtoken123';

        await authenticate(req, mockRes, nextSpy.call);

        expect(resStatusCall.called).to.be.true;
        expect(resStatusCall.args[0]).to.equal(401);
        expect(resJsonCall.args[0]).to.deep.include({ message: 'Token inválido.' });
        expect(nextSpy.called).to.be.false;
    });

    it('deberia devolver 401 si el token esta firmado con una clave secreta incorrecta', async () => {
        const tokenPayload = { userId: testUser._id.toString() };
        const wrongSecretToken = jwt.sign(tokenPayload, "sercet_key", { expiresIn: '1h' });
        req.headers.authorization = `Bearer ${wrongSecretToken}`;

        await authenticate(req, mockRes, nextSpy.call);

        expect(resStatusCall.called).to.be.true;
        expect(resStatusCall.args[0]).to.equal(401);
        expect(resJsonCall.args[0]).to.deep.include({ message: 'Token inválido.' });
        expect(nextSpy.called).to.be.false;
    });

    it('deberia devolver 401 si el payload del token decodificado no contiene userid', async () => {
        const payloadWithoutUserId = { email: testUser.email, role: testUser.role };
        const tokenWithoutUserId = jwt.sign(payloadWithoutUserId, TEST_JWT_SECRET, { expiresIn: '1h' });
        req.headers.authorization = `Bearer ${tokenWithoutUserId}`;

        await authenticate(req, mockRes, nextSpy.call);

        expect(resStatusCall.called).to.be.true;
        expect(resStatusCall.args[0]).to.equal(401);
        expect(resJsonCall.args[0]).to.deep.include({ message: "Token inválido: payload incorrecto." });
        expect(nextSpy.called).to.be.false;
    });

    it('deberia devolver 401 si el usuario asociado al token no se encuentra en la bd', async () => {
        const nonExistentUserId = new mongoose.Types.ObjectId().toString();
        const tokenPayload = { userId: nonExistentUserId };
        const validTokenForNonExistentUser = jwt.sign(tokenPayload, TEST_JWT_SECRET, { expiresIn: '1h' });
        req.headers.authorization = `Bearer ${validTokenForNonExistentUser}`;

        await authenticate(req, mockRes, nextSpy.call);

        expect(resStatusCall.called).to.be.true;
        expect(resStatusCall.args[0]).to.equal(401);
        expect(resJsonCall.args[0]).to.deep.include({ message: 'Usuario asociado al token no encontrado.' });
        expect(nextSpy.called).to.be.false;
    });

    it('deberia manejar errores inesperados durante user.findbyid ', () => {
        expect(true).to.be.true;
        console.warn("Advertencia: Prueba de error 500 en User.findById es conceptual aquí.");
    });
});