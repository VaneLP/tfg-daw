import { Auth } from '../service/auth-service.js';
import { apiService } from '../service/api-service.js';
import { Pet } from '../model/Pet.class.js';
import { User } from '../model/User.class.js';
import { Application } from '../model/Application.class.js';
import { displayLocationMap } from '../map/map-initializer.js';

const petDetailContent = document.getElementById('petDetailContent');
const breadcrumbPetName = document.getElementById('breadcrumbPetName');

let adoptButton;
let adoptMessageTextarea;
let adoptConfirmationElement;
let petActionsContainer;
let adoptBtnDivGlobal;
let msgDivGlobal;

/**
 * funcion para crear un icono
 * @param {string[]} [classes=[]] - un array de clases css para el icono
 * @returns {HTMLElement} - el elemento icono creado
 */
function createIcon(classes = []) {
    const icon = document.createElement('i');
    // filtrar clases validas (no nulas no vacias y strings)
    const validClasses = classes.filter(c => c && typeof c === 'string' && c.trim() !== '');

    // si hay clases validas
    if (validClasses.length > 0) {
        // añadir las clases al icono
        icon.classList.add(...validClasses);
    }

    // devolver el icono
    return icon;
}

/**
 * funcion para crear un badge
 * @param {string} text - el texto del badge
 * @param {string[]} [classes=['bg-secondary', 'me-1']] - un array de clases css para el badge
 * @returns {HTMLElement|null} - el elemento badge creado o null si no se proporciona texto
 */
function createBadge(text, classes = ['bg-secondary', 'me-1']) {
    // si no hay texto devolver null
    if (!text) {
        return null;
    }

    // crear un elemento <span>
    const badge = document.createElement('span');
    badge.className = 'badge';

    // filtrar clases validas
    const validClasses = classes.filter(c => c && typeof c === 'string' && c.trim() !== '');

    // si hay clases validas
    if (validClasses.length > 0) {
        // añadir las clases al badge
        badge.classList.add(...validClasses);
    }

    // establecer el texto del badge
    badge.textContent = text;

    // devolver el badge
    return badge;
}

/**
 * funcion para establecer el estado de carga de un boton
 * @param {HTMLButtonElement|null} button - el boton a gestionar
 * @param {boolean} isLoading - verdadero para mostrar estado de carga falso para estado normal
 * @param {Node[]|null} originalContentNodesParam - nodos del contenido original del boton para restaurar
 */
function setButtonLoading(button, isLoading, originalContentNodesParam) {
    // si el boton no existe 
    if (!button) {
        return;
    }

    // si isLoading es verdadero 
    if (isLoading) {
        // si no se ha guardado el texto original y no se proporcionan nodos originales
        if (!button.dataset.originalText && (!originalContentNodesParam || originalContentNodesParam.length === 0)) {
            // guardar el texto 
            button.dataset.originalText = button.textContent.trim();
        }

        button.disabled = true;

        const spinner = document.createElement('span');
        spinner.className = 'spinner-border spinner-border-sm me-2';
        spinner.setAttribute('role', 'status');
        spinner.setAttribute('aria-hidden', 'true');

        button.replaceChildren(spinner, document.createTextNode(' Procesando...'));

        // si isLoading es falso 
    } else {
        // habilitar el boton
        button.disabled = false;

        // si se proporcionan nodos de contenido original
        if (originalContentNodesParam && originalContentNodesParam.length > 0) {
            button.replaceChildren(...originalContentNodesParam.map(node => node.cloneNode(true)));

            // si no se proporcionan nodos originales
        } else {
            const originalText = button.dataset.originalText || 'Acción';
            button.replaceChildren(document.createTextNode(originalText));
        }

        // si se habia guardado el texto original en dataset eliminarlo
        if (button.dataset.originalText) {
            delete button.dataset.originalText;
        }
    }
}

/**
 * funcion para mostrar un mensaje de adopcion
 * @param {string} message - el mensaje a mostrar
 * @param {boolean} [isError=false] - verdadero si es un mensaje de error falso para exito
 */
function showAdoptMessage(message, isError = false) {
    // si existe el elemento de confirmacion de adopcion
    if (adoptConfirmationElement) {
        adoptConfirmationElement.textContent = message;

        adoptConfirmationElement.className = `alert mt-3 ${isError ? 'alert-danger' : 'alert-success'}`;
        adoptConfirmationElement.classList.remove('d-none');

        // si no existe el elemento mostrar una alerta nativa
    } else {
        alert((isError ? "Error: " : "") + message);
    }
}

/**
 * funcion para limpiar el mensaje de adopcion
 */
function clearAdoptMessage() {
    // si existe el elemento de confirmacion de adopcion
    if (adoptConfirmationElement) {
        adoptConfirmationElement.textContent = '';
        adoptConfirmationElement.classList.add('d-none');
    }
}

/**
 * funcion para crear el dom de los detalles de la mascota
 * @param {Pet} petInstance - la instancia de la clase pet con los datos
 * @returns {DocumentFragment} - un fragmento de documento con el dom de los detalles
 */
