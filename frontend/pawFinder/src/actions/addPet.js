import { apiService } from '../service/api-service.js';
import { Auth } from '../service/auth-service.js';

// DOM
const addPetForm = document.getElementById('addPetForm');
const imgPreview = document.getElementById('imgPreview');
const errorDiv = document.getElementById('addPetError');
const fotosInputElement = document.getElementById('fotosInput');
const pageTitlePet = document.getElementById('pageTitlePet');
const mascotaIdInput = document.getElementById('mascotaId');
const submitButtonPet = addPetForm?.querySelector('button[type="submit"]');

let currentmascotaId = null;
let currentImageSrc = null;

/**
 * funcion para mostrar un mensaje de error
 * @param {string} message - el mensaje de error a mostrar
 */
function displayError(message) {
    // si existe el div de errores
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');

    // si no existe mostrar una alerta nativa
    } else {
        alert("Error: " + message);
    }
}


// funcion para limpiar errores y estado de validacion
function clearError() {
    errorDiv?.classList.add('d-none');
    addPetForm?.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

/**
 * funcion para establecer el estado de carga de un boton
 * @param {HTMLButtonElement|null} button - el boton a gestionar
 * @param {boolean} isLoading - verdadero para mostrar estado de carga falso para estado normal
 * @param {Node[]} originalContentNodes - nodos del contenido original del boton para restaurar
 */
function setButtonLoading(button, isLoading, originalContentNodes) {
    // si el boton no existe 
    if (!button) {
        return;
    }

    // si isLoading es verdadero
    if (isLoading) {
        button.disabled = true;

        // crear un elemento span para el spinner
        const spinner = document.createElement('span');
        spinner.className = 'spinner-border spinner-border-sm me-2';
        spinner.setAttribute('role', 'status');
        spinner.setAttribute('aria-hidden', 'true');

        button.replaceChildren(spinner, document.createTextNode(' Guardando...'));

    // si isLoading es falso 
    } else {
        button.disabled = false;
        button.replaceChildren(...originalContentNodes);
    }
}

// añadir event listener al campo de entrada de fotos para el evento change
fotosInputElement?.addEventListener('change', (event) => {
    const file = event.target.files[0];

    // si hay un archivo y existe el elemento de previsualizacion de imagen
    if (file && imgPreview) {
        const reader = new FileReader();

        reader.onload = (e) => {
            imgPreview.src = e.target.result;
            currentImageSrc = e.target.result;
        }

        reader.readAsDataURL(file);

    // si no hay archivo y existe el elemento de previsualizacion
    } else if (imgPreview) {
        imgPreview.src = '';
        currentImageSrc = null;
    }
});

// listener  formulario de añadir/editar mascota 
addPetForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    clearError();

    let isValid = true;

    // iterar sobre todos los campos requeridos del formulario
    addPetForm.querySelectorAll('[required]').forEach(input => {
        // si el valor del campo (quitando espacios) esta vacio
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;

        // si el campo tiene valor
        } else {
            input.classList.remove('is-invalid');
        }
    });

    // si el formulario no es valido
    if (!isValid) {
        displayError("Por favor, completa todos los campos obligatorios (*).");
        return;
    }

    const formData = new FormData(addPetForm);
    const petData = Object.fromEntries(formData.entries());

    delete petData.fotosInput;

    // si no hay un currentmascotaid eliminar la propiedad mascotaid
    if (!currentmascotaId) {
        delete petData.mascotaId;
    }

    // si hay una imagen actual y es base64 
    if (currentImageSrc && currentImageSrc.startsWith('data:image')) {
        petData.fotos = [currentImageSrc];

    // si hay una imagen actual pero no es base64 (es una url de una imagen existente)
    } else if (currentImageSrc) {
        delete petData.fotos;

    // si no hay imagen actual (se borro o no se selecciono ninguna)
    } else {
        petData.fotos = [];
    }

    const originalButtonContent = Array.from(submitButtonPet.childNodes);

    setButtonLoading(submitButtonPet, true, []); 

    try {
        let result;
        const mascotaIdValue = mascotaIdInput.value;

        // si hay un valor de id de mascota 
        if (mascotaIdValue) {
            result = await apiService.updatePet(mascotaIdValue, petData);

            alert("¡Mascota actualizada correctamente!");

            window.location.assign(`/animal_detail.html?id=${mascotaIdValue}`);

        // si no hay valor de id de mascota
        } else {
            result = await apiService.createPet(petData);

            alert("¡Mascota añadida correctamente!");

            window.location.assign('/animals.html');
        }

    } catch (error) {
        displayError(`Error al guardar: ${error.message}`);

        setButtonLoading(submitButtonPet, false, originalButtonContent);
    }
});


