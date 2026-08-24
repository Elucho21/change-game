/**
 * Enganche de contenido Grok sin tocar los arrays core.
 * Se importa una vez desde app/page.tsx (side-effect).
 */
import { DECISIONS } from './decisions';
import { DECISIONS_ECONOMIA } from './decisions_economia';
import { DECISIONS_ORMUZ } from './decisions_ormuz';
import { NATIONAL_EVENTS } from './events/national';
import { NATIONAL_EVENTS_EXTRA } from './events/national_extra';
import { MINORITY_LEADER_EVENTS } from './events/minority_leaders';
import { WORLD_EVENTS } from './events/world';
import { WORLD_EVENTS_EXTRA } from './events/world_extra';

const g = globalThis as unknown as { __changeGameContentBooted?: boolean };
if (!g.__changeGameContentBooted) {
  g.__changeGameContentBooted = true;
  DECISIONS.push(...DECISIONS_ORMUZ, ...DECISIONS_ECONOMIA);
  NATIONAL_EVENTS.push(...NATIONAL_EVENTS_EXTRA, ...MINORITY_LEADER_EVENTS);
  WORLD_EVENTS.push(...WORLD_EVENTS_EXTRA);
}
