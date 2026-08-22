"""
Pax Historia Style - Geopolitical Strategy Game Engine (MVP)
Single-player. AI controls all other countries.
Designed for low token usage + realistic non-linear simulation.
"""

import json
import random
from copy import deepcopy
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum

# ============================================================
# ENUMS & DATA STRUCTURES
# ============================================================

class RelationLevel(str, Enum):
    AMISTOSO = "amistoso"
    NEUTRAL = "neutral"
    TENSO = "tenso"
    HOSTIL = "hostil"

class EventType(str, Enum):
    WORLD = "world"
    NATIONAL = "national"
    PERSONAL = "personal"
    REACTION = "reaction"

@dataclass
class GameState:
    year: int = 2025
    month: int = 1
    turn: int = 1
    player_country: str = ""
    countries: Dict = field(default_factory=dict)
    global_state: Dict = field(default_factory=dict)
    history: List[Dict] = field(default_factory=list)
    active_events: List[Dict] = field(default_factory=list)
    pending_reactions: List[Dict] = field(default_factory=list)

# ============================================================
# CORE ENGINE
# ============================================================

class GeopoliticsEngine:
    def __init__(self, data_path: str = "countries_mvp.json"):
        with open(data_path, "r", encoding="utf-8") as f:
            self.raw = json.load(f)
        self.state = GameState(
            year=self.raw["global_state"]["year"],
            month=self.raw["global_state"]["month"],
            countries=deepcopy(self.raw["countries"]),
            global_state=deepcopy(self.raw["global_state"])
        )
        self.event_templates = self._load_event_templates()

    def start_game(self, country_code: str) -> Dict:
        """Initialize game with chosen country."""
        if country_code not in self.state.countries:
            raise ValueError(f"Country {country_code} not found. Available: {list(self.state.countries.keys())}")
        self.state.player_country = country_code
        self.state.turn = 1
        return {
            "message": f"Juego iniciado. Controlas {self.state.countries[country_code]['name']}.",
            "country": self.get_country_summary(country_code),
            "commands": self.get_available_commands()
        }

    def get_country_summary(self, code: str) -> Dict:
        c = self.state.countries[code]
        return {
            "name": c["name"],
            "gdp": c["economy"]["gdp_trillion_usd"],
            "population_m": c["population"]["total_millions"],
            "unemployment": c["economy"]["unemployment"],
            "inflation": c["economy"]["inflation"],
            "debt_gdp": c["economy"]["debt_to_gdp"],
            "happiness": c["population"]["happiness"],
            "stability": c["population"]["stability"],
            "active_soldiers": c["military"]["active_soldiers"],
            "nuclear": c["military"]["nuclear_warheads"],
            "relations_sample": {k: v for k, v in list(c["relations"].items())[:8]}
        }

    def get_available_commands(self) -> List[str]:
        return [
            "status / estado          → Resumen de tu país",
            "economy / economía      → Detalle económico",
            "military / militar      → Fuerzas armadas",
            "relations / relaciones  → Diplomacia",
            "decide [acción]         → Tomar una decisión (ej: decide bajar IVA a 15)",
            "diplomacy [país] [acción] → Acción diplomática",
            "next / siguiente        → Avanzar 1 mes (procesa turnos + eventos)",
            "events                  → Ver eventos activos",
            "help                    → Esta lista"
        ]

    # ============================================================
    # DECISION PROCESSING
    # ============================================================

    def process_decision(self, decision: str) -> Dict:
        """
        Player makes a decision. Returns internal impact + triggers AI reactions.
        Designed so the real heavy lifting of realism is done by the AI prompt layer.
        """
        player = self.state.countries[self.state.player_country]
        impact = {
            "decision": decision,
            "internal_effects": [],
            "deltas": {},
            "warnings": []
        }

        # Simple deterministic rules for common actions (keeps tokens low)
        decision_lower = decision.lower()

        if "iva" in decision_lower or "impuesto" in decision_lower:
            impact = self._handle_tax_change(decision, player, impact)
        elif any(x in decision_lower for x in ["militar", "ejercito", "presupuesto defensa", "soldados"]):
            impact = self._handle_military_change(decision, player, impact)
        elif any(x in decision_lower for x in ["gasto", "inversión", "infraestructura", "salud", "educación"]):
            impact = self._handle_spending(decision, player, impact)
        elif any(x in decision_lower for x in ["sancion", "embargo", "arancel"]):
            impact = self._handle_trade_action(decision, player, impact)
        else:
            # Generic: mark for AI evaluation
            impact["internal_effects"].append("Decisión registrada. Impacto detallado será evaluado por la IA.")
            impact["deltas"]["stability"] = random.uniform(-1, 1)

        # Apply deltas
        self._apply_deltas(player, impact["deltas"])

        # Log
        self.state.history.append({
            "turn": self.state.turn,
            "type": "player_decision",
            "decision": decision,
            "impact": impact
        })

        # Queue AI reactions (other countries react based on their interests)
        self.state.pending_reactions.append({
            "trigger": decision,
            "from_country": self.state.player_country,
            "turn": self.state.turn
        })

        return impact

    def _handle_tax_change(self, decision: str, player: Dict, impact: Dict) -> Dict:
        # Example logic: lower tax → less revenue, more consumption/happiness
        if "bajar" in decision.lower() or "reducir" in decision.lower():
            impact["internal_effects"].append("Baja de impuestos → menor recaudación, sube consumo y felicidad temporal.")
            impact["deltas"] = {
                "fiscal_balance": -1.5,
                "happiness": +3,
                "gdp_growth": +0.3,
                "inflation": +0.4
            }
            impact["warnings"].append("Si el déficit se profundiza, la deuda y la inflación pueden acelerarse.")
        elif "subir" in decision.lower() or "aumentar" in decision.lower():
            impact["internal_effects"].append("Suba de impuestos → más recaudación, baja consumo y felicidad.")
            impact["deltas"] = {
                "fiscal_balance": +1.2,
                "happiness": -4,
                "gdp_growth": -0.4,
                "stability": -1
            }
        return impact

    def _handle_military_change(self, decision: str, player: Dict, impact: Dict) -> Dict:
        if "aumentar" in decision.lower() or "subir" in decision.lower():
            impact["internal_effects"].append("Aumento de gasto militar → más capacidad, más déficit, posible tensión con vecinos.")
            impact["deltas"] = {
                "fiscal_balance": -1.0,
                "stability": +1,
                "happiness": -1
            }
        return impact

    def _handle_spending(self, decision: str, player: Dict, impact: Dict) -> Dict:
        impact["internal_effects"].append("Gasto público adicional → estímulo corto plazo, más déficit.")
        impact["deltas"] = {
            "fiscal_balance": -1.2,
            "happiness": +2,
            "gdp_growth": +0.4
        }
        return impact

    def _handle_trade_action(self, decision: str, player: Dict, impact: Dict) -> Dict:
        impact["internal_effects"].append("Acción comercial/diplomática registrada. Otros países reaccionarán según sus intereses.")
        impact["deltas"] = {"stability": random.uniform(-0.5, 0.5)}
        return impact

    def _apply_deltas(self, country: Dict, deltas: Dict):
        econ = country["economy"]
        pop = country["population"]
        if "fiscal_balance" in deltas:
            econ["fiscal_balance"] = round(econ["fiscal_balance"] + deltas["fiscal_balance"], 2)
        if "happiness" in deltas:
            pop["happiness"] = max(0, min(100, pop["happiness"] + deltas["happiness"]))
        if "stability" in deltas:
            pop["stability"] = max(0, min(100, pop["stability"] + deltas["stability"]))
        if "gdp_growth" in deltas:
            econ["gdp_growth"] = round(econ["gdp_growth"] + deltas["gdp_growth"], 2)
        if "inflation" in deltas:
            econ["inflation"] = round(max(0, econ["inflation"] + deltas["inflation"]), 2)

    # ============================================================
    # TURN ADVANCEMENT + EVENTS
    # ============================================================

    def next_turn(self) -> Dict:
        """Advance one month. Process events, AI reactions, natural drift."""
        self.state.month += 1
        if self.state.month > 12:
            self.state.month = 1
            self.state.year += 1
        self.state.turn += 1

        report = {
            "date": f"{self.state.year}-{self.state.month:02d}",
            "turn": self.state.turn,
            "events": [],
            "reactions": [],
            "status_changes": []
        }

        # 1. Trigger random/pre-defined events
        new_events = self._generate_events()
        report["events"] = new_events
        self.state.active_events.extend(new_events)

        # 2. Natural economic drift (very light)
        self._natural_drift()

        # 3. Clear old minor events
        self.state.active_events = [e for e in self.state.active_events if e.get("duration", 1) > 0]
        for e in self.state.active_events:
            e["duration"] = e.get("duration", 1) - 1

        return report

    def _natural_drift(self):
        """Small monthly changes so the world is not static."""
        for code, c in self.state.countries.items():
            # Slight GDP growth application
            growth = c["economy"]["gdp_growth"] / 100 / 12
            c["economy"]["gdp_trillion_usd"] = round(
                c["economy"]["gdp_trillion_usd"] * (1 + growth), 3
            )
            # Inflation drift toward target-ish
            if c["economy"]["inflation"] > 5:
                c["economy"]["inflation"] = round(c["economy"]["inflation"] * 0.98, 2)
            # Happiness slow mean reversion
            target_h = 60
            c["population"]["happiness"] = round(
                c["population"]["happiness"] * 0.98 + target_h * 0.02, 1
            )

    def _generate_events(self) -> List[Dict]:
        """Mix of world, national and personal events. Not linear."""
        events = []
        # World event chance
        if random.random() < 0.25:
            events.append(random.choice(self.event_templates["world"]))
        # National event for player
        if random.random() < 0.35:
            ev = random.choice(self.event_templates["national"])
            ev = deepcopy(ev)
            ev["target"] = self.state.player_country
            events.append(ev)
        # Personal / leadership event
        if random.random() < 0.15:
            events.append(random.choice(self.event_templates["personal"]))
        return events

    def _load_event_templates(self) -> Dict:
        return {
            "world": [
                {
                    "id": "oil_spike",
                    "type": "world",
                    "title": "Tensión en el Golfo",
                    "description": "Ataques a instalaciones petroleras suben el precio del petróleo un 15%.",
                    "effects": {"oil_price": +12, "global_tension": +5},
                    "duration": 3
                },
                {
                    "id": "pandemic_rumor",
                    "type": "world",
                    "title": "Brote viral en Asia",
                    "description": "Nuevo virus respiratorio genera preocupación en mercados.",
                    "effects": {"global_tension": +3, "gdp_growth_all": -0.2},
                    "duration": 2
                },
                {
                    "id": "tech_breakthrough",
                    "type": "world",
                    "title": "Avance en IA y chips",
                    "description": "Nueva generación de chips cambia el balance tecnológico.",
                    "effects": {"global_tension": +2},
                    "duration": 4
                },
                {
                    "id": "climate_disaster",
                    "type": "world",
                    "title": "Temporada de desastres climáticos",
                    "description": "Huracanes e inundaciones afectan varias regiones.",
                    "effects": {"global_tension": +2},
                    "duration": 2
                },
                {
                    "id": "brics_summit",
                    "type": "world",
                    "title": "Cumbre BRICS+",
                    "description": "Los países BRICS anuncian nuevas iniciativas de desdolarización.",
                    "effects": {"usd_strength": -2, "global_tension": +3},
                    "duration": 2
                }
            ],
            "national": [
                {
                    "id": "strike_wave",
                    "type": "national",
                    "title": "Ola de huelgas",
                    "description": "Sindicatos protestan por poder adquisitivo. Estabilidad y producción afectadas.",
                    "effects": {"stability": -4, "happiness": -3, "gdp_growth": -0.5},
                    "duration": 2
                },
                {
                    "id": "corruption_scandal",
                    "type": "national",
                    "title": "Escándalo de corrupción",
                    "description": "Filtraciones comprometen a altos funcionarios. Caída de confianza.",
                    "effects": {"stability": -6, "happiness": -5},
                    "duration": 3
                },
                {
                    "id": "good_harvest",
                    "type": "national",
                    "title": "Cosecha excepcional",
                    "description": "Buena temporada agrícola mejora ingresos rurales y exportaciones.",
                    "effects": {"happiness": +3, "gdp_growth": +0.4, "fiscal_balance": +0.5},
                    "duration": 2
                },
                {
                    "id": "border_incident",
                    "type": "national",
                    "title": "Incidente fronterizo",
                    "description": "Choque menor con país vecino. Sube tensión bilateral.",
                    "effects": {"stability": -2, "global_tension": +3},
                    "duration": 2
                },
                {
                    "id": "investment_boom",
                    "type": "national",
                    "title": "Oleada de inversión extranjera",
                    "description": "Anuncios de nuevas plantas y proyectos elevan expectativas.",
                    "effects": {"happiness": +2, "gdp_growth": +0.6, "stability": +2},
                    "duration": 3
                }
            ],
            "personal": [
                {
                    "id": "health_scare",
                    "type": "personal",
                    "title": "Problema de salud del líder",
                    "description": "Rumores sobre la salud del jefe de Estado generan incertidumbre política.",
                    "effects": {"stability": -5},
                    "duration": 2
                },
                {
                    "id": "popularity_surge",
                    "type": "personal",
                    "title": "Subida de popularidad",
                    "description": "Un discurso o medida concreta genera apoyo inesperado.",
                    "effects": {"happiness": +4, "stability": +3},
                    "duration": 2
                },
                {
                    "id": "cabinet_crisis",
                    "type": "personal",
                    "title": "Crisis de gabinete",
                    "description": "Renuncias o filtraciones obligan a reorganizar el gobierno.",
                    "effects": {"stability": -4, "happiness": -2},
                    "duration": 2
                }
            ]
        }

    # ============================================================
    # AI PROMPT HELPERS (for the LLM layer)
    # ============================================================

    def build_ai_reaction_prompt(self, decision: str) -> str:
        """
        Generates a compact, high-quality prompt for the LLM to simulate
        realistic reactions from other countries. Key design goals:
        - Defend national interests rationally
        - Avoid stupid/irrational suicide moves
        - Not make the game too easy or repetitive
        - Low token footprint
        """
        player = self.state.countries[self.state.player_country]
        player_name = player["name"]
        summary = self.get_country_summary(self.state.player_country)

        # Sample a few relevant countries for reaction (token saving)
        relevant = []
        for code, c in self.state.countries.items():
            if code == self.state.player_country:
                continue
            rel = c["relations"].get(self.state.player_country, c["relations"].get("default", "neutral"))
            if rel in ["hostil", "tenso", "amistoso"] or random.random() < 0.3:
                relevant.append({
                    "code": code,
                    "name": c["name"],
                    "relation": rel,
                    "priorities": c["traits"]["priorities"],
                    "aggression": c["traits"]["aggression"],
                    "ideology": c["traits"]["ideology"]
                })

        prompt = f"""Eres el motor de IA de un juego de geopolítica realista (estilo Pax Historia).
El jugador controla: {player_name}.
Decisión del jugador este turno: "{decision}"

Estado actual del jugador (resumen):
{json.dumps(summary, ensure_ascii=False)}

Países que deben reaccionar (elige 2-5 relevantes, no todos):
{json.dumps(relevant[:8], ensure_ascii=False)}

REGLAS DE COMPORTAMIENTO DE LA IA (OBLIGATORIAS):
1. Cada país defiende SUS intereses nacionales de forma racional y realista.
2. NO hagas reacciones estúpidas, suicidas o irracionales (salvo Corea del Norte o regímenes muy ideológicos en situaciones extremas).
3. Las reacciones deben variar: a veces fuertes, a veces silenciosas, a veces de espera.
4. Evita repetición: no siempre la misma respuesta a la misma acción.
5. Considera el nivel de relación actual (amistoso/neutral/tenso/hostil) y las prioridades del país.
6. El juego NO debe ser fácil ni predecible. Genera fricción realista.
7. Responde SOLO con un JSON válido de este formato:

{{
  "reactions": [
    {{
      "country": "código o nombre",
      "action": "descripción corta de lo que hace o dice",
      "relation_change": "mejora / empeora / sin_cambio",
      "intensity": 1-5,
      "public_statement": "frase opcional que diría el gobierno"
    }}
  ],
  "internal_extra_effects": ["efectos adicionales realistas sobre el país del jugador si aplica"],
  "narrative": "2-4 oraciones de narración global del turno"
}}
"""
        return prompt

    def build_event_resolution_prompt(self, event: Dict) -> str:
        """Prompt for resolving how an event impacts the player's country specifically."""
        player = self.state.countries[self.state.player_country]
        return f"""Evento activo: {event['title']}
Descripción: {event['description']}
País del jugador: {player['name']}
Traits del país: {player['traits']}

Resuelve de forma realista cómo afecta este evento al país del jugador.
Responde en JSON:
{{
  "impact_summary": "...",
  "deltas": {{"happiness": 0, "stability": 0, "gdp_growth": 0, ...}},
  "player_options": ["opción A", "opción B", "opción C"]  // 2-3 respuestas posibles del jugador
}}
"""

