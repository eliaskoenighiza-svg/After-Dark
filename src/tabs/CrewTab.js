import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import AppIcon from '../components/AppIcon';
import { Avatar, Bubble, IconTile, SecondaryButton, Tag } from '../design/kit';
import { BadgeVideo } from '../design/badges';
import { Card, Button, Field, Muted, Notice, Pill, Title } from '../components/UI';
import { COLORS, FONTS, GRADIENTS, RADII, TYPE } from '../theme';
import { EmptyScene } from '../design/ambient';
import { dumpAllData, localGet, localSet, restoreAllData, sharedGet, sharedSet } from '../storage';
import { weeklyReviewAI } from '../services/ai';
import { cloudConfigured, createCrewCloud, getMyCrews, joinCrewCloud, syncCloudProfile, setMySpotCloud, clearMySpotCloud, getActiveCrewSpotsCloud, syncMyStatsCloud, getCrewLeaderboardCloud, setMyWeeklyScoreCloud, getWeeklyBattleLeaderboardCloud, getPreviousWeekWinnerCloud, getWeeklyGoalsCloud, uploadCrewSpotPhotoCloud, getCrewSpotPhotosCloud, deleteMyCrewSpotPhotoCloud } from '../services/supabase';
import { openEmergency } from '../services/maps';
import { pickAndResizeImage, persistImage } from '../services/media';

const weekKey = () => { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.toISOString().slice(0, 10); };

