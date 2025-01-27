// Versión 3.4

// Estado inicial del juego
let credits = 0;
let currentPlayer = 'jugador'; // Puede ser 'jugador' o 'cpu'

// Función para crear una carta
function crearCarta(palo, valor) {
    return {
        palo: palo, // Espadas, Bastos, Copas, Oros
        valor: valor, // 1-12 (1: As, 10: Sota, 11: Caballo, 12: Rey)
        obtenerNombre: function() {
            const nombres = {
                1: 'As',
                10: 'Sota',
                11: 'Caballo',
                12: 'Rey'
            };
            return nombres[this.valor] || this.valor.toString();
        },
        obtenerValorTruco: function() {
            const valoresTruco = {
                1: 14, 7: 13, 3: 12, 2: 11,
                12: 10, 11: 9, 10: 8, 6: 7,
                5: 6, 4: 5
            };
            return valoresTruco[this.valor] || 0;
        }
    };
}

// Función para crear un mazo
function crearMazo() {
    const cartas = [];
    const palos = ['Espadas', 'Bastos', 'Copas', 'Oros'];
    palos.forEach(palo => {
        for (let valor = 1; valor <= 7; valor++) {
            cartas.push(crearCarta(palo, valor));
        }
        for (let valor = 10; valor <= 12; valor++) {
            cartas.push(crearCarta(palo, valor));
        }
    });
    barajar(cartas);
    return cartas;
}

// Función para barajar el mazo
function barajar(cartas) {
    for (let i = cartas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
    }
}

// Función para repartir cartas
function repartirCartas(jugador, cpu, mazo) {
    for (let i = 0; i < 3; i++) {
        jugador.mano.push(mazo.pop());
        cpu.mano.push(mazo.pop());
    }
}

// Función para determinar si un jugador tiene flor
function tieneFlor(jugador) {
    const palos = jugador.mano.map(carta => carta.palo);
    const frecuencia = {};
    palos.forEach(palo => {
        frecuencia[palo] = (frecuencia[palo] || 0) + 1;
    });
    for (let palo in frecuencia) {
        if (frecuencia[palo] === 3) {
            return palo;
        }
    }
    return false;
}

// Función para calcular el valor de la flor
function calcularValorFlor(jugador) {
    return calcularPuntosPorPalo(jugador.mano, 3);
}

// Función para calcular el valor de envido
function calcularEnvido(mano) {
    return calcularPuntosPorPalo(mano);
}

// Función auxiliar para calcular puntos por palo
function calcularPuntosPorPalo(mano, minCartas = 2) {
    const frecuencia = mano.reduce((acc, carta) => {
        acc[carta.palo] = (acc[carta.palo] || 0) + 1;
        return acc;
    }, {});
    for (let palo in frecuencia) {
        if (frecuencia[palo] >= minCartas) {
            const cartasDelPalo = mano.filter(carta => carta.palo === palo);
            return cartasDelPalo.reduce((sum, carta) => sum + carta.valor, 0) + 20;
        }
    }
    return Math.max(...mano.map(carta => carta.valor));
}

// Función para manejar el juego del jugador
function manejarJuegoJugador(juego) {
    mostrarMensaje('Es tu turno. Elige una carta para jugar.');
    // Lógica para manejar la selección de la carta del jugador (similar al código original)
    // ...
}

