import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Button, Field, Muted, Notice, Pill, Title } from '../components/UI';
import { COLORS } from '../theme';
import { allTricks } from '../data/sports';
import { askAI } from '../services/ai';
import { localSet } from '../storage';

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

export default function BattleTab({ sport, profile, stats, setStats }) {
  const tricks = useMemo(() => allTricks(sport), [sport]);
  const [players, setPlayers] = useState([{id:1,name:profile.nickname||'Du',fails:0},{id:2,name:'Freund 1',fails:0}]);
  const [level, setLevel] = useState('Basics');
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [coin, setCoin] = useState('');
  const [bingo, setBingo] = useState(() => shuffle(tricks).slice(0,9).map((t,i)=>({...t,id:i,done:false})));
  const [notice,setNotice]=useState('');
  const [aiBusy,setAiBusy]=useState(false);

  const pool = tricks.filter(t=>t.level===level);
  const word=sport.battle;
  const addPlayer=()=>{ if(players.length<6) setPlayers([...players,{id:Date.now(),name:`Freund ${players.length}`,fails:0}]); };
  const draw=()=>{ const t=(pool.length?pool:tricks)[Math.floor(Math.random()*(pool.length?pool:tricks).length)]; setCurrent(t); setHistory(h=>[{at:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}),text:`Trick: ${t.name}`},...h].slice(0,20)); };
  const fail=async(id)=>{setPlayers(ps=>ps.map(p=>p.id===id?{...p,fails:Math.min(word.length,p.fails+1)}:p));const next={...stats,bails:(stats.bails||0)+1};setStats(next);await localSet('stats',next)};
  const reset=()=>setPlayers(ps=>ps.map(p=>({...p,fails:0})));
  const hasBingo=()=>{ const d=bingo.map(x=>x.done); return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(r=>r.every(i=>d[i])); };
  const recordWin=async()=>{ const next={...stats,wins:(stats.wins||0)+1}; setStats(next); await localSet('stats',next); };
  const drawAI=async()=>{setAiBusy(true);setNotice('');try{const text=await askAI([{role:'user',content:`Nenne genau einen realistischen ${sport.name}-Battle-Trick auf Niveau ${level}. Keine gefährliche Mutprobe. Antworte nur mit dem Tricknamen.`}]);const t={name:text.trim().split('\n')[0],level};setCurrent(t);setHistory(h=>[{at:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}),text:`KI-Trick: ${t.name}`},...h].slice(0,20))}catch(e){setNotice(e.message)}finally{setAiBusy(false)}};

  return <View style={styles.stack}>
    {notice?<Notice>{notice}</Notice>:null}
    <Card><Title color={sport.color}>{word}-Battle</Title><Muted>Zwei bis sechs Spieler. Wer einen gesetzten Trick nicht steht, bekommt den nächsten Buchstaben.</Muted>
      {players.map((p,i)=><View key={p.id} style={styles.player}><Field value={p.name} onChangeText={name=>setPlayers(ps=>ps.map(x=>x.id===p.id?{...x,name}:x))} placeholder={`Spieler ${i+1}`}/><View style={styles.playerBottom}><Text style={styles.letters}>{word.slice(0,p.fails)}<Text style={styles.dim}>{word.slice(p.fails)}</Text></Text><Button title="Bail +1" tone="pink" compact onPress={()=>fail(p.id)}/></View></View>)}
      <View style={styles.wrap}><Button title="+ Spieler" tone="dark" compact disabled={players.length>=6} onPress={addPlayer}/><Button title="Reihenfolge mischen" tone="dark" compact onPress={()=>setPlayers(shuffle(players))}/><Button title="Battle reset" tone="dark" compact onPress={reset}/></View>
    </Card>
    <Card><Title small>Trick setzen</Title><View style={styles.wrap}>{sport.levels.map(([l])=><Pill key={l} label={l} active={level===l} color={sport.color} onPress={()=>setLevel(l)}/>)}</View>{current&&<><Text style={styles.trick}>{current.name}</Text><Muted>{current.level}</Muted></>}<Button title="Offline-Trick ziehen" onPress={draw}/><Button title={aiBusy?'KI zieht…':'✨ Extra: KI-Trick'} tone="dark" disabled={aiBusy} onPress={drawAI}/><Muted>Die normalen Battle-Tricks kommen absichtlich offline aus deinem Skill-Baum.</Muted></Card>
    <Card><Title small>Münzwurf</Title>{coin?<Text style={styles.trick}>{coin}</Text>:null}<Button title="🪙 Wer beginnt?" tone="ice" onPress={()=>setCoin(Math.random()<0.5?'Kopf':'Zahl')}/></Card>
    <Card><Title small>Trick-Bingo 3×3</Title><View style={styles.grid}>{bingo.map((x,i)=><Pressable key={x.id} onPress={()=>setBingo(b=>b.map((y,j)=>j===i?{...y,done:!y.done}:y))} style={[styles.cell,x.done&&styles.cellDone]}><Text numberOfLines={3} style={[styles.cellText,x.done&&styles.cellDoneText]}>{x.name}</Text></Pressable>)}</View>{hasBingo()?<><Text style={styles.bingo}>BINGO!</Text><Button title="Sieg speichern" onPress={recordWin}/></>:null}<Button title="Neues Bingo" tone="dark" onPress={()=>setBingo(shuffle(tricks).slice(0,9).map((t,i)=>({...t,id:Date.now()+i,done:false})))}/></Card>
    <Card><Title small>Kampf-Verlauf</Title>{history.length?history.map((h,i)=><Text key={i} style={styles.history}>{h.at} · {h.text}</Text>):<Muted>Noch nichts passiert.</Muted>}</Card>
  </View>;
}

const styles=StyleSheet.create({stack:{gap:12},player:{gap:8,borderTopWidth:1,borderTopColor:COLORS.line,paddingTop:10},playerBottom:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},letters:{color:COLORS.pink,fontSize:22,fontWeight:'900',letterSpacing:3},dim:{color:COLORS.line},wrap:{flexDirection:'row',flexWrap:'wrap',gap:8},trick:{color:COLORS.text,fontSize:24,fontWeight:'900'},grid:{flexDirection:'row',flexWrap:'wrap',gap:'2%'},cell:{width:'32%',aspectRatio:1,backgroundColor:COLORS.panel2,borderRadius:12,borderWidth:1,borderColor:COLORS.line,padding:7,alignItems:'center',justifyContent:'center'},cellDone:{backgroundColor:COLORS.volt,borderColor:COLORS.volt},cellText:{color:COLORS.text,fontSize:12,fontWeight:'800',textAlign:'center'},cellDoneText:{color:COLORS.bg},bingo:{color:COLORS.volt,fontSize:30,fontWeight:'900',textAlign:'center'},history:{color:COLORS.text,paddingVertical:5,borderBottomWidth:1,borderBottomColor:COLORS.line}});
