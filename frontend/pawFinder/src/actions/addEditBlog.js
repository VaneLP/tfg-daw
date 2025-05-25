import { apiService } from '../service/api-service.js';
import { Auth } from '../service/auth-service.js';

// DOM
const blogForm = document.getElementById('blogPostForm');
const pageTitle = document.getElementById('pageTitleBlog');
const postIdInput = document.getElementById('postId');
const tituloInput = document.getElementById('titulo');
const contenidoTextarea = document.getElementById('contenido');
const imagenInputElement = document.getElementById('imagenInput');
const imagenHiddenInput = document.getElementById('imagenDestacada');
const imgPreview = document.getElementById('imgPreviewBlog');
const submitButton = document.getElementById('submitButtonBlog');
const errorDiv = document.getElementById('blogFormError');

let currentPostId = null;
let currentImageSrc = null;

/**
 * funcion para mostrar un mensaje de error
 * @param {string} message - el mensaje de error a mostrar
 */
function displayError(message) {
    // si existe el div de errores
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');

        // si no existe mostrar una alerta nativa
    } else {
        alert("Error: " + message);
    }
}


// funcion para limpiar errores y estado de validacion
function clearError() {
    errorDiv?.classList.add('d-none');
    blogForm?.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
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
        spinner.setAttribute('role', 'status');
        spinner.setAttribute('aria-hidden', 'true');

        button.replaceChildren(spinner, document.createTextNode(' Guardando...'));

        // si isLoading es falso
    } else {
        button.disabled = false;
        button.replaceChildren(...originalContentNodes);
    }
}

// añadir event listener al campo de entrada de imagen para el evento change
imagenInputElement?.addEventListener('change', (event) => {
    const file = event.target.files[0];

    // si hay un archivo y existe el elemento de previsualizacion de imagen
    if (file && imgPreview) {
        const reader = new FileReader();

        reader.onload = (e) => {
            imgPreview.src = e.target.result;

            // si existe el campo oculto para la imagen establecer su valor con el base64
            if (imagenHiddenInput) {
                imagenHiddenInput.value = e.target.result;
            }

            currentImageSrc = e.target.result;
        }

        reader.readAsDataURL(file);

        // si no hay archivo y existe el elemento de previsualizacion
    } else if (imgPreview) {
        imgPreview.src = '';

        // si existe el campo oculto para la imagen limpiarlo
        if (imagenHiddenInput) {
            imagenHiddenInput.value = '';
        }

        currentImageSrc = null;
    }
});


// funcion asincrona para cargar datos de entrada para edicion
async function loadPostDataForEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    currentPostId = urlParams.get('id');

    const isLoadingEdit = !!currentPostId;

    // establecer el titulo de la pagina y el texto del boton de envio segun el modo
    if (pageTitle) {
        pageTitle.textContent = isLoadingEdit ? "Editar Artículo" : "Crear Nuevo Artículo";
    }

    if (submitButton) {
        // guardar el texto original del boton si no se ha hecho antes
        if (!submitButton.dataset.originalText) {
            submitButton.dataset.originalText = submitButton.textContent.trim();
        }

        submitButton.textContent = isLoadingEdit ? "Guardar Cambios" : "Guardar Artículo";
    }

    // si se esta en modo edicion
    if (isLoadingEdit) {
        // añadir clase de placeholder y deshabilitar campos mientras se cargan los datos
        if (blogForm) {
            blogForm.classList.add('placeholder-glow');
        }

        blogForm?.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);

        if (submitButton) {
            submitButton.textContent = 'Cargando...';
        }

        try {
            const apiResult = await apiService.getBlogPostById(currentPostId);
            const post = apiResult.data || apiResult;

            // si no se encuentra la entrada o los datos son invalidos lanzar error
            if (!post || !post._id) {
                throw new Error("Artículo no encontrado o datos inválidos.");
            }

            // rellenar los campos del formulario con los datos de la entrada
            if (postIdInput) {
                postIdInput.value = post._id || '';
            } 
            
            if (tituloInput) {
                tituloInput.value = post.titulo || '';
            }

            if (contenidoTextarea) {
                contenidoTextarea.value = post.contenido || '';
            }

            // si la entrada tiene imagen destacada y no es el placeholder
            if (post.imagenDestacada && post.imagenDestacada !== '/img/placeholder-blog.png') {
                // mostrar la imagen en la previsualizacion y establecer valor del campo oculto
                if (imgPreview) {
                    imgPreview.src = post.imagenDestacada;
                }

                if (imagenHiddenInput) {
                    imagenHiddenInput.value = post.imagenDestacada;
                }

                currentImageSrc = post.imagenDestacada; 

                // si no tiene imagen o es el placeholder
            } else {
                // mostrar placeholder en previsualizacion y limpiar campo oculto
                if (imgPreview) {
                    imgPreview.src = '/img/placeholder-blog.png';
                }

                if (imagenHiddenInput) {
                    imagenHiddenInput.value = '';
                }

                currentImageSrc = null;
            }

            blogForm?.querySelectorAll('input, textarea, button').forEach(el => el.disabled = false);
            
            // restaurar texto del boton de envio si existe
            if (submitButton) {
                submitButton.textContent = "Guardar Cambios";
            }

        } catch (error) {
            displayError(`No se pudo cargar el artículo para editar: ${error.message}`);

            // si existe el boton de envio cambiar su texto y deshabilitarlo
            if (submitButton) {
                submitButton.textContent = 'Error al Cargar';
                submitButton.disabled = true;
            }

        } finally {
            if (blogForm) {
                blogForm.classList.remove('placeholder-glow');
            }
        }

        // si no se esta en modo edicion 
    } else {
        blogForm?.querySelectorAll('input, textarea, button').forEach(el => el.disabled = false);
        
        // establecer imagen de previsualizacion a placeholder y limpiar campo oculto
        if (imgPreview) {
            imgPreview.src = '/img/placeholder-blog.png';
        }

        if (imagenHiddenInput) {
            imagenHiddenInput.value = '';
        }

        currentImageSrc = null;

        // establecer texto del boton de envio
        if (submitButton && submitButton.dataset.originalText) {
            submitButton.textContent = submitButton.dataset.originalText === "Guardar Cambios" ? "Guardar Artículo" : submitButton.dataset.originalText;
        } else if (submitButton) {
            submitButton.textContent = "Guardar Artículo";
        }
    }
}

