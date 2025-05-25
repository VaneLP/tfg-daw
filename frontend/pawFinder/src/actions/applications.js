import { apiService } from '../service/api-service.js';
import { Auth } from '../service/auth-service.js';
import { Application } from '../model/Application.class.js';

// DOM
const pageTitleElement = document.getElementById('pageTitle');
const listContainer = document.getElementById('applicationsListContainer');
const receivedFiltersContainer = document.getElementById('receivedFiltersContainer');
const applicationStatusFilter = document.getElementById('applicationStatusFilter');
const petNameFilterReceived = document.getElementById('petNameFilterReceived');

/**
 * funcion para crear el elemento de una solicitud 
 * @param {Application} appInstance - la instancia de la clase application
 * @returns {HTMLElement} - el elemento div que representa la solicitud
 */
function createMyApplicationElement(appInstance) {
    // crear el item principal de la lista
    const item = document.createElement('div');
    item.className = 'list-group-item list-group-item-action flex-column align-items-start mb-3 border-0 rounded p-3 shadow-sm';

    // crear una fila 
    const row = document.createElement('div');
    row.className = 'row g-3 align-items-center';

    // crear columna para la imagen de la mascota
    const imgCol = document.createElement('div');
    imgCol.className = 'col-auto';

    // crear elemento de imagen
    const img = document.createElement('img');
    img.src = appInstance.petMainPhoto; 
    img.alt = appInstance.petName; 
    img.width = 80; img.height = 80; img.className = 'rounded object-fit-cover'; 

    imgCol.appendChild(img);

    // crear columna para la informacion de la solicitud
    const infoCol = document.createElement('div');
    infoCol.className = 'col';

    // crear div para la cabecera (nombre mascota y fecha)
    const headerDiv = document.createElement('div');
    headerDiv.className = 'd-flex w-100 justify-content-between mb-1';

    // crear h5 para el nombre de la mascota
    const petNameH5 = document.createElement('h5');
    petNameH5.className = 'mb-1 primary-color';
    petNameH5.textContent = appInstance.petName;

    // crear elemento small para la fecha de la solicitud
    const dateSmall = document.createElement('small');
    dateSmall.className = 'text-muted';
    dateSmall.textContent = appInstance.formattedApplicationDate; 

    // añadir nombre y fecha a la cabecera
    headerDiv.append(petNameH5, dateSmall);

    // crear parrafo para la informacion del refugio
    const refugioInfoP = document.createElement('p');
    refugioInfoP.className = 'mb-1 text-muted small';

    refugioInfoP.appendChild(document.createTextNode(`Solicitud para ${appInstance.petSpecies} en `));

    // crear elemento strong para el nombre del refugio
    const strongRefugio = document.createElement('strong');
    strongRefugio.textContent = appInstance.refugioName; 

    refugioInfoP.appendChild(strongRefugio);

    // crear parrafo para el estado de la solicitud
    const statusP = document.createElement('p');
    statusP.className = 'mb-0 small';

    statusP.appendChild(document.createTextNode('Estado: '));

    // crear span para el valor del estado
    const statusSpan = document.createElement('span');
    statusSpan.className = `fw-bold status-${appInstance.estadoSolicitud.toLowerCase()}`; 
    statusSpan.textContent = appInstance.estadoSolicitud; 

    statusP.appendChild(statusSpan);
    infoCol.append(headerDiv, refugioInfoP, statusP);
    row.append(imgCol, infoCol);
    item.appendChild(row);

    // si hay mensaje del adoptante
    if (appInstance.mensajeAdoptante) {
        // crear parrafo para el mensaje
        const messageP = document.createElement('p');
        messageP.className = 'mt-2 mb-0 ps-md-4 ms-md-3 small fst-italic text-secondary'; 
        messageP.textContent = `Tu mensaje: "${appInstance.mensajeAdoptante}"`; 

        item.appendChild(messageP);
    }

    return item;
}

/**
 * funcion para crear el elemento de una solicitud 'recibida'
 * @param {Application} appInstance - la instancia de la clase application
 * @returns {HTMLElement} - el elemento div que representa la solicitud
 */
