import { apiService } from '../service/api-service.js';
import { Auth } from '../service/auth-service.js';
import { BlogPost } from '../model/BlogPost.class.js';
import { User } from '../model/User.class.js';

const contentContainer = document.getElementById('blogDetailContent');
const currentUser = Auth.getCurrentUser();

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
 * funcion para crear un badge
 * @param {string} text - el texto del badge
 * @param {string[]} [classes=['bg-secondary', 'me-1']] - un array de clases css para el badge
 * @returns {HTMLElement|null} - el elemento badge creado o null si no se proporciona texto
 */
function createBadge(text, classes = ['bg-secondary', 'me-1']) {
    // si no hay texto devolver null
    if (!text) {
        // devolver nulo
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

    badge.textContent = text;

    return badge;
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

        button.replaceChildren(spinner, document.createTextNode(' Procesando...'));

    // si isLoading es falso 
    } else {
        button.disabled = false;

        button.replaceChildren(...originalContentNodes);
    }
}

/**
 * funcion para renderizar la entrada del blog
 * @param {BlogPost} postInstance - la instancia de la clase blogpost con los datos
 */
function renderPost(postInstance) {
    // si no existe el contenedor o la instancia de la entrada es invalida
    if (!contentContainer || !postInstance) {
        // error 
        showError("No se pudo cargar el contenido del artículo o datos inválidos.");
        return;
    }

    document.title = `${postInstance.titulo} - PawFinder`;
    
    // limpiar contenido previo del contenedor
    while (contentContainer.firstChild) {
        contentContainer.removeChild(contentContainer.firstChild);
    }

    // crear un fragmento de documento
    const fragment = document.createDocumentFragment();

    // crear titulo h1 para la entrada
    const titleH1 = document.createElement('h1');
    titleH1.id = 'postTitle'; 
    titleH1.className = 'mb-2 display-4 fw-bold'; 
    titleH1.textContent = postInstance.titulo; 
    
    fragment.appendChild(titleH1);

    // crear parrafo para metadatos (fecha autor)
    const metaP = document.createElement('p');
    metaP.className = 'text-muted border-bottom pb-3 mb-4'; 
    
    // crear span para la fecha de publicacion
    const dateSpan = document.createElement('span');
    dateSpan.id = 'postDate';
    dateSpan.textContent = postInstance.formattedPublicationDate; 
    
    // crear span para el nombre del autor
    const authorSpan = document.createElement('span');
    authorSpan.id = 'postAuthor';
    authorSpan.className = 'fw-bold'; 
    authorSpan.textContent = postInstance.authorName; 

    // añadir texto y spans de fecha y autor al parrafo de metadatos
    metaP.append(
        document.createTextNode(`Publicado el `),
        dateSpan,
        document.createTextNode(` por `),
        authorSpan
    );

    // si el autor es una instancia de user y tiene rol
    if (postInstance.autorId instanceof User && postInstance.autorId.role) {
        metaP.appendChild(document.createTextNode(` `)); 
        const roleBadge = createBadge(postInstance.autorId.role, ['bg-info', 'ms-2', 'text-dark', 'badge', 'rounded-pill']);
        
        if (roleBadge) {
            metaP.appendChild(roleBadge); 
        }
    }
    fragment.appendChild(metaP);

    // si la entrada tiene imagen destacada y no es el placeholder
    if (postInstance.imagenDestacada && postInstance.imagenDestacada !== '/img/placeholder-blog.png') {
        // crear elemento de imagen
        const img = document.createElement('img');
        img.id = 'postImage';
        img.src = postInstance.imagenDestacada; 
        img.className = 'img-fluid rounded mb-4 w-100 shadow-sm'; 
        img.style.maxHeight = '450px'; 
        img.style.objectFit = 'cover'; 
        img.alt = `Imagen de ${postInstance.titulo}`; 

        fragment.appendChild(img);
    }

    // crear div para el contenido principal de la entrada
    const contentDiv = document.createElement('div');
    contentDiv.id = 'postContent';
    contentDiv.className = 'blog-content-style mt-4'; 
    contentDiv.textContent = postInstance.contenido; 

    fragment.appendChild(contentDiv);

    // crear separador horizontal
    const hr = document.createElement('hr');
    hr.className = 'my-4'; 
    
    fragment.appendChild(hr);

    // crear contenedor para todas las acciones (volver editar eliminar)
    const allActionsContainer = document.createElement('div');
    allActionsContainer.className = 'd-flex justify-content-between align-items-center mt-4'; 
    
    // crear boton para volver al listado del blog
    const backButton = document.createElement('a');
    backButton.href = '/blog.html'; 
    backButton.className = 'btn btn-outline-secondary btn-sm';

    backButton.append(createIcon(['fas', 'fa-arrow-left', 'me-1']), document.createTextNode(' Volver al Blog'));
    
    // crear div para los botones de editar y eliminar
    const editDeleteActionsDiv = document.createElement('div');
    editDeleteActionsDiv.id = 'postActions'; 
    editDeleteActionsDiv.className = 'd-flex gap-2'; 

    allActionsContainer.append(backButton, editDeleteActionsDiv);
    fragment.appendChild(allActionsContainer);
    contentContainer.appendChild(fragment);

    addPostActionButtons(postInstance); 
}

/**
 * funcion para añadir botones de accion a la entrada
 * @param {BlogPost} postInstance - la instancia de la clase blogpost
 */
