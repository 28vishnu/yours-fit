import { useEffect, useMemo, useState } from "react";
import { Browser } from "@capacitor/browser";
import { Activity, Apple, BarChart3, Bell, CalendarDays, Check, ChevronRight, CircleHelp, Droplets, Dumbbell, Flame, HeartPulse, Home, MessageCircle, Plus, Settings, Sparkles, Target, TrendingUp, Utensils, Weight, X } from "lucide-react";
import { workoutPlan, foodIdeas } from "./data";

type Meal = { id: number; name: string; calories: number; protein: number; time: string };
type Entry = { amount: number; time: string; id: number };
type RecoveryLog = { date:string; sleepHours:number; walkingMinutes:number; note:string };
const todayKey = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const load = <T,>(key: string, fallback: T): T => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } };
const nav = [
  {name:"Overview",icon:Home},{name:"Workouts",icon:Dumbbell},{name:"AI Coach",icon:Sparkles},{name:"Nutrition",icon:Utensils},
  {name:"Hydration",icon:Droplets},{name:"Progress",icon:BarChart3},{name:"Recovery",icon:HeartPulse},{name:"Settings",icon:Settings}
];



type AppUpdate = { version: string; apkUrl: string; releaseUrl: string; notes: string };
type UpdateCheckStatus = "idle" | "checking" | "update" | "up-to-date" | "unconfigured" | "no-release" | "missing-apk" | "error";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";
const GITHUB_REPOSITORY = import.meta.env.VITE_GITHUB_REPOSITORY || "";

function isVersionNewer(candidate: string, current: string) {
  const numbers = (value: string) => value.replace(/^v/i, "").split(".").map(part => Number.parseInt(part, 10) || 0);
  const a = numbers(candidate); const b = numbers(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const left = a[i] || 0; const right = b[i] || 0;
    if (left !== right) return left > right;
  }
  return false;
}

async function fetchLatestAppUpdate(): Promise<{ update: AppUpdate | null; status: UpdateCheckStatus }> {
  if (!GITHUB_REPOSITORY || !GITHUB_REPOSITORY.includes("/")) return { update: null, status: "unconfigured" };
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" }, cache: "no-store"
  });
  if (response.status === 404) return { update: null, status: "no-release" };
  if (!response.ok) throw new Error(`GitHub release check failed (${response.status})`);
  const release = await response.json() as { tag_name?: string; html_url?: string; body?: string; assets?: Array<{ name?: string; browser_download_url?: string }> };
  const tag = release.tag_name || "";
  if (!tag || !isVersionNewer(tag, APP_VERSION)) return { update: null, status: "up-to-date" };
  const apk = release.assets?.find(asset => asset.name?.toLowerCase().endsWith(".apk") && asset.browser_download_url);
  if (!apk?.browser_download_url) return { update: null, status: "missing-apk" };
  return { update: { version: tag.replace(/^v/i, ""), apkUrl: apk.browser_download_url, releaseUrl: release.html_url || apk.browser_download_url, notes: release.body || "A newer version of Yours Fit is available." }, status: "update" };
}

