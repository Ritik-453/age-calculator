from flask import Flask, render_template, request
from datetime import date, datetime
from calendar import monthrange

app = Flask(__name__)

def calculate_age(dob):
    today = date.today()
    # Age calculation
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

    # Next birthday
    next_birthday_year = today.year if (today.month, today.day) < (dob.month, dob.day) else today.year + 1
    next_birthday = date(next_birthday_year, dob.month, dob.day)
    delta_next = next_birthday - today
    rem_months = delta_next.days // 30
    rem_days = delta_next.days % 30

    return {
        "years": years,
        "months": months,
        "days": days,
        "decimal_years": f"{decimal_years:.8f}",
        "total_days": total_days,
        "next_birthday_months": rem_months,
        "next_birthday_days": rem_days
    }

@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    error = None
    if request.method == "POST":
        dob_str = request.form.get("dob")
        try:
            dob = datetime.strptime(dob_str, "%d-%m-%Y").date()
            today = date.today()
            max_day = monthrange(dob.year, dob.month)[1]
            if dob > today:
                error = "Birth date cannot be in the future."
            elif dob.day > max_day:
                error = f"Invalid day for month: {dob.month} in year {dob.year}."
            else:
                result = calculate_age(dob)
        except ValueError:
            error = "Invalid format! Use DD-MM-YYYY."
    return render_template("index.html", result=result, error=error)

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)


