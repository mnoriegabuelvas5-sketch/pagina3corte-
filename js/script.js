'use strict';

// Bienvenida compartida en todas las páginas del sitio.
(function configurarBienvenida() {
  var encabezado = document.querySelector('.cabecera');
  var titulo = document.querySelector('main h1');
  if (!encabezado || !titulo) return;

  var pagina = window.location.pathname.split('/').pop() || 'index.html';
  var enlaceActivo = Array.from(document.querySelectorAll('.menu a')).find(function (enlace) {
    return new URL(enlace.href, window.location.href).pathname.split('/').pop() === pagina;
  });
  var seccion = enlaceActivo ? enlaceActivo.textContent.trim() : titulo.textContent.trim();
  var bienvenida = document.createElement('div');
  bienvenida.className = 'bienvenida';
  bienvenida.setAttribute('role', 'status');
  bienvenida.setAttribute('aria-live', 'polite');

  var mensaje = document.createElement('p');
  var saludo = document.createElement('strong');
  var destino = document.createElement('span');
  saludo.textContent = '¡Bienvenido Manuel Noriega!';
  destino.textContent = ' Estás en: ' + seccion;
  mensaje.appendChild(saludo);
  mensaje.appendChild(destino);
  bienvenida.appendChild(mensaje);
  encabezado.insertAdjacentElement('afterend', bienvenida);

  fetch('/auth/status', { credentials: 'same-origin', cache: 'no-store' })
    .then(function (respuesta) {
      if (!respuesta.ok) return null;
      return respuesta.json();
    })
    .then(function (estado) {
      if (estado && estado.autenticado && estado.bienvenida) {
        saludo.textContent = estado.bienvenida;
      }
    })
    .catch(function () {});
})();

// Añade el cierre de sesión solo cuando el servidor confirma una sesión activa.
(function configurarCerrarSesion() {
  var acciones = document.querySelector('.cabecera-acciones');
  if (!acciones) return;

  fetch('/auth/status', { credentials: 'same-origin', cache: 'no-store' })
    .then(function (respuesta) {
      if (!respuesta.ok) return null;
      return respuesta.json();
    })
    .then(function (estado) {
      if (!estado || !estado.autenticado || !estado.csrf_token) return;

      var formulario = document.createElement('form');
      formulario.className = 'cerrar-sesion-form';
      formulario.method = 'post';
      formulario.action = '/logout';

      var token = document.createElement('input');
      token.type = 'hidden';
      token.name = 'csrf_token';
      token.value = estado.csrf_token;

      var boton = document.createElement('button');
      boton.type = 'submit';
      boton.className = 'cerrar-sesion';
      boton.textContent = 'Cerrar sesión';
      formulario.appendChild(token);
      formulario.appendChild(boton);
      acciones.appendChild(formulario);
    })
    .catch(function () {});
})();

// Tiempo en línea y temporizador para estudiantes y docentes.
(function configurarTiempoEnLinea() {
  var tiempoEnLinea = document.getElementById('tiempo-en-linea');
  if (!tiempoEnLinea) return;

  var segundos = 0;
  var intervalo = null;

  function formatearTiempo(total) {
    var horas = Math.floor(total / 3600);
    var minutos = Math.floor((total % 3600) / 60);
    var segundosRestantes = total % 60;
    return String(horas).padStart(2, '0') + ':' + String(minutos).padStart(2, '0') + ':' + String(segundosRestantes).padStart(2, '0');
  }

  function actualizarPantalla() {
    tiempoEnLinea.textContent = formatearTiempo(segundos);
  }

  function iniciarCuenta() {
    if (intervalo) return;
    intervalo = setInterval(function () {
      if (document.visibilityState === 'visible' && !document.hidden) {
        segundos += 1;
        actualizarPantalla();
      }
    }, 1000);
  }

  function detenerCuenta() {
    if (intervalo) {
      clearInterval(intervalo);
      intervalo = null;
    }
  }

  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function (evento) {
    window.addEventListener(evento, iniciarCuenta, { passive: true });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      iniciarCuenta();
    } else {
      detenerCuenta();
    }
  });

  actualizarPantalla();
  iniciarCuenta();
})();

