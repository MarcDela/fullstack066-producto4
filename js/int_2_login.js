/*
IA utilizada: ChatGPT

Prompt 1: "Cómo validar un login en JavaScript usando un array de usuarios"
Prompt 2: "Cómo usar addEventListener en un formulario de login"
Prompt 3: "Cómo guardar datos de sesión con sessionStorage"
Prompt 4: "Cómo mostrar el correo del usuario logueado en la navbar de una app frontend"
*/

import { usuarios } from "./datos.js";
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

    function iniciarSesion(evento) {
        evento.preventDefault();

        const email = inputEmail.value.trim();
        const password = inputPassword.value.trim();

        if (email === "" || password === "") {
            mostrarMensaje("Debes rellenar el correo y la contraseña.", "error");
            return;
        }

        const usuarioEncontrado = Almacenaje.obtenerUsuarios().find(
            (u) => u.email === email && u.password === password
        );

        if (!usuarioEncontrado) {
            mostrarMensaje("Correo o contraseña incorrectos.", "error");
            return;
        }

        Almacenaje.setSesion(usuarioEncontrado.email);
        mostrarMensaje(`Bienvenido, ${usuarioEncontrado.nombre}.`, "ok");
        
        actualizarNavbar(); 

        if (formularioLogin) formularioLogin.reset();

        window.location.href = "index.html";
        
    }


    actualizarNavbar();

    if (formularioLogin) {
        formularioLogin.addEventListener("submit", iniciarSesion);
    }
});