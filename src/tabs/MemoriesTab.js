import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Button, Muted, Notice, Pill, Title } from '../components/UI';
import { COLORS } from '../theme';
import { localGet, localSet, sharedGet, sharedSet } from '../storage';
import { pickAndResizeImage, persistImage } from '../services/media';

const today=()=>new Date().toISOString().slice(0,10);

export default function MemoriesTab({profile}){
  const [scope,setScope]=useState('private'); const [items,setItems]=useState([]); const [notice,setNotice]=useState('');
  const key=scope==='private'?'memories:private':'memories:crew'; const get=scope==='private'?localGet:sharedGet; const set=scope==='private'?localSet:sharedSet; const max=scope==='private'?12:9;
  const load=async()=>setItems(await get(key,[]));
  useEffect(()=>{load()},[scope]);
  const add=async()=>{setNotice('');if(items.length>=max){setNotice(`Hier passen maximal ${max} Bilder rein.`);return;}const img=await pickAndResizeImage();if(!img)return;const uri=await persistImage(img.uri,scope);const next=[{id:Date.now(),uri,by:profile.nickname,likes:0,day:today()},...items];setItems(next);await set(key,next)};
  const like=async(id)=>{const next=items.map(x=>x.id===id?{...x,likes:(x.likes||0)+1}:x);setItems(next);await set(key,next)};
  const crown=items.filter(x=>x.day===today()).sort((a,b)=>(b.likes||0)-(a.likes||0))[0]?.id;
  return <View style={styles.stack}>{notice?<Notice>{notice}</Notice>:null}<Card><Title>Memories</Title><View style={styles.wrap}><Pill label="Privat" active={scope==='private'} onPress={()=>setScope('private')}/><Pill label="Crew" active={scope==='crew'} onPress={()=>setScope('crew')}/></View><Muted>{items.length} / {max} Bilder</Muted><Button title="📷 Bild hinzufügen" onPress={add}/></Card><View style={styles.grid}>{items.map(x=><View key={x.id} style={styles.tile}><Image source={{uri:x.uri}} style={styles.image}/><View style={styles.info}><Text style={styles.by}>{crown===x.id?'♛ ':''}{x.by}</Text><Pressable onPress={()=>like(x.id)} style={styles.like}><Text style={styles.likeText}>👍 {x.likes||0}</Text></Pressable></View></View>)}</View>{!items.length?<Card><Muted>Noch keine Bilder.</Muted></Card>:null}</View>
}
const styles=StyleSheet.create({stack:{gap:12},wrap:{flexDirection:'row',gap:8},grid:{gap:10},tile:{backgroundColor:COLORS.panel,borderRadius:16,overflow:'hidden',borderWidth:1,borderColor:COLORS.line},image:{width:'100%',height:260,resizeMode:'cover'},info:{padding:10,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},by:{color:COLORS.text,fontWeight:'800'},like:{padding:8,backgroundColor:COLORS.panel2,borderRadius:10},likeText:{color:COLORS.text,fontWeight:'800'}});