(function configurarTemporizadores() {
  document.querySelectorAll('.temporizador-card').forEach(function (card) {
    var display = card.querySelector('.temporizador-display');
    var startButton = card.querySelector('[data-role="start"]');
    var resetButton = card.querySelector('[data-role="reset"]');
    var total = Number(card.dataset.seconds || 0);
    var remaining = total;
    var intervalId = null;

    function formatearTiempo(segundos) {
      var minutos = Math.floor(segundos / 60);
      var segundosRestantes = segundos % 60;
      return String(minutos).padStart(2, '0') + ':' + String(segundosRestantes).padStart(2, '0');
    }

    function actualizarPantalla() {
      display.textContent = formatearTiempo(remaining);
    }

    function detener() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function iniciar() {
      if (intervalId) return;
      intervalId = setInterval(function () {
        if (remaining <= 0) {
          detener();
          display.textContent = '00:00';
          return;
        }
        remaining -= 1;
        actualizarPantalla();
      }, 1000);
    }

    startButton.addEventListener('click', function () {
      if (remaining <= 0) {
        remaining = total;
      }
      iniciar();
    });

    resetButton.addEventListener('click', function () {
      detener();
      remaining = total;
      actualizarPantalla();
    });

    actualizarPantalla();
  });
})();

// Consejo del día y evaluación de hábitos.
(function configurarConsejos() {
  var consejo = document.getElementById('consejo-del-dia');
  if (consejo) {
    var consejos = [
      'Limpia el teclado y el mouse con un paño seco para evitar acumulación de polvo y bacterias.',
      'No tapes las ventilaciones del computador; el flujo de aire ayuda a mantenerlo fresco y duradero.',
      'Haz pausas cortas cada 20–30 minutos para cuidar la vista y evitar tensión en el cuello y la espalda.',
      'Usa contraseñas diferentes en cada cuenta importante para proteger mejor tus datos personales.',
      'Guarda copias de tus archivos importantes en otra unidad o en la nube para prevenir pérdidas.'
    ];

    var indice = Math.abs(new Date().getTime()) % consejos.length;
    consejo.textContent = consejos[indice];
  }

  var boton = document.getElementById('evaluar-habitos');
  var resultado = document.getElementById('resultado-habitos');
  if (!boton || !resultado) return;

  boton.addEventListener('click', function () {
    var form = document.getElementById('test-habitos-form');
    if (!form) return;

    var opciones = form.querySelectorAll('input[type="checkbox"]');
    var seleccionadas = Array.from(opciones).filter(function (opcion) {
      return opcion.checked;
    }).length;
    var total = opciones.length;
    var porcentaje = Math.round((seleccionadas / total) * 100);

    var mensaje = porcentaje >= 75
      ? '¡Excelente! Mantienes muy buenos hábitos de cuidado y seguridad.'
      : porcentaje >= 50
        ? 'Muy bien. Estás en buen camino; solo falta reforzar algunos hábitos.'
        : 'Sigue mejorando. Unos pequeños cambios pueden marcar mucha diferencia.';

    resultado.textContent = mensaje + ' Has marcado ' + seleccionadas + ' de ' + total + ' buenas prácticas.';
    resultado.style.color = porcentaje >= 75 ? '#1d6f6d' : porcentaje >= 50 ? '#17364d' : '#5a6877';
  });
})();

