#!/usr/bin/env python3
"""Join the publisher's frozen pre-tournament ratings to the bracket teams."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import unicodedata
from normalize import BART_DATES

ALIASES = {
    '2755': 'Grambling St.', '2377': 'McNeese St.', '152': 'North Carolina St.',
    '41': 'Connecticut', '232': 'College of Charleston', '145': 'Mississippi',
    '2437': 'Nebraska Omaha', '44': 'American', '2856': 'Cal Baptist',
    '219': 'Penn', '112358': 'LIU', '2390': 'Miami FL', '2511': 'Queens',
}


def key(name):
    return re.sub('[^a-z0-9]', '', unicodedata.normalize('NFKD', name).lower().replace('state', 'st'))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--raw', type=Path, required=True)
    parser.add_argument('--data', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    for year, date in BART_DATES.items():
        raw = (args.raw / f'bart-pre-{year}.json').read_bytes()
        rows = json.loads(raw)
        by_name = {key(row[1]): row for row in rows}
        assert len(by_name) == len(rows), 'Ambiguous normalized provider names'
        bracket = json.loads((args.data / f'{year}.json').read_text())
        teams, joins = [], []
        for team in bracket['teams']:
            provider_name = team['name'] if key(team['name']) in by_name else ALIASES[team['id']]
            row = by_name[key(provider_name)]
            assert 0 < row[8] < 1
            teams.append({'id': team['id'], 'name': team['name'], 'bartName': row[1], 'barthag': row[8], 'record': row[3]})
            joins.append({'id': team['id'], 'bracketName': team['name'], 'providerName': row[1], 'join': 'exact name after punctuation/State abbreviation normalization' if key(team['name']) in by_name else 'explicit school alias'})
        assert len({t['bartName'] for t in teams}) == len(teams) == 68
        url = f'https://barttorvik.com/timemachine/team_results/{date}_team_results.json.gz'
        compressed = (args.raw / f'bart-pre-{year}.source').read_bytes()
        output = {'year': year, 'date': f'{date[:4]}-{date[4:6]}-{date[6:]}', 'timing': 'Morning after Selection Sunday, before First Four', 'teams': teams, 'source': {'name': 'Bart Torvik T-Rank Time Machine', 'url': url, 'sha256': hashlib.sha256(compressed).hexdigest(), 'decodedSha256': hashlib.sha256(raw).hexdigest(), 'retrievedOn': '2026-10-09', 'field': 'Zero-based column 8: Barthag', 'originalTeamCount': len(rows), 'methodUrl': 'https://adamcwisports.blogspot.com/p/every-possession-counts.html', 'bulkDataGuideUrl': 'https://adamcwisports.blogspot.com/p/data.html'}, 'joins': joins}
        (args.out / f'{year}-ratings.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
        print(f'{year}: all 68 teams joined; snapshot {output["date"]}')


if __name__ == '__main__':
    main()
