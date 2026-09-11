import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { Card, Button, Field, Muted, Notice, Pill, Title } from '../components/UI';
import { COLORS } from '../theme';
import { effectiveSlots, loadSkillContext } from '../services/skills';
import { localGet, localSet } from '../storage';
import { checkAIConnection, coachAI, dailyTrickAI } from '../services/ai';
import { pickAndResizeImage, pickProofMedia } from '../services/media';

const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
const dateKey = () => new Date().toISOString().slice(0, 10);

export default function CoachTab({ sport, stats, setStats }) {
  const beep = useAudioPlayer(require('../../assets/beep.wav'));
  const [skillContext, setSkillContext] = useState({ text: '', completed: [], next: null, done: {}, overrides: {} });
  const tricks = useMemo(() => effectiveSlots(sport, skillContext.overrides || {}), [sport, skillContext.overrides]);
  const [daily, setDaily] = useState(null);
  const [roulette, setRoulette] = useState(null);
  const [timerStart, setTimerStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [question, setQuestion] = useState('');
  const [coachImage, setCoachImage] = useState(null);
  const [coachAnswer, setCoachAnswer] = useState('');
  const [coachBusy, setCoachBusy] = useState(false);
  const [proof, setProof] = useState(null);
  const [judge, setJudge] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    (async () => {
      const ctx = await loadSkillContext(sport);
      setSkillContext(ctx);
      setNotes(await localGet(`notes:${sport.id}`, []));
      const start = await localGet('session:start', null);
      if (start) setTimerStart(start);
      const key = `daily:${sport.id}:${dateKey()}`;
      const cached = await localGet(key, null);
      if (cached) return setDaily(cached);

      const fallback = ctx.next || effectiveSlots(sport, ctx.overrides)[0];
      let item = {
        trick: fallback?.name || 'Saubere Basics wiederholen',
        tip: fallback ? `Heute konzentrierst du dich auf ${fallback.name}. Erst sauber, dann schneller oder höher.` : 'Nutze die Session für saubere Wiederholungen.',
        safety: 'Nur so weit steigern, wie du den Bewegungsablauf kontrollierst.',
        offline: true,
      };
      try {
        const status = await checkAIConnection();
        if (status.ok) {
          const ai = await dailyTrickAI(sport, ctx.text);
          if (ai?.trick) item = { ...ai, offline: false };
        }
      } catch {}
      await localSet(key, item);
      setDaily(item);
    })();
  }, [sport.id]);

  useEffect(() => {
    if (!timerStart) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - timerStart) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerStart]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown((v) => {
        if (v <= 1) { try { beep.seekTo(0); beep.play(); } catch {} return 0; }
        if (v <= 4) { try { beep.seekTo(0); beep.play(); } catch {} }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [countdown, beep]);

  const startTimer = async () => { const t = Date.now(); setTimerStart(t); await localSet('session:start', t); };
  const stopTimer = async () => {
    if (!timerStart) return;
    const mins = Math.max(1, Math.round((Date.now() - timerStart) / 60000));
    const next = { ...stats, trainingMinutes: (stats.trainingMinutes || 0) + mins };
    await setStats(next);
    await localSet('session:start', null);
    setTimerStart(null);
    setNotice(`${mins} Trainingsminute${mins === 1 ? '' : 'n'} gespeichert.`);
  };
  const addNote = async () => {
    if (!note.trim()) return;
    const next = [{ id: Date.now(), text: note.trim(), at: new Date().toLocaleString('de-DE') }, ...notes].slice(0, 30);
    setNotes(next); setNote(''); await localSet(`notes:${sport.id}`, next);
  };
  const chooseCoachImage = async () => { const img = await pickAndResizeImage({ base64: true }); if (img) setCoachImage(img); };
  const runCoach = async (asJudge = false) => {
    setCoachBusy(true); setNotice('');
    try {
      const prompt = asJudge
        ? 'Bewerte den gezeigten Trick fair. Nenne: was klappt, was verbessern, Sicherheits-Hinweis und eine Bewertung von 1 bis 10.'
        : question;
      const ans = await coachAI(sport, prompt, coachImage?.base64, skillContext.text);
      asJudge ? setJudge(ans) : setCoachAnswer(ans);
    } catch (e) { setNotice(e.message); }
    finally { setCoachBusy(false); }
  };
  const selectProof = async () => {
    const p = await pickProofMedia(); if (!p) return; setProof(p);
    const today = dateKey(); const old = await localGet('streak:last', null); let streak = stats.streak || 0;
    if (old !== today) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      streak = old === y.toISOString().slice(0, 10) ? streak + 1 : 1;
    }
    const next = { ...stats, streak };
    await setStats(next);
    await localSet('streak:last', today);
  };

  return (
    <View style={styles.stack}>
      {notice ? <Notice>{notice}</Notice> : null}

      <Card style={{ borderColor: `${sport.color}55` }}>
        <Muted>NÄCHSTER SKILL</Muted>
        <Text style={[styles.next, { color: sport.color }]}>{skillContext.next?.name || 'Skill-Baum komplett'}</Text>
        <Muted>After[Dark nutzt diesen Stand auch als Kontext für die KI.</Muted>
      </Card>

      <Card>
        <Title color={sport.color}>Trick des Tages</Title>
        {daily ? <><Text style={styles.big}>{daily.trick}</Text><Text style={styles.text}>{daily.tip}</Text><Muted>{daily.safety}</Muted><Muted>{daily.offline ? 'Offline aus deinem Skill-Baum gewählt.' : 'Heute per KI passend zu deinem Skillstand gewählt.'}</Muted></> : <Muted>Lädt…</Muted>}
      </Card>

      <Card>
        <Title small>Session starten</Title>
        <Text style={styles.timer}>{fmt(elapsed)}</Text>
        {!timerStart ? <Button title="Session starten" onPress={startTimer} /> : <Button title="Stop + speichern" tone="pink" onPress={stopTimer} />}
        <Muted>Die Startzeit wird gespeichert. Deshalb läuft die Session auch weiter, wenn die App kurz geschlossen wird.</Muted>
      </Card>

      <Card>
        <Title small>Trick-Roulette</Title>
        {roulette ? <Text style={styles.big}>{roulette.name}</Text> : <Muted>Zieht einen Trick aus deinem aktuellen Skill-Baum.</Muted>}
        <Button title="🎲 Trick ziehen" onPress={() => setRoulette(tricks[Math.floor(Math.random() * tricks.length)])} />
      </Card>

      <Card>
        <Title small>Countdown-Challenge</Title>
        <View style={styles.rowWrap}>{[30, 60, 120].map((v) => <Pill key={v} label={`${v} s`} active={countdown === v} onPress={() => setCountdown(v)} color={sport.color} />)}</View>
        {countdown > 0 ? <Text style={styles.timer}>{countdown}</Text> : null}
        <Muted>Die letzten drei Sekunden und das Ende werden akustisch signalisiert.</Muted>
      </Card>

      <Card>
        <Title small>KI-Trick-Coach</Title>
        <Muted>Die KI bekommt deinen aktuellen Skillstand mit. Ein Foto wird vor dem Senden auf maximal 1024 Pixel verkleinert.</Muted>
        <Field value={question} onChangeText={setQuestion} placeholder="z. B. Warum bekomme ich beim Fingerwhip das Deck nicht zurück?" multiline />
        <Button title={coachImage ? '📷 Foto gewählt' : '📷 Foto hinzufügen'} tone="dark" onPress={chooseCoachImage} />
        {coachImage ? <Image source={{ uri: coachImage.uri }} style={styles.preview} /> : null}
        <Button title={coachBusy ? 'Coach denkt…' : 'Coach fragen'} disabled={coachBusy || (!question.trim() && !coachImage)} onPress={() => runCoach(false)} />
        {coachAnswer ? <Text style={styles.answer}>{coachAnswer}</Text> : null}
      </Card>

      <Card>
        <Title small>Session-Notizen</Title>
        <Field value={note} onChangeText={setNote} placeholder="Was lief heute gut?" />
        <Button title="Notiz speichern" tone="dark" onPress={addNote} />
        {notes.slice(0, 5).map((n) => <View key={n.id} style={styles.note}><Text style={styles.text}>{n.text}</Text><Muted>{n.at}</Muted></View>)}
      </Card>

      <Card>
        <Title small>Streak & Judge</Title>
        <Text style={styles.big}>{stats.streak || 0} Tage</Text>
        <Button title="📸 Beweis wählen" tone="ice" onPress={selectProof} />
        {proof ? <Muted>{proof.type === 'video' ? 'Video zählt als Streak-Beweis. Für die aktuelle KI-Bewertung wird noch ein Foto verwendet.' : 'Foto gewählt – der Beweis wird nicht dauerhaft gespeichert.'}</Muted> : null}
        <Button title="⭐ Foto judgen" tone="pink" disabled={!coachImage || coachBusy} onPress={() => runCoach(true)} />
        {judge ? <Text style={styles.answer}>{judge}</Text> : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  next: { fontSize: 27, fontWeight: '900', fontStyle: 'italic' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  big: { color: COLORS.text, fontSize: 23, fontWeight: '900' },
  text: { color: COLORS.text, fontSize: 15, lineHeight: 21 },
  timer: { color: COLORS.volt, fontSize: 42, fontWeight: '900', fontVariant: ['tabular-nums'] },
  note: { borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 10 },
  preview: { width: '100%', height: 220, borderRadius: 18, resizeMode: 'cover' },
  answer: { color: COLORS.text, fontSize: 15, lineHeight: 22, backgroundColor: COLORS.panel2, padding: 12, borderRadius: 16 },
});
