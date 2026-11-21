"""
reports.py - verification report (.docx), in French or English.

generate_report(messages, path, source_name, lang) takes the messages returned by
the detectors (see results.py for their format), groups them in three tables
(missing information, structural errors, contradictions) and writes the Word file.

All the sentences of the report are in TEXTS below. To change a sentence or add a
language, edit only that dictionary.
"""
import logging
import os

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

from .results import parse_messages

logger = logging.getLogger(__name__)

# The "legal" dictionaries map the error type (lowercase) to the sentence that
# explains it. '*' is used when the type has no dedicated sentence.
TEXTS = {
    'fr': {
        'title': 'Rapport de vérification du processus {name}',
        'intro': (
            "Ce document est un rapport sur la vérification des processus. Il présente les résultats "
            "de la vérification concernant trois types d'erreurs : les erreurs dues à des informations "
            "manquantes, les erreurs structurelles et les erreurs de contradiction. Chaque type d'erreur "
            "est illustré par un tableau contenant l'erreur et son type, la loi associée à cette erreur "
            "et la recommandation correspondante."
        ),
        'none': "Aucune erreur détectée : ce modèle de processus passe toutes les vérifications.",
        'error': 'Erreur',
        'headers': ['Erreur', "Type d'erreur", 'Interprétation légale', 'Recommandation'],
        'headings': {
            'MI': 'Erreurs dues à des informations manquantes',
            'S': 'Erreurs structurelles',
            'C': 'Erreurs dues à des contradictions',
        },
        'legal': {
            'MI': {
                'condition manquante': "Cela se produit lorsque la condition n’est mentionnée dans aucun des textes légaux. C'est le problème de l'incomplétude juridique. Précisément l’absence de condition.",
                'role manquant': "Cela se produit lorsque le rôle/l’unité organisationnelle n’est mentionné dans aucun des textes juridiques. C'est le problème de l'incomplétude juridique. Justement l’absence de rôle.",
                'vide juridique': "Cela se produit lors d'un manque d'informations.",
            },
            'S': {
                'deterministic deadlock': "En effet, l’utilisation de « soit… soit » dans « établir soit un rapport d’inventaire, soit préparer la lettre de convocation » implique l’exécution de l’un d’entre eux et non des deux. Même ainsi, l’étape suivante nécessitait les résultats des deux « envoyer le rapport et la lettre de convocation ». La déclaration est donc ambiguë. Cela se produit lorsqu’il existe une ambiguïté associée à l’utilisation de « et » et de « ou ».",
                'deterministic lack of synchronization': "En fait, l'utilisation du « ou » dans la déclaration prête à confusion, dans la mesure où il n'est pas clair s'il s'agit d'un « ou exclusif » ou d'un « ou inclusif ». S'il est considéré comme un « ou inclusif », il sera représenté comme une passerelle inclusive, ce qui ne pose pas de problème. Au contraire, s'il est considéré comme un « ou » exclusif, il sera représenté par une passerelle exclusive. Cela conduira à une situation de manque de synchronisation.",
                'nondeterministic lack of synchronization': "En fait, l'utilisation du « ou » dans la déclaration prête à confusion, dans la mesure où il n'est pas clair s'il s'agit d'un « ou exclusif » ou d'un « ou inclusif ». Le problème réside dans le fait que le premier 'ou' est considéré comme un 'ou' inclusif, donc il est représenté comme une passerelle inclusive, cependant, le deuxième 'ou' est considéré comme un 'ou' exclusif, donc il est représenté comme passerelle exclusive. Cela conduira à une situation de manque de synchronisation non déterministe.",
                'nondeterministic deadlock': "La déclaration est ambiguë. Cela se produit lorsqu’il existe une ambiguïté associée à l’utilisation de « et » et de « ou ».",
            },
            'C': {
                '*': "Une contradiction entre textes légaux survient lorsqu'il n'y a pas de cohérence entre eux : une déclaration d'un texte contredit totalement ou partiellement une déclaration d'un autre texte. Deux formes sont considérées : la négation et l'antonymie.",
            },
        },
    },
    'en': {
        'title': 'Process Verification Report {name}',
        'intro': (
            "This document is a process audit report. It presents the verification results for three "
            "types of errors: errors due to missing information, structural errors and contradiction "
            "errors. Each type of error is illustrated by a table containing the error and its type, "
            "the law associated with this error and the corresponding recommendation."
        ),
        'none': "No error found: this process model passes all the checks.",
        'error': 'Error',
        'headers': ['Error', 'Error type', 'Legal interpretation', 'Recommendation'],
        'headings': {
            'MI': 'Errors due to missing information',
            'S': 'Structural errors',
            'C': 'Errors due to contradictions',
        },
        'legal': {
            'MI': {
                'missing condition': "This happens when the condition is not mentioned in any of the legal texts. This is the problem of legal incompleteness. Precisely the absence of conditions.",
                'missing role': "This happens when the role/organizational unit is not mentioned in any of the legal texts. This is the problem of legal incompleteness. Precisely the absence of a role.",
                'legal vacuum': "This happens when there is a lack of information.",
            },
            'S': {
                'deterministic deadlock': "Indeed, the use of “either…or” in “establish either an inventory report or prepare the letter of invitation” implies the execution of one of them and not both. Even so, the next step required the results of both “send report and summons letter”. The statement is therefore ambiguous. This occurs when there is ambiguity associated with the use of 'and' and 'or'.",
                'deterministic lack of synchronization': "In fact, the use of 'or' in the statement is confusing, as it is not clear whether it is an 'exclusive or' or an 'inclusive or'. If it is considered an 'inclusive or', it will be represented as an inclusive gateway, which is not a problem. On the contrary, if it is considered an exclusive 'or', it will be represented by an exclusive gateway. This will lead to a situation of lack of synchronization.",
                'nondeterministic lack of synchronization': "In fact, the use of 'or' in the statement is confusing, as it is not clear whether it is an 'exclusive or' or an 'inclusive or'. The problem lies in the fact that the first 'or' is considered an inclusive 'or', so it is represented as an inclusive gateway, however, the second 'or' is considered an exclusive 'or', therefore it is represented as an exclusive gateway. This will lead to a non-deterministic lack of synchronization situation.",
                'nondeterministic deadlock': "The statement is ambiguous. This occurs when there is ambiguity associated with the use of 'and' and 'or'.",
            },
            'C': {
                '*': "Contradiction between legal texts occurs when there is no consistency between them. Thus, a statement in one text totally or partially contradicts a statement in another text. Two forms are considered: the negation and antonymy.",
            },
        },
    },
}

