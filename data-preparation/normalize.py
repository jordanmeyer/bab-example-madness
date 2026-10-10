#!/usr/bin/env python3
"""Normalize frozen ESPN facts and archived FiveThirtyEight forecasts; stdlib only."""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path
import re

YEARS = range(2016, 2027)
SEEDS = [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15]
ROUND_LABELS = ['First Four', 'Round of 64', 'Round of 32', 'Sweet 16', 'Elite Eight', 'Final Four', 'Championship']
ROUND_MATCHES = ['FIRST FOUR', '1ST ROUND', '2ND ROUND', 'SWEET 16', 'ELITE 8', 'FINAL FOUR', 'NATIONAL CHAMPIONSHIP']
ARCHIVES = {
    2016: '20170225054931', 2017: '20230427192747', 2018: '20180828014750',
    2019: '20230427215218', 2021: '20220315183608', 2022: '20220512011228',
    2023: '20230428024902',
}
BART_DATES = {2024: '20240318', 2025: '20250317', 2026: '20260316'}
CHAMPIONS = {2016:'222', 2017:'153', 2018:'222', 2019:'258', 2021:'239', 2022:'2305', 2023:'41', 2024:'41', 2025:'57', 2026:'130'}
NCAA_HISTORY = 'https://www.ncaa.com/history/basketball-men/d1'
LIU_BRACKET = 'https://i.turner.ncaa.com/sites/default/files/external/printable-bracket/2018/bracket-ncaa.pdf'

# Stable school IDs, shared across seasons. Full historical names remain in `name`.
# Compact conventional names are presentation metadata, never identity joins.
BRACKET_NAMES = {
    '41': 'UConn', '252': 'BYU', '2031': 'Little Rock', '2934': 'CSU Bakersfield',
    '2239': 'CSU Fullerton', '2856': 'Cal Baptist', '2193': 'ETSU',
    '161': 'FDU', '526': 'FGCU', '99': 'LSU', '309': 'Louisiana',
    '2393': 'Middle Tenn.', '116': "Mt. St. Mary's", '2428': 'NC Central',
    '2427': 'UNC Asheville', '2430': 'UNC Greensboro', '350': 'UNC Wilmington',
    '2546': 'SE Missouri St.', '30': 'USC', '2567': 'SMU', '2617': 'SF Austin',
    '357': 'Texas A&M-CC', '2670': 'VCU', '112358': 'LIU', '6446': 'LIU Brooklyn',
    '2350': 'Loyola Chicago', '2504': 'Prairie View', '2000': 'Abilene Chr.',
    '2511': 'Queens', '2390': 'Miami (FL)', '193': 'Miami (OH)',
    '2378': 'UMBC', '152': 'NC State', '232': 'Charleston', '2540': 'UCSB', '5': 'UAB',
}


def bracket_names(team_id, historical_name, source_team):
    name = BRACKET_NAMES.get(team_id, historical_name)
    for original, short in [('State', 'St.'), ('University', 'U.'), ('Saint', 'St.'),
                            ('Eastern', 'E.'), ('Northern', 'N.'), ('Western', 'W.'),
                            ('Southern', 'S.'), ('Southeast', 'SE'), ('Appalachian', 'App.')]:
        name = name.replace(original, short)
    # The frozen scoreboard's publisher abbreviation is already designed for small labels.
    super_short = {'6446': 'LIU', '112358': 'LIU', '2443': 'UNO'}.get(team_id, source_team.get('abbreviation'))
    assert super_short, (team_id, historical_name, 'missing publisher abbreviation')
    return name, super_short


def forecast_url(year):
    return f'https://web.archive.org/web/{ARCHIVES[year]}id_/https://projects.fivethirtyeight.com/march-madness-api/{year}/fivethirtyeight_ncaa_forecasts.csv'


def scoreboard_url(year, month):
    return f'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates={year}{month}&groups=100&limit=1000'


