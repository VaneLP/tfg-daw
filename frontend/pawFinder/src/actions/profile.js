import { Auth } from '../service/auth-service.js';
import { apiService } from '../service/api-service.js';
import { User } from '../model/User.class.js';
import { geocodeAddressWithNominatim } from '../service/geocoding-service.js';

// DOM
const profileForm = document.getElementById('profileUpdateForm');
const passwordForm = document.getElementById('passwordChangeForm');
const refugioForm = document.getElementById('refugioUpdateForm');
const refugioNavLink = document.getElementById('refugioNavLink');
const firstNameInput = document.getElementById('profFirstName');
const lastNameInput = document.getElementById('profLastName');
const emailInput = document.getElementById('profEmail');
const usernameInput = document.getElementById('profUsername');
const phoneInput = document.getElementById('profPhone');
const refugioNameInput = document.getElementById('profRefugioName');
const cifInput = document.getElementById('profCifNif');
const refugioAddressInput = document.getElementById('profAddressRefugioInput');
const descriptionInput = document.getElementById('profDescription');
const userNameDisplaySide = document.getElementById('profileUserName');
const userEmailDisplaySide = document.getElementById('profileUserEmail');
const userAvatarDisplaySide = document.getElementById('profileUserAvatar');
const avatarInputFile = document.getElementById('profAvatarInput');
const profileMessage = document.getElementById('profileMessage');
const refugioProfileMessage = document.getElementById('refugioProfileMessage');
const passwordMessage = document.getElementById('passwordMessage');

let newAvatarBase64 = null;

/**
 * funcion para mostrar un mensaje
 * @param {HTMLElement|null} element - el elemento donde mostrar el mensaje
 * @param {string} message - el mensaje a mostrar
 * @param {boolean} [isError=false] - verdadero si es un mensaje de error falso para exito
 */
function showMessage(element, message, isError = false) {
    // si el elemento existe
    if (element) {
        element.textContent = message;
        element.className = `alert alert-dismissible mt-3 ${isError ? 'alert-danger' : 'alert-success'}`;

        let closeButton = element.querySelector('.btn-close');

        // si no existe un boton de cierre
        if (!closeButton) {
            // crear boton 
            closeButton = document.createElement('button');
            closeButton.type = 'button'; closeButton.className = 'btn-close';
            closeButton.setAttribute('data-bs-dismiss', 'alert');
            closeButton.setAttribute('aria-label', 'Close');

            element.insertBefore(closeButton, element.firstChild);
        }

        element.classList.remove('d-none');

    // si el elemento no existe mostrar una alerta
    } else {
        alert((isError ? "Error: " : "Éxito: ") + message);
    }
}

/**
 * funcion para limpiar un mensaje
 * @param {HTMLElement|null} element - el elemento del mensaje a limpiar
 */
function clearMessage(element) {
    // si el elemento existe
    if (element) {
        const closeButton = element.querySelector('.btn-close');

        // si existe el boton de cierre
        if (closeButton) {
            //eliminarlo
            closeButton.remove();
        }

        element.textContent = '';
        element.className = 'alert mt-3 d-none';
    }
}

/**
 * funcion para establecer el estado de carga de un boton
 * @param {HTMLButtonElement|null} button - el boton a gestionar
 * @param {boolean} isLoading - verdadero para mostrar estado de carga falso para estado normal
 */
function setButtonLoading(button, isLoading) {
    // si el boton no existe 
    if (!button) {
        return;
    }

    const originalText = button.dataset.originalText || button.textContent.replace('Guardando...', '').replace('Procesando...', '').trim() || 'Guardar Cambios';

    // si isLoading es verdadero
    if (isLoading) {
        // si el texto original no se ha guardado en dataset
        if (button.dataset.originalText === undefined) {
            // guardar 
            button.dataset.originalText = originalText;
        }

        button.disabled = true;

        const spinner = document.createElement('span');
        spinner.className = 'spinner-border spinner-border-sm me-2';
        spinner.setAttribute('role', 'status'); spinner.setAttribute('aria-hidden', 'true');

        button.replaceChildren(spinner, document.createTextNode(' Guardando...'));

    // si isLoading es falso
    } else {
        button.disabled = false;
        button.replaceChildren(document.createTextNode(originalText));

        delete button.dataset.originalText;
    }
}

/**
 * funcion para poblar los formularios con datos del usuario
 * @param {User} userInstance - la instancia de la clase user con los datos
 */