// listener
blogForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    clearError();

    let isValid = true;

    // validar campo de titulo
    if (!tituloInput?.value.trim()) {
        tituloInput?.classList.add('is-invalid');
        isValid = false;
    } else {
        tituloInput?.classList.remove('is-invalid');
    }

    // validar campo de contenido
    if (!contenidoTextarea?.value.trim()) {
        contenidoTextarea?.classList.add('is-invalid');
        isValid = false;
    } else {
        contenidoTextarea?.classList.remove('is-invalid');
    }

    // si el formulario no es valido
    if (!isValid) {
        displayError("El título y el contenido son obligatorios.");
        return;
    }

    const postData = {
        titulo: tituloInput.value.trim(),
        contenido: contenidoTextarea.value.trim(),
        imagenDestacada: imagenHiddenInput.value || null 
    };

    const originalButtonContent = Array.from(submitButton.childNodes);
    setButtonLoading(submitButton, true, []); 

    let success = false;

    try {
        let result;
        let redirectUrl;

        // si hay un id de entrada actual 
        if (currentPostId) {
            result = await apiService.updateBlogPost(currentPostId, postData);

            // si la api devuelve un error (ej status >= 400)
            if (!result || (result.status && result.status >= 400)) {
                throw new Error(result?.data?.message || result?.message || 'Error al actualizar el post.');
            }

            alert("Artículo actualizado correctamente.");

            redirectUrl = `/blog_detail.html?id=${currentPostId}`;

            // si no hay id de entrada 
        } else {
            result = await apiService.createBlogPost(postData);

            // si la api devuelve un error
            if (!result || (result.status && result.status >= 400)) {
                throw new Error(result?.data?.message || result?.message || 'Error al crear el post.');
            }

            alert("Artículo creado correctamente.");

            redirectUrl = '/blog.html';
        }

        success = true;
        window.location.assign(redirectUrl);

    } catch (error) {

        let errorMessage = "Ocurrió un error desconocido al guardar.";

        // si el error tiene una respuesta con datos y mensaje usarlo
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;

            // si el error tiene un mensaje usarlo
        } else if (error.message) {
            errorMessage = error.message;
        }

        displayError(`Error al guardar: ${errorMessage}`);

    } finally {
        // si la operacion no fue exitosa (no se redirigio)
        if (!success) {
            setButtonLoading(submitButton, false, originalButtonContent);
        }
    }
});

// listener 
window.addEventListener('load', async () => {
    // si no existe el formulario 
    if (!blogForm) {
        return;
    }

    try {
        const user = await Auth.checkToken();

        // si no hay usuario o no tiene rol de refugio o admin
        if (!user || !['Refugio', 'Admin'].includes(user.role)) {
            throw new Error("Acceso denegado. Debes ser Refugio o Administrador para gestionar el blog.");
        }

        loadPostDataForEdit();

    } catch (error) {
        Auth.logout();

        alert("Error: " + error.message + ". Serás redirigido al login.");
        window.location.assign('/login.html');
    }
});