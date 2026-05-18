/*
IA utilizada: ChatGPT

Prompt 1: "Cómo crear usuarios en JavaScript a partir de un formulario HTML"
Prompt 2: "Cómo listar usuarios dinámicamente en una tabla con Bootstrap"
Prompt 3: "Cómo eliminar elementos de un array usando JavaScript"
Prompt 4: "Cómo usar addEventListener para registrar eventos de formulario y botones"
*/
import { usuarios as usuariosIniciales } from "./datos.js";
import { Almacenaje, actualizarNavbar } from "./almacenaje.js";

document.addEventListener("DOMContentLoaded", () => {
    if (Almacenaje.obtenerUsuarios().length === 0) {
        Almacenaje.guardarUsuarios(usuariosIniciales);
    }

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

    function obtenerNuevoId(array) {
        if (array.length === 0) return 1;
        const ids = array.map((u) => u.id);
        return Math.max(...ids) + 1;
    }

    function pintarUsuarios() {
        if (!contenedorUsuarios) return;

        const listaUsuarios = Almacenaje.obtenerUsuarios();
        let html = "";

        listaUsuarios.forEach((usuario) => {
            html += `
                <tr>
                    <td>${usuario.id}</td>
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
    }

    /**
     * EVENTOS: Asocia el click de eliminar a cada botón
     */
    function registrarEventosEliminar() {
        const botonesEliminar = document.querySelectorAll(".btn-eliminar-usuario");
        botonesEliminar.forEach((boton) => {
            boton.onclick = () => {
                const email = boton.dataset.email;
                eliminarUsuario(email);
            };
        });
    }

    /**
     * CRUD: Eliminar usuario del Storage
     */
    function eliminarUsuario(email) {
        // El usuario no puede eliminarse a si mismo estando logueado
        if (email === Almacenaje.getSesion()) {
            mostrarMensaje("No puedes eliminar tu propio usuario mientras estás logueado.", "error");
            return;
        }

        Almacenaje.borrarUsuario(email);
        pintarUsuarios();
        mostrarMensaje("Usuario eliminado correctamente.", "ok");
    }

    /**
     * CRUD: Crear usuario y guardar en Storage
     */
    function crearUsuario(evento) {
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

        const listaActual = Almacenaje.obtenerUsuarios();
        const emailRepetido = listaActual.some((u) => u.email === email);

        if (emailRepetido) {
            mostrarMensaje("Ya existe un usuario con ese correo.", "error");
            return;
        }

        // Creamos el objeto
        const nuevoUsuario = {
            id: obtenerNuevoId(listaActual),
            nombre,
            email,
            password,
            rol
        };

        // Guardamos usando el módulo
        listaActual.push(nuevoUsuario);
        Almacenaje.guardarUsuarios(listaActual);

        if (formularioUsuario) formularioUsuario.reset();

        pintarUsuarios();
        mostrarMensaje("Usuario creado correctamente.", "ok");
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