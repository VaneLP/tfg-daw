import { apiService } from '../service/api-service.js';
import { Auth } from '../service/auth-service.js';
import { User } from '../model/User.class.js';

// DOM
const tableBody = document.getElementById('usersTableBody');
const roleFilter = document.getElementById('roleFilter');
const refugioStatusFilter = document.getElementById('refugioStatusFilter');
const noUsersMessage = document.getElementById('noUsersMessage');

let allUserInstances = [];

/**
 * funcion para crear un icono
 * @param {string[]} [classes=[]] - un array de clases css para el icono
 * @returns {HTMLElement} - el elemento icono creado
 */
function createIcon(classes = []) {
    // crear un elemento <i>
    const i = document.createElement('i');
    // filtrar clases validas (no nulas no vacias y strings)
    const v = classes.filter(c => c && c.trim() !== ''); // v para validas

    // si hay clases validas
    if (v.length > 0) {
        // añadir las clases al icono
        i.classList.add(...v);
    }

    // devolver el icono
    return i;
}

/**
 * funcion para crear una celda de tabla
 * @param {string|Node} content - el contenido de la celda (texto o nodo dom)
 * @returns {HTMLTableCellElement} - la celda de tabla creada
 */
function createTableCell(content) {
    // crear un elemento <td>
    const td = document.createElement('td');

    // si el contenido es un nodo dom 
    if (content instanceof Node) {
        // añadir el nodo a la celda
        td.appendChild(content);

        // si el contenido es texto
    } else {
        td.textContent = content || '-';
    }

    return td;
}

/**
 * funcion para crear un boton de accion
 * @param {string} action - la accion que representa el boton (ej 'approve' 'deleteuser')
 * @param {string} userId - el id del usuario al que se aplica la accion
 * @param {string} title - el titulo del boton (para tooltip)
 * @param {string[]} iconClasses - un array de clases css para el icono del boton
 * @param {string} btnClass - la clase de bootstrap para el estilo del boton (ej 'success' 'outline-danger')
 * @returns {HTMLButtonElement} - el boton de accion creado
 */
function createActionButton(action, userId, title, iconClasses, btnClass) {
    // crear un elemento button
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `btn btn-${btnClass} btn-sm me-1 action-btn`;
    b.dataset.action = action;
    b.dataset.userid = userId;
    b.title = title;

    b.appendChild(createIcon(iconClasses));

    return b;
}

/**
 * funcion para establecer el estado de carga de un boton
 * @param {HTMLButtonElement|null} button - el boton a gestionar
 * @param {boolean} isLoading - verdadero para mostrar estado de carga falso para estado normal
 * @param {Node[]|null} originalContentNodes - nodos del contenido original del boton para restaurar
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
        const s = document.createElement('span');
        s.className = 'spinner-border spinner-border-sm';

        button.replaceChildren(s);

        // si isLoading es falso
    } else {
        button.disabled = false;

        // si se proporcionan nodos de contenido original
        if (originalContentNodes && originalContentNodes.length > 0) {
            button.replaceChildren(...originalContentNodes);

            // si no se proporcionan nodos originales
        } else {
            const defaultText = button.dataset.originalText || 'Acción';

            button.textContent = defaultText;
        }
    }
}


/**
 * funcion para crear un badge de estado o rol
 * @param {string|null|undefined} text - el texto del badge
 * @param {string} type - el tipo de badge ('role' o 'status') para aplicar estilos especificos
 * @returns {Node} - el elemento badge creado o un nodo de texto 'n/a' si el texto es invalido
 */
function createBadge(text, type) {
    const lowerText = text?.toLowerCase() || 'n/a';

    // si el texto es 'n/a' 'undefined' o no hay texto devolver nodo de texto 'n/a'
    if (lowerText === 'n/a' || lowerText === 'undefined' || !text) {
        return document.createTextNode('N/A');
    }

    // crear un elemento <span> para el badge
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = text;

    // clases por defecto 
    let classesToAdd = ['bg-secondary'];

    // si el tipo es 'role'
    if (type === 'role') {
        // aplicar clases segun el valor del rol
        switch (lowerText) {
            case 'admin':
                classesToAdd = ['bg-danger'];
                break;
            case 'refugio':
                classesToAdd = ['bg-primary'];
                break;
            case 'adoptante':
                classesToAdd = ['bg-success'];
                break;
        }

        // si el tipo es 'status'
    } else if (type === 'status') {
        // aplicar clases segun el valor del estado
        switch (lowerText) {
            case 'aprobado':
                classesToAdd = ['bg-success'];
                break;
            case 'pendiente':
                classesToAdd = ['bg-warning', 'text-dark'];
                break;
            case 'rechazado':
                classesToAdd = ['bg-danger'];
                break;
        }
    }

    // si hay clases para añadir
    if (classesToAdd.length > 0) {
        badge.classList.add(...classesToAdd);
    }

    return badge;
}

