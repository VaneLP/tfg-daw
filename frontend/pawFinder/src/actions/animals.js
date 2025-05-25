import { apiService } from '../service/api-service.js';
import { Pet } from '../model/Pet.class.js';

// DOM
const resultsGrid = document.getElementById('animalResultsGrid');
const resultsInfo = document.getElementById('resultsInfo');
const filterForm = document.getElementById('filterForm');
const resetFiltersButton = document.getElementById('resetFilters');
const paginationContainer = document.getElementById('paginationContainerAnimals');

let currentPageAnimals = 1;
const animalsPerPage = 6;

/**
 * funcion para crear un icono
 * @param {string[]} [classes=[]] - un array de clases css para el icono
 * @returns {HTMLElement} - el elemento icono creado
 */
function createIcon(classes = []) {
    // crear un elemento <i>
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
 * funcion para crear el elemento de tarjeta de mascota
 * @param {Pet} petInstance - la instancia de la clase pet con los datos
 * @returns {HTMLElement} - el elemento de columna (col) que contiene la tarjeta
 */
function createPetCardElement(petInstance) {
    // crear elemento de columna 
    const col = document.createElement('div');
    col.className = 'col';

    // crear elemento de tarjeta 
    const card = document.createElement('div');
    card.className = 'card h-100 shadow-sm';

    // crear elemento de imagen para la tarjeta
    const img = document.createElement('img');
    img.className = 'card-img-top pet-card-img'; 
    img.src = petInstance.mainPhoto; 
    img.alt = petInstance.nombre; 

    // crear cuerpo de la tarjeta
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body d-flex flex-column';

    // crear titulo de la tarjeta (nombre de la mascota)
    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = petInstance.nombre;

    // crear parrafo para detalles basicos 1 (especie genero edad)
    const details1 = document.createElement('p');
    details1.className = 'card-text text-muted small mb-1';

    details1.append(
        createIcon(['fas', 'fa-paw', 'me-1']), document.createTextNode(`${petInstance.especie} | `), 
        createIcon(['fas', petInstance.genero === 'Macho' ? 'fa-mars' : 'fa-venus', 'mx-1']), document.createTextNode(`${petInstance.genero} | `),
        createIcon(['fas', 'fa-birthday-cake', 'mx-1']), document.createTextNode(`${petInstance.edad}`) 
    );

    // crear parrafo
    const details2 = document.createElement('p');
    details2.className = 'card-text text-muted small mb-2';

    // crear enlace (boton) para ver detalles de la mascota
    const link = document.createElement('a');
    link.className = 'btn btn-outline-primary mt-auto align-self-start btn-sm'; 
    link.href = `/animal_detail.html?id=${petInstance._id}`; 
    link.textContent = 'Ver Detalles';

    cardBody.append(title, details1, details2, link);
    card.append(img, cardBody);

    // si la mascota tiene un nombre de refugio valido
    if (petInstance.refugioName && petInstance.refugioName !== 'Refugio Desconocido') {
        // crear pie de tarjeta
        const footer = document.createElement('div');
        footer.className = 'card-footer text-muted small';
        footer.textContent = `Por: ${petInstance.refugioName}`; 

        card.appendChild(footer);
    }

    col.appendChild(card);

    return col;
}

/**
 * funcion para renderizar la paginacion
 * @param {HTMLElement} container - el elemento contenedor para la paginacion
 * @param {object} paginationData - datos de paginacion (totalpages currentpage etc)
 * @param {function} fetchFunction - la funcion a llamar cuando se cambia de pagina
 */
function renderPagination(container, paginationData, fetchFunction) {
    // limpiar contenido previo del contenedor
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // si no hay datos de paginacion o solo hay una pagina no mostrar paginacion
    if (!paginationData || paginationData.totalPages <= 1) {
        return;
    }

    // crear elemento nav para la paginacion
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Paginación de resultados');

    // crear lista ul para los items de paginacion
    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';

    // crear item 'anterior'
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${paginationData.currentPage === 1 ? 'disabled' : ''}`;

    // crear enlace 'anterior'
    const prevA = document.createElement('a');
    prevA.className = 'page-link';
    prevA.href = '#'; 
    prevA.textContent = 'Anterior';

    // añadir event listener para ir a la pagina anterior
    prevA.addEventListener('click', (e) => {
        e.preventDefault(); 
        // si no es la primera pagina
        if (paginationData.currentPage > 1) {
            const currentFilters = getCurrentFilters();
            fetchFunction(paginationData.currentPage - 1, currentFilters);
        }
    });

    prevLi.appendChild(prevA);
    ul.appendChild(prevLi);

    // crear items para cada numero de pagina
    for (let i = 1; i <= paginationData.totalPages; i++) {
        // crear item de pagina
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === paginationData.currentPage ? 'active' : ''}`; 

        // crear enlace de pagina
        const pageA = document.createElement('a');
        pageA.className = 'page-link';
        pageA.href = '#';
        pageA.textContent = i; 

        // añadir event listener para ir a la pagina i
        pageA.addEventListener('click', (e) => {
            e.preventDefault();
            // si no es la pagina actual
            if (i !== paginationData.currentPage) {
                const currentFilters = getCurrentFilters();
                fetchFunction(i, currentFilters);
            }
        });

        pageLi.appendChild(pageA);
        ul.appendChild(pageLi);
    }

    // crear item 'siguiente'
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${paginationData.currentPage === paginationData.totalPages ? 'disabled' : ''}`; 

    // crear enlace 'siguiente'
    const nextA = document.createElement('a');
    nextA.className = 'page-link';
    nextA.href = '#';
    nextA.textContent = 'Siguiente';

    // añadir event listener para ir a la pagina siguiente
    nextA.addEventListener('click', (e) => {
        e.preventDefault();
        // si no es la ultima pagina
        if (paginationData.currentPage < paginationData.totalPages) {
            const currentFilters = getCurrentFilters();
            fetchFunction(paginationData.currentPage + 1, currentFilters);
        }
    });

    nextLi.appendChild(nextA);
    ul.appendChild(nextLi);
    nav.appendChild(ul);
    container.appendChild(nav);
}

/**
 * funcion asincrona para obtener y renderizar animales
 * @param {number} [page=1] - el numero de pagina a obtener
 * @param {object} [existingFilters={}] - un objeto con los filtros actuales a aplicar
 */
async function fetchAndRenderAnimals(page = 1, existingFilters = {}) {
    showLoadingState();
    currentPageAnimals = page;

    const params = {
        ...existingFilters, 
        page: currentPageAnimals, 
        limit: animalsPerPage 
    };

    try {
        const result = await apiService.getPets(params);

        // si el resultado es valido y contiene datos y paginacion
        if (result && result.data && result.pagination) {
            const petInstances = result.data.map(petData => new Pet(petData));

            renderAnimals(petInstances, result.pagination);

        // si no hay datos validos
        } else {
            renderAnimals([], null);
        }
    } catch (error) {
        // error
        showErrorState(error.message || "Error desconocido del servidor");
    }
}

/**
 * funcion para renderizar los animales
 * @param {Pet[]} [petInstances=[]] - un array de instancias de pet
 * @param {object|null} [paginationData=null] - datos de paginacion
 */
// 
function renderAnimals(petInstances = [], paginationData = null) {
    // limpiar contenido previo de la cuadricula de resultados
    while (resultsGrid.firstChild) {
        resultsGrid.removeChild(resultsGrid.firstChild);
    }

    // si existe el elemento para informacion de resultados
    if (resultsInfo) {
        // si hay datos de paginacion y mas de 0 items totales
        if (paginationData && paginationData.totalItems > 0) {
            // mostrar informacion detallada de paginacion
            resultsInfo.textContent = `Mostrando ${petInstances.length} de ${paginationData.totalItems} mascota(s). Página ${paginationData.currentPage} de ${paginationData.totalPages}.`;

        // si solo hay instancias de mascotas pero no datos de paginacion completos
        } else if (petInstances.length > 0) {
            // mostrar solo el numero de mascotas mostradas
            resultsInfo.textContent = `Mostrando ${petInstances.length} mascota(s).`;

        // si no hay mascotas ni datos de paginacion
        } else {
            // mostrar mensaje de no encontrados
            resultsInfo.textContent = 'No se encontraron mascotas con los criterios seleccionados.';
        }
    }

    // si no hay instancias de mascotas para mostrar
    if (petInstances.length === 0) {
        // crear un parrafo indicando que no se encontraron mascotas
        const p = document.createElement('p');
        p.className = 'text-center text-muted mt-4 col-12';
        p.textContent = 'No se encontraron mascotas que coincidan con tu búsqueda.';

        resultsGrid.appendChild(p);

    // si hay mascotas para mostrar
    } else {
        // iterar sobre cada instancia de mascota
        petInstances.forEach(petInstance => {
            // crear el elemento de tarjeta para la mascota
            const card = createPetCardElement(petInstance);

            // si se creo la tarjeta añadirla a la cuadricula
            if (card) {
                resultsGrid.appendChild(card);
            }
        });
    }

    // si existe el contenedor de paginacion y hay datos de paginacion
    if (paginationContainer && paginationData) {
        renderPagination(paginationContainer, paginationData, fetchAndRenderAnimals);

    // si existe el contenedor de paginacion pero no hay datos (limpiar paginacion previa)
    } else if (paginationContainer) {
        // limpiar contenido del contenedor de paginacion
        while (paginationContainer.firstChild) {
            paginationContainer.removeChild(paginationContainer.firstChild);
        }
    }
}

/**
 * funcion para mostrar el estado de carga
 */
function showLoadingState() {
    // si existe el elemento para informacion de resultados
    if (resultsInfo) {
        resultsInfo.textContent = 'Buscando...';
    }

    // si existe la cuadricula de resultados
    if (resultsGrid) {
        // limpiar contenido previo
        while (resultsGrid.firstChild) {
            resultsGrid.removeChild(resultsGrid.firstChild);
        }

        // crear div para el indicador de carga
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'col-12 text-center py-5';

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
        // añadir div de carga a la cuadricula
        resultsGrid.appendChild(loadingDiv);
    }

    // si existe el contenedor de paginacion limpiarlo
    if (paginationContainer) {
        while (paginationContainer.firstChild) {
            paginationContainer.removeChild(paginationContainer.firstChild);
        }
    }
}

/**
 * funcion para mostrar un estado de error
 * @param {string} message - el mensaje de error a mostrar
 */
function showErrorState(message) {
    // si existe el elemento para informacion de resultados limpiarlo
    if (resultsInfo) {
        resultsInfo.textContent = '';
    }

    // si existe la cuadricula de resultados
    if (resultsGrid) {
        // limpiar contenido previo
        while (resultsGrid.firstChild) {
            resultsGrid.removeChild(resultsGrid.firstChild);
        }

        // crear div para el mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'col-12';

        // crear parrafo para el mensaje de error
        const p = document.createElement('p');
        p.className = 'text-danger text-center mt-4';
        p.textContent = `Error al cargar mascotas: ${message}`; 

        // añadir parrafo al div de error y el div a la cuadricula
        errorDiv.appendChild(p);
        resultsGrid.appendChild(errorDiv);
    }
}

/**
 * funcion para obtener los filtros actuales del formulario
 * @returns {object} - un objeto con los parametros de filtro
 */
function getCurrentFilters() {
    const formData = new FormData(filterForm);
    const params = {};

    // iterar sobre las entradas del formdata
    for (let [key, value] of formData.entries()) {
        // si el valor no esta vacio
        if (value) {
            // añadir par clave-valor a los parametros
            params[key] = value;
        }
    }

    return params;
}

// listener formulario de filtros 
filterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    currentPageAnimals = 1;

    const currentFilters = getCurrentFilters();

    fetchAndRenderAnimals(currentPageAnimals, currentFilters);
});

// añadir event listener al boton de resetear filtros
resetFiltersButton?.addEventListener('click', () => {
    filterForm?.reset();

    currentPageAnimals = 1;

    fetchAndRenderAnimals(currentPageAnimals, {});
});

// listener
document.addEventListener('DOMContentLoaded', () => {
    // si no existe la cuadricula de resultados o el formulario de filtros
    if (!resultsGrid || !filterForm) {
        const body = document.body || document.getElementsByTagName('body')[0];

        // si existe el body y no existe la cuadricula (error de estructura)
        if (body && !resultsGrid) {
            // crear mensaje de error critico
            const errorMsg = document.createElement('p');
            errorMsg.textContent = "Error crítico: La estructura de la página no es correcta para inicializar el script de animales.";
            errorMsg.className = "alert alert-danger m-3";

            body.insertBefore(errorMsg, body.firstChild);
        }

        return;
    }

    fetchAndRenderAnimals(currentPageAnimals, {});
});