// funcion asincrona para cargar datos de mascota para edicion
async function loadPetDataForEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    currentmascotaId = urlParams.get('id');

    const isLoadingEdit = !!currentmascotaId;

    // si existe el elemento para el titulo de la pagina
    if (pageTitlePet) {
        pageTitlePet.textContent = isLoadingEdit ? "Editar Mascota" : "Añadir Nueva Mascota";
    }

    // si existe el boton de envio
    if (submitButtonPet) {
        submitButtonPet.textContent = isLoadingEdit ? "Guardar Cambios" : "Guardar Mascota";
    }

    // si se esta en modo edicion
    if (isLoadingEdit) {
        addPetForm?.classList.add('placeholder-glow');
        addPetForm?.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);

        try {
            const pet = await apiService.getPetById(currentmascotaId);

            // si no se encuentra la mascota lanzar error
            if (!pet) {
                throw new Error("Mascota no encontrada");
            }

            const currentUser = Auth.getCurrentUser();

            // verificar permisos para editar (ser propietario del refugio de la mascota o admin)
            if (!currentUser || (currentUser._id !== pet.refugioId?._id && currentUser.role !== 'Admin')) {
                throw new Error("No tienes permiso para editar esta mascota.");
            }

            // si existe el campo oculto para el id establecer su valor
            if (mascotaIdInput) {
                mascotaIdInput.value = pet._id || '';
            }

            // rellenar los campos del formulario con los datos de la mascota
            if (addPetForm.nombre) {
                addPetForm.nombre.value = pet.nombre || '';
            }

            if (addPetForm.especie) {
                addPetForm.especie.value = pet.especie || '';
            }

            if (addPetForm.raza) {
                addPetForm.raza.value = pet.raza || '';
            }

            if (addPetForm.edad) {
                addPetForm.edad.value = pet.edad || '';
            }

            if (addPetForm.genero) {
                addPetForm.genero.value = pet.genero || '';
            }

            if (addPetForm.tamano) {
                addPetForm.tamano.value = pet.tamano || '';
            }

            if (addPetForm.descripcion) {
                addPetForm.descripcion.value = pet.descripcion || '';
            }

            // si la mascota tiene fotos y existe el elemento de previsualizacion
            if (pet.fotos && pet.fotos.length > 0 && imgPreview) {
                imgPreview.src = pet.fotos[0];
                currentImageSrc = pet.fotos[0];

            // si no tiene fotos y existe el elemento de previsualizacion
            } else if (imgPreview) {
                imgPreview.src = '';
                currentImageSrc = null;
            }

        } catch (error) {
            displayError(`No se pudo cargar la mascota: ${error.message}`);

            // deshabilitar el boton de envio si existe
            if (submitButtonPet) {
                submitButtonPet.disabled = true;
            }

            // si el error es de permiso o mascota no encontrada mostrar alerta y redirigir
            if (error.message.includes("permiso") || error.message.includes("encontrada")) {
                alert("Error: " + error.message);
                setTimeout(() => window.location.assign('/animals.html'), 3000);
            }
        } finally {
            addPetForm?.classList.remove('placeholder-glow');
            addPetForm?.querySelectorAll('input, select, textarea').forEach(el => el.disabled = false);

            // si existe el boton de envio y no hay un mensaje de error activo habilitarlo
            if (submitButtonPet && !errorDiv?.classList.contains('alert-danger')) {
                submitButtonPet.disabled = false;
            }
        }

    // si no se esta en modo edicion 
    } else {
        addPetForm?.querySelectorAll('input, select, textarea').forEach(el => el.disabled = false);

        // asegurar que el boton de envio este habilitado
        if (submitButtonPet) {
            submitButtonPet.disabled = false;
        }
    }
}

// listener
window.addEventListener('load', async () => {
    // si no existe el formulario 
    if (!addPetForm) {
        return;
    }

    try {
        const user = await Auth.checkToken();

        // si no hay usuario o no tiene rol de refugio o admin
        if (!user || !['Refugio', 'Admin'].includes(user.role)) {
            throw new Error("Acceso denegado. Debes ser un Refugio o Administrador.");
        }

        // si es un refugio verificar que su cuenta este aprobada
        if (user.role === 'Refugio' && user.estadoAprobacion !== 'Aprobado') {
            throw new Error("Tu cuenta de Refugio aún no ha sido aprobada para gestionar mascotas.");
        }

        loadPetDataForEdit();

    } catch (error) {
        Auth.logout();

        alert("Error: " + error.message + ". Serás redirigido al login.");
        
        window.location.assign('/login.html');
    }
});