export default function App() {
  const [page,setPage] = useState("Overview");
  const [water,setWater] = useState<Entry[]>(()=>load("sf-water-"+todayKey(),[]));
  const [meals,setMeals] = useState<Meal[]>(()=>load("sf-meals-"+todayKey(),[]));
  const [done,setDone] = useState<Record<string,boolean>>(()=>load("sf-sets-"+todayKey(),{}));
  const [goal,setGoal] = useState(()=>load("sf-water-goal",2500));
  const [weight,setWeight] = useState(()=>load<number|null>("sf-weight",null));
  const [calorieGoal,setCalorieGoal] = useState(()=>load("yf-calorie-goal",2200));
  const [proteinGoal,setProteinGoal] = useState(()=>load("yf-protein-goal",100));
  const [displayName,setDisplayName] = useState(()=>load("yf-name","Athlete"));
  const [fitnessGoal,setFitnessGoal] = useState(()=>load("yf-fitness-goal","Build strength"));
  const [heightCm,setHeightCm] = useState(()=>load<number|null>("yf-height",null));
  const [dailyHistory,setDailyHistory] = useState<Record<string,{water:number;calories:number;protein:number;sets:number;completion:number;weight:number|null}>>(()=>load<Record<string,{water:number;calories:number;protein:number;sets:number;completion:number;weight:number|null}>>("yf-history",{}));
  const [recoveryLogs,setRecoveryLogs] = useState<RecoveryLog[]>(()=>load<RecoveryLog[]>("sf-recovery",[]));
  const [newMeal,setNewMeal] = useState("");
  const [newCalories,setNewCalories] = useState("300");
  const [newProtein,setNewProtein] = useState("12");
  const [waterCustom,setWaterCustom] = useState("250");
  const [question,setQuestion] = useState("");
  const [chat,setChat] = useState<{role:string;text:string}[]>(()=>load("yf-chat",[]));
  const [coachBusy,setCoachBusy] = useState(false);
  const [coachError,setCoachError] = useState("");
  const [waterReminders,setWaterReminders] = useState(()=>load("sf-water-reminders",true));
  const [workoutReminders,setWorkoutReminders] = useState(()=>load("sf-workout-reminders",true));
  const [waterInterval,setWaterInterval] = useState(()=>load("sf-water-interval",60));
  const [workoutReminderTime,setWorkoutReminderTime] = useState(()=>load("sf-workout-time","17:30"));
  const [notificationPermission,setNotificationPermission] = useState(typeof Notification==="undefined" ? "unsupported" : Notification.permission);
  const [toast,setToast] = useState("");
  const [availableUpdate,setAvailableUpdate] = useState<AppUpdate | null>(null);
  const [updateStatus,setUpdateStatus] = useState<UpdateCheckStatus>("idle");
  const [updateDismissed,setUpdateDismissed] = useState(false);
  const [activeDay,setActiveDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay()-1);

  const totalWater = water.reduce((sum,e)=>sum+e.amount,0);
  const calories = meals.reduce((sum,m)=>sum+m.calories,0);
  const protein = meals.reduce((sum,m)=>sum+m.protein,0);
  const exerciseCount = workoutPlan[activeDay].exercises.reduce((sum,e)=>sum+e.sets,0);
  const doneCount = Object.entries(done).filter(([k,v])=>k.startsWith(activeDay+"-")&&v).length;
  const pct = Math.min(100,Math.round(totalWater/Math.max(1,goal)*100));
  const date = new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});

  useEffect(()=>localStorage.setItem("yf-chat",JSON.stringify(chat)),[chat]);
  useEffect(()=>localStorage.setItem("sf-water-"+todayKey(),JSON.stringify(water)),[water]);
  useEffect(()=>localStorage.setItem("sf-meals-"+todayKey(),JSON.stringify(meals)),[meals]);
  useEffect(()=>localStorage.setItem("sf-sets-"+todayKey(),JSON.stringify(done)),[done]);
  useEffect(()=>localStorage.setItem("sf-water-goal",JSON.stringify(goal)),[goal]);
  useEffect(()=>localStorage.setItem("sf-weight",JSON.stringify(weight)),[weight]);
  useEffect(()=>localStorage.setItem("yf-calorie-goal",JSON.stringify(calorieGoal)),[calorieGoal]);
  useEffect(()=>localStorage.setItem("yf-protein-goal",JSON.stringify(proteinGoal)),[proteinGoal]);
  useEffect(()=>localStorage.setItem("yf-name",JSON.stringify(displayName)),[displayName]);
  useEffect(()=>localStorage.setItem("yf-fitness-goal",JSON.stringify(fitnessGoal)),[fitnessGoal]);
  useEffect(()=>localStorage.setItem("yf-height",JSON.stringify(heightCm)),[heightCm]);
  useEffect(()=>{ const next={...dailyHistory,[todayKey()]:{water:totalWater,calories,protein,sets:doneCount,completion:Math.round(doneCount/Math.max(1,exerciseCount)*100),weight}}; setDailyHistory(next); localStorage.setItem("yf-history",JSON.stringify(next)); },[totalWater,calories,protein,doneCount,weight]);
  useEffect(()=>localStorage.setItem("sf-water-reminders",JSON.stringify(waterReminders)),[waterReminders]);
  useEffect(()=>localStorage.setItem("sf-workout-reminders",JSON.stringify(workoutReminders)),[workoutReminders]);
  useEffect(()=>localStorage.setItem("sf-water-interval",JSON.stringify(waterInterval)),[waterInterval]);
  useEffect(()=>localStorage.setItem("sf-workout-time",JSON.stringify(workoutReminderTime)),[workoutReminderTime]);

  // Check public GitHub Releases at launch and every six hours while the app is open.
  useEffect(()=>{
    if (!GITHUB_REPOSITORY) { setUpdateStatus("unconfigured"); return; }
    let cancelled = false;
    const check = async () => {
      try {
        const result = await fetchLatestAppUpdate();
        if (cancelled) return;
        setAvailableUpdate(result.update);
        setUpdateStatus(result.status);
        if (result.update) setUpdateDismissed(false);
      } catch { if (!cancelled) setUpdateStatus("error"); }
    };
    void check();
    const timer = window.setInterval(() => void check(), 6 * 60 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  // Browser notifications run while this app is open. True background delivery requires a push service.
  useEffect(()=>{
    if(typeof window==="undefined") return;
    let lastWaterReminder = Date.now();
    let lastWorkoutDate = "";
    const tick = () => {
      const now = new Date();
      if(waterReminders && notificationPermission==="granted" && !document.hidden &&
        Date.now()-lastWaterReminder >= Math.max(15,waterInterval)*60*1000) {
        lastWaterReminder = Date.now();
        if(totalWater < goal) new Notification("Yours Fit · Hydration", {body:`Time for a water break. ${Math.max(0,goal-totalWater).toLocaleString()} ml left in your personal goal.`, tag:"yours-fit-water"});
      }
      const today = now.toLocaleDateString("en-CA");
      const [hh,mm] = workoutReminderTime.split(":").map(Number);
      if(workoutReminders && notificationPermission==="granted" && !document.hidden &&
        now.getHours()===hh && now.getMinutes()===mm && lastWorkoutDate!==today) {
        lastWorkoutDate=today;
        new Notification("Yours Fit · Workout", {body:"Your training reminder is here. Open your plan and train at your own pace.", tag:"yours-fit-workout"});
      }
    };
    const timer = window.setInterval(tick, 30_000);
    return ()=>window.clearInterval(timer);
  },[waterReminders,workoutReminders,waterInterval,workoutReminderTime,notificationPermission,totalWater,goal]);

  const requestNotifications = async () => {
    if(typeof Notification==="undefined"){setToast("This browser does not support notifications.");return;}
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    setToast(result==="granted" ? "Notifications enabled" : "Notification permission was not granted");
  };
  const checkForUpdates = async () => {
    setUpdateStatus("checking");
    try {
      const result = await fetchLatestAppUpdate();
      setAvailableUpdate(result.update);
      setUpdateStatus(result.status);
      if (result.update) { setUpdateDismissed(false); setToast(`Yours Fit ${result.update.version} is available.`); }
      else if (result.status === "up-to-date") setToast(`You're using the latest version (${APP_VERSION}).`);
      else if (result.status === "unconfigured") setToast("Update checking is not configured in this build.");
      else if (result.status === "no-release") setToast("No published release was found yet.");
      else if (result.status === "missing-apk") setToast("A release exists but has no APK attached yet.");
    } catch { setUpdateStatus("error"); setToast("Couldn't check for updates. Check your internet connection and try again."); }
  };
  const downloadUpdate = async () => {
    if (!availableUpdate) return;
    try { await Browser.open({ url: availableUpdate.apkUrl }); }
    catch { window.open(availableUpdate.apkUrl, "_blank", "noopener,noreferrer"); }
  };
  const addWater = (amount:number) => { if(amount>0){setWater(old=>[...old,{id:Date.now(),amount,time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}]);setToast(`Added ${amount} ml`);} };
  const addMeal = (name:string,cal:number,prot:number,time="Snack") => { if(!name.trim())return;setMeals(old=>[...old,{id:Date.now(),name:name.trim(),calories:Math.max(0,cal),protein:Math.max(0,prot),time}]);setNewMeal("");setToast("Meal logged"); };
  const sendQuestion = async () => {
    if (!question.trim() || coachBusy) return;
    const q = question.trim();
    const context = {
      date: todayKey(), goal: fitnessGoal, selectedDay: workoutPlan[activeDay].title,
      workout: workoutPlan[activeDay].focus, exercises: workoutPlan[activeDay].exercises,
      calories, calorieGoal, protein, proteinGoal, waterMl: totalWater, waterGoalMl: goal,
      weightKg: weight, heightCm, meals: meals.map(m => ({ name: m.name, calories: m.calories, protein: m.protein })),
      completedSets: doneCount, totalSets: exerciseCount,
      latestRecovery: recoveryLogs.length ? recoveryLogs[recoveryLogs.length - 1] : null
    };
    setChat(old => [...old, { role: "you", text: q }]);
    setQuestion(""); setCoachBusy(true); setCoachError("");
    const offlineAnswer = (questionText: string) => {
      const lower = questionText.toLowerCase();
      const day = workoutPlan[activeDay];
      const list = (d: typeof workoutPlan[number]) => d.exercises.map(e => `• ${e.name} — ${e.sets} × ${e.reps}`).join("\n");
      if (/\b(hello|hi|hey|who are you)\b/.test(lower)) return `Hey ${displayName}! I'm your Yours Fit coach. I can help with your exact weekly workout, exercise form, reflex drills, muscle gain, meals, protein, hydration, recovery and progress. Ask me a specific question and I'll use your logged data where relevant.`;
      if (/\b(thursday|reflex|reaction|agility|spider.?man|fast feet)\b/.test(lower)) return `Your Thursday session is Reflex + Athletic:\n${list(workoutPlan[3])}\n\nFor reaction drills, ask a friend to call left/right or drop a soft ball for you to catch; keep the space clear. Work quickly but stay controlled, rest 30–60 seconds between rounds, and stop if coordination or landing form breaks down.`;
      if (/\b(saturday|full body|full-body|circuit|rounds)\b/.test(lower)) return `Your Saturday plan is 3 rounds of the full-body circuit, followed by the reflex finisher:\n${list(workoutPlan[5])}\n\nRest 60–120 seconds between rounds as needed. Keep reps clean rather than racing the clock.`;
      if (/\b(sunday|recovery|rest day|stretch|mobility)\b/.test(lower)) return `Sunday is recovery day:\n${list(workoutPlan[6])}\n\nKeep everything gentle and pain-free. If you feel unusually fatigued or have persistent pain, take more rest instead of forcing the session.`;
      if (/\b(monday|chest|shoulder|push.?up|triceps)\b/.test(lower) && /workout|plan|exercise|routine|monday|chest|shoulder/.test(lower)) return `Monday — Chest + Shoulders:\n${list(workoutPlan[0])}\n\nWarm up for 5–8 minutes. Keep your body in a straight line on push-ups, lower under control, and stop each set with about 1–3 good reps left.`;
      if (/\b(tuesday|back|biceps|arms|forearm|curl|row)\b/.test(lower) && /workout|plan|exercise|routine|tuesday|back|biceps|arms|forearm/.test(lower)) return `Tuesday — Back + Arms:\n${list(workoutPlan[1])}\n\nBrace your torso for rows, pull your elbow toward your hip, avoid twisting, and lower the weight slowly. Use a secure backpack load if needed.`;
      if (/\b(wednesday|legs|leg day|abs|abs workout|core)\b/.test(lower) && /workout|plan|exercise|routine|wednesday|legs|leg day|abs|core/.test(lower)) return `Wednesday — Legs + Abs:\n${list(workoutPlan[2])}\n\nKeep knees tracking in line with toes, use a stable support for Bulgarian split squats, and hinge at the hips for Romanian deadlifts with a neutral back.`;
      if (/\b(friday|v.?taper|wide shoulders|upper body)\b/.test(lower)) return `Friday — Upper Body + V-Taper:\n${list(workoutPlan[4])}\n\nPrioritize controlled rows and lateral raises. A V-taper is built over time through back and shoulder development, overall strength, nutrition and consistency; you cannot spot-reduce waist fat.`;
      if (/\b(today|today.?s workout|what workout|workout today|exercise today)\b/.test(lower)) return `Your selected session is ${day.title} — ${day.focus}.\n${list(day)}\n\nYou have completed ${doneCount} of ${exerciseCount} planned sets. Warm up first, rest 60–120 seconds for strength exercises and longer if needed, and use pain-free range of motion.`;
      if (/\b(form|technique|how do i do|how to do|properly|correctly)\b/.test(lower)) {
        const exercise = day.exercises.find(e => lower.includes(e.name.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ")[0]));
        if (exercise && /push.?up/.test(exercise.name.toLowerCase())) return `For ${exercise.name}: place hands in a comfortable position, brace your abs and glutes, keep your head-to-heel line straight, lower under control, and press up without flaring your elbows excessively. Use an incline against a sturdy surface if needed. Stop if you feel sharp pain.`;
        if (exercise && /row/.test(exercise.name.toLowerCase())) return `For ${exercise.name}: hinge forward with a neutral spine, brace your trunk, pull your elbow toward your hip without rotating your torso, pause briefly, then lower slowly. Use a stable support and a load you can control.`;
        if (exercise && /squat|lunge/.test(exercise.name.toLowerCase())) return `For ${exercise.name}: use a stable stance, keep your whole foot planted, let your knees track in line with your toes, and lower only as far as you can maintain control without pain. Start with bodyweight if needed.`;
        return `For safe technique, move slowly through a comfortable range, keep your trunk braced, avoid bouncing or jerking, and choose a version you can control. Tell me the exact exercise name and I can give more specific cues.`;
      }
      if (/\b(substitute|alternative|no dumbbell|no weights|no equipment|no pull.?up|limited space)\b/.test(lower)) return `Equipment-friendly swaps for your plan:\n• No dumbbells: use a securely loaded backpack for rows and Romanian deadlifts.\n• No safe row setup: do backpack rows; don't improvise with unstable furniture.\n• Push-ups too hard: use wall or sturdy incline push-ups.\n• Pike push-ups too hard: use a smaller range or incline shoulder presses with light bottles.\n• No space for bear crawls: do a stationary bear hold or standing fast feet.\nOnly use sturdy equipment and a clear floor.`;
      if (/\b(water|hydrat|drink|thirst)\b/.test(lower)) return `You've logged ${context.waterMl.toLocaleString()} ml against your chosen ${context.waterGoalMl.toLocaleString()} ml goal today; ${Math.max(0, context.waterGoalMl-context.waterMl).toLocaleString()} ml remain. Sip through the day and adjust for heat, activity and thirst. Don't force excessive water; medical fluid advice takes priority.`;
      if (/\b(protein|food|meal|eat|nutrition|calorie|diet|breakfast|lunch|dinner|snack)\b/.test(lower)) return `Your log currently shows ${context.calories.toLocaleString()} kcal and ${context.protein} g protein, against your app goals of ${context.calorieGoal.toLocaleString()} kcal and ${context.proteinGoal} g. A practical budget-friendly pattern is oats with milk at breakfast, rice with dal/vegetables at lunch, curd or peanuts as a snack, and a protein source such as eggs, dal, beans, paneer or curd with dinner. Portions and nutrition vary, so log what you actually eat. Tell me your goal, available foods and budget for a more tailored idea.`;
      if (/\b(gain weight|bulk|muscle gain|build muscle|weight gain)\b/.test(lower)) return `For gradual muscle gain, combine your plan with consistent meals, adequate sleep and progressive training. Eat regular meals with protein sources such as milk/curd, eggs, dal, beans or paneer, and add a modest extra snack if your weight trend is not rising after a couple of weeks. Track weekly weight under similar conditions; avoid extreme bulking targets. Your logged weight is ${context.weightKg === null ? "not recorded yet" : `${context.weightKg} kg`}.`;
      if (/\b(lose weight|fat loss|belly fat|abs visible|cut)\b/.test(lower)) return `Aim for sustainable habits rather than crash dieting: keep strength training, include protein and vegetables/fibre in meals, walk regularly and sleep consistently. You can't target fat loss from one body part. I don't have enough verified information to set a precise calorie target, so avoid aggressive restriction and seek a qualified professional if you have medical concerns.`;
      if (/\b(sleep|sore|tired|fatigue|pain|injury|dizzy)\b/.test(lower)) return `Recovery check: ease off if you're unusually tired, use gentle movement for ordinary stiffness, eat enough and keep a consistent sleep routine. Stop exercising for sharp or worsening pain, dizziness, chest pain or unusual shortness of breath; urgent or persistent symptoms need medical assessment. You don't need to make up a missed workout—continue with the next suitable session.`;
      if (/\b(progress|report|weekly|consistency|completed|how am i doing)\b/.test(lower)) return `Your current check-in (${context.date}):\n• Workout: ${context.selectedDay} — ${context.workout}\n• Sets checked: ${context.completedSets}/${context.totalSets}\n• Water: ${context.waterMl.toLocaleString()}/${context.waterGoalMl.toLocaleString()} ml\n• Food logged: ${context.calories.toLocaleString()} kcal and ${context.protein} g protein\n• Weight: ${context.weightKg === null ? "not logged" : `${context.weightKg} kg`}\nThese reflect only records in this app, not a full health assessment. Keep logging consistently to make trends more useful.`;
      if (/\b(missed|skip|quit|motivat|discipline|can't do|cannot do)\b/.test(lower)) return `Remember your rule: never quit because you missed a day—continue the next day. Don't double the workout to compensate. Resume with the next planned session, scale the reps if needed, and build gradually. Progress comes from repeatable training, not punishment.`;
      return `I can help with workouts, exercise form, reflex and agility drills, substitutions for your home setup, muscle gain, meals, calories, protein, hydration, sleep, recovery and progress.\n\nYour current goal is “${fitnessGoal}”. Today's selected session is ${day.title} — ${day.focus}; you've logged ${context.calories} kcal, ${context.protein} g protein and ${context.waterMl} ml water so far.\n\nTry asking: “Show my workout today”, “How do I do rows correctly?”, “Suggest a low-cost muscle-gain meal”, or “Review my progress.”`;
    };
    try {
      const endpoint = import.meta.env.VITE_FITNESS_AI_ENDPOINT;
      if (endpoint) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 25000);
        try {
          const response = await fetch(endpoint, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "chat", prompt: `You are the personal coach inside Yours Fit. Answer the user's actual question directly, not with generic filler. Use the user's provided context and exact workout plan. If asked for a plan, give actionable steps, sets/reps or meal examples. If context is missing, ask a short follow-up rather than inventing facts. Be concise but helpful. Give safe, evidence-informed fitness guidance; no diagnoses, crash diets, dangerous training advice or unsupported certainty.

User question: ${q}
Context: ${JSON.stringify(context)}` }),
            signal: controller.signal
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || `AI service returned ${response.status}.`);
          if (typeof payload.text !== "string" || !payload.text.trim()) throw new Error("The AI service returned no answer.");
          setChat(old => [...old, { role: "coach", text: payload.text }]);
        } finally { window.clearTimeout(timeout); }
      } else {
        setChat(old => [...old, { role: "coach", text: offlineAnswer(q) }]);
      }
    } catch (error) {
      const message = error instanceof Error ? (error.name === "AbortError" ? "The AI request timed out." : error.message) : "Could not reach the AI service.";
      setCoachError(message);
      setChat(old => [...old, { role: "coach", text: `I couldn't reach the connected AI service (${message}), so here's my on-device guidance instead:\n\n${offlineAnswer(q)}\n\nFor live Gemini responses, check your configured server endpoint and its authentication settings.` }]);
    } finally { setCoachBusy(false); }
  };
  const weekly = useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;const item=dailyHistory[key];return {label:d.toLocaleDateString(undefined,{weekday:"short"}).slice(0,1),value:item?item.completion:0,key};}), [dailyHistory,exerciseCount]);

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">Y</div><div><strong>YOURS<span> FIT</span></strong><small>YOUR FITNESS SPACE</small></div></div><div className="nav-label">WORKSPACE</div><nav>{nav.map(item=><button key={item.name} className={`nav-item ${page===item.name?"active":""}`} onClick={()=>setPage(item.name)}><item.icon size={18}/><span>{item.name}</span>{page===item.name&&<span className="active-dot"/>}</button>)}</nav><div className="sidebar-bottom"><div className="status-pill"><span className="live-dot"/> Saved on this device</div><button className="nav-item logout" onClick={()=>{const data=Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith("sf-")||k.startsWith("yf-")).map(k=>[k,localStorage.getItem(k)]));const blob=new Blob([JSON.stringify({app:"Yours Fit",exportedAt:new Date().toISOString(),data},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="yours-fit-backup.json";a.click();URL.revokeObjectURL(url);setToast("Backup exported");}}><TrendingUp size={18}/> Export backup</button></div></aside>
    <main className="main"><header className="topbar"><div className="mobile-brand">YOURS<span> FIT</span></div><div className="top-date"><CalendarDays size={15}/>{date}</div><button className="avatar" onClick={()=>setPage("Settings")} aria-label="Open profile settings">{displayName.slice(0,1).toUpperCase()}</button></header>
      {availableUpdate && !updateDismissed && <section className="update-banner" role="status" aria-live="polite"><div className="update-banner-icon"><Activity size={19}/></div><div className="update-banner-copy"><strong>Yours Fit {availableUpdate.version} is ready</strong><p>A newer version is available. Download the APK and approve installation when Android prompts you.</p></div><button className="primary" onClick={()=>void downloadUpdate()}>Update app <ChevronRight size={15}/></button><button className="update-dismiss" aria-label="Dismiss update notification" onClick={()=>setUpdateDismissed(true)}><X size={17}/></button></section>}
      {page==="Overview"&&<><section className="welcome"><div><p className="eyebrow">YOUR DAILY CHECK-IN</p><h1>Welcome back, <span>{displayName}.</span></h1><p className="muted">Small actions. Stronger habits. Real progress.</p></div><div className="date-chip"><span className="live-dot"/> {date}</div></section>
      <section className="hero-card"><div className="hero-copy"><div className="tag"><Flame size={13}/> TODAY'S FOCUS</div><h2>{workoutPlan[new Date().getDay()===0?6:new Date().getDay()-1].focus}</h2><p>{workoutPlan[new Date().getDay()===0?6:new Date().getDay()-1].quote}</p><button className="primary" onClick={()=>{setActiveDay(new Date().getDay()===0?6:new Date().getDay()-1);setPage("Workouts")}}>Start workout <ChevronRight size={17}/></button></div><div className="hero-orbit"><div className="orbit-ring"><Dumbbell size={42}/></div><span className="orbit-label">MOVE WITH PURPOSE</span></div></section>
      <div className="section-heading"><div><h2>Today's overview</h2><p className="muted">A clear picture of your effort so far.</p></div><button className="text-button" onClick={()=>setPage("Progress")}>View reports <ChevronRight size={15}/></button></div>
      <section className="metrics-grid"><Metric icon={Droplets} label="Water intake" value={`${(totalWater/1000).toFixed(2)} L`} detail={`of ${(goal/1000).toFixed(1)} L goal`} progress={pct} onClick={()=>setPage("Hydration")}/><Metric icon={Flame} label="Calories logged" value={calories.toLocaleString()} detail="kcal recorded today" onClick={()=>setPage("Nutrition")}/><Metric icon={Target} label="Protein logged" value={`${protein} g`} detail="from confirmed meals" onClick={()=>setPage("Nutrition")}/><Metric icon={TrendingUp} label="Last body weight" value={weight===null?"—":`${weight} kg`} detail={weight===null?"Add your first entry":heightCm?`BMI estimate ${(weight/((heightCm/100)**2)).toFixed(1)}`:"Most recent record"} onClick={()=>setPage("Progress")}/></section>
      <section className="content-grid"><div className="panel"><div className="panel-head"><div><h3>Today's workout</h3><p className="muted">Day {activeDay+1} · {workoutPlan[activeDay].title}</p></div><button className="icon-button" onClick={()=>setPage("Workouts")}><ChevronRight size={18}/></button></div><div className="workout-preview">{workoutPlan[activeDay].exercises.slice(0,3).map((ex,i)=><div className="exercise-row" key={ex.name}><div className="exercise-icon"><Dumbbell size={16}/></div><div className="exercise-main"><strong>{ex.name}</strong><small>{ex.muscle}</small></div><span className="exercise-meta">{ex.sets} × {ex.reps}</span></div>)}</div><button className="secondary full" onClick={()=>setPage("Workouts")}>Open workout <ChevronRight size={16}/></button></div>
      <div className="panel"><div className="panel-head"><div><h3>Hydration</h3><p className="muted">One sip at a time.</p></div><Droplets className="red-icon" size={20}/></div><div className="water-summary"><div className="progress-ring" style={{background:`conic-gradient(var(--red) ${pct*3.6}deg, #f0f0f2 0deg)`}}><div><strong>{pct}%</strong><small>complete</small></div></div><div><strong className="big-number">{totalWater.toLocaleString()} <small>ml</small></strong><p className="muted">{Math.max(0,goal-totalWater).toLocaleString()} ml to goal</p><button className="secondary" onClick={()=>addWater(250)}><Plus size={15}/> Add 250 ml</button></div></div></div></section>
      <section className="panel meals-panel"><div className="panel-head"><div><h3>Meal ideas</h3><p className="muted">Suggestions, not a record of what you've eaten.</p></div><button className="text-button" onClick={()=>setPage("Nutrition")}>Nutrition <ChevronRight size={15}/></button></div><div className="food-grid">{foodIdeas.slice(0,3).map(f=><div className="food-card" key={f.name}><div className="food-symbol"><Apple size={18}/></div><div><small>{f.time}</small><strong>{f.name}</strong><p>{f.calories} est. kcal · {f.protein} g protein</p></div><button title="Log as eaten" onClick={()=>addMeal(f.name,f.calories,f.protein,f.time)} className="add-round"><Plus size={16}/></button></div>)}</div></section></>}

      {page==="Workouts"&&<><PageTitle eyebrow="TRAINING" title="Workouts" desc="Your weekly training structure. Log each set as you go."/><div className="day-tabs">{workoutPlan.map((d,i)=><button key={d.title} className={activeDay===i?"selected":""} onClick={()=>setActiveDay(i)}>{d.title.slice(0,3)}</button>)}</div><section className="panel workout-detail"><div className="panel-head"><div><p className="eyebrow">{`DAY ${activeDay+1} / 7`}</p><h2>{workoutPlan[activeDay].focus}</h2><p className="muted">{workoutPlan[activeDay].quote}</p></div><div className="completion-badge">{doneCount}/{exerciseCount} sets</div></div>{workoutPlan[activeDay].exercises.map((ex,i)=><div className="exercise-detail" key={ex.name}><div className="exercise-icon"><Dumbbell size={17}/></div><div className="exercise-main"><strong>{ex.name}</strong><small>{ex.muscle} · {ex.reps}</small><div className="set-checks">{Array.from({length:ex.sets},(_,s)=>{const k=`${activeDay}-${i}-${s}`;return <button key={k} className={`set-check ${done[k]?"checked":""}`} onClick={()=>setDone(old=>({...old,[k]:!old[k]}))}>{done[k]?<Check size={13}/>:s+1}</button>})}</div></div><span className="exercise-meta">{ex.sets} sets</span></div>)}<div className="workout-footer"><span className="muted">Check off each completed set. Progress saves on this device.</span><button className="primary" onClick={()=>setToast("Session progress saved on this device.")}>Finish session <Check size={16}/></button></div></section><p className="notice"><CircleHelp size={16}/> Your six-day plan is loaded here, with Sunday reserved for recovery. Tap each numbered circle to track completed sets.</p></>}

      {page==="Hydration"&&<><PageTitle eyebrow="DAILY HABIT" title="Hydration" desc="Track what you drink. Set a goal that suits your needs."/><section className="panel hydration-panel"><div className="water-large"><div className="progress-ring large" style={{background:`conic-gradient(var(--red) ${pct*3.6}deg, #f0f0f2 0deg)`}}><div><strong>{(totalWater/1000).toFixed(2)}<small> L</small></strong><small>{pct}% of daily goal</small></div></div><div><p className="eyebrow">DAILY TARGET</p><h2>{goal.toLocaleString()} ml</h2><p className="muted">{Math.max(0,goal-totalWater).toLocaleString()} ml remaining</p><label className="inline-label">Goal (ml)<input type="number" min="250" step="250" value={goal} onChange={e=>setGoal(Math.max(250,Number(e.target.value)||250))}/></label></div></div><div className="panel-head"><h3>Quick add</h3><button className="secondary" onClick={requestNotifications}><Bell size={15}/> Enable reminders</button></div><p className="muted reminder-note">Notifications: {notificationPermission}. Reminders work while this app is open; browser permission is required.</p><div className="quick-water">{[150,250,350,500].map(n=><button className="water-option" key={n} onClick={()=>addWater(n)}><Plus size={16}/><strong>{n} ml</strong></button>)}</div><div className="custom-add"><input type="number" min="1" value={waterCustom} onChange={e=>setWaterCustom(e.target.value)} aria-label="Custom water amount"/><span>ml</span><button className="primary" onClick={()=>addWater(Number(waterCustom))}>Add water</button><button className="secondary" onClick={()=>setWater(old=>old.slice(0,-1))} disabled={!water.length}>Undo last</button></div></section><section className="panel"><div className="panel-head"><h3>Today's timeline</h3><span className="muted">{water.length} entries</span></div>{water.length?water.slice().reverse().map(e=><div className="timeline-row" key={e.id}><div className="timeline-icon"><Droplets size={16}/></div><span>{e.time}</span><strong>+{e.amount} ml</strong></div>):<Empty title="No water logged yet" text="Add your first drink above to start today's timeline."/>}</section></>}

      {page==="Nutrition"&&<><PageTitle eyebrow="FOOD & FUEL" title="Nutrition" desc="Log meals you actually ate. Keep suggestions separate from your food record."/><section className="metrics-grid two"><Metric icon={Flame} label="Calories logged" value={calories.toLocaleString()} detail={`of ${calorieGoal.toLocaleString()} kcal goal`} progress={Math.min(100,Math.round(calories/Math.max(1,calorieGoal)*100))}/><Metric icon={Target} label="Protein logged" value={`${protein} g`} detail={`of ${proteinGoal} g goal`} progress={Math.min(100,Math.round(protein/Math.max(1,proteinGoal)*100))}/></section><section className="panel"><h3>Log a meal</h3><form className="meal-form" onSubmit={e=>{e.preventDefault();addMeal(newMeal,Number(newCalories),Number(newProtein));}}><label>Food / meal<input value={newMeal} onChange={e=>setNewMeal(e.target.value)} placeholder="e.g. Rice and dal" required/></label><label>Calories<input type="number" min="0" value={newCalories} onChange={e=>setNewCalories(e.target.value)}/></label><label>Protein (g)<input type="number" min="0" value={newProtein} onChange={e=>setNewProtein(e.target.value)}/></label><button className="primary"><Plus size={16}/> Log meal</button></form></section><section className="panel"><div className="panel-head"><h3>Confirmed food log</h3><span className="muted">{meals.length} entries</span></div>{meals.length?meals.slice().reverse().map(m=><div className="meal-log-row" key={m.id}><div className="food-symbol"><Utensils size={17}/></div><div className="exercise-main"><strong>{m.name}</strong><small>{m.time}</small></div><div className="meal-numbers"><strong>{m.calories} kcal</strong><small>{m.protein} g protein</small></div><button className="icon-button" onClick={()=>setMeals(old=>old.filter(x=>x.id!==m.id))}><X size={16}/></button></div>):<Empty title="Your food log is empty" text="Log a meal when you've actually eaten it."/>}</section><section className="panel"><h3>Affordable meal ideas</h3><p className="muted">Illustrative estimates only. Actual nutrition varies by portion and preparation.</p><div className="food-grid">{foodIdeas.map(f=><div className="food-card" key={f.name}><div className="food-symbol"><Apple size={18}/></div><div><small>{f.time}</small><strong>{f.name}</strong><p>{f.calories} est. kcal · {f.protein} g protein</p><p>{f.note}</p></div><button className="add-round" onClick={()=>addMeal(f.name,f.calories,f.protein,f.time)} title="Confirm eaten and log"><Plus size={16}/></button></div>)}</div></section></>}

      {page==="AI Coach"&&<><PageTitle eyebrow="PERSONAL COACH" title="AI Coach" desc="Ask specific questions about your plan, form, food, hydration, reflexes or progress. Answers use your selected workout and logged data."/><section className="coach-banner"><div className="coach-symbol"><Sparkles size={24}/></div><div><h3>{import.meta.env.VITE_FITNESS_AI_ENDPOINT ? "Connected coach mode" : "Built-in coach · Offline mode"}</h3><p>{import.meta.env.VITE_FITNESS_AI_ENDPOINT ? "Your configured secure AI endpoint will be used for replies." : "Yours Fit gives contextual fitness guidance on this device. For generative Gemini replies, configure a secure server-side endpoint; never put the API key in frontend code."}</p></div></section><section className="panel chat-panel"><div className="panel-head"><h3>Ask your coach</h3><span className="status-pill"><span className={coachBusy?"busy-dot":"live-dot"}/>{coachBusy?"Thinking…":coachError?"Offline guidance available":import.meta.env.VITE_FITNESS_AI_ENDPOINT?"Connected":"Offline coach ready"}</span></div><div className="chat-messages">{!chat.length&&<Empty title="What would you like to improve?" text="Ask about your exact six-day plan, exercise technique, food, hydration, reflex training or recovery."/>}{chat.map((m,i)=><div className={`chat-bubble ${m.role==="you"?"mine":""}`} key={i}><small>{m.role==="you"?"YOU":"COACH"}</small><p>{m.text}</p></div>)}</div><form className="chat-input" onSubmit={e=>{e.preventDefault();sendQuestion();}}><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about today's plan…"/><button className="primary" aria-label="Send message" disabled={coachBusy || !question.trim()}>{coachBusy?<span className="spinner"/>:<MessageCircle size={17}/>}</button></form></section></>}

      {page==="Progress"&&<><PageTitle eyebrow="YOUR DATA, OVER TIME" title="Progress reports" desc="Metrics are based on entries recorded in this browser. More history means better insight."/><section className="metrics-grid"><Metric icon={Dumbbell} label="Today's set completion" value={`${Math.round(doneCount/Math.max(1,exerciseCount)*100)}%`} detail={`${doneCount} of ${exerciseCount} sets checked`}/><Metric icon={Flame} label="Calories recorded" value={calories.toLocaleString()} detail="today only"/><Metric icon={Droplets} label="Hydration goal" value={`${pct}%`} detail="today only"/><Metric icon={Weight} label="Current weight" value={weight===null?"—":`${weight} kg`} detail={heightCm?`BMI estimate ${(weight===null?0:weight/((heightCm/100)**2)).toFixed(1)}`:"latest saved entry"}/></section><section className="panel"><div className="panel-head"><div><h3>Weekly consistency</h3><p className="muted">Daily completion from records stored on this device. Missing days remain at zero.</p></div></div><div className="chart-bars">{weekly.map((d,i)=><div className="bar-col" key={d.key}><div className="bar-track"><div className={`bar-fill ${i===6?"today":""}`} style={{height:`${d.value}%`}}/></div><small>{d.label}</small></div>)}</div><p className="notice"><CircleHelp size={16}/> History begins when you use the app; older days are not invented. Local records stay in this browser unless you export a backup.</p></section><section className="panel"><h3>Record body weight</h3><p className="muted">Use comparable conditions and units when tracking trends.</p><form className="weight-form" onSubmit={e=>{e.preventDefault();setToast("Weight saved");}}><label>Weight (kg)<input type="number" min="1" max="500" step=".1" value={weight??""} placeholder="Enter current weight" onChange={e=>setWeight(e.target.value?Number(e.target.value):null)}/></label><button className="primary">Save entry</button></form></section></>}

      {page==="Recovery"&&<><PageTitle eyebrow="REST & READINESS" title="Recovery" desc="Recovery is training too. Track your habits without judgement."/><div className="metrics-grid two"><Metric icon={HeartPulse} label="Latest sleep" value={recoveryLogs.length?`${recoveryLogs[recoveryLogs.length-1].sleepHours} h`:"—"} detail={recoveryLogs.length?new Date(recoveryLogs[recoveryLogs.length-1].date).toLocaleDateString():"Log your first check-in"}/><Metric icon={Activity} label="Walking" value={recoveryLogs.length?`${recoveryLogs[recoveryLogs.length-1].walkingMinutes} min`:"—"} detail={recoveryLogs.length?"Latest recovery check-in":"Movement logged here"}/></div><RecoveryForm onSave={setToast} onRecord={item=>setRecoveryLogs(old=>[...old,item])}/>{recoveryLogs.length>0&&<section className="panel"><div className="panel-head"><h3>Recent recovery notes</h3><span className="muted">{recoveryLogs.length} saved</span></div>{recoveryLogs.slice(-5).reverse().map((r,i)=><div className="meal-log-row" key={`${r.date}-${i}`}><div className="food-symbol"><HeartPulse size={17}/></div><div className="exercise-main"><strong>{new Date(r.date).toLocaleDateString()}</strong><small>{r.sleepHours} h sleep · {r.walkingMinutes} min walking</small>{r.note&&<small>{r.note}</small>}</div></div>)}</section>}</>}

      {page==="Settings"&&<><PageTitle eyebrow="PREFERENCES" title="Settings" desc="Tune your tracking experience."/><section className="panel settings-panel"><div className="settings-row"><div><strong>Your profile</strong><p className="muted">Personalize your dashboard and fitness focus.</p></div><div className="reminder-settings"><label>Name<input aria-label="Display name" value={displayName} maxLength={32} onChange={e=>setDisplayName(e.target.value||"Athlete")}/></label><label>Goal<select value={fitnessGoal} onChange={e=>setFitnessGoal(e.target.value)}><option>Build strength</option><option>Build muscle</option><option>Improve endurance</option><option>Improve mobility</option><option>Maintain fitness</option><option>General health</option></select></label><label>Height (cm)<input type="number" min="80" max="250" value={heightCm??""} placeholder="Optional" onChange={e=>setHeightCm(e.target.value?Number(e.target.value):null)}/></label></div></div><div className="settings-row"><div><strong>Daily nutrition goals</strong><p className="muted">Flexible tracking targets, not medical prescriptions.</p></div><div className="reminder-settings"><label>Calories (kcal)<input type="number" min="500" max="10000" step="50" value={calorieGoal} onChange={e=>setCalorieGoal(Math.max(500,Number(e.target.value)||500))}/></label><label>Protein (g)<input type="number" min="1" max="500" value={proteinGoal} onChange={e=>setProteinGoal(Math.max(1,Number(e.target.value)||1))}/></label></div></div><div className="settings-row"><div><strong>Daily water goal</strong><p className="muted">Your preferred hydration target.</p></div><input className="setting-number" type="number" min="250" step="250" value={goal} onChange={e=>setGoal(Math.max(250,Number(e.target.value)||250))}/><span>ml</span></div><div className="settings-row"><div><strong>Local data</strong><p className="muted">Your entries are saved in this browser on this device.</p></div><span className="status-pill">On device</span></div><div className="settings-row"><div><strong>Workout & water reminders</strong><p className="muted">Allow browser notifications and choose your reminder timing.</p><p className="muted">Permission: {notificationPermission}</p></div><div className="reminder-settings"><button className={waterReminders?"toggle on":"toggle"} onClick={()=>setWaterReminders(v=>!v)} aria-pressed={waterReminders}>Water {waterReminders?"On":"Off"}</button><button className={workoutReminders?"toggle on":"toggle"} onClick={()=>setWorkoutReminders(v=>!v)} aria-pressed={workoutReminders}>Workout {workoutReminders?"On":"Off"}</button><label>Water every<select value={waterInterval} onChange={e=>setWaterInterval(Number(e.target.value))}><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option><option value={90}>90 min</option><option value={120}>2 hours</option></select></label><label>Workout time<input type="time" value={workoutReminderTime} onChange={e=>setWorkoutReminderTime(e.target.value)}/></label><button className="secondary" onClick={requestNotifications}><Bell size={15}/> Enable notifications</button></div></div><div className="settings-row"><div><strong>App updates</strong><p className="muted">Installed version: {APP_VERSION}. {updateStatus==="checking"?"Checking GitHub Releases…":updateStatus==="up-to-date"?"You're up to date.":updateStatus==="error"?"Last check failed; check your connection.":updateStatus==="unconfigured"?"This build has no GitHub repository configured.":availableUpdate?`Version ${availableUpdate.version} is available.`:"Check for a published APK release."}</p></div><button className="secondary" onClick={()=>void checkForUpdates()} disabled={updateStatus==="checking"}>{updateStatus==="checking"?"Checking…":"Check for updates"} <ChevronRight size={15}/></button></div><div className="settings-row"><div><strong>AI coach</strong><p className="muted">Offline guidance works now; generative AI needs a secure server-side endpoint.</p></div><button className="secondary" onClick={()=>setPage("AI Coach")}>Configure guide <ChevronRight size={15}/></button></div><div className="settings-row"><div><strong>Export or reset</strong><p className="muted">Export today's records or clear local demo data.</p></div><button className="secondary" onClick={()=>{const data=Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith("sf-")||k.startsWith("yf-")).map(k=>[k,localStorage.getItem(k)]));const blob=new Blob([JSON.stringify({app:"Yours Fit",exportedAt:new Date().toISOString(),data},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="yours-fit-backup.json";a.click();URL.revokeObjectURL(url);setToast("Backup exported");}}>Export backup</button><label className="secondary backup-import">Import backup<input type="file" accept="application/json,.json" hidden onChange={async e=>{const input=e.currentTarget;const file=input.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!parsed.data||typeof parsed.data!=="object")throw new Error("This file is not a Yours Fit full backup.");for(const [key,value] of Object.entries(parsed.data)){if((key.startsWith("sf-")||key.startsWith("yf-"))&&typeof value==="string")localStorage.setItem(key,value);}window.location.reload();}catch{setToast("Backup could not be imported. Choose a Yours Fit backup JSON file.");}input.value="";}}/></label></div><div className="settings-row"><div><strong>Clear local data</strong><p className="muted">This removes today's water, meal and set logs.</p></div><button className="danger-button" onClick={()=>{setWater([]);setMeals([]);setDone({});setToast("Today's logs cleared");}}>Clear today's logs</button></div></section><p className="notice"><CircleHelp size={16}/> Data is stored locally on this browser/device. This is not account-based cloud sync. Export backups regularly; cloud sync and secure multi-device accounts require backend setup.</p></>}
    </main>
    {toast&&<div className="toast"><Check size={16}/>{toast}<button onClick={()=>setToast("")}><X size={14}/></button></div>}
    <nav className="mobile-nav" aria-label="Main navigation">{nav.map(item=><button key={item.name} className={page===item.name?"active":""} onClick={()=>setPage(item.name)}><item.icon size={19}/><small>{item.name==="Overview"?"Home":item.name}</small></button>)}</nav>
  </div>;
}

function Metric({icon:Icon,label,value,detail,progress,onClick}:{icon:any;label:string;value:string;detail:string;progress?:number;onClick?:()=>void}){return <button className={`metric-card ${onClick?"clickable":""}`} onClick={onClick}><div className="metric-top"><span className="metric-icon"><Icon size={18}/></span>{progress!==undefined&&<span className="metric-progress">{progress}%</span>}</div><p>{label}</p><strong className="metric-value">{value}</strong><small>{detail}</small>{progress!==undefined&&<div className="mini-track"><div style={{width:`${progress}%`}}/></div>}</button>}
function PageTitle({eyebrow,title,desc}:{eyebrow:string;title:string;desc:string}){return <section className="page-title"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{desc}</p></section>}
function Empty({title,text}:{title:string;text:string}){return <div className="empty-state"><div className="empty-icon"><CircleHelp size={19}/></div><strong>{title}</strong><p>{text}</p></div>}
function RecoveryForm({onSave,onRecord}:{onSave:(s:string)=>void;onRecord:(item:RecoveryLog)=>void}){const [sleep,setSleep]=useState("8");const [note,setNote]=useState("");const [walk,setWalk]=useState("20");return <section className="panel"><h3>Daily recovery log</h3><form className="recovery-form" onSubmit={e=>{e.preventDefault();const item={date:new Date().toISOString(),sleepHours:Number(sleep),walkingMinutes:Number(walk),note};const old=JSON.parse(localStorage.getItem("sf-recovery")||"[]");localStorage.setItem("sf-recovery",JSON.stringify([...old,item]));onRecord(item);onSave("Recovery check-in saved");setNote("");}}><label>Sleep (hours)<input type="number" min="0" max="24" step=".25" value={sleep} onChange={e=>setSleep(e.target.value)}/></label><label>Walking (minutes)<input type="number" min="0" max="1440" value={walk} onChange={e=>setWalk(e.target.value)}/></label><label>How are you feeling?<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Energy, soreness, mobility…" rows={3}/></label><button className="primary">Save recovery log <Check size={16}/></button></form></section>}