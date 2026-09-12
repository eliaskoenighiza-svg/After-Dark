import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Button, Field, Muted, Notice, Pill, Title } from '../components/UI';
import PageHero from '../components/PageHero';
import { COLORS } from '../theme';
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

  return (
    <View style={styles.stack}>
      <PageHero
        type="battle"
        title="Battle"
        subtitle="S.K.A.T.E. · BINGO · HISTORY"
        accent={COLORS.pink}
      />

      {notice ? (
        <Notice>{notice}</Notice>
      ) : null}

      <Card variant="purple">
        <Title color={sport.color}>
          {word}-Battle
        </Title>

        <Muted>
          Zwei bis sechs Spieler. Wer einen
          gesetzten Trick nicht steht, bekommt
          den nächsten Buchstaben.
        </Muted>

        {players.map((player, index) => (
          <View
            key={player.id}
            style={styles.player}
          >
            <Field
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
            />

            <View style={styles.playerBottom}>
              <Text style={styles.letters}>
                {word.slice(0, player.fails)}
                <Text style={styles.dim}>
                  {word.slice(player.fails)}
                </Text>
              </Text>

              <Button
                title="Bail +1"
                tone="pink"
                compact
                onPress={() =>
                  fail(player.id)
                }
              />
            </View>
          </View>
        ))}

        <View style={styles.wrap}>
          <Button
            title="+ Spieler"
            tone="dark"
            compact
            disabled={players.length >= 6}
            onPress={addPlayer}
          />
          <Button
            title="Reihenfolge mischen"
            tone="dark"
            compact
            onPress={() =>
              setPlayers(shuffle(players))
            }
          />
          <Button
            title="Battle reset"
            tone="dark"
            compact
            onPress={reset}
          />
        </View>
      </Card>

      <Card variant="cyan">
        <Title small>Trick setzen</Title>

        <View style={styles.wrap}>
          {sport.levels.map(([entry]) => (
            <Pill
              key={entry}
              label={entry}
              active={level === entry}
              color={sport.color}
              onPress={() => setLevel(entry)}
            />
          ))}
        </View>

        {current ? (
          <View style={styles.trickHero}>
            <Text style={styles.trick}>
              {current.name}
            </Text>
            <Muted>{current.level}</Muted>
          </View>
        ) : null}

        <Button
          title="Offline-Trick ziehen"
          onPress={draw}
        />

        <Button
          title={
            aiBusy
              ? 'KI zieht…'
              : 'Extra: KI-Trick'
          }
          tone="dark"
          disabled={aiBusy}
          onPress={drawAI}
        />

        <Muted>
          Die normalen Battle-Tricks kommen
          offline aus deinem Skill-Baum.
        </Muted>
      </Card>

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Card variant="lime">
            <Title small>Münzwurf</Title>

            {coin ? (
              <Text style={styles.coin}>
                {coin}
              </Text>
            ) : (
              <Muted>
                Wer startet die Runde?
              </Muted>
            )}

            <Button
              title="Wer beginnt?"
              tone="ice"
              onPress={() =>
                setCoin(
                  Math.random() < 0.5
                    ? 'Kopf'
                    : 'Zahl'
                )
              }
            />
          </Card>
        </View>

        <View style={styles.col}>
          <Card variant="pink">
            <Title small>Siege</Title>
            <Text style={styles.winCount}>
              {stats.wins || 0}
            </Text>
            <Muted>
              Deine gespeicherten Battle-Siege.
            </Muted>
          </Card>
        </View>
      </View>

      <Card variant="purple">
        <Title small>Trick-Bingo 3×3</Title>

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
              style={[
                styles.cell,
                item.done &&
                  styles.cellDone,
              ]}
            >
              <Text
                numberOfLines={3}
                style={[
                  styles.cellText,
                  item.done &&
                    styles.cellDoneText,
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {hasBingo() ? (
          <>
            <Text style={styles.bingo}>
              BINGO!
            </Text>
            <Button
              title="Sieg speichern"
              onPress={recordWin}
            />
          </>
        ) : null}

        <Button
          title="Neues Bingo"
          tone="dark"
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

      <Card variant="night">
        <Title small>Kampf-Verlauf</Title>

        {history.length ? (
          history.map((entry, index) => (
            <Text
              key={index}
              style={styles.history}
            >
              {entry.at} · {entry.text}
            </Text>
          ))
        ) : (
          <Muted>Noch nichts passiert.</Muted>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  player: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 10,
  },
  playerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  letters: {
    color: COLORS.pink,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
  },
  dim: {
    color: '#385068',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trickHero: {
    backgroundColor: '#09131D',
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    borderRadius: 18,
    padding: 12,
    gap: 3,
  },
  trick: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  coin: {
    color: COLORS.ice,
    fontSize: 28,
    fontWeight: '900',
  },
  winCount: {
    color: COLORS.volt,
    fontSize: 36,
    fontWeight: '900',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '2%',
  },
  cell: {
    width: '32%',
    aspectRatio: 1,
    backgroundColor: '#09131D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    padding: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDone: {
    backgroundColor: COLORS.volt,
    borderColor: COLORS.volt,
  },
  cellText: {
    color: COLORS.text,
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  cellDoneText: {
    color: COLORS.bg,
  },
  bingo: {
    color: COLORS.volt,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  history: {
    color: COLORS.text,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
});