function createPetDetailDOM(petInstance) {
    // crear un fragmento de documento
    const fragment = document.createDocumentFragment();

    // crear una fila 
    const row = document.createElement('div');
    row.className = 'row g-5';

    // crear columna para la imagen
    const imgCol = document.createElement('div');
    imgCol.className = 'col-md-7';

    // crear elemento de imagen
    const imgElement = document.createElement('img');
    imgElement.className = 'img-fluid rounded shadow-sm mb-3';
    imgElement.id = 'petImage';
    imgElement.src = petInstance.mainPhoto; 
    imgElement.alt = petInstance.nombre; 
    imgElement.style.maxHeight = '600px';
    imgElement.style.width = '100%';
    imgElement.style.objectFit = 'cover';

    imgCol.appendChild(imgElement);

    // crear columna para los detalles
    const detailCol = document.createElement('div');
    detailCol.className = 'col-md-5';

    // crear encabezado h1 para el nombre de la mascota
    const nameH1 = document.createElement('h1');
    nameH1.className = 'mb-2 primary-color display-5 fw-bold';
    nameH1.id = 'petName';
    nameH1.textContent = petInstance.nombre;

    detailCol.appendChild(nameH1);

    // crear div para los badges de informacion
    const badgesDiv = document.createElement('div');
    badgesDiv.className = 'mb-3 d-flex flex-wrap gap-1';
    badgesDiv.id = 'petInfoBadges';
    // crear y añadir badges para especie raza edad genero tamano
    [
        createBadge(petInstance.especie, ['bg-primary', 'text-light']),
        createBadge(petInstance.raza),
        createBadge(petInstance.edad),
        createBadge(petInstance.genero),
        createBadge(petInstance.tamano, ['bg-secondary'])
    ].forEach(b => { // iterar sobre los badges creados
        if (b) { // si el badge no es nulo
            badgesDiv.appendChild(b); // añadirlo al div de badges
        }
    });

    detailCol.appendChild(badgesDiv);

    // crear titulo para la descripcion
    const descTitle = document.createElement('h4');
    descTitle.className = 'mt-4';
    descTitle.textContent = 'Descripción';

    // crear parrafo para la descripcion
    const descP = document.createElement('p');
    descP.className = 'text-secondary';
    descP.id = 'petDescription';
    descP.textContent = petInstance.descripcion;

    detailCol.append(descTitle, descP);

    // crear tarjeta para la informacion de la protectora
    const protectoraCard = document.createElement('div');
    protectoraCard.className = 'card mt-4 bg-light border-0 shadow-sm';

    // crear cuerpo de la tarjeta de protectora
    const protectoraBody = document.createElement('div');
    protectoraBody.className = 'card-body p-3';

    // crear titulo para la seccion de protectora
    const protectoraTitleElement = document.createElement('h5');
    protectoraTitleElement.className = 'card-title primary-color mb-3 fs-6 fw-bold';

    protectoraTitleElement.append(createIcon(['fas', 'fa-home', 'me-2']), document.createTextNode(' Protectora'));
    protectoraBody.appendChild(protectoraTitleElement);

    // si los datos del refugio son una instancia de user 
    if (petInstance.refugioId instanceof User) {
        // crear parrafo para el nombre de la protectora
        const nameProtectoraP = document.createElement('p');
        nameProtectoraP.className = 'card-text mb-1 small';

        // crear elemento nombre
        const strongNombreProtectora = document.createElement('strong');
        strongNombreProtectora.textContent = 'Nombre: ';

        // crear span para el valor del nombre de la protectora
        const spanNombreProtectora = document.createElement('span');
        spanNombreProtectora.id = 'protectoraName';
        spanNombreProtectora.textContent = petInstance.refugioName; 

        nameProtectoraP.append(strongNombreProtectora, spanNombreProtectora);

        protectoraBody.appendChild(nameProtectoraP);

        // si la protectora tiene un nombre completo de representante
        if (petInstance.refugioId.nombreCompleto) {
            // crear parrafo para el representante
            const representanteP = document.createElement('p');
            representanteP.className = 'card-text mb-1 small';

            // crear etiqueta 'representante'
            const strongRep = document.createElement('strong');
            strongRep.textContent = 'Representante: ';

            representanteP.append(strongRep, document.createTextNode(petInstance.refugioId.nombreCompleto));

            protectoraBody.appendChild(representanteP);
        }

        // crear parrafo para la ubicacion de la protectora
        const locPProtectora = document.createElement('p');
        locPProtectora.className = 'card-text mb-1 small';

        // crear etiqueta 'ubicacion'
        const strongLoc = document.createElement('strong');
        strongLoc.textContent = 'Ubicación: ';

        // crear span para el valor de la ubicacion
        const locSpanProtectora = document.createElement('span');
        locSpanProtectora.id = 'protectoraLocation';
        locSpanProtectora.textContent = petInstance.refugioId.direccionCompleta || 'No especificada'; // direccion o texto por defecto

        locPProtectora.append(strongLoc, locSpanProtectora);

        protectoraBody.appendChild(locPProtectora);

        // crear parrafo para el contacto de la protectora
        const contactP = document.createElement('p');
        contactP.className = 'card-text mb-1 small';

        // crear etiqueta 'contacto'
        const strongContact = document.createElement('strong');
        strongContact.textContent = 'Contacto: ';

        // crear span para el valor del contacto
        const contactS = document.createElement('span');
        contactS.id = 'protectoraContact';

        const contactParts = [];

        // si hay email añadirlo
        if (petInstance.refugioId.email) {
            contactParts.push(petInstance.refugioId.email);
        }

        // si hay telefono añadirlo
        if (petInstance.refugioId.telefono) {
            contactParts.push(petInstance.refugioId.telefono);
        }

        contactS.textContent = contactParts.join(' | ') || 'N/A';

        contactP.append(strongContact, contactS);

        protectoraBody.appendChild(contactP);

        // crear contenedor para el mapa de la protectora
        const mapContainerWrapper = document.createElement('div');
        mapContainerWrapper.id = 'protectoraMapContainer';
        mapContainerWrapper.className = 'mt-3 rounded border';
        mapContainerWrapper.style.height = '250px';
        mapContainerWrapper.style.width = '100%';

        // crear placeholder para mientras carga el mapa
        const mapPlaceholder = document.createElement('div');
        mapPlaceholder.className = 'd-flex justify-content-center align-items-center h-100';

        // crear spinner para el placeholder del mapa
        const spinnerMap = document.createElement('div');
        spinnerMap.className = 'spinner-border spinner-border-sm text-secondary';
        spinnerMap.setAttribute('role', 'status');

        // crear texto oculto para accesibilidad del spinner
        const spinnerTextMap = document.createElement('span');
        spinnerTextMap.className = 'visually-hidden';
        spinnerTextMap.textContent = 'Cargando mapa...';
        spinnerMap.appendChild(spinnerTextMap);

        // crear texto de carga visible para el mapa
        const loadingTextMap = document.createElement('span');
        loadingTextMap.className = 'ms-2 text-muted small';
        loadingTextMap.textContent = 'Cargando mapa...';

        mapPlaceholder.append(spinnerMap, loadingTextMap);

        mapContainerWrapper.appendChild(mapPlaceholder);
        protectoraBody.appendChild(mapContainerWrapper);

        // si no hay informacion de la protectora 
    } else {
        // crear parrafo indicando que no hay informacion
        const noInfoP = document.createElement('p');
        noInfoP.className = 'text-muted small';
        noInfoP.textContent = 'Información de la protectora no disponible.';

        protectoraBody.appendChild(noInfoP);
    }

    protectoraCard.appendChild(protectoraBody);
    detailCol.appendChild(protectoraCard);

    // crear div para el boton de adoptar
    const localAdoptBtnDiv = document.createElement('div');
    localAdoptBtnDiv.id = 'adoptButtonContainer';
    localAdoptBtnDiv.className = 'd-grid mt-4';

    // crear el boton de adoptar
    const adoptBtnElement = document.createElement('button');
    adoptBtnElement.className = 'btn btn-secondary btn-lg';
    adoptBtnElement.id = 'adoptButton';
    adoptBtnElement.disabled = true;
    adoptBtnElement.append(createIcon(['fas', 'fa-spinner', 'fa-spin', 'me-2']), document.createTextNode(' Verificando...'));

    localAdoptBtnDiv.appendChild(adoptBtnElement);

    // crear div para el area de mensaje de adopcion
    const localMsgDiv = document.createElement('div');
    localMsgDiv.id = 'adoptMessageContainer';
    localMsgDiv.className = 'mt-3';

    // crear etiqueta para el area de mensaje
    const msgLabel = document.createElement('label');
    msgLabel.htmlFor = 'adoptMessage';
    msgLabel.className = 'form-label small text-muted';
    msgLabel.textContent = 'Mensaje (Opcional):';

    // crear area de texto para el mensaje
    const msgArea = document.createElement('textarea');
    msgArea.className = 'form-control form-control-sm';
    msgArea.id = 'adoptMessage';
    msgArea.rows = 3;
    msgArea.placeholder = 'Preséntate...';

    localMsgDiv.append(msgLabel, msgArea);

    // crear div para mensajes de confirmacion/error de adopcion
    const confDiv = document.createElement('div');
    confDiv.id = 'adoptConfirmation';
    confDiv.className = 'alert mt-3 d-none';
    confDiv.setAttribute('role', 'alert');

    // crear div para editar eliminar
    const actDiv = document.createElement('div');
    actDiv.id = 'petActions';
    actDiv.className = 'mt-4';

    detailCol.append(localAdoptBtnDiv, localMsgDiv, confDiv, actDiv);
    row.append(imgCol, detailCol);
    fragment.appendChild(row);

    return fragment;
}

