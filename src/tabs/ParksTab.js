import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Card, Button, Field, Muted, Notice, Pill, Title } from '../components/UI';
import PageHero from '../components/PageHero';
import { COLORS } from '../theme';
import { localGet, localSet } from '../storage';
import { aiConfigured, searchParksAI, transitAI, weatherAI } from '../services/ai';
import { openGoogleImages, openGoogleMapsSearch, openTransitRoute } from '../services/maps';

const DEFAULT_REGION = {
  latitude: 51.1657,
  longitude: 10.4515,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

export default function ParksTab({ sport, profile }) {
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

  return (
    <View style={styles.stack}>
      <PageHero
        type="parks"
        title="Parks"
        subtitle="MAP · SPOTS · WETTER"
        accent={COLORS.ice}
      />

      {notice ? (
        <Notice>{notice}</Notice>
      ) : null}

      <Card variant="blue">
        <Title color={sport.color}>
          Google Maps
        </Title>

        <Muted>
          Passende Anlagen für {sport.name}:
          {' '}
          {sport.parkTypes.join(', ')}.
        </Muted>

        <View style={styles.wrap}>
          <Pill
            label="Karte"
            active={view === 'map'}
            onPress={() => setView('map')}
          />
          <Pill
            label="Liste"
            active={view === 'list'}
            onPress={() => setView('list')}
          />
        </View>

        <View style={styles.filterGrid}>
          <View style={styles.filterCard}>
            <View>
              <Text style={styles.filterTitle}>
                Überdacht
              </Text>
              <Muted>Nur Indoor-Spots</Muted>
            </View>
            <Switch
              value={covered}
              onValueChange={setCovered}
              trackColor={{
                true: COLORS.volt,
              }}
            />
          </View>

          <View style={styles.filterCard}>
            <View>
              <Text style={styles.filterTitle}>
                Flutlicht
              </Text>
              <Muted>Für Abendsessions</Muted>
            </View>
            <Switch
              value={floodlight}
              onValueChange={setFloodlight}
              trackColor={{
                true: COLORS.ice,
              }}
            />
          </View>
        </View>

        <Button
          title={
            busy
              ? 'Suche läuft…'
              : 'Echte Anlagen per KI-Websuche'
          }
          disabled={busy}
          onPress={search}
        />

        <Button
          title="In Google Maps suchen"
          tone="ice"
          onPress={googleSearch}
        />
      </Card>

      <Card variant="cyan">
        <Title small>Wetter am Wohnort</Title>

        <Button
          title="Wetter aktuell prüfen"
          tone="dark"
          disabled={busy}
          onPress={runWeather}
        />

        {weather ? (
          <View style={styles.weather}>
            <View style={styles.weatherRow}>
              <Text style={styles.weatherLabel}>
                Jetzt
              </Text>
              <Text style={styles.weatherValue}>
                {String(weather.jetzt || '–')}
              </Text>
            </View>

            <View style={styles.weatherRow}>
              <Text style={styles.weatherLabel}>
                Später
              </Text>
              <Text style={styles.weatherValue}>
                {String(weather.spaeter || '–')}
              </Text>
            </View>

            <View style={styles.weatherRow}>
              <Text style={styles.weatherLabel}>
                Morgen
              </Text>
              <Text style={styles.weatherValue}>
                {String(weather.morgen || '–')}
              </Text>
            </View>

            <View style={styles.weatherAdvice}>
              <Text style={styles.body}>
                {String(
                  weather.empfehlung || '–'
                )}
              </Text>
            </View>

            {weather.schneehoehe ? (
              <Text style={styles.body}>
                Schneehöhe:
                {' '}
                {String(weather.schneehoehe)}
              </Text>
            ) : null}

            {weather.pistenzustand ? (
              <Text style={styles.body}>
                Piste:
                {' '}
                {String(weather.pistenzustand)}
              </Text>
            ) : null}

            {weather.nass === true ? (
              <Muted>
                Es ist nass: „nur überdacht“
                wurde automatisch aktiviert.
              </Muted>
            ) : null}
          </View>
        ) : (
          <Muted>
            Datum und aktuelle Uhrzeit werden
            bei der Wetterabfrage mitgeschickt.
          </Muted>
        )}
      </Card>

      {view === 'map' ? (
        <Card
          variant="night"
          style={{
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
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
                pinColor={sport.color}
              />
            ))}
          </MapView>
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <Card variant="night">
          <Muted>
            Noch keine Park-Liste. Starte die
            KI-Websuche oder öffne die passende
            Suche direkt in Google Maps.
          </Muted>
        </Card>
      ) : (
        filtered.map((park, index) => {
          const id = `${park.name}|${park.ort}`;
          const favorite = saved[id];

          return (
            <Card
              key={`${id}${index}`}
              variant={
                index % 2 === 0
                  ? 'blue'
                  : 'purple'
              }
            >
              <Pressable
                onPress={() =>
                  openGoogleImages(
                    `${park.name} ${park.ort} ${sport.name}`
                  )
                }
              >
                <Title
                  small
                  color={sport.color}
                >
                  {park.name}
                </Title>

                <Muted>
                  {park.ort}
                  {' · '}
                  {park.typ}
                  {' · '}
                  {park.entfernungKm ?? '?'} km
                  {park.himmelsrichtung
                    ? ` · ${park.himmelsrichtung}`
                    : ''}
                </Muted>
              </Pressable>

              <Text style={styles.body}>
                {park.ausstattung}
              </Text>

              <Text style={styles.body}>
                {park.begruendung}
              </Text>

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

              <View style={styles.wrap}>
                <Pill
                  label={
                    park.indoor
                      ? 'Indoor'
                      : 'Outdoor'
                  }
                  active={false}
                />
                <Pill
                  label={
                    park.flutlicht === true
                      ? 'Flutlicht'
                      : park.flutlicht === false
                        ? 'Ohne Flutlicht'
                        : 'Flutlicht ?'
                  }
                  active={false}
                />
              </View>

              <Button
                title={
                  favorite
                    ? 'Gemerkt'
                    : 'Merken'
                }
                tone="dark"
                onPress={() =>
                  toggleSave(park)
                }
              />

              {favorite ? (
                <>
                  <Text style={styles.label}>
                    Bewertung
                  </Text>

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
                        >
                          <Text
                            style={[
                              styles.star,
                              value <=
                                favorite.rating && {
                                color:
                                  COLORS.volt,
                              },
                            ]}
                          >
                            ★
                          </Text>
                        </Pressable>
                      )
                    )}
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

              <View style={styles.wrap}>
                <Button
                  title="Bilder"
                  compact
                  tone="ice"
                  onPress={() =>
                    openGoogleImages(
                      `${park.name} ${park.ort} ${sport.name}`
                    )
                  }
                />

                <Button
                  title="Anreise"
                  compact
                  tone="dark"
                  onPress={() =>
                    setTravelOpen(
                      travelOpen === id
                        ? null
                        : id
                    )
                  }
                />
              </View>

              {travelOpen === id ? (
                <View style={styles.travel}>
                  <Button
                    title="Google Maps · Öffis"
                    onPress={() =>
                      openTransitRoute(
                        profile.home,
                        `${park.name}, ${park.ort}`
                      )
                    }
                  />

                  <Button
                    title="Zug/Bus per KI prüfen"
                    tone="dark"
                    onPress={() =>
                      runTransit(
                        park,
                        id
                      )
                    }
                  />

                  {travelText ? (
                    <Text style={styles.body}>
                      {travelText}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </Card>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterGrid: {
    gap: 8,
  },
  filterCard: {
    minHeight: 62,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    borderRadius: 17,
    backgroundColor: '#09131D',
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTitle: {
    color: COLORS.text,
    fontSize: 14.5,
    fontWeight: '900',
  },
  map: {
    height: 360,
    width: '100%',
  },
  body: {
    color: COLORS.text,
    lineHeight: 21,
  },
  weather: {
    gap: 7,
  },
  weatherRow: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    backgroundColor: '#09131D',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherLabel: {
    color: COLORS.muted,
    fontWeight: '800',
  },
  weatherValue: {
    color: COLORS.text,
    fontWeight: '900',
    maxWidth: '70%',
    textAlign: 'right',
  },
  weatherAdvice: {
    padding: 11,
    borderRadius: 14,
    backgroundColor: `${COLORS.ice}0D`,
    borderWidth: 1,
    borderColor: `${COLORS.ice}33`,
  },
  stars: {
    flexDirection: 'row',
    gap: 7,
  },
  star: {
    fontSize: 28,
    color: '#3A5168',
  },
  label: {
    color: COLORS.muted,
    fontWeight: '800',
  },
  travel: {
    gap: 8,
    backgroundColor: '#09131D',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
  },
});
