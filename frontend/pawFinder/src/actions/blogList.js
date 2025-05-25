import { apiService } from '../service/api-service.js';
import { Auth } from '../service/auth-service.js';
import { BlogPost } from '../model/BlogPost.class.js';

// DOM
const postsContainer = document.getElementById('blogPostsContainer');
const newPostButton = document.getElementById('newPostButton');
const paginationContainerBlog = document.getElementById('paginationContainerBlog');

let currentPageBlog = 1;
const postsPerPage = 4;

/**
 * funcion para crear el elemento de una entrada de blog
 * @param {BlogPost} postInstance - la instancia de la clase blogpost con los datos
 * @returns {HTMLElement} - el elemento article que representa la entrada del blog
 */
function createBlogPostElement(postInstance) {
    // crear elemento article para la entrada
    const article = document.createElement('article');
    article.className = 'blog-post mb-4';

    // crear tarjeta (card)
    const card = document.createElement('div');
    card.className = 'card shadow-sm overflow-hidden';

    // crear fila (row)
    const row = document.createElement('div');
    row.className = 'row g-0'; 

    // crear columna para el texto
    const textCol = document.createElement('div');
    textCol.className = 'col p-4 d-flex flex-column position-static'; 

    // crear titulo h3 para la entrada
    const titleH3 = document.createElement('h3');
    titleH3.className = 'mb-1 h4'; 
    
    // crear enlace para el titulo
    const titleLink = document.createElement('a');
    titleLink.className = 'text-dark text-decoration-none stretched-link'; 
    titleLink.href = `/blog_detail.html?id=${postInstance._id}`; 
    titleLink.textContent = postInstance.titulo; 
    
    titleH3.appendChild(titleLink);
    textCol.appendChild(titleH3);

    // crear div para metadatos (fecha y autor)
    const metaDiv = document.createElement('div');
    metaDiv.className = 'mb-2 text-muted small'; 
    metaDiv.textContent = `${postInstance.formattedPublicationDate} por ${postInstance.authorName}`; 
    
    textCol.appendChild(metaDiv);

    // crear parrafo para el extracto del contenido
    const excerptP = document.createElement('p');
    excerptP.className = 'card-text mb-auto flex-grow-1'; 
    excerptP.textContent = postInstance.excerpt; 
    
    textCol.appendChild(excerptP);

    // crear div para el enlace 'continuar leyendo'
    const continueReadingDiv = document.createElement('div');
    continueReadingDiv.className = 'mt-3';
    
    // crear enlace 'continuar leyendo'
    const continueReadingLink = document.createElement('a');
    continueReadingLink.href = `/blog_detail.html?id=${postInstance._id}`; 
    continueReadingLink.className = 'btn btn-sm btn-outline-primary';
    continueReadingLink.textContent = 'Continuar leyendo →'; 

    continueReadingDiv.appendChild(continueReadingLink);
    textCol.appendChild(continueReadingDiv);
    row.appendChild(textCol); 

    // si la entrada tiene imagen destacada y no es el placeholder
    if (postInstance.imagenDestacada && postInstance.imagenDestacada !== '/img/placeholder-blog.png') {
        textCol.classList.remove('col');
        textCol.classList.add('col-md-7');

        // crear columna para la imagen
        const imgCol = document.createElement('div');
        imgCol.className = 'col-md-5 d-none d-md-block'; 

        // crear enlace alrededor de la imagen
        const imgLink = document.createElement('a'); 
        imgLink.href = `/blog_detail.html?id=${postInstance._id}`;

        // crear elemento de imagen
        const img = document.createElement('img');
        img.className = 'img-fluid'; 
        img.src = postInstance.imagenDestacada; 
        img.alt = postInstance.titulo; 
        img.style.height = '250px'; 
        img.style.width = '100%';  
        img.style.objectFit = 'cover'; 

        imgLink.appendChild(img);
        imgCol.appendChild(imgLink);
        row.appendChild(imgCol); 
    }

    card.appendChild(row);
    article.appendChild(card);

    return article;

}

