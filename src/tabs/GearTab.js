import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Muted, Notice, Pill, Title } from '../components/UI';
import AppIcon from '../components/AppIcon';
import { COLORS, FONTS, RADII, TYPE } from '../theme';
import { localGet, localSet } from '../storage';

const CATEGORIES = [
  { id: 'scooter', label: 'Scooter', icon: 'skills' },
  { id: 'ski', label: 'Ski', icon: 'snow' },
  { id: 'snowboard', label: 'Snowboard', icon: 'snow' },
  { id: 'bmx', label: 'BMX', icon: 'parks' },
  { id: 'skate', label: 'Skateboard', icon: 'parks' },
  { id: 'mtb', label: 'MTB', icon: 'parks' },
];

const SCOOTER_PARTS = ['Kompletter Scooter', 'Deck', 'Bar', 'Fork', 'Wheels', 'Compression'];
const LEVELS = ['Einsteiger', 'Fortgeschritten', 'Sehr gut'];
const STYLES = ['Park', 'Street', 'Hybrid'];

function categoryForSport(sport) {
  const id = String(sport?.id || '').toLowerCase();
  if (id.includes('scooter')) return 'scooter';
  if (id.includes('ski')) return 'ski';
  if (id.includes('snowboard')) return 'snowboard';
  if (id.includes('bmx')) return 'bmx';
  if (id.includes('skate')) return 'skate';
  if (id.includes('mountain') || id.includes('mtb')) return 'mtb';
  return 'scooter';
}

function fallbackAdvice(values) {
  if (values.category === 'scooter') {
    return [
      'Achte zuerst auf die Kompatibilität von Bar, Fork und Compression. HIC/IHC/SCS sind nicht beliebig miteinander kombinierbar.',
      values.style === 'Street'
        ? 'Für Street ist ein etwas größeres, stabiles Deck oft wichtiger als das niedrigste Gewicht.'
        : 'Für Park lohnt sich ein leichteres Setup mit gut kontrollierbarer Bar-Höhe und möglichst wenig unnötigem Gewicht.',
      'Bei Wheels müssen Durchmesser, Breite und Achsstandard zu Fork und Deck passen. Prüfe vor dem Kauf alle Maße.',
      'Konkrete Preise und Lagerbestand sind hier nicht live geprüft.',
    ].join('\n\n');
  }

  if (values.category === 'ski') {
    return [
      'Für Freestyle/Twintip wird häufig etwas kürzer als bei reinem All-Mountain gefahren, aber Fahrkönnen, Gewicht und gewünschte Stabilität sind wichtiger als eine starre Faustregel.',
      'Achte auf Mittelbreite, Flex, Montagepunkt und ob du mehr Park oder mehr Piste fahren willst.',
      'Bindung und Bremsenbreite müssen zum Ski passen. Für konkrete Montagewerte sollten Ski- und Bindungsdaten geprüft werden.',
      'Konkrete Preise und Verfügbarkeit sind hier nicht live geprüft.',
    ].join('\n\n');
  }

  return 'Beschreibe Budget, Fahrstil, Können und dein aktuelles Setup möglichst genau. Dann lässt sich Gewicht, Größe, Haltbarkeit und Kompatibilität sinnvoll gegeneinander abwägen. Preise und Lagerbestand sind hier nicht live geprüft.';
}

async function askGearAI(values) {
  const raw = process.env.EXPO_PUBLIC_AI_URL || process.env.EXPO_PUBLIC_AI_PROXY_URL || '';
  if (!raw) throw new Error('KI ist noch nicht verbunden.');
  const url = /\/ai\/?$/.test(raw) ? raw : `${raw.replace(/\/$/, '')}/ai`;

  const prompt = `Du bist der Kaufberater in der Freestyle-App After[Dark.\n\n` +
    `Gib eine kompakte, konkrete Kaufberatung auf Deutsch. Priorität: Sicherheit, Kompatibilität, Fahrstil, Haltbarkeit und Gewicht. ` +
    `Nenne höchstens drei passende konkrete Produktserien nur wenn du sie sicher kennst. Behaupte keine Live-Preise oder aktuelle Lagerbestände. ` +
    `Wenn Daten für Kompatibilität fehlen, sage genau was noch geprüft werden muss. Keine Werbung.\n\n` +
    `Kategorie: ${values.category}\n` +
    `Gesucht: ${values.part || 'Ausrüstung'}\n` +
    `Budget: ${values.budget || 'nicht angegeben'} Euro\n` +
    `Körpergröße: ${values.height || 'nicht angegeben'} cm\n` +
    `Level: ${values.level}\n` +
    `Fahrstil: ${values.style}\n` +
    `Aktuelles Setup / Wünsche: ${values.current || 'nicht angegeben'}\n` +
    `Priorität: ${values.priority || 'ausgewogen'}\n\n` +
    `Antwortstruktur: 1) Empfehlung, 2) Worauf achten, 3) Kompatibilitätscheck, 4) Drei passende Optionen falls möglich.`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'Du berätst sachlich zu Freestyle-Sportausrüstung.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.text) {
    throw new Error(json?.error || `KI-Fehler ${response.status}`);
  }
  return json.text.trim();
}

