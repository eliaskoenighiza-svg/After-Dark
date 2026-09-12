import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Card, Button, Field, Muted, Notice, Pill, Title } from '../components/UI';
import { COLORS } from '../theme';
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
  const doRestore = async () => { try { const n = await restoreAllData(restore); setNotice(`${n} gespeicherte EintrÃ¤ge zurÃ¼ckgespielt. App danach neu starten.`); } catch { setNotice('Sicherung konnte nicht gelesen werden.'); } };
  const recap = async () => { setReview('Erstelle RÃ¼ckblickâ€¦'); try { setReview(await weeklyReviewAI({ ...stats, weeklyScore: weekly.members?.[profile.nickname]?.score || 0 }, sport)); } catch (e) { setReview(e.message); } };
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

  return (
    <View style={styles.stack}>
      {notice ? <Notice>{notice}</Notice> : null}

      <Card style={{ borderColor: cloudConfigured() ? `${COLORS.success}55` : COLORS.line }}>
        <Title color={COLORS.ice}>Crew-Cloud</Title>
        <Muted>Das ist die neue echte Crew-Basis. Sobald Supabase in der App eingetragen ist, kann jeder auf seinem eigenen Handy eine Crew erstellen oder per Code beitreten.</Muted>
        {cloudNotice ? <Notice tone={cloudNotice.includes('Code:') || cloudNotice.includes('beigetreten') ? 'volt' : 'pink'}>{cloudNotice}</Notice> : null}
        {cloudCrews.length ? cloudCrews.map((c) => (
          <View key={c.id} style={styles.cloudCrew}>
            <View style={{ flex: 1 }}><Text style={styles.bold}>{c.name}</Text><Muted>{c.role === 'owner' ? 'Deine Crew' : 'Mitglied'}</Muted></View>
            <View style={styles.codeBadge}><Text style={styles.codeText}>{c.join_code}</Text></View>
          </View>
        )) : <Muted>{cloudConfigured() ? 'Noch keine Crew.' : 'Supabase-Zugangsdaten fehlen noch in .env.'}</Muted>}
        <Field value={crewName} onChangeText={setCrewName} placeholder="Neue Crew, z. B. Black Forest Riders" />
        <Button title={cloudBusy ? 'Bitte wartenâ€¦' : 'Crew erstellen'} disabled={cloudBusy || !crewName.trim()} onPress={createCrew} />
        <Field value={joinCode} onChangeText={(t) => setJoinCode(t.toUpperCase())} placeholder="6-stelligen Crew-Code eingeben" />
        <Button title="Crew beitreten" tone="dark" disabled={cloudBusy || !joinCode.trim()} onPress={joinCrew} />
      </Card>

      <Notice>Live-Spots, Bestenliste, Wochen-Battle, Ziele und Spot-Fotos laufen jetzt über die echte Crew-Cloud.</Notice>

      <Card>
        <Title color={sport.color}>Wer ist gerade drauÃŸen?</Title>
        {cloudCrews.length > 1 ? (
          <>
            <Muted>FÃ¼r welche Crew?</Muted>
            <View style={styles.row}>
              {cloudCrews.map((c) => <Pill key={c.id} label={c.name} active={activeCrewId === c.id} color={sport.color} onPress={() => setActiveCrewId(c.id)} />)}
            </View>
          </>
        ) : cloudCrews.length === 1 ? <Muted>Crew: {cloudCrews[0].name}</Muted> : <Muted>Erstelle oder betrete zuerst eine Crew. Ohne Crew nutzt dieser Bereich nur den lokalen Testmodus.</Muted>}
        {presenceNotice ? <Notice tone="pink">{presenceNotice}</Notice> : null}
        <Field value={spot} onChangeText={setSpot} placeholder="Spot eintragen, z. B. Skatepark Titisee" />
        <Button title={presenceBusy ? 'Speichereâ€¦' : 'Ich bin drauÃŸen'} disabled={presenceBusy || !spot.trim()} onPress={goOutside} />
        {activeCrewId && cloudConfigured() ? (
          <>
            <Button title="Meinen Eintrag entfernen" tone="dark" disabled={presenceBusy} onPress={clearOutside} />
            {cloudOutside.length ? cloudOutside.map((x) => {
              const minutes = Math.max(1, Math.ceil((new Date(x.expires_at).getTime() - Date.now()) / 60000));
              return <View key={x.user_id} style={styles.out}><Text style={styles.body}><Text style={styles.bold}>{x.nickname}</Text> Â· {x.spot}</Text><Muted>verfÃ¤llt automatisch in {minutes} min</Muted></View>;
            }) : <Muted>Gerade hat niemand einen aktiven Spot eingetragen.</Muted>}
          </>
        ) : (outside.length ? outside.map((x) => <View key={x.nickname} style={styles.out}><Text style={styles.body}><Text style={styles.bold}>{x.nickname}</Text> Â· {x.spot}</Text><Muted>{x.sport} Â· lokaler Testmodus</Muted></View>) : <Muted>Gerade hat niemand einen Spot eingetragen.</Muted>)}
      </Card>
      <Card><Title small>Deine Statistik</Title><View style={styles.stats}>{[['Siege', stats.wins || 0], ['Streak', stats.streak || 0], ['Tricks', stats.tricks || 0], ['Bails', stats.bails || 0], ['Training', `${stats.trainingMinutes || 0} min`]].map(([k, v]) => <View key={k} style={styles.stat}><Text style={styles.num}>{v}</Text><Muted>{k}</Muted></View>)}</View></Card>
      <Card>
        <Title small>Bestenliste</Title>
        {activeCrewId && cloudConfigured() ? (
          <>
            <Muted>Cloud-Rangliste der ausgewÃ¤hlten Crew Â· sortiert nach Tricks, dann Siegen, dann Trainingszeit.</Muted>
            {leaderboardNotice ? <Notice tone="pink">{leaderboardNotice}</Notice> : null}
            <Button title={leaderboardBusy ? 'Aktualisiereâ€¦' : 'Bestenliste aktualisieren'} tone="dark" disabled={leaderboardBusy} onPress={() => refreshLeaderboard(activeCrewId, true)} />
            {cloudLeaderboard.length ? cloudLeaderboard.map((m, i) => {
              const mapped = { tricks: m.tricks, wins: m.wins, streak: m.streak, trainingMinutes: m.training_minutes };
              return <View key={m.user_id} style={styles.rank}>
                <Text style={styles.place}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bold}>{m.nickname}</Text>
                  <Muted>{m.tricks || 0} Tricks Â· {m.wins || 0} Siege Â· {m.training_minutes || 0} min Â· Streak {m.streak || 0}</Muted>
                </View>
                <Text style={styles.badge}>{badge(mapped)}</Text>
              </View>;
            }) : <Muted>Noch keine Cloud-Statistik in dieser Crew.</Muted>}
          </>
        ) : (
          <>
            <Muted>Lokaler Testmodus, solange keine Cloud-Crew ausgewÃ¤hlt ist.</Muted>
            {sorted.map(([name, s], i) => <View key={name} style={styles.rank}><Text style={styles.place}>{i + 1}</Text><View style={{ flex: 1 }}><Text style={styles.bold}>{name}</Text><Muted>{s.sport} Â· {s.tricks || 0} Tricks Â· {s.wins || 0} Siege</Muted></View><Text style={styles.badge}>{badge(s)}</Text></View>)}
          </>
        )}
      </Card>
      <Card>
        <Title small>Wochen-Battle</Title>
        <Muted>Reset montags Â· Woche ab {weekKey()}</Muted>
        {activeCrewId && cloudConfigured() ? (
          <>
            {weeklyNotice ? <Notice tone="pink">{weeklyNotice}</Notice> : null}
            {cloudPreviousWinner ? <Notice tone="volt">Vorwochensieger: {cloudPreviousWinner.nickname} mit {cloudPreviousWinner.score || 0} Punkten.</Notice> : null}
            {cloudWeekly.length ? cloudWeekly.map((m) => (
              <View key={m.user_id} style={styles.rank}>
                <Text style={styles.place}>{m.place}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bold}>{m.nickname}</Text>
                  <Muted>Crew-Cloud</Muted>
                </View>
                <Text style={styles.weekScore}>{m.score || 0}</Text>
              </View>
            )) : <Muted>Noch keine Wochen-Punkte in dieser Crew.</Muted>}
          </>
        ) : (
          <>
            {previousWinner ? <Notice tone="volt">Vorwochensieger: {previousWinner.nickname} mit {previousWinner.score || 0} Punkten.</Notice> : null}
            {weeklySorted.map((m, i) => <View key={m.nickname} style={styles.rank}><Text style={styles.place}>{i + 1}</Text><View style={{ flex: 1 }}><Text style={styles.bold}>{m.nickname}</Text><Muted>{m.sport}</Muted></View><Text style={styles.weekScore}>{m.score || 0}</Text></View>)}
          </>
        )}
      </Card>
      <Card>
        <Title small>Ziele der Woche</Title>
        {activeCrewId && cloudConfigured() ? (
          <>
            {goalsNotice ? <Notice tone="pink">{goalsNotice}</Notice> : null}
            {cloudGoals.length ? cloudGoals.map((g) => (
              <View key={g.user_id} style={styles.out}>
                <Text style={styles.body}>
                  <Text style={styles.bold}>{g.nickname}</Text> - {g.done ? '[OK] ' : ''}{g.goal_name}
                </Text>
                <Muted>{g.sport_name}</Muted>
              </View>
            )) : <Muted>Noch keine Cloud-Ziele in dieser Crew.</Muted>}
          </>
        ) : (
          <>
            {Object.values(goals).length ? Object.values(goals).map((g) => (
              <View key={g.nickname} style={styles.out}>
                <Text style={styles.body}>
                  <Text style={styles.bold}>{g.nickname}</Text> - {g.done ? '[OK] ' : ''}{g.name}
                </Text>
                <Muted>{g.sport}</Muted>
              </View>
            )) : <Muted>Noch kein Crew-Ziel fuer diese Woche.</Muted>}
          </>
        )}
      </Card>
      <Card>
        <Title small>Park-Spots teilen</Title>
        {photosNotice ? <Notice tone="pink">{photosNotice}</Notice> : null}
        <Button
          title={photosBusy ? 'Lädt hoch…' : '📷 Spot-Foto teilen'}
          tone="ice"
          disabled={photosBusy}
          onPress={sharePark}
        />
        {activeCrewId && cloudConfigured() ? (
          cloudSpotPhotos.length ? cloudSpotPhotos.map((x) => (
            <View key={x.id} style={styles.photoWrap}>
              {x.url
                ? <Image source={{ uri: x.url }} style={styles.photo} />
                : <Muted>Foto konnte nicht geladen werden.</Muted>}
              <Muted>{x.nickname} · {x.sport_name}</Muted>
              {x.user_id === photoUserId ? (
                <Button
                  title="Mein Foto löschen"
                  tone="dark"
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
              <Muted>{x.by} · {x.sport}</Muted>
            </View>
          ))
        )}
      </Card>
      <Card><Title small>KI-WochenrÃ¼ckblick</Title><Button title="RÃ¼ckblick erstellen" tone="dark" onPress={recap} />{review ? <Text style={styles.body}>{review}</Text> : null}</Card>
      <Card><Title small>ðŸš‘ Notfall-Karte</Title><Notice tone="pink">Bei Verdacht auf Kopf-, Nacken- oder RÃ¼ckenverletzung nicht unnÃ¶tig bewegen. Helm nicht einfach abnehmen. Bewusstlos, aber normale Atmung: stabile Seitenlage, soweit ohne zusÃ¤tzliche GefÃ¤hrdung mÃ¶glich. Nach einem Kopftreffer Session beenden und Beschwerden ernst nehmen.</Notice><View style={styles.row}><Button title="112" tone="pink" onPress={() => openEmergency('112')} /><Button title="116117" tone="ice" onPress={() => openEmergency('116117')} /></View><Field value={contact} onChangeText={setContact} placeholder="PersÃ¶nlicher Notfallkontakt" /><Button title="Kontakt speichern" tone="dark" onPress={saveContact} /></Card>
      <Card><Title small>ðŸ’¾ Datensicherung</Title><Button title="Alle App-Daten als Text ausgeben" onPress={makeBackup} />{backup ? <Field value={backup} onChangeText={setBackup} multiline placeholder="Backup" /> : null}<Field value={restore} onChangeText={setRestore} multiline placeholder="Sicherung zum ZurÃ¼ckspielen hier einfÃ¼gen" /><Button title="Sicherung zurÃ¼ckspielen" tone="pink" onPress={doRestore} /></Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  cloudCrew: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.bgSoft, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: COLORS.line },
  codeBadge: { backgroundColor: `${COLORS.ice}18`, borderWidth: 1, borderColor: `${COLORS.ice}55`, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  codeText: { color: COLORS.ice, fontWeight: '900', letterSpacing: 1.5 },
  out: { borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 8 },
  body: { color: COLORS.text, lineHeight: 21 },
  bold: { color: COLORS.text, fontWeight: '900' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '31%', backgroundColor: COLORS.panel2, padding: 10, borderRadius: 14 },
  num: { color: COLORS.volt, fontSize: 20, fontWeight: '900' },
  rank: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingVertical: 9 },
  place: { color: COLORS.volt, fontSize: 22, fontWeight: '900', width: 28 },
  badge: { color: COLORS.bg, backgroundColor: COLORS.volt, fontSize: 10, fontWeight: '900', paddingHorizontal: 7, paddingVertical: 5, borderRadius: 999 },
  weekScore: { color: COLORS.volt, fontSize: 22, fontWeight: '900' },
  photoWrap: { gap: 4 },
  photo: { height: 220, width: '100%', borderRadius: 18 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});