/**
 * funcion para renderizar las entradas del blog
 * @param {BlogPost[]} [postInstances=[]] - un array de instancias de blogpost
 * @param {object|null} [paginationData=null] - datos de paginacion (totalpages currentpage etc)
 */
function renderBlogPosts(postInstances = [], paginationData = null) {
    // limpiar contenido previo del contenedor de entradas
    while (postsContainer.firstChild) {
        postsContainer.removeChild(postsContainer.firstChild);
    }

    // asegurar que postinstances sea un array
    if (!Array.isArray(postInstances)) {
        postInstances = [];
    }

    // si no hay entradas para mostrar
    if (postInstances.length === 0) {
        // crear un parrafo indicando que no hay entradas
        const p = document.createElement('p');
        p.className = 'text-center text-muted mt-4';

        // si hay datos de paginacion y el total de items es 0
        if (paginationData && paginationData.totalItems === 0) {
            p.textContent = 'No hay artículos publicados en el blog por el momento.';

        // si no hay datos de paginacion o totalitems no es 0 
        } else {
            p.textContent = 'No se encontraron más artículos.';
        }

        postsContainer.appendChild(p);

    // si hay entradas para mostrar
    } else {
        // iterar sobre cada instancia de entrada
        postInstances.forEach(post => {
            // crear el elemento dom para la entrada
            const articleElement = createBlogPostElement(post);
            // añadir elemento al contenedor
            postsContainer.appendChild(articleElement);
        });
    }

    // si existe el contenedor de paginacion y hay datos de paginacion
    if (paginationContainerBlog && paginationData) {
        renderPaginationBlog(paginationContainerBlog, paginationData, fetchAndRenderBlogPosts);

    // si existe el contenedor de paginacion pero no hay datos (limpiar paginacion previa)
    } else if (paginationContainerBlog) {
        // limpiar contenido del contenedor de paginacion
        while (paginationContainerBlog.firstChild) {
            paginationContainerBlog.removeChild(paginationContainerBlog.firstChild);
        }
    }
}

/**
 * funcion para mostrar el estado de carga del blog
 */
function showBlogLoading() {
    // si no existe el contenedor de entradas 
    if (!postsContainer) {
        return;
    }

    // limpiar contenido previo del contenedor
    while (postsContainer.firstChild) {
        postsContainer.removeChild(postsContainer.firstChild);
    }

    // crear un article 
    const placeholderArticle = document.createElement('article');
    placeholderArticle.className = 'blog-post mb-5 placeholder-glow';

    // crear fila 
    const placeholderRow = document.createElement('div');
    placeholderRow.className = 'row g-0 border rounded overflow-hidden flex-md-row shadow-sm h-md-250 position-relative';

    // crear columna de texto 
    const textColPh = document.createElement('div');
    textColPh.className = 'col p-4 d-flex flex-column position-static';

    // crear titulo
    const titlePh = document.createElement('h3');
    titlePh.className = 'mb-1 placeholder col-8';

    // crear metadatos
    const metaPh = document.createElement('div');
    metaPh.className = 'mb-1 text-muted placeholder placeholder-sm col-5';

    // crear parrafos 
    const excPhP1 = document.createElement('p');
    excPhP1.className = 'placeholder placeholder-sm col-12';
    const excPhP2 = document.createElement('p');
    excPhP2.className = 'placeholder placeholder-sm col-11 mb-auto';

    // crear el enlace 'continuar leyendo'
    const linkPh = document.createElement('a');
    linkPh.tabIndex = -1; 
    linkPh.className = 'stretched-link link-secondary disabled placeholder col-4 mt-2';

    textColPh.append(titlePh, metaPh, excPhP1, excPhP2, linkPh);

    // crear columna de imagen 
    const imgColPh = document.createElement('div');
    imgColPh.className = 'col-auto d-none d-lg-block';

    // crear  la imagen
    const imgPh = document.createElement('div');
    imgPh.className = 'placeholder bg-secondary';
    imgPh.style.width = '200px'; 
    imgPh.style.height = '250px';

    imgColPh.appendChild(imgPh);
    placeholderRow.append(textColPh, imgColPh);
    placeholderArticle.appendChild(placeholderRow);
    postsContainer.replaceChildren(placeholderArticle);

    // si existe el contenedor de paginacion limpiarlo
    if (paginationContainerBlog) {
        while (paginationContainerBlog.firstChild) {
            paginationContainerBlog.removeChild(paginationContainerBlog.firstChild);
        }
    }
}

