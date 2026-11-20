from django.test import SimpleTestCase
from myapp.verification.results import parse_messages


class ParseMessagesTests(SimpleTestCase):
    def test_structural_error(self):
        [e] = parse_messages(["Erreur S 1# (Deterministic deadlock)#problem in either // or : ['Art 5']#Revise : ['Art 5']"])
        self.assertEqual((e['family'], e['code']), ('S', 'S 1'))
        self.assertEqual(e['type'], 'Deterministic deadlock')
        self.assertEqual(e['legal'], 'problem in either // or : Art 5')
        self.assertEqual(e['recommendation'], 'Revise : Art 5')

    def test_lowercase_french_missing_info_and_empty_list(self):
        [e] = parse_messages(["erreur MI1# il manque le cas de superieur# voire l'article []"])
        self.assertEqual((e['family'], e['code']), ('MI', 'MI 1'))
        self.assertEqual(e['legal'], "voire l'article")

    def test_message_without_separator_is_missing_information(self):
        [e] = parse_messages(["missing information : interval manquant"])
        self.assertEqual(e['family'], 'MI')