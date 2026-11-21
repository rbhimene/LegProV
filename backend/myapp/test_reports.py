import os
import tempfile

from django.test import SimpleTestCase
from docx import Document

from myapp.verification.reports import generate_report

FR = [
    "Erreur S 1# (Deterministic deadlock)#probleme dans and // or dans l'article : ['Art 5']#Reviser : ['Art 5']",
    "erreur MI1# il manque le cas de superieur# voire l'article []",          # lowercase, as the detector writes it
    "Erreur C 1#contradiction entre a b#Contradiction dans l'article : x#Reviser x",
]
EN = [
    "Error S 1# (Deterministic deadlock)#problem in and // or : ['Art 5']#Revise : ['Art 5']",
    "Error MI 1# Missing condition #Condition not specified in the article : ['Art 2']#Revise it",
    "Error C 1#contradiction between a b#Contradiction in the article : x#Revise x",
]


def build(messages, lang):
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, 'report.docx')
        generate_report(messages, path, 'proc.bpmn', lang)
        return Document(path)


def headings(doc):
    return [p.text for p in doc.paragraphs if p.style.name.startswith('Heading')]


class ReportTests(SimpleTestCase):
    def test_french_report_has_three_tables_and_french_headings(self):
        doc = build(FR, 'fr')
        self.assertEqual(len(doc.tables), 3)
        self.assertEqual(headings(doc), [
            'Erreurs dues à des informations manquantes',
            'Erreurs structurelles',
            'Erreurs dues à des contradictions'])

    def test_lowercase_missing_information_goes_in_the_first_table(self):
        doc = build(FR, 'fr')
        self.assertEqual(doc.tables[0].rows[1].cells[0].text, 'Erreur MI 1')

    def test_english_report_is_fully_english(self):
        doc = build(EN, 'en')
        self.assertEqual(headings(doc), [
            'Errors due to missing information', 'Structural errors', 'Errors due to contradictions'])
        self.assertIn('Contradiction between legal texts', doc.tables[2].rows[1].cells[2].text)

    def test_python_list_syntax_is_cleaned(self):
        doc = build(FR, 'fr')
        self.assertNotIn("['", doc.tables[1].rows[1].cells[2].text)

    def test_no_errors_gives_a_message_and_no_table(self):
        doc = build([], 'en')
        self.assertEqual(len(doc.tables), 0)
        self.assertIn('No error found', ' '.join(p.text for p in doc.paragraphs))