from flask import Flask, render_template, request, jsonify
from datetime import date, datetime
from calendar import monthrange, isleap

app = Flask(__name__)

ZODIAC = [
    ((1, 20), (2, 18), "Aquarius", "♒"),
    ((2, 19), (3, 20), "Pisces", "♓"),
    ((3, 21), (4, 19), "Aries", "♈"),
    ((4, 20), (5, 20), "Taurus", "♉"),
    ((5, 21), (6, 20), "Gemini", "♊"),
    ((6, 21), (7, 22), "Cancer", "♋"),
    ((7, 23), (8, 22), "Leo", "♌"),
    ((8, 23), (9, 22), "Virgo", "♍"),
    ((9, 23), (10, 22), "Libra", "♎"),
    ((10, 23), (11, 21), "Scorpio", "♏"),
    ((11, 22), (12, 21), "Sagittarius", "♐"),
    ((12, 22), (1, 19), "Capricorn", "♑"),
]

CHINESE_ZODIAC = ["Monkey", "Rooster", "Dog", "Pig", "Rat", "Ox",
                   "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat"]

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def zodiac_sign(month, day):
    for start, end, name, symbol in ZODIAC:
        s_month, s_day = start
        e_month, e_day = end
        if s_month == month and day >= s_day:
            return name, symbol
        if e_month == month and day <= e_day:
            return name, symbol
    return "Capricorn", "♑"


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


def calculate_age(dob):
    today = date.today()
    years = today.year - dob.year
    months = today.month - dob.month
    days = today.day - dob.day
    if days < 0:
        months -= 1
        prev_month = today.month - 1 or 12
        prev_year = today.year if today.month != 1 else today.year - 1
        days += monthrange(prev_year, prev_month)[1]
    if months < 0:
        months += 12
        years -= 1

    total_days = (today - dob).days
    decimal_years = total_days / 365.2425

    next_birthday_year = today.year if (today.month, today.day) <= (dob.month, dob.day) else today.year + 1
    try:
        next_birthday = date(next_birthday_year, dob.month, dob.day)
    except ValueError:
        # dob was Feb 29 and next year isn't a leap year
        next_birthday = date(next_birthday_year, 3, 1)
    delta_next = next_birthday - today

    leap_years = sum(1 for y in range(dob.year, today.year + 1) if isleap(y))
    z_name, z_symbol = zodiac_sign(dob.month, dob.day)

    return {
        "years": years,
        "months": months,
        "days": days,
        "decimal_years": f"{decimal_years:.8f}",
        "total_days": total_days,
        "total_weeks": total_days // 7,
        "total_hours": total_days * 24,
        "total_minutes": total_days * 24 * 60,
        "total_seconds": total_days * 24 * 60 * 60,
        "next_birthday_days": delta_next.days,
        "day_of_week": DAYS[dob.weekday()],
        "zodiac": z_name,
        "zodiac_symbol": z_symbol,
        "chinese_zodiac": CHINESE_ZODIAC[dob.year % 12],
        "generation": generation_of(dob.year),
        "leap_years": leap_years,
        "dob_iso": dob.isoformat(),
    }


def parse_dob(dob_str):
    """Accepts YYYY-MM-DD (native date input) or DD-MM-YYYY (legacy)."""
    for fmt in ("%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(dob_str, fmt).date()
        except (ValueError, TypeError):
            continue
    raise ValueError("bad format")


def validate(dob_str):
    dob = parse_dob(dob_str)
    today = date.today()
    if dob > today:
        raise ValueError("Birth date cannot be in the future.")
    if dob.year < 1900:
        raise ValueError("Please enter a year after 1900.")
    return dob


@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    error = None
    if request.method == "POST":
        dob_str = request.form.get("dob")
        try:
            dob = validate(dob_str)
            result = calculate_age(dob)
        except ValueError as e:
            error = str(e) if str(e) not in ("bad format",) else "Invalid date. Please use the date picker."
    return render_template("index.html", result=result, error=error)


@app.route("/api/age", methods=["POST"])
def api_age():
    payload = request.get_json(silent=True) or {}
    dob_str = payload.get("dob")
    try:
        dob = validate(dob_str)
    except ValueError as e:
        msg = str(e) if str(e) not in ("bad format",) else "Invalid date format."
        return jsonify({"error": msg}), 400
    return jsonify(calculate_age(dob))


if __name__ == "__main__":
    app.run(debug=True)
