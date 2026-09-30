import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { Card, Button, Field, Muted, Notice, Pill, Title } from '../components/UI';
import AppIcon from '../components/AppIcon';
import { Grad } from '../design/Grad';
import { DiceArt, SessionDial } from '../design/art';
import { Bubble, IconTile, PosterCard, ProgressRing, SecondaryButton, Segmented, Sticker, Surface, Tag } from '../design/kit';
import { COLORS, FONTS, GRADIENTS, RADII, TYPE } from '../theme';
import { effectiveSlots, loadSkillContext } from '../services/skills';
import { localGet, localSet } from '../storage';
import { checkAIConnection, coachAI, dailyTrickAI } from '../services/ai';
import { pickAndResizeImage, pickProofMedia } from '../services/media';

const fmt = (sec) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

const dateKey = () =>
  new Date().toISOString().slice(0, 10);

export default function CoachTab({ sport, stats, setStats, connection = null }) {
  const beep = useAudioPlayer(require('../../assets/beep.wav'));

  const [skillContext, setSkillContext] = useState({
    text: '',
    completed: [],
    next: null,
    done: {},
    overrides: {},
  });

  const tricks = useMemo(
    () => effectiveSlots(sport, skillContext.overrides || {}),
    [sport, skillContext.overrides]
  );

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
      if (cached) {
        setDaily(cached);
        return;
      }

      const fallback =
        ctx.next ||
        effectiveSlots(sport, ctx.overrides)[0];

      let item = {
        trick:
          fallback?.name ||
          'Saubere Basics wiederholen',
        tip: fallback
          ? `Heute konzentrierst du dich auf ${fallback.name}. Erst sauber, dann schneller oder höher.`
          : 'Nutze die Session für saubere Wiederholungen.',
        safety:
          'Nur so weit steigern, wie du den Bewegungsablauf kontrollierst.',
        offline: true,
      };

      try {
        const status = await checkAIConnection();

        if (status.ok) {
          const ai = await dailyTrickAI(
            sport,
            ctx.text
          );

          if (ai?.trick) {
            item = {
              ...ai,
              offline: false,
            };
          }
        }
      } catch {}

      await localSet(key, item);
      setDaily(item);
    })();
  }, [sport.id]);

  useEffect(() => {
    if (!timerStart) {
      setElapsed(0);
      return;
    }

    const tick = () => {
      setElapsed(
        Math.max(
          0,
          Math.floor(
            (Date.now() - timerStart) / 1000
          )
        )
      );
    };

    tick();

    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [timerStart]);

  useEffect(() => {
    if (countdown <= 0) return;

    const id = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          try {
            beep.seekTo(0);
            beep.play();
          } catch {}
          return 0;
        }

        if (value <= 4) {
          try {
            beep.seekTo(0);
            beep.play();
          } catch {}
        }

        return value - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [countdown, beep]);

  const startTimer = async () => {
    const t = Date.now();
    setTimerStart(t);
    await localSet('session:start', t);
  };

  const stopTimer = async () => {
    if (!timerStart) return;

    const mins = Math.max(
      1,
      Math.round(
        (Date.now() - timerStart) / 60000
      )
    );

    const next = {
      ...stats,
      trainingMinutes:
        (stats.trainingMinutes || 0) + mins,
    };

    await setStats(next);
    await localSet('session:start', null);
    setTimerStart(null);

    setNotice(
      `${mins} Trainingsminute${mins === 1 ? '' : 'n'} gespeichert.`
    );
  };

  const addNote = async () => {
    if (!note.trim()) return;

    const next = [
      {
        id: Date.now(),
        text: note.trim(),
        at: new Date().toLocaleString('de-DE'),
      },
      ...notes,
    ].slice(0, 30);

    setNotes(next);
    setNote('');

    await localSet(
      `notes:${sport.id}`,
      next
    );
  };

  const chooseCoachImage = async () => {
    const img = await pickAndResizeImage({
      base64: true,
    });

    if (img) setCoachImage(img);
  };

  const runCoach = async (asJudge = false) => {
    setCoachBusy(true);
    setNotice('');

    try {
      const prompt = asJudge
        ? 'Bewerte den gezeigten Trick fair. Nenne: was klappt, was verbessern, Sicherheits-Hinweis und eine Bewertung von 1 bis 10.'
        : question;

      const ans = await coachAI(
        sport,
        prompt,
        coachImage?.base64,
        skillContext.text
      );

      if (asJudge) {
        setJudge(ans);
      } else {
        setCoachAnswer(ans);
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setCoachBusy(false);
    }
  };

  const selectProof = async () => {
    const p = await pickProofMedia();
    if (!p) return;

    setProof(p);

    const today = dateKey();
    const old = await localGet(
      'streak:last',
      null
    );

    let streak = stats.streak || 0;

    if (old !== today) {
      const yesterday = new Date();
      yesterday.setDate(
        yesterday.getDate() - 1
      );

      streak =
        old ===
        yesterday.toISOString().slice(0, 10)
          ? streak + 1
          : 1;
    }

    const next = {
      ...stats,
      streak,
    };

    await setStats(next);
    await localSet('streak:last', today);
  };

  const doneCount = (skillContext.completed || []).length;
  const skillProgress = tricks.length ? doneCount / tricks.length : 0;
  const running = !!timerStart;

  return (
    <View style={styles.stack}>
      {connection}

      {notice ? (
        <Notice>{notice}</Notice>
      ) : null}

      <PosterCard gradient={GRADIENTS.coach} glow="rgba(56,225,242,0.35)" watermark="01">
        <View style={styles.posterTop}>
          <Sticker label="Heute" tone="lime" />
          {daily ? (
            daily.offline ? (
              <Tag label="Offline" tone="neutral" />
            ) : (
              <Tag label="KI-Auswahl" tone="cyan" icon="chip" />
            )
          ) : null}
        </View>

        <Text style={[TYPE.label, styles.posterLabel]}>Trick des Tages</Text>

        {daily ? (
          <>
            <Text style={styles.posterTitle} numberOfLines={2} adjustsFontSizeToFit>
              {daily.trick}
            </Text>
            <Text style={styles.posterText}>{daily.tip}</Text>
            <View style={styles.safetyWell}>
              <IconTile name="shield" size={36} iconSize={18} bg={COLORS.cyanSoft} color={COLORS.cyan} radius={12} fillOpacity={0.22} />
              <Text style={[TYPE.caption, { flex: 1, color: '#B9C4D6' }]}>{daily.safety}</Text>
            </View>
            <Text style={[TYPE.caption, styles.posterFoot]}>
              {daily.offline
                ? 'Offline aus deinem Skill-Baum gewählt.'
                : 'Heute per KI passend zu deinem Skillstand gewählt.'}
            </Text>
          </>
        ) : (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={COLORS.cyan} />
            <Text style={[styles.posterTitle, { color: COLORS.mutedNum, fontSize: 40, lineHeight: 42 }]}>Lädt…</Text>
          </View>
        )}
      </PosterCard>

      <View style={styles.bento}>
        <Surface radius={RADII.cardSm} style={styles.bentoCard}>
          <ProgressRing size={58} progress={skillProgress}>
            <Text style={[TYPE.number, { fontSize: 17 }]}>{doneCount}</Text>
          </ProgressRing>
          <View style={{ gap: 5 }}>
            <Text style={TYPE.label}>Nächster Skill</Text>
            <Text style={styles.bentoValue} numberOfLines={2}>
              {skillContext.next?.name || 'Skill-Baum komplett'}
            </Text>
          </View>
        </Surface>

        <Surface radius={RADII.cardSm} gradient={GRADIENTS.tileLime} style={styles.bentoCard}>
          <IconTile name="flame" size={58} iconSize={28} bg={COLORS.lime} color="#0B1404" radius={18} fillOpacity={0.35} />
          <View style={{ gap: 5 }}>
            <Text style={TYPE.label}>Streak</Text>
            <Text style={styles.bentoValue}>{stats.streak || 0} Tage</Text>
          </View>
        </Surface>
      </View>

      <Card>
        <View style={styles.headRow}>
          <Title>Session</Title>
          {running ? <Tag label="Läuft" tone="lime" dot /> : <Tag label="Bereit" tone="neutral" />}
        </View>

        <SessionDial minutes={Math.floor(elapsed / 60)} running={running}>
          <Text style={[TYPE.number, { fontSize: 58, lineHeight: 60 }]}>{fmt(elapsed)}</Text>
          <Text style={TYPE.label}>Trainingszeit</Text>
        </SessionDial>

        {!timerStart ? (
          <Button
            title="Session starten"
            icon="play"
            onPress={startTimer}
          />
        ) : (
          <SecondaryButton
            title="Stop + speichern"
            tone="pink"
            icon="save"
            style={{ height: 60 }}
            onPress={stopTimer}
          />
        )}

        <Text style={[TYPE.caption, { textAlign: 'center' }]}>
          Die Startzeit wird gespeichert und läuft auch bei kurzer
          App-Pause weiter.
        </Text>
      </Card>

      <View style={styles.bento}>
        <Surface radius={RADII.cardSm} style={styles.bentoCard}>
          <DiceArt />
          <Text style={TYPE.label}>Trick-Roulette</Text>
          {roulette ? (
            <Text style={styles.tileResult} numberOfLines={2} adjustsFontSizeToFit>
              {roulette.name}
            </Text>
          ) : (
            <Text style={[TYPE.caption, { minHeight: 36 }]}>
              Ziehe einen Trick aus deinem aktuellen Skill-Baum.
            </Text>
          )}
          <SecondaryButton
            title="Trick ziehen"
            size="sm"
            onPress={() =>
              setRoulette(
                tricks[
                  Math.floor(
                    Math.random() *
                      tricks.length
                  )
                ]
              )
            }
          />
        </Surface>

        <Surface radius={RADII.cardSm} style={styles.bentoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, height: 54 }}>
            <Text
              style={[
                TYPE.number,
                {
                  fontSize: 56,
                  lineHeight: 58,
                  color: countdown > 0 && countdown <= 3 ? COLORS.pink : COLORS.cyan,
                },
              ]}
            >
              {countdown > 0 ? countdown : '–'}
            </Text>
            {countdown > 0 ? <Text style={[TYPE.head, { color: COLORS.cyan, fontSize: 16 }]}>s</Text> : null}
          </View>
          <Text style={TYPE.label}>Countdown</Text>
          <Segmented
            items={[30, 60, 120].map((value) => ({ key: value, label: String(value) }))}
            value={countdown === 30 || countdown === 60 || countdown === 120 ? countdown : null}
            onChange={(value) => setCountdown(value)}
          />
        </Surface>
      </View>

      <Card>
        <View style={styles.row}>
          <IconTile name="chip" size={46} iconSize={22} gradient={GRADIENTS.avatarCyan} color="#04202A" radius={16} />
          <View style={{ gap: 4, flex: 1 }}>
            <Title>KI-Trick-Coach</Title>
            <Text style={TYPE.label}>Fragen, Fotos, Feedback</Text>
          </View>
        </View>

        <Bubble>Frage nach einem Trick oder füge ein Foto hinzu.</Bubble>

        <Field
          value={question}
          onChangeText={setQuestion}
          placeholder="z. B. Warum bekomme ich beim Fingerwhip das Deck nicht zurück?"
          multiline
        />

        {coachImage ? (
          <Image
            source={{
              uri: coachImage.uri,
            }}
            style={styles.preview}
          />
        ) : null}

        <View style={styles.row}>
          <SecondaryButton
            title={
              coachImage
                ? 'Foto gewählt'
                : 'Foto hinzufügen'
            }
            icon="camera"
            onPress={chooseCoachImage}
          />
          <View style={{ flex: 1 }}>
            <Button
              title={
                coachBusy
                  ? 'Coach denkt…'
                  : 'Coach fragen'
              }
              icon="send"
              compact
              disabled={
                coachBusy ||
                (!question.trim() &&
                  !coachImage)
              }
              onPress={() => runCoach(false)}
            />
          </View>
        </View>

        {coachBusy ? (
          <Bubble tone="cyan">
            <View style={styles.row}>
              <ActivityIndicator color={COLORS.cyan} size="small" />
              <Text style={[TYPE.caption, { color: COLORS.cyanText }]}>Der Coach denkt nach…</Text>
            </View>
          </Bubble>
        ) : null}

        {coachAnswer ? (
          <Bubble tone="cyan" style={{ alignSelf: 'stretch' }}>
            <Text style={styles.answer}>
              {coachAnswer}
            </Text>
          </Bubble>
        ) : null}
      </Card>

      <Card>
        <View style={styles.headRow}>
          <Title>Session-Notizen</Title>
          <Text style={TYPE.label}>5 neueste</Text>
        </View>

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Field
              value={note}
              onChangeText={setNote}
              placeholder="Was lief heute gut?"
            />
          </View>
          <Pressable
            onPress={addNote}
            accessibilityRole="button"
            accessibilityLabel="Notiz speichern"
            style={({ pressed }) => [styles.roundAction, pressed && { opacity: 0.8 }]}
          >
            <AppIcon name="plus" size={20} color={COLORS.onLime} strokeWidth={2.6} />
          </Pressable>
        </View>

        {notes.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={styles.notesRow}
          >
            {notes.slice(0, 5).map((entry, index) => (
              <View
                key={entry.id}
                style={[
                  styles.note,
                  { transform: [{ rotate: index % 2 ? '1.2deg' : '-1.5deg' }] },
                ]}
              >
                {index === 0 ? <Grad colors={['#12344A', '#0E1A30']} angle={160} radius={20} /> : null}
                <Text style={styles.noteText}>
                  {entry.text}
                </Text>
                <Text style={[TYPE.label, { fontSize: 11, color: index === 0 ? COLORS.cyanText : COLORS.text3 }]}>
                  {entry.at}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={TYPE.caption}>Noch keine Notizen gespeichert.</Text>
        )}
      </Card>

      <Card>
        <View style={styles.headRow}>
          <Title>Streak &amp; Judge</Title>
          <Tag label="1–10" tone="pink" />
        </View>

        <View style={styles.row}>
          <View style={styles.proofSlot}>
            {coachImage ? (
              <Image source={{ uri: coachImage.uri }} style={StyleSheet.absoluteFill} />
            ) : (
              <>
                <AppIcon name="camera" size={28} color={COLORS.text3} />
                <Text style={TYPE.label}>
                  {proof ? (proof.type === 'video' ? 'Video gewählt' : 'Beweis gewählt') : 'Beweis-Foto'}
                </Text>
              </>
            )}
          </View>
          <ProgressRing size={118} stroke={12} progress={0} color={COLORS.pink} inner="#0B1221">
            <Text style={[TYPE.number, { fontSize: 34 }]}>{stats.streak || 0}</Text>
            <Text style={[TYPE.label, { fontSize: 11 }]}>Tage</Text>
          </ProgressRing>
        </View>

        {proof ? (
          <Text style={TYPE.caption}>
            {proof.type === 'video'
              ? 'Video zählt als Streak-Beweis. Für die aktuelle KI-Bewertung wird noch ein Foto verwendet.'
              : 'Foto gewählt – der Beweis wird nicht dauerhaft gespeichert.'}
          </Text>
        ) : null}

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              title="Beweis wählen"
              tone="cyan"
              icon="camera"
              onPress={selectProof}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              title="Foto judgen"
              tone="pink"
              icon="target"
              disabled={
                !coachImage || coachBusy
              }
              onPress={() => runCoach(true)}
            />
          </View>
        </View>

        {judge ? (
          <Bubble tone="cyan" style={{ alignSelf: 'stretch' }}>
            <Text style={styles.answer}>
              {judge}
            </Text>
          </Bubble>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  posterTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  posterLabel: {
    marginTop: 22,
    color: COLORS.cyanText,
  },
  posterTitle: {
    ...TYPE.display,
    fontSize: 70,
    lineHeight: 66,
    marginTop: 10,
  },
  posterText: {
    ...TYPE.body,
    color: '#CCD6E4',
    marginTop: 14,
  },
  safetyWell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(3,5,10,0.45)',
  },
  posterFoot: {
    marginTop: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  bento: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoCard: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  bentoValue: {
    ...TYPE.head,
    fontSize: 20,
    lineHeight: 23,
  },
  tileResult: {
    ...TYPE.display,
    fontSize: 36,
    lineHeight: 36,
    minHeight: 36,
  },
  preview: {
    width: 96,
    height: 96,
    borderRadius: 18,
  },
  answer: {
    fontFamily: FONTS.body,
    color: '#DDE3EE',
    fontSize: 14,
    lineHeight: 21,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundAction: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesRow: {
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  note: {
    width: 190,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.tile,
    gap: 10,
  },
  noteText: {
    fontFamily: FONTS.medium,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 19.5,
  },
  proofSlot: {
    flex: 1,
    height: 118,
    borderRadius: 22,
    backgroundColor: COLORS.well,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
});
