import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Font from 'expo-font';
import Logo from './src/components/Logo';
import AppIcon from './src/components/AppIcon';
import SportIcon from './src/components/SportIcon';
import { Button, Card, Field, Muted, Title } from './src/components/UI';
import { COLORS, FONT_FILES, FONTS, GRADIENTS, RADII, SHADOWS, TYPE } from './src/theme';
import { Grad, Glow } from './src/design/Grad';
import LoadingScreen from './src/design/LoadingScreen';
import { CloudMoon, PopIn } from './src/design/motion';
import { BadgeImage, BadgeShelf, BadgeUnlockWatcher, BadgeVideo } from './src/design/badges';
import { SnowFall, useSkyPhase, PHASE_LABEL } from './src/design/ambient';
import { openShare, ShareHost } from './src/design/share';
import { haptic } from './src/design/haptics';
import { AccentContext, accentFor, useAccent } from './src/design/accent';
import {
  Avatar,
  IconTile,
  PosterCard,
  PressSurface,
  PrimaryButton,
  ScreenPoster,
  SecondaryButton,
  Segmented,
  StatCard,
  Sticker,
  Surface,
  Tag,
} from './src/design/kit';
import {
  BubblesArt,
  ChatArt,
  MoonArt,
  PolaroidArt,
  SmallArt,
  StairsArt,
  TapeArt,
} from './src/design/art';
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
import FeedTab from './src/tabs/FeedTab';
import GearTab from './src/tabs/GearTab';

const PRIMARY_TABS = [
  ['coach', 'coach', 'Coach'],
  ['skills', 'skills', 'Skills'],
  ['battle', 'battle', 'Battle'],
  ['parks', 'parks', 'Parks'],
  ['feed', 'feed', 'Feed'],
  ['more', 'more', 'Mehr'],
];

const EMPTY_STATS = {
  wins: 0,
  streak: 0,
  tricks: 0,
  bails: 0,
  trainingMinutes: 0,
};

// Night Ride v2: Licht je Bereich (nur Darstellung)
const TAB_GLOW = {
  coach: COLORS.cyan,
  skills: COLORS.lime,
  battle: COLORS.pink,
  parks: null,
  feed: COLORS.cyan,
  more: COLORS.violet,
};