/**
 * funcion para renderizar la tabla de usuarios
 * @param {User[]} userInstances - un array de instancias de la clase user
 */
function renderUsersTable(userInstances) {
    // si no existe el cuerpo de la tabla 
    if (!tableBody) {
        return;
    }

    tableBody.replaceChildren();
    noUsersMessage?.classList.add('d-none');

    // si no hay instancias de usuario o el array esta vacio
    if (!userInstances || userInstances.length === 0) {
        noUsersMessage?.classList.remove('d-none');
        return;
    }

    const rowsFragment = document.createDocumentFragment();

    // iterar sobre cada instancia de usuario
    userInstances.forEach(userInstance => {
        // crear una fila (<tr>) para el usuario
        const tr = document.createElement('tr');
        tr.id = `user-row-${userInstance._id}`;

        const refugioStatusText = userInstance.isRefugio() ? (userInstance.estadoAprobacion || 'N/A') : 'N/A';
        const displayName = userInstance.displayName;

        // añadir celdas con los datos del usuario
        tr.appendChild(createTableCell(userInstance.username));
        tr.appendChild(createTableCell(userInstance.email));
        tr.appendChild(createTableCell(createBadge(userInstance.role, 'role')));
        tr.appendChild(createTableCell(displayName));
        tr.appendChild(createTableCell(createBadge(refugioStatusText, 'status')));
        tr.appendChild(createTableCell(userInstance.formattedRegistrationDate));

        // crear celda para las acciones
        const actionsTd = document.createElement('td');
        actionsTd.classList.add('text-center');

        // si el usuario es un refugio y su estado es 'pendiente'
        if (userInstance.isRefugio() && userInstance.estadoAprobacion === 'Pendiente') {
            actionsTd.appendChild(createActionButton('approve', userInstance._id, 'Aprobar Refugio', ['fas', 'fa-check'], 'success'));
            actionsTd.appendChild(createActionButton('reject', userInstance._id, 'Rechazar Refugio', ['fas', 'fa-times'], 'danger'));
        }

        const currentUser = Auth.getCurrentUser();

        // si hay usuario logueado y no es el mismo usuario de la fila (para no poder eliminarse a si mismo)
        if (currentUser && currentUser._id !== userInstance._id) {
            // añadir boton de eliminar usuario
            actionsTd.appendChild(createActionButton(
                'deleteUser',
                userInstance._id,
                'Eliminar Usuario',
                ['fas', 'fa-trash-alt'],
                'outline-danger'
            ));
        }

        tr.appendChild(actionsTd);
        rowsFragment.appendChild(tr);
    });

    tableBody.appendChild(rowsFragment);

    addAdminActionListeners();
}


// funcion para añadir listeners a los botones de accion de administrador
function addAdminActionListeners() {
    // seleccionar todos los botones con clase 'action-btn' dentro del cuerpo de la tabla
    tableBody?.querySelectorAll('.action-btn').forEach(button => {

        // si el boton ya tiene un listener no añadir otro
        if (button.dataset.listenerAttached === 'true') {
            return;
        }

        button.dataset.listenerAttached = 'true';

        // añadir event listener para el evento click
        button.addEventListener('click', async (e) => {
            const action = button.dataset.action;
            const userId = button.dataset.userid;
            const originalButtonContent = Array.from(button.childNodes);

            button.dataset.originalText = button.textContent;

            setButtonLoading(button, true, []);

            try {
                let result;
                let alertMessage = '';
                let reloadUsers = true;

                // si la accion es 'approve' (aprobar refugio)
                if (action === 'approve') {
                    result = await apiService.approveRefugio(userId);
                    alertMessage = `Refugio ${result.refugio?.username || userId} aprobado.`;

                    // si la accion es 'reject' (rechazar refugio)
                } else if (action === 'reject') {
                    result = await apiService.rejectRefugio(userId);
                    alertMessage = `Refugio ${result.refugio?.username || userId} rechazado.`;

                    // si la accion es 'deleteuser' (eliminar usuario)
                } else if (action === 'deleteUser') {
                    const userInstanceToDelete = allUserInstances.find(u => u._id === userId);
                    let confirmMessage = `¿Estás seguro de que quieres eliminar al usuario "${userInstanceToDelete?.username || userId}"?`;

                    // si el usuario a eliminar es un refugio añadir advertencia
                    if (userInstanceToDelete?.isRefugio()) {
                        confirmMessage += "\n\n¡ATENCIÓN! Si es un refugio, se eliminarán también TODAS sus mascotas y posts del blog asociados.";
                    }

                    // pedir confirmacion al usuario
                    if (confirm(confirmMessage)) {
                        result = await apiService.deleteUser(userId);
                        alertMessage = result.message || `Usuario eliminado.`;

                        // si cancela
                    } else {
                        alertMessage = "Eliminación cancelada.";
                        reloadUsers = false;

                        setButtonLoading(button, false, originalButtonContent);
                    }
                }

                // si se debe recargar la lista de usuarios
                if (reloadUsers) {
                    // si hay mensaje de alerta mostrarlo
                    if (alertMessage) {
                        alert(alertMessage);
                    }

                    const updatedUsersData = await apiService.getAllUsers();

                    allUserInstances = (updatedUsersData.data || []).map(userData => new User(userData));

                    filterAndRenderUsers();
                }
            } catch (error) {
                alert(`Error: ${error.message}`);

                setButtonLoading(button, false, originalButtonContent);
            }
        });
    });
}