/**
 * funcion para inicializar selectores de elementos del dom
 */
function initializeSelectors() {
    adoptButton = document.getElementById('adoptButton');
    adoptMessageTextarea = document.getElementById('adoptMessage');
    adoptConfirmationElement = document.getElementById('adoptConfirmation');
    petActionsContainer = document.getElementById('petActions');
    adoptBtnDivGlobal = document.getElementById('adoptButtonContainer');
    msgDivGlobal = document.getElementById('adoptMessageContainer');
}

/**
 * funcion asincrona para poblar los detalles de la mascota en la pagina
 * @param {Pet} petInstance - la instancia de la clase pet
 */
async function populatePetDetails(petInstance) {
    // si no hay instancia de mascota o no existe el contenedor principal
    if (!petInstance || !petDetailContent) {
        // mostrar error
        showPetError("Datos de mascota inválidos o contenedor no encontrado."); 
        return;
    }

    try {
        const petDOM = createPetDetailDOM(petInstance);

        petDetailContent.replaceChildren(petDOM);

        initializeSelectors();

        // si existe el elemento del breadcrumb para el nombre
        if (breadcrumbPetName) {
            breadcrumbPetName.textContent = petInstance.nombre;
        }

        document.title = `${petInstance.nombre} - PawFinder`;

        const currentUser = Auth.getCurrentUser();
        let isOwnerOrAdmin = false;
        let protectoraOwnerId = null;

        // si la mascota tiene un refugioid
        if (petInstance.refugioId) {
            protectoraOwnerId = petInstance.refugioId._id || petInstance.refugioId;

            // si hay un usuario actual logueado
            if (currentUser) {
                // verificar si el usuario es el propietario del refugio
                const isOwner = (petInstance.refugioId instanceof User && currentUser._id === petInstance.refugioId._id) ||
                    (typeof petInstance.refugioId === 'string' && currentUser._id === petInstance.refugioId);
                // verificar si el usuario es administrador
                const isAdmin = currentUser.role === 'Admin';

                isOwnerOrAdmin = isOwner || isAdmin;
            }

            // si no hay refugioid pero el usuario es admin
        } else if (currentUser && currentUser.role === 'Admin') {
            isOwnerOrAdmin = true;
        }

        // si existe el contenedor global del boton de adoptar
        if (adoptBtnDivGlobal) {
            // si el usuario es propietario o admin
            if (isOwnerOrAdmin) {
                // ocultar el contenedor del boton de adoptar
                adoptBtnDivGlobal.classList.add('d-none');
                adoptBtnDivGlobal.classList.remove('d-grid');

                // si no es propietario ni admin
            } else {
                // mostrar el contenedor del boton de adoptar
                adoptBtnDivGlobal.classList.remove('d-none');
                adoptBtnDivGlobal.classList.add('d-grid');
            }
        }

        // si existe el contenedor global del area de mensaje
        if (msgDivGlobal) {
            // si es propietario o admin
            if (isOwnerOrAdmin) {
                // ocultar el area de mensaje
                msgDivGlobal.classList.add('d-none');
                msgDivGlobal.classList.remove('d-block');

                // si no
            } else {
                // mostrar el area de mensaje
                msgDivGlobal.classList.remove('d-none');
                msgDivGlobal.classList.add('d-block');
            }
        }

        // si existe el elemento de confirmacion de adopcion ocultarlo inicialmente
        if (adoptConfirmationElement) {
            adoptConfirmationElement.classList.add('d-none');
        }

        addPetActionButtons(petInstance);

        // si el usuario es propietario o admin
        if (isOwnerOrAdmin) {
            // si existe el contenedor de acciones de la mascota
            if (petActionsContainer) {
                // cargar y mostrar los solicitantes para esta mascota
                await loadAndDisplayPetApplicants(petInstance._id, petActionsContainer);
            }

            // si no es propietario ni admin
        } else {
            // si existe el contenedor de acciones de la mascota
            if (petActionsContainer) {
                // buscar el contenedor del acordeon de solicitantes
                const accordionWrapper = petActionsContainer.querySelector('.applicants-accordion-wrapper');

                // si existe removerlo
                if (accordionWrapper) {
                    accordionWrapper.remove();
                }

                const crudButtons = petActionsContainer.querySelector('.pet-crud-buttons');

                // si existe y esta vacio removerlo
                if (crudButtons && !crudButtons.hasChildNodes()) {
                    crudButtons.remove();
                }

                // si no existe el contenedor de botones pero tiene hijos limpiarlo
                else if (!crudButtons && petActionsContainer.hasChildNodes()) {
                    while (petActionsContainer.firstChild) {
                        petActionsContainer.removeChild(petActionsContainer.firstChild);
                    }
                }
            }

            let userApplicationStatus = null;

            // si hay usuario actual es adoptante y la mascota esta disponible
            if (currentUser && currentUser.role === 'Adoptante' && petInstance.estadoAdopcion === 'Disponible') {
                try {
                    const appStatusResult = await apiService.checkUserApplicationForPet(petInstance._id);
                    const statusData = appStatusResult.data || appStatusResult;

                    // si hay datos y tiene una solicitud
                    if (statusData && statusData.hasApplication) {
                        userApplicationStatus = statusData.status;
                    }

                } catch (e) {
                    userApplicationStatus = null;
                }
            }

            updateAdoptButtonState(petInstance.estadoAdopcion, protectoraOwnerId, userApplicationStatus);

            // si el boton de adoptar existe y no esta deshabilitado
            if (adoptButton && !adoptButton.disabled) {
                addAdoptButtonListener(petInstance._id);
            }
        }

        const mapContainerTargetId = 'protectoraMapContainer';
        const refugioData = petInstance.refugioId;
        const mapContainerEl = document.getElementById(mapContainerTargetId);

        // si hay datos del refugio es una instancia de user y tiene coordenadas y existe el contenedor del mapa
        if (refugioData instanceof User && refugioData.coordenadas && mapContainerEl) {
            // verificar que latitud y longitud sean numeros validos
            const latIsOk = typeof refugioData.coordenadas.lat === 'number' && !isNaN(refugioData.coordenadas.lat);
            const lonIsOk = typeof refugioData.coordenadas.lon === 'number' && !isNaN(refugioData.coordenadas.lon);

            // si las coordenadas son validas
            if (latIsOk && lonIsOk) {
                // limpiar el contenido del contenedor del mapa
                while (mapContainerEl.firstChild) {
                    mapContainerEl.removeChild(mapContainerEl.firstChild);
                }

                // usar settimeout para asegurar que el dom se actualice antes de inicializar el mapa
                setTimeout(async () => {
                    try {
                        // llamar a la funcion para mostrar el mapa
                        const mapInstance = await displayLocationMap(mapContainerTargetId, refugioData.coordenadas.lon, refugioData.coordenadas.lat);
                        
                        // si no se pudo inicializar el mapa
                        if (!mapInstance && mapContainerEl) {
                            //error
                            const pError = document.createElement('p');
                            pError.className = 'text-danger text-center p-3';
                            pError.textContent = 'No se pudo inicializar el mapa.';

                            mapContainerEl.replaceChildren(pError);
                        }
                    }
                    catch (error) {
                        // error
                        const pError = document.createElement('p');
                        pError.className = 'text-danger text-center p-3';
                        pError.textContent = 'No se pudo cargar el mapa (catch displayLocationMap).';

                        mapContainerEl.replaceChildren(pError);
                    }
                }, 0); 
            
                // si las coordenadas no son validas pero el contenedor existe
            } else if (mapContainerEl) {
                const pError = document.createElement('p');
                pError.className = 'text-muted text-center p-3';
                pError.textContent = 'Coordenadas del refugio no válidas para mostrar el mapa.';

                mapContainerEl.replaceChildren(pError);
            }

            // si el contenedor del mapa existe pero no se cumplen las condiciones para mostrarlo
        } else if (mapContainerEl) {
            let reason = "Ubicación del refugio no disponible en el mapa.";

            if (!(refugioData instanceof User)) {
                reason = "Datos del refugio no disponibles para el mapa.";
            } else if (!refugioData.coordenadas) {
                reason = "El refugio no tiene coordenadas registradas para el mapa.";
            }

            const pError = document.createElement('p');
            pError.className = 'text-muted text-center p-3';
            pError.textContent = reason;

            mapContainerEl.replaceChildren(pError);
        }

    } catch (error) {
        //error
        showPetError("Error crítico al mostrar los detalles de la mascota.");
    }
}

