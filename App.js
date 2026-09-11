import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Logo from './src/components/Logo';
import SportIcon from './src/components/SportIcon';
import { Button, Card, Field, Muted, Notice, Pill, StatBadge, Title } from './src/components/UI';
import { COLORS } from './src/theme';
import { seasonForMonth, SPORT_BY_ID, sportsForSeason } from './src/data/sports';
import { localGet, localSet } from './src/storage';
import { checkAIConnection } from './src/services/ai';
import { checkCloudConnection, cloudConfigured } from './src/services/supabase';
import CoachTab from './src/tabs/CoachTab';
import BattleTab from './src/tabs/BattleTab';
import SkillsTab from './src/tabs/SkillsTab';
import ChatTab from './src/tabs/ChatTab';
import MemoriesTab from './src/tabs/MemoriesTab';
import ParksTab from './src/tabs/ParksTab';
import CrewTab from './src/tabs/CrewTab';

const PRIMARY_TABS = [
  ['coach', '🧠', 'Coach'],
  ['skills', '🌳', 'Skills'],
  ['battle', '⚔️', 'Battle'],
  ['parks', '🗺️', 'Parks'],
  ['more', '•••', 'Mehr'],
];
const MORE_TABS = [
  ['crew', '👥', 'Crew'],
  ['chat', '💬', 'Chat'],
  ['memories', '📸', 'Memories'],
];
const EMPTY_STATS = { wins: 0, streak: 0, tricks: 0, bails: 0, trainingMinutes: 0 };
const seasonLabel = (s) => (s === 'winter' ? '❄️ Winter' : '☀️ Sommer');

