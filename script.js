// Versión 4.1.1

// Estado inicial del juego
let credits = 0;
let currentPlayer: 'jugador' | 'cpu' = 'jugador'; // Puede ser 'jugador' o 'cpu'

// Función para crear una carta
function crearCarta(palo: string, valor: number): Carta {
    return {
        palo: palo,
        valor: valor,
        obtenerNombre: function () {
            const nombres = {
                1: 'As',
                10: 'Sota',
                11: 'Caballo',
                12: 'Rey'
            };
            return nombres[this.valor] || this.valor.toString();
        },
        obtenerValorTruco: function () {
            const valoresTruco = {
                1: 14, 7: 13, 3: 12, 2: 11,
                12: 10, 11: 9, 10: 8, 6: 7,
                5: 6, 4: 5
            };
            return valoresTruco[this.valor] || 0;
        }
    };
}

// Tipo para representar una carta
interface Carta {
    palo: string;
    valor: number;
    obtenerNombre(): string;
    obtenerValorTruco(): number;
}

// Función para crear un mazo
function crearMazo(): Carta[] {
    const cartas: Carta[] = [];
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
function barajar(cartas: Carta[]): void {
    for (let i = cartas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
    }
}

// Función para repartir cartas
function repartirCartas(jugador: Jugador, cpu: Jugador, mazo: Carta[]): void {
    if (mazo.length < 6) {
        throw new Error("No hay suficientes cartas en el mazo");
    }
    for (let i = 0; i < 3; i++) {
        jugador.mano.push(mazo.pop()!);
        cpu.mano.push(mazo.pop()!);
    }
}

// Tipo para representar un jugador
interface Jugador {
    nombre: string;
    mano: Carta[];
    puntos: number;
    ultimaCartaJugada: Carta | null;
    recibirCarta(carta: Carta): void;
    mostrarMano(): Carta[];
    obtenerPuntos(): number;
    sumarPuntos(puntos: number): void;
    decidirAnunciarFlor(): boolean;
    decidirApostarFlor(valorFlor: number): string;
    elegirCarta(): Promise<Carta>;
    jugarTurno(juego: Juego): void;
    elegirCartaImperativa(): Carta;
}

// Función para determinar si un jugador tiene flor
function tieneFlor(jugador: Jugador): string | false {
    const palos = jugador.mano.map(carta => carta.palo);
    const frecuencia: { [key: string]: number } = {};
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
function calcularValorFlor(jugador: Jugador): number {
    return calcularPuntosPorPalo(jugador.mano, 3);
}

// Función para calcular el valor de envido
function calcularEnvido(mano: Carta[]): number {
    return calcularPuntosPorPalo(mano);
}

// Función auxiliar para calcular puntos por palo
function calcularPuntosPorPalo(mano: Carta[], minCartas: number = 2): number {
    const frecuencia: { [key: string]: number } = mano.reduce((acc, carta) => {
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

// Función para mostrar mensajes en el juego
function mostrarMensaje(mensaje: string): void {
    const gameMessages = document.getElementById('gameMessages');
    if (!gameMessages) return;

    const mensajeElement = document.createElement('div');
    mensajeElement.textContent = mensaje;
    gameMessages.appendChild(mensajeElement);
    gameMessages.scrollTop = gameMessages.scrollHeight;

    if (gameMessages.children.length > 5) {
        gameMessages.removeChild(gameMessages.firstChild!);
    }
}

// Crear la CPU
const cpu: Jugador = {
    nombre: 'CPU',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: null,
    recibirCarta(carta: Carta) {
        this.mano.push(carta);
    },
    mostrarMano() {
        return this.mano;
    },
    obtenerPuntos() {
        return this.puntos;
    },
    sumarPuntos(puntos: number) {
        this.puntos += puntos;
    },
    decidirAnunciarFlor() {
        if (this.mano.length === 3) {
            const paloFlor = this.mano.reduce((mapa, carta) => {
                mapa[carta.palo] = (mapa[carta.palo] || 0) + 1;
                return mapa;
            }, {} as { [key: string]: number });
            return Object.values(paloFlor).some(count => count === 3);
        }
        return false;
    },
    decidirApostarEnvido() {
        const valorEnvido = calcularEnvido(this.mano);
        if (valorEnvido >= 27) return 'Quiero';
        if (valorEnvido >= 22 && Math.random() < 0.7) return 'Quiero';
        if (valorEnvido >= 18 && Math.random() < 0.3) return 'Quiero';
        return 'No Quiero';
    },
    decidirApostarTruco() {
        const valoresAltos = [14, 13, 12];
        const cartasFuertes = this.mano.filter(carta => valoresAltos.includes(carta.obtenerValorTruco()));
        if (cartasFuertes.length >= 2) return 'Truco';
        if (cartasFuertes.length === 1) return Math.random() < 0.5 ? 'Truco' : null;
        return null;
    },
    elegirCartaImperativa() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift()!;
    },
    jugarTurno(juego: Juego) {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                if (this.decidirAnunciarFlor()) {
                    juego.anunciarFlor('cpu');
                } else {
                    const apuestaEnvido = this.decidirApostarEnvido();
                    if (apuestaEnvido === 'Quiero') {
                        juego.jugarEnvido('cpu');
                    } else {
                        const carta = this.elegirCartaImperativa();
                        this.ultimaCartaJugada = carta;
                        mostrarMensaje(`CPU juega ${carta.obtenerNombre()} de ${carta.palo}`);
                        resolve();
                    }
                }
            }, 1000);
        });
    }
};

