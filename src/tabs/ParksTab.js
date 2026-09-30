import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Card, Button, Field, Muted, Notice, Pill, Title } from '../components/UI';
import AppIcon from '../components/AppIcon';
import { Grad } from '../design/Grad';
import { RampArt } from '../design/art';
import { Bubble, IconTile, SecondaryButton, Segmented, Tag } from '../design/kit';
import { NIGHT_MAP_STYLE } from '../design/mapStyle';
import { COLORS, FONTS, GRADIENTS, RADII, SHADOWS, TYPE } from '../theme';
import { localGet, localSet } from '../storage';
import { aiConfigured, searchParksAI, transitAI, weatherAI } from '../services/ai';
import { openGoogleImages, openGoogleMapsSearch, openTransitRoute } from '../services/maps';

const DEFAULT_REGION = {
  latitude: 51.1657,
  longitude: 10.4515,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

export default function ParksTab({ sport, profile, rider = null }) {
  const [parks, setParks] = useState([]);
  const [saved, setSaved] = useState({});
  const [covered, setCovered] = useState(false);
  const [floodlight, setFloodlight] = useState(false);
  const [view, setView] = useState('map');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [travelOpen, setTravelOpen] = useState(null);
  const [travelText, setTravelText] = useState('');
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    (async () => {
      const loaded = await localGet(`parks:${sport.id}`, []);
      setParks(loaded);
      setSaved(await localGet(`parks:saved:${sport.id}`, {}));

      if (loaded[0]?.latitude && loaded[0]?.longitude) {
        setRegion({
          latitude: +loaded[0].latitude,
          longitude: +loaded[0].longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        });
      }
    })();
  }, [sport.id]);

  const filtered = useMemo(
    () =>
      parks.filter(
        (park) =>
          (!covered || park.indoor === true) &&
          (!floodlight || park.flutlicht === true)
      ),
    [parks, covered, floodlight]
  );

  const search = async () => {
    setBusy(true);
    setNotice('');

    try {
      if (!aiConfigured()) {
        throw new Error(
          'Für die echte KI-Websuche zuerst den KI-Proxy starten. Google Maps kannst du trotzdem direkt öffnen.'
        );
      }

      const result = await searchParksAI(
        sport,
        profile.home,
        {
          covered,
          floodlight,
        }
      );

      const valid = (
        Array.isArray(result) ? result : []
      ).filter(
        (entry) =>
          Number.isFinite(+entry.latitude) &&
          Number.isFinite(+entry.longitude)
      );

      setParks(valid);
      await localSet(`parks:${sport.id}`, valid);

      if (valid[0]) {
        setRegion({
          latitude: +valid[0].latitude,
          longitude: +valid[0].longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        });
      }

      if (!valid.length) {
        setNotice(
          'Die Suche hat keine verwertbaren Anlagen mit Koordinaten geliefert.'
        );
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  const googleSearch = () => {
    openGoogleMapsSearch(
      `${sport.parkTypes.join(' oder ')} ${sport.name} ${profile.home}`
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
      const result = await weatherAI(
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

  const viewSwitch = (
    <Segmented
      items={[
        { key: 'map', label: 'Karte', icon: 'map' },
        { key: 'list', label: 'Liste', icon: 'list' },
      ]}
      value={view}
      onChange={(next) => setView(next)}
      style={styles.viewSwitch}
    />
  );

  return (
    <View style={styles.stack}>
      {view === 'map' ? (
        <View style={styles.mapHero}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            region={region}
            onRegionChangeComplete={setRegion}
            customMapStyle={NIGHT_MAP_STYLE}
          >
            {filtered.map((park, index) => (
              <Marker
                key={`${park.name}-${index}`}
                coordinate={{
                  latitude: +park.latitude,
                  longitude: +park.longitude,
                }}
                title={park.name}
                description={`${park.typ || ''} · ${park.erlaubnis || ''}`}
                pinColor={saved[`${park.name}|${park.ort}`] ? COLORS.lime : COLORS.cyan}
              />
            ))}
          </MapView>
          <View pointerEvents="none" style={styles.mapFade}>
            <Grad colors={['rgba(3,5,10,0)', 'rgba(3,5,10,0.85)', '#03050A']} locations={[0, 0.55, 1]} angle={180} />
          </View>
          <View pointerEvents="none" style={styles.mapTitle}>
            <Text style={styles.heroTitle}>Parks</Text>
            <Text style={[TYPE.body, { marginTop: 8 }]}>Karte, Spots &amp; Wetter</Text>
          </View>
          {viewSwitch}
        </View>
      ) : (
        <View style={styles.listHero}>
          <RampArt height={236} />
          <View pointerEvents="none" style={styles.mapTitle}>
            <Text style={styles.heroTitle}>Parks</Text>
            <Text style={[TYPE.body, { marginTop: 8 }]}>Karte, Spots &amp; Wetter</Text>
          </View>
          {viewSwitch}
        </View>
      )}

      {rider}

      {notice ? (
        <Notice tone="pink">{notice}</Notice>
      ) : null}

      <Card>
        <View style={styles.row}>
          <IconTile name="map" size={46} iconSize={22} gradient={{ colors: ['#9CCBFF', '#2A63B8'], angle: 145 }} color="#071A36" radius={16} />
          <View style={{ flex: 1, gap: 4 }}>
            <Title>Google Maps</Title>
            <Text style={TYPE.label} numberOfLines={2}>
              Passende Anlagen für {sport.name}: {sport.parkTypes.join(', ')}.
            </Text>
          </View>
        </View>

        <Button
          title="Websuche mit Google Maps"
          icon="pin"
          onPress={googleSearch}
        />

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

        <SecondaryButton
          title={
            busy
              ? 'Suche läuft…'
              : 'KI-Anlagensuche'
          }
          icon="chip"
          tone="cyan"
          disabled={busy}
          onPress={search}
        />
        <Text style={[TYPE.caption, { textAlign: 'center' }]}>
          Derzeit nicht verfügbar – nutze Google Maps.
        </Text>
      </Card>

      <Card>
        <View style={styles.headRow}>
          <Title>Wetter am Wohnort</Title>
          <Tag label={weather ? 'KI' : 'nicht verfügbar'} tone={weather ? 'cyan' : 'neutral'} />
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
            {weather.schneehoehe || weather.pistenzustand ? (
              <View style={styles.wrap}>
                {weather.schneehoehe ? (
                  <Tag label={`Schneehöhe: ${String(weather.schneehoehe)}`} tone="cyan" icon="snow" />
                ) : null}
                {weather.pistenzustand ? (
                  <Tag label={`Piste: ${String(weather.pistenzustand)}`} tone="cyan" />
                ) : null}
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
            Die Wetterabfrage braucht KI-Websuche. Mit der aktuellen
            Cloudflare-KI ist sie derzeit nicht verfügbar.
          </Muted>
        )}

        <SecondaryButton
          title="Wetter aktuell prüfen"
          icon="reset"
          disabled={busy}
          onPress={runWeather}
        />
      </Card>

      <View style={styles.headRow}>
        <Text style={[TYPE.head, { fontSize: 22, lineHeight: 26 }]}>Spots in der Nähe</Text>
        <Text style={TYPE.label}>{filtered.length} Treffer</Text>
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
              Such reale Parks und Anlagen direkt in Google Maps.
            </Muted>
            <SecondaryButton
              title="In Google Maps öffnen"
              icon="pin"
              tone="cyan"
              onPress={googleSearch}
            />
          </View>
        </View>
      ) : view === 'map' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          snapToInterval={328}
          decelerationRate="fast"
          style={{ marginHorizontal: -18 }}
          contentContainerStyle={styles.carousel}
        >
          {filtered.map((park, index) => renderPark(park, index, true))}
        </ScrollView>
      ) : (
        filtered.map((park, index) => renderPark(park, index, false))
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
  viewSwitch: {
    position: 'absolute',
    right: 18,
    top: 14,
    boxShadow: '0 12px 30px -10px rgba(0,0,0,0.8)',
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
