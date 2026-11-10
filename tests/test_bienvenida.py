import re

from werkzeug.security import generate_password_hash

import app as app_module


def test_login_muestra_bienvenida_de_manuel_noriega():
    app_module.FAILED_LOGINS.clear()
    app_module.LOGIN_USERNAME = "admin"
    app_module.LOGIN_PASSWORD_HASH = generate_password_hash("Password123")
    client = app_module.app.test_client()

    login_page = client.get("/login/docente")
    csrf_match = re.search(r'name="csrf_token" value="([^"]+)"', login_page.get_data(as_text=True))
    assert csrf_match is not None
    csrf_token = csrf_match.group(1)

    response = client.post(
        "/login/docente",
        data={
            "usuario": "admin",
            "contrasena": "Password123",
            "csrf_token": csrf_token,
        },
        follow_redirects=False,
    )

    assert response.status_code == 302
    status = client.get("/auth/status")
    assert status.status_code == 200
    assert status.json["nombre"] == "Manuel Noriega"


def test_login_estudiante_separado_y_bienvenida_patria_milagro():
    app_module.FAILED_LOGINS.clear()
    client = app_module.app.test_client()
    login_page = client.get("/login/estudiante")
    csrf_match = re.search(r'name="csrf_token" value="([^"]+)"', login_page.get_data(as_text=True))
    assert csrf_match is not None
    csrf_token = csrf_match.group(1)

    rechazo_docente = client.post(
        "/login/docente",
        data={
            "usuario": app_module.STUDENT_LOGIN_USERNAME,
            "contrasena": "Estudiante123",
            "csrf_token": csrf_token,
        },
        follow_redirects=False,
    )
    assert rechazo_docente.status_code == 200
    assert "Usuario o contraseña incorrectos." in rechazo_docente.get_data(as_text=True)

    acceso_estudiante = client.post(
        "/login/estudiante",
        data={
            "usuario": app_module.STUDENT_LOGIN_USERNAME,
            "contrasena": "Estudiante123",
            "csrf_token": csrf_token,
        },
        follow_redirects=False,
    )
    assert acceso_estudiante.status_code == 302
    status = client.get("/auth/status")
    assert status.json["rol"] == "estudiante"
    assert status.json["bienvenida"] == "¡Bienvenido a La Patria Milagro!"
