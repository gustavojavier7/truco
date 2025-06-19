# AGENTS.md

## Lenguaje objetivo
- JavaScript (ES6+)

## Reglas de modificación por Codex

### 📅 Fecha y hora de edición
- Codex debe insertar al **comienzo del archivo** modificado el siguiente comentario:
  ```js
  // Última modificación: YYYY-MM-DD HH:MM (por Codex)
  ```

### 🔢 Sistema de versión automático

Codex debe agregar o actualizar un comentario con la **versión del archivo** justo debajo del comentario de fecha, según el siguiente esquema:

```js
// Versión: X.Y.Z
```

#### Reglas para incremento de versión:

- **X (mayor)**: si se modifica una **función pública o API externa**.
- **Y (menor)**: si se agregan nuevas funciones o estructuras internas.
- **Z (parche)**: si solo se corrigen errores menores, comentarios o estilos.

Codex debe determinar automáticamente el impacto del cambio y **actualizar la versión** en base al número anterior, si existe. Si no existe, comenzará con `1.0.0`.

### 🔍 Ejemplo completo esperado al principio del archivo

```js
// Última modificación: 2025-06-19 14:37 (por Codex)
// Versión: 1.2.0
```

### ✔ Validación

- La fecha debe estar en **formato ISO** local (`YYYY-MM-DD HH:MM`).
- Se deben conservar los comentarios anteriores del archivo.