/**
 * funcion asincrona para cargar y mostrar solicitantes de una mascota
 * @param {string} mascotaId - el id de la mascota
 * @param {HTMLElement} container - el elemento contenedor donde mostrar el acordeon
 */
async function loadAndDisplayPetApplicants(mascotaId, container) {
    // si no hay contenedor 
    if (!container) {
        return;
    }

    let accordionWrapper = container.querySelector('.applicants-accordion-wrapper');

    // si no existe crear uno nuevo
    if (!accordionWrapper) {
        accordionWrapper = document.createElement('div');
        accordionWrapper.className = 'applicants-accordion-wrapper w-100';
        container.appendChild(accordionWrapper);

        // si existe limpiar su contenido
    } else {
        while (accordionWrapper.firstChild) {
            accordionWrapper.removeChild(accordionWrapper.firstChild);
        }
    }

    // crear titulo para solicitudes
    const title = document.createElement('h5');
    title.textContent = 'Solicitudes Recibidas:';
    title.className = 'mt-3 mb-2 text-start';

    accordionWrapper.appendChild(title);

    try {
        const result = await apiService.getApplicationsForPet(mascotaId);
        const applications = result.data || result;

        // si hay solicitudes y es un array con elementos
        if (applications && Array.isArray(applications) && applications.length > 0) {
            // crear el div principal del acordeon
            const accordionDiv = document.createElement('div');
            accordionDiv.className = 'accordion';

            // generar un id unico para el acordeon
            const accordionId = `applicantsAccordion-${mascotaId.toString().replace(/\W/g, '')}`;
            accordionDiv.id = accordionId;

            // iterar sobre cada solicitud
            applications.forEach((appData, index) => {
                const app = new Application(appData);

                // crear un item del acordeon
                const accordionItem = document.createElement('div');
                accordionItem.className = 'accordion-item';

                // generar id para la cabecera del acordeon
                const accordionHeaderId = `heading-${app._id.toString().replace(/\W/g, '')}`;

                // crear la cabecera h2 del acordeon
                const accordionHeader = document.createElement('h2');
                accordionHeader.className = 'accordion-header';
                accordionHeader.id = accordionHeaderId;

                // crear el boton de la cabecera del acordeon
                const button = document.createElement('button');

                // determinar si es el primer item y el unico para mostrarlo abierto
                const isFirstAndOnlyOne = index === 0 && applications.length === 1;
                button.className = `accordion-button py-2 ${(isFirstAndOnlyOne) ? '' : 'collapsed'}`; 
                button.type = 'button';

                button.setAttribute('data-bs-toggle', 'collapse');

                // generar id para el contenido colapsable
                const collapseId = `collapse-${app._id.toString().replace(/\W/g, '')}`;
                button.setAttribute('data-bs-target', `#${collapseId}`);
                button.setAttribute('aria-expanded', (isFirstAndOnlyOne) ? 'true' : 'false');
                button.setAttribute('aria-controls', collapseId);

                // crear div para nombre adoptante y estado
                const buttonTitleDiv = document.createElement('div');
                buttonTitleDiv.className = 'd-flex justify-content-between align-items-center w-100';

                // crear span para el nombre del adoptante
                const adopterNameSpan = document.createElement('span');
                adopterNameSpan.textContent = app.adopterName;

                // crear badge para el estado de la solicitud
                const statusBadge = createBadge(app.estadoSolicitud, [`status-${app.estadoSolicitud.toLowerCase()}`, 'badge', 'rounded-pill']); 

                buttonTitleDiv.appendChild(adopterNameSpan);

                // si se creo el badge de estado añadirlo
                if (statusBadge) {
                    buttonTitleDiv.appendChild(statusBadge);
                }

                button.appendChild(buttonTitleDiv);
                accordionHeader.appendChild(button);

                // crear el div para el contenido colapsable
                const collapseDiv = document.createElement('div');
                collapseDiv.id = collapseId;
                collapseDiv.className = `accordion-collapse collapse ${(isFirstAndOnlyOne) ? 'show' : ''}`; 
                collapseDiv.setAttribute('aria-labelledby', accordionHeaderId);
                collapseDiv.setAttribute('data-bs-parent', `#${accordionId}`);

                // crear el cuerpo del acordeon
                const accordionBody = document.createElement('div');
                accordionBody.className = 'accordion-body small py-2';

                // crear parrafo para la fecha de solicitud
                const dateP = document.createElement('p');

                // crear etiqueta 'fecha'
                const strongDate = document.createElement('strong'); strongDate.textContent = "Fecha: ";

                dateP.append(strongDate, document.createTextNode(app.formattedApplicationDate));

                // crear parrafo para el contacto del adoptante
                const contactP = document.createElement('p');

                // crear etiqueta 'contacto'
                const strongContact = document.createElement('strong'); strongContact.textContent = 'Contacto: ';

                contactP.append(strongContact, document.createTextNode(app.adopterContact));
                accordionBody.append(dateP, contactP);

                // si hay mensaje del adoptante
                if (app.mensajeAdoptante) {
                    // crear parrafo para el mensaje
                    const messageP = document.createElement('p');

                    // crear etiqueta 'mensaje'
                    const strongMsg = document.createElement('strong'); strongMsg.textContent = 'Mensaje: ';

                    messageP.append(strongMsg, document.createTextNode(`"${app.mensajeAdoptante}"`));
                    
                    messageP.className = 'fst-italic text-secondary mt-1'; 

                    accordionBody.appendChild(messageP);
                }

                // crear enlace para ver/gestionar la solicitud completa
                const linkToApp = document.createElement('a');
                linkToApp.href = `/applications.html?view=received&highlight=${app._id}#application-${app._id}`; // url a la pagina de solicitudes
                linkToApp.className = 'btn btn-sm btn-outline-primary mt-2';
                linkToApp.textContent = 'Ver/Gestionar Solicitud Completa';

                accordionBody.appendChild(linkToApp);
                collapseDiv.appendChild(accordionBody);

                accordionItem.append(accordionHeader, collapseDiv);

                accordionDiv.appendChild(accordionItem);
            });
            accordionWrapper.appendChild(accordionDiv);

            // si no hay solicitudes
        } else {
            // crear mensaje indicando que no hay solicitudes
            const noAppsMsg = document.createElement('p');
            noAppsMsg.className = 'text-muted small text-start';
            noAppsMsg.textContent = 'No hay solicitudes para esta mascota.';

            accordionWrapper.appendChild(noAppsMsg);
        }
    } catch (error) {
        //error
        const errorMsgP = document.createElement('p');
        errorMsgP.className = 'text-danger small text-start';
        errorMsgP.textContent = 'Error al cargar las solicitudes de esta mascota.';

        // si existe el contenedor wrapper añadir el mensaje de error
        if (accordionWrapper) {
            accordionWrapper.appendChild(errorMsgP);
        }
    }
}

