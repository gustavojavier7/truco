let credits = 0;
let currentPlayer = 'jugador'; // Puede ser 'jugador' o 'cpu'

// Clase para representar una carta
class Carta {
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
class Mazo {
    constructor() {
        this.cartas = [];
        const palos = ['Espadas', 'Bastos', 'Copas', 'Oros'];
        for (let palo of palos) {
            // Ajuste para 40 cartas: valores del 1 al 7 y del 10 al 12
            for (let valor = 1; valor <= 7; valor++) {
                this.cartas.push(new Carta(palo, valor));
            }
            for (let valor = 10; valor <= 12; valor++) {
                this.cartas.push(new Carta(palo, valor));
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
class Jugador {
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
        // Implementación para jugador humano
        return null;
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

// Clase para representar la CPU
class CPU extends Jugador {
    elegirCarta() {
        // Implementación básica: elegir la primera carta
        return this.mano.shift();
    }

    decidirAnunciarFlor(valorFlor) {
        // Implementación básica: decide aleatoriamente si anuncia la Flor
        return Math.random() < 0.5;
    }

    decidirApostarFlor(valorFlor) {
        // Implementación básica: decide aleatoriamente si quiere la Flor
        return Math.random() < 0.5 ? 'Quiero' : 'No quiero';
    }

    decidirApostar(envido) {
        // Lógica básica: apostar si el envido es alto
        return envido >= 25 ? 'Quiero' : 'No quiero';
    }
}

// Clase para representar el juego
class JuegoTruco {
    constructor(jugador, cpu) {
        this.jugador = jugador;
        this.cpu = cpu;
        this.mazo = new Mazo();
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

        // Mostrar quién es el mano
        const manoDisplay = document.getElementById('manoDisplay');
        manoDisplay.textContent = this.mano === 'cpu' ? 'Yo soy mano' : 'Vos sos mano';
        manoDisplay.style.display = 'block';

        // Manejar la Flor
        this.manejarFlor();
    }

    manejarFlor() {
        if (this.florJugador) {
            // El jugador tiene Flor
            console.log('El jugador tiene Flor');
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
            console.log('La CPU tiene Flor');
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
            console.log('El jugador anuncia Flor');
            // Calcular el valor de la Flor
            const valorFlor = this.calcularValorFlor(this.jugador);
            console.log(`Valor de la Flor del jugador: ${valorFlor}`);
            // La CPU decide si quiere la Flor
            const respuestaCPU = this.cpu.decidirApostarFlor(valorFlor);
            if (respuestaCPU === 'Quiero') {
                console.log('CPU quiere la Flor');
                // Determinar el ganador de la Flor
                if (valorFlor > this.calcularValorFlor(this.cpu)) {
                    this.jugador.sumarPuntos(3); // Puntos por ganar la Flor
                    console.log('Jugador gana la Flor');
                } else {
                    this.cpu.sumarPuntos(3); // Puntos por ganar la Flor
                    console.log('CPU gana la Flor');
                }
            } else {
                console.log('CPU no quiere la Flor');
                this.jugador.sumarPuntos(3); // Puntos por la Flor no aceptada
            }
        } else if (jugador === 'cpu') {
            // La CPU anuncia la Flor
            console.log('La CPU anuncia Flor');
            // Calcular el valor de la Flor de la CPU
            const valorFlorCPU = this.calcularValorFlor(this.cpu);
            console.log(`Valor de la Flor de la CPU: ${valorFlorCPU}`);
            // El jugador decide si quiere la Flor
            const respuestaJugador = this.jugador.decidirApostarFlor(valorFlorCPU);
            if (respuestaJugador === 'Quiero') {
                console.log('Jugador quiere la Flor');
                // Determinar el ganador de la Flor
                if (this.calcularValorFlor(this.jugador) > valorFlorCPU) {
                    this.jugador.sumarPuntos(3); // Puntos por ganar la Flor
                    console.log('Jugador gana la Flor');
                } else {
                    this.cpu.sumarPuntos(3); // Puntos por ganar la Flor
                    console.log('CPU gana la Flor');
                }
            } else {
                console.log('Jugador no quiere la Flor');
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
        console.log(`${jugador} juega TRUCO`);
        // Implementar lógica de Truco
        this.cambiarTurno();
    }

    jugarEnvido(jugador) {
        console.log(`${jugador} juega ENVIDO`);

        // Calcula el valor del Envido para el jugador
        let valorEnvidoJugador = this.calcularEnvido(this.jugador.mostrarMano());
        let valorEnvidoCPU = this.calcularEnvido(this.cpu.mostrarMano());

        // Aquí se debería implementar la lógica de apuestas
        // Para simplificar, asumiremos que el jugador humano siempre quiere y la CPU decide basado en su valor de Envido
        let respuestaCPU = this.cpu.decidirApostar(valorEnvidoCPU);

        if (respuestaCPU === 'Quiero') {
            console.log('CPU acepta el Envido');
            // Determinar el ganador del Envido
            if (valorEnvidoJugador > valorEnvidoCPU) {
                this.jugador.sumarPuntos(2); // Puntos por ganar el Envido
                console.log('Jugador gana el Envido');
            } else {
                this.cpu.sumarPuntos(2); // Puntos por ganar el Envido
                console.log('CPU gana el Envido');
            }
        } else {
            console.log('CPU no quiere el Envido');
            this.jugador.sumarPuntos(1); // Punto por rechazo del Envido
        }

        this.cambiarTurno();
    }

    calcularEnvido(mano) {
        // Función para calcular el valor del Envido
        let valores = mano.map(carta => carta.valor);
        let palos = mano.map(carta => carta.palo);

        let maxValor = Math.max(...valores.filter(valor => valor < 10)); // Ignoramos figuras (10, 11, 12)

        // Buscar dos cartas del mismo palo
        let paloComun = palos.find(palo => palos.filter(p => p === palo).length >= 2);
        if (paloComun) {
            let cartasDelMismoPalo = mano.filter(carta => carta.palo === paloComun && carta.valor < 10);
            if (cartasDelMismoPalo.length === 2) {
                return cartasDelMismoPalo.reduce((sum, carta) => sum + carta.valor, 0) + 20;
            } else if (cartasDelMismoPalo.length === 3) {
                // Si son tres, usamos las dos más altas
                let dosCartas = cartasDelMismoPalo.sort((a, b) => b.valor - a.valor).slice(0, 2);
                return dosCartas.reduce((sum, carta) => sum + carta.valor, 0) + 20;
            }
        }

        // Si no hay dos cartas del mismo palo, el Envido es el valor de la carta más alta
        return maxValor;
    }

    jugarFlor(jugador) {
        console.log(`${jugador} juega FLOR`);
        // Implementar lógica de Flor
        this.cambiarTurno();
    }

    retirarse(jugador) {
        console.log(`${jugador} se retira`);
        // Implementar lógica de retirarse
        this.cambiarTurno();
    }

    cambiarTurno() {
        this.turno = this.turno === 'jugador' ? 'cpu' : 'jugador';
        this.mostrarOpciones();
    }

    jugarCPU() {
        // Implementar lógica para la CPU
        console.log('CPU juega');
        // Simulación de acción de la CPU
        setTimeout(() => {
            this.cambiarTurno();
        }, 1000);
    }

    obtenerColorAleatorio() {
        const colores = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        return colores[Math.floor(Math.random() * colores.length)];
    }
}

// Inicializar el juego
const jugador = new Jugador('Humano');
const cpu = new CPU('CPU');
const juego = new JuegoTruco(jugador, cpu);
juego.iniciarJuego();