function createReceivedApplicationElement(appInstance) {
    // crear el item principal de la lista
    const item = document.createElement('div');
    item.className = 'list-group-item flex-column align-items-start mb-3 border-0 rounded p-3 shadow-sm';
    item.id = `application-${appInstance._id}`; 

    // crear una fila 
    const row = document.createElement('div');
    row.className = 'row g-3';

    // crear columna para la informacion de la solicitud
    const infoCol = document.createElement('div');
    infoCol.className = 'col-md-7 col-lg-8'; 

    // crear div para la cabecera (nombre mascota y fecha)
    const headerDiv = document.createElement('div');
    headerDiv.className = 'd-flex w-100 justify-content-between mb-1';

    // crear h5 para el nombre de la mascota
    const petNameH5 = document.createElement('h5');
    petNameH5.className = 'mb-1 primary-color';
    petNameH5.textContent = `Mascota: ${appInstance.petName}`;

    // crear elemento small para la fecha
    const dateSmall = document.createElement('small');
    dateSmall.className = 'text-muted';
    dateSmall.textContent = appInstance.formattedApplicationDate; 

    headerDiv.append(petNameH5, dateSmall);

    // crear parrafo para el nombre del adoptante
    const adopterNameP = document.createElement('p');
    adopterNameP.className = 'mb-1 small';

    // crear etiqueta 'adoptante'
    const strongAdopterLabel = document.createElement('strong');
    strongAdopterLabel.textContent = 'Adoptante: ';

    adopterNameP.append(strongAdopterLabel, document.createTextNode(appInstance.adopterName));

    // crear parrafo para el contacto del adoptante
    const adopterContactP = document.createElement('p');
    adopterContactP.className = 'mb-1 small';

    // crear etiqueta 'contacto'
    const strongContactLabel = document.createElement('strong');
    strongContactLabel.textContent = 'Contacto: ';

    adopterContactP.append(strongContactLabel, document.createTextNode(appInstance.adopterContact));

    // crear parrafo para el mensaje del adoptante
    const adopterMessageP = document.createElement('p');
    adopterMessageP.className = 'mb-2 mt-2 small';

    // si hay mensaje del adoptante
    if (appInstance.mensajeAdoptante) {
        // aplicar estilos para mensaje
        adopterMessageP.classList.add('fst-italic', 'text-secondary');

        // crear etiqueta 'mensaje'
        const strongMsgLabel = document.createElement('strong');
        strongMsgLabel.textContent = 'Mensaje: ';

        adopterMessageP.append(strongMsgLabel, document.createTextNode(`"${appInstance.mensajeAdoptante}"`));
    
    // si no hay mensaje
    } else {
        // aplicar estilo para sin mensaje
        adopterMessageP.classList.add('text-muted');
        adopterMessageP.textContent = 'Sin mensaje adicional.';
    }

    // crear parrafo para el estado actual de la solicitud
    const statusP = document.createElement('p');
    statusP.className = 'mb-0 small';

    // crear etiqueta 'estado actual'
    const strongStatusLabel = document.createElement('strong');
    strongStatusLabel.textContent = 'Estado actual: ';

    // crear elemento strong para el valor del estado
    const statusStrongContent = document.createElement('strong');
    statusStrongContent.id = `status-${appInstance._id}`; 
    statusStrongContent.className = `status-${appInstance.estadoSolicitud.toLowerCase()}`; 
    statusStrongContent.textContent = appInstance.estadoSolicitud; 

    statusP.append(strongStatusLabel, statusStrongContent);
    infoCol.append(headerDiv, adopterNameP, adopterContactP, adopterMessageP, statusP);

    // crear columna para las acciones (botones)
    const actionCol = document.createElement('div');
    actionCol.className = 'col-md-5 col-lg-4 d-flex flex-column justify-content-center align-items-md-end mt-md-0 mt-2'; 

    // crear grupo de botones verticales
    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group-vertical btn-group-sm w-100 w-md-auto'; 
    btnGroup.setAttribute('role', 'group');
    btnGroup.setAttribute('aria-label', 'Acciones Solicitud');

    // definir las acciones posibles y sus propiedades
    const actions = [
        { state: 'Aprobada', text: 'Aprobar', classSuffix: 'success' },
        { state: 'Rechazada', text: 'Rechazar', classSuffix: 'danger' },
        { state: 'Contactado', text: 'Marcar Contactado', classSuffix: 'info' },
        { state: 'Pendiente', text: 'Marcar Pendiente', classSuffix: 'secondary' }
    ];

    // iterar sobre cada accion definida
    actions.forEach(actionInfo => {
        // si el estado actual de la solicitud no es el estado de esta accion (para no mostrar boton de estado actual)
        if (appInstance.estadoSolicitud !== actionInfo.state) {
            // crear boton para la accion
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `btn btn-sm btn-outline-${actionInfo.classSuffix} action-btn`;
            button.dataset.action = actionInfo.state; 
            button.dataset.appid = appInstance._id; 
            button.textContent = actionInfo.text; 
            button.title = actionInfo.text; 

            btnGroup.appendChild(button);
        }
    });

    actionCol.appendChild(btnGroup);
    row.append(infoCol, actionCol);
    item.appendChild(row);

    return item;
}

