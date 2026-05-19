import { Almacenaje, actualizarNavbar } from "./almacenaje.js";

const GQL_URL = "http://localhost:4000/graphql";

document.addEventListener("DOMContentLoaded", async () => {
    
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

    //Mostrar usuarios
    async function pintarUsuarios() {
        if (!contenedorUsuarios) return;

        const emailSesion = Almacenaje.getSesion();
        const rolSesion = localStorage.getItem("usuario_rol");

        try {
            const respuesta = await fetch(GQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
                })
            });

            const resultado = await respuesta.json();
            let listaUsuarios = resultado.data.obtenerUsuarios || [];

            //Si no es adminISTRADOR, solo puede acceder a su propia información
            if (rolSesion !== "admin") {
                listaUsuarios = listaUsuarios.filter(u => u.email === emailSesion);
            }

            let html = "";
            listaUsuarios.forEach((usuario) => {
                html += `
                    <tr>
                        <td class="small text-truncate" style="max-width: 90px;">${usuario.id}</td>
                        <td>${usuario.nombre}</td>
                        <td>${usuario.email}</td>
                        <td><span class="badge ${usuario.rol === 'admin' ? 'text-bg-danger' : 'text-bg-secondary'}">${usuario.rol}</span></td>
                        <td class="text-end">
                            <button type="button" class="btn btn-outline-danger btn-sm btn-eliminar-usuario" data-email="${usuario.email}">
                                Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            });

            contenedorUsuarios.innerHTML = html || `<tr><td colspan="5" class="text-center text-muted">No hay usuarios disponibles.</td></tr>`;
            registrarEventosEliminar();

        } catch (error) {
            console.error("Error al traer usuarios de Atlas:", error);
            mostrarMensaje("Error al conectar con la base de datos de usuarios.", "error");
        }
    }

    function registrarEventosEliminar() {
        const botonesEliminar = document.querySelectorAll(".btn-eliminar-usuario");
        botonesEliminar.forEach((boton) => {
            boton.onclick = () => {
                const email = boton.dataset.email;
                eliminarUsuario(email);
            };
        });
    }

    //Eliminación asíncrona mediante mutación GraphQL
    async function eliminarUsuario(email) {
        if (email === Almacenaje.getSesion()) {
            mostrarMensaje("No puedes eliminar tu propio usuario mientras tengas la tu propia sesion iniciada", "error");
            return;
        }

        try {
            const respuesta = await fetch(GQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
                        mutation {
                            eliminarUsuario(email: "${email}")
                        }
                    `
                })
            });

            const resultado = await respuesta.json();

            if (resultado.errors) {
                mostrarMensaje("Error del servidor al intentar borrar el usuario.", "error");
                return;
            }

            await pintarUsuarios();
            mostrarMensaje("Usuario eliminado de MongoDB-Atlas.", "ok");

        } catch (error) {
            mostrarMensaje("Error de red al intentar eliminar el usuario.", "error");
        }
    }

    //Creación asíncrona de usuarios mapeada con Mongoose
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

        if (!validarEmail(email)) {
            mostrarMensaje("Debes introducir un formato de email válido.", "error");
            inputEmailUsuario.focus();
            return;
        }

        if (!validarPassword(password)) {
            mostrarMensaje("La contraseña debe tener mínimo 8 caracteres, una minúscula, una mayúscula y un número.", "error");
            inputPasswordUsuario.focus();
            return;
        }

        try {
        
            const respuesta = await fetch(GQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
                        mutation {
                            crearUsuario(nombre: "${nombre}", email: "${email}", password: "${password}", rol: "${rol}") {
                                id
                            }
                        }
                    `
                })
            });

            const resultado = await respuesta.json();

            //Si el email ya existía, las validaciones únicas de Mongoose saltarán aquí
            if (resultado.errors) {
                mostrarMensaje("El correo ya está registrado o los datos no son validos", "error");
                return;
            }

            if (formularioUsuario) formularioUsuario.reset();

            await pintarUsuarios();
            mostrarMensaje("Usuario registrado con éxito en mongoDB-Atlas.", "ok");

        } catch (error) {
            console.error(error);
            mostrarMensaje("Error de red al crear el usuario.", "error");
        }
    }

    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function validarPassword(password) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        return regex.test(password);
    }

    actualizarNavbar();
    await pintarUsuarios();

    if (formularioUsuario) {
        formularioUsuario.addEventListener("submit", crearUsuario);
    }
});