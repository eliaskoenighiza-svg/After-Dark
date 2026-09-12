import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
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
import {
  checkCloudConnection,
  cloudConfigured,
  getMyCrews,
  getActiveCrewSpotsCloud,
} from './src/services/supabase';
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
      <Text style={styles.seasonChipText}>
        {winter ? 'Winter' : 'Sommer'}
      </Text>
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
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <ScrollView
        contentContainerStyle={styles.onboard}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.onboardTop}>
          <Logo centered />
          <Text style={styles.onboardStep}>
            Einrichtung {step} / 2
          </Text>
        </View>

        {step === 1 ? (
          <>
            <Card style={styles.welcomeCard}>
              <Text style={styles.welcomeKicker}>AFTER[DARK</Text>
              <Text style={styles.welcomeTitle}>
                Deine Crew. Deine Tricks.
              </Text>
              <Muted>
                Richte dein Profil ein. Danach passt sich After[Dark
                an deinen Sport und deinen aktuellen Stand an.
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
                    color={
                      season === 'summer'
                        ? COLORS.volt
                        : COLORS.muted
                    }
                  />
                  <Text style={styles.seasonChoiceText}>Sommer</Text>
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
                    color={
                      season === 'winter'
                        ? COLORS.ice
                        : COLORS.muted
                    }
                  />
                  <Text style={styles.seasonChoiceText}>Winter</Text>
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
            <Title color={sport.color}>
              Was kannst du schon?
            </Title>

            <Muted>
              Hake alles an, was du sicher kannst. Damit startet dein
              Skill-Baum direkt an der richtigen Stelle.
            </Muted>

            {sport.levels.map(([level, names]) => (
              <View key={level} style={styles.assessLevel}>
                <Text
                  style={[
                    styles.assessLevelTitle,
                    { color: sport.color },
                  ]}
                >
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
                title="After[Dark starten"
                onPress={finish}
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
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
    <View style={styles.connectionCard}>
      <Pressable
        onPress={onToggle}
        style={styles.connectionHeader}
      >
        <View style={styles.connectionIcon}>
          <AppIcon
            name="cloud"
            size={25}
            color={COLORS.ice}
          />
        </View>

        <View style={styles.connectionText}>
          <Text style={styles.connectionTitle}>
            Verbindungen
          </Text>
          <Text style={styles.connectionSub}>
            KI {aiOnline ? 'online' : 'offline'}
            {'  ·  '}
            Cloud {cloudOnline ? 'online' : 'offline'}
          </Text>
        </View>

        <View style={styles.openButton}>
          <Text style={styles.openButtonText}>
            {open ? 'Schließen' : 'Öffnen'}
          </Text>
          <AppIcon
            name="chevron"
            size={15}
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
                {
                  backgroundColor: aiOnline
                    ? COLORS.success
                    : COLORS.pink,
                },
              ]}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.statusName}>Claude KI</Text>
              <Muted>
                {aiOnline
                  ? `Verbunden${aiStatus.model ? ` · ${aiStatus.model}` : ''}`
                  : 'Noch über lokalen PC-Proxy.'}
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
                {
                  backgroundColor: cloudOnline
                    ? COLORS.success
                    : COLORS.warning,
                },
              ]}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.statusName}>
                Supabase Crew-Cloud
              </Text>
              <Muted>
                {cloudOnline
                  ? 'Anonyme Anmeldung funktioniert.'
                  : cloudConfigured()
                    ? (cloudStatus.error || 'Noch nicht verbunden.')
                    : 'Supabase-Zugangsdaten fehlen.'}
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
    </View>
  );
}

const TILE_ICONS = {
  crew: 'crew',
  chat: 'chat',
  memories: 'memories',
};

const TILE_SUBS = {
  crew: 'Deine Leute',
  chat: 'Immer in Kontakt',
  memories: 'Deine Highlights',
};

