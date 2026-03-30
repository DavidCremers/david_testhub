"""Standaard parameters voor de Nederlandse woningmarkt (2026)."""

# --- Hypotheek ---
NHG_GRENS = 450_000  # Nationale Hypotheek Garantie grens 2026
NHG_PROVISIE_PCT = 0.006  # 0,6% borgtochtprovisie
MAX_HYPOTHEEK_PCT_WONINGWAARDE = 1.00  # 100% van woningwaarde

# --- Overdrachtsbelasting ---
OVERDRACHTSBELASTING_PCT = 0.02  # 2% standaard
OVERDRACHTSBELASTING_BELEGGER_PCT = 0.106  # 10,4% voor beleggers
STARTER_VRIJSTELLING = True
STARTER_VRIJSTELLING_GRENS = 510_000  # max woningwaarde voor startersvrijstelling
STARTER_MAX_LEEFTIJD = 35  # t/m 35 jaar

# --- Belasting Box 1 ---
BOX1_TARIEF_LAAG = 0.3697  # t/m schijfgrens
BOX1_TARIEF_HOOG = 0.4950  # boven schijfgrens
BOX1_SCHIJFGRENS = 75_518  # grens laag/hoog tarief 2026

# --- Eigenwoningforfait ---
EWF_PCT = 0.0035  # 0,35% van WOZ-waarde
EWF_HOOG_GRENS = 1_310_000  # grens voor hoger forfait
EWF_HOOG_PCT = 0.0235  # 2,35% boven de grens

# --- Kosten ---
NOTARIS_LEVERINGSAKTE_MIN = 600
NOTARIS_LEVERINGSAKTE_MAX = 1_200
NOTARIS_HYPOTHEEKAKTE_MIN = 700
NOTARIS_HYPOTHEEKAKTE_MAX = 1_400
TAXATIEKOSTEN_MIN = 500
TAXATIEKOSTEN_MAX = 900
BANKGARANTIE_KOSTEN = 750
BOUWKUNDIG_RAPPORT_KOSTEN = 450
ADVIESKOSTEN_HYPOTHEEK = 2_500
MAKELAARSKOSTEN_PCT = 0.01  # 1% aankoopmakelaar

# --- Maximale hypotheek (vereenvoudigd) ---
# Woonquote percentages (vereenvoudigd, afhankelijk van inkomen en rente)
# Dit is een grove benadering; echte berekening via NIBUD-normen
WOONQUOTE_BASIS = 0.28  # ~28% van bruto inkomen als basis
WOONQUOTE_CORRECTIE_PER_10K = 0.005  # iets hoger bij hoger inkomen

# --- Studieschuld ---
STUDIESCHULD_WEEGFACTOR = 0.0045  # 0,45% van oorspronkelijke schuld per maand

# --- Energielabel waardefactoren ---
# Geschatte waarde-impact t.o.v. label C als referentie
ENERGIELABEL_FACTOREN = {
    "A++++": 1.08,
    "A+++": 1.07,
    "A++": 1.06,
    "A+": 1.05,
    "A": 1.04,
    "B": 1.02,
    "C": 1.00,
    "D": 0.98,
    "E": 0.95,
    "F": 0.92,
    "G": 0.88,
}

# --- Overbieden gemiddelden (landelijk, grove indicatie) ---
# Percentage boven vraagprijs
OVERBIEDEN_DEFAULTS = {
    "amsterdam": 6.0,
    "rotterdam": 4.0,
    "den haag": 3.5,
    "utrecht": 7.0,
    "eindhoven": 4.5,
    "groningen": 3.0,
    "tilburg": 3.5,
    "almere": 3.0,
    "breda": 3.5,
    "nijmegen": 4.0,
    "haarlem": 6.5,
    "arnhem": 3.5,
    "leiden": 5.5,
    "amersfoort": 5.0,
    "delft": 5.0,
    "default": 3.0,
}

# --- Gemiddelde m2-prijs per stad (grove indicatie, EUR/m2) ---
GEM_M2_PRIJS = {
    "amsterdam": 7_200,
    "rotterdam": 4_200,
    "den haag": 4_500,
    "utrecht": 5_800,
    "eindhoven": 4_000,
    "groningen": 3_500,
    "tilburg": 3_400,
    "almere": 3_600,
    "breda": 3_800,
    "nijmegen": 3_900,
    "haarlem": 6_000,
    "arnhem": 3_600,
    "leiden": 5_200,
    "amersfoort": 4_800,
    "delft": 4_900,
    "default": 3_500,
}
