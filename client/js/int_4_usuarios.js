/*
IA utilizada: ChatGPT

Prompt 1: "Cómo crear usuarios en JavaScript a partir de un formulario HTML"
Prompt 2: "Cómo listar usuarios dinámicamente en una tabla con Bootstrap"
Prompt 3: "Cómo eliminar elementos de un array usando JavaScript"
Prompt 4: "Cómo usar addEventListener para registrar eventos de formulario y botones"
*/
import { Almacenaje, actualizarNavbar } from "./almacenaje.js";

document.addEventListener("DOMContentLoaded", () => {

    const formularioUsuario = document.getElementById("form-usuario");
    const inputNombre = document.getElementById("nombre");
    const inputEmailUsuario = document.getElementById("email-usuario");
    const inputPasswordUsuario = document.getElementById("password-usuario");
    const inputRolUsuario = document.getElementById("rol-usuario");
    const mensajeUsuario = document.getElementById("mensaje-usuario");
    const contenedorUsuarios = document.getElementById("contenedor-usuarios");

    function mostrarMensaje(texto, tipo) {
        if (!mensajeUsuario) return;
        mensajeUsuario.textContent = texto;
        mensajeUsuario.className = "";
        if (tipo === "error") mensajeUsuario.classList.add("mensaje-error");
        if (tipo === "ok") mensajeUsuario.classList.add("mensaje-ok");
    }

    /**
     * READ: Obtener usuarios desde el Servidor (GraphQL)
     */
    async function pintarUsuarios() {
        if (!contenedorUsuarios) return;

        const query = {
            query: `
                query {
                    obtenerUsuarios {
                        id
                        nombre
                        email
                        rol
                    }
                }
            `
        };

        try {
            const respuesta = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(query)
            });
            const json = await respuesta.json();
            const listaUsuarios = json.data.obtenerUsuarios;

            let html = "";
            listaUsuarios.forEach((usuario) => {
                html += `
                    <tr>
                        <td>${usuario.id.substring(0, 8)}...</td>
                        <td>${usuario.nombre}</td>
                        <td>${usuario.email}</td>
                        <td>${usuario.rol}</td>
                        <td class="text-end">
                            <button type="button" class="btn btn-outline-danger btn-sm btn-eliminar-usuario" data-email="${usuario.email}">
                                Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            });
            contenedorUsuarios.innerHTML = html;
            registrarEventosEliminar();
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
        }
    }

    /**
     * EVENTOS: Asocia el click de eliminar a cada botón
     */
    function registrarEventosEliminar() {
        document.querySelectorAll(".btn-eliminar-usuario").forEach((boton) => {
            boton.onclick = () => eliminarUsuario(boton.dataset.email);
        });
    }

    /**
     * CRUD: Eliminar usuario del Storage
     */
    async function eliminarUsuario(email) {
        const usuarioLogueado = Almacenaje.getUsuario();

        // 1. Verificación de Rol, solo un Administrador puede eliminar usuarios
        if (!usuarioLogueado || usuarioLogueado.rol !== 'Administrador') {
            mostrarMensaje("Acceso denegado: Solo el Administrador puede eliminar usuarios.", "error");
            return;
        }

        // 2. El Administrador no puede eliminarse a si mismo, tan solo lo puede hacer otro admin
        if (email === usuarioLogueado.email) {
            mostrarMensaje("No puedes eliminar tu propia cuenta.", "error");
            return;
        }

        // Si pasa los filtros, enviamos la Mutation
        const query = {
            query: `
                mutation {
                    borrarUsuario(email: "${email}")
                }
            `
        };

        try {
            const respuesta = await fetch('/graphql', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Almacenaje.getToken()}` 
                },
                body: JSON.stringify(query)
            });
        
            const resultado = await respuesta.json();

            if (resultado.errors) {
                mostrarMensaje(resultado.errors[0].message, "error");
            } else {
                pintarUsuarios();
                mostrarMensaje("Usuario eliminado correctamente.", "ok");
            }
        } catch (error) {
            mostrarMensaje("Error de red al intentar eliminar.", "error");
        }
    }

    /**
     * CRUD: Crear usuario y guardar en Storage
     */
    async function crearUsuario(evento) {
        evento.preventDefault();

        const nombre = inputNombre.value.trim();
        const email = inputEmailUsuario.value.trim();
        const password = inputPasswordUsuario.value.trim();
        const rol = inputRolUsuario.value.trim();

        if (!nombre || !email || !password || !rol) {
            mostrarMensaje("Debes rellenar todos los campos.", "error");
            return;
        }

        if(!validarEmail(email)){
            mostrarMensaje("Debes introducir un formato de email valido.", "error");
            inputEmailUsuario.focus();
            return;
        }

        if(!validarPassword(password)){
            mostrarMensaje("La contraseña debe tener 8 caracteres, y contener una minuscula, una mayuscula y un numero minimo.", "error");
            inputPasswordUsuario.focus();
            return;
        }

        // Si pasa las validaciones, preparamos la Mutation
        const query = {
            query: `
                mutation {
                    crearUsuario(nombre: "${nombre}", email: "${email}", password: "${password}", rol: "${rol}") {
                        id
                        nombre
                    }
                }
            `
        };

        try {
            const respuesta = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(query)
            });
            const json = await respuesta.json();

            if (json.errors) {
                const mensajeError = json.errors[0].message;
                
                // En nuestro modelo, email es campo UNIQUE, por lo que si entramos un email ya existente nos da error
                if (mensajeError.includes("E11000") || mensajeError.includes("ya existe")) {
                    mostrarMensaje("Ya existe un usuario con ese correo.", "error");
                } else {
                    mostrarMensaje(mensajeError, "error");
                }
            } else {
                if (formularioUsuario) formularioUsuario.reset();
                pintarUsuarios();
                mostrarMensaje("Usuario guardado correctamente en Atlas.", "ok");
            }
        } catch (error) {
            mostrarMensaje("Error de conexión con el servidor.", "error");
        }
    }

    /* 
    Funcion validacion formato email
    */
    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /* 
    Función validación contraseña
    */
    function validarPassword(password) {
        /* Minimo una mayuscula, una miniscula y un numero. 8 carácteres */
        const regex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        return regex.test(password);
    }

    actualizarNavbar();
    pintarUsuarios();

    if (formularioUsuario) {
        formularioUsuario.addEventListener("submit", crearUsuario);
    }
});