function Onboarding({ onDone }) {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [home, setHome] = useState('');
  const [season, setSeason] = useState(seasonForMonth());
  const options = useMemo(() => sportsForSeason(season), [season]);
  const [sportId, setSportId] = useState(options[0]?.id || 'fitness');
  const [known, setKnown] = useState({});

  useEffect(() => {
    if (!options.some((s) => s.id === sportId)) {
      setSportId(options[0]?.id || 'fitness');
      setKnown({});
    }
  }, [options, sportId]);

  const sport = SPORT_BY_ID[sportId] || options[0];
  const chooseSport = (id) => { setSportId(id); setKnown({}); };
  const toggleKnown = (name) => setKnown((old) => ({ ...old, [name]: !old[name] }));

  const finish = async () => {
    const profile = { nickname: nickname.trim(), home: home.trim(), season, sportId };
    const done = Object.fromEntries(Object.entries(known).filter(([, v]) => v));
    const earned = { ...done };
    const initialStats = { ...EMPTY_STATS, tricks: Object.keys(done).length };
    await localSet('profile', profile);
    await localSet(`skills:${sportId}`, done);
    await localSet(`skills:earned:${sportId}`, earned);
    await localSet('stats', initialStats);
    onDone(profile, initialStats);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.onboard} keyboardShouldPersistTaps="handled">
        <View style={styles.onboardTop}>
          <Logo />
          <Text style={styles.onboardStep}>Einrichtung {step} / 2</Text>
        </View>

        {step === 1 ? (
          <>
            <Card style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>Deine Crew. Deine Tricks.</Text>
              <Muted>After[Dark merkt sich deinen Fortschritt und soll dir später genau die Tricks vorschlagen, die zu deinem Stand passen.</Muted>
            </Card>
            <Card>
              <Title>Profil</Title>
              <Field value={nickname} onChangeText={setNickname} placeholder="Spitzname" />
              <Field value={home} onChangeText={setHome} placeholder="Wohnort, z. B. Titisee-Neustadt" />
              <Title small>Saison</Title>
              <View style={styles.row}>
                <Pill label="☀️ Sommer" active={season === 'summer'} onPress={() => setSeason('summer')} />
                <Pill label="❄️ Winter" active={season === 'winter'} onPress={() => setSeason('winter')} />
              </View>
              <Title small>Sportart</Title>
              <View style={styles.choiceGrid}>
                {options.map((s) => (
                  <Pressable key={s.id} onPress={() => chooseSport(s.id)} style={[styles.choice, sportId === s.id && { borderColor: s.color, backgroundColor: `${s.color}15` }]}>
                    <SportIcon id={s.id} color={s.color} />
                    <Text style={[styles.choiceText, sportId === s.id && { color: s.color }]}>{s.name}</Text>
                  </Pressable>
                ))}
              </View>
              <Button title="Weiter: Was kannst du schon?" disabled={!nickname.trim() || !home.trim()} onPress={() => setStep(2)} />
            </Card>
          </>
        ) : (
          <Card>
            <Title color={sport.color}>Was kannst du schon?</Title>
            <Muted>Hake alles an, was du sicher kannst. Das ist keine Prüfung. Damit beginnt der Skill-Baum direkt an der richtigen Stelle.</Muted>
            {sport.levels.map(([level, names]) => (
              <View key={level} style={styles.assessLevel}>
                <Text style={[styles.assessLevelTitle, { color: sport.color }]}>{level}</Text>
                {names.map((name) => (
                  <Pressable key={name} onPress={() => toggleKnown(name)} style={[styles.assessSkill, known[name] && { borderColor: `${sport.color}88`, backgroundColor: `${sport.color}10` }]}>
                    <Text style={[styles.assessCheck, known[name] && { color: sport.color }]}>{known[name] ? '✓' : '○'}</Text>
                    <Text style={styles.assessText}>{name}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
            <View style={styles.row}>
              <Button title="Zurück" tone="dark" onPress={() => setStep(1)} />
              <Button title="After[Dark starten" onPress={finish} />
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConnectionCard({ open, onToggle, aiStatus, aiBusy, onAICheck, cloudStatus, cloudBusy, onCloudCheck }) {
  const aiOnline = aiStatus.state === 'online';
  const cloudOnline = cloudStatus.state === 'online';
  return (
    <Card>
      <Pressable onPress={onToggle} style={styles.connectionHeader}>
        <View>
          <Text style={styles.connectionTitle}>Verbindungen</Text>
          <Text style={styles.connectionSub}>KI {aiOnline ? 'online' : 'offline'} · Cloud {cloudOnline ? 'online' : 'offline'}</Text>
        </View>
        <Text style={styles.connectionToggle}>{open ? 'Schließen' : 'Öffnen'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.connectionStack}>
          <View style={styles.connectionRow}>
            <View style={[styles.statusDot, { backgroundColor: aiOnline ? COLORS.success : COLORS.pink }]} />
            <View style={{ flex: 1 }}><Text style={styles.statusName}>Claude KI</Text><Muted>{aiOnline ? `Verbunden${aiStatus.model ? ` · ${aiStatus.model}` : ''}` : 'Noch über lokalen PC-Proxy. Später kommt die Handy-Cloud-Funktion.'}</Muted></View>
            <Button title={aiBusy ? '…' : 'Prüfen'} compact tone="dark" disabled={aiBusy} onPress={onAICheck} />
          </View>
          <View style={styles.connectionRow}>
            <View style={[styles.statusDot, { backgroundColor: cloudOnline ? COLORS.success : COLORS.warning }]} />
            <View style={{ flex: 1 }}><Text style={styles.statusName}>Supabase Crew-Cloud</Text><Muted>{cloudOnline ? 'Anonyme Anmeldung funktioniert.' : cloudConfigured() ? (cloudStatus.error || 'Noch nicht verbunden.') : 'Bereit für deine Project URL und den Publishable Key.'}</Muted></View>
            <Button title={cloudBusy ? '…' : 'Prüfen'} compact tone="dark" disabled={cloudBusy || !cloudConfigured()} onPress={onCloudCheck} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function MoreHub({ page, setPage, common }) {
  return (
    <View style={styles.stack}>
      <Card>
        <Title>Mehr</Title>
        <Muted>Crew, Chat und Memories liegen zusammen, damit die Hauptnavigation auf dem Handy ruhig bleibt.</Muted>
        <View style={styles.moreGrid}>
          {MORE_TABS.map(([id, icon, label]) => (
            <Pressable key={id} onPress={() => setPage(id)} style={[styles.moreTile, page === id && { borderColor: common.sport.color, backgroundColor: `${common.sport.color}12` }]}>
              <Text style={styles.moreIcon}>{icon}</Text>
              <Text style={[styles.moreLabel, page === id && { color: common.sport.color }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      {page === 'crew' && <CrewTab {...common} />}
      {page === 'chat' && <ChatTab {...common} />}
      {page === 'memories' && <MemoriesTab {...common} />}
    </View>
  );
}

function BottomNav({ tab, onChange, color }) {
  return (
    <View style={styles.bottomNav}>
      {PRIMARY_TABS.map(([id, icon, label]) => {
        const active = tab === id;
        return (
          <Pressable key={id} onPress={() => onChange(id)} style={styles.navItem}>
            <Text style={[styles.navIcon, active && { color }]}>{icon}</Text>
            <Text style={[styles.navLabel, active && { color }]}>{label}</Text>
            {active ? <View style={[styles.navLine, { backgroundColor: color }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStatsState] = useState(EMPTY_STATS);
  const [tab, setTab] = useState('coach');
  const [morePage, setMorePage] = useState('crew');
  const [sportOpen, setSportOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiStatus, setAiStatus] = useState({ state: 'offline', error: '', model: '' });
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudStatus, setCloudStatus] = useState({ state: 'offline', error: '' });

  useEffect(() => {
    (async () => {
      setProfile(await localGet('profile', null));
      setStatsState(await localGet('stats', EMPTY_STATS));
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    runAICheck(false);
  }, [ready]);

  useEffect(() => {
    if (!ready || !profile?.nickname) return;
    runCloudCheck(false);
  }, [ready, profile?.nickname]);

  const runAICheck = async (open = true) => {
    setAiBusy(true);
    if (open) setConnectionsOpen(true);
    const result = await checkAIConnection();
    setAiStatus(result.ok ? { state: 'online', error: '', model: result.model || '' } : { state: 'offline', error: result.error || 'Keine Verbindung', model: '' });
    setAiBusy(false);
  };

  const runCloudCheck = async (open = true) => {
    if (!cloudConfigured()) {
      setCloudStatus({ state: 'offline', error: 'Supabase-Zugangsdaten fehlen noch.' });
      return;
    }
    setCloudBusy(true);
    if (open) setConnectionsOpen(true);
    const result = await checkCloudConnection(profile?.nickname || 'Rider');
    setCloudStatus(result.ok ? { state: 'online', error: '' } : { state: 'offline', error: result.error || 'Keine Verbindung' });
    setCloudBusy(false);
  };

  const setStats = async (next) => { setStatsState(next); await localSet('stats', next); };
  const finishOnboarding = (newProfile, initialStats) => { setProfile(newProfile); setStatsState(initialStats || EMPTY_STATS); };

  if (!ready) return <SafeAreaView style={styles.safe}><View style={styles.loading}><Logo /><Text style={styles.loadingText}>Lade After[Dark…</Text></View></SafeAreaView>;
  if (!profile) return <Onboarding onDone={finishOnboarding} />;

  const sport = SPORT_BY_ID[profile.sportId] || sportsForSeason(profile.season)[0];
  const sportOptions = sportsForSeason(profile.season);
  const changeSeason = async (season) => {
    let sportId = profile.sportId;
    if (!sportsForSeason(season).some((s) => s.id === sportId)) sportId = sportsForSeason(season)[0].id;
    const next = { ...profile, season, sportId };
    setProfile(next); await localSet('profile', next);
  };
  const changeSport = async (sportId) => {
    const next = { ...profile, sportId };
    setProfile(next); await localSet('profile', next);
    setSportOpen(false);
  };
  const common = { sport, profile, stats, setStats };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        <View style={styles.topRow}>
          <Logo compact />
          <View style={styles.profileChip}><Text style={styles.profileName}>@{profile.nickname}</Text></View>
        </View>

        <Card style={styles.focusCard}>
          <View style={styles.focusRow}>
            <View style={[styles.sportIconCircle, { borderColor: `${sport.color}66`, backgroundColor: `${sport.color}12` }]}><SportIcon id={sport.id} color={sport.color} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.focusSport, { color: sport.color }]}>{sport.name}</Text>
              <Text style={styles.focusMeta}>{seasonLabel(profile.season)} · Battle {sport.battle}</Text>
            </View>
            <Pressable onPress={() => setSportOpen((v) => !v)} style={styles.changeSportButton}><Text style={styles.changeSportText}>{sportOpen ? 'Fertig' : 'Wechseln'}</Text></Pressable>
          </View>
          <View style={styles.statsRow}>
            <StatBadge label="Tricks" value={stats.tricks || 0} color={sport.color} />
            <StatBadge label="Siege" value={stats.wins || 0} color={COLORS.pink} />
            <StatBadge label="Streak" value={stats.streak || 0} color={COLORS.ice} />
            <StatBadge label="Min" value={stats.trainingMinutes || 0} color={COLORS.volt} />
          </View>
          {sportOpen ? (
            <View style={styles.sportChooser}>
              <View style={styles.row}>
                <Pill label="☀️ Sommer" active={profile.season === 'summer'} onPress={() => changeSeason('summer')} />
                <Pill label="❄️ Winter" active={profile.season === 'winter'} onPress={() => changeSeason('winter')} />
              </View>
              <View style={styles.choiceGrid}>
                {sportOptions.map((s) => (
                  <Pressable key={s.id} onPress={() => changeSport(s.id)} style={[styles.choice, sport.id === s.id && { borderColor: s.color, backgroundColor: `${s.color}15` }]}>
                    <SportIcon id={s.id} color={s.color} />
                    <Text style={[styles.choiceText, sport.id === s.id && { color: s.color }]}>{s.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </Card>

        <ConnectionCard
          open={connectionsOpen}
          onToggle={() => setConnectionsOpen((v) => !v)}
          aiStatus={aiStatus}
          aiBusy={aiBusy}
          onAICheck={() => runAICheck(true)}
          cloudStatus={cloudStatus}
          cloudBusy={cloudBusy}
          onCloudCheck={() => runCloudCheck(true)}
        />

        {tab === 'coach' && <CoachTab {...common} />}
        {tab === 'skills' && <SkillsTab {...common} />}
        {tab === 'battle' && <BattleTab {...common} />}
        {tab === 'parks' && <ParksTab {...common} />}
        {tab === 'more' && <MoreHub page={morePage} setPage={setMorePage} common={common} />}
        <View style={{ height: 12 }} />
      </ScrollView>
      <BottomNav tab={tab} onChange={setTab} color={sport.color} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  page: { padding: 14, gap: 12 },
  stack: { gap: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: COLORS.muted, fontWeight: '700' },
  onboard: { padding: 18, gap: 14 },
  onboardTop: { gap: 8, marginVertical: 8 },
  onboardStep: { color: COLORS.muted, fontWeight: '800' },
  welcomeCard: { backgroundColor: COLORS.bgSoft },
  welcomeTitle: { color: COLORS.text, fontSize: 26, fontWeight: '900' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { width: '48%', minHeight: 62, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.bgSoft, borderRadius: 18, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  choiceText: { color: COLORS.text, fontWeight: '800', flex: 1 },
  assessLevel: { gap: 7 },
  assessLevelTitle: { fontSize: 18, fontWeight: '900', marginTop: 5 },
  assessSkill: { minHeight: 48, borderWidth: 1, borderColor: COLORS.line, borderRadius: 15, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  assessCheck: { color: COLORS.muted, fontSize: 24, width: 26 },
  assessText: { color: COLORS.text, fontWeight: '700', flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, paddingVertical: 4 },
  profileChip: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  profileName: { color: COLORS.text, fontWeight: '800' },
  focusCard: { backgroundColor: COLORS.bgSoft },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  sportIconCircle: { width: 54, height: 54, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  focusSport: { fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
  focusMeta: { color: COLORS.muted, fontSize: 13, fontWeight: '700' },
  changeSportButton: { backgroundColor: COLORS.panel2, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.line },
  changeSportText: { color: COLORS.ice, fontWeight: '800' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChooser: { borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 12, gap: 10 },
  connectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  connectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  connectionSub: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  connectionToggle: { color: COLORS.ice, fontWeight: '800' },
  connectionStack: { gap: 12, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 12 },
  connectionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  statusDot: { width: 11, height: 11, borderRadius: 999 },
  statusName: { color: COLORS.text, fontWeight: '900' },
  moreGrid: { flexDirection: 'row', gap: 8 },
  moreTile: { flex: 1, minHeight: 88, backgroundColor: COLORS.bgSoft, borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 5 },
  moreIcon: { fontSize: 24 },
  moreLabel: { color: COLORS.text, fontWeight: '800' },
  bottomNav: { minHeight: 68, flexDirection: 'row', backgroundColor: COLORS.bgSoft, borderTopWidth: 1, borderTopColor: COLORS.line, paddingHorizontal: 5, paddingTop: 6, paddingBottom: 6 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, position: 'relative' },
  navIcon: { color: COLORS.muted, fontSize: 20, fontWeight: '900' },
  navLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '800' },
  navLine: { position: 'absolute', bottom: 0, width: 28, height: 3, borderRadius: 999 },
});
