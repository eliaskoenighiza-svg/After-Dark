import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Button, Muted, Notice, Title } from '../components/UI';
import { COLORS } from '../theme';
import PageHero from '../components/PageHero';
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

  return (
    <View style={styles.stack}>
      <PageHero
        type="skills"
        title="Skills"
        subtitle="SKILL-BAUM · WOCHENZIEL · PLAN"
        accent={sport.color}
      />
      {notice ? <Notice>{notice}</Notice> : null}

      <Card style={{ borderColor: `${sport.color}55` }}>
        <Title color={sport.color}>Dein nächster Schritt</Title>
        {next ? <Text style={styles.nextSkill}>{next.name}</Text> : <Text style={styles.nextSkill}>Skill-Baum komplett</Text>}
        <Muted>{completedCount} von {slots.length} aktuellen Skills geschafft · Punkte bleiben dauerhaft erhalten.</Muted>
      </Card>

      <Card>
        <Title color={sport.color}>Skill-Baum</Title>
        <Muted>Die Reihenfolge ist bewusst schrittweise. Ein Flip steht nicht direkt hinter einem einfachen Grundlagen-Trick.</Muted>
        {levels.map(([level, items]) => (
          <View key={level} style={styles.level}>
            <Text style={[styles.levelTitle, { color: sport.color }]}>{level}</Text>
            {items.map((item) => (
              <View key={item.slotId}>
                <Pressable onPress={() => toggle(item.name)} style={styles.skill}>
                  <Text style={[styles.check, done[item.name] && { color: sport.color }]}>{done[item.name] ? '✓' : '○'}</Text>
                  <Text style={styles.skillName}>{item.name}</Text>
                  <Pressable onPress={(e) => { e.stopPropagation?.(); lookup(item.name); }} hitSlop={8}><Text style={styles.info}>INFO</Text></Pressable>
                </Pressable>
                {open === item.name ? (
                  <View style={styles.lex}>
                    <Text style={styles.body}>{lex}</Text>
                    <Button title="Als Wochenziel" compact tone="dark" onPress={() => setWeekly(item.name)} />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </Card>

      <Card>
        <Title small>Ziel der Woche</Title>
        {goal ? <Text style={styles.goal}>{goal.done ? '✓ ' : ''}{goal.name}</Text> : <Muted>Öffne bei einem Trick „INFO“ und setze ihn als Wochenziel.</Muted>}
      </Card>

      <Card>
        <Title small>Skill-Reset</Title>
        <Muted>Ein Reset ersetzt alle aktuell als geschafft markierten Tricks dieses Sports. Vorher siehst du genau, was ersetzt wird. Punkte gehen nicht verloren.</Muted>
        <Text style={styles.resetCounter}>{resetCount} / 20 Resets diesen Monat</Text>
        {!resetPreview ? (
          <Button title={resetBusy ? 'Bereite Reset vor…' : 'Reset-Vorschau erstellen'} tone="pink" disabled={resetBusy} onPress={prepareReset} />
        ) : (
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Vorschau</Text>
            {resetPreview.map((item) => (
              <View key={item.slotId} style={styles.previewRow}>
                <Text style={styles.previewOld}>{item.oldName}</Text>
                <Text style={styles.previewArrow}>→</Text>
                <Text style={[styles.previewNew, { color: item.newName ? sport.color : COLORS.danger }]}>{item.newName || 'kein Ersatz gefunden'}</Text>
              </View>
            ))}
            <View style={styles.row}>
              <Button title="Abbrechen" tone="dark" onPress={() => setResetPreview(null)} />
              <Button title="Reset durchführen" tone="pink" onPress={applyReset} disabled={resetPreview.some((x) => !x.newName)} />
            </View>
          </View>
        )}
      </Card>

      <Card>
        <Title small>Wochen-Trainingsplan</Title>
        {plan ? <Text style={styles.body}>{plan}</Text> : <Muted>Noch kein Plan für diese Woche gespeichert.</Muted>}
        <Button title="Plan per KI erstellen" onPress={makePlan} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  nextSkill: { color: COLORS.text, fontSize: 25, fontWeight: '900' },
  level: { gap: 3 },
  levelTitle: { fontSize: 19, fontWeight: '900', marginTop: 8 },
  skill: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  check: { fontSize: 28, color: COLORS.muted, width: 30 },
  skillName: { color: COLORS.text, fontSize: 15, fontWeight: '700', flex: 1 },
  info: { color: COLORS.ice, fontWeight: '900', fontSize: 12 },
  lex: { backgroundColor: COLORS.panel2, padding: 12, borderRadius: 15, gap: 10 },
  body: { color: COLORS.text, lineHeight: 21 },
  goal: { color: COLORS.volt, fontSize: 20, fontWeight: '900' },
  resetCounter: { color: COLORS.text, fontWeight: '900', fontSize: 16 },
  previewBox: { gap: 8, backgroundColor: COLORS.bgSoft, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line },
  previewTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  previewOld: { color: COLORS.muted, flex: 1, fontSize: 13 },
  previewArrow: { color: COLORS.text, fontWeight: '900' },
  previewNew: { flex: 1, fontSize: 13, fontWeight: '800' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
