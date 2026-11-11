from pathlib import Path

from flask import Flask, abort, redirect, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_PAGES = {
    "cuidado.html",
    "equipo.html",
    "ergonomia.html",
    "firma-movil.html",
    "firmas.html",
    "galeria.html",
    "index-completo.html",
    "index.html",
    "postura.html",
    "seguridad.html",
}
ASSET_DIRS = {"css", "js", "imagenes"}

app = Flask(__name__)


@app.after_request
def encabezados_de_seguridad(respuesta):
    respuesta.headers["X-Content-Type-Options"] = "nosniff"
    respuesta.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return respuesta


@app.get("/")
def inicio():
    return redirect("/index.html")


@app.route("/login", defaults={"tipo": None}, methods=["GET", "POST"])
@app.route("/login/<tipo>", methods=["GET", "POST"])
def login_eliminado(tipo):
    return redirect("/index.html")


@app.get("/<path:archivo>")
def servir_archivo(archivo):
    partes = Path(archivo).parts
    if len(partes) >= 2 and partes[0] in ASSET_DIRS:
        return send_from_directory(BASE_DIR, archivo)

    if archivo in PUBLIC_PAGES:
        return send_from_directory(BASE_DIR, archivo)

    abort(404)


if __name__ == "__main__":
    print("Sitio público iniciado en http://192.168.1.57:8000")
    app.run(host="192.168.1.57", port=8000, debug=False)