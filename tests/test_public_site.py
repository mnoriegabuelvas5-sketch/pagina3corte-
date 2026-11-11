import app as app_module


def test_home_and_pages_are_public():
    client = app_module.app.test_client()

    home = client.get("/")
    assert home.status_code == 302
    assert home.headers["Location"] == "/index.html"
    assert client.get("/index.html").status_code == 200
    assert client.get("/firmas.html").status_code == 200
    assert client.get("/postura.html").status_code == 200
    assert client.get("/css/estilos.css").status_code == 200
    assert client.get("/js/script.js").status_code == 200


def test_login_routes_are_removed():
    client = app_module.app.test_client()

    assert client.get("/login").status_code == 404
    assert client.get("/login/estudiante").status_code == 404
    assert client.get("/login/docente").status_code == 404