// Función para manejar el juego de la CPU
function manejarJuegoCPU(juego) {
    juego.cpu.jugarTurno(juego).then(cartaSeleccionada => {
        mostrarMensaje(`CPU juega ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);
        procesarCartaJugada(juego, cartaSeleccionada, 'cpu');
        juego.cambiarTurno();
        mostrarOpciones(juego);
    });
}

// Función para mostrar las opciones de juego
function mostrarOpciones(juego) {
    const opciones = document.querySelector('.game-options');
    opciones.innerHTML = '';

    if (juego.turno === 'jugador') {
        opciones.innerHTML = `
            <div class="option" id="trucoBtn">TRUCO</div>
            <div class="option" id="envidoBtn">ENVIDO</div>
            <div class="option" id="florBtn">FLOR</div>
            <div class="option" id="retirarseBtn">RETIRARSE</div>
        `;
    } else {
        manejarJuegoCPU(juego);
        return;
    }

    document.getElementById('trucoBtn')?.addEventListener('click', () => jugarTruco(juego, 'jugador'));
    document.getElementById('envidoBtn')?.addEventListener('click', () => jugarEnvido(juego, 'jugador'));
    document.getElementById('florBtn')?.addEventListener('click', () => jugarFlor(juego, 'jugador'));
    document.getElementById('retirarseBtn')?.addEventListener('click', () => retirarse(juego, 'jugador'));
}

// Funciones para manejar las diferentes acciones del juego
function jugarTruco(juego, jugador) {
    mostrarMensaje(`${jugador} juega TRUCO`);
    juego.estadoDelJuego.trucoActivo = true;
    juego.cambiarTurno();
}

function jugarEnvido(juego, jugador) {
    mostrarMensaje(`${jugador} juega ENVIDO`);
    juego.estadoDelJuego.envidoActivo = true;

    let valorEnvidoJugador = calcularEnvido(juego.jugador.mano);
    let valorEnvidoCPU = calcularEnvido(juego.cpu.mano);

    let apuestaActual = 2;
    let envidoActivo = true;

    mostrarMensaje(`Envido iniciado. Jugador: ${valorEnvidoJugador}, CPU: ${valorEnvidoCPU}`);

    while (envidoActivo) {
        if (jugador === 'jugador') {
            let deseaAumentar = confirm('¿Deseas aumentar la apuesta (Real Envido o Falta Envido)?');
            if (deseaAumentar) {
                apuestaActual += 2;
                mostrarMensaje(`Jugador aumenta la apuesta a ${apuestaActual}`);
            } else {
                envidoActivo = false;
                mostrarMensaje('Jugador no aumenta la apuesta');
            }
        }

        let respuestaCPU = juego.cpu.decidirApostarEnvido();
        if (respuestaCPU === 'Quiero') {
            mostrarMensaje(`CPU acepta la apuesta de ${apuestaActual}`);
            if (jugador === 'jugador') {
                jugador = 'cpu';
            } else {
                envidoActivo = false;
            }
        } else {
            mostrarMensaje('CPU no quiere la apuesta');
            juego.jugador.sumarPuntos(1);
            juego.actualizarCreditos();
            return juego.cambiarTurno();
        }
    }

    if (valorEnvidoJugador > valorEnvidoCPU) {
        juego.jugador.sumarPuntos(apuestaActual);
        mostrarMensaje(`Jugador gana el Envido y suma ${apuestaActual} puntos`);
    } else {
        juego.cpu.sumarPuntos(apuestaActual);
        mostrarMensaje(`CPU gana el Envido y suma ${apuestaActual} puntos`);
    }

    juego.actualizarCreditos();
    juego.cambiarTurno();
}

function jugarFlor(juego, jugador) {
    if (juego.florJugador) {
        mostrarMensaje('El jugador tiene Flor');
        document.getElementById('florAnnouncement').style.display = 'block';
        document.getElementById('anunciarFlorBtn').addEventListener('click', () => {
            anunciarFlor(juego, 'jugador');
            document.getElementById('florAnnouncement').style.display = 'none';
        });
    } else if (juego.florCPU) {
        mostrarMensaje('La CPU tiene Flor');
        const anunciarCPU = juego.cpu.decidirAnunciarFlor();
        if (anunciarCPU) {
            anunciarFlor(juego, 'cpu');
        } else {
            mostrarOpciones(juego);
        }
    } else {
        mostrarOpciones(juego);
    }
}

function anunciarFlor(juego, jugador) {
    if (jugador === 'jugador') {
        mostrarMensaje('El jugador anuncia Flor');
        const valorFlor = calcularValorFlor(juego.jugador);
        mostrarMensaje(`Valor de la Flor del jugador: ${valorFlor}`);
        const respuestaCPU = juego.cpu.decidirApostarFlor(valorFlor);
        if (respuestaCPU === 'Quiero') {
            mostrarMensaje('CPU quiere la Flor');
            if (valorFlor > calcularValorFlor(juego.cpu)) {
                juego.jugador.sumarPuntos(3);
                mostrarMensaje('Jugador gana la Flor');
            } else {
                juego.cpu.sumarPuntos(3);
                mostrarMensaje('CPU gana la Flor');
            }
        } else {
            mostrarMensaje('CPU no quiere la Flor');
            juego.jugador.sumarPuntos(3);
        }
    } else if (jugador === 'cpu') {
        mostrarMensaje('La CPU anuncia Flor');
        const valorFlorCPU = calcularValorFlor(juego.cpu);
        mostrarMensaje(`Valor de la Flor de la CPU: ${valorFlorCPU}`);
        const respuestaJugador = juego.jugador.decidirApostarFlor(valorFlorCPU);
        if (respuestaJugador === 'Quiero') {
            mostrarMensaje('Jugador quiere la Flor');
            if (calcularValorFlor(juego.jugador) > valorFlorCPU) {
                juego.jugador.sumarPuntos(3);
                mostrarMensaje('Jugador gana la Flor');
            } else {
                juego.cpu.sumarPuntos(3);
                mostrarMensaje('CPU gana la Flor');
            }
        } else {
            mostrarMensaje('Jugador no quiere la Flor');
            juego.cpu.sumarPuntos(3);
        }
    }
}

// Función para manejar la retirada de un jugador
function retirarse(juego, jugador) {
    mostrarMensaje(`${jugador} se retira del juego`);
    if (jugador === 'jugador') {
        juego.cpu.sumarPuntos(juego.jugador.obtenerPuntos());
        mostrarMensaje('CPU gana el juego');
    } else {
        juego.jugador.sumarPuntos(juego.cpu.obtenerPuntos());
        mostrarMensaje('Jugador gana el juego');
    }
    juego.actualizarCreditos();
}

// Función para mostrar mensajes en el juego
function mostrarMensaje(mensaje) {
    const gameMessages = document.getElementById('gameMessages');
    if (!gameMessages) {
        console.warn('El contenedor de mensajes no existe en el DOM.');
        return;
    }

    const mensajeElement = document.createElement('div');
    mensajeElement.textContent = mensaje;
    gameMessages.appendChild(mensajeElement);
    gameMessages.scrollTop = gameMessages.scrollHeight;

    const mensajes = gameMessages.getElementsByTagName('div');
    if (mensajes.length > 5) {
        gameMessages.removeChild(mensajes[0]);
    }
}

// Función para actualizar los créditos del jugador
function actualizarCreditos(jugador, cpu) {
    document.getElementById('creditDisplay').textContent = `CRÉDITOS: ${jugador.obtenerPuntos()}`;
}

// Función para validar si una carta es válida según el estado del juego
function esCartaValida(carta, estadoDelJuego) {
    // Implementa lógica personalizada
    return true; // Placeholder
}

// Función para procesar la carta jugada
function procesarCartaJugada(juego, carta, jugador) {
    // Determinar la carta jugada por el oponente
    let cartaOponente;
    if (jugador === 'jugador') {
        cartaOponente = juego.cpu.ultimaCartaJugada;
    } else if (jugador === 'cpu') {
        cartaOponente = juego.jugador.ultimaCartaJugada;
    }

    // Calcular los valores de truco de las cartas
    const valorJugador = carta.obtenerValorTruco();
    const valorOponente = cartaOponente.obtenerValorTruco();

    // Determinar el ganador de la ronda
    let ganador = valorJugador === valorOponente
        ? juego.mano
        : valorJugador > valorOponente
        ? jugador
        : jugador === 'jugador'
        ? 'cpu'
        : 'jugador';

    // Mostrar el resultado de la ronda
    mostrarMensaje(`${jugador === 'jugador' ? 'Jugador' : 'CPU'} juega ${carta.obtenerNombre()} de ${carta.palo}`);
    mostrarMensaje(`${ganador === 'jugador' ? 'Jugador' : 'CPU'} gana la ronda`);

    // Actualizar los puntos del ganador
    if (ganador === 'jugador') {
        juego.jugador.sumarPuntos(juego.trucoApostado);
    } else {
        juego.cpu.sumarPuntos(juego.trucoApostado);
    }

    // Actualizar los créditos en el DOM
    juego.actualizarCreditos();

    // Cambiar el turno al oponente
    juego.cambiarTurno();
}

// Inicialización del juego
const mazo = crearMazo();
const jugador = {
    nombre: 'Humano',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: null,
    recibirCarta: function(carta) {
        this.mano.push(carta);
    },
    mostrarMano: function() {
        return this.mano;
    },
    obtenerPuntos: function() {
        return this.puntos;
    },
    sumarPuntos: function(puntos) {
        this.puntos += puntos;
    },
    decidirAnunciarFlor: function() {
        return true;
    },
    decidirApostarFlor: function(valorFlor) {
        return 'Quiero';
    },
    elegirCarta: function() {
        return new Promise((resolve) => {
            const playerContainer = document.querySelector('.player-cards');
            const cartasJugador = playerContainer.querySelectorAll('.carta');

            const desactivarCartas = () => {
                cartasJugador.forEach(cartaElement => {
                    cartaElement.removeEventListener('click', handleClick);
                    cartaElement.style.pointerEvents = 'none';
                });
            };

            const handleClick = (event) => {
                const cartaElement = event.currentTarget;
                const index = cartaElement.dataset.index;
                const cartaSeleccionada = this.mano[index];
                if (esCartaValida(cartaSeleccionada, juego)) {
                    this.mano.splice(index, 1);
                    this.ultimaCartaJugada = cartaSeleccionada;
                    desactivarCartas();
                    resolve(cartaSeleccionada);
                } else {
                    mostrarMensaje('Carta no válida. Elige otra carta.');
                }
            };

            cartasJugador.forEach(cartaElement => {
                cartaElement.addEventListener('click', handleClick);
            });
        });
    },
    jugarTurno: function(juego) {
        manejarJuegoJugador(juego);
    },
    elegirCartaImperativa: function() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift();
    }
};

const cpu = {
    nombre: 'CPU',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: null,
    recibirCarta: function(carta) {
        this.mano.push(carta);
    },
    mostrarMano: function() {
        return this.mano;
    },
    obtenerPuntos: function() {
        return this.puntos;
    },
    sumarPuntos: function(puntos) {
        this.puntos += puntos;
    },
    decidirAnunciarFlor: function() {
        if (this.mano.length === 3) {
            const paloFlor = this.mano.reduce((mapa, carta) => {
                mapa[carta.palo] = (mapa[carta.palo] || 0) + 1;
                return mapa;
            }, {});
            return Object.values(paloFlor).some(count => count === 3);
        }
        return false;
    },
    decidirApostarEnvido: function() {
        const valoresEnvido = this.calcularEnvido();
        if (valoresEnvido >= 25) {
            return 'Envido';
        } else if (valoresEnvido >= 20) {
            return Math.random() < 0.5 ? 'Envido' : 'Real Envido';
        }
        return null;
    },
    decidirApostarTruco: function() {
        const valoresAltos = [14, 13, 12];
        const cartasFuertes = this.mano.filter(carta => valoresAltos.includes(carta.obtenerValorTruco()));
        if (cartasFuertes.length >= 2) {
            return 'Truco';
        } else if (cartasFuertes.length === 1) {
            return Math.random() < 0.5 ? 'Truco' : null;
        }
        return null;
    },
    calcularEnvido: function() {
        return calcularPuntosPorPalo(this.mano);
    },
    decidirApostarFlor: function(valorFlor) {
        return 'Quiero';
    },
    jugarTurno: function(juego) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.decidirAnunciarFlor()) {
                    juego.anunciarFlor('cpu');
                } else {
                    const apuestaEnvido = this.decidirApostarEnvido();
                    if (apuestaEnvido) {
                        juego.jugarEnvido('cpu');
                    } else {
                        const apuestaTruco = this.decidirApostarTruco();
                        if (apuestaTruco) {
                            juego.jugarTruco('cpu');
                        } else {
                            const carta = this.elegirCartaImperativa();
                            this.ultimaCartaJugada = carta;
                            mostrarMensaje(`CPU juega ${carta.obtenerNombre()} de ${carta.palo}`);
                            resolve(carta);
                        }
                    }
                }
            }, 1000); // Simula un retraso para la decisión de la CPU
        });
    },
    elegirCartaImperativa: function() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift();
    }
};

// Inicialización del juego
const juego = {
    jugador: jugador,
    cpu: cpu,
    mazo: crearMazo(),
    turno: Math.random() < 0.5 ? 'jugador' : 'cpu',
    mano: Math.random() < 0.5 ? 'jugador' : 'cpu', // Añadir la propiedad mano para determinar quién es Mano
    trucoApostado: 1,
    estadoDelJuego: {
        florActivo: false,
        envidoActivo: false,
        trucoActivo: false,
    },
    florJugador: tieneFlor(jugador),
    florCPU: tieneFlor(cpu),
    repartirCartas: function() {
        repartirCartas(this.jugador, this.cpu, this.mazo);
    },
    tieneFlor: function(jugador) {
        return tieneFlor(jugador);
    },
    iniciarJuego: function() {
        this.repartirCartas();
        this.florJugador = this.tieneFlor(this.jugador);
        this.florCPU = this.tieneFlor(this.cpu);
        this.mostrarCartas();
        this.actualizarCreditos();

        const manoDisplay = document.getElementById('manoDisplay');
        manoDisplay.textContent = this.mano === 'cpu' ? 'Yo soy mano' : 'Vos sos mano';
        manoDisplay.style.display = 'block';

        this.mostrarMensaje('¡Comienza el juego!');
        this.mostrarMensaje(`Turno inicial: ${this.turno === 'jugador' ? 'Jugador' : 'CPU'}`);

        if (this.turno === 'cpu') {
            this.jugarTurnoCPU();
        } else {
            this.jugarTurnoJugador();
        }
    },
    jugarTurnoCPU: function() {
        this.cpu.jugarTurno(this).then(cartaSeleccionada => {
            mostrarMensaje(`CPU juega ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);
            procesarCartaJugada(this, cartaSeleccionada, 'cpu');
            this.cambiarTurno();
            mostrarOpciones(this);
        });
    },
    jugarTurnoJugador: function() {
        mostrarMensaje('Es tu turno. Elige una carta para jugar.');
        this.jugador.elegirCarta().then(cartaSeleccionada => {
            mostrarMensaje(`Has jugado: ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);
            procesarCartaJugada(this, cartaSeleccionada, 'jugador');
            this.cambiarTurno();
            this.jugarTurnoCPU();
        });
    },
    manejarFlor: function() {
        if (this.florJugador) {
            mostrarMensaje('El jugador tiene Flor');
            document.getElementById('florAnnouncement').style.display = 'block';
            document.getElementById('anunciarFlorBtn').addEventListener('click', () => {
                this.anunciarFlor('jugador');
                document.getElementById('florAnnouncement').style.display = 'none';
            });
        } else if (this.florCPU) {
            mostrarMensaje('La CPU tiene Flor');
            const anunciarCPU = this.cpu.decidirAnunciarFlor();
            if (anunciarCPU) {
                this.anunciarFlor('cpu');
            } else {
                this.mostrarOpciones();
            }
        } else {
            this.mostrarOpciones();
        }
    },
    anunciarFlor: function(jugador) {
        if (jugador === 'jugador') {
            mostrarMensaje('El jugador anuncia Flor');
            const valorFlor = calcularValorFlor(this.jugador);
            mostrarMensaje(`Valor de la Flor del jugador: ${valorFlor}`);
            const respuestaCPU = this.cpu.decidirApostarFlor(valorFlor);
            if (respuestaCPU === 'Quiero') {
                mostrarMensaje('CPU quiere la Flor');
                if (valorFlor > calcularValorFlor(this.cpu)) {
                    this.jugador.sumarPuntos(3);
                    mostrarMensaje('Jugador gana la Flor');
                } else {
                    this.cpu.sumarPuntos(3);
                    mostrarMensaje('CPU gana la Flor');
                }
            } else {
                mostrarMensaje('CPU no quiere la Flor');
                this.jugador.sumarPuntos(3);
            }
        } else if (jugador === 'cpu') {
            mostrarMensaje('La CPU anuncia Flor');
            const valorFlorCPU = calcularValorFlor(this.cpu);
            mostrarMensaje(`Valor de la Flor de la CPU: ${valorFlorCPU}`);
            const respuestaJugador = this.jugador.decidirApostarFlor(valorFlorCPU);
            if (respuestaJugador === 'Quiero') {
                mostrarMensaje('Jugador quiere la Flor');
                if (calcularValorFlor(this.jugador) > valorFlorCPU) {
                    this.jugador.sumarPuntos(3);
                    mostrarMensaje('Jugador gana la Flor');
                } else {
                    this.cpu.sumarPuntos(3);
                    mostrarMensaje('CPU gana la Flor');
                }
            } else {
                mostrarMensaje('Jugador no quiere la Flor');
                this.cpu.sumarPuntos(3);
            }
        }
    },
    calcularValorFlor: function(jugador) {
        return calcularPuntosPorPalo(jugador.mostrarMano(), 3);
    },
    mostrarCartas: function() {
        const cpuContainer = document.querySelector('.cpu-cards');
        const playerContainer = document.querySelector('.player-cards');

        cpuContainer.innerHTML = '<div class="area-label">CPU</div>';
        playerContainer.innerHTML = '<div class="area-label">JUGADOR</div>';

        this.cpu.mostrarMano().forEach(() => {
            const cartaBack = document.createElement('div');
            cartaBack.className = 'carta-back';
            cpuContainer.appendChild(cartaBack);
        });

        this.jugador.mostrarMano().forEach((carta, index) => {
            const cartaElement = document.createElement('div');
            cartaElement.className = `carta ${carta.palo.toLowerCase()}`;
            cartaElement.textContent = `${carta.obtenerNombre()} de ${carta.palo}`;
            cartaElement.dataset.index = index;
            cartaElement.addEventListener('click', () => {
                playerContainer.querySelectorAll('.carta').forEach(c => c.classList.remove('carta-seleccionada'));
                cartaElement.classList.add('carta-seleccionada');
            });
            playerContainer.appendChild(cartaElement);
        });

        this.actualizarCreditos();
    },
    actualizarCreditos: function() {
        document.getElementById('creditDisplay').textContent = `CRÉDITOS: ${this.jugador.obtenerPuntos()}`;
    },
    mostrarOpciones: function() {
        const opciones = document.querySelector('.game-options');
        opciones.innerHTML = '';

        if (this.turno === 'jugador') {
            opciones.innerHTML = `
                <div class="option" id="trucoBtn">TRUCO</div>
                <div class="option" id="envidoBtn">ENVIDO</div>
                <div class="option" id="florBtn">FLOR</div>
                <div class="option" id="retirarseBtn">RETIRARSE</div>
            `;
        } else {
            this.jugarCPU();
            return;
        }

        document.getElementById('trucoBtn')?.addEventListener('click', () => this.jugarTruco('jugador'));
        document.getElementById('envidoBtn')?.addEventListener('click', () => this.jugarEnvido('jugador'));
        document.getElementById('florBtn')?.addEventListener('click', () => this.jugarFlor('jugador'));
        document.getElementById('retirarseBtn')?.addEventListener('click', () => this.retirarse('jugador'));
    },
    jugarTruco: function(jugador) {
        this.mostrarMensaje(`${jugador} juega TRUCO`);
        this.estadoDelJuego.trucoActivo = true;
        this.cambiarTurno();
    },
    jugarEnvido: function(jugador) {
        this.mostrarMensaje(`${jugador} juega ENVIDO`);
        this.estadoDelJuego.envidoActivo = true;

        let valorEnvidoJugador = calcularEnvido(this.jugador.mano);
        let valorEnvidoCPU = calcularEnvido(this.cpu.mano);

        let apuestaActual = 2;
        let envidoActivo = true;

        this.mostrarMensaje(`Envido iniciado. Jugador: ${valorEnvidoJugador}, CPU: ${valorEnvidoCPU}`);

        while (envidoActivo) {
            if (jugador === 'jugador') {
                let deseaAumentar = confirm('¿Deseas aumentar la apuesta (Real Envido o Falta Envido)?');
                if (deseaAumentar) {
                    apuestaActual += 2;
                    this.mostrarMensaje(`Jugador aumenta la apuesta a ${apuestaActual}`);
                } else {
                    envidoActivo = false;
                    this.mostrarMensaje('Jugador no aumenta la apuesta');
                }
            }

            let respuestaCPU = this.cpu.decidirApostarEnvido();
            if (respuestaCPU === 'Quiero') {
                this.mostrarMensaje(`CPU acepta la apuesta de ${apuestaActual}`);
                if (jugador === 'jugador') {
                    jugador = 'cpu';
                } else {
                    envidoActivo = false;
                }
            } else {
                this.mostrarMensaje('CPU no quiere la apuesta');
                this.jugador.sumarPuntos(1);
                this.actualizarCreditos();
                return this.cambiarTurno();
            }
        }

        if (valorEnvidoJugador > valorEnvidoCPU) {
            this.jugador.sumarPuntos(apuestaActual);
            this.mostrarMensaje(`Jugador gana el Envido y suma ${apuestaActual} puntos`);
        } else {
            this.cpu.sumarPuntos(apuestaActual);
            this.mostrarMensaje(`CPU gana el Envido y suma ${apuestaActual} puntos`);
        }

        this.actualizarCreditos();
        this.cambiarTurno();
    },
    calcularEnvido: function(mano) {
        return calcularPuntosPorPalo(mano);
    },
    mostrarMensaje: function(mensaje) {
        const gameMessages = document.getElementById('gameMessages');
        if (!gameMessages) {
            console.warn('El contenedor de mensajes no existe en el DOM.');
            return;
        }

        const mensajeElement = document.createElement('div');
        mensajeElement.textContent = mensaje;
        gameMessages.appendChild(mensajeElement);
        gameMessages.scrollTop = gameMessages.scrollHeight;

        const mensajes = gameMessages.getElementsByTagName('div');
        if (mensajes.length > 5) {
            gameMessages.removeChild(mensajes[0]);
        }
    },
    cambiarTurno: function() {
        this.turno = this.turno === 'jugador' ? 'cpu' : 'jugador';
    },
    jugarCPU: function() {
        this.cpu.jugarTurno(this);
    },
    retirarse: function(jugador) {
        this.mostrarMensaje(`${jugador} se retira del juego`);
        if (jugador === 'jugador') {
            this.cpu.sumarPuntos(this.jugador.obtenerPuntos());
            this.mostrarMensaje('CPU gana el juego');
        } else {
            this.jugador.sumarPuntos(this.cpu.obtenerPuntos());
            this.mostrarMensaje('Jugador gana el juego');
        }
        this.actualizarCreditos();
    }
};

// Inicialización del juego
juego.iniciarJuego();
