import { Auth } from '/src/service/auth-service.js';

/**
 * funcion para actualizar el estado de autenticacion en la barra de navegacion
 */
function updateNavbarAuthState() {
    //DOM
    const currentUser = Auth.getCurrentUser();
    const loginRegisterButtons = document.getElementById('loginRegisterButtons');
    const userInfoContainer = document.getElementById('userInfo');
    const userAvatarContainer = document.getElementById('userAvatarNavbar');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const logoutButton = document.getElementById('logoutButton');
    const myApplicationsLink = document.getElementById('myApplicationsLink');
    const receivedApplicationsLink = document.getElementById('receivedApplicationsLink');
    const addPetLink = document.getElementById('addPetLink');
    const adminUsersLink = document.getElementById('adminUsersLink');

    // si hay un usuario logueado
    if (currentUser) {
        // ocultar botones de login/registro
        loginRegisterButtons?.classList.add('d-none');

        // mostrar contenedor de informacion del usuario
        userInfoContainer?.classList.remove('d-none');

        // si existe el elemento para mostrar el nombre del usuario
        if (userNameDisplay) {
            // establecer el nombre a mostrar
            userNameDisplay.textContent = currentUser.nombreCompleto ||
                currentUser.nombreRefugio ||
                currentUser.username ||
                'Usuario';
        }

        // si existe el contenedor del avatar del usuario
        if (userAvatarContainer) {

            // si el usuario tiene un avatar y no es el placeholder por defecto
            if (currentUser.avatar && currentUser.avatar !== '/img/placeholder-avatar.png') {
                // crear un elemento imagen para el avatar
                const img = document.createElement('img');
                img.src = currentUser.avatar;
                img.alt = "Avatar"; 
                img.className = "rounded-circle align-middle"; 
                img.width = 28; 
                img.height = 28;
                img.style.objectFit = "cover"; 

                userAvatarContainer.replaceChildren(img);

            // si no tiene avatar o es el placeholder
            } else {
                // crear un icono de usuario por defecto
                const icon = document.createElement('i');
                icon.className = "fas fa-user-circle fs-5 align-middle"; 

                userAvatarContainer.replaceChildren(icon);
            }
        }

        // determinar el rol del usuario
        const isAdoptante = currentUser.role === 'Adoptante';
        const isRefugio = currentUser.role === 'Refugio';
        const isAdmin = currentUser.role === 'Admin';

        // mostrar u ocultar enlace a mis solicitudes segun si es adoptante
        if (myApplicationsLink) {
            myApplicationsLink.classList.toggle('d-none', !isAdoptante);
        }

        // mostrar u ocultar enlace a solicitudes recibidas segun si es refugio
        if (receivedApplicationsLink) {
            receivedApplicationsLink.classList.toggle('d-none', !isRefugio);
        }

        // mostrar u ocultar enlace para añadir mascota segun si es refugio
        if (addPetLink) {
            addPetLink.classList.toggle('d-none', !isRefugio);
        }

        // mostrar u ocultar enlace para administrar usuarios segun si es admin
        if (adminUsersLink) {
            adminUsersLink.classList.toggle('d-none', !isAdmin);
        }

        // remover listener previo del boton de logout para evitar duplicados
        logoutButton?.removeEventListener('click', handleLogout);

        // añadir listener al boton de logout
        logoutButton?.addEventListener('click', handleLogout);

    // si no hay usuario logueado
    } else {
        // mostrar botones de login/registro
        loginRegisterButtons?.classList.remove('d-none');

        // ocultar contenedor de informacion del usuario
        userInfoContainer?.classList.add('d-none');

        // si existe el contenedor del avatar
        if (userAvatarContainer) {
            // mostrar icono de usuario por defecto
            const icon = document.createElement('i');
            icon.className = "fas fa-user-circle fs-5 align-middle";
            userAvatarContainer.replaceChildren(icon);
        }

        // ocultar enlaces especificos de roles
        myApplicationsLink?.classList.add('d-none');
        receivedApplicationsLink?.classList.add('d-none');
        addPetLink?.classList.add('d-none');
        adminUsersLink?.classList.add('d-none');
    }
}

/**
 * funcion para manejar el logout
 * @param {Event} e - el evento de clic
 */
function handleLogout(e) {
    e.preventDefault();

    // llamar al metodo de logout del servicio de autenticacion
    Auth.logout();
    updateNavbarAuthState();

    // redirigir a la pagina de inicio
    window.location.assign('/index.html');
}

// listener 
document.addEventListener('DOMContentLoaded', updateNavbarAuthState);

// listener 
window.addEventListener('profileUpdated', () => {
    updateNavbarAuthState();
});

export { updateNavbarAuthState };