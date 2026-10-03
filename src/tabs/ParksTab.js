import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Card, Button, Field, Muted, Notice, Pill, Title } from '../components/UI';
import AppIcon from '../components/AppIcon';
import { Grad } from '../design/Grad';
import { RampArt } from '../design/art';
import { Bubble, IconTile, SecondaryButton, Segmented, Tag } from '../design/kit';
import { COLORS, FONTS, GRADIENTS, RADII, SHADOWS, TYPE } from '../theme';
import { localGet, localSet } from '../storage';
import { transitAI } from '../services/ai';
import { getWeather } from '../services/weather';
import { searchParksInApp } from '../services/parks';
import { openGoogleImages, openTransitRoute } from '../services/maps';



const OBSTACLES_BY_SPORT = {
  scooter: ['Quarter', 'Funbox', 'Spine', 'Bowl', 'Rail', 'Stairs', 'Ledge', 'Bank'],
  skate: ['Quarter', 'Funbox', 'Spine', 'Bowl', 'Rail', 'Stairs', 'Ledge', 'Bank'],
  bmx: ['Quarter', 'Funbox', 'Spine', 'Bowl', 'Rail', 'Dirt Jumps', 'Step-up', 'Wallride'],
  mtb: ['Step-up', 'Step-down', 'Dirt Jumps', 'Pumptrack', 'Drops', 'Tables', 'Wallride'],
  trampoline: ['Airbag', 'Foam Pit', 'Wall Tramp', 'Supertramp'],
  'tramp-scooter': ['Airbag', 'Foam Pit', 'Wall Tramp', 'Supertramp'],
  parkour: ['Rails', 'Walls', 'Precision', 'Vaults', 'Bars', 'Stairs'],
  diving: ['1 m', '3 m', '5 m', '10 m'],
  freeski: ['Rail', 'Box', 'Kicker', 'Halfpipe', 'Step-up'],
  snowboard: ['Rail', 'Box', 'Kicker', 'Halfpipe', 'Step-up'],
  snowscoot: ['Rail', 'Box', 'Kicker', 'Halfpipe', 'Step-up'],
  snowbike: ['Rail', 'Box', 'Kicker', 'Halfpipe', 'Step-up'],
  fitness: ['Pull-up Bars', 'Parallel Bars', 'Monkey Bars'],
};

