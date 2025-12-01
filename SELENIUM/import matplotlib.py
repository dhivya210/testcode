"""
four_tools_5yr_trends.py

Creates a 5-year trend chart for:
 - playwright (npm)
 - selenium-webdriver (npm)
 - testim (fallback to Google Trends if not on npm)
 - mabl (fallback to Google Trends if not on npm)

Output: four_tools_trend.png
"""

import requests
import pandas as pd
import matplotlib.pyplot as plt
from datetime import date, timedelta
import time
import sys

# Optional: import pytrends for Google Trends fallback
try:
    from pytrends.request import TrendReq
    PYTRENDS_OK = True
except Exception:
    PYTRENDS_OK = False

# ---------- CONFIG ----------
# mapping: label -> npm package name (or None to force google trends use)
items = {
    "Playwright": "playwright",               # npm package
    "Selenium": "selenium-webdriver",         # npm package
    "Testim": "testim",                       # may not exist on npm
    "Mabl": "mabl"                            # may not exist on npm
}

months_rolling = 3   # smoothing window (months)
outfile = "four_tools_trend.png"
# ----------------------------

def five_years_ago_iso():
    today = date.today()
    five_years_ago = today.replace(year=today.year - 5)
    return five_years_ago.isoformat(), today.isoformat()

def fetch_npm_range(pkg, start_iso, end_iso, max_retries=2):
    """Fetch daily downloads for npm package from api.npmjs.org."""
    url = f"https://api.npmjs.org/downloads/range/{start_iso}:{end_iso}/{pkg}"
    tries = 0
    while tries <= max_retries:
        tries += 1
        try:
            resp = requests.get(url, timeout=15)
            # 200 -> data; 404 -> no data
            if resp.status_code == 200:
                return resp.json()
            else:
                # return the response for caller to inspect
                return {"status": resp.status_code, "text": resp.text}
        except requests.RequestException as e:
            print(f"[npm fetch] error for {pkg}: {e} (try {tries}/{max_retries})")
            time.sleep(1)
    return None

def daily_json_to_series(json_obj):
    """Convert npm downloads JSON to pandas Series indexed by date (daily)."""
    if not json_obj or "downloads" not in json_obj:
        return None
    downloads = json_obj["downloads"]
    if not downloads:
        return None
    df = pd.DataFrame(downloads)
    df["date"] = pd.to_datetime(df["day"])
    df.set_index("date", inplace=True)
    return df["downloads"].sort_index()

def get_google_trends_series(keyword, start_iso, end_iso, geo=""):
    """Use pytrends to get weekly interest over time; resample to month sums/means."""
    if not PYTRENDS_OK:
        print("[WARN] pytrends not available; install pytrends to use Google Trends fallback.")
        return None

    pytrends = TrendReq(hl='en-US', tz=360)
    # pytrends expects YYYY-MM-DD formatted times as "YYYY-MM-DD YYYY-MM-DD"
    timeframe = f"{start_iso} {end_iso}"
    try:
        pytrends.build_payload([keyword], cat=0, timeframe=timeframe, geo=geo, gprop='')
        df = pytrends.interest_over_time()
        if df.empty:
            return None
        # pytrends returns weekly granularity for long timeframes; column name is the keyword
        series = df[keyword].copy()
        # convert weekly to monthly by taking the mean of weeks that fall into each month
        series.index = pd.to_datetime(series.index)
        monthly = series.resample("M").mean()
        return monthly
    except Exception as e:
        print(f"[pytrends] failed for '{keyword}': {e}")
        return None

