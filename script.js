// Ver 1.08

let credits = 0;
let currentPlayer = 'jugador'; // Puede ser 'jugador' o 'cpu'

// Clase para representar una carta
class ClaseCarta {
    constructor(palo, valor) {
        this.palo = palo; // Espadas, Bastos, Copas, Oros
        this.valor = valor; // 1-12 (1: As, 10: Sota, 11: Caballo, 12: Rey)
    }

    obtenerNombre() {
        const nombres = {
            1: 'As',
            10: 'Sota',
            11: 'Caballo',
            12: 'Rey'
        };
        return nombres[this.valor] || this.valor.toString();
    }

    obtenerValorTruco() {
        const valoresTruco = {
            1: 14, 7: 13, 3: 12, 2: 11,
            12: 10, 11: 9, 10: 8, 6: 7,
            5: 6, 4: 5
        };
        return valoresTruco[this.valor] || 0;
    }
}

// Clase para representar un mazo
class ClaseMazo {
    constructor() {
        this.cartas = [];
        const palos = ['Espadas', 'Bastos', 'Copas', 'Oros'];
        for (let palo of palos) {
            for (let valor = 1; valor <= 7; valor++) {
                this.cartas.push(new ClaseCarta(palo, valor));
            }
            for (let valor = 10; valor <= 12; valor++) {
                this.cartas.push(new ClaseCarta(palo, valor));
            }
        }
        this.barajar();
    }

    barajar() {
        for (let i = this.cartas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cartas[i], this.cartas[j]] = [this.cartas[j], this.cartas[i]];
        }
    }

    sacarCarta() {
        return this.cartas.pop();
    }
}

// Clase para representar un jugador
class ClaseJugador {
    constructor(nombre) {
        this.nombre = nombre;
        this.mano = [];
        this.puntos = 0;
    }

    recibirCarta(carta) {
        this.mano.push(carta);
    }

    mostrarMano() {
        return this.mano;
    }

    obtenerPuntos() {
        return this.puntos;
    }

    sumarPuntos(puntos) {
        this.puntos += puntos;
    }

    elegirCarta() {
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
                this.mano.splice(index, 1);
                desactivarCartas();
                resolve(cartaSeleccionada);
            };

            cartasJugador.forEach(cartaElement => {
                cartaElement.addEventListener('click', handleClick);
            });
        });
    }

    decidirAnunciarFlor() {
        return true;
    }

    decidirApostarFlor() {
        return 'Quiero';
    }
}

class ClaseCPU extends ClaseJugador {
    decidirAnunciarFlor() {
        if (this.mano.length === 3) {
            const paloFlor = this.mano.reduce((mapa, carta) => {
                mapa[carta.palo] = (mapa[carta.palo] || 0) + 1;
                return mapa;
            }, {});
            return Object.values(paloFlor).some(count => count === 3);
        }
        return false;
    }

    decidirApostarEnvido() {
        const valoresEnvido = this.calcularEnvido();
        if (valoresEnvido >= 25) {
            return 'Envido';
        } else if (valoresEnvido >= 20) {
            return Math.random() < 0.5 ? 'Envido' : 'Real Envido';
        }
        return null;
    }

    decidirApostarTruco() {
        const valoresAltos = [14, 13, 12];
        const cartasFuertes = this.mano.filter(carta => valoresAltos.includes(carta.obtenerValorTruco()));
        if (cartasFuertes.length >= 2) {
            return 'Truco';
        } else if (cartasFuertes.length === 1) {
            return Math.random() < 0.5 ? 'Truco' : null;
        }
        return null;
    }

    calcularEnvido() {
        const palos = this.mano.reduce((acum, carta) => {
            acum[carta.palo] = acum[carta.palo] || [];
            acum[carta.palo].push(carta);
            return acum;
        }, {});

        let mejorEnvido = 0;
        for (let palo in palos) {
            const cartasDelPalo = palos[palo].sort((a, b) => b.valor - a.valor);
            if (cartasDelPalo.length >= 2) {
                const valor = cartasDelPalo[0].valor + cartasDelPalo[1].valor + 20;
                mejorEnvido = Math.max(mejorEnvido, valor);
            }
        }

        if (mejorEnvido === 0) {
            mejorEnvido = Math.max(...this.mano.map(carta => carta.valor));
        }

        return mejorEnvido;
    }

    jugarTurno(juego) {
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
                    const carta = this.elegirCarta();
                    juego.mostrarMensaje(`CPU juega ${carta.obtenerNombre()} de ${carta.palo}`);
                }
            }
        }
    }

    elegirCarta() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift();
    }
}

// Clase para representar el juego
class ClaseJuegoTruco {
    constructor(jugador, cpu) {
        this.jugador = jugador;
        this.cpu = cpu;
        this.mazo = new ClaseMazo();
        this.turno = Math.random() < 0.5 ? 'jugador' : 'cpu';
        this.mano = this.turno === 'jugador' ? 'jugador' : 'cpu';
        this.trucoApostado = 1;
        this.repartirCartas();
        this.florJugador = this.tieneFlor(this.jugador);
        this.florCPU = this.tieneFlor(this.cpu);
    }

    repartirCartas() {
        for (let i = 0; i < 3; i++) {
            this.jugador.recibirCarta(this.mazo.sacarCarta());
            this.cpu.recibirCarta(this.mazo.sacarCarta());
        }
    }

