import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Button, Field, Muted, Notice, Pill, Title } from '../components/UI';
import AppIcon from '../components/AppIcon';
import { Glow, Grad } from '../design/Grad';
import { CoinArt } from '../design/art';
import { CoinFlip, LetterTile, SlamIn, ThinkingOrbit } from '../design/motion';
import { Avatar, IconTile, PosterCard, SecondaryButton, Segmented, Sticker, Surface, Tag } from '../design/kit';
import { BadgeVideo } from '../design/badges';
import { COLORS, FONTS, GRADIENTS, RADII, TYPE } from '../theme';
import { EmptyScene } from '../design/ambient';
import { openShare } from '../design/share';
import { allTricks } from '../data/sports';
import { askAI } from '../services/ai';
import { localSet } from '../storage';

const shuffle = (array) =>
  [...array].sort(() => Math.random() - 0.5);

export default function BattleTab({ sport, profile, stats, setStats }) {
  const tricks = useMemo(() => allTricks(sport), [sport]);

  const [players, setPlayers] = useState([
    {
      id: 1,
      name: profile.nickname || 'Du',
      fails: 0,
    },
    {
      id: 2,
      name: 'Freund 1',
      fails: 0,
    },
  ]);

  const [level, setLevel] = useState('Basics');
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [coin, setCoin] = useState('');
  const [bingo, setBingo] = useState(() =>
    shuffle(tricks)
      .slice(0, 9)
      .map((trick, index) => ({
        ...trick,
        id: index,
        done: false,
      }))
  );
  const [notice, setNotice] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  const pool = tricks.filter(
    (trick) => trick.level === level
  );

  const word = sport.battle;

  const addPlayer = () => {
    if (players.length >= 6) return;

    setPlayers([
      ...players,
      {
        id: Date.now(),
        name: `Freund ${players.length}`,
        fails: 0,
      },
    ]);
  };

  const draw = () => {
    const source = pool.length ? pool : tricks;
    const trick =
      source[
        Math.floor(
          Math.random() * source.length
        )
      ];

    setCurrent(trick);

    setHistory((old) => [
      {
        at: new Date().toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        text: `Trick: ${trick.name}`,
      },
      ...old,
    ].slice(0, 20));
  };

  const fail = async (id) => {
    setPlayers((old) =>
      old.map((player) =>
        player.id === id
          ? {
              ...player,
              fails: Math.min(
                word.length,
                player.fails + 1
              ),
            }
          : player
      )
    );

    const next = {
      ...stats,
      bails: (stats.bails || 0) + 1,
    };

    setStats(next);
    await localSet('stats', next);
  };

  const reset = () => {
    setPlayers((old) =>
      old.map((player) => ({
        ...player,
        fails: 0,
      }))
    );
  };

  const hasBingo = () => {
    const done = bingo.map(
      (item) => item.done
    );

    return [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ].some((row) =>
      row.every((index) => done[index])
    );
  };

  const recordWin = async () => {
    const next = {
      ...stats,
      wins: (stats.wins || 0) + 1,
    };

    setStats(next);
    await localSet('stats', next);
  };

  const drawAI = async () => {
    setAiBusy(true);
    setNotice('');

    try {
      const text = await askAI([
        {
          role: 'user',
          content:
            `Nenne genau einen realistischen ${sport.name}-Battle-Trick auf Niveau ${level}. ` +
            'Keine gefährliche Mutprobe. Antworte nur mit dem Tricknamen.',
        },
      ]);

      const trick = {
        name: text.trim().split('\n')[0],
        level,
      };

      setCurrent(trick);

      setHistory((old) => [
        {
          at: new Date().toLocaleTimeString(
            'de-DE',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          ),
          text: `KI-Trick: ${trick.name}`,
        },
        ...old,
      ].slice(0, 20));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setAiBusy(false);
    }
  };

  const [flipKey, setFlipKey] = useState(0);
  const AVATARS = [GRADIENTS.avatarCyan, GRADIENTS.avatarViolet, GRADIENTS.avatarWhite, GRADIENTS.avatarLime];
  const AVATAR_INK = ['#04202A', '#140C3A', '#060A10', '#0B1404'];
  const doneCells = bingo.filter((item) => item.done).length;

  return (
    <View style={styles.stack}>
      {notice ? (
        <Notice>{notice}</Notice>
      ) : null}

      <PosterCard gradient={GRADIENTS.battle} glow="rgba(255,61,139,0.35)" style={styles.poster}>
        <View style={{ paddingHorizontal: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Sticker label="Letter-Battle" tone="pink" />
            <BadgeVideo id="battle" size={64} />
          </View>
          <Text style={styles.posterTitle} numberOfLines={1} adjustsFontSizeToFit>
            {word}-Battle
          </Text>
          <Text style={[TYPE.caption, { marginTop: 12, color: '#C3AFC0' }]}>
            Zwei bis sechs Spieler. Wer einen
            gesetzten Trick nicht steht, bekommt
            den nächsten Buchstaben.
          </Text>
        </View>

        <View style={styles.players}>
          {players.map((player, index) => {
            const left = word.length - player.fails;
            const out = left <= 0;
            const close = !out && left <= 2 && player.fails > 0;
            return (
              <View
                key={player.id}
                style={[
                  styles.player,
                  close && { backgroundColor: 'rgba(255,61,139,0.1)' },
                  out && { opacity: 0.55 },
                ]}
              >
                <View style={styles.row}>
                  <Avatar
                    size={40}
                    letter={(player.name || `${index + 1}`).trim().charAt(0).toUpperCase() || String(index + 1)}
                    gradient={AVATARS[index % AVATARS.length]}
                    color={AVATAR_INK[index % AVATAR_INK.length]}
                  />
                  <TextInput
                    value={player.name}
                    onChangeText={(name) =>
                      setPlayers((old) =>
                        old.map((entry) =>
                          entry.id === player.id
                            ? {
                                ...entry,
                                name,
                              }
                            : entry
                        )
                      )
                    }
                    placeholder={`Spieler ${index + 1}`}
                    placeholderTextColor={COLORS.placeholder}
                    selectionColor={COLORS.lime}
                    style={styles.playerName}
                  />
                  {close ? <Tag label={`${left} übrig`} tone="solidPink" /> : null}
                  {out ? <Tag label="raus" tone="solidPink" /> : null}
                  <SecondaryButton
                    title="Bail +1"
                    tone="pink"
                    size="sm"
                    onPress={() =>
                      fail(player.id)
                    }
                  />
                </View>
                <View style={styles.letters}>
                  {word.split('').map((letter, i) => (
                    <LetterTile
                      key={`${letter}-${i}`}
                      letter={letter}
                      lost={i < player.fails}
                      style={styles.letter}
                      lostStyle={styles.letterLost}
                      textStyle={styles.letterText}
                      lostLayer={<Grad {...GRADIENTS.pink} radius={12} />}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {(() => {
          const alive = players.filter((p) => word.length - p.fails > 0);
          if (players.length < 2 || alive.length !== 1) return null;
          const name = (alive[0].name || 'Spieler').trim() || 'Spieler';
          return (
            <SlamIn style={styles.winnerRow}>
              <Sticker label={`${name} gewinnt`} tone="lime" rotate={-4} />
              <SecondaryButton
                title="Sieger-Karte"
                icon="send"
                tone="light"
                size="sm"
                onPress={() => openShare({ kind: 'battle', winner: name, sub: `${word}-Battle · ${players.length} Spieler` })}
              />
            </SlamIn>
          );
        })()}

        <View style={styles.actions}>
          <SecondaryButton
            title="Spieler"
            icon="plus"
            tone="glass"
            size="sm"
            disabled={players.length >= 6}
            onPress={addPlayer}
          />
          <SecondaryButton
            title="Reihenfolge mischen"
            icon="shuffle"
            tone="glass"
            size="sm"
            onPress={() =>
              setPlayers(shuffle(players))
            }
          />
          <SecondaryButton
            title="Battle reset"
            icon="reset"
            tone="glass"
            size="sm"
            onPress={reset}
          />
        </View>
      </PosterCard>

      <Card>
        <Title>Trick setzen</Title>
        <Segmented
          scroll
          items={sport.levels.map(([entry]) => entry)}
          value={level}
          onChange={(entry) => setLevel(entry)}
        />

        <View style={styles.trickCard}>
          <Grad {...GRADIENTS.trick} radius={24} />
          <Glow color={COLORS.cyan} opacity={0.28} size={260} style={{ right: -90, top: -110 }} />
          <Tag label={current ? current.level : level} tone="dark" />
          {aiBusy ? <ThinkingOrbit label="KI zieht einen Trick…" /> : null}
          <Text
            style={[styles.trickName, !current && { color: COLORS.mutedNum, fontSize: 40, lineHeight: 42 }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {current ? current.name : 'Noch kein Trick'}
          </Text>
        </View>

        <Button
          title="Offline-Trick ziehen"
          icon="dice"
          onPress={draw}
        />
        <SecondaryButton
          title={
            aiBusy
              ? 'KI zieht…'
              : 'Extra: KI-Trick'
          }
          icon="chip"
          iconColor={COLORS.cyan}
          disabled={aiBusy}
          onPress={drawAI}
        />
        <Text style={[TYPE.caption, { textAlign: 'center' }]}>
          Die normalen Battle-Tricks kommen
          offline aus deinem Skill-Baum.
        </Text>
      </Card>

      <View style={styles.bento}>
        <Surface radius={RADII.cardSm} style={styles.bentoCard}>
          <CoinFlip key={flipKey} animate={flipKey > 0}>
            <CoinArt letter={coin ? coin.charAt(0) : '?'} />
          </CoinFlip>
          <Text style={TYPE.label}>Münzwurf</Text>
          {coin ? (
            <Text style={styles.tileResult}>{coin}</Text>
          ) : (
            <Text style={[TYPE.caption, { minHeight: 34 }]}>Wer startet die Runde?</Text>
          )}
          <SecondaryButton
            title="Wer beginnt?"
            tone="cyan"
            size="sm"
            onPress={() => {
              setCoin(
                Math.random() < 0.5
                  ? 'Kopf'
                  : 'Zahl'
              );
              setFlipKey((k) => k + 1);
            }}
          />
        </Surface>

        <Surface radius={RADII.cardSm} gradient={GRADIENTS.tileLime} style={styles.bentoCard}>
          <IconTile name="trophy" size={64} iconSize={30} bg={COLORS.lime} color="#0B1404" radius={20} fillOpacity={0.35} />
          <Text style={TYPE.label}>Siege</Text>
          <Text style={[TYPE.number, { fontSize: 50, lineHeight: 52 }]}>{stats.wins || 0}</Text>
          <Text style={[TYPE.caption, { fontSize: 11.5 }]}>Deine gespeicherten Battle-Siege.</Text>
        </Surface>
      </View>

      <Card>
        <View style={styles.headRow}>
          <Title>Trick-Bingo 3×3</Title>
          <Text style={TYPE.label}>{doneCells} / 9</Text>
        </View>

        <View>
          <View style={styles.grid}>
            {bingo.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  setBingo((old) =>
                    old.map((entry, i) =>
                      i === index
                        ? {
                            ...entry,
                            done: !entry.done,
                          }
                        : entry
                    )
                  )
                }
                style={({ pressed }) => [
                  styles.cell,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {item.done ? <Grad {...GRADIENTS.lime} radius={20} /> : null}
                {item.done ? (
                  <AppIcon name="check" size={16} color={COLORS.onLime} strokeWidth={3} />
                ) : (
                  <View style={{ height: 16 }} />
                )}
                <Text
                  numberOfLines={3}
                  style={[
                    styles.cellText,
                    item.done && styles.cellDoneText,
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {hasBingo() ? (
            <View pointerEvents="none" style={styles.bingoWrap}>
              <SlamIn>
                <Sticker label="Bingo!" tone="pink" rotate={-8} size={38} style={styles.bingoSticker} />
              </SlamIn>
            </View>
          ) : null}
        </View>

        {hasBingo() ? (
          <Button
            title="Sieg speichern"
            icon="trophy"
            onPress={recordWin}
          />
        ) : null}

        {hasBingo() ? (
          <SecondaryButton
            title="Sieger-Karte teilen"
            icon="send"
            tone="pink"
            onPress={() => openShare({ kind: 'battle', title: 'Bingo!', sub: `Trick-Bingo · ${stats.wins || 0} Siege` })}
          />
        ) : null}

        <SecondaryButton
          title="Neues Bingo"
          icon="grid"
          onPress={() =>
            setBingo(
              shuffle(tricks)
                .slice(0, 9)
                .map((trick, index) => ({
                  ...trick,
                  id: Date.now() + index,
                  done: false,
                }))
            )
          }
        />
      </Card>

      <Card>
        <Title>Kampf-Verlauf</Title>
        {history.length ? (
          history.map((entry, index) => {
            const ai = String(entry.text || '').startsWith('KI-');
            return (
              <View key={`${entry.at}-${index}`} style={styles.historyRow}>
                <View style={[styles.timeChip, ai && { backgroundColor: COLORS.cyanSoft }]}>
                  <Text style={[styles.timeText, ai && { color: COLORS.cyanText }]}>{entry.at}</Text>
                </View>
                <Text style={styles.historyText} numberOfLines={2}>
                  {entry.text}
                </Text>
              </View>
            );
          })
        ) : (
          <EmptyScene kind="history" accent={COLORS.pink} />
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 6,
  },
  stack: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  poster: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  posterTitle: {
    ...TYPE.display,
    fontSize: 58,
    lineHeight: 56,
    marginTop: 20,
  },
  players: {
    gap: 10,
    marginTop: 18,
  },
  player: {
    padding: 12,
    borderRadius: RADII.tile,
    backgroundColor: 'rgba(3,5,10,0.42)',
    gap: 12,
  },
  playerName: {
    flex: 1,
    minWidth: 0,
    color: COLORS.text,
    fontFamily: FONTS.bold,
    fontSize: 16,
    paddingVertical: 6,
  },
  letters: {
    flexDirection: 'row',
    gap: 6,
  },
  letter: {
    flex: 1,
    height: 44,
    borderRadius: RADII.letter,
    backgroundColor: '#0F182C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterLost: {
    boxShadow: '0 8px 20px -8px rgba(255,61,139,0.7)',
  },
  letterText: {
    ...TYPE.display,
    fontSize: 26,
    lineHeight: 30,
    paddingRight: 0,
    color: '#2E3A58',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  trickCard: {
    height: 150,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  trickName: {
    ...TYPE.display,
    fontSize: 62,
    lineHeight: 58,
  },
  bento: { flexDirection: 'row', gap: 12 },
  bentoCard: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  tileResult: {
    ...TYPE.display,
    fontSize: 34,
    lineHeight: 34,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cell: {
    width: '32%',
    flexGrow: 1,
    height: 92,
    borderRadius: RADII.stat,
    backgroundColor: COLORS.tile,
    padding: 12,
    justifyContent: 'space-between',
  },
  cellText: {
    fontFamily: FONTS.semibold,
    color: '#C9D1DE',
    fontSize: 13,
    lineHeight: 16,
  },
  cellDoneText: {
    color: COLORS.onLime,
  },
  bingoWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bingoSticker: {
    height: 52,
    paddingHorizontal: 22,
    alignSelf: 'center',
    boxShadow: '0 18px 30px -10px rgba(0,0,0,0.8)',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 6,
    borderRadius: 999,
    backgroundColor: COLORS.stat,
  },
  timeChip: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.raised,
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.text2,
    fontVariant: ['tabular-nums'],
  },
  historyText: {
    flex: 1,
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.text,
  },
});
