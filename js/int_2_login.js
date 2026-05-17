import {Almacenaje, actualizarNavbar} from "./almacenaje.js";

const GQL_URL = "http://localhost:4000/graphql";

document.addEventListener("DOMContentLoaded", async () => {
    
    const formularioLogin = document.getElementById("form-login");
    const inputEmail = document.getElementById("email");
    const inputPassword = document.getElementById("password");
    const mensajeLogin = document.getElementById("mensaje-login");

    function mostrarMensaje(texto, tipo) {
        if (!mensajeLogin) return;
        mensajeLogin.textContent = texto;
        mensajeLogin.className = ""; 
        
        if (tipo === "error") mensajeLogin.classList.add("mensaje-error");
        if (tipo === "ok") mensajeLogin.classList.add("mensaje-ok");
    }

    //Funcion async
    async function iniciarSesion(evento) {
        evento.preventDefault();

        const email = inputEmail.value.trim();
        const password = inputPassword.value.trim();

        if (email === "" || password === "") {
            mostrarMensaje("Debes rellenar el correo y la contraseña.", "error");
            return;
        }

        try {
            //Petición fetch a la API de GraphQL
            const respuesta = await fetch(GQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
                        mutation {
                            login(email: "${email}", password: "${password}") {
                                nombre
                                email
                                rol
                            }
                        }
                    `
                })
            });

            const resultado = await respuesta.json();

    
            if (resultado.errors || !resultado.data.login) {
                mostrarMensaje("Correo o contraseña incorrectos.", "error");
                return;
            }

            const usuarioLogueado = resultado.data.login;

            //Guardamos la sesión y el rol de usuario 
            Almacenaje.setSesion(usuarioLogueado.email);
            localStorage.setItem("usuario_rol", usuarioLogueado.rol);

            mostrarMensaje(`Bienvenido, ${usuarioLogueado.nombre}.`, "ok");
            
            actualizarNavbar(); 

            if (formularioLogin) formularioLogin.reset();

            //Redirección a la Landing principal
            window.location.href = "index.html";

        } catch (error) {
            console.error("Error en la conexión con Atlas:", error);
            mostrarMensaje("Error al conectar con el servidor backend.", "error");
        }
    }

    actualizarNavbar();

    if (formularioLogin) {
        formularioLogin.addEventListener("submit", iniciarSesion);
    }
});