    tieneFlor(jugador) {
        const palos = jugador.mostrarMano().map(carta => carta.palo);
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

    iniciarJuego() {
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
    }

    jugarTurnoCPU() {
        this.cpu.jugarTurno(this);
        this.cambiarTurno();
        this.mostrarOpciones();
    }

    async jugarTurnoJugador() {
        this.mostrarMensaje('Es tu turno. Elige una carta para jugar.');

        const cartaSeleccionada = await this.jugador.elegirCarta();

        this.mostrarMensaje(`Has jugado: ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);

        this.procesarCartaJugada(cartaSeleccionada, 'jugador');

        this.cambiarTurno();
        this.jugarTurnoCPU();
    }

    manejarFlor() {
        if (this.florJugador) {
            this.mostrarMensaje('El jugador tiene Flor');
            document.getElementById('florAnnouncement').style.display = 'block';
            document.getElementById('anunciarFlorBtn').addEventListener('click', () => {
                this.anunciarFlor('jugador');
                document.getElementById('florAnnouncement').style.display = 'none';
            });
        } else if (this.florCPU) {
            this.mostrarMensaje('La CPU tiene Flor');
            const anunciarCPU = this.cpu.decidirAnunciarFlor(this.florCPU);
            if (anunciarCPU) {
                this.anunciarFlor('cpu');
            } else {
                this.mostrarOpciones();
            }
        } else {
            this.mostrarOpciones();
        }
    }

    anunciarFlor(jugador) {
        if (jugador === 'jugador') {
            this.mostrarMensaje('El jugador anuncia Flor');
            const valorFlor = this.calcularValorFlor(this.jugador);
            this.mostrarMensaje(`Valor de la Flor del jugador: ${valorFlor}`);
            const respuestaCPU = this.cpu.decidirApostarFlor(valorFlor);
            if (respuestaCPU === 'Quiero') {
                this.mostrarMensaje('CPU quiere la Flor');
                if (valorFlor > this.calcularValorFlor(this.cpu)) {
                    this.jugador.sumarPuntos(3);
                    this.mostrarMensaje('Jugador gana la Flor');
                } else {
                    this.cpu.sumarPuntos(3);
                    this.mostrarMensaje('CPU gana la Flor');
                }
            } else {
                this.mostrarMensaje('CPU no quiere la Flor');
                this.jugador.sumarPuntos(3);
            }
        } else if (jugador === 'cpu') {
            this.mostrarMensaje('La CPU anuncia Flor');
            const valorFlorCPU = this.calcularValorFlor(this.cpu);
            this.mostrarMensaje(`Valor de la Flor de la CPU: ${valorFlorCPU}`);
            const respuestaJugador = this.jugador.decidirApostarFlor(valorFlorCPU);
            if (respuestaJugador === 'Quiero') {
                this.mostrarMensaje('Jugador quiere la Flor');
                if (this.calcularValorFlor(this.jugador) > valorFlorCPU) {
                    this.jugador.sumarPuntos(3);
                    this.mostrarMensaje('Jugador gana la Flor');
                } else {
                    this.cpu.sumarPuntos(3);
                    this.mostrarMensaje('CPU gana la Flor');
                }
            } else {
                this.mostrarMensaje('Jugador no quiere la Flor');
                this.cpu.sumarPuntos(3);
            }
        }
    }

    calcularValorFlor(jugador) {
        const mano = jugador.mostrarMano();
        const valores = mano.map(carta => carta.valor);
        const palos = mano.map(carta => carta.palo);
        const frecuencia = {};
        palos.forEach(palo => {
            frecuencia[palo] = (frecuencia[palo] || 0) + 1;
        });
        for (let palo in frecuencia) {
            if (frecuencia[palo] === 3) {
                const cartasDelMismoPalo = mano.filter(carta => carta.palo === palo);
                return cartasDelMismoPalo.reduce((sum, carta) => sum + carta.valor, 0) + 20;
            }
        }
        return 0;
    }

    mostrarCartas() {
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
    }

    actualizarCreditos() {
        document.getElementById('creditDisplay').textContent = `CRÉDITOS: ${this.jugador.obtenerPuntos()}`;
    }

    mostrarOpciones() {
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
    }

    jugarTruco(jugador) {
        this.mostrarMensaje(`${jugador} juega TRUCO`);
        this.cambiarTurno();
    }

    jugarEnvido(jugador) {
        this.mostrarMensaje(`${jugador} juega ENVIDO`);

        let valorEnvidoJugador = this.calcularEnvido(this.jugador.mostrarMano());
        let valorEnvidoCPU = this.calcularEnvido(this.cpu.mostrarMano());

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
    }

    calcularEnvido(mano) {
        const valores = mano.map(carta => carta.valor);
        const palos = mano.map(carta => carta.palo);
        const frecuencia = {};
        palos.forEach(palo => {
            frecuencia[palo] = (frecuencia[palo] || 0) + 1;
        });
        for (let palo in frecuencia) {
            if (frecuencia[palo] >= 2) {
                const cartasDelMismoPalo = mano.filter(carta => carta.palo === palo);
                return cartasDelMismoPalo.reduce((sum, carta) => sum + carta.valor, 0) + 20;
            }
        }
        return Math.max(...valores);
    }

    mostrarMensaje(mensaje) {
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

    cambiarTurno() {
        this.turno = this.turno === 'jugador' ? 'cpu' : 'jugador';
    }

    jugarCPU() {
        this.cpu.jugarTurno(this);
    }

    retirarse(jugador) {
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
}

const jugador = new ClaseJugador('Humano');
const cpu = new ClaseCPU('CPU');

const juego = new ClaseJuegoTruco(jugador, cpu);

juego.iniciarJuego();
