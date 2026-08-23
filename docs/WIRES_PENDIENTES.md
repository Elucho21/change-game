# Wires pendientes (aplicar en 1 minuto)

Los extras ya estan en la rama. Falta engancharlos:

## lib/cabinet.ts
```ts
import { EXTRA_MINISTERS } from './ministers_extra';
// al final del array MINISTERS, antes de ];
  ...(EXTRA_MINISTERS as unknown as Minister[])
```

## lib/decisions.ts
```ts
import { DECISIONS_ORMUZ } from './decisions_ormuz';
const DECISIONS_CORE: Decision[] = [ /* era DECISIONS */ ];
export const DECISIONS: Decision[] = [...DECISIONS_CORE, ...DECISIONS_ORMUZ];
```

## lib/events/national.ts
```ts
import { NATIONAL_EVENTS_EXTRA } from './national_extra';
const NATIONAL_EVENTS_CORE: GameEvent[] = [ /* era NATIONAL_EVENTS */ ];
export const NATIONAL_EVENTS: GameEvent[] = [...NATIONAL_EVENTS_CORE, ...NATIONAL_EVENTS_EXTRA];
```

## lib/events/world.ts
```ts
import { WORLD_EVENTS_EXTRA } from './world_extra';
// + ongoing en guerra_comercial y guerra_regional (ver commits de contenido)
const WORLD_EVENTS_CORE: GameEvent[] = [ /* era WORLD_EVENTS */ ];
export const WORLD_EVENTS: GameEvent[] = [...WORLD_EVENTS_CORE, ...WORLD_EVENTS_EXTRA];
```

Tests locales con wires: 75 verdes.

Claude puede aplicar estos 4 engaches en un solo commit al mergear, o Grok en el siguiente push.
