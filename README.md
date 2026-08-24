# ASCEND · Technical Assessment (Pantalla 1)

Todo en **un solo nivel** (sin subcarpetas). Sube esta carpeta completa a Git.

## Entrada

`index.html`

## Flujo al abrir

### Usuario estándar (`?role=standard`)

1. **Precarga del agente** (~20 s): panel ASCEND Assistant con barra de progreso y mensajes de trabajo.
2. **Assessment**: Key Metrics, Delta Analysis, Governance con lazy-reveal.

### Consultor / super usuario (por defecto, o `?role=consultant`, `?role=superuser`, `?role=super`)

1. **Connect to a WMS** — paso 1 de 2: credenciales (Provider, Label, Base URL, User, Password). `Continue` verifica y descubre los warehouses disponibles.
2. **Connect to a WMS** — paso 2 de 2: selección del Warehouse ID sobre el que corre el assessment. `Back` vuelve a las credenciales; `Connect` es obligatorio para avanzar.
3. **Precarga del agente** (~20 s): igual que arriba, tras conexión exitosa.
4. **Assessment**: dashboard completo.

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
| `ascend-info-tips.js` | Tooltip flotante de los iconos de información (`[data-ascend-tip]`) |
| `Arganologo.png`, `icon-lightbulb.svg` | Logo e iconos Ask AI |

PrimeNG 17 se carga por CDN (internet al abrir).

## Iconos de información

Cada card del assessment lleva un icono `pi-info-circle` junto a su título, que muestra una
descripción breve en hover, focus o tap. Los encabezados de sección no lo llevan: la explicación
vive en la card. Para añadir uno nuevo:

```html
<button type="button" class="ascend-info" aria-label="About <nombre>" data-ascend-tip="Texto breve">
  <i class="pi pi-info-circle" aria-hidden="true"></i>
</button>
```

El tooltip se posiciona en `position:fixed` fuera del card (evita el `overflow:hidden` de `.card`),
se voltea arriba si no cabe abajo y se cierra con `Escape`. En Angular equivale a `pTooltip`.

## Detalle desplegable (Delta Analysis)

Delta Analysis es una sola card, `Effort Calculator`: arriba el desglose por tipo de trabajo y el
total, en medio la tabla de componentes como detalle colapsado (`.scope-detail`), y al final el CTA
`Continue to Migration Path`, que siempre queda al fondo se abra o no el detalle.

```html
<div class="scope-detail">
  <div class="scope-detail-head">
    <span class="scope-detail-label">…<span class="scope-detail-meta">…</span></span>
    <button type="button" class="btn-collapse" data-collapse-toggle
            aria-expanded="false" aria-controls="miRegion"
            data-collapse-label-show="Show X" data-collapse-label-hide="Hide X">
      <span class="btn-collapse-text">Show X</span><i class="pi pi-chevron-down" aria-hidden="true"></i>
    </button>
  </div>
  <div class="card-collapse" id="miRegion" role="region" aria-label="…" hidden>…</div>
</div>
```

Toda la fila (`.scope-detail-head`) abre/cierra el detalle; el chip con chevron se mantiene a la derecha
como affordance visual. El icono de info sigue siendo clicable por su cuenta (tooltip) y no dispara el
toggle. En ≤680px el chip pasa a ancho completo debajo del label.

Cada categoría de la calculadora (`Changes to DB schema`, `Source code`, `WMS database records`) es
un botón que abre `#scopeModalLayer` con la tabla de subgrupos de ese tópico. El modal usa el
primitivo `.ascend-modal*` de `ascend-primitives.css` (equivalente a `p-dialog`): se cierra con el
botón, con el backdrop o con `Escape`, y devuelve el foco a la categoría que lo abrió. Para añadir
una categoría: un `[data-scope-modal="clave"]` con `data-scope-title`, y su panel
`[data-scope-panel="clave"]` dentro del modal.
