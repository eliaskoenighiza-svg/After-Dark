import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Button, Field, Muted, Notice, Pill, Title } from '../components/UI';
import { COLORS } from '../theme';
import { localGet, localSet, sharedGet, sharedSet } from '../storage';
import {
  cloudConfigured,
  getMyCrews,
  syncCloudProfile,
  getCrewChatRoomsCloud,
  createCrewChatRoomCloud,
  getCrewChatMessagesCloud,
  sendCrewChatMessageCloud,
  deleteMyChatMessageCloud,
} from '../services/supabase';

const formatTime = (value) => {
  try {
    return new Date(value).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export default function ChatTab({ profile }) {
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [roomName, setRoomName] = useState('Crew');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [streak, setStreak] = useState(0);
  const [crewId, setCrewId] = useState(null);
  const [cloudUserId, setCloudUserId] = useState(null);
  const [cloudMode, setCloudMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const updateStreak = async () => {
    const all = await sharedGet('chat:streaks', {});
    const today = new Date().toISOString().slice(0, 10);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = y.toISOString().slice(0, 10);
    const old = all[profile.nickname] || {};

    const count =
      old.last === today
        ? (old.count || 1)
        : old.last === yesterday
          ? (old.count || 0) + 1
          : 1;

    const updated = {
      ...all,
      [profile.nickname]: { last: today, count },
    };

    await sharedSet('chat:streaks', updated);
    setStreak(count);
  };

  const loadLocal = async (selectedRoom = roomName) => {
    const localRooms = await sharedGet('chat:rooms', ['Crew']);
    setRooms(localRooms.map((name) => ({ id: name, name })));

    const selected = selectedRoom || localRooms[0] || 'Crew';
    setRoomName(selected);
    setRoomId(selected);
    setMessages(await sharedGet(`chat:${selected}`, []));

    const st = await sharedGet('chat:streaks', {});
    setStreak(st[profile.nickname]?.count || 0);
  };

  const refreshCloudRooms = async (targetCrewId = crewId) => {
    if (!targetCrewId) return;

    const result = await getCrewChatRoomsCloud(targetCrewId);
    if (!result.ok) {
      setNotice(result.error || 'Chat-Räume konnten nicht geladen werden.');
      return;
    }

    const nextRooms = result.rooms || [];
    setRooms(nextRooms);
    setCloudUserId(result.userId || null);

    const stillExists = nextRooms.some((r) => r.id === roomId);
    const selected = stillExists
      ? nextRooms.find((r) => r.id === roomId)
      : (nextRooms[0] || null);

    if (selected) {
      setRoomId(selected.id);
      setRoomName(selected.name);
    }
    setNotice('');
  };

  const refreshCloudMessages = async (targetRoomId = roomId) => {
    if (!targetRoomId) {
      setMessages([]);
      return;
    }

    const result = await getCrewChatMessagesCloud(targetRoomId, 100);
    if (!result.ok) {
      setNotice(result.error || 'Nachrichten konnten nicht geladen werden.');
      return;
    }

    setMessages(result.messages || []);
    setCloudUserId(result.userId || null);
    setNotice('');
  };

  useEffect(() => {
    (async () => {
      const st = await sharedGet('chat:streaks', {});
      setStreak(st[profile.nickname]?.count || 0);

      if (!cloudConfigured()) {
        setCloudMode(false);
        await loadLocal('Crew');
        return;
      }

      const profileResult = await syncCloudProfile(profile.nickname);
      if (!profileResult.ok) {
        setCloudMode(false);
        setNotice(profileResult.error || 'Crew-Cloud konnte nicht geladen werden.');
        await loadLocal('Crew');
        return;
      }

      let activeCrew = await localGet('crew:activeCloudCrewId', null);
      const crewsResult = await getMyCrews();

      if (!crewsResult.ok || !(crewsResult.crews || []).length) {
        setCloudMode(false);
        setNotice(crewsResult.error || 'Du bist noch in keiner Cloud-Crew.');
        await loadLocal('Crew');
        return;
      }

      const crews = crewsResult.crews || [];
      if (!activeCrew || !crews.some((c) => c.id === activeCrew)) {
        activeCrew = crews[0].id;
        await localSet('crew:activeCloudCrewId', activeCrew);
      }

      setCrewId(activeCrew);
      setCloudMode(true);

      const roomsResult = await getCrewChatRoomsCloud(activeCrew);
      if (!roomsResult.ok) {
        setNotice(roomsResult.error || 'Chat-Räume konnten nicht geladen werden.');
        return;
      }

      const nextRooms = roomsResult.rooms || [];
      setRooms(nextRooms);
      setCloudUserId(roomsResult.userId || null);

      const selected = nextRooms[0] || null;
      if (selected) {
        setRoomId(selected.id);
        setRoomName(selected.name);

        const messageResult = await getCrewChatMessagesCloud(selected.id, 100);
        if (messageResult.ok) {
          setMessages(messageResult.messages || []);
          setCloudUserId(messageResult.userId || roomsResult.userId || null);
        } else {
          setNotice(messageResult.error || 'Nachrichten konnten nicht geladen werden.');
        }
      }
    })();
  }, [profile.nickname]);

  useEffect(() => {
    if (!cloudMode || !crewId) return;
    const id = setInterval(() => refreshCloudRooms(crewId), 10000);
    return () => clearInterval(id);
  }, [cloudMode, crewId, roomId]);

  useEffect(() => {
    if (!cloudMode || !roomId) {
      if (!cloudMode && roomName) {
        const id = setInterval(() => loadLocal(roomName), 3500);
        return () => clearInterval(id);
      }
      return;
    }

    refreshCloudMessages(roomId);
    const id = setInterval(() => refreshCloudMessages(roomId), 3000);
    return () => clearInterval(id);
  }, [cloudMode, roomId]);

  const selectRoom = async (r) => {
    setRoomId(r.id);
    setRoomName(r.name);
    setMessages([]);

    if (cloudMode) {
      await refreshCloudMessages(r.id);
    } else {
      setMessages(await sharedGet(`chat:${r.name}`, []));
    }
  };

  const send = async () => {
    if (!text.trim() || busy) return;

    if (cloudMode && roomId) {
      setBusy(true);
      const result = await sendCrewChatMessageCloud(roomId, text);
      if (result.ok) {
        setText('');
        await updateStreak();
        await refreshCloudMessages(roomId);
      } else {
        setNotice(result.error || 'Nachricht konnte nicht gesendet werden.');
      }
      setBusy(false);
      return;
    }

    const next = [
      ...messages,
      {
        id: Date.now(),
        by: profile.nickname,
        text: text.trim(),
        at: new Date().toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ].slice(-100);

    setMessages(next);
    setText('');
    await sharedSet(`chat:${roomName}`, next);
    await updateStreak();
  };

  const addRoom = async () => {
    const name = newRoom.trim();
    if (!name || busy) return;

    if (cloudMode && crewId) {
      setBusy(true);
      const result = await createCrewChatRoomCloud(crewId, name);
      if (result.ok) {
        setNewRoom('');
        await refreshCloudRooms(crewId);
        if (result.room) {
          setRoomId(result.room.id);
          setRoomName(result.room.name);
          setMessages([]);
        }
      } else {
        setNotice(result.error || 'Raum konnte nicht erstellt werden.');
      }
      setBusy(false);
      return;
    }

    const names = rooms.map((r) => r.name);
    if (names.includes(name)) return;

    const next = [...names, name].slice(0, 12);
    setRooms(next.map((n) => ({ id: n, name: n })));
    setNewRoom('');
    setRoomName(name);
    setRoomId(name);
    setMessages([]);
    await sharedSet('chat:rooms', next);
  };

  const deleteMessage = async (messageId) => {
    if (!cloudMode || !messageId || busy) return;

    setBusy(true);
    const result = await deleteMyChatMessageCloud(messageId);
    if (result.ok) {
      await refreshCloudMessages(roomId);
    } else {
      setNotice(result.error || 'Nachricht konnte nicht gelöscht werden.');
    }
    setBusy(false);
  };

  return (
    <View style={styles.stack}>
      <Card>
        <Title>Chat</Title>
        <Text style={styles.streak}>
          Chat-Streak: {streak} Tag{streak === 1 ? '' : 'e'}
        </Text>

        <Muted>
          {cloudMode
            ? 'Crew-Cloud aktiv · Nachrichten werden zwischen den Handys deiner Crew synchronisiert.'
            : 'Lokaler Testmodus · keine aktive Cloud-Crew.'}
        </Muted>

        {notice ? <Notice tone="pink">{notice}</Notice> : null}

        <View style={styles.wrap}>
          {rooms.map((r) => (
            <Pill
              key={r.id}
              label={r.name}
              active={roomId === r.id}
              onPress={() => selectRoom(r)}
            />
          ))}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field
              value={newRoom}
              onChangeText={setNewRoom}
              placeholder="Neuer Crew-Raum"
            />
          </View>
          <Button
            title="+"
            disabled={busy || !newRoom.trim()}
            onPress={addRoom}
          />
        </View>
      </Card>

      <Card>
        <Title small>{roomName || 'Crew'}</Title>

        {messages.length ? (
          messages.map((m) => {
            const mine = cloudMode
              ? m.user_id === cloudUserId
              : m.by === profile.nickname;

            return (
              <View key={m.id} style={[styles.msg, mine && styles.mine]}>
                <Text style={styles.meta}>
                  {cloudMode ? m.nickname : m.by}
                  {' · '}
                  {cloudMode ? formatTime(m.created_at) : m.at}
                </Text>
                <Text style={styles.body}>
                  {cloudMode ? m.message : m.text}
                </Text>

                {cloudMode && mine ? (
                  <Button
                    title="Löschen"
                    tone="dark"
                    disabled={busy}
                    onPress={() => deleteMessage(m.id)}
                  />
                ) : null}
              </View>
            );
          })
        ) : (
          <Muted>Noch keine Nachrichten.</Muted>
        )}

        <Field
          value={text}
          onChangeText={setText}
          placeholder="Nachricht…"
          multiline
        />

        <Button
          title={busy ? 'Bitte warten…' : 'Senden'}
          disabled={busy || !text.trim()}
          onPress={send}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  msg: {
    backgroundColor: COLORS.panel2,
    padding: 10,
    borderRadius: 12,
    alignSelf: 'stretch',
    gap: 6,
  },
  mine: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.volt,
  },
  meta: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  streak: {
    color: COLORS.volt,
    fontWeight: '900',
  },
  body: {
    color: COLORS.text,
    fontSize: 15,
    marginTop: 3,
    lineHeight: 20,
  },
});
