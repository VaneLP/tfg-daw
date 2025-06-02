import { expect } from 'chai';
import { postOneApplication } from '../../controllers/applications.js';
import Pet from '../../models/pet.js';
import Application from '../../models/application.js';
import mongoose from 'mongoose';

describe('pruebas de logica del controlador para postoneapplication', () => {
    let req;
    let mockRes, resStatusCall, resJsonCall;
    let testPet, testUser;

    beforeEach(async () => {
        await Application.deleteMany({});

        testUser = { _id: new mongoose.Types.ObjectId().toString() };

        req = {
            params: {},
            body: { mensajeAdoptante: 'mensaje' },
            user: testUser
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
    });

    afterEach(async () => {
        if (testPet) {
            await Pet.findByIdAndDelete(testPet._id);
        }
    });

    it('deberia devolver 404 si la mascota no se encuentra en la bd', async () => {
        req.params.mascotaId = new mongoose.Types.ObjectId().toString();

        await postOneApplication(req, mockRes);

        expect(resStatusCall.args[0]).to.equal(404);
        expect(resJsonCall.args[0]).to.deep.include({ message: 'Mascota no encontrada.' });
    });

    it('deberia devolver 400 si la mascota no esta "disponible"', async () => {
        testPet = await new Pet({
            nombre: 'noDisponible',
            especie: 'perro',
            genero: 'Macho',
            descripcion: 'desc',
            refugioId: new mongoose.Types.ObjectId(),
            estadoAdopcion: 'Adoptado'
        }).save();

        req.params.mascotaId = testPet._id.toString();

        await postOneApplication(req, mockRes);

        expect(resStatusCall.args[0]).to.equal(400);
        expect(resJsonCall.args[0]).to.deep.include({ message: 'Mascota no disponible.' });
    });

    it('deberia devolver 201 y crear una solicitud en la bd si es elegible', async () => {
        testPet = await new Pet({
            nombre: 'mascotaDisponible',
            especie: 'gato',
            genero: 'Hembra',
            descripcion: 'desc',
            refugioId: new mongoose.Types.ObjectId(),
            estadoAdopcion: 'Disponible'
        }).save();

        req.params.mascotaId = testPet._id.toString();

        await postOneApplication(req, mockRes);

        expect(resStatusCall.args[0]).to.equal(201);
        expect(resJsonCall.args[0].message).to.equal('Solicitud enviada.');

        const createdApp = await Application.findById(resJsonCall.args[0].application._id);
        
        expect(createdApp).to.not.be.null;
        expect(createdApp.adoptanteId.toString()).to.equal(req.user._id);
        expect(createdApp.mascotaId.toString()).to.equal(req.params.mascotaId);
    });
});