// Tema claro/oscuro con guardado local.
(function configurarTema() {
  var toggle = document.querySelector('.tema-toggle');
  var cuerpo = document.body;
  if (!toggle || !cuerpo) return;

  var icono = toggle.querySelector('.tema-toggle-icon');
  var texto = toggle.querySelector('.tema-toggle-text');
  var clave = 'buen-uso-computador-tema';

  function aplicarTema(tema) {
    var oscuro = tema === 'dark';
    cuerpo.setAttribute('data-theme', tema);
    toggle.setAttribute('aria-pressed', String(oscuro));
    toggle.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    if (icono) icono.textContent = oscuro ? '🌙' : '☀️';
    if (texto) texto.textContent = oscuro ? 'Oscuro' : 'Claro';
  }

  try {
    var guardado = localStorage.getItem(clave);
    if (guardado === 'dark' || guardado === 'light') {
      aplicarTema(guardado);
    } else {
      aplicarTema(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  } catch (error) {
    aplicarTema('light');
  }

  toggle.addEventListener('click', function () {
    var temaActual = cuerpo.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    aplicarTema(temaActual);
    try {
      localStorage.setItem(clave, temaActual);
    } catch (error) {
      // El tema sigue funcionando aunque no se pueda guardar.
    }
  });
})();

// Navegación móvil: apertura, cierre al elegir un enlace y tecla Escape.
(function configurarMenu() {
  var boton = document.querySelector('.menu-boton');
  var menu = document.getElementById('menu');
  if (!boton || !menu) return;

  boton.addEventListener('click', function () {
    var abierto = menu.classList.toggle('abierto');
    boton.setAttribute('aria-expanded', String(abierto));
  });

  menu.addEventListener('click', function (evento) {
    if (evento.target.closest('a')) {
      menu.classList.remove('abierto');
      boton.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && menu.classList.contains('abierto')) {
      menu.classList.remove('abierto');
      boton.setAttribute('aria-expanded', 'false');
      boton.focus();
    }
  });
})();

// Lista de hábitos con guardado local opcional.
(function configurarHabitos() {
  var casillas = Array.from(document.querySelectorAll('.habitos input[type="checkbox"]'));
  var barra = document.getElementById('barra');
  var texto = document.getElementById('resultado');
  var progreso = document.querySelector('.progreso');
  if (!casillas.length || !barra || !texto || !progreso) return;

  var clave = 'buen-uso-computador-habitos';
  try {
    var guardados = JSON.parse(localStorage.getItem(clave) || '[]');
    casillas.forEach(function (casilla, indice) {
      casilla.checked = guardados[indice] === true;
    });
  } catch (error) {
    // La lista también funciona si el navegador bloquea el almacenamiento local.
  }

  function actualizar() {
    var marcadas = casillas.filter(function (casilla) { return casilla.checked; }).length;
    var total = casillas.length;
    var porcentaje = Math.round((marcadas / total) * 100);
    barra.style.width = porcentaje + '%';
    progreso.setAttribute('aria-valuenow', String(porcentaje));
    texto.textContent = marcadas === total
      ? 'Los cumples todos. Sigue así.'
      : 'Has marcado ' + marcadas + ' de ' + total + ' hábitos.';

    try {
      localStorage.setItem(clave, JSON.stringify(casillas.map(function (casilla) { return casilla.checked; })));
    } catch (error) {
      // El indicador sigue actualizándose aunque no se pueda guardar.
    }
  }

  casillas.forEach(function (casilla) { casilla.addEventListener('change', actualizar); });
  actualizar();
})();

// Controles para expandir y contraer los temas de cuidado.
(function configurarAcordeones() {
  var temas = document.querySelectorAll('details.tema');
  var abrir = document.getElementById('abrir-todo');
  var cerrar = document.getElementById('cerrar-todo');
  if (!temas.length) return;

  if (abrir) abrir.addEventListener('click', function () {
    temas.forEach(function (tema) { tema.open = true; });
  });
  if (cerrar) cerrar.addEventListener('click', function () {
    temas.forEach(function (tema) { tema.open = false; });
  });
})();

// Evaluación orientativa de una contraseña inventada; nunca se almacena.
(function configurarMedidor() {
  var campo = document.getElementById('clave');
  var barra = document.getElementById('medidor');
  var contenedor = document.querySelector('.medidor');
  var veredicto = document.getElementById('veredicto');
  if (!campo || !barra || !contenedor || !veredicto) return;

  var mensajes = [
    'Aún no has escrito nada.',
    'Muy débil: es fácil de adivinar.',
    'Débil: hazla más larga.',
    'Aceptable: agrega mayúsculas, números o símbolos.',
    'Buena: casi lista.',
    'Fuerte: larga y variada.'
  ];

  campo.addEventListener('input', function () {
    var valor = campo.value;
    var puntos = 0;
    if (valor.length >= 8) puntos++;
    if (valor.length >= 12) puntos++;
    if (/[a-z]/.test(valor) && /[A-Z]/.test(valor)) puntos++;
    if (/[0-9]/.test(valor)) puntos++;
    if (/[^A-Za-z0-9]/.test(valor)) puntos++;

    var porcentaje = Math.round((puntos / 5) * 100);
    barra.style.width = porcentaje + '%';
    contenedor.setAttribute('aria-valuenow', String(porcentaje));
    veredicto.textContent = mensajes[puntos];
  });
})();

// Temporizador de descanso visual de 20 segundos.
(function configurarTemporizador() {
  var reloj = document.getElementById('reloj');
  var mensaje = document.getElementById('mensaje-reloj');
  var iniciar = document.getElementById('iniciar');
  var reiniciar = document.getElementById('reiniciar');
  if (!reloj || !mensaje || !iniciar || !reiniciar) return;

  var intervalo = null;
  var restante = 20;

  function detener() {
    window.clearInterval(intervalo);
    intervalo = null;
    iniciar.disabled = false;
  }

  iniciar.addEventListener('click', function () {
    if (intervalo) return;
    restante = 20;
    reloj.textContent = String(restante);
    mensaje.textContent = 'Mira hacia un punto lejano y relaja la vista.';
    iniciar.disabled = true;

    intervalo = window.setInterval(function () {
      restante--;
      reloj.textContent = String(restante);
      if (restante <= 0) {
        detener();
        mensaje.textContent = 'Listo, descanso completado. Puedes volver al trabajo.';
      }
    }, 1000);
  });

  reiniciar.addEventListener('click', function () {
    detener();
    restante = 20;
    reloj.textContent = String(restante);
    mensaje.textContent = 'Pulsa el botón y mira hacia un punto lejano.';
  });
})();

// Generación real de QR para abrir la firma desde móvil.
(function configurarQR() {
  var contenedores = document.querySelectorAll('.qr-imagen');
  if (!contenedores.length) return;
  var entradaDireccion = document.getElementById('qr-direccion');
  var botonActualizar = document.getElementById('actualizar-qr');
  var baseManual = 'http://192.168.1.57:8000';

  try {
    baseManual = localStorage.getItem('qr-base-red') || baseManual;
  } catch (error) {}

  if (entradaDireccion && baseManual) entradaDireccion.value = baseManual;

  function obtenerBaseMovil() {
    var hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname.slice(-6) !== '.local') {
      return Promise.resolve(window.location.origin);
    }

    function esIPv4Privada(ip) {
      var partes = ip.split('.').map(Number);
      if (partes.length !== 4 || partes.some(function (parte) { return !Number.isInteger(parte) || parte < 0 || parte > 255; })) return false;
      return partes[0] === 10 ||
        (partes[0] === 192 && partes[1] === 168) ||
        (partes[0] === 172 && partes[1] >= 16 && partes[1] <= 31);
    }

    return new Promise(function (resolver) {
      var rtcp = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
      if (!rtcp) {
        resolver(null);
        return;
      }

      var peer;
      var resuelto = false;
      var timeout = window.setTimeout(function () {
        if (resuelto) return;
        resuelto = true;
        peer.close();
        resolver(null);
      }, 3000);

      function finalizar(ip) {
        if (resuelto) return;
        resuelto = true;
        window.clearTimeout(timeout);
        peer.close();
        resolver('http://' + ip + ':8000');
      }

      try {
        peer = new rtcp({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peer.createDataChannel('');
        peer.onicecandidate = function (evento) {
          if (!evento || !evento.candidate) return;
          var coincidencia = evento.candidate.candidate.match(/(?:^|\s)(\d{1,3}(?:\.\d{1,3}){3})(?:\s|$)/);
          var ip = coincidencia && coincidencia[1];
          if (ip && esIPv4Privada(ip)) finalizar(ip);
        };
        peer.createOffer().then(function (oferta) {
          return peer.setLocalDescription(oferta);
        }).catch(function () {
          if (resuelto) return;
          resuelto = true;
          window.clearTimeout(timeout);
          peer.close();
          resolver(null);
        });
      } catch (error) {
        window.clearTimeout(timeout);
        resolver(null);
      }
    });
  }

  function establecerEstado(texto, esError) {
    var estado = document.getElementById('qr-estado');
    if (!estado) return;
    estado.textContent = texto;
    estado.classList.toggle('qr-estado-error', Boolean(esError));
  }

  function mostrarQR(tipo, base) {
    var contenedor = document.querySelector('.qr-imagen[data-qr="' + tipo + '"]');
    if (!contenedor) return;
    var url = base + '/firma-movil.html?tipo=' + tipo;
    var imagenUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(url);
    contenedor.src = imagenUrl;
    contenedor.alt = 'Código QR para firmar como ' + tipo;
    contenedor.title = 'Escanear para firmar como ' + tipo;
  }

  function mostrarTodos(base) {
    contenedores.forEach(function (contenedor) {
      if (contenedor.dataset.qr) mostrarQR(contenedor.dataset.qr, base);
    });
    establecerEstado('Códigos QR listos. El celular debe estar en la misma Wi-Fi y el servidor local debe aceptar conexiones de la red.', false);
  }

  function validarDireccion(valor) {
    try {
      var url = new URL(valor.trim());
      if ((url.protocol !== 'http:' && url.protocol !== 'https:') || !url.hostname ||
          url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.slice(-6) === '.local') return '';
      return url.origin;
    } catch (error) {
      return '';
    }
  }

  function mostrarErrorRed() {
    contenedores.forEach(function (imagen) {
      imagen.removeAttribute('src');
      imagen.alt = 'No hay dirección de red disponible para este código QR.';
    });
    establecerEstado('No se detectó la IPv4 local. Busca “Dirección IPv4” con ipconfig, escríbela arriba (por ejemplo, http://192.168.1.25:8000) y actualiza los códigos.', true);
  }

  if (baseManual) {
    mostrarTodos(baseManual);
  } else {
    obtenerBaseMovil().then(function (base) {
      if (base) mostrarTodos(base);
      else mostrarErrorRed();
    }).catch(function () {
      establecerEstado('No se pudo preparar el código QR. Comprueba la conexión de red y vuelve a cargar la página.', true);
    });
  }

  if (botonActualizar && entradaDireccion) {
    botonActualizar.addEventListener('click', function () {
      var base = validarDireccion(entradaDireccion.value);
      if (!base) {
        establecerEstado('Escribe una dirección válida de la red, por ejemplo http://192.168.1.25:8000. No uses localhost ni una dirección .local.', true);
        return;
      }
      baseManual = base;
      entradaDireccion.value = base;
      try {
        localStorage.setItem('qr-base-red', base);
      } catch (error) {}
      mostrarTodos(base);
    });
  }

})();

// Firma desde móvil con almacenamiento en localStorage.
(function configurarFirmaMovil() {
  var formulario = document.getElementById('formulario-firma-movil');
  var tipo = document.getElementById('tipo-firma');
  var nombre = document.getElementById('nombre-firma');
  var documento = document.getElementById('documento-firma');
  var canvas = document.getElementById('canvas-firma');
  var limpiar = document.getElementById('limpiar-firma');
  var mensaje = document.getElementById('mensaje-firma');
  var lista = document.getElementById('lista-firmas');
  var listaMovil = document.getElementById('lista-firmas-movil');

  if (!formulario || !tipo || !nombre || !documento || !canvas || !limpiar || !mensaje) return;

  var contexto = canvas.getContext('2d');
  var dibujando = false;
  var ultimaX = 0;
  var ultimaY = 0;

  function prepararCanvas() {
    contexto.lineWidth = 3;
    contexto.lineCap = 'round';
    contexto.lineJoin = 'round';
    contexto.strokeStyle = '#0f172a';
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, canvas.width, canvas.height);
  }

  function obtenerTipoDesdeURL() {
    var params = new URLSearchParams(window.location.search);
    var valor = params.get('tipo');
    if (valor === 'docentes' || valor === 'estudiantes') {
      tipo.value = valor;
    }
  }

  function getPosicion(event) {
    var rect = canvas.getBoundingClientRect();
    var escalaX = canvas.width / rect.width;
    var escalaY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * escalaX,
      y: (event.clientY - rect.top) * escalaY
    };
  }

  function iniciarDibujo(event) {
    dibujando = true;
    var punto = getPosicion(event);
    ultimaX = punto.x;
    ultimaY = punto.y;
    contexto.beginPath();
    contexto.moveTo(ultimaX, ultimaY);
    contexto.lineTo(ultimaX, ultimaY);
    contexto.stroke();
    if (canvas.setPointerCapture) {
      canvas.setPointerCapture(event.pointerId);
    }
  }

  function dibujar(event) {
    if (!dibujando) return;
    var punto = getPosicion(event);
    contexto.beginPath();
    contexto.moveTo(ultimaX, ultimaY);
    contexto.lineTo(punto.x, punto.y);
    contexto.stroke();
    ultimaX = punto.x;
    ultimaY = punto.y;
  }

  function detenerDibujo(event) {
    dibujando = false;
    if (event && canvas.releasePointerCapture && event.pointerId !== undefined) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch (error) {}
    }
  }

  function guardarFirmaLocal(firma) {
    var firmas = [];
    try {
      firmas = JSON.parse(localStorage.getItem('firmas-guardadas') || '[]');
    } catch (error) {
      firmas = [];
    }
    firmas.push(firma);
    localStorage.setItem('firmas-guardadas', JSON.stringify(firmas));
  }

  function renderFirmas() {
    var destino = lista || listaMovil;
    if (!destino) return;

    var firmas = [];
    try {
      firmas = JSON.parse(localStorage.getItem('firmas-guardadas') || '[]');
    } catch (error) {
      firmas = [];
    }

    if (!firmas.length) {
      destino.innerHTML = '<p>No hay firmas registradas todavía.</p>';
      return;
    }

    destino.innerHTML = firmas.slice().reverse().map(function (firma) {
      return '<article class="firma-item"><img src="' + firma.imagen + '" alt="Firma de ' + firma.nombre + '"><p><strong>' + firma.nombre + '</strong></p><p>' + firma.tipo + '</p><p>' + firma.documento + '</p><p>' + firma.fecha + '</p></article>';
    }).join('');
  }

  canvas.addEventListener('pointerdown', iniciarDibujo);
  canvas.addEventListener('pointermove', dibujar);
  canvas.addEventListener('pointerup', detenerDibujo);
  canvas.addEventListener('pointerleave', detenerDibujo);
  canvas.addEventListener('pointercancel', detenerDibujo);
  limpiar.addEventListener('click', function () {
    prepararCanvas();
    mensaje.textContent = 'La hoja en blanco está lista para firmar.';
  });

  obtenerTipoDesdeURL();
  prepararCanvas();
  renderFirmas();

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();

    var nombreValor = nombre.value.trim();
    var documentoValor = documento.value.trim();
    var tipoValor = tipo.value;

    if (!nombreValor || !documentoValor) {
      mensaje.textContent = 'Completa el nombre y el documento antes de guardar.';
      return;
    }

    var datos = contexto.getImageData(0, 0, canvas.width, canvas.height).data;
    var tieneMarca = false;
    for (var i = 0; i < datos.length; i += 4) {
      if (datos[i] < 250 || datos[i + 1] < 250 || datos[i + 2] < 250) {
        tieneMarca = true;
        break;
      }
    }

    if (!tieneMarca) {
      mensaje.textContent = 'Debes firmar en la hoja en blanco antes de subir la firma.';
      return;
    }

    var firma = {
      tipo: tipoValor === 'docentes' ? 'Docente' : 'Estudiante',
      nombre: nombreValor,
      documento: documentoValor,
      fecha: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
      imagen: canvas.toDataURL('image/png')
    };

    guardarFirmaLocal(firma);
    renderFirmas();
    mensaje.textContent = 'Firma subida correctamente.';
    formulario.reset();
    tipo.value = tipoValor;
    prepararCanvas();
  });
})();