# ============================================================
# SIMPLE CLI FOR TESTING (optional)
# ============================================================

def main():
    engine = GeopoliticsEngine("countries_mvp.json")
    print("=== Pax Historia Style MVP ===")
    print("Países disponibles:", ", ".join(engine.state.countries.keys()))
    country = input("Elige tu país (código, ej: USA, Brazil, Argentina): ").strip()
    start = engine.start_game(country)
    print(start["message"])
    print("Comandos:", start["commands"])

    while True:
        cmd = input(f"\n[{engine.state.year}-{engine.state.month:02d}] > ").strip()
        if not cmd:
            continue
        if cmd in ("quit", "exit", "salir"):
            break
        if cmd in ("status", "estado"):
            print(json.dumps(engine.get_country_summary(engine.state.player_country), indent=2, ensure_ascii=False))
        elif cmd in ("next", "siguiente"):
            report = engine.next_turn()
            print(json.dumps(report, indent=2, ensure_ascii=False))
        elif cmd.startswith("decide "):
            decision = cmd[7:]
            impact = engine.process_decision(decision)
            print("Impacto inmediato:", json.dumps(impact, indent=2, ensure_ascii=False))
            print("\n--- Prompt para IA (reacciones) ---")
            print(engine.build_ai_reaction_prompt(decision)[:1500], "...")
        elif cmd == "help":
            print("\n".join(engine.get_available_commands()))
        else:
            print("Comando no reconocido. Escribe 'help'.")

if __name__ == "__main__":
    main()