// funcion para filtrar y renderizar usuarios
function filterAndRenderUsers() {
    const selectedRole = roleFilter?.value;
    const selectedStatus = refugioStatusFilter?.value;
    const filteredUserInstances = allUserInstances.filter(userInstance => {
        const roleMatch = !selectedRole || userInstance.role === selectedRole;
        let statusMatch = true;

        // si se selecciono rol 'refugio' y un estado
        if (selectedRole === 'Refugio' && selectedStatus) {
            statusMatch = userInstance.isRefugio() && userInstance.estadoAprobacion === selectedStatus;

            // si se selecciono un estado pero no un rol especifico (asume que el estado es para refugios)
        } else if (selectedStatus && !selectedRole) {
            statusMatch = userInstance.isRefugio() && userInstance.estadoAprobacion === selectedStatus;

            // si se selecciono un estado y un rol que no es 'refugio' (el filtro de estado no aplica)
        } else if (selectedStatus && selectedRole && selectedRole !== 'Refugio') {
            statusMatch = !userInstance.isRefugio(); 
        }

        return roleMatch && statusMatch;
    });

    renderUsersTable(filteredUserInstances);
}


// funcion asincrona para cargar los usuarios
async function loadUsers() {
    // si existe el cuerpo de la tabla mostrar indicador de carga
    if (tableBody) {
        // crear fila y celda para el mensaje de carga
        const trLoad = document.createElement('tr');
        const tdLoad = document.createElement('td');
        tdLoad.colSpan = 7; 
        tdLoad.className = 'text-center py-5';

        // crear spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner-border spinner-border-sm text-primary';

        tdLoad.appendChild(spinner);
        tdLoad.appendChild(document.createTextNode(' Cargando usuarios...'));
        trLoad.appendChild(tdLoad);
        tableBody.replaceChildren(trLoad);
    }

    try {
        const result = await apiService.getAllUsers();

        allUserInstances = (result.data || []).map(userData => new User(userData));

        filterAndRenderUsers();
    } catch (error) {
        // si existe el cuerpo de la tabla mostrar mensaje de error
        if (tableBody) {
            // crear fila y celda para el mensaje de error
            const trErr = document.createElement('tr');
            const tdErr = document.createElement('td');
            tdErr.colSpan = 7;
            tdErr.className = 'text-danger text-center py-4';
            tdErr.textContent = `Error al cargar usuarios: ${error.message}`;

            trErr.appendChild(tdErr);
            tableBody.replaceChildren(trErr);
        }
    }
}

// listener filtro de rol 
roleFilter?.addEventListener('change', filterAndRenderUsers);

// listener filtro de estado de refugio 
refugioStatusFilter?.addEventListener('change', filterAndRenderUsers);

// listener 
window.addEventListener('load', async () => {
    // si no existe el cuerpo de la tabla 
    if (!tableBody) {
        return;
    }

    try {
        const user = await Auth.checkToken();

        // si no hay usuario o no es administrador
        if (!user || user.role !== 'Admin') {
            throw new Error("Acceso denegado. Se requiere rol de Administrador.");
        }

        loadUsers();

    } catch (error) {
        Auth.logout();

        alert("Error: " + error.message + ". Serás redirigido al login.");

        window.location.assign('/login.html');
    }
});