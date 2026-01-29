"""Output module voor rapportage in diverse formaten."""

from .terminal import TerminalOutput
from .excel import ExcelExport
from .html import HtmlRapport

__all__ = ["TerminalOutput", "ExcelExport", "HtmlRapport"]