export default function GearTab({ sport }) {
  const defaultCategory = useMemo(() => categoryForSport(sport), [sport]);
  const [category, setCategory] = useState(defaultCategory);
  const [part, setPart] = useState('Kompletter Scooter');
  const [budget, setBudget] = useState('');
  const [height, setHeight] = useState('');
  const [level, setLevel] = useState('Fortgeschritten');
  const [style, setStyle] = useState('Hybrid');
  const [current, setCurrent] = useState('');
  const [priority, setPriority] = useState('leicht + stabil');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    localGet('gear:history', []).then((x) => setHistory(Array.isArray(x) ? x : [])).catch(() => {});
  }, []);

  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);

  const run = async () => {
    setBusy(true);
    setNotice('');
    const values = { category, part, budget, height, level, style, current, priority };
    try {
      let text;
      try {
        text = await askGearAI(values);
      } catch (error) {
        text = fallbackAdvice(values);
        setNotice(`KI gerade nicht erreichbar – Basisberatung angezeigt. ${error?.message || ''}`.trim());
      }
      setAnswer(text);
      const next = [{ at: new Date().toISOString(), values, answer: text }, ...history].slice(0, 5);
      setHistory(next);
      await localSet('gear:history', next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.stack}>
      <Card>
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <Title>Gear-Beratung</Title>
            <Muted>Für Scooter-Parts, Ski und andere Freestyle-Ausrüstung.</Muted>
          </View>
          <View style={styles.gearIcon}>
            <AppIcon name="gear" size={24} color={COLORS.lime} />
          </View>
        </View>
        <Notice tone="ice">
          Die KI prüft keine Live-Preise oder Lagerbestände. Bei sicherheitsrelevanten Teilen immer Herstellerdaten und Kompatibilität kontrollieren.
        </Notice>
      </Card>

      <Card>
        <Title small>Sport / Kategorie</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
          {CATEGORIES.map((item) => (
            <Pill key={item.id} label={item.label} active={category === item.id} onPress={() => setCategory(item.id)} />
          ))}
        </ScrollView>

        {category === 'scooter' ? (
          <>
            <Title small>Was suchst du?</Title>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
              {SCOOTER_PARTS.map((x) => <Pill key={x} label={x} active={part === x} onPress={() => setPart(x)} />)}
            </ScrollView>
          </>
        ) : null}

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Muted>Budget in €</Muted>
            <Field value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="z. B. 250" />
          </View>
          <View style={{ flex: 1 }}>
            <Muted>Körpergröße in cm</Muted>
            <Field value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="z. B. 173" />
          </View>
        </View>

        <Title small>Level</Title>
        <View style={styles.wrap}>
          {LEVELS.map((x) => <Pill key={x} label={x} active={level === x} onPress={() => setLevel(x)} />)}
        </View>

        <Title small>Fahrstil</Title>
        <View style={styles.wrap}>
          {STYLES.map((x) => <Pill key={x} label={x} active={style === x} onPress={() => setStyle(x)} />)}
        </View>

        <Field value={priority} onChangeText={setPriority} placeholder="Priorität: leicht, stabil, günstig …" />
        <Field value={current} onChangeText={setCurrent} multiline placeholder="Aktuelles Setup, Maße, Compression, Ski-Länge oder besondere Wünsche …" />

        <Button title={busy ? 'Beratung läuft …' : 'Kaufberatung starten'} onPress={run} disabled={busy} icon="gear" />
        {busy ? <ActivityIndicator color={COLORS.lime} /> : null}
        {notice ? <Notice tone="pink">{notice}</Notice> : null}
      </Card>

      {answer ? (
        <Card>
          <View style={styles.headRow}>
            <Title>Empfehlung</Title>
            <Text style={styles.aiTag}>AI</Text>
          </View>
          <Text selectable style={styles.answer}>{answer}</Text>
        </Card>
      ) : null}

      {history.length ? (
        <Card>
          <Title small>Letzte Beratungen</Title>
          {history.slice(0, 3).map((item, i) => (
            <Pressable key={`${item.at}-${i}`} onPress={() => setAnswer(item.answer)} style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>{item.values?.category || 'Gear'} · {item.values?.part || 'Ausrüstung'}</Text>
                <Muted>{item.values?.budget ? `${item.values.budget} €` : 'ohne Budget'} · {item.values?.style || ''}</Muted>
              </View>
              <AppIcon name="chevron" size={16} color={COLORS.text3} />
            </Pressable>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  gearIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.limeSoft, alignItems: 'center', justifyContent: 'center' },
  pills: { gap: 8, paddingRight: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  twoCol: { flexDirection: 'row', gap: 10 },
  answer: { ...TYPE.body, color: COLORS.text, fontSize: 14.5, lineHeight: 22 },
  aiTag: { fontFamily: FONTS.bold, color: COLORS.cyan, backgroundColor: COLORS.cyanSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  historyRow: { minHeight: 58, borderRadius: RADII.tile, backgroundColor: COLORS.well, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyTitle: { fontFamily: FONTS.semibold, color: COLORS.text, fontSize: 14 },
});
