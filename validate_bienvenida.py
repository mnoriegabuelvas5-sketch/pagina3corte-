import re
import app as app_module
from werkzeug.security import generate_password_hash

app_module.LOGIN_USERNAME = 'admin'
app_module.LOGIN_PASSWORD_HASH = generate_password_hash('Password123')
client = app_module.app.test_client()
page = client.get('/login')
match = re.search(r'name="csrf_token" value="([^"]+)"', page.get_data(as_text=True))
assert match, 'No se encontró el token CSRF'
csrf_token = match.group(1)
response = client.post('/login', data={'usuario': 'admin', 'contrasena': 'Password123', 'csrf_token': csrf_token}, follow_redirects=False)
assert response.status_code == 302, response.status_code
status = client.get('/auth/status')
print(status.json)
assert status.json['nombre'] == 'Manuel Noriega'
print('VALIDACION_OK')
