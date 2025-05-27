import { apiService } from '../service/api-service.js';
import { Pet } from '../model/Pet.class.js';
import { BlogPost } from '../model/BlogPost.class.js';

//DOM
const petsContainer = document.getElementById('petsContainer');
const blogPreviewContainer = document.getElementById('blogPreviewContainer');

/**
 * funcion para crear un icono
 * @param {string[]} [classes=[]] - un array de clases css para el icono
 * @returns {HTMLElement} - el elemento icono creado
 */
function createIcon(classes = []) {
    const i = document.createElement('i');
    const v = classes.filter(c => c && c.trim() !== ''); 

    // si hay clases validas
    if (v.length > 0) {
        // añadir las clases al icono
        i.classList.add(...v);
    }

    // devolver el icono
    return i;
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

    // crear titulo de la tarjeta nombre de la mascota
    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = petInstance.nombre;

    // crear parrafo para detalles 
    const d1 = document.createElement('p');
    d1.className = 'card-text text-muted small mb-1';
    // añadir iconos y texto para especie genero y edad
    d1.append(
        createIcon(['fas',
            'fa-paw',
            'me-1']),
        document.createTextNode(`${petInstance.especie} | `),

        createIcon(['fas',
            petInstance.genero === 'Macho' ? 'fa-mars' : 'fa-venus', 'mx-1']),
        document.createTextNode(`${petInstance.genero} | `), 
        
        createIcon(['fas',
            'fa-birthday-cake', 'mx-1']),
        document.createTextNode(`${petInstance.edad}`)
    );

    // crear parrafo para otros detalles
    const d2 = document.createElement('p');
    d2.className = 'card-text text-muted small mb-2';

    // crear parrafo para la descripcion 
    const description = document.createElement('p');
    description.className = 'card-text flex-grow-1';

    // obtener la descripcion o una cadena vacia
    const descText = petInstance.descripcion || '';

    // truncar la descripcion a 70 caracteres y añadir puntos suspensivos si es mas larga
    description.textContent = (descText.substring(0, 70)) + (descText.length > 70 ? '...' : '');

    // crear enlace detalles de la mascota
    const link = document.createElement('a');
    link.className = 'btn btn-outline-primary mt-auto align-self-start btn-sm'; 
    link.href = `/animal_detail.html?id=${petInstance._id}`; 
    link.textContent = 'Ver Detalles';

    cardBody.append(title, d1, d2, description, link);
    card.append(img, cardBody);

    //crear footer
    const f = document.createElement('div');

    // si la mascota tiene un nombre de refugio valido
    if (petInstance.refugioName && petInstance.refugioName !== 'Refugio Desconocido') {
        // crear pie de tarjeta 
        f.className = 'card-footer text-muted small';
        f.textContent = `Por: ${petInstance.refugioName}`; 

        card.appendChild(f);
    }

    //si hay email de la protectora
    if (petInstance.refugioId.email) { 
            f.appendChild(document.createElement('br'));

            //crear a para el correo
            const emailLink = document.createElement('a');
            emailLink.href = `mailto:${petInstance.refugioId.email}`;
            emailLink.textContent = petInstance.refugioId.email;
            emailLink.classList.add('text-decoration-none');
            
            const emailIcon = createIcon(['fas', 'fa-envelope', 'me-1']);
            
            f.append(emailIcon, emailLink);
        }

    col.appendChild(card); return col;
}

/**
 * funcion para crear el elemento de tarjeta de previsualizacion de blog
 * @param {BlogPost} postInstance - la instancia de la clase blogpost con los datos
 * @returns {HTMLElement} - el elemento de columna (div) que contiene la tarjeta
 */
function createBlogPreviewCardElement(postInstance) {
    // crear div de columna
    const colDiv = document.createElement('div');
    colDiv.className = 'col-md-6 mb-4'; 

    // crear tarjeta
    const card = document.createElement('div');
    card.className = 'card h-100 shadow-sm overflow-hidden'; 

    // si la entrada tiene imagen destacada y no es el placeholder
    if (postInstance.imagenDestacada && postInstance.imagenDestacada !== '/img/placeholder-blog.png') {
        // crear enlace alrededor de la imagen
        const imgLink = document.createElement('a');
        imgLink.href = `/blog_detail.html?id=${postInstance._id}`; 
        
        // crear elemento de imagen
        const img = document.createElement('img');
        img.className = 'card-img-top'; 
        img.src = postInstance.imagenDestacada; 
        img.alt = postInstance.titulo;
        img.style.height = '180px';   
        img.style.objectFit = 'cover';
        
        // añadir imagen al enlace y enlace a la tarjeta
        imgLink.appendChild(img);
        card.appendChild(imgLink);
    }

    // crear cuerpo de la tarjeta
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body d-flex flex-column';

    // crear titulo h5 para la entrada
    const titleH5 = document.createElement('h5'); 
    titleH5.className = 'card-title mb-1';
    
    // crear enlace para el titulo
    const titleLink = document.createElement('a');
    titleLink.href = `/blog_detail.html?id=${postInstance._id}`; 
    titleLink.className = 'text-dark text-decoration-none stretched-link'; 
    titleLink.textContent = postInstance.titulo; 
    
    
    titleH5.appendChild(titleLink);
    cardBody.appendChild(titleH5);

    // crear div para metadatos (autor y fecha)
    const metaDiv = document.createElement('div');
    metaDiv.className = 'text-muted small mb-2'; 
    metaDiv.textContent = `Por ${postInstance.authorName} - ${postInstance.formattedPublicationDate}`;

    
    cardBody.appendChild(metaDiv);
    
    // crear parrafo para el extracto del contenido
    const excerptP = document.createElement('p');
    excerptP.className = 'card-text small flex-grow-1'; 
    excerptP.textContent = postInstance.excerpt; 
    
    
    cardBody.appendChild(excerptP);


    card.appendChild(cardBody);
    colDiv.appendChild(card);
    
    return colDiv;
}