const TILE_THEME = {
  crew: {
    accent: COLORS.ice,
    accent2: '#1B88A8',
    background: '#071722',
    border: '#23516A',
    code: '01',
  },
  chat: {
    accent: COLORS.pink,
    accent2: COLORS.purple,
    background: '#150A17',
    border: '#54304F',
    code: '02',
  },
  memories: {
    accent: '#72C9FF',
    accent2: '#3C7DFF',
    background: '#081422',
    border: '#2A4D6C',
    code: '03',
  },
};

function MoreTileArt({ id, theme }) {
  if (id === 'crew') {
    return (
      <View style={styles.tileArt}>
        <View style={[styles.crewOrbit, { borderColor: `${theme.accent}55` }]} />
        <View style={[styles.crewDot, styles.crewDotOne, { backgroundColor: theme.accent }]} />
        <View style={[styles.crewDot, styles.crewDotTwo, { backgroundColor: '#FFFFFF' }]} />
        <View style={[styles.crewDot, styles.crewDotThree, { backgroundColor: theme.accent2 }]} />
        <View style={[styles.crewLink, { backgroundColor: `${theme.accent}66` }]} />
      </View>
    );
  }

  if (id === 'chat') {
    return (
      <View style={styles.tileArt}>
        <View style={[styles.chatBubbleBack, { borderColor: `${theme.accent2}66` }]} />
        <View style={[styles.chatBubbleFront, { borderColor: `${theme.accent}88` }]}>
          <View style={styles.chatDots}>
            <View style={[styles.chatDot, { backgroundColor: theme.accent }]} />
            <View style={[styles.chatDot, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.chatDot, { backgroundColor: theme.accent2 }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tileArt}>
      <View style={[styles.memoryFrame, { borderColor: `${theme.accent}88` }]}>
        <View style={[styles.memoryHorizon, { backgroundColor: `${theme.accent2}66` }]} />
        <View style={[styles.memorySun, { backgroundColor: theme.accent }]} />
      </View>
      <View style={[styles.memoryFlash, { borderColor: theme.accent }]} />
    </View>
  );
}

function MoreTile({ id, label, onPress }) {
  const theme = TILE_THEME[id];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.moreTile,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
        },
        pressed && {
          transform: [{ scale: 0.985 }],
          opacity: 0.9,
        },
      ]}
    >
      <View
        style={[
          styles.moreTileGlow,
          { backgroundColor: `${theme.accent}12` },
        ]}
      />

      <View
        style={[
          styles.moreTileTopLine,
          { backgroundColor: theme.accent },
        ]}
      />

      <Text style={[styles.moreTileCode, { color: `${theme.accent}99` }]}>
        {theme.code}
      </Text>

      <MoreTileArt id={id} theme={theme} />

      <View
        style={[
          styles.moreTileIcon,
          {
            borderColor: `${theme.accent}44`,
            backgroundColor: `${theme.accent}0D`,
          },
        ]}
      >
        <AppIcon
          name={TILE_ICONS[id]}
          size={25}
          color={theme.accent}
        />
      </View>

      <View style={styles.moreTileBottom}>
        <Text style={styles.moreTileLabel}>{label}</Text>
        <Text style={[styles.moreTileSub, { color: theme.accent }]}>
          {TILE_SUBS[id]}
        </Text>
      </View>

      <View style={styles.moreTileArrow}>
        <AppIcon
          name="chevron"
          size={16}
          color="#FFFFFF"
        />
      </View>
    </Pressable>
  );
}

