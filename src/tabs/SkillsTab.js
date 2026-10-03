import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Card, Button, Muted, Notice, Title } from '../components/UI';
import { COLORS, FONTS, GRADIENTS, RADII, TYPE } from '../theme';
import AppIcon from '../components/AppIcon';
import { IconTile, PosterCard, SecondaryButton, Sticker, Surface, Tag } from '../design/kit';
import { Burst, LevelCelebration, PopIn, ThinkingOrbit } from '../design/motion';
import { haptic } from '../design/haptics';
import { effectiveLevels, effectiveSlots, nextRecommendedSkill } from '../services/skills';
import { localGet, localSet, sharedGet, sharedSet } from '../storage';
import { askAI } from '../services/ai';
import { cloudConfigured, getMyCrews, setMyWeeklyGoalCloud, setMyWeeklyGoalDoneCloud } from '../services/supabase';

const weekKey = () => {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
};
const monthKey = () => new Date().toISOString().slice(0, 7);

const EXTRA = {
  skate: [
    ['Hippie Jump','Body Varial','Caveman','Boneless','No Comply','Manual über Linie','Nose Manual kurz','Revert'],
    ['Fakie Shove-it','Switch Ollie','Frontside 50-50','Backside 50-50','Noseslide niedrig','Tailslide niedrig','Kickflip Fakie','Heelflip Fakie'],
    ['Frontside Flip','Backside Flip','Varial Heelflip','Tre Flip Fakie','Nollie Shove-it','Crooked Grind','Smith Grind','Kickflip Boardslide'],
    ['Switch Heelflip','Nollie Heelflip','Tre Flip Revert','Hardflip 180','Kickflip Crooked','Bigspin Flip','Nollie Tre Flip','Laser Flip Revert'],
  ],
  mtb: [
    ['Frontwheel Lift','Rearwheel Lift','Bunny Hop auf Markierung','Manual über Markierung','Trackstand länger','kleiner Side Hop','Pumptrack Runde ohne Pedalieren','Drop mit sauberer Landung'],
    ['One Footer','One Hander','Can Can klein','Nac Nac klein','Tabletop größer','Manual durch Welle','Bunny Hop to Manual','Step-up sauber'],
    ['Suicide No Hander Vorbereitung','Seat Grab','Toboggan','Whip größer','360 Table','Step-down mit Style','Manual to Drop','Opposite Whip klein'],
    ['360 No Hander nur Profi-Setup','Flip No Hander nur Airbag','Frontflip Bar nur Airbag','Backflip Bar nur Airbag','360 Tailwhip nur geeignetes Bike','Cork 720 nur Airbag','Flip Whip nur Airbag','Pro-Line Combo'],
  ],
  trampoline: [
    ['Seat Drop to Feet','Back Drop to Feet','Front Drop to Feet','Half Turn Seat Drop','Swivel Hips','Cradle Vorbereitung','Doggy Drop','Knee Drop kontrolliert'],
    ['Swivel Hips','Cradle','Half-in Half-out Vorbereitung','Front Pullover','Back Pullover','Barani to Back','Cody Vorbereitung','Rudy Vorbereitung'],
    ['Full Twist mit Trainer','Rudy to Back','Cody to Front','Front Full Vorbereitung','Back Full Vorbereitung','Kaboom Full Vorbereitung','Barani Ballout','Cody Combo'],
    ['Double Front Half-out nur Profi-Setup','Double Back Half-out nur Profi-Setup','Full-in Full-out nur Profi-Setup','Miller nur Profi-Setup','Triffis Pike nur Profi-Setup','Double Cody nur Profi-Setup','Rudy Out nur Profi-Setup','Pro-Serie Variation'],
  ],
  'tramp-scooter': [
    ['Half Cab','Fakie 180','Nose Pivot','One Foot','Can Can','No Hander','Barspin Rewind','Tail Tap'],
    ['Tailwhip to Fakie','Heelwhip to Fakie','360 No Footer','360 Barspin','Whip Rewind Vorbereitung','Fingerwhip Vorbereitung','Bri Vorbereitung','Double Whip Vorbereitung'],
    ['Double Heelwhip','Bri Whip','Inward','Bar Rewind','360 Tailwhip','Fingerwhip to Bar','540 Barspin','540 Whip'],
    ['Double Whip Bar','720 Barspin','720 Whip','Backflip Bar nur Airbag','Frontflip Bar nur Airbag','Flair Bar nur Airbag','Cashroll nur Profi-Setup','Flip Whip nur Airbag'],
  ],
  parkour: [
    ['Precision to Stick','Balance rückwärts','Step Vault beidseitig','Safety Vault beidseitig','Low Cat Leap','Rail Balance niedrig','Lazy Vault beidseitig','Turn Precision niedrig'],
    ['Kong to Cat niedrig','Dash niedrig','Reverse Vault niedrig','Wall Run to Precision','Tic Tac to Precision','Speed Vault beidseitig','Underbar to Roll','Cat Back'],
    ['Double Kong Vorbereitung Halle','Kong to Dash Halle','Reverse Precision','Wall Spin Variation Matte','Palm Spin Matte','180 Cat Leap','Lache Vorbereitung Halle','Stride Precision'],
    ['Castaway Vorbereitung Halle','Sideflip Precision nur Halle','Front Full nur Halle','Wall Flip 180 nur Halle','Kong Gainer Variation Profi-Setup','Double Kong Precision Halle','Cork Precision Halle','Pro-Line Flow'],
  ],
  diving: [
    ['Fußsprung mit halber Drehung 1 m','Hocksprung 3 m','Strecksprung 3 m','Drehung 3 m','Kopfsprung gehockt 1 m','Anlauftechnik 1 m','Absprungtechnik Brett','Sauberer Eintritt Füße'],
    ['Salto vorwärts gehockt 1 m','Salto vorwärts gestreckt 1 m nur Training','Rückwärtssprung 1 m','Auerbach gehockt 1 m','Schraube aus Fußsprung 3 m','Salto vorwärts 3 m gehockt','Rückwärtssalto 1 m','Absprungserie 3 m'],
    ['1½ Salto vorwärts 3 m nur Training','1½ Salto rückwärts nur Training','Auerbachsalto 3 m','Delfinsalto nur Training','Schraubensalto Variation','5-m-Salto nur Freigabe','5-m-Schraube nur Training','Kombinationsserie'],
    ['Doppelsalto 3 m nur Training','Doppel Auerbach nur Training','2½ Salto nur Profi-Training','Mehrfachschraube Variation','7,5-m-Serie nur Freigabe','10-m-Serie nur Freigabe','Wettkampfserie 3 m','Wettkampfserie Turm'],
  ],
  freeski: [
    ['Ollie','Nollie','Tail Tap','Butter 180','Switch Straight Air','Safety Grab länger','Box 180 off','Side Hit 180'],
    ['Mute 360','Japan 360','Tail Grab 360','Switch Safety Grab','Box 180 on','Box Switch 50-50','Flat 360','Shifty'],
    ['540 Mute','540 Japan','Switch 540 Grab','Cork 540 nur geeignetes Setup','Rail 270 off','270 onto Rail niedrig','Flat 720 Vorbereitung','Bio 540 nur Parktraining'],
    ['720 Grab','900 Grab','Switch 720','Cork 720 nur Airbag','Cork 900 nur Airbag','Rail Transfer Combo','Double Cork nur Airbag','Pro-Line Combo'],
  ],
  snowboard: [
    ['Nollie','Butter 180','Tail Press','Nose Press flach','Switch Ollie','Indy länger','Box 180 off','Revert'],
    ['Mute Grab','Melon Grab','Stalefish Grab','Cab 180','Frontside Boardslide Box','Backside Boardslide Box','Butter 360','Switch Box 50-50'],
    ['Frontside 540','Backside 540','Cab 540','360 Method','Rail 270 off','270 onto Box','Switch Boardslide','Butter Combo'],
    ['Frontside 720','Backside 720','Cab 720','Switch 720','Cork 720 nur Airbag','900 Grab','Rail Transfer Combo','Pro-Line Combo'],
  ],
  snowscoot: [
    ['Fakie gerade','Half Cab','Nose Pivot','Manual kurz','One Footer','X-Up','Tail Tap','Box 50-50 nur erlaubt'],
    ['360 No Footer','Barspin to Fakie','No Hander','Can Can','Table Grab','Box 180 off','Manual länger','Whip Vorbereitung'],
    ['360 Barspin','540 No Footer','Tailwhip','Heelwhip','Box Combo','Step-up größer','No Hander 360','Whip to Fakie'],
    ['720 Barspin','360 Whip','Double Whip nur geeignetes Setup','Backflip Bar nur Airbag','Frontflip Bar nur Airbag','Flair nur Airbag','Pro-Line Combo','Großer Kicker nur Training'],
  ],
  snowbike: [
    ['Fakie Roll','Manual über Welle','One Footer','X-Up','Tail Tap','Side Hop','Table klein','180 to Fakie'],
    ['Can Can','Nac Nac klein','One Hander','Tabletop größer','360 No Footer','Manual länger','Step-up Style','Step-down Style'],
    ['360 Table','360 One Hander','Whip größer','No Hander länger','Toboggan','540 Table','Step-up Combo','Opposite Whip klein'],
    ['360 No Hander','540 No Hander','Backflip Bar nur Airbag','Frontflip Bar nur Airbag','360 Tailwhip nur Profi-Setup','Cork nur Airbag','Pro-Line Combo','Großer Kicker nur Training'],
  ],
  fitness: [
    ['Glute Bridge','Side Plank','Australian Row','Incline Push-up','Calf Raise','Bear Crawl','Reverse Lunge','Scapula Push-up'],
    ['Chin-up','Diamond Push-up','Hanging Leg Raise leicht','Bulgarian Split Squat','Tuck Front Lever Hold','Tuck Back Lever Hold','Wall Handstand Hold','Straight Bar Dip Vorbereitung'],
    ['Chest-to-Bar Pull-up','Pseudo Planche Push-up','Dragon Flag','Handstand frei Vorbereitung','Muscle-up Negative','Front Lever Advanced Tuck','Back Lever Advanced Tuck','Pike Handstand Push-up'],
    ['Bar Muscle-up','One Arm Chin-up Progression','Full Front Lever Progression','Full Back Lever Progression','Freier Handstand Push-up Progression','Human Flag Hold','Straddle Planche Progression','90 Degree Push-up Progression'],
  ],
};

