// script.js v1.06

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
            11: 'Caballo', // Corregido de "Caballo" a "Caballo"
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
            // Ajuste para 40 cartas: valores del 1 al 7 y del 10 al 12
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

            // Función para desactivar todas las cartas
            const desactivarCartas = () => {
                cartasJugador.forEach(cartaElement => {
                    cartaElement.removeEventListener('click', handleClick);
                    cartaElement.style.pointerEvents = 'none'; // Desactivar eventos de clic
                });
            };

            // Función para manejar el clic en una carta
            const handleClick = (event) => {
                const cartaElement = event.currentTarget;
                const index = cartaElement.dataset.index;

                // Obtener la carta seleccionada
                const cartaSeleccionada = this.mano[index];

                // Remover la carta seleccionada de la mano
                this.mano.splice(index, 1);

                // Desactivar todas las cartas
                desactivarCartas();

                // Resolver la promesa con la carta seleccionada
                resolve(cartaSeleccionada);
            };

            // Añadir event listeners a todas las cartas
            cartasJugador.forEach(cartaElement => {
                cartaElement.addEventListener('click', handleClick);
            });
        });
    }

    decidirAnunciarFlor(valorFlor) {
        // Implementación básica: siempre quiere anunciar la Flor
        return true;
    }

    decidirApostarFlor(valorFlor) {
        // Implementación básica: siempre quiere
        return 'Quiero';
    }
}


    decidirAnunciarFlor(valorFlor) {
        // Implementación básica: siempre quiere anunciar la Flor
        return true;
    }

    decidirApostarFlor(valorFlor) {
        // Implementación básica: siempre quiere
        return 'Quiero';
    }
}

class ClaseCPU extends ClaseJugador {
    // Decide si la CPU debe anunciar Flor
    decidirAnunciarFlor() {
        if (this.mano.length === 3) {
            const paloFlor = this.mano.reduce((mapa, carta) => {
                mapa[carta.palo] = (mapa[carta.palo] || 0) + 1;
                return mapa;
            }, {});

            const hayFlor = Object.values(paloFlor).some(count => count === 3); // Verificar si hay tres cartas del mismo palo
            return hayFlor;
        }
        return false;
    }

    // Decide si la CPU debe apostar al Envido
    decidirApostarEnvido() {
        const valoresEnvido = this.calcularEnvido();
        if (valoresEnvido >= 25) {
            return 'Envido'; // Apuesta Envido si tiene un puntaje alto
        } else if (valoresEnvido >= 20) {
            return Math.random() < 0.5 ? 'Envido' : 'Real Envido'; // Apuesta más agresiva ocasionalmente
        }
        return null; // No apuesta si su Envido es bajo
    }

    // Decide si la CPU debe iniciar Truco
    decidirApostarTruco() {
        const valoresAltos = [14, 13, 12]; // As, 7 de espadas/oros, 3
        const cartasFuertes = this.mano.filter(carta => valoresAltos.includes(carta.obtenerValorTruco()));
        if (cartasFuertes.length >= 2) {
            return 'Truco'; // Apuesta Truco si tiene al menos 2 cartas fuertes
        } else if (cartasFuertes.length === 1) {
            return Math.random() < 0.5 ? 'Truco' : null; // Apuesta ocasionalmente con 1 carta fuerte
        }
        return null; // No apuesta si no tiene cartas fuertes
    }

    // Calcular el valor del Envido
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

        // Si no tiene pares, usar la carta más alta
        if (mejorEnvido === 0) {
            mejorEnvido = Math.max(...this.mano.map(carta => carta.valor));
        }