/**
 * funcion para actualizar el estado del boton de adoptar
 * @param {string} petStatus - el estado de adopcion de la mascota
 * @param {string|null} protectoraOwnerId - el id del propietario del refugio
 * @param {string|null} [userApplicationStatus=null] - el estado de la solicitud del usuario actual si existe
 */
function updateAdoptButtonState(petStatus, protectoraOwnerId, userApplicationStatus = null) {
    // si no existe el boton de adoptar 
    if (!adoptButton) {
        return;
    }

    const currentUser = Auth.getCurrentUser();
    let isDisabled = false; let text = 'Quiero Adoptar';
    let btnClass = 'btn-danger'; 
    let iconClasses = ['fas', 'fa-heart', 'me-2']; 

    // si el usuario ya tiene una solicitud para esta mascota
    if (userApplicationStatus) {
        text = `Solicitud ${userApplicationStatus}`; 
        isDisabled = true; 
        btnClass = (userApplicationStatus === 'Aprobada' || userApplicationStatus === 'Contactado') ? 'btn-success' : 'btn-info';

        // determinar icono segun estado
        if (userApplicationStatus === 'Pendiente' || userApplicationStatus === 'Rechazada') {
            iconClasses = ['fas', 'fa-hourglass-half', 'me-2'];
        } else {
            iconClasses = ['fas', 'fa-check-circle', 'me-2'];
        }

        // si la mascota no esta disponible para adopcion
    } else if (petStatus !== 'Disponible') {
        text = `Mascota no disponible (${petStatus})`; 
        isDisabled = true; 
        btnClass = 'btn-secondary';
        iconClasses = ['fas', 'fa-ban', 'me-2']; 

        // si no hay usuario logueado
    } else if (!currentUser) {
        text = 'Inicia sesión para adoptar'; 
        isDisabled = true; 
        btnClass = 'btn-info';

        // si el usuario logueado no es un adoptante
    } else if (currentUser.role !== 'Adoptante') {
        text = 'Rol no válido para adoptar'; 
        isDisabled = true; 
        btnClass = 'btn-warning text-dark';

        // si el usuario logueado es el propietario del refugio
    } else if (currentUser._id === protectoraOwnerId) {
        text = 'No puedes adoptar tu mascota'; 
        isDisabled = true; 
        btnClass = 'btn-secondary';
    }

    adoptButton.replaceChildren();

    adoptButton.appendChild(createIcon(iconClasses));
    adoptButton.appendChild(document.createTextNode(` ${text}`));

    adoptButton.className = `btn btn-lg d-block w-100 ${btnClass}`;
    adoptButton.disabled = isDisabled;

    // si el boton no esta deshabilitado guardar el texto original
    if (!isDisabled) {
        adoptButton.dataset.originalText = text;

        // si esta deshabilitado eliminar el texto original guardado
    } else {
        delete adoptButton.dataset.originalText;
    }
}