export default function SkillsTab({ sport, profile, stats, setStats }) {
  const [done, setDone] = useState({});
  const [earned, setEarned] = useState({});
  const [overrides, setOverrides] = useState({});
  const [goal, setGoal] = useState(null);
  const [plan, setPlan] = useState('');
  const [lex, setLex] = useState('');
  const [open, setOpen] = useState(null);
  const [notice, setNotice] = useState('');
  const [resetPreview, setResetPreview] = useState(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetCount, setResetCount] = useState(0);

  const levels = useMemo(() => effectiveLevels(sport, overrides), [sport, overrides]);
  const slots = useMemo(() => effectiveSlots(sport, overrides), [sport, overrides]);
  const next = useMemo(() => nextRecommendedSkill(sport, overrides, done), [sport, overrides, done]);
  const completedCount = slots.filter((x) => done[x.name]).length;

  useEffect(() => {
    (async () => {
      const storedDone = await localGet(`skills:${sport.id}`, {});
      let storedEarned = await localGet(`skills:earned:${sport.id}`, {});
      if (!Object.keys(storedEarned).length && Object.keys(storedDone).some((k) => storedDone[k])) {
        storedEarned = Object.fromEntries(Object.entries(storedDone).filter(([, v]) => v));
        await localSet(`skills:earned:${sport.id}`, storedEarned);
      }
      setDone(storedDone);
      setEarned(storedEarned);
      setOverrides(await localGet(`skills:overrides:${sport.id}`, {}));
      setGoal(await localGet(`goal:${sport.id}:${weekKey()}`, null));
      setPlan(await localGet(`plan:${sport.id}:${weekKey()}`, ''));
      setResetCount((await localGet(`resets:${monthKey()}`, [])).length);
      setResetPreview(null);
      setOpen(null);
      setLex('');
    })();
  }, [sport.id]);

  const resolveGoalCrewId = async () => {
    const remembered = await localGet('crew:activeCloudCrewId', null);
    if (remembered) return remembered;
    if (!cloudConfigured()) return null;

    const result = await getMyCrews();
    if (!result.ok) return null;

    const first = result.crews?.[0]?.id || null;
    if (first) await localSet('crew:activeCloudCrewId', first);
    return first;
  };

  const syncSharedGoal = async (g) => {
    const key = `crew:goals:${weekKey()}`;
    const all = await sharedGet(key, {});
    await sharedSet(key, { ...all, [profile.nickname]: { nickname: profile.nickname, sport: sport.name, ...g } });

    if (!cloudConfigured()) return;

    const crewId = await resolveGoalCrewId();
    if (!crewId) return;

    const saved = await setMyWeeklyGoalCloud(crewId, g.name, sport.name);
    if (!saved.ok) {
      setNotice(`Crew-Cloud: ${saved.error || 'Wochenziel konnte nicht gespeichert werden.'}`);
      return;
    }

    if (g.done) {
      const doneResult = await setMyWeeklyGoalDoneCloud(crewId, true);
      if (!doneResult.ok) {
        setNotice(`Crew-Cloud: ${doneResult.error || 'Zielstatus konnte nicht gespeichert werden.'}`);
      }
    }
  };

  const toggle = async (name) => {
    const was = !!done[name];
    const nextDone = { ...done, [name]: !was };
    setDone(nextDone);
    await localSet(`skills:${sport.id}`, nextDone);

    if (!was && !earned[name]) {
      const nextEarned = { ...earned, [name]: true };
      setEarned(nextEarned);
      await localSet(`skills:earned:${sport.id}`, nextEarned);
      await setStats({ ...stats, tricks: (stats.tricks || 0) + 1 });
    }

    if (!was && (goal?.name === name || goal === name)) {
      const g = { name, done: true };
      setGoal(g);
      await localSet(`goal:${sport.id}:${weekKey()}`, g);
      await syncSharedGoal(g);
    }
  };

  const setWeekly = async (name) => {
    const g = { name, done: !!done[name] };
    setGoal(g);
    await localSet(`goal:${sport.id}:${weekKey()}`, g);
    await syncSharedGoal(g);
  };

  const lookup = async (name) => {
    setOpen(name);
    const key = `lex:${sport.id}:${name}`;
    const cached = await localGet(key, '');
    if (cached) return setLex(cached);
    setLex('Lädt…');
    try {
      const t = await askAI([{ role: 'user', content: `Erkläre den ${sport.name}-Trick "${name}" kurz: Ziel, vier sichere Schritte, häufigster Fehler und Sicherheits-Hinweis. Passe die Erklärung an einen Jugendlichen an und fordere nicht zu unnötigem Risiko auf.` }]);
      setLex(t);
      await localSet(key, t);
    } catch (e) {
      setLex(e.message);
    }
  };

  const makePlan = async () => {
    setNotice('');
    try {
      const completed = slots.filter((x) => done[x.name]).map((x) => x.name);
      const text = await askAI([{ role: 'user', content: `Erstelle für ${sport.name} einen sicheren Wochen-Trainingsplan mit drei Sessions. Geschafft: ${completed.join(', ') || 'noch nichts markiert'}. Nächstes Ziel: ${next?.name || 'frei wählen'}. Kurz, konkret und auf Deutsch.` }]);
      setPlan(text);
      await localSet(`plan:${sport.id}:${weekKey()}`, text);
    } catch (e) {
      setNotice(e.message);
    }
  };

  const candidatePoolFor = (slot) => {
    const visible = new Set(slots.map((x) => x.name));
    const source = sport.resetPool?.length ? sport.resetPool : EXTRA[sport.id] || [];
    const same = source[slot.levelIndex] || [];
    const nextLevel = source[Math.min(3, slot.levelIndex + 1)] || [];
    const hiddenBase = sport.levels
      .slice(slot.levelIndex, Math.min(4, slot.levelIndex + 2))
      .flatMap(([, names]) => names)
      .filter((name) => !visible.has(name));
    return [...same, ...nextLevel, ...hiddenBase].filter((name, index, arr) => name && !visible.has(name) && arr.indexOf(name) === index);
  };

  const prepareReset = async () => {
    setNotice('');
    setResetPreview(null);
    const log = await localGet(`resets:${monthKey()}`, []);
    setResetCount(log.length);
    if (log.length >= 20) {
      setNotice('Du hast die 20 Resets für diesen Monat bereits verbraucht.');
      return;
    }
    const completed = slots.filter((slot) => done[slot.name]);
    if (!completed.length) {
      setNotice('Es sind gerade keine geschafften Tricks markiert.');
      return;
    }

    setResetBusy(true);
    const used = new Set();
    const preview = [];
    for (const slot of completed) {
      const pool = candidatePoolFor(slot).filter((x) => !used.has(x));
      let replacement = pool[0] || null;
      if (!replacement) {
        const fallbackLevel = sport.levels[Math.min(3, slot.levelIndex + 1)]?.[1] || [];
        replacement = fallbackLevel.find((x) => x !== slot.name && !used.has(x)) || null;
      }
      if (replacement) used.add(replacement);
      preview.push({ ...slot, oldName: slot.name, newName: replacement });
    }
    setResetPreview(preview);
    setResetBusy(false);
  };

  const applyReset = async () => {
    if (!resetPreview?.length || resetPreview.some((x) => !x.newName)) {
      setNotice('Für mindestens einen Trick fehlt ein sinnvoller Ersatz. Reset wurde nicht ausgeführt.');
      return;
    }
    const nextOverrides = { ...overrides };
    const nextDone = { ...done };
    resetPreview.forEach((item) => {
      nextOverrides[item.slotId] = item.newName;
      delete nextDone[item.oldName];
      nextDone[item.newName] = false;
    });
    const logKey = `resets:${monthKey()}`;
    const log = await localGet(logKey, []);
    await localSet(`skills:overrides:${sport.id}`, nextOverrides);
    await localSet(`skills:${sport.id}`, nextDone);
    await localSet(logKey, [...log, Date.now()]);
    setOverrides(nextOverrides);
    setDone(nextDone);
    setResetCount(log.length + 1);
    setResetPreview(null);
    setOpen(null);
    setNotice(`Reset fertig: ${resetPreview.length} geschaffte Tricks wurden durch neue Ziele ersetzt. Deine Punkte bleiben erhalten.`);
  };

  // Night Ride v2 – reine Anzeige-Zustände (kein Speichern)
  const [shownLevel, setShownLevel] = useState(null);
  const [lineWidth, setLineWidth] = useState(0);
  const [pop, setPop] = useState(null);
  const [levelDone, setLevelDone] = useState(null);

  // Abhaken mit Feier: ruft unverändert toggle(name) auf, die Animation ist reine Anzeige
  const markDone = (name) => {
    const entry = levels.find(([, items]) => items.some((x) => x.name === name));
    const willComplete =
      !!entry &&
      !done[name] &&
      entry[1].every((x) => x.name === name || done[x.name]);
    if (!done[name]) haptic.success();
    else haptic.tap();
    toggle(name);
    setPop({ name, n: Date.now() });
    if (willComplete) setLevelDone(entry[0]);
  };

  const activeLevel =
    shownLevel && levels.some(([level]) => level === shownLevel)
      ? shownLevel
      : next?.level || levels[0]?.[0];
  const activeItems = (levels.find(([level]) => level === activeLevel) || [null, []])[1];
  const activeDone = activeItems.filter((x) => done[x.name]).length;

  const PITCH = 84;
  const XS = [0.18, 0.5, 0.82, 0.5];
  const points = activeItems.map((item, i) => ({
    item,
    x: lineWidth * XS[i % XS.length],
    y: 44 + i * PITCH,
  }));
  const lineHeight = activeItems.length ? 44 + (activeItems.length - 1) * PITCH + 70 : 0;
  const pathFor = (pts) =>
    pts.reduce((d, p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const prev = pts[i - 1];
      const midY = (prev.y + p.y) / 2;
      return `${d} C${prev.x} ${midY} ${p.x} ${midY} ${p.x} ${p.y}`;
    }, '');
  let lastDoneIndex = -1;
  points.forEach((p, i) => {
    if (done[p.item.name]) lastDoneIndex = i;
  });

  return (
    <View style={styles.stack}>
      {notice ? <Notice>{notice}</Notice> : null}

      <PosterCard gradient={GRADIENTS.skills} glow="rgba(207,255,58,0.3)" watermark={`L${Math.max(1, levels.findIndex(([l]) => l === (next?.level || '')) + 1)}`}>
        <Sticker label="Dein nächster Schritt" tone="white" />
        <Text style={styles.posterTitle} numberOfLines={2} adjustsFontSizeToFit>
          {next ? next.name : 'Skill-Baum komplett'}
        </Text>
        <View style={styles.countRow}>
          <Text style={[TYPE.number, { fontSize: 40, color: COLORS.lime }]}>{completedCount}</Text>
          <Text style={[TYPE.number, { fontSize: 24, color: '#6B7A4A' }]}>/ {slots.length}</Text>
          <Text style={[TYPE.label, { color: '#C9D6A8', marginLeft: 6 }]}>Skills geschafft</Text>
        </View>
        <View style={styles.levelBars}>
          {levels.map(([level, items]) => {
            const d = items.filter((x) => done[x.name]).length;
            const p = items.length ? d / items.length : 0;
            return (
              <View key={level} style={[styles.levelBar, { flex: items.length || 1 }]}>
                <View style={[styles.levelBarFill, { width: `${Math.round(p * 100)}%` }]} />
              </View>
            );
          })}
        </View>
        <Text style={[TYPE.caption, { marginTop: 14, color: '#A4AF8C' }]}>
          Punkte bleiben dauerhaft erhalten.
        </Text>
      </PosterCard>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={{ marginRight: -18 }}
        contentContainerStyle={styles.levelRow}
      >
        {levels.map(([level, items], index) => {
          const d = items.filter((x) => done[x.name]).length;
          const on = level === activeLevel;
          const complete = items.length > 0 && d === items.length;
          return (
            <Pressable
              key={level}
              onPress={() => setShownLevel(level)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[styles.levelCard, on && styles.levelCardOn]}
            >
              <View style={styles.headRow}>
                <Text style={[TYPE.number, { fontSize: 22, color: on ? COLORS.onLime : complete ? COLORS.lime : COLORS.mutedNum }]}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                {complete && !on ? (
                  <View style={styles.levelCheck}>
                    <AppIcon name="check" size={12} color={COLORS.onLime} strokeWidth={3.2} />
                  </View>
                ) : null}
              </View>
              <View style={{ gap: 3 }}>
                <Text style={[styles.levelName, on && { color: COLORS.onLime }]} numberOfLines={1}>{level}</Text>
                <Text style={[TYPE.label, { fontSize: 11 }, on && { color: '#3A4660' }]}>
                  {d} / {items.length}{on && level === next?.level ? ' · aktuell' : ''}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Card>
        <View style={styles.headRow}>
          <Title>Die Line · {activeLevel}</Title>
          <Tag label={`${activeDone} / ${activeItems.length}`} tone="lime" />
        </View>
        <Muted>Die Reihenfolge ist bewusst schrittweise. Ein Flip steht nicht direkt hinter einem einfachen Grundlagen-Trick. Tippe einen Trick für Info, Haken und Wochenziel.</Muted>

        <View
          style={{ height: lineHeight }}
          onLayout={(e) => setLineWidth(e.nativeEvent.layout.width)}
        >
          {lineWidth ? (
            <>
              <Svg width={lineWidth} height={lineHeight} style={StyleSheet.absoluteFill}>
                <Path d={pathFor(points)} stroke={COLORS.road} strokeWidth={30} strokeLinecap="round" fill="none" />
                {lastDoneIndex > 0 ? (
                  <Path
                    d={pathFor(points.slice(0, lastDoneIndex + 1))}
                    stroke={COLORS.lime}
                    strokeOpacity={0.22}
                    strokeWidth={30}
                    strokeLinecap="round"
                    fill="none"
                  />
                ) : null}
              </Svg>

              {points.map(({ item, x, y }, i) => {
                const isDone = !!done[item.name];
                const isOpen = open === item.name;
                const isNext = next?.name === item.name;
                const big = isOpen || (isNext && !open);
                const size = big && !isDone ? 70 : 58;
                return (
                  <React.Fragment key={item.slotId}>
                    <Pressable
                      onPress={() => lookup(item.name)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name}${isDone ? ', geschafft' : ''}`}
                      style={[
                        styles.node,
                        {
                          left: x - size / 2,
                          top: y - size / 2,
                          width: size,
                          height: size,
                          borderRadius: size / 2,
                        },
                        isDone ? styles.nodeDone : big ? styles.nodeNext : styles.nodeTodo,
                        isDone && isOpen ? styles.nodeRing : null,
                      ]}
                    >
                      {isDone ? (
                        pop?.name === item.name ? (
                          <PopIn key={pop.n} from={0.2}>
                            <AppIcon name="check" size={24} color={COLORS.onLime} strokeWidth={3} />
                          </PopIn>
                        ) : (
                          <AppIcon name="check" size={24} color={COLORS.onLime} strokeWidth={3} />
                        )
                      ) : big ? (
                        <AppIcon name="play" size={24} color={COLORS.onLime} fillOpacity={1} />
                      ) : (
                        <Text style={[TYPE.number, { fontSize: 20, color: '#5E6A84' }]}>{i + 1}</Text>
                      )}
                    </Pressable>
                    {isDone && pop?.name === item.name ? (
                      <View pointerEvents="none" style={{ position: 'absolute', left: x - 70, top: y - 70, width: 140, height: 140 }}>
                        <Burst key={pop.n} size={140} />
                      </View>
                    ) : null}
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.nodeLabel,
                        { left: Math.max(0, Math.min(lineWidth - 130, x - 65)), top: y + (size / 2) + 6 },
                        big && !isDone ? { color: COLORS.text, fontFamily: FONTS.bold, fontSize: 14.5 } : null,
                        isDone ? { color: '#C9D1DE' } : null,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </React.Fragment>
                );
              })}
            </>
          ) : null}
        </View>

        {open ? (
          <View style={styles.detail}>
            <View style={styles.headRow}>
              <Text style={[TYPE.head, { fontSize: 20, flex: 1 }]} numberOfLines={2}>{open}</Text>
              <Tag label="KI-Lexikon" tone="cyan" icon="chip" />
            </View>
            {lex === 'Lädt…' ? (
              <ThinkingOrbit label="KI-Lexikon lädt…" />
            ) : (
              <Text style={styles.body}>{lex}</Text>
            )}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                {done[open] ? (
                  <SecondaryButton title="Als offen markieren" icon="reset" onPress={() => toggle(open)} />
                ) : (
                  <Button title="Geschafft" icon="check" compact onPress={() => markDone(open)} />
                )}
              </View>
              <SecondaryButton title="Als Wochenziel" icon="target" onPress={() => setWeekly(open)} />
            </View>
          </View>
        ) : null}
      </Card>

      <View style={styles.bento}>
        <Surface radius={RADII.cardSm} gradient={GRADIENTS.tileLime} style={styles.bentoCard}>
          <IconTile name="target" size={50} iconSize={24} bg={COLORS.lime} color="#0B1404" radius={16} fillOpacity={0.35} />
          <Text style={TYPE.label}>Ziel der Woche</Text>
          {goal ? (
            <Text style={styles.bentoValue} numberOfLines={2}>{goal.name || goal}</Text>
          ) : (
            <Text style={TYPE.caption}>Öffne einen Trick und setze ihn als Wochenziel.</Text>
          )}
          {goal?.done ? (
            <Tag label="Geschafft" tone="solidLime" icon="check" />
          ) : (
            <Tag label="Crew sieht es" tone="glass" icon="crew" />
          )}
        </Surface>

        <Surface radius={RADII.cardSm} style={styles.bentoCard}>
          <View style={styles.countRowSmall}>
            <Text style={[TYPE.number, { fontSize: 48, color: COLORS.pinkText }]}>{resetCount}</Text>
            <Text style={[TYPE.number, { fontSize: 22, color: COLORS.mutedNum }]}>/ 20</Text>
          </View>
          <Text style={TYPE.label}>Skill-Reset im Monat</Text>
          <Text style={[TYPE.caption, { fontSize: 11.5 }]}>
            Ersetzt alle geschafften Tricks dieses Sports. Vorher siehst du alles, Punkte gehen nicht verloren.
          </Text>
          {!resetPreview ? (
            <SecondaryButton
              title={resetBusy ? 'Bereite vor…' : 'Reset-Vorschau'}
              tone="pink"
              size="sm"
              disabled={resetBusy}
              onPress={prepareReset}
            />
          ) : null}
        </Surface>
      </View>

      {resetPreview ? (
        <Card>
          <Title>Reset-Vorschau</Title>
          {resetPreview.map((item) => (
            <View key={item.slotId} style={styles.previewRow}>
              <Text style={styles.previewOld} numberOfLines={2}>{item.oldName}</Text>
              <AppIcon name="chevron" size={16} color={COLORS.text3} />
              <Text style={[styles.previewNew, { color: item.newName ? COLORS.lime : COLORS.pinkText }]} numberOfLines={2}>
                {item.newName || 'kein Ersatz gefunden'}
              </Text>
            </View>
          ))}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <SecondaryButton title="Abbrechen" onPress={() => setResetPreview(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                title="Reset durchführen"
                tone="danger"
                onPress={applyReset}
                disabled={resetPreview.some((x) => !x.newName)}
              />
            </View>
          </View>
        </Card>
      ) : null}

      <Card>
        <View style={styles.headRow}>
          <Title>Wochen-Trainingsplan</Title>
          <AppIcon name="calendar" size={20} color={COLORS.text3} />
        </View>
        {plan ? (
          <View style={styles.planWell}>
            <Text style={styles.body}>{plan}</Text>
          </View>
        ) : (
          <>
            <View style={styles.planSlots}>
              {[1, 2, 3].map((n) => (
                <View key={n} style={styles.planSlot}>
                  <Text style={[TYPE.display, { fontSize: 38, lineHeight: 40, color: '#2C3858' }]}>{n}</Text>
                  <Text style={[TYPE.label, { fontSize: 11 }]}>Session</Text>
                </View>
              ))}
            </View>
            <Muted>Noch kein Plan für diese Woche gespeichert.</Muted>
          </>
        )}
        <Button title="Plan per KI erstellen" icon="chip" onPress={makePlan} />
      </Card>

      <LevelCelebration level={levelDone} onDone={() => setLevelDone(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  posterTitle: {
    ...TYPE.display,
    fontSize: 70,
    lineHeight: 66,
    marginTop: 22,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 18,
  },
  countRowSmall: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    height: 50,
  },
  levelBars: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 12,
  },
  levelBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  levelBarFill: {
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.lime,
  },
  levelRow: {
    gap: 10,
    paddingRight: 18,
  },
  levelCard: {
    width: 128,
    height: 92,
    borderRadius: RADII.tile,
    backgroundColor: COLORS.cardTop,
    padding: 14,
    justifyContent: 'space-between',
  },
  levelCardOn: {
    backgroundColor: COLORS.text,
    boxShadow: '0 16px 30px -16px rgba(244,246,251,0.5)',
  },
  levelCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelName: {
    ...TYPE.head,
    fontSize: 15,
    lineHeight: 18,
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: {
    backgroundColor: COLORS.lime,
    boxShadow: '0 10px 24px -10px rgba(207,255,58,0.7)',
  },
  nodeNext: {
    backgroundColor: COLORS.text,
    boxShadow: '0 0 0 9px rgba(207,255,58,0.2), 0 0 50px rgba(207,255,58,0.45)',
  },
  nodeTodo: {
    backgroundColor: COLORS.nodeIdle,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  nodeRing: {
    boxShadow: '0 0 0 4px #F4F6FB',
  },
  nodeLabel: {
    position: 'absolute',
    width: 130,
    textAlign: 'center',
    fontFamily: FONTS.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.text3,
  },
  detail: {
    padding: 18,
    borderRadius: RADII.tile,
    backgroundColor: COLORS.well,
    gap: 12,
  },
  body: {
    fontFamily: FONTS.body,
    color: '#C9D1DE',
    fontSize: 14,
    lineHeight: 21,
  },
  bento: { flexDirection: 'row', gap: 12 },
  bentoCard: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  bentoValue: {
    ...TYPE.head,
    fontSize: 21,
    lineHeight: 24,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.tile,
  },
  previewOld: {
    flex: 1,
    fontFamily: FONTS.medium,
    color: COLORS.text3,
    fontSize: 13.5,
  },
  previewNew: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 13.5,
  },
  planWell: {
    padding: 16,
    borderRadius: RADII.tile,
    backgroundColor: COLORS.well,
  },
  planSlots: {
    flexDirection: 'row',
    gap: 8,
  },
  planSlot: {
    flex: 1,
    height: 92,
    borderRadius: RADII.stat,
    backgroundColor: COLORS.tile,
    padding: 12,
    justifyContent: 'space-between',
  },
});