function obstacleOptionsForSport(sport) {
  return OBSTACLES_BY_SPORT[sport?.id] || ['Rail', 'Ramp', 'Box', 'Stairs'];
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function mapHtml(spots, origin, home) {
  const data = spots.map((park) => ({
    name: String(park.name || 'Spot'),
    typ: String(park.typ || ''),
    ort: String(park.ort || ''),
    latitude: Number(park.latitude),
    longitude: Number(park.longitude),
    entfernungKm: park.entfernungKm == null ? null : Number(park.entfernungKm),
    saved: Boolean(park.saved),
  })).filter((park) => Number.isFinite(park.latitude) && Number.isFinite(park.longitude));

  const start = origin && Number.isFinite(Number(origin.latitude)) && Number.isFinite(Number(origin.longitude))
    ? { latitude: Number(origin.latitude), longitude: Number(origin.longitude), name: String(home || 'Wohnort') }
    : null;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html,body,#map{width:100%;height:100%;margin:0;background:#070D19;overflow:hidden}
    .leaflet-container{font-family:Arial,sans-serif;background:#070D19}
    .leaflet-tile{filter:brightness(.78) saturate(.78) contrast(1.08)}
    .leaflet-control-zoom a{background:#0F182C;color:#F4F6FB;border-color:#18223A}
    .leaflet-control-attribution{background:rgba(3,5,10,.78)!important;color:#AEB8CA!important;font-size:10px!important}
    .leaflet-control-attribution a{color:#9AF0F8!important}
    .leaflet-popup-content-wrapper,.leaflet-popup-tip{background:#0F182C;color:#F4F6FB}
    .leaflet-popup-content{margin:10px 12px;line-height:1.35}
    .name{font-weight:700;font-size:14px;margin-bottom:3px}.meta{font-size:12px;color:#AEB8CA}
    .liveWrap{position:relative;width:26px;height:26px}
    .livePulse{position:absolute;inset:0;border-radius:50%;background:rgba(207,255,58,.28);animation:pulse 1.8s ease-out infinite}
    .liveDot{position:absolute;left:5px;top:5px;width:16px;height:16px;border-radius:50%;background:#CFFF3A;border:4px solid #03050A;box-sizing:border-box;box-shadow:0 0 0 2px rgba(207,255,58,.72)}
    @keyframes pulse{0%{transform:scale(.75);opacity:1}100%{transform:scale(1.85);opacity:0}}
  </style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const spots=${safeJson(data)};
  const origin=${safeJson(start)};
  const map=L.map('map',{zoomControl:true,attributionControl:true,preferCanvas:true});
  let liveMarker=null;
  let liveAccuracy=null;
  let liveLatLng=null;
  const liveIcon=L.divIcon({
    className:'',
    html:'<div class="liveWrap"><div class="livePulse"></div><div class="liveDot"></div></div>',
    iconSize:[26,26],
    iconAnchor:[13,13]
  });
  window.updateLiveLocation=function(lat,lon,accuracy){
    lat=Number(lat); lon=Number(lon); accuracy=Number(accuracy||0);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)) return;
    liveLatLng=[lat,lon];
    if(!liveMarker){
      liveMarker=L.marker(liveLatLng,{icon:liveIcon,zIndexOffset:1000}).addTo(map).bindPopup('<div class="name">Dein Live-Standort</div><div class="meta">Aktuelle Position</div>');
    }else{
      liveMarker.setLatLng(liveLatLng);
    }
    if(accuracy>0){
      if(!liveAccuracy){
        liveAccuracy=L.circle(liveLatLng,{radius:accuracy,color:'#CFFF3A',weight:1,fillColor:'#CFFF3A',fillOpacity:.08,interactive:false}).addTo(map);
      }else{
        liveAccuracy.setLatLng(liveLatLng);
        liveAccuracy.setRadius(accuracy);
      }
    }
  };
  window.focusLiveLocation=function(){
    if(liveLatLng) map.flyTo(liveLatLng,15,{duration:.7});
  };
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'&copy; OpenStreetMap-Mitwirkende'
  }).addTo(map);
  const bounds=[];
  if(origin){
    const ll=[origin.latitude,origin.longitude]; bounds.push(ll);
    L.circleMarker(ll,{radius:9,color:'#9AF0F8',weight:3,fillColor:'#38E1F2',fillOpacity:.95})
      .addTo(map).bindPopup('<div class="name">'+origin.name+'</div><div class="meta">Ausgangspunkt</div>');
  }
  spots.forEach((spot)=>{
    const ll=[spot.latitude,spot.longitude]; bounds.push(ll);
    const color=spot.saved?'#CFFF3A':'#38E1F2';
    const marker=L.circleMarker(ll,{radius:8,color:'#03050A',weight:3,fillColor:color,fillOpacity:1}).addTo(map);
    const dist=spot.entfernungKm==null?'':(' · '+spot.entfernungKm+' km');
    marker.bindPopup('<div class="name">'+spot.name+'</div><div class="meta">'+(spot.ort||spot.typ||'Spot')+dist+'</div>');
  });
  if(bounds.length>1){map.fitBounds(bounds,{padding:[34,34],maxZoom:14});}
  else if(bounds.length===1){map.setView(bounds[0],13);}
  else{map.setView([51.1657,10.4515],6);}
  setTimeout(()=>map.invalidateSize(),250);
</script>
</body>
</html>`;
}

export default function ParksTab({ sport, profile, rider = null }) {
  const mapRef = useRef(null);
  const locationSubscriptionRef = useRef(null);
  const [parks, setParks] = useState([]);
  const [saved, setSaved] = useState({});
  const [covered, setCovered] = useState(false);
  const [floodlight, setFloodlight] = useState(false);
  const [view, setView] = useState('map');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [travelOpen, setTravelOpen] = useState(null);
  const [travelText, setTravelText] = useState('');
  const [weather, setWeather] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [obstaclePrefs, setObstaclePrefs] = useState([]);
  const [liveLocation, setLiveLocation] = useState(null);
  const [locationState, setLocationState] = useState('loading');

  useEffect(() => {
    (async () => {
      const loaded = await localGet(`parks:${sport.id}`, []);
      setParks(loaded);
      setSaved(await localGet(`parks:saved:${sport.id}`, {}));
      setObstaclePrefs([]);
      setOrigin(null);

    })();
  }, [sport.id]);

  useEffect(() => {
    let active = true;

    const startLocation = async () => {
      try {
        setLocationState('loading');
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!active) return;

        if (permission.status !== 'granted') {
          setLocationState('denied');
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (active && current?.coords) {
          setLiveLocation(current.coords);
          setLocationState('live');
        }

        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (position) => {
            if (!active || !position?.coords) return;
            setLiveLocation(position.coords);
            setLocationState('live');
          }
        );
      } catch (error) {
        if (active) setLocationState('error');
      }
    };

    startLocation();

    return () => {
      active = false;
      locationSubscriptionRef.current?.remove?.();
      locationSubscriptionRef.current = null;
    };
  }, []);

  const filtered = useMemo(
    () =>
      parks.filter(
        (park) =>
          (!covered || park.indoor === true) &&
          (!floodlight || park.flutlicht === true)
      ),
    [parks, covered, floodlight]
  );



  const toggleObstacle = (name) => {
    setObstaclePrefs((current) => {
      if (current.includes(name)) {
        return current.filter((item) => item !== name);
      }

      if (current.length >= 3) {
        setNotice('Du kannst höchstens 3 Wunsch-Obstacles gleichzeitig auswählen.');
        return current;
      }

      setNotice('');
      return [...current, name];
    });
  };

  const search = async () => {
    setBusy(true);
    setNotice('');

    try {
      const result = await searchParksInApp(
        sport,
        profile.home,
        obstaclePrefs
      );

      const valid = (result.parks || []).filter(
        (entry) =>
          Number.isFinite(+entry.latitude) &&
          Number.isFinite(+entry.longitude)
      );

      setParks(valid);
      await localSet(`parks:${sport.id}`, valid);

      if (result.origin) {
        setOrigin(result.origin);
      }

      if (!valid.length) {
        setNotice(
          'In der Umgebung wurden keine passenden, öffentlich kartierten Anlagen gefunden.'
        );
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  const mapSource = useMemo(() => {
    const mapSpots = filtered.map((park) => ({
      ...park,
      saved: Boolean(saved[`${park.name}|${park.ort}`]),
    }));
    return mapHtml(mapSpots, origin, profile.home);
  }, [filtered, origin, profile.home, saved]);

  useEffect(() => {
    if (!liveLocation || !mapRef.current) return;

    const lat = Number(liveLocation.latitude);
    const lon = Number(liveLocation.longitude);
    const accuracy = Number(liveLocation.accuracy || 0);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    mapRef.current.injectJavaScript(
      `window.updateLiveLocation && window.updateLiveLocation(${lat}, ${lon}, ${accuracy}); true;`
    );
  }, [liveLocation, view, mapSource]);

  const focusLiveLocation = () => {
    mapRef.current?.injectJavaScript(
      'window.focusLiveLocation && window.focusLiveLocation(); true;'
    );
  };

  const toggleSave = async (park) => {
    const id = `${park.name}|${park.ort}`;
    const next = {
      ...saved,
    };

    if (next[id]) {
      delete next[id];
    } else {
      next[id] = {
        rating: 0,
        note: '',
      };
    }

    setSaved(next);
    await localSet(
      `parks:saved:${sport.id}`,
      next
    );
  };

  const updateSaved = async (park, patch) => {
    const id = `${park.name}|${park.ort}`;

    const next = {
      ...saved,
      [id]: {
        ...(saved[id] || {}),
        ...patch,
      },
    };

    setSaved(next);

    await localSet(
      `parks:saved:${sport.id}`,
      next
    );
  };

  const runWeather = async () => {
    setBusy(true);
    setNotice('');

    try {
      const result = await getWeather(
        profile.home,
        sport
      );

      setWeather(result);

      if (result?.nass === true) {
        setCovered(true);
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  const runTransit = async (park, id) => {
    setTravelOpen(id);
    setTravelText('Suche Verbindung…');

    try {
      setTravelText(
        await transitAI(
          sport,
          profile.home,
          park
        )
      );
    } catch (error) {
      setTravelText(error.message);
    }
  };

  const renderPark = (park, index, carousel) => {
    const id = `${park.name}|${park.ort}`;
    const favorite = saved[id];

    return (
      <View
        key={`${id}${index}`}
        style={[styles.spot, SHADOWS.card, carousel ? { width: 316 } : null]}
      >
        <Grad {...GRADIENTS.card} radius={RADII.card} />
        <Pressable
          onPress={() =>
            openGoogleImages(
              `${park.name} ${park.ort} ${sport.name}`
            )
          }
          style={styles.spotHead}
        >
          <RampArt height={128} colors={index % 2 ? ['#2A1F52', '#0C1A33'] : ['#16305A', '#0C1A33']} />
          <Tag
            label={`${park.entfernungKm ?? '?'} km${park.himmelsrichtung ? ` · ${park.himmelsrichtung}` : ''}`}
            tone="dark"
            style={{ position: 'absolute', left: 14, top: 14 }}
          />
          <Pressable
            onPress={() =>
              toggleSave(park)
            }
            accessibilityRole="button"
            accessibilityLabel={favorite ? 'Gemerkt' : 'Merken'}
            style={[styles.saveBtn, favorite ? styles.saveBtnOn : null]}
          >
            <AppIcon
              name="bookmark"
              size={18}
              color={favorite ? COLORS.onLime : COLORS.text}
              fillOpacity={favorite ? 0.6 : 0.22}
            />
          </Pressable>
        </Pressable>

        <View style={styles.spotBody}>
          <View style={{ gap: 5 }}>
            <Text style={styles.spotName} numberOfLines={2}>{park.name}</Text>
            <Text style={TYPE.label} numberOfLines={2}>
              {park.ort}
              {' · '}
              {park.typ}
            </Text>
          </View>

          <View style={styles.wrap}>
            <Tag label={park.indoor ? 'Indoor' : 'Outdoor'} tone="neutral" icon={park.indoor ? 'roof' : undefined} />
            <Tag
              label={
                park.flutlicht === true
                  ? 'Flutlicht'
                  : park.flutlicht === false
                    ? 'Ohne Flutlicht'
                    : 'Flutlicht ?'
              }
              tone={park.flutlicht === true ? 'cyan' : 'neutral'}
              icon="flood"
            />
          </View>

          {Array.isArray(park.obstacles) && park.obstacles.length ? (
            <View style={styles.wrap}>
              {park.obstacles.slice(0, 4).map((name) => (
                <Tag key={name} label={name} tone="cyan" />
              ))}
            </View>
          ) : null}

          {park.ausstattung ? (
            <Text style={styles.body}>
              {park.ausstattung}
            </Text>
          ) : null}
          {park.begruendung ? (
            <Text style={[styles.body, { color: COLORS.text3 }]}>
              {park.begruendung}
            </Text>
          ) : null}

          <Notice
            tone={
              String(park.erlaubnis || '')
                .includes('unklar')
                ? 'pink'
                : 'volt'
            }
          >
            {park.erlaubnis ||
              'Erlaubnis unklar – vorher anrufen'}
          </Notice>

          {favorite ? (
            <>
              <View style={styles.headRow}>
                <Text style={TYPE.label}>Bewertung</Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map(
                    (value) => (
                      <Pressable
                        key={value}
                        onPress={() =>
                          updateSaved(park, {
                            rating: value,
                          })
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`${value} Sterne`}
                        hitSlop={6}
                      >
                        <AppIcon
                          name="star"
                          size={22}
                          color={value <= favorite.rating ? COLORS.lime : COLORS.mutedNum}
                          fillOpacity={value <= favorite.rating ? 1 : 0.15}
                        />
                      </Pressable>
                    )
                  )}
                </View>
              </View>
              <Field
                value={favorite.note || ''}
                onChangeText={(note) =>
                  updateSaved(park, {
                    note,
                  })
                }
                placeholder="Notiz zum Spot"
                multiline
              />
            </>
          ) : null}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                title="Bilder"
                icon="memories"
                size="sm"
                onPress={() =>
                  openGoogleImages(
                    `${park.name} ${park.ort} ${sport.name}`
                  )
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                title="Anreise"
                icon="train"
                size="sm"
                tone={travelOpen === id ? 'light' : 'default'}
                onPress={() =>
                  setTravelOpen(
                    travelOpen === id
                      ? null
                      : id
                  )
                }
              />
            </View>
          </View>

          {travelOpen === id ? (
            <View style={styles.travel}>
              <Button
                title="Google Maps · Öffis"
                icon="pin"
                compact
                onPress={() =>
                  openTransitRoute(
                    profile.home,
                    `${park.name}, ${park.ort}`
                  )
                }
              />
              <SecondaryButton
                title="Zug/Bus per KI prüfen"
                icon="chip"
                iconColor={COLORS.cyan}
                size="sm"
                onPress={() =>
                  runTransit(
                    park,
                    id
                  )
                }
              />
              {travelText ? (
                <Bubble tone="cyan" style={{ alignSelf: 'stretch' }}>
                  <Text style={styles.body}>
                    {travelText}
                  </Text>
                </Bubble>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  };


  return (
    <View style={styles.stack}>
      <View style={styles.listHero}>
        <RampArt height={236} />
        <View pointerEvents="none" style={styles.mapTitle}>
          <Text style={styles.heroTitle}>Parks</Text>
          <Text style={[TYPE.body, { marginTop: 8 }]}>Spots, Wetter &amp; Karte</Text>
        </View>
      </View>

      {rider}

      {notice ? (
        <Notice tone="pink">{notice}</Notice>
      ) : null}

      <Card>
        <View style={styles.row}>
          <IconTile name="map" size={46} iconSize={22} gradient={{ colors: ['#9CCBFF', '#2A63B8'], angle: 145 }} color="#071A36" radius={16} />
          <View style={{ flex: 1, gap: 4 }}>
            <Title>In-App-Parksuche</Title>
            <Text style={TYPE.label} numberOfLines={3}>
              Suche passende Anlagen für {sport.name}. Treffer erscheinen direkt auf der Karte und in der Liste.
            </Text>
          </View>
        </View>

        <View style={styles.filterGrid}>
          <Pressable
            onPress={() => setCovered(!covered)}
            accessibilityRole="switch"
            accessibilityState={{ checked: covered }}
            style={[styles.filterTile, covered ? styles.filterTileOn : null]}
          >
            {covered ? <Grad {...GRADIENTS.filterOn} radius={RADII.tile} /> : null}
            <View style={styles.headRow}>
              <AppIcon name="roof" size={22} color={covered ? COLORS.cyanText : COLORS.text2} />
              <View style={[styles.switch, covered && styles.switchOn]}>
                <View style={[styles.switchKnob, covered && styles.switchKnobOn]} />
              </View>
            </View>
            <View style={{ gap: 3 }}>
              <Text style={styles.filterTitle}>Überdacht</Text>
              <Text style={[TYPE.label, { fontSize: 11 }]}>Nur Indoor-Spots</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setFloodlight(!floodlight)}
            accessibilityRole="switch"
            accessibilityState={{ checked: floodlight }}
            style={[styles.filterTile, floodlight ? styles.filterTileOn : null]}
          >
            {floodlight ? <Grad {...GRADIENTS.filterOn} radius={RADII.tile} /> : null}
            <View style={styles.headRow}>
              <AppIcon name="flood" size={22} color={floodlight ? COLORS.cyanText : COLORS.text2} />
              <View style={[styles.switch, floodlight && styles.switchOn]}>
                <View style={[styles.switchKnob, floodlight && styles.switchKnobOn]} />
              </View>
            </View>
            <View style={{ gap: 3 }}>
              <Text style={styles.filterTitle}>Flutlicht</Text>
              <Text style={[TYPE.label, { fontSize: 11 }]}>Für Abendsessions</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.obstacleSection}>
          <View style={styles.headRow}>
            <Text style={styles.filterTitle}>Wunsch-Obstacles</Text>
            <Text style={TYPE.label}>optional · max. 3</Text>
          </View>
          <View style={styles.obstacleWrap}>
            {obstacleOptionsForSport(sport).map((name) => (
              <Pill
                key={name}
                label={name}
                active={obstaclePrefs.includes(name)}
                onPress={() => toggleObstacle(name)}
              />
            ))}
          </View>
          <Text style={TYPE.caption}>
            Gewählte Obstacles werden bei der Suche bevorzugt, soweit die Kartendaten sie erkennen.
          </Text>
        </View>

        <Button
          title={busy ? 'Suche läuft…' : 'Parks in After[Dark suchen'}
          icon="pin"
          disabled={busy}
          onPress={search}
        />

        <Text style={[TYPE.caption, { textAlign: 'center' }]}>
          Die Suche bleibt in After[Dark. Kartendaten kommen aus OpenStreetMap.
        </Text>
      </Card>

      <Card>
        <View style={styles.headRow}>
          <Title>Wetter am Wohnort</Title>
          <Tag label={weather ? 'Live' : 'Open-Meteo'} tone="cyan" />
        </View>

        <View style={styles.weatherGrid}>
          {[
            ['Jetzt', weather?.jetzt, 'sun'],
            ['Später', weather?.spaeter, 'cloud'],
            ['Morgen', weather?.morgen, 'weather'],
          ].map(([label, value, icon]) => (
            <View key={label} style={styles.weatherTile}>
              <AppIcon name={icon} size={28} color={icon === 'sun' && weather ? COLORS.warning : COLORS.text2} />
              <Text style={[styles.weatherValue, !weather && { color: COLORS.mutedNum }]} numberOfLines={4}>
                {String(value || '–')}
              </Text>
              <Text style={[TYPE.label, { fontSize: 11 }]}>{label}</Text>
            </View>
          ))}
        </View>

        {weather ? (
          <>
            <Bubble tone="cyan" style={{ alignSelf: 'stretch' }}>
              <Text style={styles.body}>
                {String(
                  weather.empfehlung || '–'
                )}
              </Text>
            </Bubble>
            {weather.schneefall ? (
              <View style={styles.wrap}>
                <Tag label={`Neuschnee: ${String(weather.schneefall)}`} tone="cyan" icon="snow" />
              </View>
            ) : null}
            {weather.nass === true ? (
              <Notice>
                Es ist nass: „nur überdacht“
                wurde automatisch aktiviert.
              </Notice>
            ) : null}
          </>
        ) : (
          <Muted>
            Live-Wetter kommt direkt von Open-Meteo und braucht keinen API-Key.
          </Muted>
        )}

        <SecondaryButton
          title="Wetter aktuell prüfen"
          icon="reset"
          disabled={busy}
          onPress={runWeather}
        />
      </Card>

      <View style={styles.resultsHeader}>
        <View style={styles.headRow}>
          <Text style={[TYPE.head, { fontSize: 22, lineHeight: 26 }]}>Spots in der Nähe</Text>
          <Text style={TYPE.label}>{filtered.length} Treffer</Text>
        </View>

        <Segmented
          items={[
            { key: 'map', label: 'Karte', icon: 'map' },
            { key: 'list', label: 'Liste', icon: 'list' },
          ]}
          value={view}
          onChange={(next) => setView(next)}
          style={styles.bottomViewSwitch}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={[styles.spot, SHADOWS.card]}>
          <Grad {...GRADIENTS.card} radius={RADII.card} />
          <View style={styles.spotHead}>
            <RampArt height={128} />
          </View>
          <View style={styles.spotBody}>
            <Text style={styles.spotName}>Noch keine Spots</Text>
            <Muted>
              Starte oben die In-App-Suche. Treffer erscheinen anschließend hier und auf der großen Karte.
            </Muted>
            <SecondaryButton
              title="Spots suchen"
              icon="pin"
              tone="cyan"
              disabled={busy}
              onPress={search}
            />
          </View>
        </View>
      ) : view === 'map' ? (
        <View style={[styles.resultsMapWrap, SHADOWS.card]}>
          <WebView
            ref={mapRef}
            style={styles.resultsMap}
            originWhitelist={['*']}
            source={{ html: mapSource }}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            setSupportMultipleWindows={false}
            onLoadEnd={() => {
              if (!liveLocation || !mapRef.current) return;
              const lat = Number(liveLocation.latitude);
              const lon = Number(liveLocation.longitude);
              const accuracy = Number(liveLocation.accuracy || 0);
              mapRef.current.injectJavaScript(
                `window.updateLiveLocation && window.updateLiveLocation(${lat}, ${lon}, ${accuracy}); true;`
              );
            }}
          />
          <View pointerEvents="none" style={styles.mapCountBadge}>
            <Text style={styles.mapCountText}>{filtered.length} Spots</Text>
          </View>
          <Pressable
            onPress={focusLiveLocation}
            disabled={!liveLocation}
            style={[styles.liveButton, !liveLocation && styles.liveButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Zu meinem Live-Standort"
          >
            <View style={[styles.liveDotSmall, locationState === 'live' && styles.liveDotSmallOn]} />
            <Text style={styles.liveButtonText}>
              {locationState === 'live'
                ? 'Mein Standort'
                : locationState === 'denied'
                  ? 'Standort aus'
                  : locationState === 'error'
                    ? 'Standortfehler'
                    : 'Standort…'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.listResults}>
          {filtered.map((park, index) => renderPark(park, index, false))}
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  mapHero: {
    height: 430,
    marginHorizontal: -18,
    backgroundColor: '#070D19',
    overflow: 'hidden',
  },
  listHero: {
    height: 236,
    marginHorizontal: -18,
    overflow: 'hidden',
  },
  mapFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  mapTitle: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 24,
  },
  heroTitle: {
    ...TYPE.display,
    fontSize: 96,
    lineHeight: 92,
    letterSpacing: -1.2,
  },
  bottomViewSwitch: {
    alignSelf: 'stretch',
  },
  resultsHeader: {
    gap: 10,
  },
  resultsMapWrap: {
    height: 620,
    borderRadius: RADII.card,
    overflow: 'hidden',
    backgroundColor: '#070D19',
  },
  resultsMap: {
    width: '100%',
    height: '100%',
  },
  mapCountBadge: {
    position: 'absolute',
    left: 16,
    top: 16,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    backgroundColor: 'rgba(3,5,10,0.78)',
  },
  mapCountText: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
    fontSize: 12,
  },
  liveButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(3,5,10,0.84)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveButtonDisabled: {
    opacity: 0.6,
  },
  liveButtonText: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
    fontSize: 12,
  },
  liveDotSmall: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.mutedNum,
  },
  liveDotSmallOn: {
    backgroundColor: COLORS.lime,
    boxShadow: '0 0 10px rgba(207,255,58,0.9)',
  },
  listResults: {
    gap: 14,
  },
  obstacleSection: {
    gap: 10,
    paddingTop: 2,
  },
  obstacleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  filterTile: {
    flex: 1,
    height: 96,
    borderRadius: RADII.tile,
    backgroundColor: COLORS.tile,
    padding: 14,
    justifyContent: 'space-between',
  },
  filterTileOn: {
    boxShadow: '0 14px 30px -16px rgba(56,225,242,0.6)',
  },
  filterTitle: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
    fontSize: 14,
  },
  switch: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.midnight,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: COLORS.cyan,
  },
  switchKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: 3,
    backgroundColor: COLORS.mutedNum,
  },
  switchKnobOn: {
    marginLeft: 19,
    backgroundColor: '#04202A',
  },
  weatherGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  weatherTile: {
    flex: 1,
    borderRadius: RADII.tile,
    backgroundColor: COLORS.tile,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 10,
  },
  weatherValue: {
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 17,
  },
  carousel: {
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  spot: {
    borderRadius: RADII.card,
    backgroundColor: COLORS.midnight,
    overflow: 'hidden',
  },
  spotHead: {
    height: 128,
  },
  saveBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(3,5,10,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnOn: {
    backgroundColor: COLORS.lime,
    boxShadow: '0 10px 22px -8px rgba(207,255,58,0.8)',
  },
  spotBody: {
    padding: 18,
    gap: 12,
  },
  spotName: {
    ...TYPE.head,
    fontSize: 21,
    lineHeight: 24,
  },
  body: {
    fontFamily: FONTS.body,
    color: '#C9D1DE',
    fontSize: 13.5,
    lineHeight: 20,
  },
  stars: {
    flexDirection: 'row',
    gap: 6,
  },
  travel: {
    gap: 8,
    padding: 12,
    borderRadius: 20,
    backgroundColor: COLORS.well,
  },
});