/**
 * funcion para añadir listeners a los botones de accion de las solicitudes
 */
function addApplicationActionListeners() {
    // seleccionar todos los botones con clase 'action-btn' dentro del contenedor de la lista
    listContainer?.querySelectorAll('.action-btn').forEach(button => {
        // si el boton ya tiene un listener no añadir otro
        if (button.dataset.listenerAttached === 'true') {
            return;
        }

        button.dataset.listenerAttached = 'true';

        const originalButtonContent = Array.from(button.childNodes).map(node => node.cloneNode(true));

        // añadir event listener para el evento click
        button.addEventListener('click', async (event) => {
            const currentButton = event.target.closest('.action-btn');

            // si no se encuentra el boton actual 
            if (!currentButton) {
                return;
            }

            // obtener el id de la aplicacion y el nuevo estado del dataset del boton
            const appId = currentButton.dataset.appid;
            const newState = currentButton.dataset.action;

            // obtener el grupo de botones al que pertenece el boton actual
            const buttonGroup = currentButton.closest('.btn-group-vertical');
            buttonGroup?.querySelectorAll('button').forEach(btn => btn.disabled = true);

            // crear un spinner para indicar carga
            const spinner = document.createElement('span');
            spinner.className = 'spinner-border spinner-border-sm me-1';

            currentButton.replaceChildren(spinner, document.createTextNode('Procesando'));

            try {
                await apiService.updateApplicationStatus(appId, newState);

                alert(`Solicitud marcada como ${newState}. Actualizando lista...`);

                const user = Auth.getCurrentUser();

                // si hay usuario logueado recargar las solicitudes
                if (user) {
                    await loadApplications(user);
                }
            } catch (error) {
                // error
                alert(`Error al actualizar estado: ${error.message}`);

                // rehabilitar todos los botones del grupo
                buttonGroup?.querySelectorAll('button').forEach(btn => {
                    btn.disabled = false;

                    // si es el boton actual restaurar su contenido original
                    if (btn === currentButton) {
                        btn.replaceChildren(...originalButtonContent);
                    }
                });
            }
        });
    });
}

/**
 * funcion asincrona para poblar el dropdown de filtro de mascotas
 * @param {User} currentUser - el usuario actual (debe ser un refugio)
 */
async function populatePetFilterDropdown(currentUser) {
    // si no existe el dropdown o no hay usuario o el usuario no es refugio 
    if (!petNameFilterReceived || !currentUser || currentUser.role !== 'Refugio') {
        return;
    }

    const previouslySelectedPetId = petNameFilterReceived.value;

    // limpiar opciones previas del dropdown
    while (petNameFilterReceived.firstChild) {
        petNameFilterReceived.removeChild(petNameFilterReceived.firstChild);
    }

    try {
        const petsResult = await apiService.getPets({ refugioId: currentUser._id, select: 'nombre,_id', limit: 0 });
        const defaultOption = document.createElement('option');

        defaultOption.value = ""; 
        defaultOption.textContent = "Todas las Mascotas";

        petNameFilterReceived.appendChild(defaultOption);

        // si se obtuvieron datos de mascotas y es un array con elementos
        if (petsResult.data && Array.isArray(petsResult.data) && petsResult.data.length > 0) {
            // iterar sobre cada mascota
            petsResult.data.forEach(pet => {
                // si la mascota tiene id y nombre
                if (pet && pet._id && pet.nombre) {
                    // crear una opcion para la mascota
                    const option = document.createElement('option');
                    option.value = pet._id; 
                    option.textContent = pet.nombre; 

                    petNameFilterReceived.appendChild(option);
                }
            });

            // si habia una mascota previamente seleccionada y aun existe en las opciones
            if (previouslySelectedPetId && petNameFilterReceived.querySelector(`option[value="${previouslySelectedPetId}"]`)) {
                petNameFilterReceived.value = previouslySelectedPetId;

            // si no seleccionar la opcion por defecto
            } else {
                petNameFilterReceived.value = "";
            }
        }
    } catch (error) {
        // limpiar opciones del dropdown
        while (petNameFilterReceived.firstChild) {
            petNameFilterReceived.removeChild(petNameFilterReceived.firstChild);
        }

        // crear opcion de error
        const errorOption = document.createElement('option');
        errorOption.value = "";
        errorOption.textContent = "Error al cargar mascotas";

        petNameFilterReceived.appendChild(errorOption);
    }
}

