import os
from flask import Flask, render_template, request, jsonify
from datetime import date, datetime, time
from calendar import monthrange, isleap

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static"),
    static_url_path="/static",
)

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

SYNODIC_MONTH_DAYS = 29.530588853  # average full-moon-to-full-moon cycle
MARS_YEAR_DAYS = 686.9713          # length of a Mars year, in Earth days


def generation_of(year):
    if year >= 2013:
        return "Generation Alpha"
    if year >= 1997:
        return "Generation Z"
    if year >= 1981:
        return "Millennial"
    if year >= 1965:
        return "Generation X"
    if year >= 1946:
        return "Baby Boomer"
    return "Silent Generation"


def calculate_age(dob, tob, time_known):
    """dob: date, tob: time (defaults to midnight if not known)."""
    now = datetime.now()
    birth_dt = datetime.combine(dob, tob)

    years = now.year - dob.year
    months = now.month - dob.month
    days = now.day - dob.day

    # Borrow a day if the exact time-of-day hasn't come round yet today.
    if (now.hour, now.minute, now.second) < (tob.hour, tob.minute, tob.second):
        days -= 1

    if days < 0:
        months -= 1
        prev_month = now.month - 1 or 12
        prev_year = now.year if now.month != 1 else now.year - 1
        days += monthrange(prev_year, prev_month)[1]
    if months < 0:
        months += 12
        years -= 1

    total_seconds = int((now - birth_dt).total_seconds())
    total_days = total_seconds // 86400
    decimal_years = total_seconds / (365.2425 * 86400)

    next_birthday_year = now.year if (now.month, now.day) <= (dob.month, dob.day) else now.year + 1
    try:
        next_birthday_date = date(next_birthday_year, dob.month, dob.day)
    except ValueError:
        next_birthday_date = date(next_birthday_year, 3, 1)
    next_birthday_dt = datetime.combine(next_birthday_date, tob)
    if next_birthday_dt < now:
        next_birthday_dt = datetime.combine(date(next_birthday_year + 1, dob.month, dob.day), tob)
    delta_next = next_birthday_dt - now

    leap_years = sum(1 for y in range(dob.year, now.year + 1) if isleap(y))

    full_moons = int(total_days / SYNODIC_MONTH_DAYS)
    mars_years_exact = total_days / MARS_YEAR_DAYS
    mars_years_whole = int(mars_years_exact)

    return {
        "years": years,
        "months": months,
        "days": days,
        "decimal_years": f"{decimal_years:.8f}",
        "total_days": total_days,
        "total_weeks": total_days // 7,
        "total_hours": total_seconds // 3600,
        "total_minutes": total_seconds // 60,
        "total_seconds": total_seconds,
        "next_birthday_days": delta_next.days,
        "next_birthday_seconds": int(delta_next.total_seconds()),
        "day_of_week": DAYS[dob.weekday()],
        "generation": generation_of(dob.year),
        "leap_years": leap_years,
        "full_moons": full_moons,
        "mars_years": round(mars_years_exact, 2),
        "mars_years_whole": mars_years_whole,
        "dob_iso": dob.isoformat(),
        "tob_hhmm": tob.strftime("%H:%M"),
        "time_known": time_known,
    }


def parse_dob(dob_str):
    for fmt in ("%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(dob_str, fmt).date()
        except (ValueError, TypeError):
            continue
    raise ValueError("bad-date-format")


def parse_tob(tob_str):
    if not tob_str:
        return time(0, 0), False
    try:
        return datetime.strptime(tob_str, "%H:%M").time(), True
    except (ValueError, TypeError):
        return time(0, 0), False


def validate(dob_str, tob_str):
    dob = parse_dob(dob_str)
    tob, time_known = parse_tob(tob_str)
    today = date.today()
    if dob > today:
        raise ValueError("Birth date cannot be in the future.")
    if dob.year < 1900:
        raise ValueError("Please enter a year after 1900.")
    return dob, tob, time_known


@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    error = None
    if request.method == "POST":
        dob_str = request.form.get("dob")
        tob_str = request.form.get("tob")
        try:
            dob, tob, time_known = validate(dob_str, tob_str)
            result = calculate_age(dob, tob, time_known)
        except ValueError as e:
            msg = str(e)
            error = "Invalid date. Please use the date picker." if msg == "bad-date-format" else msg
    return render_template("index.html", result=result, error=error)


@app.route("/api/age", methods=["POST"])
def api_age():
    payload = request.get_json(silent=True) or {}
    try:
        dob, tob, time_known = validate(payload.get("dob"), payload.get("tob"))
    except ValueError as e:
        msg = str(e)
        return jsonify({"error": "Invalid date format." if msg == "bad-date-format" else msg}), 400
    return jsonify(calculate_age(dob, tob, time_known))


if __name__ == "__main__":
    app.run(debug=True)