/**
 * funcion para añadir el event listener al boton de adoptar
 * @param {string} mascotaId - el id de la mascota para la cual se envia la solicitud
 */
function addAdoptButtonListener(mascotaId) {
    const currentAdoptButton = document.getElementById('adoptButton');

    // si no existe el boton o ya tiene un listener o esta deshabilitado 
    if (!currentAdoptButton || currentAdoptButton.dataset.listenerAttached === 'true' || currentAdoptButton.disabled) {
        return;
    }

    currentAdoptButton.dataset.listenerAttached = 'true';

    const originalButtonContentNodes = Array.from(currentAdoptButton.childNodes).map(n => n.cloneNode(true));

    // listener para el evento click
    currentAdoptButton.addEventListener('click', async () => {
        // si no se ha inicializado el selector del area de mensaje
        if (!adoptMessageTextarea) {
            adoptMessageTextarea = document.getElementById('adoptMessage');
        }

        const messageText = adoptMessageTextarea?.value.trim() || "";
        const forbiddenCharsRegex = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

        setButtonLoading(currentAdoptButton, true, []); 
        clearAdoptMessage();

        // si hay mensaje y contiene caracteres no permitidos
        if (messageText && forbiddenCharsRegex.test(messageText)) {
            // error
            showAdoptMessage("El mensaje no debe contener números ni caracteres especiales.", true);
            setButtonLoading(currentAdoptButton, false, originalButtonContentNodes);
            return;
        }

        try {
            const result = await apiService.createApplication(mascotaId, messageText);

            showAdoptMessage(result.message || "¡Solicitud enviada!", false);
            updateAdoptButtonState(null, null, 'Pendiente');
        } catch (error) {
            //error
            showAdoptMessage(`Error: ${error.message}`, true);
            setButtonLoading(currentAdoptButton, false, originalButtonContentNodes);
        }
    });
}

