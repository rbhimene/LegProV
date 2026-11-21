# LegProV: Legal Process Verification

Tool that verifies BPMN models of public administrative processes. It detects
**missing information (MI)**, **structural errors (S)** and **contradictions (C)**,
links each error to the legal text that describes the process, highlights the
faulty elements in the diagram, and generates a verification report (.docx) in
French and in English.

Stack: Django + Django REST Framework (backend), React + Tailwind (frontend),
SQLite (database), spaCy / NLTK (language analysis).

## Requirements

- Python 3.11 or 3.12
- Node.js (LTS version) and npm
- Git

---

## 1. First installation (done ONCE)

### Backend

Open a terminal in the project folder:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```bash
venv\Scripts\activate           # Windows
source venv/bin/activate        # Linux / macOS
```

Then install everything:

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm       # only if the model is missing after the line above
python -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"
copy .env.example .env                        # Windows   (Linux/macOS: cp .env.example .env)
python manage.py migrate                      # creates the database (db.sqlite3)
```

The `.env` file holds the settings. The default values work as they are for local use.

### Frontend

```bash
cd frontend
npm install
```

---

## 2. Run the application (EVERY TIME)

You need **two terminals**, both left open.

**Terminal 1: backend**

```bash
cd backend
venv\Scripts\activate           # Linux/macOS: source venv/bin/activate
python manage.py runserver
```

**Terminal 2: frontend**

```bash
cd frontend
npm start
```

Open **http://localhost:3000**.

## 3. First use

1. Click **Sign up** and create an account, then sign in.
2. Create a **project**, open it and **add a diagram** (a `.bpmn` file; examples are in `backend/tests/samples/`).
3. Open the diagram and click **Run verification**.
4. Read the errors in the side panel, click the coloured chips to locate them in the diagram, and download the report (FR or EN).

The three example processes on the home page are available without an account.

## 4. Administrator account

An administrator can list, create, deactivate and delete users (the **Users** menu).
Normal users cannot see it. A new sign-up is never an administrator.

**Create the first administrator** (once, from `backend/` with the virtual environment active):

```bash
python manage.py createsuperuser
```

Answer the questions (email, first name, last name, password). The same account can
also open the Django admin site at http://127.0.0.1:8000/admin/.

**Make an existing user an administrator:**

```bash
python manage.py shell -c "from myapp.models import User; User.objects.filter(email='someone@example.com').update(is_staff=True, is_superuser=True)"
```

**Forgot a password** (from `backend/`):

```bash
python manage.py changepassword someone@example.com
```

## 5. Settings (`backend/.env`)

| Variable | Meaning |
|---|---|
| `SECRET_KEY`, `SIGNING_KEY` | Secret keys. **Change them for any real deployment.** |
| `DEBUG` | `True` for local work, `False` in production |
| `ALLOWED_HOSTS` | Allowed domain names, separated by commas |
| `REQUIRE_EMAIL_ACTIVATION` | `False` (default): accounts work immediately. `True`: users must click an activation link sent by email |
| `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_PORT` | SMTP server, only needed to send real emails. Without them, emails are printed in the backend terminal |

To point the frontend to another server, create `frontend/.env.local` containing
`REACT_APP_API_BASE_URL=https://your-server`, then restart `npm start`.

## 6. Tests

From `backend/`:

```bash
python manage.py test myapp       # API, security and unit tests
python baseline.py check          # the 3 reference diagrams must give the same results
```

`baseline.py` protects the thesis results: after any change in the verification code,
`check` must print `OK` for each file. If a change is intentional, review the printed
differences, then run `python baseline.py record` to accept them.

## 7. Where is the code?

| Thesis part | File (`backend/myapp/`) |
|---|---|
| Missing information (MI) | `verification/missing_info.py` |
| Structural errors (S) + legal text lookup | `verification/structural.py` |
| Contradictions (C1 to C4) | `verification/contradiction.py` |
| Order of tasks by their verbs (C4) | `verification/temporal.py` (dictionary of verbs) |
| Word reports (FR/EN) | `verification/reports.py` (all sentences are in one dictionary) |
| Error messages as data | `verification/results.py` |
| Shared XML helpers and colours | `verification/bpmn_utils.py` |
| API (projects, diagrams, verification) | `views.py`, `urls.py`, `serializers.py`, `models.py` |
| Legal text used for the lookup | `backend/media/loi.txt` |

Frontend: `frontend/src/components/` (pages), `frontend/src/i18n/locales/` (all texts, EN and FR).

## Notes

- The contradiction check C4 uses `googletrans`, an online service. Offline, the
  check still runs but may find fewer ordering contradictions.
- Uploaded files are stored in `backend/media/user_*/` and are not part of the repository.
- Each file of the verification code starts with a docstring explaining what it detects.