/**
 * funcion para renderizar las mascotas
 * @param {Pet[]} [petInstances=[]] - un array de instancias de pet
 */
function renderPets(petInstances = []) {
    // si no existe el contenedor de mascotas 
    if (!petsContainer) {
        return;
    }

    // asegurar que petinstances sea un array
    if (!Array.isArray(petInstances)) {
        petInstances = [];
    }

    const petCardElements = petInstances.map(createPetCardElement);
    petsContainer.replaceChildren(...petCardElements);

    // si no hay mascotas para mostrar
    if (petInstances.length === 0) {
        // crear un parrafo indicando que no hay mascotas
        const p = document.createElement('p');
        p.className = 'text-center text-muted col-12 mt-4';
        p.textContent = 'No hay mascotas recientes.';

        petsContainer.appendChild(p);
    }
}

/**
 * funcion para mostrar un estado de error para mascotas
 * @param {string} message - el mensaje de error a mostrar
 */
function showErrorState(message) {
    // si no existe el contenedor de mascotas
    if (!petsContainer) {
        return;
    }

    // crear un parrafo para el mensaje de error
    const p = document.createElement('p');
    p.className = 'text-danger text-center col-12 mt-4';
    p.textContent = `Error mascotas: ${message}`;

    petsContainer.replaceChildren(p);
}

/**
 * funcion para renderizar las previsualizaciones de blog
 * @param {BlogPost[]} [postInstances=[]] - un array de instancias de blogpost
 */
function renderBlogPreviews(postInstances = []) {
    // si no existe el contenedor de previsualizaciones de blog 
    if (!blogPreviewContainer) {
        return;
    }

    // asegurar que postinstances sea un array
    if (!Array.isArray(postInstances)) {
        postInstances = [];
    }

    const blogCardElements = postInstances.map(createBlogPreviewCardElement);
    blogPreviewContainer.replaceChildren(...blogCardElements);

    // si no hay entradas de blog para mostrar
    if (postInstances.length === 0) {
        // crear un parrafo indicando que no hay articulos
        const p = document.createElement('p');
        p.className = 'text-center text-muted col-12 mt-3';
        p.textContent = 'No hay artículos recientes.';

        blogPreviewContainer.appendChild(p);
    }
}

/**
 * funcion para mostrar un estado de error para el blog
 * @param {string} message - el mensaje de error a mostrar
 */
function showBlogErrorState(message) {
    // si no existe el contenedor de previsualizaciones de blog 
    if (!blogPreviewContainer) {
        return;
    }

    // crear un parrafo para el mensaje de error
    const p = document.createElement('p');
    p.className = 'text-danger text-center col-12 mt-3';
    p.textContent = `Error blog: ${message}`; 

    blogPreviewContainer.replaceChildren(p);
}

/**
 * funcion asincrona para inicializar la pagina de inicio
 */
async function initializeHomepage() {
    try {
        const petsResult = await apiService.getPets({ limit: 3 });

        // si el resultado es valido y contiene datos
        if (petsResult && Array.isArray(petsResult.data)) {
            const petInstances = petsResult.data.map(petData => new Pet(petData));

            renderPets(petInstances);

        // si no hay datos validos
        } else {
            renderPets([]);
        }
    } catch (error) {
        //  error
        showErrorState(error.message || "Error desconocido");
    }

    try {
        const blogResult = await apiService.getBlogPosts({ limit: 2 });

        // si el resultado es valido y contiene datos
        if (blogResult && Array.isArray(blogResult.data)) {
            const blogInstances = blogResult.data.map(postData => new BlogPost(postData));

            renderBlogPreviews(blogInstances);

        // si no hay datos validos
        } else {
            renderBlogPreviews([]);
        }
    } catch (error) {
        // error
        showBlogErrorState(error.message || "Error desconocido");
    }
}

// listener 
document.addEventListener('DOMContentLoaded', initializeHomepage);