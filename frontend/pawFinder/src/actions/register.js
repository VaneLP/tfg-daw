import { Auth } from '../service/auth-service.js';
import { geocodeAddressWithNominatim } from '../service/geocoding-service.js';

const registerUserForm = document.getElementById('registerUserForm');
const registerProtectiveForm = document.getElementById('registerProtectiveForm');

/**
 * funcion para validar el formato del email
 * @param {string} email - el correo electronico a validar
 * @returns {boolean} - verdadero si el email es valido falso en caso contrario
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
}

/**
 * funcion para validar el formato del telefono
 * @param {string} phone - el numero de telefono a validar
 * @returns {boolean} - verdadero si el telefono es valido falso en caso contrario
 */
function isValidPhone(phone) {
    const phoneCleaned = phone.replace(/\s+/g, '');
    const phoneRegex = /^[6-9]\d{8}$/;

    return phoneRegex.test(phoneCleaned);
}

/**
 * funcion para validar el formato del cif/nif
 * @param {string} cifNif - el cif o nif a validar
 * @returns {boolean} - verdadero si el cif/nif es valido o esta vacio falso en caso contrario
 */
function isValidCifNif(cifNif) {
    if (!cifNif || cifNif.length === 0) {
        return true;
    }

    const cifNifCleaned = cifNif.toUpperCase().replace(/[\s-]/g, '');

    const cifNifRegex = /^[A-HJ-NP-SUVW][0-9]{7}[0-9A-J]$|^[0-9]{8}[A-Z]$|^[KLMXYZ][0-9]{7}[A-Z]$/;

    const simpleRegex = /^[A-Z0-9]{9}$/;

    return simpleRegex.test(cifNifCleaned);
}


/**
 * funcion para validar la fortaleza de la contraseña
 * @param {string} password - la contrasena a validar
 * @returns {boolean} - verdadero si la contrasena es valida falso en caso contrario
 */
function isValidPassword(password) {
    if (!password || password.length < 8) {
        return false;
    }

    /* Expresión regular:
    (?=.*[a-z]) -> al menos una minuscula
    (?=.*[A-Z]) -> al menos una mayuscula
    (?=.*\d) -> al menos un digito
    (?=.*[@$!%+*?&._-]) -> al menos un caracter especial de la lista
    [A-Za-z\d@$+!%*?&._-]{8,} -> longitud minima de 8, conteniendo solo los caracteres permitidos
    */

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%+*?&._-])[A-Za-z\d@$+!%*?&._-]{8,}$/;
    return passwordRegex.test(password);
    //return password && password.length >= 1;
}

/**
 * funcion para mostrar un mensaje de error en el formulario
 * @param {HTMLElement} formElement - el elemento del formulario donde mostrar el error
 * @param {string} message - el mensaje de error a mostrar
 */
function displayRegisterError(formElement, message) {
    // si el elemento del formulario no existe 
    if (!formElement) {
        return;
    }

    let errorDiv = formElement.querySelector('.register-error');

    // si no existe un div de error
    if (!errorDiv) {
        // crear un nuevo elemento div
        errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3 register-error';
        errorDiv.setAttribute('role', 'alert');

        formElement.appendChild(errorDiv);
    }

    errorDiv.textContent = message;
    //hacer visible el error
    errorDiv.classList.remove('d-none');
}

/**
 * funcion para limpiar el estado del formulari
 * @param {HTMLElement} formElement - el elemento del formulario a limpiar
 */
function clearRegisterFormState(formElement) {
    // si el elemento del formulario no existe 
    if (!formElement) {
        return;
    }

    const errorDiv = formElement.querySelector('.register-error');

    // si existe el div de error
    if (errorDiv) {
        //limpiamos y escondemos
        errorDiv.textContent = '';
        errorDiv.classList.add('d-none');
    }

    formElement.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    formElement.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
}

/**
 * funcion para establecer el estado de carga del boton de envio
 * @param {HTMLFormElement} form - el formulario que contiene el boton
 * @param {boolean} isLoading - verdadero para mostrar estado de carga falso para estado normal
 */
function setSubmitLoading(form, isLoading) {
    const button = form?.querySelector('button[type="submit"]');

    // si no se encuentra el boton
    if (!button) {
        return;
    }

    const originalText = button.dataset.originalText || button.textContent || 'Registrar';

    // si isLoading es verdadero
    if (isLoading) {
        //desabilitamos
        button.disabled = true;

        // si el texto original no se ha guardado en dataset
        if (button.dataset.originalText === undefined) {
            //guardamos
            button.dataset.originalText = originalText;
        }

        //crear spinner
        const spinner = document.createElement('span');

        spinner.className = 'spinner-border spinner-border-sm me-2';
        spinner.setAttribute('role', 'status');
        spinner.setAttribute('aria-hidden', 'true');

        button.replaceChildren(spinner, document.createTextNode(' Registrando...'));

        // si isLoading es falso
    } else {
        //habilitar boton
        button.disabled = false;
        button.replaceChildren(document.createTextNode(originalText));
    }
}

/**
 * funcion asincrona para manejar el envio del formulario de registro
 * @param {Event} event - el evento de envio del formulario
 */
