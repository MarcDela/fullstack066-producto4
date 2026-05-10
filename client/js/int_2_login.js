/*
IA utilizada: ChatGPT

Prompt 1: "Cómo validar un login en JavaScript usando un array de usuarios"
Prompt 2: "Cómo usar addEventListener en un formulario de login"
Prompt 3: "Cómo guardar datos de sesión con sessionStorage"
Prompt 4: "Cómo mostrar el correo del usuario logueado en la navbar de una app frontend"
*/

import { Almacenaje, actualizarNavbar } from "./almacenaje.js";

// Agrupamos todo dentro del evento de carga del DOM
document.addEventListener("DOMContentLoaded", () => {
    
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

    async function iniciarSesion(evento) {
        evento.preventDefault();

        const email = inputEmail.value.trim();
        const password = inputPassword.value.trim();

        if (email === "" || password === "") {
            mostrarMensaje("Debes rellenar el correo y la contraseña.", "error");
            return;
        }

        // Definimos la Mutation de GraphQL para Login
        // Pedimos el token y los datos que necesitamos guardar (nombre, rol, etc)
        const query = {
            query: `
                mutation {
                    login(email: "${email}", password: "${password}") {
                        token
                        usuario {
                            id
                            nombre
                            email
                            rol
                        }
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
                // Si el servidor dice que las credenciales están mal
                mostrarMensaje("Correo o contraseña incorrectos.", "error");
            } else {
                const { token, usuario } = json.data.login;

                // Guardamos la sesión usando el nuevo método que definimos en almacenaje.js
                Almacenaje.setSesion(token, usuario);

                mostrarMensaje(`Bienvenido, ${usuario.nombre}.`, "ok");
                
                // Pequeña pausa para que el usuario vea el mensaje de éxito antes de redirigir
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1000);
            }
        } catch (error) {
            console.error("Error en el login:", error);
            mostrarMensaje("Error de conexión con el servidor.", "error");
        }
        
    }

    actualizarNavbar();

    if (formularioLogin) {
        formularioLogin.addEventListener("submit", iniciarSesion);
    }
});