/**
 * funcion para renderizar 'mis solicitudes'
 * @param {Application[]} [appInstances=[]] - un array de instancias de application
 */
function renderMyApplications(appInstances = []) {
    // si no existe el contenedor de la lista 
    if (!listContainer) {
        return;
    }

    // limpiar contenido previo del contenedor
    while (listContainer.firstChild) {
        listContainer.removeChild(listContainer.firstChild);
    }

    // si no hay instancias de solicitud o el array esta vacio
    if (!Array.isArray(appInstances) || appInstances.length === 0) {
        // crear parrafo indicando que no se encontraron solicitudes
        const p = document.createElement('p');
        p.className = 'text-center text-muted mt-5';
        p.textContent = 'No se encontraron solicitudes con los filtros aplicados.';

        listContainer.appendChild(p);

        return;
    }

    const elements = appInstances.map(createMyApplicationElement);
    elements.forEach(el => listContainer.appendChild(el));
}

/**
 * funcion para renderizar 'solicitudes recibidas'
 * @param {Application[]} [appInstances=[]] - un array de instancias de application
 */
function renderReceivedApplications(appInstances = []) {
    // si no existe el contenedor de la lista 
    if (!listContainer) {
        return;
    }

    // limpiar contenido previo del contenedor
    while (listContainer.firstChild) {
        listContainer.removeChild(listContainer.firstChild);
    }

    // si no hay instancias de solicitud o el array esta vacio
    if (!Array.isArray(appInstances) || appInstances.length === 0) {
        // crear parrafo indicando que no se encontraron solicitudes
        const p = document.createElement('p');
        p.className = 'text-center text-muted mt-5';
        p.textContent = 'No se encontraron solicitudes con los filtros aplicados.';

        listContainer.appendChild(p);

        return;
    }

    const elements = appInstances.map(createReceivedApplicationElement);
    elements.forEach(el => listContainer.appendChild(el));

    addApplicationActionListeners();
}

/**
 * funcion para mostrar el estado de carga
 */
function showLoadingState() {
    // si existe el contenedor de la lista
    if (listContainer) {
        // limpiar contenido previo
        while (listContainer.firstChild) {
            listContainer.removeChild(listContainer.firstChild);
        }

        // crear div para el indicador de carga
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'text-center py-5';

        // crear spinner 
        const spinner = document.createElement('div');
        spinner.className = 'spinner-border primary-color';
        spinner.style.width = '3rem'; spinner.style.height = '3rem'; 
        spinner.setAttribute('role', 'status');

        // crear texto oculto para accesibilidad del spinner
        const visuallyHidden = document.createElement('span');
        visuallyHidden.className = 'visually-hidden';
        visuallyHidden.textContent = 'Cargando...';

        spinner.appendChild(visuallyHidden);

        // crear texto de carga visible
        const loadingText = document.createElement('p');
        loadingText.className = 'mt-2 text-muted';
        loadingText.textContent = 'Buscando solicitudes...';

        loadingDiv.append(spinner, loadingText);
        listContainer.appendChild(loadingDiv);
    }
}

/**
 * funcion para mostrar un estado de error
 * @param {string} message - el mensaje de error a mostrar
 */
function showErrorState(message) {
    // si existe el contenedor de la lista
    if (listContainer) {
        // limpiar contenido previo
        while (listContainer.firstChild) {
            listContainer.removeChild(listContainer.firstChild);
        }

        // crear parrafo para el mensaje de error
        const p = document.createElement('p');
        p.className = 'text-danger text-center mt-5';
        p.textContent = `Error al cargar las solicitudes: ${message}`; 

        listContainer.appendChild(p);
    }

    // si existe el elemento para el titulo de la pagina
    if (pageTitleElement) {
        pageTitleElement.textContent = 'Error al Cargar Solicitudes';
    }

    document.title = 'Error Solicitudes - PawFinder';
}

/**
 * funcion asincrona para cargar las solicitudes
 * @param {User} user - el usuario actual logueado
 */