        return mejorEnvido;
    }

    // Juega su turno automáticamente
    jugarTurno(juego) {
        if (this.decidirAnunciarFlor()) {
            juego.anunciarFlor('cpu'); // La CPU anuncia Flor
        } else {
            const apuestaEnvido = this.decidirApostarEnvido();
            if (apuestaEnvido) {
                juego.jugarEnvido('cpu'); // La CPU apuesta Envido
            } else {
                const apuestaTruco = this.decidirApostarTruco();
                if (apuestaTruco) {
                    juego.jugarTruco('cpu'); // La CPU apuesta Truco
                } else {
                    // Si no apuesta, simplemente juega su carta más baja
                    const carta = this.elegirCarta();
                    juego.mostrarMensaje(`CPU juega ${carta.obtenerNombre()} de ${carta.palo}`);
                }
            }
        }
    }

    async jugarTurnoJugador() {
    this.mostrarMensaje('Es tu turno. Elige una carta para jugar.');

    // Esperar a que el jugador elija una carta
    const cartaSeleccionada = await this.jugador.elegirCarta();

    // Mostrar la carta seleccionada en los mensajes
    this.mostrarMensaje(`Has jugado: ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);

    // Procesar la carta jugada (puedes añadir aquí la lógica para resolver el truco)
    this.procesarCartaJugada(cartaSeleccionada, 'jugador');

    // Cambiar turno
    this.cambiarTurno();
    this.jugarTurnoCPU(); // Turno de la CPU
}

    // Elegir la carta más baja como fallback
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
        // Determina al azar quién será el mano
        this.turno = Math.random() < 0.5 ? 'jugador' : 'cpu';
        this.mano = this.turno === 'jugador' ? 'jugador' : 'cpu'; // El 'mano' es quien empieza
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
            this.mostrarOpciones();
        }
    }
 jugarTurnoCPU() {
        this.cpu.jugarTurno(this); // La CPU juega su turno
        this.cambiarTurno(); // Cambiar turno al jugador
        this.mostrarOpciones(); // Mostrar opciones al jugador
    }

    manejarFlor() {
        if (this.florJugador) {
            // El jugador tiene Flor
            this.mostrarMensaje('El jugador tiene Flor');
            // Mostrar el botón para anunciar la Flor
            document.getElementById('florAnnouncement').style.display = 'block';
            // Añadir un event listener al botón
            document.getElementById('anunciarFlorBtn').addEventListener('click', () => {
                this.anunciarFlor('jugador');
                // Ocultar el botón después de anunciar la Flor
                document.getElementById('florAnnouncement').style.display = 'none';
            });
        } else if (this.florCPU) {
            // La CPU tiene Flor
            this.mostrarMensaje('La CPU tiene Flor');
            // La CPU decide si anuncia la Flor
            const anunciarCPU = this.cpu.decidirAnunciarFlor(this.florCPU);
            if (anunciarCPU) {
                this.anunciarFlor('cpu');
            } else {
                // La CPU no anuncia la Flor, procedemos con Envido o Truco
                this.mostrarOpciones();
            }
        } else {
            // Nadie tiene Flor, procedemos con Envido o Truco
            this.mostrarOpciones();
        }
    }

    anunciarFlor(jugador) {
        if (jugador === 'jugador') {
            // El jugador anuncia la Flor
            this.mostrarMensaje('El jugador anuncia Flor');
            // Calcular el valor de la Flor
            const valorFlor = this.calcularValorFlor(this.jugador);
            this.mostrarMensaje(`Valor de la Flor del jugador: ${valorFlor}`);
            // La CPU decide si quiere la Flor
            const respuestaCPU = this.cpu.decidirApostarFlor(valorFlor);
            if (respuestaCPU === 'Quiero') {
                this.mostrarMensaje('CPU quiere la Flor');
                // Determinar el ganador de la Flor
                if (valorFlor > this.calcularValorFlor(this.cpu)) {
                    this.jugador.sumarPuntos(3); // Puntos por ganar la Flor
                    this.mostrarMensaje('Jugador gana la Flor');
                } else {
                    this.cpu.sumarPuntos(3); // Puntos por ganar la Flor
                    this.mostrarMensaje('CPU gana la Flor');
                }
            } else {
                this.mostrarMensaje('CPU no quiere la Flor');
                this.jugador.sumarPuntos(3); // Puntos por la Flor no aceptada
            }
        } else if (jugador === 'cpu') {
            // La CPU anuncia la Flor
            this.mostrarMensaje('La CPU anuncia Flor');
            // Calcular el valor de la Flor de la CPU
            const valorFlorCPU = this.calcularValorFlor(this.cpu);
            this.mostrarMensaje(`Valor de la Flor de la CPU: ${valorFlorCPU}`);
            // El jugador decide si quiere la Flor
            const respuestaJugador = this.jugador.decidirApostarFlor(valorFlorCPU);
            if (respuestaJugador === 'Quiero') {
                this.mostrarMensaje('Jugador quiere la Flor');
                // Determinar el ganador de la Flor
                if (this.calcularValorFlor(this.jugador) > valorFlorCPU) {
                    this.jugador.sumarPuntos(3); // Puntos por ganar la Flor
                    this.mostrarMensaje('Jugador gana la Flor');
                } else {
                    this.cpu.sumarPuntos(3); // Puntos por ganar la Flor
                    this.mostrarMensaje('CPU gana la Flor');
                }
            } else {
                this.mostrarMensaje('Jugador no quiere la Flor');
                this.cpu.sumarPuntos(3); // Puntos por la Flor no aceptada
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

        // Limpiar contenedores antes de añadir nuevas cartas
        cpuContainer.innerHTML = '<div class="area-label">CPU</div>';
        playerContainer.innerHTML = '<div class="area-label">JUGADOR</div>';

        // Mostrar cartas del CPU (boca abajo)
        this.cpu.mostrarMano().forEach(() => {
            const cartaBack = document.createElement('div');
            cartaBack.className = 'carta-back';
            cpuContainer.appendChild(cartaBack);
        });

        // Mostrar cartas del jugador (boca arriba)
        this.jugador.mostrarMano().forEach((carta, index) => {
            const cartaElement = document.createElement('div');
            cartaElement.className = `carta ${carta.palo.toLowerCase()}`;
            cartaElement.textContent = `${carta.obtenerNombre()} de ${carta.palo}`;
            cartaElement.dataset.index = index; // Añadir un data attribute para identificar la carta
            cartaElement.addEventListener('click', () => {
                // Quitar la clase 'carta-seleccionada' de todas las cartas del jugador
                playerContainer.querySelectorAll('.carta').forEach(c => c.classList.remove('carta-seleccionada'));
                // Añadir la clase 'carta-seleccionada' a la carta clicada
                cartaElement.classList.add('carta-seleccionada');
            });
            playerContainer.appendChild(cartaElement);
        });

        // Actualizar créditos
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
            // Lógica para la CPU
            this.jugarCPU();
            return;
        }

        // Añadir event listeners a los nuevos botones
        document.getElementById('trucoBtn')?.addEventListener('click', () => this.jugarTruco('jugador'));
        document.getElementById('envidoBtn')?.addEventListener('click', () => this.jugarEnvido('jugador'));
        document.getElementById('florBtn')?.addEventListener('click', () => this.jugarFlor('jugador'));
        document.getElementById('retirarseBtn')?.addEventListener('click', () => this.retirarse('jugador'));
    }

    jugarTruco(jugador) {
        this.mostrarMensaje(`${jugador} juega TRUCO`);
        // Implementar lógica de Truco
        this.cambiarTurno();
    }

    jugarEnvido(jugador) {
        this.mostrarMensaje(`${jugador} juega ENVIDO`);

        // Calcular valores del Envido
        let valorEnvidoJugador = this.calcularEnvido(this.jugador.mostrarMano());
        let valorEnvidoCPU = this.calcularEnvido(this.cpu.mostrarMano());

        // Inicializar apuesta
        let apuestaActual = 2; // Envido vale inicialmente 2 puntos
        let envidoActivo = true; // Control del flujo de apuestas

        this.mostrarMensaje(`Envido iniciado. Jugador: ${valorEnvidoJugador}, CPU: ${valorEnvidoCPU}`);

        // Ciclo de apuestas
        while (envidoActivo) {
            if (jugador === 'jugador') {
                // Simulación: siempre apuesta un Real Envido
                let deseaAumentar = confirm('¿Deseas aumentar la apuesta (Real Envido o Falta Envido)?');
                if (deseaAumentar) {
                    apuestaActual += 2; // Incremento por Real Envido
                    this.mostrarMensaje(`Jugador aumenta la apuesta a ${apuestaActual}`);
                } else {
                    envidoActivo = false;
                    this.mostrarMensaje('Jugador no aumenta la apuesta');
                }
            }

            // Respuesta de la CPU
            let respuestaCPU = this.cpu.decidirApostar(valorEnvidoCPU);
            if (respuestaCPU === 'Quiero') {
                this.mostrarMensaje(`CPU acepta la apuesta de ${apuestaActual}`);
                if (jugador === 'jugador') {
                    jugador = 'cpu'; // Cambiar turno de apuesta
                } else {
                    envidoActivo = false; // CPU no puede aumentar en esta lógica básica
                }
            } else {
                this.mostrarMensaje('CPU no quiere la apuesta');
                this.jugador.sumarPuntos(1); // Punto por rechazo
                this.actualizarCreditos();
                return this.cambiarTurno();
            }
        }

        // Resolver el Envido
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
        gameMessages.scrollTop = gameMessages.scrollHeight; // Desplaza automáticamente al último mensaje

        // Limitar a 5 mensajes
        const mensajes = gameMessages.getElementsByTagName('div');
        if (mensajes.length > 5) {
            gameMessages.removeChild(mensajes[0]);
        }
    }

    cambiarTurno() {
        this.turno = this.turno === 'jugador' ? 'cpu' : 'jugador';
    }

    jugarCPU() {
        // Implementar lógica para que la CPU juegue su turno
    }

    retirarse(jugador) {
        // Implementar lógica para retirarse del juego
    }
}

// Crear instancias de los jugadores
const jugador = new ClaseJugador('Humano'); // Define el jugador humano
const cpu = new ClaseCPU('CPU'); // Define la CPU

// Crear instancia del juego
const juego = new ClaseJuegoTruco(jugador, cpu);

// Iniciar el juego
juego.iniciarJuego();
