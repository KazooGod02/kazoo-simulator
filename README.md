# KAZOO SIMULATOR: Operación Sin César

Plataformas 8-bit estilo Super Mario de **Kazoo Studios**. Secuela espiritual de [CÉSAR SIMULATOR](https://github.com/KazooGod02/cesar-simulator).

**+18:** humor adulto, albures y doble sentido. Nada explícito, pero sí mucha pena ajena.

César lleva 14 años sin parar con Manuela (su mano derecha), y cada vez lo hace más rápido. La energía que genera está rompiendo el universo. Kazoo, el repartidor que le surtió cada rollo de papel, tiene que llegar a su cuarto antes de que el **Chaquetómetro** marque 100%.

## Contenido

- 8 niveles en 4 mundos más el cuarto final: Culiacán, el Mercado Garmendia, la fábrica de papel, el drenaje, la parroquia, el internet, la imaginación de César y su casa.
- 5 jefes: Don Pancho, El Taponazo, el Pop-up Supremo, Firulais radioactivo y César (con Manuela).
- **4 finales:**
  1. **Al fin, cesó:** le ganas a César en una pelea.
  2. **La despedida:** lo convences con sus recuerdos y tiene que dejar a Manuela. Necesitas 6 de los 8 recuerdos.
  3. **La chancla de Dios:** llamas a Doña Lupe y juegas como ella. Necesitas los 3 objetos de mamá, escondidos en tubos.
  4. **El Big Bang:** el Chaquetómetro llega a 100% (o lo dejas en paz).
- El Chaquetómetro sube con el tiempo y cada vez que mueres. Lo bajan el agua bendita y cortarle a César el papel (mundo 2) y el Wi-Fi (mundo 3). Mientras más alto, más rápida la música y más tiembla todo.
- Los recuerdos, los objetos de mamá y los finales se guardan aunque empieces otra partida. Puedes elegir cualquier nivel que ya hayas pasado.

## Controles

| Acción | Teclado | Control | Celular |
|---|---|---|---|
| Moverse | ← → / A D | Stick / cruceta | ◀ ▶ |
| Saltar (mantén para saltar más alto) | Espacio / Z / ↑ | A | A / ▲ |
| Correr (mantén) y lanzar la chancla | Shift / X | X o B | B |
| Kazoo (aturde a los enemigos cercanos) | C | Y / RB | 🎺 |
| Hablar | ↑ cerca de alguien | ↑ | ▲ |
| Entrar a un tubo | ↓ encima del tubo | ↓ | ▼ |
| Pausa | Esc / P | Start | II |

## Jugar en local

Abre `index.html` en el navegador o sirve la carpeta (por ejemplo `python -m http.server`).

## Publicar en GitHub Pages

1. Sube esta carpeta a un repo nuevo (por ejemplo `kazoo-simulator`).
2. En **Settings → Pages**, elige la rama `main` y la carpeta `/ (root)`.
3. El juego queda en `https://kazoogod02.github.io/kazoo-simulator/`.

## Archivos

- `js/engine.js`: canvas, controles (teclado, control y táctil), efectos de sonido y la música chiptune generada por código.
- `js/sprites.js`: todos los sprites, tiles y fondos se dibujan con código, sin imágenes.
- `js/story.js`: diálogos, cinemáticas, recuerdos, letreros y finales. Aquí se edita el humor.
- `js/levels.js`: los niveles, armados por segmentos.
- `js/entities.js`: Kazoo, enemigos, objetos y jefes.
- `js/game.js`: menús, HUD, guardado, la decisión final y los finales.
- [HISTORIA.md](HISTORIA.md): la historia completa.