function populateForms(userInstance) {
    // si no hay instancia de usuario o no es de tipo user 
    if (!userInstance || !(userInstance instanceof User)) {
        return;
    }

    // si existe el elemento para mostrar nombre de usuario en barra lateral
    if (userNameDisplaySide) {
        userNameDisplaySide.textContent = userInstance.displayName;
    }

    // si existe el elemento para mostrar email en barra lateral
    if (userEmailDisplaySide) {
        userEmailDisplaySide.textContent = userInstance.email;
    }

    // si existe el elemento para mostrar avatar en barra lateral
    if (userAvatarDisplaySide) {
        userAvatarDisplaySide.src = userInstance.avatar || '';
    }

    const nameParts = userInstance.nombreCompleto?.split(' ') || [];

    // si existe el campo nombre
    if (firstNameInput) {
        firstNameInput.value = nameParts[0] || '';
    }

    // si existe el campo apellidos
    if (lastNameInput) {
        lastNameInput.value = nameParts.slice(1).join(' ') || '';
    }

    // si existe el campo email
    if (emailInput) {
        emailInput.value = userInstance.email || '';
        emailInput.disabled = false;
    }

    // si existe el campo  nombre de usuario
    if (usernameInput) {
        usernameInput.value = userInstance.username || '';
        usernameInput.disabled = userInstance.isRefugio();
    }

    // si existe el campo telefono
    if (phoneInput) {
        phoneInput.value = userInstance.telefono || '';
    }

    // si el usuario es un refugio
    if (userInstance.isRefugio()) {
        refugioNavLink?.classList.remove('d-none');

        // si existe el formulario de refugio
        if (refugioForm) {
            // mostrar el formulario de refugio
            refugioForm.style.display = 'block';
        }

        // si existe el campo nombre del refugio
        if (refugioNameInput) {
            refugioNameInput.value = userInstance.nombreRefugio || '';
        }

        // si existe el campo cif/nif
        if (cifInput) {
            cifInput.value = userInstance.CIF_NIF || '';
        }

        // si existe el campo direccion del refugio
        if (refugioAddressInput) {
            refugioAddressInput.value = userInstance.direccionCompleta || '';
        }

        // si existe el campo descripcion del refugio
        if (descriptionInput) {
            descriptionInput.value = userInstance.descripcionRefugio || '';
        }

    // si el usuario no es un refugio
    } else {
        refugioNavLink?.classList.add('d-none');

        // si existe el formulario de refugio
        if (refugioForm) {
            // ocultar el formulario de refugio
            refugioForm.style.display = 'none';
        }
    }
}

//listener avatar 
avatarInputFile?.addEventListener('change', (event) => {
    // obtener el archivo seleccionado
    const file = event.target.files[0];

    // si hay un archivo y existe el elemento para mostrar avatar
    if (file && userAvatarDisplaySide) {
        const maxSizeMB = 2;

        // si el tamano del archivo supera el maximo permitido
        if (file.size > maxSizeMB * 1024 * 1024) {
            // error
            showMessage(profileMessage, `La imagen es demasiado grande. El tamaño máximo es de ${maxSizeMB}MB.`, true);

            avatarInputFile.value = "";
            newAvatarBase64 = null;

            const currentUser = Auth.getCurrentUser();

            // si hay usuario actual y existe el elemento para mostrar avatar
            if (currentUser && userAvatarDisplaySide) {
                userAvatarDisplaySide.src = currentUser.avatar || '';
            }

            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            // si existe el elemento para mostrar avatar
            if (userAvatarDisplaySide) {
                userAvatarDisplaySide.src = e.target.result;
            }

            newAvatarBase64 = e.target.result;
        }

        reader.readAsDataURL(file);
    }
});

