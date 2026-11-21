import os
import tempfile
from unittest.mock import patch

from django.test import SimpleTestCase

from myapp.verification import contradiction, structural, temporal

BPMN = """<definitions>
<process id="P">
<startEvent id="Event_start" />
<task id="Activity_1" name="Approve the request" />
<task id="Activity_2" name="Reject the request" />
<endEvent id="Event_end" />
<sequenceFlow id="F1" sourceRef="Event_start" targetRef="Activity_1" />
<sequenceFlow id="F2" sourceRef="Activity_1" targetRef="Activity_2" />
<sequenceFlow id="F3" sourceRef="Activity_2" targetRef="Event_end" />
</process>
</definitions>
"""


def write_bpmn(folder, text=BPMN):
    path = os.path.join(folder, 'p.bpmn')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    return path


class SearchTests(SimpleTestCase):
    def test_dfs_results_do_not_pile_up_between_calls(self):
        graph = {'Event_start': ['Activity_1'], 'Activity_1': ['Activity_2'],
                 'Activity_2': ['Event_end']}
        with tempfile.TemporaryDirectory() as tmp:
            path = write_bpmn(tmp)
            first = structural.dfs(path, graph, 'Event_start', 'Event_end')
            second = structural.dfs(path, graph, 'Event_start', 'Event_end')
        self.assertEqual(len(first), 1)
        self.assertEqual(len(second), 1)

    def test_get_task_returns_empty_string_when_there_is_no_name(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = write_bpmn(tmp, '<task id="T1" />\n<startEvent id="E1" />\n')
            self.assertEqual(structural.get_task(path, 'T1'), '')
            self.assertEqual(structural.get_task(path, 'E1'), '')
            self.assertEqual(structural.get_task(path, 'missing'), '')


class ContradictionTests(SimpleTestCase):
    def test_c2_reports_a_contradiction_instead_of_crashing(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = write_bpmn(tmp)
            # The language model is not what is tested here: force "contradiction".
            with patch.object(contradiction, 'detect_contradiction', return_value=True):
                french, english = contradiction.detect_C2(path)
        self.assertEqual(len(french), 1)
        self.assertEqual(len(english), 1)
        self.assertIn('Approve the request / Reject the request', french[0])

    def test_empty_labels_never_contradict(self):
        self.assertFalse(contradiction.detect_contradiction('', 'Approve the request'))
        self.assertFalse(contradiction.detect_contradiction(None, None))


class TemporalTests(SimpleTestCase):
    def test_verb_dictionary_is_consistent(self):
        relations = temporal.temporal_relations
        self.assertIn('review', relations['complete'])   # the first "complete" entry is kept
        self.assertIn('publish', relations['fill'])
        for verb, followers in relations.items():
            for follower in followers:
                self.assertEqual(follower, follower.lower(), f'{verb}: {follower}')

    def test_missing_text_gives_no_answer(self):
        self.assertIsNone(temporal.happens_before('', 'Send the report'))