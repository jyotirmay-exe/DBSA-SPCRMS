# SPCRMS — Setup & Run

## Prerequisites
- Python 3.12 (via pyenv — see below)
- Node.js 18+
- Supabase account (free tier)

---

## One-Time Setup

### 1. Python 3.12 via pyenv

```bash
brew install pyenv
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc
source ~/.zshrc
pyenv install 3.12.4
```

### 2. Supabase — Database

1. Go to [supabase.com](https://supabase.com) → sign up → **New project**
2. Wait ~1 min for project to spin up
3. Left sidebar → **SQL Editor** → **New query** → paste all of `db/schema.sql` → **Run**
4. **New query** → paste all of `db/views.sql` → **Run**
5. **New query** → paste all of `db/seed.sql` → **Run**
5. Left sidebar → **Project Settings** → **Database** → scroll to **Connection string** → click **URI** tab → copy the string (looks like `postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres`)

### 3. Backend

```bash
cd backend
pyenv local 3.12.4
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:
```
DB_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
SECRET_KEY=<run: python3 -c "import secrets; print(secrets.token_hex(32))">
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 4. Frontend

```bash
cd frontend
npm install
```

---

## Every Time — Run

From repo root:
```bash
./run.sh
```

Opens two Terminal windows:
- Backend → http://localhost:8000 (Swagger UI at /docs)
- Frontend → http://localhost:5173

---

## Seed Credentials

All accounts use password: `Test@1234`

| Role | Email |
|------|-------|
| Admin | admin@hospital.com |
| Doctor (General Medicine) | ananya.rao@hospital.com |
| Doctor (Cardiology) | vikram.nair@hospital.com |
| Doctor (Endocrinology) | meena.kulkarni@hospital.com |
| Lab Technician | suresh.babu@hospital.com |
| Patient | arjun.mehta@example.com |

---

## End-to-End Smoke Test

1. Login as `admin@hospital.com` → create/view patients
2. Login as `ananya.rao@hospital.com` (Doctor) → view appointments, add diagnosis
3. Login as `suresh.babu@hospital.com` (Lab Tech) → view pending investigations, enter result
4. Login as `arjun.mehta@example.com` (Patient) → view own records, notifications
