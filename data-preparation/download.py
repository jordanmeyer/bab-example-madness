#!/usr/bin/env python3
"""Download public research inputs for normalize.py; never runs in the browser."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import csv
import gzip
import io
import json
from pathlib import Path
import urllib.request

from normalize import ARCHIVES, BART_DATES, YEARS, forecast_url, scoreboard_url


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--gender', choices=['mens', 'womens'], default='mens')
    parser.add_argument('--raw', type=Path, required=True)
    args = parser.parse_args()
    args.raw.mkdir(parents=True, exist_ok=True)
    jobs = [(f'espn-{year}-{month}.json', scoreboard_url(year, month, args.gender)) for year in YEARS if year != 2020 for month in ['03', '04']]
    jobs += [(f'forecast-{year}.csv', forecast_url(year)) for year in ARCHIVES]
    jobs += [(f'bart-pre-{year}.source', f'https://barttorvik.com/timemachine/team_results/{date}_team_results.json.gz') for year, date in BART_DATES.items() if args.gender == 'mens']

    def fetch(job):
        name, url = job
        destination = args.raw / name
        if destination.exists():
            return f'Reusing {name}'
        request = urllib.request.Request(url, headers={'User-Agent': 'TournamentArchiveResearch/1.0'})
        with urllib.request.urlopen(request, timeout=90) as response:
            body = response.read()
        if name.endswith('.source'):
            decoded = gzip.decompress(body)
            rows = json.loads(decoded)
            assert isinstance(rows, list) and len(rows) > 300 and all(len(row) >= 9 for row in rows), (name, 'expected T-Rank ratings')
            destination.with_suffix('.json').write_bytes(decoded)
        elif name.endswith('.json'):
            assert 'events' in json.loads(body), (name, 'expected scoreboard JSON')
        else:
            rows = csv.DictReader(io.StringIO(body.decode('utf-8')))
            assert 'rd7_win' in rows.fieldnames, (name, 'expected forecast CSV; redirects may return HTML')
        destination.write_bytes(body)
        return f'Downloaded {name}: {len(body)} bytes'

    with ThreadPoolExecutor(max_workers=3) as pool:
        for result in pool.map(fetch, jobs):
            print(result)


if __name__ == '__main__':
    main()
