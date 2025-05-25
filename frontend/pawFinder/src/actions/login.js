import { Auth } from '../service/auth-service.js';

// DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorInfo = document.getElementById('loginError');
const submitButton = loginForm?.querySelector('button[type="submit"]');

/**
 * funcion para mostrar un mensaje de error
 * @param {string} message - el mensaje de error a mostrar
 */
function displayError(message) {
    // si existe el elemento para mostrar errores
    if (errorInfo) {
        errorInfo.textContent = message;
        errorInfo.classList.remove('d-none');

    // si no existe mostrar una alerta nativa
    } else {
        // error
        alert("Error: " + message);
    }
}

/**
 * funcion para limpiar errores y estado de validacion
 */
function clearError() {
    // si existe el elemento para mostrar errores
    if (errorInfo) {
        errorInfo.textContent = '';
        errorInfo.classList.add('d-none');
    }

    // remover clases de validacion del campo de email
    emailInput?.classList.remove('is-invalid', 'is-valid');

    // remover clases de validacion del campo de contrasena
    passwordInput?.classList.remove('is-invalid', 'is-valid');
}

/**
 * funcion para establecer el estado de carga del boton de envio
 * @param {boolean} isLoading - verdadero para mostrar estado de carga falso para estado normal
 */
function setSubmitLoading(isLoading) {
    // si el boton de envio no existe 
    if (!submitButton) {
        return;
    }

    // si el texto original no se ha guardado en dataset
    if (submitButton.dataset.originalText === undefined) {
        submitButton.dataset.originalText = submitButton.textContent || 'Iniciar Sesión';
    }

    const originalText = submitButton.dataset.originalText;

    // si isLoading es verdadero
    if (isLoading) {
        submitButton.disabled = true;

        // crear un elemento span para el spinner
        const spinner = document.createElement('span');
        spinner.className = 'spinner-border spinner-border-sm me-2';
        spinner.setAttribute('role', 'status');
        spinner.setAttribute('aria-hidden', 'true');

        submitButton.replaceChildren(spinner, document.createTextNode(' Entrando...'));

    // si isLoading es falso
    } else {
        submitButton.disabled = false;
        submitButton.replaceChildren(document.createTextNode(originalText));
    }
}

// listener formulario login 
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    let isValid = true;

    // si el email esta vacio
    if (!email) {
        emailInput?.classList.add('is-invalid');
        isValid = false;

    // si el email no esta vacio
    } else {
        emailInput?.classList.add('is-valid');
    }

    // si la contrasena esta vacia
    if (!password) {
        passwordInput?.classList.add('is-invalid');
        isValid = false;

    // si la contrasena no esta vacia
    } else {
        passwordInput?.classList.add('is-valid');
    }

    // si el formulario no es valido
    if (!isValid) {
        displayError("Por favor, completa todos los campos.");
        return;
    }

    setSubmitLoading(true);

    try {
        const loggedInUser = await Auth.login(email, password);

        window.location.assign('/index.html');
    } catch (error) {
        // error 
        displayError(error.message || "Email o contraseña incorrectos.");

        emailInput?.classList.add('is-invalid');
        passwordInput?.classList.add('is-invalid');

        setSubmitLoading(false);
    }
});

// listener ventana
window.addEventListener('load', async () => {
    const user = await Auth.checkToken();
    
    // si hay un usuario logueado
    if (user) {
        window.location.assign('/index.html');
    }
});