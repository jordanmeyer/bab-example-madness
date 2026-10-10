# Independent Madness normalized-data review

Reviewed 2026-10-09. Scope: `/private/tmp/bab-madness-data/*.json`, the normalization implementation, and frozen ESPN/538 raw inputs. This review does not validate the unfinished frontend.

## Verdict

No normalized-data correctness defect found. Frontend implementation must retain the distinction between archived forecast probabilities and actual results, and handle the timing and topology cautions below. All checks here were performed independently of the normalizer's own `validate()` assertions.

## Observed evidence

- All eleven years 2016–2026 exist. Ten played tournaments contain 68 teams and 67 bracket records each. 2020 has empty teams/games/forecasts and is explicitly cancelled.
- Independently joined all 670 normalized games to ESPN raw event IDs. All contestant identities, winner identities, and played scores match. The single no-contest has null scores.
- Independently compared all 39,508 probability numbers across 5,644 team-snapshot rows to the frozen 538 CSV fields `rd1_win` through `rd7_win`. Every value matched exactly after numeric parsing, including the documented 2018 LIU ID translation. Alive status and ratings also match. No duplicate date/team keys.
- All normalized seed and region values for forecast years match the source CSV. Each played tournament has 64 unique region/seed-slot berths: 60 single teams and four two-team First Four berths; exactly eight teams carry `playIn`. Every First Four pair has equal seeds and every Round-of-64 pair sums to 17. Every regional game fits its stated seed interval. Every semifinal region pair is derived from the primary ESPN contest records, not copied from 2015.
- Independently compared all 5,644 alive/eliminated snapshot states with the actual losing-game date converted to America/New_York. Every recorded elimination is on or before its snapshot date; every game loss on/before that date appears eliminated. These are end-of-day snapshots, not morning forecasts.
- Re-fetched original archived provider URLs for 2016 and 2023; content hashes exactly matched their normalized provenance:
  - 2016: 137,893 bytes; SHA-256 `e5a7090705fb8491ea286fed20210a76c793702a4264412dd0e9de2dd7a3cf3b`.
  - 2023: 182,826 bytes; SHA-256 `5d2826b81ae740eab91dfc4b3f7cea1dfa27baadf320610a0adc337d6ed78ec0`.
- Initial leader checks from raw values: Kansas 2016 title probability 0.19203143; Villanova 2017 0.149953842962; Villanova 2018 0.179788104721; Duke 2019 0.193290145664; Gonzaga 2021 0.281433472751; Gonzaga 2022 0.271870826935; Houston 2023 0.22085016963.
- Verified every champion and title score against primary [NCAA championship history](https://www.ncaa.com/history/basketball-men/d1): 2016 Villanova 77–74 North Carolina; 2017 North Carolina 71–65 Gonzaga; 2018 Villanova 79–62 Michigan; 2019 Virginia 85–77 Texas Tech (OT); 2021 Baylor 86–70 Gonzaga; 2022 Kansas 72–69 North Carolina; 2023 Connecticut 76–59 San Diego State; 2024 UConn 75–60 Purdue; 2025 Florida 65–63 Houston; 2026 Michigan 69–63 UConn. The NCAA page's indexed primary text is available; direct open was bot-challenged.
- 2026 is not speculative: [NCAA's April 6 championship report](https://www.ncaa.com/news/basketball-men/article/2026-04-06/michigan-beats-uconn-wins-2026-mens-basketball-national-championship) independently reports Michigan 69–63 UConn. [UConn's own recap](https://uconnhuskies.com/news/2026/4/6/mens-basketball-huskies-fall-in-national-title-game) agrees.
- 2018 LIU normalization is supported by the [official NCAA bracket PDF](https://i.turner.ncaa.com/sites/default/files/external/printable-bracket/2018/bracket-ncaa.pdf): LIU Brooklyn/Radford are East seed 16. [Radford's March 13 recap](https://radfordathletics.com/news/2018/3/13/mens-basketball-radford-earns-first-ever-ncaa-tournament-win) confirms 71–61.
- 2021 Oregon/VCU no-contest matches [VCU's contemporaneous announcement](https://vcuathletics.com/news/2021/3/20/mens-basketball-vcu-removed-from-ncaa-tournament-as-committee-declares-game-no-contest.aspx) and NCAA bracket no-contest notation. Replacing administrative 1–0 with null scores is correct.

## Actionable frontend requirements

1. Label dates as archived end-of-day snapshots. Example: 2016 March 15 already has 66 surviving teams, reflecting both First Four results. Latest snapshots have two finalists and precede the title game. Do not claim precise live publication times or complete every-game updates.
2. Render game dates in a declared tournament timezone. `2026-04-07T00:50Z` is the April 6 title game in Eastern time; a plain UTC `slice(0,10)` would mislabel it April 7. Similarly 2016 title game is April 4 ET, not April 5.
3. Actual future-game contestants/winners exist in the result tree. Forecast contender sets must use region/seed-slot topology rather than filter to the teams that actually reached those future games. Otherwise the forecast bracket leaks outcomes while probabilities look historical.
4. The seven probability columns mean reaching R64, R32, Sweet 16, Elite Eight, Final Four, championship game, and winning the title. Do not call the last two columns the same thing or present them as conditional head-to-head chances.
5. 2024–2026 currently have results only and must not reuse 2023 probabilities, infer certainty as a forecast, or imply FiveThirtyEight produced them. A separately selected model requires separately documented inputs, assumptions and validation. User has now requested such a model; this review does not approve one yet.
6. Source links, attribution and licenses must survive packaging; all external source reads belong to preparation, with bundled runtime data.

## Limitations

No browser rendering inspected in this pass. Historical game facts were exhaustively reconciled with primary ESPN records, but the complete scores of all 670 games were not independently corroborated against a second provider; champions, the LIU identity correction, and no-contest received separate primary corroboration. Only two archive URLs were re-fetched, while all frozen forecast rows were compared directly. This is evidence of faithful normalization, not evidence that the original forecasting model is calibrated.
