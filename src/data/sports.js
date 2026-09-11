const S = (id, name, season, battle, color, parkTypes, levels, resetPool = []) => ({ id, name, season, battle, color, parkTypes, levels, resetPool });

export const SPORTS = [
  S('scooter','Stunt-Scooter','summer','SCOOT','#C8F531',['Skatepark','Skatehalle'],[
    ['Basics',['Sicher bremsen','Bunny Hop','Fakie gerade','180° auf flachem Boden','180° to Fakie','Manual kurz','Drop-in niedrig','Flyout kontrolliert']],
    ['Aufsteiger',['No Footer','One Hander','X-Up','Barspin','Tailwhip','Heelwhip','Feeble Grind','Smith Grind','360°']],
    ['Fortgeschritten',['Boardslide','Double Whip','Fingerwhip','Bri Flip','Whip Bar','Bar Whip','540°','Heel Rewind','Kickless']],
    ['Pro',['Triple Whip','Double Barspin','Double Fingerwhip','Buttercup','Whip Rewind','360 Whip','720°','Frontflip in Foam/Airbag']],
  ],[
    ['Nose Pivot','Half Cab','Fakie 180','Manual über Linie','Disaster Stall','Fifty-Fifty Grind','Icepick Stall','One Foot'],
    ['Can Can','No Hander','Bar Rewind','Tailwhip to Fakie','Heelwhip to Fakie','Boardslide niedrig','Lipslide niedrig','360 No Footer','360 Barspin'],
    ['Triple Whip Vorbereitung','Double Heelwhip','Bri Whip','Inward','360 Tailwhip','Fingerwhip to Bar','Bar to Whip','540 Barspin','540 Whip'],
    ['Double Whip Bar','Buttercup Variation','720 Barspin','720 Whip','Backflip nur Foam/Airbag','Frontflip Bar nur Airbag','Flair nur Foam/Airbag','Cashroll nur Profi-Setup'],
  ]),
  S('bmx','BMX','summer','BIKE','#7DD8FF',['Skatepark','Bikepark','Dirtpark','Pumptrack'],[
    ['Basics',['Notbremsung kontrolliert','Bunny Hop','Pumpen im Pumptrack','Manual kurz','180°','Fakie gerade','kleiner Drop','kleiner Table']],
    ['Aufsteiger',['X-Up','Barspin','Fakie Rollout','Feeble Grind','Double Peg Grind','360°','No Footer','One Hander']],
    ['Fortgeschritten',['Tailwhip','No Hander','Toboggan','Tabletop','Truckdriver','540°','360 Barspin','Opposite 180']],
    ['Pro',['360 Tailwhip','Downside Whip','Barspin to Tailwhip','Backflip in Foam/Airbag','Flair in Foam/Airbag','720°','Flip Bar nur Airbag','Frontflip nur Airbag']],
  ],[
    ['Footjam','Endo','Nose Pivot','Fakie Half Cab','Manual länger','Disaster Stall','Abubaca','Wallride niedrig'],
    ['Smith Grind','Icepick Grind','Toothpick Stall','Can Can','Nac Nac','Euro Table','360 X-Up','Barspin to Fakie'],
    ['Opposite Barspin','Crankflip','Turndown','Lookback','360 No Hander','Tailwhip to Fakie','540 Barspin','Ice Pick Grind'],
    ['720 Barspin','360 Double Bar','Truck to Whip','Frontflip Bar nur Airbag','Backflip Bar nur Airbag','Flair Bar nur Airbag','Double Tailwhip nur Profi-Setup','Cashroll nur Profi-Setup'],
  ]),
  S('skate','Skateboard','summer','SKATE','#FF4D6D',['Skatepark','Skatehalle'],[
    ['Basics',['Sicher abspringen','Ollie','Kickturn','Manual kurz','Drop-in niedrig','Fakie fahren','Frontside 180','Backside 180']],
    ['Aufsteiger',['Pop Shove-it','Frontside Shove-it','Boardslide niedrig','50-50 Grind niedrig','Kickflip','Heelflip','Nollie','Fakie Ollie']],
    ['Fortgeschritten',['Varial Kickflip','Backside Boardslide','Frontside Boardslide','Crooked Grind niedrig','Tre Flip','Hardflip','Bigspin','Kickflip 50-50']],
    ['Pro',['Laser Flip','Bigspin Heelflip','Nollie Flip','Switch Kickflip','Kickflip Boardslide','Tre Flip 50-50','Hardflip Revert','Inward Heelflip']],
  ]),
  S('mtb','Mountainbike','summer','DIRT','#60D394',['Bikepark','Dirtpark','Pumptrack','Trail'],[
    ['Basics',['Bremsen dosieren','Grundposition','Pumpen','Bunny Hop','kleiner Drop','Anlieger sauber','kleiner Table','Trackstand kurz']],
    ['Aufsteiger',['Manual kurz','Bunny Hop über Hindernis','kleiner Step-up','No Footer','Tabletop klein','größerer Drop kontrolliert','Step-down klein','Anlieger schnell']],
    ['Fortgeschritten',['Whip klein','One Hander','No Hander','Manual lang','Step-up größer','Step-down größer','360° nur geeignetes Setup','Nac Nac']],
    ['Pro',['Suicide No Hander','Tailwhip nur geeignetes Bike','Backflip nur Airbag/Foam','Frontflip nur Airbag/Foam','360 Whip nur Profi-Setup','Flip Whip nur Airbag/Foam','Cork nur Airbag','Pro-Line kontrolliert']],
  ]),
  S('trampoline','Trampolin','summer','JUMP','#B388FF',['Sprunghalle','Outdoor-Trampolinanlage'],[
    ['Basics',['Sicher landen','Strecksprung','Hocksprung','Sitzlandung','Halbe Drehung','Rückensprung','Bauchsprung','360°']],
    ['Aufsteiger',['Kaboom Basis','Frontflip mit Trainer/Foam','Barani','Back 360','Front 360','Cody Vorbereitung','Rudolph Vorbereitung','Halber Schraubensalto']],
    ['Fortgeschritten',['Backflip mit Trainer/Foam','Cody mit Trainer','Rudy','Full Twist mit Trainer','Front 540','Back 540','Kaboom Front','Kaboom Back']],
    ['Pro',['Double Front nur Profi-Setup','Double Back nur Profi-Setup','Full-in nur Profi-Setup','Triffis nur Profi-Setup','Double Cody nur Profi-Setup','Double Full nur Profi-Setup','Rudy Out nur Profi-Setup','Wettkampfserie']],
  ]),
  S('tramp-scooter','Trampolin-Scooter','summer','TRAMP','#FF8FAB',['Halle mit Airbag','Trampolinhalle mit expliziter Scooter-Erlaubnis'],[
    ['Basics',['Nur freigegebene Anlage nutzen','Gerade Sprünge','Deck kontrollieren','180°','No Footer','One Hander','X-Up','Barspin']],
    ['Aufsteiger',['Tailwhip','Heelwhip','360°','Barspin to Fakie','Whip to Fakie','No Hander','Can Can','Double Whip Vorbereitung']],
    ['Fortgeschritten',['Double Whip','Fingerwhip','Bri Flip','Whip Bar','Bar Whip','540°','Heel Rewind','Kickless']],
    ['Pro',['Buttercup','Double Fingerwhip','Triple Whip','720°','Frontflip nur Airbag','Backflip nur Airbag','Flair nur Airbag','Flip Whip nur Airbag']],
  ]),
  S('parkour','Parkour','summer','VAULT','#FFD166',['Parkour-Park','offiziell erlaubter Urban-Spot'],[
    ['Basics',['Sichere Landung','Rolle','Präzisionssprung niedrig','Safety Vault','Step Vault','Balance Walk','Cat Hang niedrig','kleiner Gap-Sprung']],
    ['Aufsteiger',['Speed Vault','Lazy Vault','Kong klein','Wall Run niedrig','Cat Leap niedrig','Tic Tac niedrig','Turn Vault','Underbar']],
    ['Fortgeschritten',['Dash Vault','Kong Precision niedrig','Tic Tac','Cat Leap','Wall Spin mit Matten','Kong to Precision','Wall Run to Cat','Reverse Vault']],
    ['Pro',['Double Kong nur Halle','Sideflip nur Halle/Matte','Frontflip nur Halle/Matte','Wall Flip nur Halle/Matte','Kong Gainer nur Profi-Setup','Castaway nur Halle','Cork nur Halle','Große Gaps nur offizielles Training']],
  ]),
  S('diving','Turmspringen','summer','SPLASH','#4CC9F0',['Bad mit Sprungturm','Bad mit Sprungbrett'],[
    ['Basics',['Wassertiefe und Freigabe prüfen','Fußsprung 1 m','Kopfsprung 1 m nur nach Einweisung','gestreckter Sprung 1 m','Fußsprung 3 m','Kopfsprung 3 m nur nach Einweisung','Hocksprung 1 m','Drehung 1 m']],
    ['Aufsteiger',['Salto vorwärts 1 m','Auerbach einfach 1 m','Schraube 1 m','Salto rückwärts 1 m','3-m-Technik','Salto vorwärts 3 m','einfache Schraube 3 m','Auerbach 3 m']],
    ['Fortgeschritten',['Rückwärtssalto 3 m','Schraubensalto 3 m','5 m nur bei Freigabe','Kombination mit Trainer','1½ Salto nur Training','Auerbachsalto nur Training','5-m-Technik','Schraubenkombination']],
    ['Pro',['7,5 m nur offiziell freigegeben','10 m nur offiziell freigegeben','Doppelsalto nur Training','Mehrfachschraube nur Training','Wettkampfkombination','10-m-Technik mit Trainer','Doppel Auerbach nur Training','Pro-Serie']],
  ]),
  S('freeski','Freeski','winter','CARVE','#8ECAE6',['Snowpark','Skigebiet mit Freestyle-Bereich'],[
    ['Basics',['Sicher anhalten','Switch fahren','kleiner Straight Air','Box gerade','180°','Safety Grab','Switch 180','kleiner Side Hit']],
    ['Aufsteiger',['360°','Muten Grab','Japan Grab','Box 50-50','Box Slide','Switch 360','Tail Grab','Nose Grab']],
    ['Fortgeschritten',['540°','Rail Slide niedrig','Cork 360 nur geeignetes Setup','Switch 540','540 Grab','270 onto Box','360 off Box','Flat 540']],
    ['Pro',['720°','900°','Bio/Cork nur Parktraining','Switch 720','Cork 720 nur Airbag','Double nur Airbag/Pro-Line','Rail Transfer','Pro-Line sauber']],
  ]),
  S('snowboard','Snowboard','winter','SHRED','#90E0EF',['Snowpark','Skigebiet mit Freestyle-Bereich'],[
    ['Basics',['Sicher anhalten','Switch fahren','Ollie','kleiner Straight Air','50-50 Box','180°','Indy Grab','Switch 180']],
    ['Aufsteiger',['Boardslide Box','Nosepress Box','Tailpress Box','360°','Method Grab','Frontside 360','Backside 360','Box 180 off']],
    ['Fortgeschritten',['Boardslide Rail niedrig','540°','Switch 360','Cab 360','360 Grab','270 onto Box','Rail 180 off','Butter Combo']],
    ['Pro',['720°','900°','Switch 540','Cork nur Parktraining','Double nur Airbag/Pro-Line','Cab 720','Rail Transfer','Pro-Line sauber']],
  ]),
  S('snowscoot','Snowscoot','winter','SNOW','#A8DADC',['Snowpark','Skigebiet mit Snowscoot-Erlaubnis'],[
    ['Basics',['Pisten- und Liftfreigabe prüfen','Sicher bremsen','Kurven kontrollieren','kleiner Hop','180° auf flach','Bunny Hop','kleiner Table','No Footer']],
    ['Aufsteiger',['360°','kleine Box nur erlaubt','Barspin','One Hander','größerer Table','180 off Box','Manual kurz','Tail Tap']],
    ['Fortgeschritten',['540°','Grind nur freigegeben','Tailwhip nur geeignetes Setup','Barspin to 360','No Hander','Whip Vorbereitung','Box Combo','Step-up']],
    ['Pro',['720°','Whip-Kombi','Backflip nur Airbag','Frontflip nur Airbag','Pro-Line nur freigegeben','360 Whip nur geeignetes Setup','Flip Bar nur Airbag','Große Kicker nur Training']],
  ]),
  S('snowbike','Snowbike','winter','FROST','#BDE0FE',['Snowpark','Skigebiet mit Snowbike-Erlaubnis'],[
    ['Basics',['Pisten- und Liftfreigabe prüfen','Sicher bremsen','Kurven kontrollieren','kleiner Hop','Grundposition','Pumpen in Wellen','kleiner Table','180°']],
    ['Aufsteiger',['Manual kurz','No Footer','One Hander','größerer Table','Step-up','Step-down','360°','Whip klein']],
    ['Fortgeschritten',['No Hander','Nac Nac','größerer Whip','540°','Step-up größer','Tabletop','360 One Hander','Pro-Line Vorbereitung']],
    ['Pro',['Tailwhip nur geeignetes Bike','Backflip nur Airbag','Frontflip nur Airbag','Pro-Line nur freigegeben','360 Whip nur Profi-Setup','Flip Bar nur Airbag','Cork nur Airbag','Große Kicker nur Training']],
  ]),
  S('fitness','Fitness','both','POWER','#F4A261',['Calisthenics-Anlage'],[
    ['Basics',['Saubere Kniebeuge','Liegestütz','Dead Hang','Plank 30 s','Ausfallschritt','Hollow Hold','Scapula Pull','Knieheben']],
    ['Aufsteiger',['Klimmzug','Dips','Hanging Knee Raise','Pistol Squat assistiert','L-Sit Tuck','Negative Pull-ups','Pike Push-up','Skin the Cat Vorbereitung']],
    ['Fortgeschritten',['Muscle-up Progression','Toes to Bar','L-Sit','Archer Pull-up','Handstand an Wand','Dragon Flag Progression','Front Lever Tuck','Back Lever Tuck']],
    ['Pro',['Strict Muscle-up','Front Lever Progression','Back Lever Progression','Handstand Push-up','Human Flag Progression','Freier Handstand','One Arm Pull-up Progression','Planche Progression']],
  ]),
];

export const SPORT_BY_ID = Object.fromEntries(SPORTS.map((s) => [s.id, s]));
export const seasonForMonth = (month = new Date().getMonth()) => (month >= 10 || month <= 2 ? 'winter' : 'summer');
export const sportsForSeason = (season) => SPORTS.filter((s) => s.season === season || s.season === 'both');
export const allTricks = (sport) => sport.levels.flatMap(([level, tricks]) => tricks.map((name) => ({ name, level })));