async function loadApplications(user) {
    // si no hay usuario o no existe el contenedor de la lista mostrar error y salir
    if (!user || !listContainer) {
        showErrorState("No se pudo determinar el usuario o el contenedor de la lista."); return;
    }

    showLoadingState();

    const urlParams = new URLSearchParams(window.location.search);
    let view = urlParams.get('view');

    // si no se especifico 'view' determinarlo segun el rol del usuario
    if (!view) {
        view = user.role === 'Adoptante' ? 'my' : (user.role === 'Refugio' ? 'received' : '');
    }

    const apiParams = {};
    const highlightId = urlParams.get('highlight');

    // si la vista es 'my' y el usuario es adoptante
    if (view === 'my' && user.role === 'Adoptante') {
        // actualizar titulo de la pagina
        if (pageTitleElement) {
            pageTitleElement.textContent = 'Mis Solicitudes de Adopción';
        }

        document.title = 'Mis Solicitudes - PawFinder';

        // ocultar filtros de solicitudes recibidas
        if (receivedFiltersContainer) {
            receivedFiltersContainer.classList.add('d-none');
        }

    // si la vista es 'received' y el usuario es refugio
    } else if (view === 'received' && user.role === 'Refugio') {
        // actualizar titulo de la pagina
        if (pageTitleElement) {
            pageTitleElement.textContent = 'Solicitudes de Adopción Recibidas';
        }

        document.title = 'Solicitudes Recibidas - PawFinder';

        // mostrar filtros de solicitudes recibidas
        if (receivedFiltersContainer) {
            receivedFiltersContainer.classList.remove('d-none');
        }

        // si existe el filtro de mascotas y no se ha poblado una vez
        if (petNameFilterReceived && !petNameFilterReceived.dataset.populatedOnce) {
            await populatePetFilterDropdown(user);

            // marcar el filtro como poblado para no hacerlo de nuevo innecesariamente
            if (petNameFilterReceived) {
                petNameFilterReceived.dataset.populatedOnce = "true";
            }
        }

        const selectedStatus = applicationStatusFilter?.value;
        const selectedPetId = petNameFilterReceived?.value;

        // si se selecciono un estado añadirlo a los parametros de la api
        if (selectedStatus && selectedStatus !== "") {
            apiParams.estadoSolicitud = selectedStatus;
        }

        // si se selecciono una mascota añadirla a los parametros de la api
        if (selectedPetId && selectedPetId !== "") {
            apiParams.mascotaId = selectedPetId;
        }

    // si la vista no es valida o el rol es incorrecto
    } else {
        showErrorState("Vista no válida o rol incorrecto para acceder a esta sección.");

        if (receivedFiltersContainer) {
            receivedFiltersContainer.classList.add('d-none');
        }

        return;
    }

    try {
        let result;

        // si la vista es 'my'
        if (view === 'my') {
            // obtener mis solicitudes
            result = await apiService.getMyApplications(apiParams);

        // si la vista es 'received'
        } else if (view === 'received') {
            result = await apiService.getReceivedApplications(apiParams);

        // si la vista es desconocida
        } else {
            // error
            throw new Error("Vista de aplicación desconocida.");
        }

        const applicationsData = result.data || result;
        const appInstances = (applicationsData && Array.isArray(applicationsData))
            ? applicationsData.map(appData => new Application(appData))
            : [];

        // si la vista es 'my' renderizar mis solicitudes
        if (view === 'my') {
            renderMyApplications(appInstances);

        // si la vista es 'received' renderizar solicitudes recibidas
        } else if (view === 'received') {
            renderReceivedApplications(appInstances);
        }

        // si hay un id para resaltar y existe el contenedor de la lista
        if (highlightId && listContainer) {
            // usar settimeout para asegurar que el dom este actualizado
            setTimeout(() => {
                // buscar el elemento a resaltar por su id
                const elementToHighlight = listContainer.querySelector(`#application-${highlightId}`);

                // si se encuentra el elemento
                if (elementToHighlight) {
                    elementToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    elementToHighlight.classList.add('highlighted-application');

                    // quitar clase de resaltado despues de 3 segundos
                    setTimeout(() => elementToHighlight.classList.remove('highlighted-application'), 3000);
                }
            }, 300);
        }

    } catch (error) {
        //error
        showErrorState(error.message || "Error desconocido del servidor");
    }
}

// listener
document.addEventListener('DOMContentLoaded', async () => {
    let currentUser;

    try {
        currentUser = await Auth.checkToken();

        // si no hay usuario (token invalido o no logueado)
        if (!currentUser) {
            // error
            throw new Error("Usuario no autenticado");
        }

        await loadApplications(currentUser);

        // añadir event listener al filtro de estado si existe
        applicationStatusFilter?.addEventListener('change', () => {
            // si hay usuario actual recargar solicitudes con el nuevo filtro
            if (currentUser) {
                loadApplications(currentUser);
            }
        });

        // añadir event listener al filtro de mascota si existe
        petNameFilterReceived?.addEventListener('change', () => {
            // si hay usuario actual recargar solicitudes con el nuevo filtro
            if (currentUser) {
                loadApplications(currentUser);
            }
        });

    } catch (error) {
        Auth.logout();
        window.location.assign('/login.html');
    }
});