function MoreHome({function MoreHome({
  profile,
  setPage,
  connectionProps,
}) {
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    if (!cloudConfigured()) return;

    let cancelled = false;

    const refresh = async () => {
      try {
        const crews = await getMyCrews();

        if (!crews.ok || !(crews.crews || []).length) {
          if (!cancelled) setLiveCount(0);
          return;
        }

        const result = await getActiveCrewSpotsCloud(
          crews.crews[0].id
        );

        if (!cancelled && result.ok) {
          setLiveCount((result.spots || []).length);
        }
      } catch {
        if (!cancelled) setLiveCount(0);
      }
    };

    refresh();
    const timer = setInterval(refresh, 10000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const liveText =
    liveCount === 1
      ? '1 Rider draußen'
      : `${liveCount} Rider draußen`;

  return (
    <View style={styles.moreHome}>
      <View style={styles.moreHero}>
        <Text style={styles.moreHeroTitle}>Mehr</Text>
        <Text style={styles.moreHeroSub}>
          CREW · CHAT · MEMORIES
        </Text>
        <View style={styles.moreHeroSlash} />
      </View>

      <ConnectionCard {...connectionProps} />

      <View style={styles.moreTilesRow}>
        <MoreTile
          id="crew"
          label="Crew"
          onPress={() => setPage('crew')}
        />
        <MoreTile
          id="chat"
          label="Chat"
          onPress={() => setPage('chat')}
        />
        <MoreTile
          id="memories"
          label="Memories"
          onPress={() => setPage('memories')}
        />
      </View>

      <View style={styles.crewCloudCard}>
        <View style={styles.crewCloudGlow} />
        <View style={styles.crewCloudSceneOne} />
        <View style={styles.crewCloudSceneTwo} />

        <View style={styles.crewCloudTop}>
          <View style={styles.crewCloudIcon}>
            <AppIcon
              name="cloud"
              size={27}
              color={COLORS.ice}
            />
          </View>

          <Text style={styles.crewCloudTitle}>
            Crew-Cloud
          </Text>

          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEU</Text>
          </View>
        </View>

        <Text style={styles.crewCloudText}>
          Die neue Crew-Basis. Erstelle eine Crew, lade deine
          Freunde ein und tretet mit einem eigenen Code bei.
          Eure Spots, Bestenlisten, Wochen-Battles, Ziele und
          Fotos – alles an einem Ort.
        </Text>

        <Pressable
          onPress={() => setPage('crew')}
          style={({ pressed }) => [
            styles.crewPrimaryButton,
            pressed && { opacity: 0.86 },
          ]}
        >
          <AppIcon
            name="plus"
            size={21}
            color={COLORS.bg}
            strokeWidth={2.2}
          />
          <Text style={styles.crewPrimaryText}>
            Crew erstellen
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPage('crew')}
          style={({ pressed }) => [
            styles.crewSecondaryButton,
            pressed && { opacity: 0.82 },
          ]}
        >
          <AppIcon
            name="crew"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.crewSecondaryText}>
            Mit Code beitreten
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => setPage('crew')}
        style={({ pressed }) => [
          styles.liveCard,
          pressed && { opacity: 0.86 },
        ]}
      >
        <View style={styles.liveIcon}>
          <AppIcon
            name="crew"
            size={29}
            color={COLORS.ice}
          />
        </View>

        <View style={styles.liveContent}>
          <View style={styles.liveHeaderRow}>
            <Text style={styles.liveTitle}>
              Wer ist gerade draußen?
            </Text>
            <AppIcon
              name="chevron"
              size={18}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.liveSub}>
            Sieh, welche Rider aus deiner Crew gerade unterwegs sind.
          </Text>

          <View style={styles.liveBottom}>
            <View style={styles.avatarStack}>
              <View style={[styles.liveAvatar, { zIndex: 4 }]}>
                {profile.avatarUri ? (
                  <Image
                    source={{ uri: profile.avatarUri }}
                    style={styles.liveAvatarImage}
                  />
                ) : (
                  <AppIcon
                    name="user"
                    size={18}
                    color={COLORS.ice}
                  />
                )}
              </View>

              <View style={[
                styles.liveAvatar,
                styles.liveAvatarOffset1,
                { zIndex: 3 },
              ]}>
                <AppIcon
                  name="user"
                  size={17}
                  color={COLORS.warning}
                />
              </View>

              <View style={[
                styles.liveAvatar,
                styles.liveAvatarOffset2,
                { zIndex: 2 },
              ]}>
                <AppIcon
                  name="user"
                  size={17}
                  color={COLORS.pink}
                />
              </View>

              <View style={[
                styles.liveAvatar,
                styles.liveAvatarOffset3,
                { zIndex: 1 },
              ]}>
                <AppIcon
                  name="user"
                  size={17}
                  color={COLORS.ice}
                />
              </View>
            </View>

            <View style={styles.liveStatusPill}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.liveStatusText}>
                {liveText}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function MoreHub({
  page,
  setPage,
  common,
  connectionProps,
}) {
  if (page === 'home') {
    return (
      <MoreHome
        profile={common.profile}
        setPage={setPage}
        connectionProps={connectionProps}
      />
    );
  }

  const title =
    page === 'crew'
      ? 'Crew'
      : page === 'chat'
        ? 'Chat'
        : 'Memories';

  return (
    <View style={styles.moreSubPage}>
      <Pressable
        onPress={() => setPage('home')}
        style={styles.backRow}
      >
        <View style={styles.backButton}>
          <AppIcon
            name="back"
            size={18}
            color={COLORS.ice}
          />
        </View>
        <Text style={styles.backText}>Mehr</Text>
      </Pressable>

      <Text style={styles.subPageTitle}>{title}</Text>

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
            <View
              style={[
                styles.navIconWrap,
                active && {
                  backgroundColor: `${color}10`,
                },
              ]}
            >
              <AppIcon
                name={icon}
                size={22}
                color={active ? color : '#F5F7FB'}
                strokeWidth={active ? 2.2 : 1.8}
              />
            </View>

            <Text
              style={[
                styles.navLabel,
                active && { color },
              ]}
            >
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
  const [morePage, setMorePage] = useState('home');
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
        new Promise((resolve) => setTimeout(resolve, 1100)),
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
        ? {
            state: 'online',
            error: '',
          }
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

  const finishOnboarding = (
    newProfile,
    initialStats
  ) => {
    setProfile(newProfile);
    setStatsState(initialStats || EMPTY_STATS);
  };

  const changeProfilePhoto = async () => {
    if (!profile) return;

    const image = await pickAndResizeImage();
    if (!image) return;

    const avatarUri = await persistImage(
      image.uri,
      'profile'
    );

    const next = {
      ...profile,
      avatarUri,
    };

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

  const sportOptions = sportsForSeason(
    profile.season
  );

  const changeSeason = async (season) => {
    let sportId = profile.sportId;

    if (
      !sportsForSeason(season).some(
        (s) => s.id === sportId
      )
    ) {
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

  const handleTabChange = (nextTab) => {
    setTab(nextTab);

    if (nextTab === 'more') {
      setMorePage('home');
    }
  };

  const common = {
    sport,
    profile,
    stats,
    setStats,
  };

  const connectionProps = {
    open: connectionsOpen,
    onToggle: () => {
      setConnectionsOpen((value) => !value);
    },
    aiStatus,
    aiBusy,
    onAICheck: () => runAICheck(true),
    cloudStatus,
    cloudBusy,
    onCloudCheck: () => runCloudCheck(true),
  };

  return (
    <View style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.bg}
      />

      <View style={styles.bgGlowOne} />
      <View style={styles.bgGlowTwo} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <View style={styles.topRow}>
          <Logo compact />

          <View style={styles.topActions}>
            <View style={styles.bellButton}>
              <AppIcon
                name="bell"
                size={20}
                color="#FFFFFF"
              />
              <View style={styles.bellDot} />
            </View>

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
                    size={19}
                    color={COLORS.ice}
                  />
                )}
              </View>

              <Text style={styles.profileName}>
                @{profile.nickname}
              </Text>
            </Pressable>
          </View>
        </View>

        {tab !== 'more' ? (
          <>
            <Card style={styles.focusCard} variant="night">
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
                  <SportIcon
                    id={sport.id}
                    color={sport.color}
                  />
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
                  onPress={() => {
                    setSportOpen((value) => !value);
                  }}
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
                      onPress={() => {
                        changeSeason('summer');
                      }}
                      style={[
                        styles.seasonChoice,
                        profile.season === 'summer' &&
                          styles.seasonChoiceActive,
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
                      <Text style={styles.seasonChoiceText}>
                        Sommer
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        changeSeason('winter');
                      }}
                      style={[
                        styles.seasonChoice,
                        profile.season === 'winter' &&
                          styles.seasonChoiceActive,
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
                      <Text style={styles.seasonChoiceText}>
                        Winter
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.choiceGrid}>
                    {sportOptions.map((s) => (
                      <Pressable
                        key={s.id}
                        onPress={() => {
                          changeSport(s.id);
                        }}
                        style={[
                          styles.choice,
                          sport.id === s.id && {
                            borderColor: s.color,
                            backgroundColor: `${s.color}12`,
                          },
                        ]}
                      >
                        <SportIcon
                          id={s.id}
                          color={s.color}
                        />
                        <Text
                          style={[
                            styles.choiceText,
                            sport.id === s.id && {
                              color: s.color,
                            },
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

            {tab === 'coach' && (
              <CoachTab
                {...common}
                connection={<ConnectionCard {...connectionProps} />}
              />
            )}
            {tab === 'skills' && (
              <SkillsTab {...common} />
            )}
            {tab === 'battle' && (
              <BattleTab {...common} />
            )}
            {tab === 'parks' && (
              <ParksTab {...common} />
            )}
          </>
        ) : (
          <MoreHub
            page={morePage}
            setPage={setMorePage}
            common={common}
            connectionProps={connectionProps}
          />
        )}

        <View style={{ height: 12 }} />
      </ScrollView>

      <BottomNav
        tab={tab}
        onChange={handleTabChange}
        color={tab === 'more' ? COLORS.ice : sport.color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: StatusBar.currentHeight || 0,
  },
  scroll: {
    flex: 1,
  },
  page: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 7,
    gap: 12,
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
  bgGlowOne: {
    position: 'absolute',
    top: 70,
    right: -170,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: `${COLORS.ice}05`,
  },
  bgGlowTwo: {
    position: 'absolute',
    top: 400,
    left: -190,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: `${COLORS.pink}04`,
  },
  onboard: {
    padding: 18,
    gap: 14,
  },
  onboardTop: {
    gap: 7,
    marginTop: 10,
    marginBottom: 4,
    alignItems: 'center',
  },
  onboardStep: {
    color: COLORS.muted,
    fontWeight: '800',
  },
  welcomeCard: {
    backgroundColor: COLORS.bgSoft,
  },
  welcomeKicker: {
    color: COLORS.ice,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  welcomeTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    borderRadius: 18,
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
    borderRadius: 15,
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
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    right: 8,
    top: 7,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: COLORS.pink,
  },
  profileChip: {
    minHeight: 42,
    maxWidth: 145,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    borderRadius: 999,
    paddingLeft: 4,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: COLORS.panel2,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
  },
  avatarEdit: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: COLORS.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    color: COLORS.text,
    fontWeight: '800',
    flexShrink: 1,
    fontSize: 13,
  },
  focusCard: {
    backgroundColor: COLORS.bgSoft,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sportIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusSport: {
    fontSize: 21,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  focusMetaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seasonChipText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 99,
    backgroundColor: COLORS.muted,
  },
  focusMeta: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  changeSportButton: {
    backgroundColor: COLORS.panel2,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  changeSportText: {
    color: COLORS.ice,
    fontWeight: '800',
    fontSize: 12.5,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChooser: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
    paddingTop: 12,
    gap: 10,
  },
  seasonChoice: {
    minWidth: 112,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.bgSoft,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  seasonChoiceActive: {
    borderColor: COLORS.ice,
    backgroundColor: `${COLORS.ice}0C`,
  },
  seasonChoiceText: {
    color: COLORS.text,
    fontWeight: '800',
  },
  connectionCard: {
    backgroundColor: '#0A1524',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#20405D',
    padding: 11,
    gap: 10,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  connectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#0E2033',
    borderWidth: 1,
    borderColor: '#2A5871',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionText: {
    flex: 1,
  },
  connectionTitle: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  connectionSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },
  openButton: {
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.ice,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  openButtonText: {
    color: COLORS.ice,
    fontWeight: '800',
    fontSize: 12.5,
  },
  connectionStack: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
    paddingTop: 10,
    gap: 10,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  statusName: {
    color: COLORS.text,
    fontWeight: '900',
  },
  moreHome: {
    gap: 12,
  },
  moreHero: {
    paddingHorizontal: 2,
    paddingTop: 7,
    paddingBottom: 2,
  },
  moreHeroTitle: {
    color: '#FFFFFF',
    fontSize: 43,
    lineHeight: 47,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1.8,
  },
  moreHeroSub: {
    color: '#CFD7E4',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 2.7,
    marginTop: 1,
  },
  moreHeroSlash: {
    width: 88,
    height: 3,
    borderRadius: 99,
    backgroundColor: COLORS.ice,
    marginTop: 8,
    transform: [{ rotate: '-3deg' }],
  },
  moreTilesRow: {
    flexDirection: 'row',
    gap: 7,
  },
  moreTile: {
    flex: 1,
    height: 142,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 10,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  moreTileGlow: {
    position: 'absolute',
    width: 115,
    height: 115,
    borderRadius: 999,
    right: -52,
    top: -43,
  },
  moreTileTopLine: {
    position: 'absolute',
    top: 0,
    left: 13,
    width: 36,
    height: 2,
    borderRadius: 999,
  },
  moreTileCode: {
    position: 'absolute',
    right: 8,
    top: 7,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  tileArt: {
    position: 'absolute',
    left: 7,
    right: 7,
    top: 8,
    height: 72,
  },
  crewOrbit: {
    position: 'absolute',
    width: 64,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    left: 17,
    top: 14,
    transform: [{ rotate: '-10deg' }],
  },
  crewDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#071722',
  },
  crewDotOne: {
    left: 20,
    top: 21,
  },
  crewDotTwo: {
    left: 43,
    top: 11,
  },
  crewDotThree: {
    left: 63,
    top: 28,
  },
  crewLink: {
    position: 'absolute',
    left: 31,
    top: 37,
    width: 39,
    height: 2,
    borderRadius: 99,
    transform: [{ rotate: '8deg' }],
  },
  chatBubbleBack: {
    position: 'absolute',
    width: 58,
    height: 34,
    borderRadius: 13,
    borderWidth: 1,
    right: 11,
    top: 10,
    transform: [{ rotate: '7deg' }],
  },
  chatBubbleFront: {
    position: 'absolute',
    width: 66,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    left: 11,
    top: 24,
    backgroundColor: '#120B16CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatDots: {
    flexDirection: 'row',
    gap: 5,
  },
  chatDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  memoryFrame: {
    position: 'absolute',
    left: 17,
    top: 11,
    width: 62,
    height: 45,
    borderRadius: 11,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#091A29AA',
  },
  memoryHorizon: {
    position: 'absolute',
    left: -5,
    right: -5,
    bottom: 7,
    height: 18,
    borderRadius: 99,
    transform: [{ rotate: '-7deg' }],
  },
  memorySun: {
    position: 'absolute',
    right: 10,
    top: 8,
    width: 10,
    height: 10,
    borderRadius: 99,
  },
  memoryFlash: {
    position: 'absolute',
    right: 7,
    top: 6,
    width: 15,
    height: 15,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  moreTileIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  moreTileBottom: {
    gap: 2,
  },
  moreTileLabel: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14.5,
  },
  moreTileSub: {
    fontSize: 9.6,
    fontWeight: '800',
  },
  moreTileArrow: {
    position: 'absolute',
    right: 5,
    bottom: 27,
  },
  crewCloudCard: {
    minHeight: 273,
    backgroundColor: '#0B1725',
    borderWidth: 1,
    borderColor: '#254965',
    borderRadius: 23,
    padding: 14,
    gap: 11,
    overflow: 'hidden',
  },
  crewCloudGlow: {
    position: 'absolute',
    right: -30,
    top: -20,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: `${COLORS.ice}08`,
  },
  crewCloudSceneOne: {
    position: 'absolute',
    right: 18,
    top: 70,
    width: 56,
    height: 96,
    borderRadius: 40,
    backgroundColor: '#1B385022',
    transform: [{ rotate: '-13deg' }],
  },
  crewCloudSceneTwo: {
    position: 'absolute',
    right: 69,
    top: 91,
    width: 38,
    height: 77,
    borderRadius: 30,
    backgroundColor: '#17354B20',
    transform: [{ rotate: '9deg' }],
  },
  crewCloudTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  crewCloudIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: `${COLORS.ice}0B`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewCloudTitle: {
    color: '#FFFFFF',
    fontSize: 20.5,
    fontWeight: '900',
    fontStyle: 'italic',
    flex: 1,
  },
  newBadge: {
    backgroundColor: COLORS.volt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  newBadgeText: {
    color: COLORS.bg,
    fontWeight: '900',
    fontSize: 10.5,
  },
  crewCloudText: {
    color: '#C9D2DF',
    lineHeight: 18.5,
    fontSize: 12.3,
    paddingRight: 8,
  },
  crewPrimaryButton: {
    minHeight: 49,
    borderRadius: 999,
    backgroundColor: COLORS.volt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  crewPrimaryText: {
    color: COLORS.bg,
    fontWeight: '900',
    fontSize: 15,
  },
  crewSecondaryButton: {
    minHeight: 45,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#31506A',
    backgroundColor: '#0A1421CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  crewSecondaryText: {
    color: '#D4DCE7',
    fontWeight: '700',
    fontSize: 13.5,
  },
  liveCard: {
    backgroundColor: '#0A1523',
    borderWidth: 1,
    borderColor: '#23445F',
    borderRadius: 22,
    minHeight: 128,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
  },
  liveIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: `${COLORS.ice}0A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveContent: {
    flex: 1,
  },
  liveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
  },
  liveSub: {
    color: COLORS.muted,
    fontSize: 11.3,
    lineHeight: 16,
    marginTop: 3,
  },
  liveBottom: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarStack: {
    width: 105,
    height: 35,
    position: 'relative',
  },
  liveAvatar: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 35,
    height: 35,
    borderRadius: 999,
    backgroundColor: COLORS.panel2,
    borderWidth: 2,
    borderColor: '#DDE7F1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  liveAvatarOffset1: {
    left: 24,
  },
  liveAvatarOffset2: {
    left: 48,
  },
  liveAvatarOffset3: {
    left: 72,
  },
  liveAvatarImage: {
    width: 31,
    height: 31,
    borderRadius: 999,
  },
  liveStatusPill: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#28465B',
    backgroundColor: '#07111D',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#25F13B',
    shadowColor: '#25F13B',
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  liveStatusText: {
    color: '#E4EAF2',
    fontSize: 11,
    fontWeight: '700',
  },
  moreSubPage: {
    gap: 12,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: COLORS.ice,
    fontWeight: '800',
  },
  subPageTitle: {
    color: '#FFFFFF',
    fontSize: 33,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  bottomNav: {
    minHeight: 72,
    flexDirection: 'row',
    backgroundColor: '#060C15',
    borderTopWidth: 1,
    borderTopColor: '#1B3044',
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
    color: '#F2F5F8',
    fontSize: 10,
    fontWeight: '750',
  },
  navLine: {
    position: 'absolute',
    bottom: -1,
    width: 30,
    height: 3,
    borderRadius: 999,
  },
});