# In structural errors, this phrase is shown in red in the "legal interpretation" cell.
HIGHLIGHT = ['and // or']


def _color_red_in_text(paragraph, words_to_color):
    """Show the given words in red inside a paragraph."""
    for run in paragraph.runs:
        text = run.text
        for word in words_to_color:
            if word in text:
                parts = text.split(word)
                run.text = parts[0]
                for part in parts[1:]:
                    colored = paragraph.add_run(word)
                    colored.font.color.rgb = RGBColor(255, 0, 0)
                    paragraph.add_run(part)


def _set_table_border(table):
    """Thin black borders on every cell."""
    tbl_pr = table._element.xpath('./w:tblPr')[0]
    borders = OxmlElement('w:tblBorders')
    for side in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        border = OxmlElement(f'w:{side}')
        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), '4')
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), '000000')
        borders.append(border)
    tbl_pr.append(borders)


def _add_table(document, headers, rows, highlight=None):
    """Table with a bold header row. `highlight`: words to show in red in the 3rd column."""
    table = document.add_table(rows=1, cols=len(headers))
    for cell, text in zip(table.rows[0].cells, headers):
        cell.text = text
        for run in cell.paragraphs[0].runs:
            run.bold = True
    for row in rows:
        cells = table.add_row().cells
        for cell, text in zip(cells, row):
            cell.text = text
        cells[0].width = Cm(2)
        if highlight:
            _color_red_in_text(cells[2].paragraphs[0], highlight)
    _set_table_border(table)
    return table


def _legal_text(texts, error):
    """Explanation of the error type, followed by the legal text found for this error."""
    table = texts['legal'].get(error['family'], {})
    explanation = table.get(error['type'].lower(), table.get('*', ''))
    return f"{explanation} {error['legal']}".strip()


def generate_report(messages, path, source_name, lang='fr'):
    """
    Write the verification report.

    messages    : messages returned by the detectors (French list for lang='fr',
                  English list for lang='en')
    path        : where to save the .docx
    source_name : name of the verified file (used in the title)
    lang        : 'fr' or 'en'
    """
    texts = TEXTS[lang]
    name = os.path.splitext(os.path.basename(source_name))[0]
    errors = parse_messages(messages)

    document = Document()
    document.styles['Normal'].font.name = 'Calibri'
    title_style = document.styles.add_style('CenteredTitle', WD_STYLE_TYPE.PARAGRAPH)
    title_style.font.size = Pt(24)
    title_style.font.bold = True
    title_style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER

    document.add_paragraph(texts['title'].format(name=name), style='CenteredTitle')
    document.add_paragraph(texts['intro'])

    if not errors:
        document.add_paragraph(texts['none'])

    for family in ('MI', 'S', 'C'):
        family_errors = [e for e in errors if e['family'] == family]
        if not family_errors:
            continue
        document.add_heading(texts['headings'][family], level=1)
        rows = [
            [f"{texts['error']} {e['code']}", e['type'], _legal_text(texts, e), e['recommendation']]
            for e in family_errors
        ]
        _add_table(document, texts['headers'], rows, HIGHLIGHT if family == 'S' else None)

    document.add_page_break()
    document.save(path)
    logger.info("Report saved at: %s", path)