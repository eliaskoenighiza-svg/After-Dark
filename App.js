import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Logo from './src/components/Logo';
import AppIcon from './src/components/AppIcon';
import SportIcon from './src/components/SportIcon';
import { Button, Card, Field, Muted, Pill, StatBadge, Title } from './src/components/UI';
import { COLORS } from './src/theme';
import { seasonForMonth, SPORT_BY_ID, sportsForSeason } from './src/data/sports';
import { localGet, localSet } from './src/storage';
import { pickAndResizeImage, persistImage } from './src/services/media';
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
  ['coach', 'coach', 'Coach'],
  ['skills', 'skills', 'Skills'],
  ['battle', 'battle', 'Battle'],
  ['parks', 'parks', 'Parks'],
  ['more', 'more', 'Mehr'],
];

const MORE_TABS = [
  ['crew', 'crew', 'Crew', 'Deine Leute'],
  ['chat', 'chat', 'Chat', 'Immer in Kontakt'],
  ['memories', 'memories', 'Memories', 'Deine Highlights'],
];

const EMPTY_STATS = {
  wins: 0,
  streak: 0,
  tricks: 0,
  bails: 0,
  trainingMinutes: 0,
};

function SeasonChip({ season }) {
  const winter = season === 'winter';
  return (
    <View style={styles.seasonChip}>
      <AppIcon
        name={winter ? 'snow' : 'sun'}
        size={14}
        color={winter ? COLORS.ice : COLORS.warning}
      />
      <Text style={styles.seasonChipText}>{winter ? 'Winter' : 'Sommer'}</Text>
    </View>
  );
}

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

  const chooseSport = (id) => {
    setSportId(id);
    setKnown({});
  };

  const toggleKnown = (name) => {
    setKnown((old) => ({ ...old, [name]: !old[name] }));
  };

  const finish = async () => {
    const profile = {
      nickname: nickname.trim(),
      home: home.trim(),
      season,
      sportId,
    };

    const done = Object.fromEntries(
      Object.entries(known).filter(([, value]) => value)
    );

    const earned = { ...done };
    const initialStats = {
      ...EMPTY_STATS,
      tricks: Object.keys(done).length,
    };

    await localSet('profile', profile);
    await localSet(`skills:${sportId}`, done);
    await localSet(`skills:earned:${sportId}`, earned);
    await localSet('stats', initialStats);

    onDone(profile, initialStats);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        contentContainerStyle={styles.onboard}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.onboardTop}>
          <Logo centered />
          <Text style={styles.onboardStep}>Einrichtung {step} / 2</Text>
        </View>

        {step === 1 ? (
          <>
            <Card style={styles.welcomeCard}>
              <Text style={styles.welcomeKicker}>AFTER[DARK]</Text>
              <Text style={styles.welcomeTitle}>Deine Crew. Deine Tricks.</Text>
              <Muted>
                Richte dein Profil ein. Danach passt sich After[Dark] an deinen
                Sport und deinen aktuellen Stand an.
              </Muted>
            </Card>

            <Card>
              <Title>Profil</Title>
              <Field
                value={nickname}
                onChangeText={setNickname}
                placeholder="Spitzname"
              />
              <Field
                value={home}
                onChangeText={setHome}
                placeholder="Wohnort, z. B. Titisee-Neustadt"
              />

              <Title small>Saison</Title>
              <View style={styles.row}>
                <Pressable
                  onPress={() => setSeason('summer')}
                  style={[
                    styles.seasonChoice,
                    season === 'summer' && styles.seasonChoiceActive,
                  ]}
                >
                  <AppIcon
                    name="sun"
                    size={18}
                    color={season === 'summer' ? COLORS.volt : COLORS.muted}
                  />
                  <Text style={[
                    styles.seasonChoiceText,
                    season === 'summer' && { color: COLORS.volt },
                  ]}>
                    Sommer
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSeason('winter')}
                  style={[
                    styles.seasonChoice,
                    season === 'winter' && styles.seasonChoiceActive,
                  ]}
                >
                  <AppIcon
                    name="snow"
                    size={18}
                    color={season === 'winter' ? COLORS.ice : COLORS.muted}
                  />
                  <Text style={[
                    styles.seasonChoiceText,
                    season === 'winter' && { color: COLORS.ice },
                  ]}>
                    Winter
                  </Text>
                </Pressable>
              </View>

              <Title small>Sportart</Title>
              <View style={styles.choiceGrid}>
                {options.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => chooseSport(s.id)}
                    style={[
                      styles.choice,
                      sportId === s.id && {
                        borderColor: s.color,
                        backgroundColor: `${s.color}12`,
                      },
                    ]}
                  >
                    <SportIcon id={s.id} color={s.color} />
                    <Text
                      style={[
                        styles.choiceText,
                        sportId === s.id && { color: s.color },
                      ]}
                    >
                      {s.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Button
                title="Weiter: Was kannst du schon?"
                disabled={!nickname.trim() || !home.trim()}
                onPress={() => setStep(2)}
              />
            </Card>
          </>
        ) : (
          <Card>
            <Title color={sport.color}>Was kannst du schon?</Title>
            <Muted>
              Hake alles an, was du sicher kannst. Damit startet dein
              Skill-Baum direkt an der richtigen Stelle.
            </Muted>

            {sport.levels.map(([level, names]) => (
              <View key={level} style={styles.assessLevel}>
                <Text style={[styles.assessLevelTitle, { color: sport.color }]}>
                  {level}
                </Text>

                {names.map((name) => (
                  <Pressable
                    key={name}
                    onPress={() => toggleKnown(name)}
                    style={[
                      styles.assessSkill,
                      known[name] && {
                        borderColor: `${sport.color}88`,
                        backgroundColor: `${sport.color}10`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.assessCheck,
                        known[name] && { color: sport.color },
                      ]}
                    >
                      {known[name] ? '✓' : '○'}
                    </Text>
                    <Text style={styles.assessText}>{name}</Text>
                  </Pressable>
                ))}
              </View>
            ))}

            <View style={styles.row}>
              <Button
                title="Zurück"
                tone="dark"
                onPress={() => setStep(1)}
              />
              <Button
                title="After[Dark] starten"
                onPress={finish}
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConnectionCard({
  open,
  onToggle,
  aiStatus,
  aiBusy,
  onAICheck,
  cloudStatus,
  cloudBusy,
  onCloudCheck,
}) {
  const aiOnline = aiStatus.state === 'online';
  const cloudOnline = cloudStatus.state === 'online';

  return (
    <Card style={styles.connectionCard}>
      <Pressable onPress={onToggle} style={styles.connectionHeader}>
        <View style={styles.connectionIcon}>
          <AppIcon
            name="cloud"
            size={25}
            color={cloudOnline ? COLORS.ice : COLORS.muted}
          />
        </View>

        <View style={styles.connectionText}>
          <Text style={styles.connectionTitle}>Verbindungen</Text>
          <Text style={styles.connectionSub}>
            KI {aiOnline ? 'online' : 'offline'} · Cloud {cloudOnline ? 'online' : 'offline'}
          </Text>
        </View>

        <View style={styles.openChip}>
          <Text style={styles.connectionToggle}>
            {open ? 'Schließen' : 'Öffnen'}
          </Text>
          <AppIcon
            name="chevron"
            size={16}
            color={COLORS.ice}
          />
        </View>
      </Pressable>

      {open ? (
        <View style={styles.connectionStack}>
          <View style={styles.connectionRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: aiOnline ? COLORS.success : COLORS.pink },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusName}>Claude KI</Text>
              <Muted>
                {aiOnline
                  ? `Verbunden${aiStatus.model ? ` · ${aiStatus.model}` : ''}`
                  : 'Noch über lokalen PC-Proxy. Später kommt die Handy-Cloud-Funktion.'}
              </Muted>
            </View>
            <Button
              title={aiBusy ? '…' : 'Prüfen'}
              compact
              tone="dark"
              disabled={aiBusy}
              onPress={onAICheck}
            />
          </View>

          <View style={styles.connectionRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: cloudOnline ? COLORS.success : COLORS.warning },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusName}>Supabase Crew-Cloud</Text>
              <Muted>
                {cloudOnline
                  ? 'Anonyme Anmeldung funktioniert.'
                  : cloudConfigured()
                    ? (cloudStatus.error || 'Noch nicht verbunden.')
                    : 'Bereit für Project URL und Publishable Key.'}
              </Muted>
            </View>
            <Button
              title={cloudBusy ? '…' : 'Prüfen'}
              compact
              tone="dark"
              disabled={cloudBusy || !cloudConfigured()}
              onPress={onCloudCheck}
            />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function MoreHub({ page, setPage, common }) {
  return (
    <View style={styles.stack}>
      <View style={styles.moreHero}>
        <Text style={styles.moreHeroTitle}>Mehr</Text>
        <Text style={styles.moreHeroSub}>CREW · CHAT · MEMORIES</Text>
        <View style={styles.moreHeroLine} />
      </View>

      <View style={styles.moreGrid}>
        {MORE_TABS.map(([id, icon, label, sub]) => {
          const active = page === id;

          return (
            <Pressable
              key={id}
              onPress={() => setPage(id)}
              style={[
                styles.moreTile,
                active && {
                  borderColor: `${common.sport.color}88`,
                  backgroundColor: `${common.sport.color}10`,
                },
              ]}
            >
              <View
                style={[
                  styles.moreIconBubble,
                  active && { backgroundColor: `${common.sport.color}18` },
                ]}
              >
                <AppIcon
                  name={icon}
                  size={28}
                  color={active ? common.sport.color : COLORS.ice}
                />
              </View>

              <Text
                style={[
                  styles.moreLabel,
                  active && { color: common.sport.color },
                ]}
              >
                {label}
              </Text>
              <Text style={styles.moreSub}>{sub}</Text>

              <View style={styles.moreArrow}>
                <AppIcon
                  name="chevron"
                  size={16}
                  color={COLORS.muted}
                />
              </View>
            </Pressable>
          );
        })}
      </View>

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
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            style={styles.navItem}
          >
            <View style={[
              styles.navIconWrap,
              active && { backgroundColor: `${color}12` },
            ]}>
              <AppIcon
                name={icon}
                size={22}
                color={active ? color : COLORS.muted}
                strokeWidth={active ? 2.2 : 1.8}
              />
            </View>

            <Text style={[
              styles.navLabel,
              active && { color },
            ]}>
              {label}
            </Text>

            {active ? (
              <View
                style={[
                  styles.navLine,
                  { backgroundColor: color },
                ]}
              />
            ) : null}
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
  const [aiStatus, setAiStatus] = useState({
    state: 'offline',
    error: '',
    model: '',
  });
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudStatus, setCloudStatus] = useState({
    state: 'offline',
    error: '',
  });

  useEffect(() => {
    (async () => {
      const [savedProfile, savedStats] = await Promise.all([
        localGet('profile', null),
        localGet('stats', EMPTY_STATS),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);

      setProfile(savedProfile);
      setStatsState(savedStats);
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

    setAiStatus(
      result.ok
        ? {
            state: 'online',
            error: '',
            model: result.model || '',
          }
        : {
            state: 'offline',
            error: result.error || 'Keine Verbindung',
            model: '',
          }
    );

    setAiBusy(false);
  };

  const runCloudCheck = async (open = true) => {
    if (!cloudConfigured()) {
      setCloudStatus({
        state: 'offline',
        error: 'Supabase-Zugangsdaten fehlen noch.',
      });
      return;
    }

    setCloudBusy(true);
    if (open) setConnectionsOpen(true);

    const result = await checkCloudConnection(
      profile?.nickname || 'Rider'
    );

    setCloudStatus(
      result.ok
        ? { state: 'online', error: '' }
        : {
            state: 'offline',
            error: result.error || 'Keine Verbindung',
          }
    );

    setCloudBusy(false);
  };

  const setStats = async (next) => {
    setStatsState(next);
    await localSet('stats', next);
  };

  const finishOnboarding = (newProfile, initialStats) => {
    setProfile(newProfile);
    setStatsState(initialStats || EMPTY_STATS);
  };

  const changeProfilePhoto = async () => {
    if (!profile) return;

    const image = await pickAndResizeImage();
    if (!image) return;

    const avatarUri = await persistImage(image.uri, 'profile');
    const next = { ...profile, avatarUri };

    setProfile(next);
    await localSet('profile', next);
  };

  if (!ready) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <ImageBackground
          source={require('./assets/afterdark-loading.png')}
          style={styles.loadingImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (!profile) {
    return <Onboarding onDone={finishOnboarding} />;
  }

  const sport =
    SPORT_BY_ID[profile.sportId] ||
    sportsForSeason(profile.season)[0];

  const sportOptions = sportsForSeason(profile.season);

  const changeSeason = async (season) => {
    let sportId = profile.sportId;

    if (!sportsForSeason(season).some((s) => s.id === sportId)) {
      sportId = sportsForSeason(season)[0].id;
    }

    const next = {
      ...profile,
      season,
      sportId,
    };

    setProfile(next);
    await localSet('profile', next);
  };

  const changeSport = async (sportId) => {
    const next = {
      ...profile,
      sportId,
    };

    setProfile(next);
    await localSet('profile', next);
    setSportOpen(false);
  };

  const common = {
    sport,
    profile,
    stats,
    setStats,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.bg}
      />

      <View style={styles.bgAccentOne} />
      <View style={styles.bgAccentTwo} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <View style={styles.topRow}>
          <Logo compact />

          <Pressable
            onPress={changeProfilePhoto}
            style={({ pressed }) => [
              styles.profileChip,
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={styles.avatarWrap}>
              {profile.avatarUri ? (
                <Image
                  source={{ uri: profile.avatarUri }}
                  style={styles.avatar}
                />
              ) : (
                <AppIcon
                  name="user"
                  size={20}
                  color={COLORS.ice}
                />
              )}

              <View style={styles.avatarEdit}>
                <AppIcon
                  name="edit"
                  size={10}
                  color={COLORS.bg}
                />
              </View>
            </View>

            <Text style={styles.profileName}>
              @{profile.nickname}
            </Text>
          </Pressable>
        </View>

        <Card style={styles.focusCard}>
          <View style={styles.focusRow}>
            <View
              style={[
                styles.sportIconCircle,
                {
                  borderColor: `${sport.color}55`,
                  backgroundColor: `${sport.color}0F`,
                },
              ]}
            >
              <SportIcon id={sport.id} color={sport.color} />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.focusSport,
                  { color: sport.color },
                ]}
              >
                {sport.name}
              </Text>

              <View style={styles.focusMetaRow}>
                <SeasonChip season={profile.season} />
                <View style={styles.metaDot} />
                <Text style={styles.focusMeta}>
                  Battle {sport.battle}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setSportOpen((value) => !value)}
              style={styles.changeSportButton}
            >
              <Text style={styles.changeSportText}>
                {sportOpen ? 'Fertig' : 'Wechseln'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <StatBadge
              label="Tricks"
              value={stats.tricks || 0}
              color={sport.color}
            />
            <StatBadge
              label="Siege"
              value={stats.wins || 0}
              color={COLORS.pink}
            />
            <StatBadge
              label="Streak"
              value={stats.streak || 0}
              color={COLORS.ice}
            />
            <StatBadge
              label="Min"
              value={stats.trainingMinutes || 0}
              color={COLORS.volt}
            />
          </View>

          {sportOpen ? (
            <View style={styles.sportChooser}>
              <View style={styles.row}>
                <Pressable
                  onPress={() => changeSeason('summer')}
                  style={[
                    styles.seasonChoice,
                    profile.season === 'summer' && styles.seasonChoiceActive,
                  ]}
                >
                  <AppIcon
                    name="sun"
                    size={18}
                    color={
                      profile.season === 'summer'
                        ? COLORS.volt
                        : COLORS.muted
                    }
                  />
                  <Text style={styles.seasonChoiceText}>Sommer</Text>
                </Pressable>

                <Pressable
                  onPress={() => changeSeason('winter')}
                  style={[
                    styles.seasonChoice,
                    profile.season === 'winter' && styles.seasonChoiceActive,
                  ]}
                >
                  <AppIcon
                    name="snow"
                    size={18}
                    color={
                      profile.season === 'winter'
                        ? COLORS.ice
                        : COLORS.muted
                    }
                  />
                  <Text style={styles.seasonChoiceText}>Winter</Text>
                </Pressable>
              </View>

              <View style={styles.choiceGrid}>
                {sportOptions.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => changeSport(s.id)}
                    style={[
                      styles.choice,
                      sport.id === s.id && {
                        borderColor: s.color,
                        backgroundColor: `${s.color}12`,
                      },
                    ]}
                  >
                    <SportIcon id={s.id} color={s.color} />
                    <Text
                      style={[
                        styles.choiceText,
                        sport.id === s.id && { color: s.color },
                      ]}
                    >
                      {s.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </Card>

        <ConnectionCard
          open={connectionsOpen}
          onToggle={() => setConnectionsOpen((value) => !value)}
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
        {tab === 'more' && (
          <MoreHub
            page={morePage}
            setPage={setMorePage}
            common={common}
          />
        )}

        <View style={{ height: 14 }} />
      </ScrollView>

      <BottomNav
        tab={tab}
        onChange={setTab}
        color={sport.color}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  page: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 13,
  },
  stack: {
    gap: 13,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bgAccentOne: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 999,
    backgroundColor: `${COLORS.ice}05`,
    top: 50,
    right: -150,
  },
  bgAccentTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: `${COLORS.pink}04`,
    top: 310,
    left: -150,
  },
  onboard: {
    padding: 18,
    gap: 14,
  },
  onboardTop: {
    gap: 6,
    marginTop: 12,
    marginBottom: 4,
    alignItems: 'center',
  },
  onboardStep: {
    color: COLORS.muted,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  welcomeCard: {
    backgroundColor: COLORS.bgSoft,
  },
  welcomeKicker: {
    color: COLORS.ice,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.1,
  },
  welcomeTitle: {
    color: COLORS.text,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seasonChoice: {
    minWidth: 118,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.bgSoft,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seasonChoiceActive: {
    borderColor: COLORS.ice,
    backgroundColor: `${COLORS.ice}0D`,
  },
  seasonChoiceText: {
    color: COLORS.text,
    fontWeight: '850',
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    width: '48%',
    minHeight: 62,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.bgSoft,
    borderRadius: 19,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  choiceText: {
    color: COLORS.text,
    fontWeight: '800',
    flex: 1,
  },
  assessLevel: {
    gap: 7,
  },
  assessLevelTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },
  assessSkill: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  assessCheck: {
    color: COLORS.muted,
    fontSize: 24,
    width: 26,
  },
  assessText: {
    color: COLORS.text,
    fontWeight: '700',
    flex: 1,
  },
  topRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 1,
  },
  profileChip: {
    minHeight: 46,
    maxWidth: 160,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    borderRadius: 999,
    paddingLeft: 5,
    paddingRight: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    overflow: 'visible',
    backgroundColor: COLORS.panel2,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
  },
  avatarEdit: {
    position: 'absolute',
    right: -3,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: COLORS.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    color: COLORS.text,
    fontWeight: '850',
    flexShrink: 1,
  },
  focusCard: {
    backgroundColor: COLORS.bgSoft,
    borderColor: COLORS.line,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  sportIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusSport: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.3,
  },
  focusMetaRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  seasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  seasonChipText: {
    color: COLORS.muted,
    fontSize: 12.5,
    fontWeight: '750',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: COLORS.muted,
  },
  focusMeta: {
    color: COLORS.muted,
    fontSize: 12.5,
    fontWeight: '700',
  },
  changeSportButton: {
    backgroundColor: COLORS.panel2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  changeSportText: {
    color: COLORS.ice,
    fontWeight: '850',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChooser: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
    paddingTop: 13,
    gap: 11,
  },
  connectionCard: {
    padding: 13,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  connectionIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: `${COLORS.ice}0A`,
    borderWidth: 1,
    borderColor: `${COLORS.ice}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionText: {
    flex: 1,
  },
  connectionTitle: {
    color: COLORS.text,
    fontSize: 16.5,
    fontWeight: '900',
  },
  connectionSub: {
    color: COLORS.muted,
    fontSize: 12.5,
    marginTop: 3,
  },
  openChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  connectionToggle: {
    color: COLORS.ice,
    fontWeight: '850',
    fontSize: 13,
  },
  connectionStack: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
    paddingTop: 12,
  },
  connectionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  statusName: {
    color: COLORS.text,
    fontWeight: '900',
  },
  moreHero: {
    paddingHorizontal: 3,
    paddingTop: 4,
    paddingBottom: 2,
  },
  moreHeroTitle: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1.2,
  },
  moreHeroSub: {
    color: COLORS.muted,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 2.3,
    marginTop: 2,
  },
  moreHeroLine: {
    width: 72,
    height: 3,
    borderRadius: 999,
    backgroundColor: COLORS.ice,
    marginTop: 9,
    transform: [{ rotate: '-2deg' }],
  },
  moreGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  moreTile: {
    flex: 1,
    minHeight: 126,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    borderRadius: 23,
    padding: 11,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  moreIconBubble: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: `${COLORS.ice}0B`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  moreLabel: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 15,
  },
  moreSub: {
    color: COLORS.muted,
    fontWeight: '650',
    fontSize: 10.5,
    marginTop: 3,
  },
  moreArrow: {
    position: 'absolute',
    right: 8,
    top: 12,
  },
  bottomNav: {
    minHeight: 74,
    flexDirection: 'row',
    backgroundColor: '#090F1A',
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
    paddingHorizontal: 5,
    paddingTop: 5,
    paddingBottom: 7,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    position: 'relative',
  },
  navIconWrap: {
    width: 38,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: COLORS.muted,
    fontSize: 10.5,
    fontWeight: '800',
  },
  navLine: {
    position: 'absolute',
    bottom: -1,
    width: 30,
    height: 3,
    borderRadius: 999,
  },
});