def source(raw, name, url, label):
    data = (raw / name).read_bytes()
    return {'name': label, 'url': url, 'rawFile': name, 'sha256': hashlib.sha256(data).hexdigest(), 'retrievedOn': '2026-10-09'}


def normalize(raw, year):
    if year == 2020:
        return {'year': year, 'status': 'cancelled', 'teams': [], 'games': [], 'forecasts': [], 'regionOrder': [], 'finalFourPairs': [], 'championTeamId': None, 'sources': [{'name': 'NCAA championship history: 2020 cancelled', 'url': NCAA_HISTORY}], 'corrections': [], 'note': 'The 2020 NCAA tournament was cancelled. No official bracket, games or championship forecast is fabricated.'}
    events = []
    sources = []
    for month in ['03', '04']:
        name = f'espn-{year}-{month}.json'
        events.extend(json.loads((raw / name).read_text())['events'])
        sources.append(source(raw, name, scoreboard_url(year, month), f'ESPN tournament scoreboard, {year}-{month}'))
    forecast_rows = []
    if year in ARCHIVES:
        forecast_rows = [r for r in csv.DictReader((raw / f'forecast-{year}.csv').open()) if r['gender'] == 'mens']
        sources.append(source(raw, f'forecast-{year}.csv', forecast_url(year), f'FiveThirtyEight archived forecast CSV, {year}'))
    first_forecast = {r['team_id']: r for r in sorted(forecast_rows, key=lambda r: r['forecast_date'], reverse=True)}
    if year == 2018:
        first_forecast['6446'] = first_forecast.pop('2341')
    teams, games, corrections = {}, [], []
    for event in sorted(events, key=lambda e: e['date']):
        c = event['competitions'][0]
        note = ' '.join(n['headline'] for n in c.get('notes', []))
        round_no = next(i for i, text in enumerate(ROUND_MATCHES) if text in note.upper())
        region_match = re.search(r'(East|West|South|Midwest) Region', note, re.I)
        region = region_match[1].title() if region_match else None
        contestants = sorted(c['competitors'], key=lambda t: t['order'])
        for t in contestants:
            tid = t['id']
            rating_row = first_forecast.get(tid)
            seed = t['curatedRank']['current']
            if year == 2018 and tid == '6446':
                seed = 16
            if tid not in teams:
                name = rating_row['team_name'] if rating_row else t['team']['location']
                if year == 2018 and tid == '6446':
                    name = 'LIU Brooklyn'
                bracket_name, super_short_name = bracket_names(tid, name, t['team'])
                teams[tid] = {'id': tid, 'name': name, 'shortName': name, 'bracketName': bracket_name, 'superShortName': super_short_name, 'seed': seed, 'region': region, 'bracketSlot': SEEDS.index(seed), 'playIn': round_no == 0}
            else:
                assert teams[tid]['seed'] == seed, (year, tid, 'seed drift')
                if region:
                    assert teams[tid]['region'] == region, (year, tid, 'region drift')
        no_contest = c['status']['type']['name'] == 'STATUS_UNCONTESTED'
        winners = [t['id'] for t in contestants if t.get('winner')]
        assert len(winners) == 1, (year, event['id'], 'winner count')
        assert no_contest or c['status']['type']['name'] == 'STATUS_FINAL'
        games.append({'id': event['id'], 'date': c['date'], 'round': round_no, 'roundName': ROUND_LABELS[round_no], 'region': region, 'teamIds': [t['id'] for t in contestants], 'scores': [None, None] if no_contest else [int(t['score']) for t in contestants], 'winnerId': winners[0], 'status': 'no-contest' if no_contest else 'final', 'statusText': 'Oregon advanced; game not played' if no_contest else c['status']['type']['shortDetail'], 'sourceUrl': f'https://www.espn.com/mens-college-basketball/game/_/gameId/{event["id"]}'})
    if year == 2018:
        corrections.append({'field': 'teams[id=6446].seed/name and forecast team ID', 'from': 'ESPN seed 99; FiveThirtyEight team ID 2341, Long Island University', 'to': 'seed 16; historical name LIU Brooklyn; mapped forecast ID to ESPN 6446', 'reason': 'The 2018 East First Four was LIU Brooklyn vs Radford, both seed 16. This maps a historical provider ID change; it does not merge current LIU with unrelated teams.', 'sourceUrl': LIU_BRACKET})
    if year == 2021:
        corrections.append({'field': 'games[id=401310924].scores', 'from': 'ESPN administrative score [1,0]', 'to': '[null,null]', 'reason': 'Provider status is UNCONTESTED and its note says Oregon advances. Administrative advancement is not a played 1–0 basketball score.', 'sourceUrl': 'https://www.espn.com/mens-college-basketball/game/_/gameId/401310924'})
    if year in ARCHIVES:
        corrections.append({'field': 'team names', 'reason': 'Historical FiveThirtyEight names preferred to mutable current ESPN branding. Games join by stable numeric IDs, with the single documented 2018 LIU exception.', 'sourceUrl': forecast_url(year)})
    semifinals = [g for g in games if g['round'] == 5]
    pairs = [[teams[t]['region'] for t in g['teamIds']] for g in semifinals]
    regions = sum(pairs, [])
    for game in games:
        if game['round'] < 6:
            onward = [g for g in games if g['round'] == game['round'] + 1 and game['winnerId'] in g['teamIds']]
            assert len(onward) == 1, (year, game['id'], 'next game')
            game['nextGameId'] = onward[0]['id']
            game['nextGameSlot'] = onward[0]['teamIds'].index(game['winnerId'])
        else:
            game['nextGameId'] = None
            game['nextGameSlot'] = None
        if game['round'] < 5:
            game['bracketOrder'] = min(teams[t]['bracketSlot'] for t in game['teamIds']) // (2 ** max(1, game['round']))
        else:
            game['bracketOrder'] = semifinals.index(game) if game['round'] == 5 else 0
    forecasts = []
    for date in sorted({r['forecast_date'] for r in forecast_rows}):
        rows = [r for r in forecast_rows if r['forecast_date'] == date]
        forecasts.append({'date': date, 'teams': [{'id': '6446' if year == 2018 and r['team_id'] == '2341' else r['team_id'], 'p': [float(r[f'rd{i}_win']) for i in range(1, 8)], 'rating': float(r['team_rating']), 'alive': r['team_alive'] == '1'} for r in rows]})
    champion = next(g['winnerId'] for g in games if g['round'] == 6)
    sources.append({'name': 'NCAA championship history (champion cross-check)', 'url': NCAA_HISTORY})
    return {'year': year, 'status': 'played', 'teams': sorted(teams.values(), key=lambda t: (regions.index(t['region']), t['bracketSlot'], t['id'])), 'games': sorted(games, key=lambda g: (g['round'], regions.index(g['region']) if g['region'] else 4, g['bracketOrder'], g['date'])), 'forecasts': forecasts, 'regionOrder': regions, 'finalFourPairs': pairs, 'championTeamId': champion, 'firstGameDate': min(g['date'] for g in games), 'lastGameDate': max(g['date'] for g in games), 'sources': sources, 'corrections': corrections, 'forecastNote': 'FiveThirtyEight daily archived snapshots; forecast_date is preserved as published and is not a precise live timestamp. Resolved advancement probabilities identify the games included in each snapshot; the interface derives its through-games status from those results. The latest snapshot precedes the championship.' if forecasts else 'FiveThirtyEight stopped updating sports forecasts in June 2023. This year contains actual tournament results, with no substituted forecast.'}


