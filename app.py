from datetime import timedelta
from getpass import getpass
import hmac
import os
import secrets
import time
from pathlib import Path

from flask import Flask, abort, jsonify, redirect, render_template, request, send_from_directory, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
PROTECTED_PAGES = {
    "index.html",
    "cuidado.html",
    "seguridad.html",
    "ergonomia.html",
    "galeria.html",
    "firmas.html",
    "firma-movil.html",
}
ASSET_DIRS = {"css", "js", "imagenes"}
FAILED_LOGINS = {}
LOGIN_WINDOW_SECONDS = 300
MAX_LOGIN_ATTEMPTS = 5

app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get("SECRET_KEY") or secrets.token_hex(32),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("RENDER") == "true",
    PERMANENT_SESSION_LIFETIME=timedelta(hours=8),
    MAX_CONTENT_LENGTH=16 * 1024,
)

if os.environ.get("RENDER") == "true" and not all(
    os.environ.get(nombre)
    for nombre in ("LOGIN_PASSWORD", "STUDENT_LOGIN_PASSWORD")
):
    raise RuntimeError("Configura LOGIN_PASSWORD y STUDENT_LOGIN_PASSWORD en Render.")

LOGIN_USERNAME = os.environ.get("LOGIN_USERNAME", "admin")
LOGIN_PASSWORD_HASH = generate_password_hash(os.environ.get("LOGIN_PASSWORD", "Password123"))
STUDENT_LOGIN_USERNAME = os.environ.get("STUDENT_LOGIN_USERNAME", "estudiante")
STUDENT_LOGIN_PASSWORD_HASH = generate_password_hash(
    os.environ.get("STUDENT_LOGIN_PASSWORD", "Estudiante123")
)


def solicitar_credenciales():
    """Pide las credenciales al iniciar sin guardarlas en archivos del proyecto."""
    usuario = input("Usuario para el sitio: ").strip()
    contrasena = getpass("Contraseña (no se mostrará): ")
    if not usuario or not contrasena:
        raise SystemExit("El usuario y la contraseña son obligatorios.")
    if len(contrasena) < 12:
        print("Aviso: por seguridad, se recomienda usar una contraseña de 12 caracteres o más.")
    return usuario, generate_password_hash(contrasena)


def csrf_valido(valor):
    token = session.get("csrf_token", "")
    return bool(token and valor and hmac.compare_digest(token, valor))


def inicio_siguiente_seguro(valor):
    if valor and valor.startswith("/") and not valor.startswith("//") and "\\" not in valor:
        return valor
    return "/index.html"


def bloqueado(ip):
    registro = FAILED_LOGINS.get(ip)
    if not registro:
        return False
    inicio, intentos = registro
    if time.time() - inicio >= LOGIN_WINDOW_SECONDS:
        FAILED_LOGINS.pop(ip, None)
        return False
    return intentos >= MAX_LOGIN_ATTEMPTS


def registrar_fallo(ip):
    ahora = time.time()
    inicio, intentos = FAILED_LOGINS.get(ip, (ahora, 0))
    if ahora - inicio >= LOGIN_WINDOW_SECONDS:
        inicio, intentos = ahora, 0
    FAILED_LOGINS[ip] = (inicio, intentos + 1)


@app.after_request
def encabezados_de_seguridad(respuesta):
    respuesta.headers["Cache-Control"] = "no-store"
    respuesta.headers["X-Content-Type-Options"] = "nosniff"
    respuesta.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return respuesta


@app.get("/")
def inicio():
    return redirect("/index.html")


@app.route("/login", defaults={"tipo": None}, methods=["GET", "POST"])
@app.route("/login/<tipo>", methods=["GET", "POST"])
def login(tipo):
    if tipo not in (None, "estudiante", "docente"):
        abort(404)

    if session.get("autenticado"):
        return redirect("/index.html")

    error = None
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_urlsafe(32)

    if request.method == "POST":
        ip = request.remote_addr or "desconocida"
        if not csrf_valido(request.form.get("csrf_token")):
            error = "La solicitud expiró. Recarga e inténtalo de nuevo."
        elif bloqueado(ip):
            error = "Demasiados intentos. Espera cinco minutos antes de volver a probar."
        else:
            rol = tipo or request.form.get("tipo", "docente")
            usuario = request.form.get("usuario", "").strip()
            contrasena = request.form.get("contrasena", "")
            if rol == "estudiante":
                usuario_esperado = STUDENT_LOGIN_USERNAME
                hash_esperado = STUDENT_LOGIN_PASSWORD_HASH
                nombre = "La Patria Milagro"
                bienvenida = "¡Bienvenido a La Patria Milagro!"
            elif rol == "docente":
                usuario_esperado = LOGIN_USERNAME
                hash_esperado = LOGIN_PASSWORD_HASH
                nombre = "Manuel Noriega" if usuario.lower() == "admin" else usuario
                bienvenida = "¡Bienvenido " + nombre + "!"
            else:
                usuario_esperado = ""
                hash_esperado = generate_password_hash(secrets.token_urlsafe(16))
                nombre = ""
                bienvenida = ""

            usuario_correcto = bool(usuario_esperado) and hmac.compare_digest(usuario, usuario_esperado)
            clave_correcta = check_password_hash(hash_esperado, contrasena)
            if usuario_correcto and clave_correcta:
                FAILED_LOGINS.pop(ip, None)
                destino = inicio_siguiente_seguro(request.form.get("next", ""))
                session.clear()
                session["autenticado"] = True
                session["usuario"] = usuario
                session["nombre"] = nombre
                session["rol"] = rol
                session["bienvenida"] = bienvenida
                session["csrf_token"] = secrets.token_urlsafe(32)
                session.permanent = True
                return redirect(destino)
            registrar_fallo(ip)
            error = "Usuario o contraseña incorrectos."

    return render_template(
        "login.html",
        error=error,
        csrf_token=session["csrf_token"],
        tipo=tipo,
        siguiente=inicio_siguiente_seguro(request.args.get("next", "")),
    )


@app.get("/auth/status")
def auth_status():
    return jsonify(
        autenticado=bool(session.get("autenticado")),
        usuario=session.get("usuario", ""),
        nombre=session.get("nombre", ""),
        rol=session.get("rol", ""),
        bienvenida=session.get("bienvenida", ""),
        csrf_token=session.get("csrf_token", ""),
    )


@app.post("/logout")
def logout():
    if not csrf_valido(request.form.get("csrf_token")):
        abort(400)
    session.clear()
    return redirect(url_for("login"))


@app.get("/<path:archivo>")
def servir_archivo(archivo):
    partes = Path(archivo).parts
    if len(partes) >= 2 and partes[0] in ASSET_DIRS:
        return send_from_directory(BASE_DIR, archivo)

    if archivo in PROTECTED_PAGES:
        if not session.get("autenticado"):
            siguiente = request.full_path[:-1] if request.full_path.endswith("?") else request.full_path
            return redirect(url_for("login", next=siguiente))
        return send_from_directory(BASE_DIR, archivo)

    abort(404)


if __name__ == "__main__":
    if not LOGIN_USERNAME or not LOGIN_PASSWORD_HASH:
        LOGIN_USERNAME = "admin"
        LOGIN_PASSWORD_HASH = generate_password_hash("Password123")
    print("Sitio protegido: inicia sesión en /login. Usa solo una red privada de confianza con HTTP.")
    app.run(host="192.168.1.57", port=8000, debug=False)
