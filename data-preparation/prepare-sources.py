"""Normalize recovered complete opening inputs; explicit joins, no fuzzy matching."""
import json, re, sys
from pathlib import Path
research=Path(sys.argv[1]); app=Path(sys.argv[2]); output=Path(sys.argv[3])
records=json.loads((research/'inventory.json').read_text())
providers={'Ken Pomeroy':'kenpom','Bart Torvik':'torvik','Silver Bulletin':'silver','numberFire / Brandon Gdula':'numberfire','ESPN BPI':'espn'}
selected=[]
for r in records:
    if r['provider']=='Ken Pomeroy' and r['teamCount']==68: selected.append(r)
    elif r['provider'] in ['Bart Torvik','Silver Bulletin','numberFire / Brandon Gdula']: selected.append(r)
    elif r['provider']=='ESPN BPI' and r['year']==2017 and r['capture']=='20170313013729': selected.append(r)
# The 2024 Pre-Tourney option already knows a First Four result. Use the actual
# March 18 archived table before either First Four game instead.
r=next(r for r in selected if r['provider']=='Bart Torvik' and r['year']==2024)
a=json.loads((research/'torvik-history/torvik-mens-archive-20240318172405.json').read_text())
r.update(url=a['url'],date='2024-03-18',notes=['Archived before First Four; capture time, not publisher timestamp.'],rows=[{'name':x[2],'seed':x[0],'values':x[4:]} for x in a['tables'][0][1:] if len(x)==11])

def namekey(name):
    return re.sub('[^a-z0-9]','',re.sub(r'\s*\(\d+\)$','',name.lower()).replace('saint','st').replace('state','st'))
# Source labels which are not simple punctuation/State/Saint variants.
aliases={namekey(name):id for name,id in {
 'FCGU':'526', 'F. Dickinson':'161', "Saint Mary's":'2608', "Saint Mary's (CA)":'2608',
 "St. John's":'2599', "St. John's (NY)":'2599', 'Prairie View A&M':'2504',
 'Texas A&M Corpus Chris':'357', 'TAMU-Corpus Christi':'357', 'Connecticut':'41',
 'McNeese St.':'2377', 'Grambling St.':'2755', 'Mississippi':'145',
 'Nebraska Omaha':'2437', 'American':'44', 'North Carolina St.':'152',
 'College of Charleston':'232', 'Tennessee-Martin':'2630', 'Brigham Young':'252',
 'Virginia Commonwealth':'2670', 'NC Wilmington':'350', 'St. Francis PA':'2598'
}.items()}
missing=[]; result=[]
for r in selected:
    folder='womens/' if r['competition']=='womens' else ''
    data=json.loads((app/f'app/public/data/{folder}{r["year"]}.json').read_text())
    lookup={}
    for t in data['teams']:
        for k in ['name','shortName','bracketName','superShortName']:
            lookup.setdefault(namekey(t[k]),set()).add(t['id'])
    mapped=[]
    for row in r['rows']:
        key=namekey(row['name']); ids=lookup.get(key,set())
        if not ids and key in aliases and aliases[key] in [t['id'] for t in data['teams']]: ids={aliases[key]}
        if row.get('id') in [t['id'] for t in data['teams']]: ids={row['id']}
        if len(ids)!=1:
            missing.append((r['competition'],r['year'],r['provider'],row['name'],row.get('seed'),list(ids)))
            continue
        values=[None]*(7-len(row['values']))
        for v in row['values']:
            s=str(v).replace('%','')
            values.append(1 if s=='✓' else float(s.lstrip('<'))/100/(2 if s.startswith('<') else 1))
        mapped.append({'id':next(iter(ids)),'p':values,'published':row['values'],'name':row['name']})
    first=data['firstGameDate'][:10]
    date=(r['date'] or '')[:10]
    if not date: # Undated publisher Pre-Tourney option: explicit reference date.
        from datetime import date as dt, timedelta
        date=str(dt.fromisoformat(first)-timedelta(days=1))
    result.append({'id':providers[r['provider']], 'name':r['provider'],'competition':r['competition'],'year':r['year'],'date':date,'dateKnown':r['date'] is not None,'url':r['url'],'notes':r['notes'],'teams':mapped})
# 538 originals include both sexes and retain more precision than displayed tables.
for gender in ['mens','womens']:
    for year in [2016,2017,2018,2019,2021,2022,2023]:
        folder='womens/' if gender=='womens' else ''
        d=json.loads((app/f'app/public/data/{folder}{year}.json').read_text()); f=d['forecasts'][0]
        result.append({'id':'fivethirtyeight','name':'FiveThirtyEight','competition':gender,'year':year,'date':f['date'],'dateKnown':True,'url':next((s['url'] for s in d['sources'] if isinstance(s,dict) and 'FiveThirtyEight archived forecast CSV' in s.get('name','')), 'https://github.com/fivethirtyeight/data'),'notes':['Original opening probabilities; subsequent timeline is reconstructed, not original updates.'],'teams':[{'id':t['id'],'p':t['p']} for t in f['teams']]})
if missing:
    print(json.dumps(missing,indent=2));sys.exit(1)
for r in result:
    assert len({t['id'] for t in r['teams']})==len(r['teams']), (r['year'],r['name'])
output.write_text(json.dumps(result,indent=2)+'\n')
print(f'{len(result)} complete source fields saved to {output}')