async function handleRegisterSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const isProtectiveForm = form.id === 'registerProtectiveForm';

    clearRegisterFormState(form);

    let isValidOverall = true;
    let firstErrorMessage = "";

    const formData = new FormData(form);
    const userData = Object.fromEntries(formData.entries());

    // iterar sobre todos los campos del formulario con atributo name
    form.querySelectorAll('input[name], textarea[name], select[name]').forEach(field => {
        field.classList.remove('is-invalid', 'is-valid');

        let fieldValid = true;
        const value = field.type === 'checkbox' ? field.checked : field.value.trim();
        const name = field.name;

        // si el campo es requerido
        if (field.hasAttribute('required')) {
            // si es un checkbox y no esta marcado
            if (field.type === 'checkbox' && !value) {
                // el campo no es valido
                fieldValid = false;

                // si aun no hay un primer mensaje de error
                if (!firstErrorMessage) {
                    //mensaje
                    firstErrorMessage = "Debes aceptar los términos.";
                }

                // si no es checkbox y esta vacio
            } else if (field.type !== 'checkbox' && !value) {
                fieldValid = false;

                // si aun no hay un primer mensaje de error
                if (!firstErrorMessage) {
                    firstErrorMessage = `El campo '${field.previousElementSibling?.textContent || name}' es obligatorio.`;
                }
            }
        }

        // validacion para el campo email
        if (name === 'email' && value && !isValidEmail(field.value)) {
            fieldValid = false;

            // si aun no hay un primer mensaje de error
            if (!firstErrorMessage) {
                firstErrorMessage = "Introduce un formato de email válido.";
            }
        }

        // validacion para el campo telefono
        if (name === 'telefono' && value && !isValidPhone(value)) {
            fieldValid = false;

            // si aun no hay un primer mensaje de error
            if (!firstErrorMessage) {
                firstErrorMessage = "El formato del teléfono no es válido (ej: 600112233, 9 dígitos).";
            }
        }

        // validacion para el campo cif/nif
        if (name === 'CIF_NIF' && value && !isValidCifNif(value)) {
            fieldValid = false;

            // si aun no hay un primer mensaje de error
            if (!firstErrorMessage) {
                firstErrorMessage = "El CIF/NIF debe tener 9 caracteres alfanuméricos.";
            }
        }

        // validacion para el campo password
        if (name === 'password' && value) {
            if (!isValidPassword(value)) {
                fieldValid = false;

                // si aun no hay un primer mensaje de error
                if (!firstErrorMessage) {
                    firstErrorMessage = "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un carácter especial.";
                }
            }
        }

        // validacion para el campo de confirmacion de contrasena
        if (name === 'passwordConfirm' && value) {
            const passwordField = form.querySelector('input[name="password"]');

            if (passwordField && passwordField.value !== field.value) {
                fieldValid = false;

                // si aun no hay un primer mensaje de error
                if (!firstErrorMessage) {
                    firstErrorMessage = "Las contraseñas no coinciden.";
                }

                passwordField?.classList.add('is-invalid');
            }
        }

        // validacion  para el campo username
        if (name === 'username' && value && value.length < 3) {
            fieldValid = false;

            // si aun no hay un primer mensaje de error
            if (!firstErrorMessage) {
                firstErrorMessage = "El nombre de usuario debe tener al menos 3 caracteres.";
            }
        }

        // si el campo no es valido 
        if (!fieldValid) {
            field.classList.add('is-invalid');
            isValidOverall = false;

            // si el campo es valido y tiene valor
        } else if (value || (field.type === 'checkbox' && value)) {
            field.classList.add('is-valid');
        }
    });

    // si el formulario general no es valido
    if (!isValidOverall) {
        displayRegisterError(form, firstErrorMessage || "Por favor, revisa los campos con errores.");
        return;
    }

    // si es el formulario de protectora y se proporciono una direccion completa
    if (isProtectiveForm && userData.direccionCompleta && userData.direccionCompleta.trim() !== '') {
        const coords = await geocodeAddressWithNominatim(userData.direccionCompleta);

        // si se obtuvieron coordenadas validas
        if (coords && typeof coords.lat === 'number' && typeof coords.lon === 'number') {
            userData.coordenadas = { lat: coords.lat, lon: coords.lon };
        }
    }

    // si existen los campos firstname y lastname
    if (userData.firstName && userData.lastName) {
        userData.nombreCompleto = `${userData.firstName.trim()} ${userData.lastName.trim()}`.trim();
        delete userData.firstName;
        delete userData.lastName;
    }

    delete userData.passwordConfirm;
    delete userData.termsCheck;
    delete userData.termsCheckProtective;

    setSubmitLoading(form, true);

    try {
        const result = await Auth.register(userData);

        let successMessage = result.message || "¡Registro completado!";

        // si es formulario de protectora y no se pudieron obtener coordenadas pero se dio direccion
        if (isProtectiveForm && !userData.coordenadas && userData.direccionCompleta) {
            successMessage += " No se pudo verificar la dirección en el mapa, podrás actualizarla desde tu perfil.";
        }

        alert(successMessage + " Serás redirigido al login.");
        window.location.assign('/login.html');

    } catch (error) {
        displayRegisterError(form, error.message || "Error desconocido durante el registro.");

        // si el error indica que el email ya existe
        if (error.message?.toLowerCase().includes('email ya existe')) {
            form.querySelector('input[name="email"]')?.classList.add('is-invalid');
        }

        // si el error indica que el nombre de usuario ya existe
        if (error.message?.toLowerCase().includes('nombre de usuario ya existe')) {
            form.querySelector('input[name="username"]')?.classList.add('is-invalid');
        }

        setSubmitLoading(form, false);
    }
}

// si existe el formulario de registro de usuario
if (registerUserForm) {
    registerUserForm.addEventListener('submit', handleRegisterSubmit);
}

// si existe el formulario de registro de protectora
if (registerProtectiveForm) {
    registerProtectiveForm.addEventListener('submit', handleRegisterSubmit);
}