// Crear el jugador humano
const jugador: Jugador = {
    nombre: 'Humano',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: null,
    recibirCarta(carta: Carta) {
        this.mano.push(carta);
    },
    mostrarMano() {
        return this.mano;
    },
    obtenerPuntos() {
        return this.puntos;
    },
    sumarPuntos(puntos: number) {
        this.puntos += puntos;
    },
    decidirAnunciarFlor() {
        return true;
    },
    decidirApostarFlor(valorFlor: number) {
        return 'Quiero';
    },
    elegirCarta() {
        return new Promise<Carta>((resolve) => {
            const playerContainer = document.querySelector('.player-cards')!;
            const cartasJugador = playerContainer.querySelectorAll('.carta');

            const desactivarCartas = () => {
                cartasJugador.forEach(cartaElement => {
                    cartaElement.removeEventListener('click', handleClick);
                    cartaElement.style.pointerEvents = 'none';
                });
            };

            const handleClick = (event: Event) => {
                const cartaElement = event.currentTarget as HTMLElement;
                const index = cartaElement.dataset.index!;
                const cartaSeleccionada = this.mano[index];
                this.mano.splice(index, 1);
                this.ultimaCartaJugada = cartaSeleccionada;
                desactivarCartas();
                resolve(cartaSeleccionada);
            };

            cartasJugador.forEach(cartaElement => {
                cartaElement.addEventListener('click', handleClick);
            });
        });
    },
    jugarTurno(juego: Juego) {
        manejarJuegoJugador(juego);
    },
    elegirCartaImperativa() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift()!;
    }
};