/**
 * funcion para añadir botones de accion para la mascota
 * @param {Pet} petInstance - la instancia de la clase pet
 */
function addPetActionButtons(petInstance) {
    // si no se ha inicializado el contenedor de acciones
    if (!petActionsContainer) {
        petActionsContainer = document.getElementById('petActions');
    }

    const user = Auth.getCurrentUser();
    let buttonsDiv = petActionsContainer?.querySelector('.pet-crud-buttons');

    // si no existe y hay contenedor de acciones crear el div
    if (!buttonsDiv && petActionsContainer) {
        buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'pet-crud-buttons mt-3 d-flex justify-content-end gap-2'; 

        const accordionWrapper = petActionsContainer.querySelector('.applicants-accordion-wrapper');

        // si existe el acordeon insertar los botones antes
        if (accordionWrapper) {
            petActionsContainer.insertBefore(buttonsDiv, accordionWrapper);

            // si no existe añadirlos al final
        } else {
            petActionsContainer.appendChild(buttonsDiv);
        }
    }

    // si existe el div de botones limpiar su contenido
    if (buttonsDiv) {
        while (buttonsDiv.firstChild) {
            buttonsDiv.removeChild(buttonsDiv.firstChild);
        }

        // si no existe el div de botones
    } else {
        return;
    }

    // si no hay usuario logueado o no hay instancia de mascota o la mascota no tiene refugioid
    if (!user || !petInstance || !petInstance.refugioId) {
        return;
    }

    const protectoraOwnerId = petInstance.refugioId instanceof User ? petInstance.refugioId._id : petInstance.refugioId;
    const isOwner = user._id === protectoraOwnerId;
    const isAdmin = user.role === 'Admin';

    // si el usuario es propietario o administrador
    if (isOwner || isAdmin) {
        // crear boton de editar mascota
        const editButton = document.createElement('a'); 
        editButton.href = `/add_pet.html?id=${petInstance._id}`; 
        editButton.className = 'btn btn-outline-primary btn-sm';

        editButton.append(createIcon(['fas', 'fa-edit', 'me-1']), document.createTextNode(' Editar Mascota'));

        buttonsDiv.appendChild(editButton);

        // crear boton de eliminar mascota
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button'; deleteButton.className = 'btn btn-outline-danger btn-sm';

        // definir clases de icono y texto para el boton de eliminar
        const deleteIconClasses = ['fas', 'fa-trash', 'me-1']; const deleteText = ' Eliminar Mascota';
        const deleteButtonOriginalContent = [createIcon(deleteIconClasses), document.createTextNode(deleteText)];

        deleteButton.append(...deleteButtonOriginalContent.map(n => n.cloneNode(true)));

        // si el boton de eliminar aun no tiene un listener anadido
        if (!deleteButton.dataset.listenerAttached) {
            // añadir event listener para el clic
            deleteButton.addEventListener('click', () => 
                handleDeletePet(petInstance._id, petInstance.nombre, deleteButton, 
                    deleteButtonOriginalContent.map(n => n.cloneNode(true))));

            deleteButton.dataset.listenerAttached = 'true';
        }

        buttonsDiv.appendChild(deleteButton);
    }
}

/**
 * funcion asincrona para manejar la eliminacion de una mascota
 * @param {string} mascotaId - el id de la mascota a eliminar
 * @param {string} petName - el nombre de la mascota para el mensaje de confirmacion
 * @param {HTMLButtonElement} buttonElement - el boton de eliminar para gestionar su estado de carga
 * @param {Node[]} originalContentNodes - nodos del contenido original del boton
 */
async function handleDeletePet(mascotaId, petName, buttonElement, originalContentNodes) {
    // pedir confirmacion al usuario
    if (!confirm(`¿Eliminar a ${petName || 'esta mascota'}?\nSe borrarán también sus solicitudes y ya no estará disponible.`)) {
        return;
    }

    // si se proporciono el elemento del boton
    if (buttonElement) {
        setButtonLoading(buttonElement, true, []); 
    }

    try {
        await apiService.deletePet(mascotaId);

        alert(`"${petName || 'Mascota'}" eliminada.`);

        window.location.assign('/animals.html');
    } catch (error) {
        // error
        alert(`Error al eliminar: ${error.message}`);

        // si se proporciono el elemento del boton
        if (buttonElement) {
            setButtonLoading(buttonElement, false, originalContentNodes);
        }
    }
}

/**
 *funcion para mostrar un error en la pagina de detalles de la mascota
 * @param {string} message - el mensaje de error a mostrar
 */
