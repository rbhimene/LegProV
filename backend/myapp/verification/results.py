"""
results.py - turn the "#"-separated messages of the detectors into structured data.

The detectors return strings like
    "Erreur S 1# (Deterministic deadlock)#<legal interpretation>#<recommendation>"
The API sends the same information as dictionaries, in French and in English:
    {"code": "S 1", "family": "S", "type": "Deterministic deadlock",
     "legal": "...", "recommendation": "..."}

The French and English lists are NOT guaranteed to have the same length or order
(a few French-only messages exist), so they are parsed separately.
"""
import re

HEAD_RE = re.compile(r'(?:erreur|error)\s*(MI|S|C)\s*(\d+)', re.IGNORECASE)


def _tidy(text):
    """Remove the Python list syntax (['a', 'b'], [], '') from a message."""
    text = re.sub(r"\[\s*\]", "", text)
    text = re.sub(r",\s*(?:''|\"\")", "", text)
    text = re.sub(r"(?:''|\"\")\s*,\s*", "", text)
    text = re.sub(r"\[\s*[\"']", "", text)
    text = re.sub(r"[\"']\s*\]", "", text)
    text = re.sub(r"[\"']\s*,\s*[\"']", "; ", text)
    return re.sub(r"\s+", " ", text).strip()


def parse_messages(messages):
    """List of message strings -> list of dictionaries (see module docstring)."""
    errors = []
    for raw in messages:
        parts = [p.strip() for p in str(raw).split('#')]
        match = HEAD_RE.search(parts[0])
        if match:
            family, code = match.group(1).upper(), f"{match.group(1).upper()} {match.group(2)}"
            kind, details = (parts[1] if len(parts) > 1 else ''), parts[2:]
        else:
            # Only the "missing interval" check produces messages without "#".
            family, code, kind, details = 'MI', 'MI', parts[0], []
        kind = re.sub(r'^\((.*)\)$', r'\1', kind)
        details = [_tidy(d) for d in details if d]
        errors.append({
            'code': code,
            'family': family,
            'type': _tidy(kind),
            'legal': details[0] if details else '',
            'recommendation': ' '.join(details[1:]),
        })
    return errors


def build_payload(messages_fr, messages_en, filename, report_url, report_url_en, verified_at):
    """What the verify endpoints return (and what is stored in Diagram.last_result)."""
    return {
        'filename': filename,
        'report_url': report_url,
        'report_url_en': report_url_en,
        'verified_at': verified_at.isoformat(),
        'annotations': messages_fr,          # flat French list, kept for compatibility
        'errors_fr': parse_messages(messages_fr),
        'errors_en': parse_messages(messages_en),
    }