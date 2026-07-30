# ASCEND · Technical Assessment (Pantalla 1)

Todo en **un solo nivel** (sin subcarpetas). Sube esta carpeta completa a Git.

## Entrada

`index.html`

## Flujo al abrir

### Usuario estándar (`?role=standard`)

1. **Precarga del agente** (~20 s): panel ASCEND Assistant con barra de progreso y mensajes de trabajo.
2. **Assessment**: Key Metrics, Delta Analysis, Governance con lazy-reveal.

### Consultor / super usuario (por defecto, o `?role=consultant`, `?role=superuser`, `?role=super`)

1. **Connect to a WMS**: formulario de preconfiguración (Provider, Label, Base URL, User, Password). Connect es obligatorio.
2. **Precarga del agente** (~20 s): igual que arriba, tras conexión exitosa.
3. **Assessment**: dashboard completo.

Con `prefers-reduced-motion: reduce`, la precarga del agente se acorta a ~2 s.

## Parámetros de demo

| URL | Comportamiento |
|-----|----------------|
| `index.html` | WMS preconfig → agente → assessment (rol consultor por defecto) |
| `index.html?role=standard` | Sin WMS: agente → assessment directo |
| `index.html?role=superuser` | WMS preconfig → agente → assessment |

## Archivos del repo

| Archivo | Uso |
|---------|-----|
| `index.html` | Pantalla |
| `ascend-tokens.css` … `ascend-fab.css` | Estilos compartidos |
| `ascend-wms-preconfig.js` | Preconfig WMS para roles privilegiados |
| `ascend-agent-preload.js` | Secuencia de precarga del agente (tras `ascend:wms-connected` si aplica) |
| `ascend-lazy-reveal.js` | Animación por secciones (tras `ascend:assessment-ready`) |
| `Arganologo.png`, `icon-lightbulb.svg` | Logo e iconos Ask AI |

PrimeNG 17 se carga por CDN (internet al abrir).