// 
function addPostActionButtons(postInstance) {
    const actionsContainer = document.getElementById('postActions');

    // si no existe el contenedor o no hay usuario logueado o no hay instancia de entrada o no hay autorid 
    if (!actionsContainer || !currentUser || !postInstance || !postInstance.autorId) {
        return;
    }

    const authorObjectId = postInstance.autorId instanceof User ? postInstance.autorId._id : postInstance.autorId;
    const isAuthor = currentUser._id === authorObjectId;
    const isAdmin = currentUser.role === 'Admin';

    actionsContainer.replaceChildren();

    // si el usuario es autor o administrador
    if (isAuthor || isAdmin) {
        // crear boton de editar
        const editButton = document.createElement('a'); 
        editButton.href = `/add_edit_blog.html?id=${postInstance._id}`; 
        editButton.className = 'btn btn-outline-primary btn-sm';
        editButton.append(createIcon(['fas', 'fa-edit', 'me-1']), document.createTextNode(' Editar'));

        actionsContainer.appendChild(editButton);

        // crear boton de eliminar
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn btn-outline-danger btn-sm';

        deleteButton.append(createIcon(['fas', 'fa-trash', 'me-1']), document.createTextNode(' Eliminar'));

        // si el boton de eliminar aun no tiene un listener anadido
        if (!deleteButton.dataset.listenerAttached) {
            deleteButton.addEventListener('click', () => handleDeletePost(postInstance._id, postInstance.titulo));
            deleteButton.dataset.listenerAttached = 'true';
        }

        actionsContainer.appendChild(deleteButton);
    }
}

/**
 * funcion asincrona para manejar la eliminacion de una entrada
 * @param {string} postId - el id de la entrada a eliminar
 * @param {string} postTitle - el titulo de la entrada para el mensaje de confirmacion
 */
async function handleDeletePost(postId, postTitle) {
    // pedir confirmacion al usuario
    if (!confirm(`¿Estás seguro de que quieres eliminar el artículo "${postTitle || 'seleccionado'}"?\nEsta acción no se puede deshacer.`)) {
        return;
    }

    const actionsContainer = document.getElementById('postActions');
    const deleteButton = actionsContainer?.querySelector('.btn-outline-danger');
    const originalContent = deleteButton ? Array.from(deleteButton.childNodes) : [];

    // si existe el boton de eliminar
    if (deleteButton) {
        setButtonLoading(deleteButton, true, []);
    }

    try {
        const result = await apiService.deleteBlogPost(postId);

        alert(result.message || "Artículo eliminado correctamente.");

        window.location.assign('/blog.html');
    } catch (error) {
        // error
        alert(`Error al eliminar el artículo: ${error.message}`);

        // si existe el boton de eliminar
        if (deleteButton) {
            setButtonLoading(deleteButton, false, originalContent);
        }
    }
}

/**
 * funcion para mostrar un error en la pagina
 * @param {string} message - el mensaje de error a mostrar
 */
function showError(message) {
    // si existe el contenedor principal
    if (contentContainer) {
        // crear un div de alerta 
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger text-center mt-5';
        errorAlert.textContent = `Error: ${message}`; 

        contentContainer.replaceChildren(errorAlert);
    }

    document.title = 'Error - PawFinder';
}

/**
 * funcion para mostrar el estado de carga
 */
function showLoading() {
    // si no existe el contenedor principal 
    if (!contentContainer) {
        return;
    }

    // crear div para el efecto de carga
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'placeholder-glow';

    // crear titulo h1
    const h1Ph = document.createElement('h1');
    h1Ph.className = 'placeholder col-9 mb-3';

    // crear metadatos
    const metaPh = document.createElement('p');
    metaPh.className = 'text-muted placeholder col-5 mb-4 pb-2 border-bottom';

    // crear imagen
    const imgPh = document.createElement('div');
    imgPh.className = 'placeholder bg-secondary w-100 rounded mb-4';
    imgPh.style.height = '350px'; 

    // crear parrafos de contenido
    const p1Ph = document.createElement('p');
    p1Ph.className = 'placeholder col-12';

    const p2Ph = document.createElement('p');
    p2Ph.className = 'placeholder col-11';

    const p3Ph = document.createElement('p');
    p3Ph.className = 'placeholder col-12';

    const p4Ph = document.createElement('p');
    p4Ph.className = 'placeholder col-10';

    loadingDiv.append(h1Ph, metaPh, imgPh, p1Ph, p2Ph, p3Ph, p4Ph);
    contentContainer.replaceChildren(loadingDiv);

    document.title = 'Cargando Artículo... - PawFinder';
}

// istener 
document.addEventListener('DOMContentLoaded', async () => {
    // si no existe el contenedor principal
    if (!contentContainer) {
        document.body.textContent = "Error crítico: La estructura de la página no es correcta.";
        return;
    }

    showLoading();

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    // si no se encontro id de entrada en la url
    if (!postId) {
        // error
        showError("No se proporcionó ID de artículo en la URL.");
        return;
    }

    try {
        const apiResult = await apiService.getBlogPostById(postId);
        const postData = apiResult.data || apiResult;

        // si se obtuvieron datos y son un objeto con id
        if (postData && typeof postData === 'object' && postData._id) {
            const postInstance = new BlogPost(postData);

            renderPost(postInstance);

        // si no se encontraron datos validos
        } else {
            // error
            throw new Error("No se encontraron detalles para este artículo o el formato es incorrecto.");
        }
    } catch (error) {
        // error 
        showError(`Error al cargar el artículo: ${error.message}`);
    }
});