/**
 * funcion para mostrar un error en el blog
 * @param {string} message - el mensaje de error a mostrar
 */
function showBlogError(message) {
    // si no existe el contenedor de entradas 
    if (!postsContainer) {
        return;
    }

    // limpiar contenido previo del contenedor
    while (postsContainer.firstChild) {
        postsContainer.removeChild(postsContainer.firstChild);
    }

    // crear un parrafo para el mensaje de error
    const p = document.createElement('p');
    p.className = 'text-danger text-center mt-4';
    p.textContent = `Error al cargar el blog: ${message}`; 

    postsContainer.appendChild(p);
}

/**
 * funcion para verificar si se muestra el boton de nueva entrada
 */
function checkShowNewPostButton() {
    const user = Auth.getCurrentUser();

    // si existe el boton de nueva entrada
    if (newPostButton) {
        // si hay usuario y su rol es refugio o admin
        if (user && ['Refugio', 'Admin'].includes(user.role)) {
            newPostButton.classList.remove('d-none');

        // si no cumple las condiciones
        } else {
            newPostButton.classList.add('d-none');
        }
    }
}

/**
 * funcion asincrona para obtener y renderizar las entradas del blog
 * @param {number} [page=1] - el numero de pagina a obtener
 */
async function fetchAndRenderBlogPosts(page = 1) {
    showBlogLoading();

    currentPageBlog = page;

    try {
        const result = await apiService.getBlogPosts({ page: currentPageBlog, limit: postsPerPage });
        const postsData = result.data || result;
        const paginationInfo = result.pagination;

        // si hay datos de entradas y es un array y hay informacion de paginacion
        if (postsData && Array.isArray(postsData) && paginationInfo) {
            const postInstances = postsData.map(postData => new BlogPost(postData));
            renderBlogPosts(postInstances, paginationInfo);

        // si no hay datos validos
        } else {
            renderBlogPosts([], null);
        }

    } catch (error) {
        //error
        showBlogError(error.message || "Error desconocido del servidor");
    }
}

/**
 * funcion para renderizar la paginacion del blog
 * @param {HTMLElement} container - el elemento contenedor para la paginacion
 * @param {object} paginationData - datos de paginacion (totalpages currentpage etc)
 * @param {function} fetchFunction - la funcion a llamar cuando se cambia de pagina
 */
function renderPaginationBlog(container, paginationData, fetchFunction) {
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
    nav.setAttribute('aria-label', 'Paginación de artículos del blog'); 

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
        e.preventDefault(); // prevenir comportamiento por defecto
        // si no es la primera pagina
        if (paginationData.currentPage > 1) {
            // llamar a la funcion para obtener la pagina anterior
            fetchFunction(paginationData.currentPage - 1);
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
                // llamar a la funcion para obtener la pagina i
                fetchFunction(i);
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
            // llamar a la funcion para obtener la pagina siguiente
            fetchFunction(paginationData.currentPage + 1);
        }
    });

    nextLi.appendChild(nextA);
    ul.appendChild(nextLi);
    nav.appendChild(ul);
    container.appendChild(nav);
}

// listener
document.addEventListener('DOMContentLoaded', () => {
    // si no existe el contenedor de entradas 
    if (!postsContainer) {
        return;
    }

    fetchAndRenderBlogPosts(1);
    checkShowNewPostButton();
});