def build_time_series():
    start_iso, end_iso = five_years_ago_iso()
    monthly_npm = pd.DataFrame(index=pd.date_range(start=start_iso, end=end_iso, freq="M"))
    monthly_trends = pd.DataFrame(index=monthly_npm.index)  # for Google Trends fallback

    for label, pkg in items.items():
        print(f"Processing '{label}' (npm name: {pkg}) ...")
        used_npm = False
        series_monthly = None

        # Try npm if a package name is provided
        if pkg:
            json_obj = fetch_npm_range(pkg, start_iso, end_iso)
            if json_obj and isinstance(json_obj, dict) and json_obj.get("downloads"):
                daily = daily_json_to_series(json_obj)
                if daily is not None and not daily.empty:
                    # aggregate to monthly sums
                    series_monthly = daily.resample("M").sum()
                    used_npm = True
                    print(f"  -> npm data found for {pkg}; using monthly download counts.")
                else:
                    print(f"  -> npm responded but no downloads found for '{pkg}'.")
            else:
                code = json_obj.get("status") if isinstance(json_obj, dict) else None
                print(f"  -> npm API returned status {code} for '{pkg}' (likely no npm package).")

        # If no npm data, fallback to Google Trends (keyword = label)
        if not used_npm:
            if not PYTRENDS_OK:
                print(f"  -> skipping Google Trends fallback for '{label}': pytrends not installed.")
                continue
            print(f"  -> Attempting Google Trends fallback for '{label}' ...")
            gt = get_google_trends_series(label, start_iso, end_iso)
            if gt is not None and not gt.empty:
                series_monthly = gt  # already monthly (mean of weekly)
                print(f"  -> Google Trends data obtained for '{label}'.")
            else:
                print(f"  -> No Google Trends data for '{label}' (or request failed).")

        if series_monthly is None:
            print(f"  !! no data for '{label}', skipping.")
            continue

        # Align to monthly index and store in appropriate DataFrame
        series_monthly = series_monthly.reindex(monthly_npm.index, method=None).fillna(0)
        if used_npm:
            monthly_npm[label] = series_monthly
        else:
            monthly_trends[label] = series_monthly

        # polite pause to avoid hitting endpoints too fast
        time.sleep(0.8)

    return monthly_npm, monthly_trends

def plot_series(monthly_npm, monthly_trends, outpath=outfile):
    plt.style.use('default')
    fig, ax_left = plt.subplots(figsize=(14,7))
    plotted_any = False

    # Left axis: npm downloads (absolute counts)
    if not monthly_npm.empty:
        for col in monthly_npm.columns:
            # smoothing
            s = monthly_npm[col].rolling(window=months_rolling, min_periods=1).mean()
            ax_left.plot(s.index, s.values, linewidth=2.2, label=f"{col} (npm downloads)")
            plotted_any = True

    ax_left.set_xlabel("Date")
    ax_left.set_ylabel("Downloads per month (npm)")
    ax_left.grid(axis='y', linestyle='--', alpha=0.3)

    # Right axis: Google Trends index (0-100)
    ax_right = None
    if not monthly_trends.empty:
        ax_right = ax_left.twinx()
        for col in monthly_trends.columns:
            s = monthly_trends[col].rolling(window=months_rolling, min_periods=1).mean()
            ax_right.plot(s.index, s.values, linestyle='--', linewidth=2.2, label=f"{col} (Google Trends)", alpha=0.9)
            plotted_any = True
        ax_right.set_ylabel("Google Trends interest (0-100)")

    if not plotted_any:
        print("No series were plotted (no data). Exiting without saving.")
        return

    # Combine legends
    handles_left, labels_left = ax_left.get_legend_handles_labels()
    handles_right, labels_right = (ax_right.get_legend_handles_labels() if ax_right else ([], []))
    handles = handles_left + handles_right
    labels = labels_left + labels_right

    ax_left.legend(handles, labels, loc='upper left', fontsize=10)

    plt.title("5-Year Trend: Playwright, Selenium, Testim, Mabl\n(npm downloads where available; Google Trends fallback where not)")
    fig.tight_layout()
    plt.savefig(outpath, dpi=150)
    print(f"Saved chart to: {outpath}")
    plt.show()

def main():
    if not PYTRENDS_OK:
        print("Note: 'pytrends' is not installed. The script will still try npm data but cannot fall back to Google Trends.")
        print("To install pytrends: pip install pytrends")
    monthly_npm, monthly_trends = build_time_series()
    # show small summary
    print("\nData summary:")
    if not monthly_npm.empty:
        print(" npm series:", list(monthly_npm.columns))
    if not monthly_trends.empty:
        print(" Google Trends series:", list(monthly_trends.columns))
    plot_series(monthly_npm, monthly_trends)

if __name__ == "__main__":
    main()