def validate(d):
    if d['status'] == 'cancelled':
        assert d['year'] == 2020 and not (d['teams'] or d['games'] or d['forecasts'])
        return {'year': 2020, 'status': 'cancelled', 'games': 0, 'teams': 0, 'snapshots': 0}
    teams = {t['id']: t for t in d['teams']}
    assert len(teams) == len(d['teams']) == 68
    assert len({g['id'] for g in d['games']}) == len(d['games']) == 67
    assert len(set(d['regionOrder'])) == 4 and sum(d['finalFourPairs'], []) == d['regionOrder']
    assert d['championTeamId'] == CHAMPIONS[d['year']]
    assert [sum(g['round'] == r for g in d['games']) for r in range(7)] == [4, 32, 16, 8, 4, 2, 1]
    for region in d['regionOrder']:
        assert {t['seed'] for t in d['teams'] if t['region'] == region} == set(range(1, 17))
        for r in range(1, 5):
            rg = [g for g in d['games'] if g['region'] == region and g['round'] == r]
            assert sorted(g['bracketOrder'] for g in rg) == list(range(16 // (2 ** r))), (d['year'], region, r)
    for g in d['games']:
        assert len(g['teamIds']) == len(set(g['teamIds'])) == 2
        assert set(g['teamIds']) <= teams.keys() and g['winnerId'] in g['teamIds']
        if g['status'] == 'final':
            assert g['scores'][g['teamIds'].index(g['winnerId'])] > g['scores'][1 - g['teamIds'].index(g['winnerId'])]
        else:
            assert d['year'] == 2021 and g['id'] == '401310924' and g['scores'] == [None, None]
        if g['round'] > 1:
            predecessors = [x for x in d['games'] if x['nextGameId'] == g['id']]
            assert len(predecessors) == 2 and {p['winnerId'] for p in predecessors} == set(g['teamIds'])
    max_sum_error = 0
    for f in d['forecasts']:
        assert {t['id'] for t in f['teams']} == teams.keys() and len(f['teams']) == 68
        for t in f['teams']:
            assert all(math.isfinite(p) and 0 <= p <= 1 for p in t['p'])
            assert all(a + 1e-9 >= b for a, b in zip(t['p'], t['p'][1:]))
        for i, expected in enumerate([64, 32, 16, 8, 4, 2, 1]):
            error = abs(sum(t['p'][i] for t in f['teams']) - expected)
            max_sum_error = max(max_sum_error, error)
            assert error < 2e-6, (d['year'], f['date'], i, error)
    return {'year': d['year'], 'status': 'validated', 'teams': 68, 'games': 67, 'playedGames': sum(g['status'] == 'final' for g in d['games']), 'roundCounts': [4,32,16,8,4,2,1], 'snapshots': len(d['forecasts']), 'earliestForecast': d['forecasts'][0]['date'] if d['forecasts'] else None, 'latestForecast': d['forecasts'][-1]['date'] if d['forecasts'] else None, 'maximumRoundProbabilitySumError': max_sum_error, 'championId': d['championTeamId'], 'championName': teams[d['championTeamId']]['name']}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--raw', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    args = p.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    index, results = [], []
    for year in YEARS:
        d = normalize(args.raw, year)
        results.append(validate(d))
        (args.out / f'{year}.json').write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')) + '\n')
        index.append({'year': year, 'status': d['status'], 'file': f'{year}.json', 'forecastDates': [f['date'] for f in d['forecasts']], 'championTeamId': d['championTeamId']})
    (args.out / 'index.json').write_text(json.dumps({'schemaVersion': 1, 'gender': 'mens', 'years': index}, indent=2) + '\n')
    (args.out / 'validation.json').write_text(json.dumps({'retrievedOn': '2026-10-09', 'checks': ['68 unique teams and 67 bracket games per played year', '4/32/16/8/4/2/1 round counts', 'All regional seeds and bracket orders', 'Actual Final Four region pairings', 'Winner/next-game topology and scores', 'Champions independently cross-checked against NCAA history', '68 mapped teams per snapshot', 'All probabilities finite, bounded and monotonically decreasing', 'Per-snapshot round probability totals 64/32/16/8/4/2/1 within 0.000002', '2020 cancelled and 2021 no-contest represented without scores'], 'years': results}, indent=2) + '\n')
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    main()