// listener formulario de perfil 
profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    clearMessage(profileMessage);
    const submitButton = profileForm.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);

    const formData = new FormData(profileForm);
    const profileDataToSubmit = {};
    const currentUserDataFromStorage = Auth.getCurrentUser();

    // si no se encuentran datos del usuario actual
    if (!currentUserDataFromStorage) {
        // error
        showMessage(profileMessage, "Error: Sesión no encontrada. Recarga la página.", true);
        setButtonLoading(submitButton, false);
        return;
    }

    const formFirstName = formData.get('firstName')?.trim();
    const formLastName = formData.get('lastName')?.trim();
    const currentDBFullName = currentUserDataFromStorage.nombreCompleto || '';

    // si se proporciono nombre o apellidos
    if (formFirstName !== undefined || formLastName !== undefined) {
        const newConstructedFullName = `${formFirstName || ''} ${formLastName || ''}`.trim();

        // si el nuevo nombre completo es diferente al actual
        if (newConstructedFullName !== currentDBFullName) {
            // añadir nombrecompleto
            profileDataToSubmit.nombreCompleto = newConstructedFullName;
        }
    }

    // procesar nombre de usuario solo si no es un refugio
    if (currentUserDataFromStorage.role !== 'Refugio') {
        const formUsername = formData.get('username')?.trim();
        const currentDBUsername = currentUserDataFromStorage.username || '';

        // si se proporciono nombre de usuario y es diferente al actual
        if (formUsername !== undefined && formUsername !== currentDBUsername) {
            // añadir username
            profileDataToSubmit.username = formUsername;
        }
    }

    const formEmail = emailInput?.value?.trim().toLowerCase();
    const currentDBEmailLower = currentUserDataFromStorage.email?.toLowerCase() || '';

    // si se proporciono email y es diferente al actual
    if (formEmail && formEmail !== currentDBEmailLower) {
        // añadir email
        profileDataToSubmit.email = formEmail;
    }

    const formTelefono = formData.get('telefono')?.trim();
    const currentDBTelefono = currentUserDataFromStorage.telefono || '';

    // si se proporciono telefono y es diferente al actual
    if (formTelefono !== undefined && formTelefono !== currentDBTelefono) {
        // añadir telefono
        profileDataToSubmit.telefono = formTelefono;
    }

    // si se selecciono un nuevo avatar
    if (newAvatarBase64) {
        // añadir avatar
        profileDataToSubmit.avatar = newAvatarBase64;
    }

    // si no hay cambios para guardar
    if (Object.keys(profileDataToSubmit).length === 0) {
        // mensaje
        showMessage(profileMessage, "No hay cambios para guardar.", false);
        setButtonLoading(submitButton, false);
        return;
    }

    try {
        const result = await apiService.updateMyProfile(profileDataToSubmit);
        const updatedUserDataFromAPI = result.data || result.user;

        // si la respuesta no contiene datos de usuario validos
        if (!updatedUserDataFromAPI || !updatedUserDataFromAPI._id) {            
            const refreshedUserData = await Auth.checkToken();

            // si se obtuvieron datos refrescados
            if (refreshedUserData) {
                // actualizar el usuario en el almacenamiento local
                Auth.updateCurrentUser(refreshedUserData);
                populateForms(new User(refreshedUserData));
            }

        // si la respuesta contiene datos de usuario validos
        } else {
            showMessage(profileMessage, result.message || "Perfil actualizado.", false);

            Auth.updateCurrentUser(updatedUserDataFromAPI);

            const updatedUserAsInstance = new User(updatedUserDataFromAPI);

            populateForms(updatedUserAsInstance);
        }

        newAvatarBase64 = null;
        const profileUpdatedEvent = new CustomEvent('profileUpdated');
        window.dispatchEvent(profileUpdatedEvent);

    } catch (error) {
        //error
        showMessage(profileMessage, `Error al actualizar perfil: ${error.message}`, true);
    } finally {
        // quitar estado de carga del boton
        setButtonLoading(submitButton, false);
    }
});

