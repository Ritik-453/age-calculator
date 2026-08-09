# AGE — an instrument for measuring time

A Flask age calculator, deployable to Vercel.

## Project layout

```
api/index.py        Flask app (Vercel serverless entry point)
templates/index.html
static/css/style.css
static/js/main.js
requirements.txt
vercel.json          routes every request to api/index.py
```

## Run locally

```bash
pip install -r requirements.txt
python api/index.py
# open http://127.0.0.1:5000
```

## Deploy: GitHub → Vercel

1. Push this folder to a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new) and import that GitHub repository.
3. Vercel auto-detects `vercel.json` and the Python runtime — no build command or
   output directory needs to be set. Click **Deploy**.
4. Every push to `main` will auto-redeploy. Pull requests get their own preview URL.

No environment variables are required.