function showPetError(message) {
    // si existe el contenedor principal de detalles
    if (petDetailContent) {
        petDetailContent.replaceChildren();

        // crear un div de alerta 
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger text-center mt-5';
        alertDiv.textContent = `Error: ${message}`;

        petDetailContent.appendChild(alertDiv);
    }

    document.title = 'Error - PawFinder';

    // si existe el elemento del breadcrumb para el nombre
    if (breadcrumbPetName) {
        breadcrumbPetName.textContent = 'Error';
    }

}

/**
 * funcion para mostrar el estado de carga
 */
function showPetLoading() {
    // si no existe el contenedor principal 
    if (!petDetailContent) {
        return;
    }

    // crear div para la fila de placeholders
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'row g-5 placeholder-glow'; 

    // crear columna para el placeholder de la imagen
    const imgCol = document.createElement('div');
    imgCol.className = 'col-md-7';

    // crear placeholder para la imagen
    const imgPh = document.createElement('div');
    imgPh.className = 'placeholder bg-secondary w-100 rounded mb-3';
    imgPh.style.height = '400px'; 

    imgCol.appendChild(imgPh);

    // crear columna para los placeholders de detalles
    const detailCol = document.createElement('div');
    detailCol.className = 'col-md-5';

    // crear placeholder para el titulo h1 (nombre)
    const h1Ph = document.createElement('h1');
    h1Ph.className = 'mb-2 placeholder col-8';

    // crear placeholder para los badges
    const badgesPh = document.createElement('div');
    badgesPh.className = 'mb-3 placeholder col-12';
    badgesPh.style.height = '2rem'; 

    // crear placeholder para el titulo de la descripcion
    const h4PhDesc = document.createElement('h4');
    h4PhDesc.className = 'mt-4 placeholder col-4';

    // crear placeholders para los parrafos de la descripcion
    const pDescPh1 = document.createElement('p');
    pDescPh1.className = 'placeholder col-12';

    const pDescPh2 = document.createElement('p');
    pDescPh2.className = 'placeholder col-11';

    // crear placeholder para la tarjeta de la protectora
    const cardPh = document.createElement('div');
    cardPh.className = 'card mt-4 bg-light border-0 placeholder-glow';

    // crear placeholder para el cuerpo de la tarjeta
    const cardBodyPh = document.createElement('div');
    cardBodyPh.className = 'card-body p-3';

    // crear placeholder para el titulo de la protectora
    const h5PhProtectora = document.createElement('h5');
    h5PhProtectora.className = 'card-title placeholder col-6 mb-3';

    // crear placeholders para los parrafos de la tarjeta
    const p1CardPh = document.createElement('p');
    p1CardPh.className = 'card-text placeholder col-8 mb-1';

    const p2CardPh = document.createElement('p');
    p2CardPh.className = 'card-text placeholder col-10 mb-1';

    // crear placeholder para el contenedor del mapa
    const mapContainerPh = document.createElement('div');
    mapContainerPh.className = 'mt-3 rounded border placeholder bg-light';
    mapContainerPh.style.height = '250px'; 

    cardBodyPh.append(h5PhProtectora, p1CardPh, p2CardPh, mapContainerPh);
    cardPh.appendChild(cardBodyPh);

    // crear placeholder para el div del boton de adoptar
    const btnDivPh = document.createElement('div');
    btnDivPh.className = 'd-grid mt-4';

    // crear placeholder para el boton de adoptar
    const btnPh = document.createElement('button');
    btnPh.className = 'btn btn-secondary btn-lg disabled placeholder col-12';

    btnDivPh.appendChild(btnPh);

    detailCol.append(h1Ph, badgesPh, h4PhDesc, pDescPh1, pDescPh2, cardPh, btnDivPh);
    loadingDiv.append(imgCol, detailCol);

    petDetailContent.replaceChildren(loadingDiv);

    // si existe el elemento del breadcrumb para el nombre
    if (breadcrumbPetName) {
        breadcrumbPetName.textContent = 'Cargando...';
    }

    document.title = 'Cargando Mascota... - PawFinder';
}

// listener
document.addEventListener('DOMContentLoaded', async () => {
    // si no existe el contenedor principal de detalles
    if (!petDetailContent) {
        const body = document.body || document.getElementsByTagName('body')[0];

        // si existe el body
        if (body) {
            // limpiar todo el contenido del body
            while (body.firstChild) {
                body.removeChild(body.firstChild);
            }

            // crear un contenedor para el mensaje de error
            const errorContainer = document.createElement('div');
            errorContainer.className = 'container mt-5';

            // crear un div de alerta
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger text-center';
            alertDiv.setAttribute('role', 'alert');
            alertDiv.textContent = "Error crítico: La estructura de la página no es correcta."; // mensaje de error

            errorContainer.appendChild(alertDiv);
            body.appendChild(errorContainer);
        }

        return;
    }

    showPetLoading();

    const urlParams = new URLSearchParams(window.location.search);
    const mascotaId = urlParams.get('id');

    // si no se encontro id de mascota
    if (!mascotaId) {
        // error 
        showPetError("ID de mascota no encontrado en la URL."); 
        return;
    }

    try {
        const petAPIResult = await apiService.getPetById(mascotaId);
        const petDataObject = petAPIResult.data || petAPIResult;

        // si se obtuvieron datos y tienen un id
        if (petDataObject && petDataObject._id) {
            const petInstance = new Pet(petDataObject);

            await populatePetDetails(petInstance);

            // si no se encontraron datos para el id
        } else {
            // error
            throw new Error(`No se encontraron detalles para la mascota con ID ${mascotaId}.`);
        }

    } catch (error) {
        // error 
        showPetError(`Error al cargar los datos de la mascota: ${error.message}`);
    }
});