export default function CrewTab({ profile, sport, stats }) {
  const [crewName, setCrewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [cloudCrews, setCloudCrews] = useState([]);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudNotice, setCloudNotice] = useState('');
  const [spot, setSpot] = useState('');
  const [outside, setOutside] = useState([]);
  const [activeCrewId, setActiveCrewId] = useState(null);
  const [cloudOutside, setCloudOutside] = useState([]);
  const [cloudLeaderboard, setCloudLeaderboard] = useState([]);
  const [leaderboardBusy, setLeaderboardBusy] = useState(false);
  const [leaderboardNotice, setLeaderboardNotice] = useState('');
  const [presenceBusy, setPresenceBusy] = useState(false);
  const [presenceNotice, setPresenceNotice] = useState('');
  const [board, setBoard] = useState({});
  const [contact, setContact] = useState('');
  const [backup, setBackup] = useState('');
  const [restore, setRestore] = useState('');
  const [notice, setNotice] = useState('');
  const [review, setReview] = useState('');
  const [sharedSpots, setSharedSpots] = useState([]);
  const [cloudSpotPhotos, setCloudSpotPhotos] = useState([]);
  const [photoUserId, setPhotoUserId] = useState(null);
  const [photosBusy, setPhotosBusy] = useState(false);
  const [photosNotice, setPhotosNotice] = useState('');
  const [weekly, setWeekly] = useState({ members: {} });
  const [previousWinner, setPreviousWinner] = useState(null);
  const [cloudWeekly, setCloudWeekly] = useState([]);
  const [cloudPreviousWinner, setCloudPreviousWinner] = useState(null);
  const [weeklyNotice, setWeeklyNotice] = useState('');
  const [cloudGoals, setCloudGoals] = useState([]);
  const [goalsNotice, setGoalsNotice] = useState('');
  const [goals, setGoals] = useState({});

  const loadLocalCrew = async () => {
    const now = Date.now();
    const out = (await sharedGet('crew:outside', [])).filter((x) => x.until > now);
    setOutside(out);
    await sharedSet('crew:outside', out);
    setBoard(await sharedGet('crew:leaderboard', {}));
    setSharedSpots(await sharedGet('crew:parkspots', []));
    setGoals(await sharedGet(`crew:goals:${weekKey()}`, {}));
    setPreviousWinner(await sharedGet('crew:weekly:previousWinner', null));
    setWeekly(await sharedGet(`crew:weekly:${weekKey()}`, { members: {} }));
  };

  const refreshCloudCrews = async () => {
    if (!cloudConfigured()) return;
    setCloudBusy(true);
    const profileResult = await syncCloudProfile(profile.nickname);
    if (!profileResult.ok) {
      setCloudNotice(profileResult.error);
      setCloudBusy(false);
      return;
    }
    const result = await getMyCrews();
    if (result.ok) {
      const crews = result.crews || [];
      setCloudCrews(crews);
      setCloudNotice('');
      setActiveCrewId((current) => current && crews.some((c) => c.id === current) ? current : (crews[0]?.id || null));
    } else {
      setCloudNotice(result.error);
    }
    setCloudBusy(false);
  };

  const refreshPresence = async (crewId = activeCrewId) => {
    if (!crewId || !cloudConfigured()) { setCloudOutside([]); return; }
    const result = await getActiveCrewSpotsCloud(crewId);
    if (result.ok) {
      setCloudOutside(result.spots || []);
      setPresenceNotice('');
    } else {
      setPresenceNotice(result.error);
    }
  };


  const refreshLeaderboard = async (crewId = activeCrewId, showBusy = false) => {
    if (!crewId || !cloudConfigured()) { setCloudLeaderboard([]); return; }
    if (showBusy) setLeaderboardBusy(true);
    const sync = await syncMyStatsCloud(stats);
    if (!sync.ok) {
      setLeaderboardNotice(sync.error || 'Statistik konnte nicht synchronisiert werden.');
      if (showBusy) setLeaderboardBusy(false);
      return;
    }
    const result = await getCrewLeaderboardCloud(crewId);
    if (result.ok) {
      setCloudLeaderboard(result.members || []);
      setLeaderboardNotice('');
    } else {
      setLeaderboardNotice(result.error || 'Bestenliste konnte nicht geladen werden.');
    }
    if (showBusy) setLeaderboardBusy(false);
  };

  const refreshWeeklyBattle = async (crewId = activeCrewId) => {
    if (!crewId || !cloudConfigured()) {
      setCloudWeekly([]);
      setCloudPreviousWinner(null);
      return;
    }

    const boardResult = await getWeeklyBattleLeaderboardCloud(crewId);
    if (!boardResult.ok) {
      setWeeklyNotice(boardResult.error || 'Wochen-Battle konnte nicht geladen werden.');
      return;
    }

    const winnerResult = await getPreviousWeekWinnerCloud(crewId);
    setCloudWeekly(boardResult.members || []);
    setCloudPreviousWinner(winnerResult.ok ? winnerResult.winner : null);
    setWeeklyNotice(winnerResult.ok ? '' : (winnerResult.error || 'Vorwochensieger konnte nicht geladen werden.'));
  };

  const refreshWeeklyGoals = async (crewId = activeCrewId) => {
    if (!crewId || !cloudConfigured()) {
      setCloudGoals([]);
      setGoalsNotice('');
      return;
    }

    const result = await getWeeklyGoalsCloud(crewId);
    if (result.ok) {
      setCloudGoals(result.goals || []);
      setGoalsNotice('');
    } else {
      setGoalsNotice(result.error || 'Wochenziele konnten nicht geladen werden.');
    }
  };

  const refreshSpotPhotos = async (crewId = activeCrewId) => {
    if (!crewId || !cloudConfigured()) {
      setCloudSpotPhotos([]);
      setPhotoUserId(null);
      setPhotosNotice('');
      return;
    }

    const result = await getCrewSpotPhotosCloud(crewId);
    if (result.ok) {
      setCloudSpotPhotos(result.photos || []);
      setPhotoUserId(result.userId || null);
      setPhotosNotice('');
    } else {
      setPhotosNotice(result.error || 'Crew-Fotos konnten nicht geladen werden.');
    }
  };

  // SPOT_PHOTOS_CLOUD_EFFECT
  useEffect(() => {
    if (!activeCrewId || !cloudConfigured()) {
      setCloudSpotPhotos([]);
      setPhotoUserId(null);
      return;
    }

    refreshSpotPhotos(activeCrewId);
    const id = setInterval(() => refreshSpotPhotos(activeCrewId), 30000);
    return () => clearInterval(id);
  }, [activeCrewId]);

  // WEEKLY_GOALS_CLOUD_EFFECT
  useEffect(() => {
    if (!activeCrewId || !cloudConfigured()) {
      setCloudGoals([]);
      return;
    }

    localSet('crew:activeCloudCrewId', activeCrewId);
    refreshWeeklyGoals(activeCrewId);

    const id = setInterval(() => refreshWeeklyGoals(activeCrewId), 5000);
    return () => clearInterval(id);
  }, [activeCrewId]);
  // WEEKLY_BATTLE_CLOUD_EFFECT
  useEffect(() => {
    if (!activeCrewId || !cloudConfigured()) {
      setCloudWeekly([]);
      setCloudPreviousWinner(null);
      return;
    }

    refreshWeeklyBattle(activeCrewId);
    const id = setInterval(() => refreshWeeklyBattle(activeCrewId), 5000);
    return () => clearInterval(id);
  }, [activeCrewId]);
  useEffect(() => {
    if (!activeCrewId) { setCloudOutside([]); setCloudLeaderboard([]); return; }
    refreshPresence(activeCrewId);
    refreshLeaderboard(activeCrewId);
    const id = setInterval(() => {
      refreshPresence(activeCrewId);
      refreshLeaderboard(activeCrewId);
    }, 5000);
    return () => clearInterval(id);
  }, [activeCrewId]);

  useEffect(() => {
    (async () => {
      setContact(await localGet('emergency:contact', ''));
      const current = weekKey();
      const oldKey = await sharedGet('crew:weekly:key', null);
      if (!oldKey) {
        await sharedSet('crew:weekly:key', current);
      } else if (oldKey !== current) {
        const old = await sharedGet(`crew:weekly:${oldKey}`, { members: {} });
        const winner = Object.values(old.members || {}).sort((a, b) => (b.score || 0) - (a.score || 0))[0] || null;
        if (winner) await sharedSet('crew:weekly:previousWinner', { ...winner, week: oldKey });
        await sharedSet('crew:weekly:key', current);
      }
      await loadLocalCrew();
      await refreshCloudCrews();
    })();
    const id = setInterval(loadLocalCrew, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      if (cloudConfigured()) {
        const cloudSync = await syncMyStatsCloud(stats);
        if (!cloudSync.ok) setLeaderboardNotice(cloudSync.error || 'Cloud-Statistik konnte nicht synchronisiert werden.');
        if (activeCrewId) await refreshLeaderboard(activeCrewId);
      }
      const b = await sharedGet('crew:leaderboard', {});
      const next = { ...b, [profile.nickname]: { ...stats, sport: sport.name, updated: Date.now() } };
      setBoard(next);
      await sharedSet('crew:leaderboard', next);
      const wk = weekKey();
      const current = await sharedGet(`crew:weekly:${wk}`, { members: {} });
      const old = current.members?.[profile.nickname];
      const baseline = old?.baseline || { tricks: stats.tricks || 0, wins: stats.wins || 0, trainingMinutes: stats.trainingMinutes || 0 };
      const score = Math.max(0, (stats.tricks || 0) - baseline.tricks) + Math.max(0, (stats.wins || 0) - baseline.wins) * 3 + Math.floor(Math.max(0, (stats.trainingMinutes || 0) - baseline.trainingMinutes) / 30);
      const member = { nickname: profile.nickname, sport: sport.name, baseline, current: stats, score };
      const nextWeekly = { ...current, members: { ...(current.members || {}), [profile.nickname]: member } };
      setWeekly(nextWeekly);
      await sharedSet(`crew:weekly:${wk}`, nextWeekly);
      if (activeCrewId && cloudConfigured()) {
        const weeklySync = await setMyWeeklyScoreCloud(activeCrewId, score);
        if (weeklySync.ok) {
          await refreshWeeklyBattle(activeCrewId);
        } else {
          setWeeklyNotice(weeklySync.error || 'Wochen-Punkte konnten nicht synchronisiert werden.');
        }
      }
    })();
  }, [stats, profile.nickname, sport.id, activeCrewId]);

  const sorted = useMemo(() => Object.entries(board).sort((a, b) => ((b[1].tricks || 0) + (b[1].wins || 0) * 3) - ((a[1].tricks || 0) + (a[1].wins || 0) * 3)), [board]);
  const weeklySorted = useMemo(() => Object.values(weekly.members || {}).sort((a, b) => (b.score || 0) - (a.score || 0)), [weekly]);

  const createCrew = async () => {
    if (!crewName.trim()) return;
    if (!cloudConfigured()) return setCloudNotice('Supabase ist noch nicht mit der App verbunden.');
    setCloudBusy(true); setCloudNotice('');
    const result = await createCrewCloud(crewName);
    if (result.ok) {
      setCrewName('');
      setCloudNotice(`Crew erstellt. Code: ${result.crew?.join_code || 'siehe Liste'}`);
      await refreshCloudCrews();
    } else setCloudNotice(result.error);
    setCloudBusy(false);
  };

  const joinCrew = async () => {
    if (!joinCode.trim()) return;
    if (!cloudConfigured()) return setCloudNotice('Supabase ist noch nicht mit der App verbunden.');
    setCloudBusy(true); setCloudNotice('');
    const result = await joinCrewCloud(joinCode);
    if (result.ok) {
      setJoinCode('');
      setCloudNotice(`Crew ${result.crew?.name || ''} beigetreten.`);
      await refreshCloudCrews();
    } else setCloudNotice(result.error);
    setCloudBusy(false);
  };

  const goOutside = async () => {
    if (!spot.trim()) return;
    if (activeCrewId && cloudConfigured()) {
      setPresenceBusy(true); setPresenceNotice('');
      const result = await setMySpotCloud(activeCrewId, spot);
      if (result.ok) {
        setSpot('');
        await refreshPresence(activeCrewId);
      } else {
        setPresenceNotice(result.error);
      }
      setPresenceBusy(false);
      return;
    }
    const next = [...outside.filter((x) => x.nickname !== profile.nickname), { nickname: profile.nickname, spot: spot.trim(), until: Date.now() + 3 * 3600000, sport: sport.name }];
    setOutside(next); await sharedSet('crew:outside', next); setSpot('');
  };

  const clearOutside = async () => {
    if (!activeCrewId || !cloudConfigured()) return;
    setPresenceBusy(true); setPresenceNotice('');
    const result = await clearMySpotCloud(activeCrewId);
    if (result.ok) await refreshPresence(activeCrewId);
    else setPresenceNotice(result.error);
    setPresenceBusy(false);
  };
  const saveContact = async () => { await localSet('emergency:contact', contact); setNotice('Notfallkontakt lokal gespeichert.'); };
  const makeBackup = async () => { setBackup(await dumpAllData()); setNotice('Datensicherung erstellt. Text kopieren und sicher aufheben.'); };
  const doRestore = async () => { try { const n = await restoreAllData(restore); setNotice(`${n} gespeicherte Einträge zurückgespielt. App danach neu starten.`); } catch { setNotice('Sicherung konnte nicht gelesen werden.'); } };
  const recap = async () => { setReview('Erstelle Rückblick…'); try { setReview(await weeklyReviewAI({ ...stats, weeklyScore: weekly.members?.[profile.nickname]?.score || 0 }, sport)); } catch (e) { setReview(e.message); } };
  const sharePark = async () => {
    const img = await pickAndResizeImage();
    if (!img) return;

    if (activeCrewId && cloudConfigured()) {
      setPhotosBusy(true);
      setPhotosNotice('');
      const result = await uploadCrewSpotPhotoCloud(activeCrewId, img.uri, sport.name);

      if (result.ok) {
        await refreshSpotPhotos(activeCrewId);
      } else {
        setPhotosNotice(result.error || 'Foto konnte nicht hochgeladen werden.');
      }

      setPhotosBusy(false);
      return;
    }

    const uri = await persistImage(img.uri, 'crew-spot');
    const next = [
      { id: Date.now(), uri, by: profile.nickname, sport: sport.name },
      ...sharedSpots,
    ].slice(0, 12);

    setSharedSpots(next);
    await sharedSet('crew:parkspots', next);
  };

  const deleteCloudSpotPhoto = async (photoId) => {
    if (!activeCrewId || !cloudConfigured()) return;

    setPhotosBusy(true);
    setPhotosNotice('');

    const result = await deleteMyCrewSpotPhotoCloud(photoId);
    if (result.ok) {
      await refreshSpotPhotos(activeCrewId);
    } else {
      setPhotosNotice(result.error || 'Foto konnte nicht geloescht werden.');
    }

    setPhotosBusy(false);
  };

  const badge = (s) => { if ((s.tricks || 0) >= 50) return 'PROGRESS 50'; if ((s.trainingMinutes || 0) >= 300) return '5H SESSION'; if ((s.streak || 0) >= 7) return '7 DAY'; if ((s.wins || 0) >= 3) return 'BATTLE'; return 'RIDER'; };

  const placeColor = (i) => (i === 0 ? COLORS.lime : i === 1 ? COLORS.text : i === 2 ? COLORS.blue : COLORS.mutedNum);

  return (
    <View style={styles.stack}>
      {notice ? <Notice>{notice}</Notice> : null}

      <Card>
        <View style={[styles.headRow, { alignItems: 'center' }]}>
          <BadgeVideo id="crew" size={72} />
          <View style={{ flex: 1, gap: 8, alignItems: 'flex-start' }}>
            <Title>Crew-Cloud</Title>
            <Tag label={cloudConfigured() ? 'Supabase' : 'Nicht eingerichtet'} tone={cloudConfigured() ? 'violet' : 'pink'} dot />
          </View>
        </View>
        <Muted>Das ist die neue echte Crew-Basis. Sobald Supabase in der App eingetragen ist, kann jeder auf seinem eigenen Handy eine Crew erstellen oder per Code beitreten.</Muted>
        {cloudNotice ? <Notice tone={cloudNotice.includes('Code:') || cloudNotice.includes('beigetreten') ? 'volt' : 'pink'}>{cloudNotice}</Notice> : null}
        {cloudCrews.length ? cloudCrews.map((c) => (
          <View key={c.id} style={styles.cloudCrew}>
            <Avatar size={40} letter={String(c.name || '?').charAt(0).toUpperCase()} gradient={GRADIENTS.avatarViolet} color="#140C3A" />
            <View style={{ flex: 1, gap: 3 }}><Text style={styles.bold} numberOfLines={1}>{c.name}</Text><Muted>{c.role === 'owner' ? 'Deine Crew' : 'Mitglied'}</Muted></View>
            <View style={styles.codeBadge}><Text style={styles.codeText}>{c.join_code}</Text></View>
          </View>
        )) : <Muted>{cloudConfigured() ? 'Noch keine Crew.' : 'Supabase-Zugangsdaten fehlen noch in .env.'}</Muted>}
        <Field value={crewName} onChangeText={setCrewName} placeholder="Neue Crew, z. B. Black Forest Riders" />
        <Button title={cloudBusy ? 'Bitte warten…' : 'Crew erstellen'} icon="plus" disabled={cloudBusy || !crewName.trim()} onPress={createCrew} />
        <Field value={joinCode} onChangeText={(t) => setJoinCode(t.toUpperCase())} placeholder="6-stelligen Crew-Code eingeben" autoCapitalize="characters" />
        <Button title="Crew beitreten" tone="dark" icon="key" disabled={cloudBusy || !joinCode.trim()} onPress={joinCrew} />
      </Card>

      <Notice>Live-Spots, Bestenliste, Wochen-Battle, Ziele und Spot-Fotos laufen jetzt über die echte Crew-Cloud.</Notice>

      <Card>
        <Title>Wer ist gerade draußen?</Title>
        {cloudCrews.length > 1 ? (
          <>
            <Muted>Für welche Crew?</Muted>
            <View style={styles.row}>
              {cloudCrews.map((c) => <Pill key={c.id} label={c.name} active={activeCrewId === c.id} onPress={() => setActiveCrewId(c.id)} />)}
            </View>
          </>
        ) : cloudCrews.length === 1 ? <Muted>Crew: {cloudCrews[0].name}</Muted> : <Muted>Erstelle oder betrete zuerst eine Crew. Ohne Crew nutzt dieser Bereich nur den lokalen Testmodus.</Muted>}
        {presenceNotice ? <Notice tone="pink">{presenceNotice}</Notice> : null}
        <Field value={spot} onChangeText={setSpot} placeholder="Spot eintragen, z. B. Skatepark Titisee" />
        <Button title={presenceBusy ? 'Speichere…' : 'Ich bin draußen'} icon="pin" disabled={presenceBusy || !spot.trim()} onPress={goOutside} />
        {activeCrewId && cloudConfigured() ? (
          <>
            <Button title="Meinen Eintrag entfernen" tone="dark" disabled={presenceBusy} onPress={clearOutside} />
            {cloudOutside.length ? cloudOutside.map((x) => {
              const minutes = Math.max(1, Math.ceil((new Date(x.expires_at).getTime() - Date.now()) / 60000));
              return (
                <View key={x.user_id} style={styles.out}>
                  <Avatar size={40} letter={String(x.nickname || '?').charAt(0).toUpperCase()} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.bold} numberOfLines={1}>{x.nickname}</Text>
                    <Text style={styles.body} numberOfLines={2}>{x.spot}</Text>
                  </View>
                  <Tag label={`noch ${minutes} min`} tone="cyan" />
                </View>
              );
            }) : <EmptyScene kind="crew" accent={COLORS.violet} />}
          </>
        ) : (outside.length ? outside.map((x) => (
          <View key={x.nickname} style={styles.out}>
            <Avatar size={40} letter={String(x.nickname || '?').charAt(0).toUpperCase()} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.bold} numberOfLines={1}>{x.nickname}</Text>
              <Text style={styles.body} numberOfLines={2}>{x.spot}</Text>
            </View>
            <Tag label={`${x.sport} · lokal`} tone="neutral" />
          </View>
        )) : <EmptyScene kind="crew" accent={COLORS.violet} />)}
      </Card>

      <Card>
        <Title>Deine Statistik</Title>
        <View style={styles.stats}>
          {[['Siege', stats.wins || 0], ['Streak', stats.streak || 0], ['Tricks', stats.tricks || 0], ['Bails', stats.bails || 0], ['Training', `${stats.trainingMinutes || 0} min`]].map(([k, v]) => (
            <View key={k} style={styles.stat}>
              <Text style={styles.num} numberOfLines={1} adjustsFontSizeToFit>{v}</Text>
              <Text style={styles.statLabel}>{k}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Title>Bestenliste</Title>
        {activeCrewId && cloudConfigured() ? (
          <>
            <Muted>Cloud-Rangliste der ausgewählten Crew · sortiert nach Tricks, dann Siegen, dann Trainingszeit.</Muted>
            {leaderboardNotice ? <Notice tone="pink">{leaderboardNotice}</Notice> : null}
            <Button title={leaderboardBusy ? 'Aktualisiere…' : 'Bestenliste aktualisieren'} tone="dark" icon="reset" disabled={leaderboardBusy} onPress={() => refreshLeaderboard(activeCrewId, true)} />
            {cloudLeaderboard.length ? cloudLeaderboard.map((m, i) => {
              const mapped = { tricks: m.tricks, wins: m.wins, streak: m.streak, trainingMinutes: m.training_minutes };
              return <View key={m.user_id} style={styles.rank}>
                <Text style={[styles.place, { color: placeColor(i) }]}>{i + 1}</Text>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.bold} numberOfLines={1}>{m.nickname}</Text>
                  <Muted>{m.tricks || 0} Tricks · {m.wins || 0} Siege · {m.training_minutes || 0} min · Streak {m.streak || 0}</Muted>
                </View>
                <Tag label={badge(mapped)} tone="solidLime" />
              </View>;
            }) : <Muted>Noch keine Cloud-Statistik in dieser Crew.</Muted>}
          </>
        ) : (
          <>
            <Muted>Lokaler Testmodus, solange keine Cloud-Crew ausgewählt ist.</Muted>
            {sorted.map(([name, s], i) => (
              <View key={name} style={styles.rank}>
                <Text style={[styles.place, { color: placeColor(i) }]}>{i + 1}</Text>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.bold} numberOfLines={1}>{name}</Text>
                  <Muted>{s.sport} · {s.tricks || 0} Tricks · {s.wins || 0} Siege</Muted>
                </View>
                <Tag label={badge(s)} tone="solidLime" />
              </View>
            ))}
          </>
        )}
      </Card>

      <Card>
        <View style={styles.headRow}>
          <Title>Wochen-Battle</Title>
          <Tag label={`ab ${weekKey()}`} tone="pink" />
        </View>
        <Muted>Reset montags · Woche ab {weekKey()}</Muted>
        {activeCrewId && cloudConfigured() ? (
          <>
            {weeklyNotice ? <Notice tone="pink">{weeklyNotice}</Notice> : null}
            {cloudPreviousWinner ? <Notice tone="volt">Vorwochensieger: {cloudPreviousWinner.nickname} mit {cloudPreviousWinner.score || 0} Punkten.</Notice> : null}
            {cloudWeekly.length ? cloudWeekly.map((m, i) => (
              <View key={m.user_id} style={styles.rank}>
                <Text style={[styles.place, { color: placeColor(i) }]}>{m.place}</Text>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.bold} numberOfLines={1}>{m.nickname}</Text>
                  <Muted>Crew-Cloud</Muted>
                </View>
                <Text style={styles.weekScore}>{m.score || 0}</Text>
              </View>
            )) : <Muted>Noch keine Wochen-Punkte in dieser Crew.</Muted>}
          </>
        ) : (
          <>
            {previousWinner ? <Notice tone="volt">Vorwochensieger: {previousWinner.nickname} mit {previousWinner.score || 0} Punkten.</Notice> : null}
            {weeklySorted.map((m, i) => (
              <View key={m.nickname} style={styles.rank}>
                <Text style={[styles.place, { color: placeColor(i) }]}>{i + 1}</Text>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.bold} numberOfLines={1}>{m.nickname}</Text>
                  <Muted>{m.sport}</Muted>
                </View>
                <Text style={styles.weekScore}>{m.score || 0}</Text>
              </View>
            ))}
          </>
        )}
      </Card>

      <Card>
        <Title>Ziele der Woche</Title>
        {activeCrewId && cloudConfigured() ? (
          <>
            {goalsNotice ? <Notice tone="pink">{goalsNotice}</Notice> : null}
            {cloudGoals.length ? cloudGoals.map((g) => (
              <View key={g.user_id} style={styles.out}>
                <View style={[styles.goalCheck, g.done && styles.goalCheckDone]}>
                  {g.done ? <AppIcon name="check" size={14} color={COLORS.onLime} strokeWidth={3} /> : null}
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.body}>
                    <Text style={styles.bold}>{g.nickname}</Text> · {g.goal_name}
                  </Text>
                  <Muted>{g.sport_name}</Muted>
                </View>
              </View>
            )) : <Muted>Noch keine Cloud-Ziele in dieser Crew.</Muted>}
          </>
        ) : (
          <>
            {Object.values(goals).length ? Object.values(goals).map((g) => (
              <View key={g.nickname} style={styles.out}>
                <View style={[styles.goalCheck, g.done && styles.goalCheckDone]}>
                  {g.done ? <AppIcon name="check" size={14} color={COLORS.onLime} strokeWidth={3} /> : null}
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.body}>
                    <Text style={styles.bold}>{g.nickname}</Text> · {g.name}
                  </Text>
                  <Muted>{g.sport}</Muted>
                </View>
              </View>
            )) : <Muted>Noch kein Crew-Ziel fuer diese Woche.</Muted>}
          </>
        )}
      </Card>

      <Card>
        <Title>Park-Spots teilen</Title>
        {photosNotice ? <Notice tone="pink">{photosNotice}</Notice> : null}
        <Button
          title={photosBusy ? 'Lädt hoch…' : 'Spot-Foto teilen'}
          tone="ice"
          icon="camera"
          disabled={photosBusy}
          onPress={sharePark}
        />
        {activeCrewId && cloudConfigured() ? (
          cloudSpotPhotos.length ? cloudSpotPhotos.map((x) => (
            <View key={x.id} style={styles.photoWrap}>
              {x.url
                ? <Image source={{ uri: x.url }} style={styles.photo} />
                : <Muted>Foto konnte nicht geladen werden.</Muted>}
              <Text style={styles.photoMeta}>{x.nickname} · {x.sport_name}</Text>
              {x.user_id === photoUserId ? (
                <Button
                  title="Mein Foto löschen"
                  tone="pink"
                  compact
                  disabled={photosBusy}
                  onPress={() => deleteCloudSpotPhoto(x.id)}
                />
              ) : null}
            </View>
          )) : <Muted>Noch keine Crew-Fotos in dieser Crew.</Muted>
        ) : (
          sharedSpots.map((x) => (
            <View key={x.id} style={styles.photoWrap}>
              <Image source={{ uri: x.uri }} style={styles.photo} />
              <Text style={styles.photoMeta}>{x.by} · {x.sport}</Text>
            </View>
          ))
        )}
      </Card>

      <Card>
        <View style={styles.row}>
          <IconTile name="chip" size={46} iconSize={22} gradient={GRADIENTS.avatarCyan} color="#04202A" radius={16} />
          <Title>KI-Wochenrückblick</Title>
        </View>
        <Button title="Rückblick erstellen" tone="ice" icon="chip" onPress={recap} />
        {review ? (
          <Bubble tone="cyan" style={{ alignSelf: 'stretch' }}>
            <Text style={styles.body}>{review}</Text>
          </Bubble>
        ) : null}
      </Card>

      <Card gradient={GRADIENTS.tilePink}>
        <View style={styles.row}>
          <IconTile name="shield" size={46} iconSize={22} bg={COLORS.pink} color="#1A0510" radius={16} fillOpacity={0.3} />
          <Title>Notfall-Karte</Title>
        </View>
        <Notice tone="pink">Bei Verdacht auf Kopf-, Nacken- oder Rückenverletzung nicht unnötig bewegen. Helm nicht einfach abnehmen. Bewusstlos, aber normale Atmung: stabile Seitenlage, soweit ohne zusätzliche Gefährdung möglich. Nach einem Kopftreffer Session beenden und Beschwerden ernst nehmen.</Notice>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <SecondaryButton title="112" tone="danger" icon="phone" onPress={() => openEmergency('112')} />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton title="116117" tone="cyan" icon="phone" onPress={() => openEmergency('116117')} />
          </View>
        </View>
        <Field value={contact} onChangeText={setContact} placeholder="Persönlicher Notfallkontakt" />
        <Button title="Kontakt speichern" tone="dark" icon="save" onPress={saveContact} />
      </Card>

      <Card>
        <Title>Datensicherung</Title>
        <Button title="Alle App-Daten als Text ausgeben" icon="save" onPress={makeBackup} />
        {backup ? <Field value={backup} onChangeText={setBackup} multiline placeholder="Backup" /> : null}
        <Field value={restore} onChangeText={setRestore} multiline placeholder="Sicherung zum Zurückspielen hier einfügen" />
        <SecondaryButton title="Sicherung zurückspielen" tone="danger" icon="reset" onPress={doRestore} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cloudCrew: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.tile, borderRadius: RADII.stat, padding: 12 },
  codeBadge: { backgroundColor: COLORS.limeSoft, borderRadius: 999, paddingHorizontal: 14, height: 36, justifyContent: 'center' },
  codeText: { ...TYPE.number, color: COLORS.lime, fontSize: 18, letterSpacing: 3 },
  out: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.tile, borderRadius: RADII.stat, padding: 12 },
  body: { fontFamily: FONTS.body, color: COLORS.text, fontSize: 14, lineHeight: 21 },
  bold: { fontFamily: FONTS.bold, color: COLORS.text, fontSize: 14 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '31.5%', flexGrow: 1, backgroundColor: COLORS.stat, paddingTop: 13, paddingHorizontal: 12, paddingBottom: 11, borderRadius: RADII.stat, gap: 7 },
  num: { ...TYPE.number, fontSize: 28, lineHeight: 30 },
  statLabel: { ...TYPE.label, fontSize: 11 },
  rank: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.tile, borderRadius: RADII.stat, paddingVertical: 10, paddingHorizontal: 14 },
  place: { ...TYPE.display, fontSize: 30, lineHeight: 32, width: 34, paddingRight: 0 },
  weekScore: { ...TYPE.number, color: COLORS.pinkText, fontSize: 26 },
  goalCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.nodeIdle, alignItems: 'center', justifyContent: 'center' },
  goalCheckDone: { backgroundColor: COLORS.lime },
  photoWrap: { gap: 8 },
  photo: { height: 220, width: '100%', borderRadius: RADII.tile },
  photoMeta: { ...TYPE.label },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
});