// listener al formulario de refugio 
refugioForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    clearMessage(refugioProfileMessage);

    const submitButton = refugioForm.querySelector('button[type="submit"]');

    setButtonLoading(submitButton, true);

    const formData = new FormData(refugioForm);
    const refugioDataToSubmit = {};
    const currentUserDataFromStorage = Auth.getCurrentUser();

    // si no se encuentran datos del usuario actual
    if (!currentUserDataFromStorage) {
        // error
        showMessage(refugioProfileMessage, "Error: Sesión no encontrada.", true);
        setButtonLoading(submitButton, false); return;
    }

    const currentUserInstance = new User(currentUserDataFromStorage);

    // si el usuario actual no es un refugio
    if (!currentUserInstance.isRefugio()) {
        //error
        showMessage(refugioProfileMessage, "Error: Acción no permitida. Debes ser un refugio.", true);
        setButtonLoading(submitButton, false); return;
    }

    const nombreRefugio = formData.get('nombreRefugio')?.trim();

    // si se proporciono nombre de refugio y es diferente al actual
    if (nombreRefugio !== undefined && nombreRefugio !== (currentUserInstance.nombreRefugio || '')) {
        // añadir nombrerefugio
        refugioDataToSubmit.nombreRefugio = nombreRefugio;
    }

    const cifNif = formData.get('CIF_NIF')?.trim();

    // si se proporciono cif/nif y es diferente al actual
    if (cifNif !== undefined && cifNif !== (currentUserInstance.CIF_NIF || '')) {
        // añadir cif_nif
        refugioDataToSubmit.CIF_NIF = cifNif;
    }

    const descripcion = formData.get('descripcionRefugio')?.trim();

    // si se proporciono descripcion y es diferente a la actual
    if (descripcion !== undefined && descripcion !== (currentUserInstance.descripcionRefugio || '')) {
        // añadir descripcionrefugio
        refugioDataToSubmit.descripcionRefugio = descripcion;
    }

    const direccionCompleta = formData.get('direccionCompletaRefugio')?.trim();

    // si se proporciono direccion completa y es diferente a la actual
    if (direccionCompleta && direccionCompleta !== (currentUserInstance.direccionCompleta || '')) {
        // añadir direccioncompleta
        refugioDataToSubmit.direccionCompleta = direccionCompleta;

        // geocodificar la nueva direccion
        const coords = await geocodeAddressWithNominatim(direccionCompleta);

        // si se obtuvieron coordenadas validas
        if (coords && typeof coords.lat === 'number' && typeof coords.lon === 'number') {
            // añadir coordenadas 
            refugioDataToSubmit.coordenadas = { lat: coords.lat, lon: coords.lon };
        }

    // si se proporciono direccion completa pero no hay coordenadas actuales y la direccion es la misma
    } else if (direccionCompleta && !currentUserInstance.coordenadas && currentUserInstance.direccionCompleta === direccionCompleta) {
        // geocodificar la direccion
        const coords = await geocodeAddressWithNominatim(direccionCompleta);
        // si se obtuvieron coordenadas añadirlas
        if (coords) {
            refugioDataToSubmit.coordenadas = coords;
        }
    }

    // si no hay cambios para guardar
    if (Object.keys(refugioDataToSubmit).length === 0) {
        showMessage(refugioProfileMessage, "No hay cambios para guardar.", false);
        setButtonLoading(submitButton, false); return;
    }

    try {
        const result = await apiService.updateMyProfile(refugioDataToSubmit);
        const updatedUserDataFromAPI = result.data || result.user;

        // si la respuesta no contiene datos de usuario validos
        if (!updatedUserDataFromAPI || !updatedUserDataFromAPI._id) {
            // error
            throw new Error(result?.message || "Respuesta inválida del servidor.");
        }

        showMessage(refugioProfileMessage, result.message || "Detalles de protectora actualizados.", false);

        Auth.updateCurrentUser(updatedUserDataFromAPI);

        const updatedUserAsInstance = new User(updatedUserDataFromAPI);

        populateForms(updatedUserAsInstance);

        const profileUpdatedEvent = new CustomEvent('profileUpdated');
        window.dispatchEvent(profileUpdatedEvent);

    } catch (error) {
        // error
        showMessage(refugioProfileMessage, `Error: ${error.message}`, true);
    } finally {
        // quitar estado de carga del boton
        setButtonLoading(submitButton, false);
    }
});

// listener al formulario de contraseña
passwordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    clearMessage(passwordMessage);

    const submitButton = passwordForm.querySelector('button[type="submit"]');

    setButtonLoading(submitButton, true);

    const currentPassword = passwordForm.currentPassword.value;
    const newPassword = passwordForm.newPassword.value;
    const confirm = passwordForm.confirmNewPassword.value;

    // si algun campo de contraseña esta vacio
    if (!currentPassword || !newPassword || !confirm) {
        // error
        showMessage(passwordMessage, "Todos los campos de contraseña son requeridos.", true);
        setButtonLoading(submitButton, false); return;
    }

    // si la nueva contraseña y su confirmacion no coinciden
    if (newPassword !== confirm) {
        //error
        showMessage(passwordMessage, "Las nuevas contraseñas no coinciden.", true);
        setButtonLoading(submitButton, false); return;
    }

    // si la nueva contraseña tiene menos de 8 caracteres
    if (newPassword.length < 8) {
        // error
        showMessage(passwordMessage, "La nueva contraseña debe tener al menos 6 caracteres.", true);
        setButtonLoading(submitButton, false); return;
    }

    try {

    } catch (error) {
        showMessage(passwordMessage, `Error: ${error.message}`, true);
    } finally {
        // quitar estado de carga del boton
        setButtonLoading(submitButton, false);
    }
});

// listener para la ventana
window.addEventListener('load', async () => {
    try {
        const currentUserData = await Auth.checkToken();

        // si no se obtuvieron datos de usuario o no tienen id
        if (!currentUserData || !currentUserData._id) {
            // error
            throw new Error("Usuario no autenticado o token inválido.");
        }

        const userInstance = new User(currentUserData);

        populateForms(userInstance);

    } catch (error) {
        Auth.logout();

        window.location.assign('/login.html');
    }
});