// Crear el juego
const juego: Juego = {
    jugador: jugador,
    cpu: cpu,
    mazo: crearMazo(),
    turno: Math.random() < 0.5 ? 'jugador' : 'cpu',
    mano: Math.random() < 0.5 ? 'jugador' : 'cpu',
    trucoApostado: 1,
    ultimaApuestaEnvido: 0,
    puntosJugador: 0, // Puntos totales del jugador
    puntosCPU: 0,     // Puntos totales de la CPU
    rondaIniciada: false, // Para controlar el primer truco
    estadoDelJuego: {
        florActivo: false,
        envidoActivo: false,
        trucoActivo: false,
        florResuelto: false,
        envidoResuelto: false,
        trucoResuelto: false,
        retrucoActivo: false,
        retrucoResuelto: false,
        valeCuatroActivo: false,
        valeCuatroResuelto: false,
        contraflorActivo: false,
        contraflorResuelto: false,
        contraflorAlRestoActivo: false,
        contraflorAlRestoResuelto: false,
        realEnvidoActivo: false,
        faltaEnvidoActivo: false,
    },
    florJugador: tieneFlor(jugador),
    florCPU: tieneFlor(cpu),
    repartirCartas() {
        repartirCartas(this.jugador, this.cpu, this.mazo);
    },
    tieneFlor(jugador: Jugador) {
        return tieneFlor(jugador);
    },
    iniciarJuego() {
        this.mazo = crearMazo();
        this.repartirCartas();
        this.florJugador = this.tieneFlor(this.jugador);
        this.florCPU = this.tieneFlor(this.cpu);
        this.mostrarCartas();
        this.actualizarCreditos();
        this.rondaIniciada = false;

        const manoDisplay = document.getElementById('manoDisplay')!;
        manoDisplay.textContent = this.mano === 'jugador' ? 'Vos sos mano' : 'CPU es mano';
        manoDisplay.style.display = 'block';

        this.mostrarMensaje('¡Comienza el juego!');
        this.mostrarMensaje(`Turno inicial: ${this.turno === 'jugador' ? 'Jugador' : 'CPU'}`);

        // Priorizar Flor
        if (this.florJugador && this.mano === 'jugador') {
            this.anunciarFlor('jugador');
        } else if (this.florCPU && this.mano === 'cpu') {
            this.anunciarFlor('cpu');
        } else {
            this.mostrarOpciones();
        }
    },
    jugarTurnoCPU() {
        this.cpu.jugarTurno(this).then(() => {
            mostrarMensaje(`CPU juega ${this.cpu.ultimaCartaJugada!.obtenerNombre()} de ${this.cpu.ultimaCartaJugada!.palo}`);
            this.cambiarTurno();
            this.mostrarOpciones();
        });
    },
    jugarTurnoJugador() {
        mostrarMensaje('Es tu turno. Elige una carta para jugar.');
        this.jugador.elegirCarta().then(cartaSeleccionada => {
            mostrarMensaje(`Has jugado: ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);
            this.cambiarTurno();
            this.jugarTurnoCPU();
        });
    },
    manejarFlor() {
        if (this.florJugador) {
            mostrarMensaje('El jugador tiene Flor');
            document.getElementById('florAnnouncement')!.style.display = 'block';
            document.getElementById('anunciarFlorBtn')!.addEventListener('click', () => {
                this.anunciarFlor('jugador');
                document.getElementById('florAnnouncement')!.style.display = 'none';
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
    anunciarFlor(iniciador: 'jugador' | 'cpu') {
        this.estadoDelJuego.florActivo = true;
        this.rondaIniciada = false; // Resetear para forzar anuncio antes del truco
        let floresAnunciadas: {jugador: string | false, cpu: string | false} = {
            jugador: this.florJugador,
            cpu: this.florCPU
        };

        if (iniciador === 'jugador') {
            mostrarMensaje('Jugador anuncia Flor');
            this.manejarRespuestaFlor('cpu', floresAnunciadas);
        } else {
            mostrarMensaje('CPU anuncia Flor');
            this.manejarRespuestaFlor('jugador', floresAnunciadas);
        }
    },
    manejarRespuestaFlor(respondedor: 'jugador' | 'cpu', flores: {jugador: string | false, cpu: string | false}) {
        const oponente = respondedor === 'jugador' ? this.jugador : this.cpu;
        const iniciador = respondedor === 'jugador' ? this.cpu : this.jugador;

        if (flores[respondedor]) {
            if (respondedor === 'jugador') {
                // Mostrar opciones al jugador
                document.getElementById('florAnnouncement')!.innerHTML = `
                    <button id="florBtn">Flor</button>
                    <button id="achicoBtn">Con flor me achico</button>
                    <button id="contraflorBtn">Contraflor</button>
                    <button id="contraflorRestoBtn">Contraflor al resto</button>
                `;
                document.getElementById('florAnnouncement')!.style.display = 'block';

                document.getElementById('florBtn')!.addEventListener('click', () => this.resolverFlorSimple(flores, 'jugador', 'flor'));
                document.getElementById('achicoBtn')!.addEventListener('click', () => this.resolverFlorAchico(iniciador, oponente));
                document.getElementById('contraflorBtn')!.addEventListener('click', () => this.manejarContraflor(iniciador, oponente, flores));
                document.getElementById('contraflorRestoBtn')!.addEventListener('click', () => this.manejarContraflorResto(iniciador, oponente, flores));
            } else {
                // Decisión de la CPU
                const valorFlorCPU = calcularValorFlor(this.cpu);
                const valorFlorJugador = calcularValorFlor(this.jugador);
                if (valorFlorCPU < valorFlorJugador - 5) {
                    this.resolverFlorAchico(this.jugador, this.cpu);
                } else if (valorFlorCPU > valorFlorJugador + 5) {
                    this.manejarContraflorResto(this.jugador, this.cpu, flores);
                } else {
                    this.resolverFlorSimple(flores, 'cpu', 'flor');
                }
            }
        } else {
            // Sin Flor, el iniciador gana 3 puntos
            iniciador.sumarPuntos(3);
            mostrarMensaje(`${iniciador.nombre} gana 3 puntos por Flor`);
            this.finalizarFlor();
        }
    },
    resolverFlorSimple(flores: {jugador: string | false, cpu: string | false}, ultimo: 'jugador' | 'cpu', apuesta: string) {
        mostrarMensaje(`${ultimo === 'jugador' ? 'Jugador' : 'CPU'} dice "${apuesta}"`);
        const valorJugador = flores.jugador ? calcularValorFlor(this.jugador) : 0;
        const valorCPU = flores.cpu ? calcularValorFlor(this.cpu) : 0;
        const puntos = (flores.jugador ? 3 : 0) + (flores.cpu ? 3 : 0);

        if (valorJugador > valorCPU || (valorJugador === valorCPU && this.mano === 'jugador')) {
            this.jugador.sumarPuntos(puntos);
            mostrarMensaje(`Jugador gana ${puntos} puntos por Flor`);
        } else {
            this.cpu.sumarPuntos(puntos);
            mostrarMensaje(`CPU gana ${puntos} puntos por Flor`);
        }
        this.finalizarFlor();
    },
    resolverFlorAchico(ganador: Jugador, perdedor: Jugador) {
        mostrarMensaje(`${perdedor.nombre} dice "Con flor me achico"`);
        ganador.sumarPuntos(4); // 3 por su Flor + 1 por el achico
        mostrarMensaje(`${ganador.nombre} gana 4 puntos`);
        this.finalizarFlor();
    },
    manejarContraflor(iniciador: Jugador, respondedor: Jugador, flores: {jugador: string | false, cpu: string | false}) {
        mostrarMensaje(`${respondedor.nombre} dice "Contraflor"`);
        if (respondedor === this.jugador) {
            document.getElementById('florAnnouncement')!.innerHTML = `
                <button id="quieroBtn">Con flor quiero</button>
                <button id="achicoBtn">Con flor me achico</button>
                <button id="contraflorRestoBtn">Contraflor al resto</button>
            `;
            document.getElementById('florAnnouncement')!.style.display = 'block';

            document.getElementById('quieroBtn')!.addEventListener('click', () => this.resolverFlorSimple(flores, 'jugador', 'Con flor quiero'));
            document.getElementById('achicoBtn')!.addEventListener('click', () => this.resolverFlorAchico(iniciador, respondedor));
            document.getElementById('contraflorRestoBtn')!.addEventListener('click', () => this.manejarContraflorResto(iniciador, respondedor, flores));
        } else {
            const valorFlorCPU = calcularValorFlor(this.cpu);
            const valorFlorJugador = calcularValorFlor(this.jugador);
            if (valorFlorCPU < valorFlorJugador - 5) {
                this.resolverFlorAchico(this.jugador, this.cpu);
            } else {
                this.manejarContraflorResto(this.jugador, this.cpu, flores);
            }
        }
    },
    manejarContraflorResto(iniciador: Jugador, respondedor: Jugador, flores: {jugador: string | false, cpu: string | false}) {
        mostrarMensaje(`${respondedor.nombre} dice "Contraflor al resto"`);
        const puntosParaGanar = 30 - Math.max(this.puntosJugador, this.puntosCPU);
        const puntosFlores = (flores.jugador ? 3 : 0) + (flores.cpu ? 3 : 0);
        const apuestaTotal = puntosParaGanar + puntosFlores;

        if (respondedor === this.jugador) {
            document.getElementById('florAnnouncement')!.innerHTML = `
                <button id="quieroBtn">Con flor quiero</button>
                <button id="achicoBtn">Con flor me achico</button>
            `;
            document.getElementById('florAnnouncement')!.style.display = 'block';

            document.getElementById('quieroBtn')!.addEventListener('click', () => this.resolverContraflorResto(iniciador, respondedor, apuestaTotal));
            document.getElementById('achicoBtn')!.addEventListener('click', () => this.resolverFlorAchico(iniciador, respondedor));
        } else {
            const valorFlorCPU = calcularValorFlor(this.cpu);
            const valorFlorJugador = calcularValorFlor(this.jugador);
            if (valorFlorCPU < valorFlorJugador - 5) {
                this.resolverFlorAchico(this.jugador, this.cpu);
            } else {
                this.resolverContraflorResto(this.jugador, this.cpu, apuestaTotal);
            }
        }
    },
    resolverContraflorResto(iniciador: Jugador, respondedor: Jugador, apuestaTotal: number) {
        mostrarMensaje(`${iniciador.nombre} dice "Con flor quiero"`);
        const valorIniciador = calcularValorFlor(iniciador);
        const valorRespondedor = calcularValorFlor(respondedor);
        if (valorIniciador > valorRespondedor || (valorIniciador === valorRespondedor && this.mano === iniciador.nombre.toLowerCase())) {
            iniciador.sumarPuntos(apuestaTotal);
            mostrarMensaje(`${iniciador.nombre} gana ${apuestaTotal} puntos y el juego termina`);
            this.puntosJugador = iniciador === this.jugador ? this.puntosJugador + apuestaTotal : this.puntosJugador;
            this.puntosCPU = iniciador === this.cpu ? this.puntosCPU + apuestaTotal : this.puntosCPU;
            if (this.puntosJugador >= 30 || this.puntosCPU >= 30) this.finalizarJuego();
        } else {
            respondedor.sumarPuntos(apuestaTotal);
            mostrarMensaje(`${respondedor.nombre} gana ${apuestaTotal} puntos y el juego termina`);
            this.puntosJugador = respondedor === this.jugador ? this.puntosJugador + apuestaTotal : this.puntosJugador;
            this.puntosCPU = respondedor === this.cpu ? this.puntosCPU + apuestaTotal : this.puntosCPU;
            if (this.puntosJugador >= 30 || this.puntosCPU >= 30) this.finalizarJuego();
        }
        this.finalizarFlor();
    },
    finalizarFlor() {
        this.estadoDelJuego.florActivo = false;
        this.estadoDelJuego.florResuelto = true;
        document.getElementById('florAnnouncement')!.style.display = 'none';
        this.mostrarOpciones();
    },
    mostrarCartas() {
        const cpuContainer = document.querySelector('.cpu-cards')!;
        const playerContainer = document.querySelector('.player-cards')!;

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
            cartaElement.dataset.index = index.toString();
            cartaElement.addEventListener('click', () => {
                playerContainer.querySelectorAll('.carta').forEach(c => c.classList.remove('carta-seleccionada'));
                cartaElement.classList.add('carta-seleccionada');
            });
            playerContainer.appendChild(cartaElement);
        });

        this.actualizarCreditos();
    },
    actualizarCreditos() {
        const creditDisplay = document.getElementById('creditDisplay');
        if (creditDisplay) {
            creditDisplay.textContent = `CRÉDITOS: ${this.puntosJugador}`;
        }
    },
    mostrarOpciones() {
        const opciones = document.querySelector('.game-options')!;
        opciones.innerHTML = '';

        if (!this.estadoDelJuego.florResuelto && (this.florJugador || this.florCPU)) {
            return; // Flor debe resolverse primero
        }

        if (this.turno === 'jugador' && !this.rondaIniciada) {
            opciones.innerHTML = `
                ${this.florJugador && !this.estadoDelJuego.florActivo ? '<div class="option" id="florBtn">FLOR</div>' : ''}
                ${!this.estadoDelJuego.envidoActivo ? '<div class="option" id="envidoBtn">ENVIDO</div>' : ''}
                ${!this.estadoDelJuego.trucoActivo ? '<div class="option" id="trucoBtn">TRUCO</div>' : ''}
                <div class="option" id="retirarseBtn">RETIRARSE</div>
            `;
            if (this.florJugador && !this.estadoDelJuego.florActivo) document.getElementById('florBtn')!.addEventListener('click', () => this.anunciarFlor('jugador'));
            if (!this.estadoDelJuego.envidoActivo) document.getElementById('envidoBtn')!.addEventListener('click', () => this.jugarEnvido('jugador'));
            if (!this.estadoDelJuego.trucoActivo) document.getElementById('trucoBtn')!.addEventListener('click', () => this.jugarTruco('jugador'));
            document.getElementById('retirarseBtn')!.addEventListener('click', () => this.retirarse('jugador'));
        } else if (this.turno === 'cpu') {
            this.jugarCPU();
        }
    },
    jugarTruco(jugador: string) {
        if (this.estadoDelJuego.trucoResuelto || this.estadoDelJuego.trucoActivo) {
            mostrarMensaje('No puedes apostar Truco en este momento.');
            return;
        }

        mostrarMensaje(`${jugador} juega TRUCO`);
        this.estadoDelJuego.trucoActivo = true;
        this.cambiarTurno();
    },
    jugarEnvido(jugador: string) {
        if (this.estadoDelJuego.trucoActivo || this.estadoDelJuego.envidoResuelto) {
            mostrarMensaje('No puedes apostar Envido en este momento.');
            return;
        }

        mostrarMensaje(`${jugador} juega ENVIDO`);
        this.estadoDelJuego.envidoActivo = true;
        this.ultimaApuestaEnvido = 2;

        if (jugador === 'jugador') {
            const deseaAumentar = confirm('¿Deseas aumentar la apuesta?');
            if (deseaAumentar) {
                this.ultimaApuestaEnvido += 2;
                mostrarMensaje(`Jugador aumenta la apuesta a ${this.ultimaApuestaEnvido}`);
            }
        } else {
            const respuestaCPU = this.cpu.decidirApostarEnvido();
            if (respuestaCPU === 'Quiero') {
                this.ultimaApuestaEnvido += 2;
                mostrarMensaje(`CPU aumenta la apuesta a ${this.ultimaApuestaEnvido}`);
            }
        }

        this.resolverEnvido();
    },
    jugarFlor(jugador: string) {
        if (this.estadoDelJuego.trucoActivo || this.estadoDelJuego.envidoActivo) {
            mostrarMensaje('No puedes apostar Flor en este momento.');
            return;
        }

        mostrarMensaje(`${jugador} juega FLOR`);
        this.estadoDelJuego.florActivo = true;
        this.resolverFlor();
    },
    retirarse(jugador: string) {
        mostrarMensaje(`${jugador} se retira del juego`);
        if (jugador === 'jugador') {
            this.cpu.sumarPuntos(this.jugador.obtenerPuntos());
            mostrarMensaje('CPU gana el juego');
        } else {
            this.jugador.sumarPuntos(this.cpu.obtenerPuntos());
            mostrarMensaje('Jugador gana el juego');
        }
        this.actualizarCreditos();
    },
    resolverEnvido() {
        const valorEnvidoJugador = calcularEnvido(this.jugador.mano);
        const valorEnvidoCPU = calcularEnvido(this.cpu.mano);

        mostrarMensaje(`Envido Jugador: ${valorEnvidoJugador}`);
        mostrarMensaje(`Envido CPU: ${valorEnvidoCPU}`);

        if (valorEnvidoJugador > valorEnvidoCPU) {
            mostrarMensaje('El jugador gana el Envido.');
            this.jugador.sumarPuntos(this.ultimaApuestaEnvido);
        } else if (valorEnvidoJugador < valorEnvidoCPU) {
            mostrarMensaje('La CPU gana el Envido.');
            this.cpu.sumarPuntos(this.ultimaApuestaEnvido);
        } else {
            mostrarMensaje('Empate en el Envido. Gana el jugador más cercano al mano.');
            this.mano === 'jugador' ? this.jugador.sumarPuntos(this.ultimaApuestaEnvido) : this.cpu.sumarPuntos(this.ultimaApuestaEnvido);
        }

        this.actualizarCreditos();
        this.estadoDelJuego.envidoActivo = false;
        this.estadoDelJuego.envidoResuelto = true;
    },
    resolverFlor() {
        const valorFlorJugador = calcularValorFlor(this.jugador);
        const valorFlorCPU = calcularValorFlor(this.cpu);

        if (valorFlorJugador > valorFlorCPU) {
            this.jugador.sumarPuntos(3);
            mostrarMensaje('Jugador gana la Flor.');
        } else {
            this.cpu.sumarPuntos(3);
            mostrarMensaje('CPU gana la Flor.');
        }

        this.estadoDelJuego.florActivo = false;
        this.estadoDelJuego.florResuelto = true;
    },
    cambiarTurno() {
        this.turno = this.turno === 'jugador' ? 'cpu' : 'jugador';
    },
    jugarCPU() {
        this.cpu.jugarTurno(this);
    },
    finalizarJuego() {
        const ganador = this.puntosJugador >= 30 ? 'Jugador' : 'CPU';
        mostrarMensaje(`${ganador} gana el juego con ${this.puntosJugador >= 30 ? this.puntosJugador : this.puntosCPU} puntos!`);
        // Aquí podrías agregar un botón para reiniciar
    }
};

// Inicialización del juego
juego.iniciarJuego();
