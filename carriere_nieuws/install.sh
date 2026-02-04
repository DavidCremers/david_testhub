#!/bin/bash
# =============================================================================
# Aedes Carrière Nieuws Monitor - Installatie Script
# =============================================================================
# Dit script installeert de monitor als systemd service zodat deze
# automatisch draait en email alerts stuurt bij nieuw carrière nieuws.
# =============================================================================

set -e

# Kleuren voor output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     Aedes Carrière Nieuws Monitor - Installatie              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check of we root zijn of sudo kunnen gebruiken
if [[ $EUID -ne 0 ]]; then
    SUDO="sudo"
    echo -e "${YELLOW}Let op: Dit script heeft sudo rechten nodig voor systemd installatie${NC}"
else
    SUDO=""
fi

# Bepaal script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Huidige gebruiker
CURRENT_USER="${SUDO_USER:-$USER}"
CONFIG_DIR="/home/$CURRENT_USER/.carriere_nieuws"
CONFIG_FILE="$CONFIG_DIR/config.yaml"

echo -e "${BLUE}[1/6]${NC} Python dependencies installeren..."
cd "$PROJECT_DIR"
pip install -e . --quiet
echo -e "${GREEN}✓ Dependencies geïnstalleerd${NC}"

echo -e "${BLUE}[2/6]${NC} Configuratie directory aanmaken..."
mkdir -p "$CONFIG_DIR"
chown "$CURRENT_USER:$CURRENT_USER" "$CONFIG_DIR" 2>/dev/null || true
echo -e "${GREEN}✓ Config directory: $CONFIG_DIR${NC}"

# Check of config al bestaat
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo -e "${BLUE}[3/6]${NC} Voorbeeld configuratie aanmaken..."
    python3 -m carriere_nieuws.cli init --config "$CONFIG_FILE"
    chown "$CURRENT_USER:$CURRENT_USER" "$CONFIG_FILE" 2>/dev/null || true
    echo -e "${YELLOW}⚠ BELANGRIJK: Pas de configuratie aan in: $CONFIG_FILE${NC}"
    NEEDS_CONFIG=true
else
    echo -e "${BLUE}[3/6]${NC} Configuratie bestaat al"
    echo -e "${GREEN}✓ Bestaande config: $CONFIG_FILE${NC}"
    NEEDS_CONFIG=false
fi

echo -e "${BLUE}[4/6]${NC} Systemd service bestanden installeren..."

# Maak service file met correcte paden
PYTHON_PATH=$(which python3)
cat > /tmp/carriere-nieuws.service << EOF
[Unit]
Description=Aedes Carrière Nieuws Monitor
Documentation=https://github.com/finance-ideas/mjob-analyse
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$CURRENT_USER
Group=$CURRENT_USER
WorkingDirectory=$PROJECT_DIR
ExecStart=$PYTHON_PATH -m carriere_nieuws.cli watch
Restart=always
RestartSec=60
StandardOutput=journal
StandardError=journal
SyslogIdentifier=carriere-nieuws

[Install]
WantedBy=multi-user.target
EOF

$SUDO cp /tmp/carriere-nieuws.service /etc/systemd/system/
$SUDO chmod 644 /etc/systemd/system/carriere-nieuws.service
echo -e "${GREEN}✓ Service geïnstalleerd${NC}"

echo -e "${BLUE}[5/6]${NC} Systemd daemon herladen..."
$SUDO systemctl daemon-reload
echo -e "${GREEN}✓ Daemon herladen${NC}"

echo -e "${BLUE}[6/6]${NC} Service inschakelen..."
$SUDO systemctl enable carriere-nieuws.service
echo -e "${GREEN}✓ Service ingeschakeld (start automatisch bij boot)${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    Installatie Voltooid!                       ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [[ "$NEEDS_CONFIG" == true ]]; then
    echo -e "${YELLOW}VOLGENDE STAPPEN:${NC}"
    echo ""
    echo -e "1. ${BLUE}Configureer je email instellingen:${NC}"
    echo "   nano $CONFIG_FILE"
    echo ""
    echo "   Vul in:"
    echo "   - SMTP server (bijv. smtp.gmail.com)"
    echo "   - Je email en app-wachtwoord"
    echo "   - Ontvangers email adressen"
    echo ""
    echo -e "2. ${BLUE}Test de configuratie:${NC}"
    echo "   carriere-nieuws test-email"
    echo ""
    echo -e "3. ${BLUE}Start de service:${NC}"
    echo "   sudo systemctl start carriere-nieuws"
    echo ""
else
    echo -e "${BLUE}De service kan nu gestart worden:${NC}"
    echo "   sudo systemctl start carriere-nieuws"
    echo ""
fi

echo -e "${BLUE}Handige commando's:${NC}"
echo "   sudo systemctl status carriere-nieuws  # Status bekijken"
echo "   sudo systemctl stop carriere-nieuws    # Stoppen"
echo "   sudo systemctl restart carriere-nieuws # Herstarten"
echo "   sudo journalctl -u carriere-nieuws -f  # Logs bekijken"
echo ""
echo -e "${BLUE}Handmatig nieuws checken:${NC}"
echo "   carriere-nieuws check"
echo ""