function shade(hex, amount) {
  const h = String(hex || '#CFFF3A').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.max(0, Math.min(255, Math.round(amount > 0 ? c + (255 - c) * amount : c * (1 + amount))))
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function sportGradient(color) {
  return { colors: [shade(color, 0.35), shade(color, -0.35)], angle: 145 };
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
        <Glow color={COLORS.cyan} opacity={0.16} size={460} style={{ right: -160, top: -160 }} />
        <View style={styles.onboardTop}>
          <Logo centered />
          <Tag label={`Einrichtung ${step} / 2`} tone="neutral" style={{ alignSelf: 'center' }} />
        </View>

        {step === 1 ? (
          <>
            <PosterCard gradient={GRADIENTS.coach} glow="rgba(56,225,242,0.35)">
              <Sticker label="Night Ride" tone="lime" />
              <Text style={styles.welcomeTitle}>Deine Crew. Deine Tricks.</Text>
              <Text style={styles.welcomeText}>
                Richte dein Profil ein. Danach passt sich After[Dark
                an deinen Sport und deinen aktuellen Stand an.
              </Text>
            </PosterCard>

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
                    color={season === 'summer' ? COLORS.onLime : COLORS.text3}
                  />
                  <Text style={[styles.seasonChoiceText, season === 'summer' && styles.seasonChoiceTextActive]}>Sommer</Text>
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
                    color={season === 'winter' ? COLORS.onLime : COLORS.text3}
                  />
                  <Text style={[styles.seasonChoiceText, season === 'winter' && styles.seasonChoiceTextActive]}>Winter</Text>
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
                      sportId === s.id && styles.choiceActive,
                    ]}
                  >
                    <SportIcon
                      id={s.id}
                      color={sportId === s.id ? COLORS.onLime : COLORS.text2}
                      mono
                      strokeWidth={2}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.choiceText,
                        sportId === s.id && styles.choiceTextActive,
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
            <Title>Was kannst du schon?</Title>

            <Muted>
              Hake alles an, was du sicher kannst. Damit startet dein
              Skill-Baum direkt an der richtigen Stelle.
            </Muted>

            {sport.levels.map(([level, names]) => (
              <View key={level} style={styles.assessLevel}>
                <Text style={styles.assessLevelTitle}>{level}</Text>

                {names.map((name) => (
                  <Pressable
                    key={name}
                    onPress={() => toggleKnown(name)}
                    style={[
                      styles.assessSkill,
                      known[name] && styles.assessSkillActive,
                    ]}
                  >
                    <View style={[styles.assessCheck, known[name] && styles.assessCheckActive]}>
                      {known[name] ? (
                        <AppIcon name="check" size={14} color={COLORS.onLime} strokeWidth={3} />
                      ) : null}
                    </View>
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
              <View style={{ flex: 1 }}>
                <Button
                  title="After[Dark starten"
                  icon="play"
                  onPress={finish}
                />
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

// Verbindungs-Kacheln (Mehr: immer offen, Coach: über die Status-Zeile)
function ConnectionTiles({
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
    <View style={styles.connGrid}>
      <View style={styles.connTile}>
        <View style={styles.connTileTop}>
          {aiOnline ? (
            <IconTile name="chip" size={42} iconSize={20} gradient={GRADIENTS.avatarCyan} color="#04202A" radius={14} />
          ) : (
            <CloudMoon size={42} />
          )}
          <View style={[styles.connDot, { backgroundColor: aiOnline ? COLORS.lime : COLORS.pink, boxShadow: `0 0 12px ${aiOnline ? COLORS.lime : COLORS.pink}` }]} />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={styles.connName}>KI</Text>
          <Text style={styles.connSub} numberOfLines={3}>
            {aiOnline
              ? 'Cloudflare-KI · verbunden'
              : (aiStatus.error || 'Cloudflare-KI nicht erreichbar')}
          </Text>
        </View>
        <SecondaryButton
          title={aiBusy ? '…' : 'Prüfen'}
          tone="glass"
          size="sm"
          disabled={aiBusy}
          onPress={onAICheck}
        />
      </View>

      <View style={styles.connTile}>
        <View style={styles.connTileTop}>
          {cloudOnline ? (
            <IconTile name="cloud" size={42} iconSize={20} gradient={GRADIENTS.avatarViolet} color="#140C3A" radius={14} />
          ) : (
            <CloudMoon size={42} />
          )}
          <View style={[styles.connDot, { backgroundColor: cloudOnline ? COLORS.lime : COLORS.pink, boxShadow: `0 0 12px ${cloudOnline ? COLORS.lime : COLORS.pink}` }]} />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={styles.connName}>Crew-Cloud</Text>
          <Text style={styles.connSub} numberOfLines={3}>
            {cloudOnline
              ? 'Supabase · angemeldet'
              : cloudConfigured()
                ? (cloudStatus.error || 'Noch nicht verbunden.')
                : 'Supabase-Zugangsdaten fehlen.'}
          </Text>
        </View>
        <SecondaryButton
          title={cloudBusy ? '…' : 'Prüfen'}
          tone="glass"
          size="sm"
          disabled={cloudBusy || !cloudConfigured()}
          onPress={onCloudCheck}
        />
      </View>
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
    <View style={{ gap: 12 }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel="Verbindungen öffnen oder schließen"
        style={styles.statusRow}
      >
        <Tag label={aiOnline ? 'KI online' : 'KI offline'} tone={aiOnline ? 'lime' : 'pink'} dot big />
        <Tag label={cloudOnline ? 'Cloud online' : 'Cloud offline'} tone={cloudOnline ? 'lime' : 'pink'} dot big />
        <View style={styles.statusLink}>
          <Text style={styles.statusLinkText}>Verbindungen</Text>
          <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
            <AppIcon name="chevron" size={14} color={COLORS.text3} />
          </View>
        </View>
      </Pressable>

      {open ? (
        <Card>
          <ConnectionTiles
            aiStatus={aiStatus}
            aiBusy={aiBusy}
            onAICheck={onAICheck}
            cloudStatus={cloudStatus}
            cloudBusy={cloudBusy}
            onCloudCheck={onCloudCheck}
          />
        </Card>
      ) : null}
    </View>
  );
}

function MoreHome({
  profile,
  sport,
  setPage,
  connectionProps,
  onProfilePress,
  badgeProps = {},
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

  const aiOnline = connectionProps.aiStatus.state === 'online';
  const cloudOnline = connectionProps.cloudStatus.state === 'online';

  return (
    <View style={styles.stack}>
      <PressSurface
        onPress={onProfilePress}
        accessibilityLabel="Profilfoto ändern"
        radius={RADII.cardSm}
        style={styles.profileCard}
      >
        <View>
          {badgeProps.avatarBadge ? (
            <BadgeImage id={badgeProps.avatarBadge} size={60} />
          ) : (
            <Avatar uri={profile.avatarUri} size={60} />
          )}
          <View style={styles.profileBadge}>
            <AppIcon name="camera" size={12} color={COLORS.onLime} strokeWidth={2.6} />
          </View>
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={styles.profileName} numberOfLines={1}>@{profile.nickname}</Text>
          <Text style={TYPE.label} numberOfLines={1}>
            Profil · {sport.name} · {profile.season === 'winter' ? 'Winter' : 'Sommer'}
          </Text>
        </View>
        <View style={styles.roundBtn}>
          <AppIcon name="chevron" size={16} color={COLORS.text} />
        </View>
      </PressSurface>

      <Card>
        <View style={styles.headRow}>
          <Title>Abzeichen</Title>
          <Tag label="Antippen = Animation" tone="neutral" />
        </View>
        <BadgeShelf
          stats={badgeProps.stats}
          avatarBadge={badgeProps.avatarBadge}
          onSetAvatar={badgeProps.onSetAvatar}
          onShare={(b) => openShare({ kind: 'badge', badge: b.id, name: b.name, accent: b.color, sub: b.goal })}
        />
      </Card>

      <Card>
        <View style={styles.headRow}>
          <Title>Verbindungen</Title>
          <Tag
            label={aiOnline && cloudOnline ? 'Alles online' : 'Teilweise offline'}
            tone={aiOnline && cloudOnline ? 'lime' : 'pink'}
            dot
          />
        </View>
        <ConnectionTiles {...connectionProps} />
      </Card>

      <Pressable
        onPress={() => setPage('crew')}
        accessibilityRole="button"
        accessibilityLabel="Crew öffnen"
        style={({ pressed }) => [
          styles.crewTile,
          SHADOWS.poster('rgba(140,124,255,0.55)'),
          pressed && { transform: [{ scale: 0.985 }], opacity: 0.94 },
        ]}
      >
        <Grad {...GRADIENTS.crew} radius={RADII.poster} />
        <Text pointerEvents="none" style={styles.crewWatermark}>Crew</Text>
        <View style={styles.headRow}>
          <View style={{ gap: 5, flex: 1 }}>
            <Text style={styles.crewTitle}>Crew</Text>
            <Text style={styles.crewSub}>Deine Leute · Wer ist gerade draußen?</Text>
          </View>
          <BadgeVideo id="crew" size={64} />
        </View>
        <View style={styles.headRow}>
          <View style={{ flexDirection: 'row', paddingLeft: 12 }}>
            <View style={{ marginLeft: -12 }}>
              {badgeProps.avatarBadge ? (
                <BadgeImage id={badgeProps.avatarBadge} size={40} ring="#2A1F5C" />
              ) : (
                <Avatar uri={profile.avatarUri} size={40} ring="#2A1F5C" />
              )}
            </View>
            <View style={{ marginLeft: -12 }}>
              <Avatar size={40} gradient={GRADIENTS.avatarLime} color="#0B1404" ring="#2A1F5C" />
            </View>
            <View style={{ marginLeft: -12 }}>
              <Avatar size={40} gradient={GRADIENTS.avatarWhite} color="#060A10" ring="#2A1F5C" />
            </View>
          </View>
          <View style={[styles.livePill, liveCount ? styles.livePillOn : null]}>
            <View style={[styles.liveDot, { backgroundColor: liveCount ? COLORS.onLime : COLORS.text }]} />
            <Text style={[styles.livePillText, liveCount ? { color: COLORS.onLime } : null]}>{liveText}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.bento}>
        <PressSurface
          onPress={() => setPage('chat')}
          accessibilityLabel="Chat öffnen"
          gradient={GRADIENTS.tilePink}
          style={styles.moreTile}
        >
          <ChatArt />
          <View style={{ gap: 4 }}>
            <Text style={styles.moreTileTitle}>Chat</Text>
            <Text style={[TYPE.label, { color: '#E6A9C6' }]}>Crew-Räume</Text>
          </View>
        </PressSurface>
        <PressSurface
          onPress={() => setPage('memories')}
          accessibilityLabel="Memories öffnen"
          gradient={GRADIENTS.tileIce}
          style={styles.moreTile}
        >
          <PolaroidArt />
          <View style={{ gap: 4 }}>
            <Text style={styles.moreTileTitle}>Memories</Text>
            <Text style={[TYPE.label, { color: COLORS.iceText }]}>Deine Highlights</Text>
          </View>
        </PressSurface>
      </View>

      <PressSurface
        onPress={() => setPage('gear')}
        accessibilityLabel="Gear Kaufberatung öffnen"
        gradient={GRADIENTS.tileLime}
        style={styles.gearTile}
      >
        <View style={styles.gearTileIcon}>
          <AppIcon name="gear" size={30} color={COLORS.lime} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.moreTileTitle}>Gear</Text>
          <Text style={[TYPE.label, { color: COLORS.limeText }]}>Kaufberatung · Scooter · Ski · Setup</Text>
        </View>
        <AppIcon name="chevron" size={18} color={COLORS.lime} />
      </PressSurface>

      <PosterCard gradient={GRADIENTS.cloud} glow="rgba(207,255,58,0.25)">
        <Sticker label="Neu" tone="lime" />
        <Text style={styles.posterTitle}>Crew-Cloud</Text>
        <Text style={[TYPE.body, { marginTop: 12, fontSize: 14 }]}>
          Erstelle eine Crew, lade deine Freunde ein und tretet mit einem
          eigenen Code bei. Eure Spots, Bestenlisten, Wochen-Battles, Ziele
          und Fotos – alles an einem Ort.
        </Text>
        <View style={styles.codeRow} pointerEvents="none">
          {['A', 'D', '–', '–', '–', '–'].map((c, i) => (
            <View key={i} style={styles.codeSlot}>
              <Text style={[styles.codeSlotText, i < 2 && { color: COLORS.lime }]}>{c}</Text>
            </View>
          ))}
        </View>
        <PrimaryButton
          title="Crew erstellen"
          icon="plus"
          onPress={() => setPage('crew')}
          style={{ marginTop: 16 }}
        />
        <SecondaryButton
          title="Mit Code beitreten"
          icon="key"
          onPress={() => setPage('crew')}
          style={{ marginTop: 10 }}
        />
      </PosterCard>
    </View>
  );
}

function MoreHub({
  page,
  setPage,
  common,
  connectionProps,
  onProfilePress,
  badgeProps,
}) {
  if (page === 'home') {
    return (
      <MoreHome
        profile={common.profile}
        sport={common.sport}
        setPage={setPage}
        connectionProps={connectionProps}
        onProfilePress={onProfilePress}
        badgeProps={{ ...badgeProps, stats: common.stats }}
      />
    );
  }

  const title =
    page === 'crew'
      ? 'Crew'
      : page === 'chat'
        ? 'Chat'
        : page === 'gear'
          ? 'Gear'
          : 'Memories';

  return (
    <View style={styles.moreSubPage}>
      <Pressable
        onPress={() => setPage('home')}
        accessibilityRole="button"
        accessibilityLabel="Zurück zu Mehr"
        style={styles.backRow}
      >
        <View style={styles.backButton}>
          <AppIcon name="back" size={18} color={COLORS.text} />
        </View>
        <Text style={styles.backText}>Mehr</Text>
      </Pressable>

      <View style={styles.subHead}>
        <SmallArt kind={page} />
        <Text style={styles.subPageTitle}>{title}</Text>
      </View>

      {page === 'crew' && <CrewTab {...common} />}
      {page === 'chat' && <ChatTab {...common} />}
      {page === 'memories' && <MemoriesTab {...common} />}
      {page === 'gear' && <GearTab {...common} />}
    </View>
  );
}

function BottomNav({ tab, onChange, onSwipe }) {
  const accent = useAccent();
  const dockSwipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.05,
      onPanResponderRelease: (_, g) => {
        const far = Math.abs(g.dx) > 26 || Math.abs(g.vx) > 0.18;
        if (far) onSwipe?.(g.dx < 0 ? 1 : -1);
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  return (
    <View style={styles.dockWrap} {...dockSwipe.panHandlers}>
      <View style={[styles.dock, SHADOWS.dock]}>
        {PRIMARY_TABS.map(([id, icon, label]) => {
          const active = tab === id;

          return (
            <Pressable
              key={id}
              onPress={() => {
                if (!active) haptic.select();
                onChange(id);
              }}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              style={[
                styles.navItem,
                active && [styles.navItemActive, { backgroundColor: accent.color, boxShadow: `0 12px 28px -10px ${accent.glow}` }],
              ]}
            >
              {active ? (
                <PopIn key={id} from={0.7} style={styles.navInner}>
                  <AppIcon
                    name={icon}
                    size={22}
                    color={accent.ink}
                    strokeWidth={2.3}
                    fillOpacity={0.3}
                  />
                  <Text style={[styles.navLabel, { color: accent.ink }]}>{label}</Text>
                </PopIn>
              ) : (
                <AppIcon
                  name={icon}
                  size={23}
                  color={COLORS.text3}
                  strokeWidth={2}
                  fillOpacity={0.22}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function RiderStrip({ sport, profile, stats, sportOpen, onToggle, sportOptions, onSeason, onSport }) {
  return (
    <View style={{ gap: 8 }}>
      <PressSurface
        onPress={onToggle}
        accessibilityLabel="Sport wechseln"
        radius={RADII.cardSm}
        style={styles.rider}
      >
        <View style={styles.sportBadge}>
          <Grad {...sportGradient(sport.color)} radius={18} />
          <SportIcon id={sport.id} color="#0B1404" mono strokeWidth={2.4} size={28} />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={styles.riderName} numberOfLines={1}>{sport.name}</Text>
          <Text style={TYPE.label} numberOfLines={1}>
            {profile.season === 'winter' ? 'Winter' : 'Sommer'} · Battle {sport.battle}
          </Text>
        </View>
        <View style={styles.swapTag}>
          <AppIcon name="swap" size={14} color={COLORS.text} />
          <Text style={styles.swapText}>{sportOpen ? 'Fertig' : 'Wechseln'}</Text>
        </View>
      </PressSurface>

      {sportOpen ? (
        <Card>
          <Segmented
            items={[
              { key: 'summer', label: 'Sommer', icon: 'sun' },
              { key: 'winter', label: 'Winter', icon: 'snow' },
            ]}
            value={profile.season}
            onChange={onSeason}
          />
          <View style={styles.choiceGrid}>
            {sportOptions.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => onSport(s.id)}
                style={[styles.choice, sport.id === s.id && styles.choiceActive]}
              >
                <SportIcon
                  id={s.id}
                  color={sport.id === s.id ? COLORS.onLime : COLORS.text2}
                  mono
                  strokeWidth={2}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.choiceText, sport.id === s.id && styles.choiceTextActive]}
                >
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      <View style={styles.statsRow}>
        <StatCard label="Tricks" value={stats.tricks || 0} />
        <StatCard label="Siege" value={stats.wins || 0} />
        <StatCard label="Streak" value={stats.streak || 0} />
        <StatCard label="Minuten" value={stats.trainingMinutes || 0} />
      </View>
    </View>
  );
}

const POSTERS = {
  coach: { title: 'Coach', subtitle: 'Trick des Tages, Session & KI' },
  skills: { title: 'Skills', subtitle: 'Skill-Baum, Wochenziel & Plan' },
  battle: { title: 'Battle', subtitle: 'S.K.A.T.E., Bingo & Verlauf' },
  feed: { title: 'Feed', subtitle: 'Stories, Clips, Likes & Spots' },
  more: { title: 'Mehr', subtitle: 'Crew, Chat, Memories & Gear' },
};

function posterArt(tab, sport, phase) {
  if (tab === 'coach') return <MoonArt phase={phase} />;
  if (tab === 'skills') return <StairsArt accent={sport.color} />;
  if (tab === 'battle') return <TapeArt word={sport.battle} accent={sport.color} />;
  if (tab === 'feed') return <PolaroidArt />;
  if (tab === 'more') return <BubblesArt accent={sport.color} />;
  return null;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);
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

  // Night Ride v2: Atmosphäre, Badge-Profilbild, Wisch-Gesten (nur Darstellung)
  const phase = useSkyPhase();
  const [avatarBadge, setAvatarBadge] = useState(null);
  const dragX = useRef(new Animated.Value(0)).current;
  const [swipeFrom, setSwipeFrom] = useState('right');
  const swipeRef = useRef({ tab: 'coach', go: () => {} });

  useEffect(() => {
    localGet('ui:avatarBadge', null).then((v) => setAvatarBadge(v || null)).catch(() => {});
  }, []);

  const chooseAvatarBadge = (id) => {
    setAvatarBadge(id);
    localSet('ui:avatarBadge', id).catch(() => {});
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.1,
      onPanResponderMove: (_, g) => dragX.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        const far = Math.abs(g.dx) > 36 || Math.abs(g.vx) > 0.2;
        if (far) swipeRef.current.go(g.dx < 0 ? 1 : -1);
        Animated.spring(dragX, { toValue: 0, friction: 7, tension: 80, useNativeDriver: false }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragX, { toValue: 0, useNativeDriver: false }).start();
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  // Night Ride v2: Schriften laden. Scheitert das, startet die App mit Systemschrift.
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setFontsReady(true);
      }
    };
    Font.loadAsync(FONT_FILES).then(finish).catch(finish);
    const timer = setTimeout(finish, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Night Ride v2: Ladeanimation mindestens einmal komplett zeigen (nur Darstellung)
  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), 2600);
    return () => clearTimeout(timer);
  }, []);

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

  if (!ready || !fontsReady || !introDone) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <LoadingScreen fontsReady={fontsReady} />
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

  // Wischen: nächster / vorheriger Tab (nutzt die bestehende handleTabChange)
  swipeRef.current = {
    tab,
    go: (dir) => {
      const order = PRIMARY_TABS.map(([id]) => id);
      const i = order.indexOf(tab);
      const next = order[i + dir];
      if (!next) return;
      haptic.select();
      setSwipeFrom(dir > 0 ? 'right' : 'left');
      handleTabChange(next);
    },
  };

  const winter = profile.season === 'winter';

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

  const rider = (
    <RiderStrip
      sport={sport}
      profile={profile}
      stats={stats}
      sportOpen={sportOpen}
      onToggle={() => {
        setSportOpen((value) => !value);
      }}
      sportOptions={sportOptions}
      onSeason={(season) => {
        changeSeason(season);
      }}
      onSport={(id) => {
        changeSport(id);
      }}
    />
  );

  // Sport-Farbwelt: Licht oben in der Farbe der Sportart
  const accent = accentFor(sport.color);
  const glow = tab === 'parks' ? null : accent.color;
  const poster = tab === 'more'
    ? (morePage === 'home' ? POSTERS.more : null)
    : POSTERS[tab];

  return (
    <AccentContext.Provider value={accent}>
    <View style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.bg}
      />

      {winter ? <SnowFall /> : null}

      <Animated.View
        style={[
          styles.scroll,
          {
            transform: [
              { translateX: dragX.interpolate({ inputRange: [-400, 400], outputRange: [-60, 60], extrapolate: 'clamp' }) },
            ],
          },
        ]}
        {...pan.panHandlers}
      >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {glow ? (
          <Glow color={glow} opacity={0.17} size={460} style={{ right: -170, top: -170 }} />
        ) : null}

        <View style={styles.topRow}>
          <Logo compact />

          <View style={styles.topActions}>
            <View style={styles.bellButton} accessibilityLabel="Benachrichtigungen">
              <AppIcon
                name="bell"
                size={20}
                color={COLORS.text}
              />
              <View style={styles.bellDot} />
            </View>

            <Pressable
              onPress={changeProfilePhoto}
              accessibilityRole="button"
              accessibilityLabel="Profilfoto ändern"
              style={({ pressed }) => [
                styles.profileChip,
                pressed && { opacity: 0.8 },
              ]}
            >
              {avatarBadge ? (
                <BadgeImage id={avatarBadge} size={36} />
              ) : (
                <Avatar uri={profile.avatarUri} size={36} />
              )}
              <Text style={styles.profileNameChip} numberOfLines={1}>
                @{profile.nickname}
              </Text>
            </Pressable>
          </View>
        </View>

        {poster ? (
          <ScreenPoster
            key={`${tab}-${morePage}`}
            title={poster.title}
            subtitle={poster.subtitle}
            sportName={sport.name}
            phaseLabel={PHASE_LABEL[phase]}
            art={posterArt(tab, sport, phase)}
            phase={phase}
            accent={sport.color}
            winter={winter}
            parallax={dragX}
            from={swipeFrom}
          />
        ) : null}

        {tab !== 'more' && tab !== 'parks' && tab !== 'feed' ? rider : null}

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
          <ParksTab {...common} rider={rider} />
        )}

        {tab === 'feed' && (
          <FeedTab
            {...common}
            onOpenSpot={() => {
              setSwipeFrom('left');
              handleTabChange('parks');
            }}
          />
        )}

        {tab === 'more' ? (
          <MoreHub
            page={morePage}
            setPage={setMorePage}
            common={common}
            connectionProps={connectionProps}
            onProfilePress={changeProfilePhoto}
            badgeProps={{ avatarBadge, onSetAvatar: chooseAvatarBadge }}
          />
        ) : null}

        <View style={{ height: 28 }} />
      </ScrollView>
      </Animated.View>

      <BottomNav
        tab={tab}
        onChange={(next) => {
          setSwipeFrom('right');
          handleTabChange(next);
        }}
        onSwipe={(dir) => swipeRef.current.go(dir)}
      />

      <ShareHost sport={sport} profile={profile} />
      <BadgeUnlockWatcher
        stats={stats}
        onShare={(b) => openShare({ kind: 'badge', badge: b.id, name: b.name, accent: b.color, sub: b.goal })}
      />
    </View>
    </AccentContext.Provider>
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
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 14,
  },
  stack: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingImage: {
    flex: 1,
  },

  // Onboarding
  onboard: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 14,
  },
  onboardTop: {
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  welcomeTitle: {
    ...TYPE.display,
    fontSize: 54,
    lineHeight: 50,
    marginTop: 20,
  },
  welcomeText: {
    ...TYPE.body,
    color: '#CCD6E4',
    marginTop: 14,
  },
  seasonChoice: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    backgroundColor: COLORS.raised,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  seasonChoiceActive: {
    backgroundColor: COLORS.text,
  },
  seasonChoiceText: {
    fontFamily: FONTS.semibold,
    color: COLORS.text2,
    fontSize: 14,
  },
  seasonChoiceTextActive: {
    color: COLORS.onLime,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    width: '48.5%',
    height: 60,
    borderRadius: RADII.stat,
    backgroundColor: COLORS.tile,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  choiceActive: {
    backgroundColor: COLORS.text,
  },
  choiceText: {
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    fontSize: 13.5,
    flexShrink: 1,
  },
  choiceTextActive: {
    color: COLORS.onLime,
  },
  assessLevel: {
    gap: 8,
  },
  assessLevelTitle: {
    ...TYPE.display,
    fontSize: 28,
    lineHeight: 30,
    marginTop: 6,
  },
  assessSkill: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: COLORS.tile,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
  assessSkillActive: {
    backgroundColor: 'rgba(207,255,58,0.12)',
  },
  assessCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.nodeIdle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assessCheckActive: {
    backgroundColor: COLORS.lime,
  },
  assessText: {
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
  },

  // Header
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardTop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.pink,
  },
  profileChip: {
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.cardTop,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 4,
    paddingRight: 16,
    flexShrink: 1,
  },
  profileNameChip: {
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    fontSize: 13.5,
    flexShrink: 1,
  },

  // Rider-Strip
  rider: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sportBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderName: {
    ...TYPE.head,
    fontSize: 17,
    lineHeight: 20,
  },
  swapTag: {
    height: 34,
    borderRadius: 999,
    backgroundColor: COLORS.raised,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swapText: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  // Verbindungen
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLink: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLinkText: {
    ...TYPE.label,
  },
  connGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  connTile: {
    flex: 1,
    borderRadius: RADII.tile,
    backgroundColor: COLORS.tile,
    padding: 14,
    gap: 12,
  },
  connTileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connName: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
    fontSize: 14,
  },
  connSub: {
    ...TYPE.label,
    fontSize: 11,
  },

  // Mehr
  profileCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 3px #0E172A',
  },
  profileName: {
    ...TYPE.head,
    fontSize: 19,
    lineHeight: 23,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearTile: {
    minHeight: 92,
    borderRadius: RADII.cardSm,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  gearTileIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewTile: {
    height: 184,
    borderRadius: RADII.poster,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    backgroundColor: '#2A1F6A',
  },
  crewWatermark: {
    ...TYPE.display,
    position: 'absolute',
    right: -10,
    bottom: -24,
    fontSize: 140,
    lineHeight: 140,
    color: 'rgba(255,255,255,0.06)',
  },
  crewTitle: {
    ...TYPE.head,
    fontSize: 26,
    lineHeight: 29,
  },
  crewSub: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    color: '#D6D0FF',
  },
  livePill: {
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: COLORS.glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePillOn: {
    backgroundColor: COLORS.lime,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  livePillText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.text,
  },
  bento: {
    flexDirection: 'row',
    gap: 12,
  },
  moreTile: {
    flex: 1,
    height: 190,
    padding: 18,
    justifyContent: 'space-between',
  },
  moreTileTitle: {
    ...TYPE.head,
    fontSize: 21,
    lineHeight: 24,
  },
  posterTitle: {
    ...TYPE.display,
    fontSize: 60,
    lineHeight: 56,
    marginTop: 18,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
  },
  codeSlot: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(3,5,10,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeSlotText: {
    ...TYPE.number,
    fontSize: 26,
    color: '#3A4668',
  },

  // Unterseiten
  moreSubPage: {
    gap: 14,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardTop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontFamily: FONTS.semibold,
    color: COLORS.text2,
    fontSize: 14,
  },
  subHead: {
    height: 120,
    justifyContent: 'flex-end',
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  subPageTitle: {
    ...TYPE.display,
    fontSize: 64,
    lineHeight: 62,
  },

  // Dock
  dockWrap: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'android' ? 34 : 12,
    backgroundColor: COLORS.bg,
  },
  dock: {
    height: 70,
    borderRadius: 999,
    backgroundColor: '#0F182C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  navItem: {
    width: 46,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  navItemActive: {
    width: 'auto',
    paddingLeft: 11,
    paddingRight: 13,
    backgroundColor: COLORS.lime,
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navLabel: {
    ...TYPE.button,
    color: COLORS.onLime,
    fontSize: 12,
  },
});
