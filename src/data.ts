export type Exercise = { name: string; sets: number; reps: string; muscle: string };
export type WorkoutDay = { title: string; focus: string; quote: string; exercises: Exercise[] };

// User-provided six-day workout split plus Sunday recovery, preserved as written.
export const workoutPlan: WorkoutDay[] = [
  { title: "Monday", focus: "Chest + Shoulders", quote: "Build the chest. Build the shoulders. Build yourself.", exercises: [
    { name: "Push-ups", sets: 4, reps: "8–15", muscle: "Chest / triceps" },
    { name: "Wide Push-ups", sets: 3, reps: "8–15", muscle: "Chest" },
    { name: "Pike Push-ups", sets: 3, reps: "6–12", muscle: "Shoulders" },
    { name: "Lateral Raises", sets: 4, reps: "12–20", muscle: "Side delts" },
    { name: "Diamond Push-ups", sets: 3, reps: "8–15", muscle: "Triceps / chest" },
    { name: "Mountain Climbers", sets: 3, reps: "20 / side", muscle: "Core / conditioning" }
  ]},
  { title: "Tuesday", focus: "Back + Arms", quote: "Pull stronger. Become stronger.", exercises: [
    { name: "One-arm DB Row", sets: 4, reps: "10–15 / side", muscle: "Back / lats" },
    { name: "DB Pullover", sets: 3, reps: "10–15", muscle: "Lats / chest" },
    { name: "Backpack Rows", sets: 3, reps: "10–15", muscle: "Upper back" },
    { name: "DB Curls", sets: 3, reps: "10–15", muscle: "Biceps" },
    { name: "Hammer Curls", sets: 3, reps: "10–15", muscle: "Biceps / forearms" },
    { name: "Reverse Curls", sets: 2, reps: "12–15", muscle: "Forearms" }
  ]},
  { title: "Wednesday", focus: "Legs + Abs", quote: "Strong legs, strong foundation.", exercises: [
    { name: "Squats", sets: 4, reps: "15–20", muscle: "Quads / glutes" },
    { name: "Bulgarian Split Squats", sets: 3, reps: "8–12 / leg", muscle: "Legs / glutes" },
    { name: "DB Romanian Deadlift", sets: 4, reps: "10–15", muscle: "Hamstrings / glutes" },
    { name: "Reverse Lunges", sets: 3, reps: "10 / leg", muscle: "Legs / balance" },
    { name: "Calf Raises", sets: 4, reps: "20–30", muscle: "Calves" },
    { name: "Leg Raises", sets: 3, reps: "10–15", muscle: "Abs" },
    { name: "Plank", sets: 3, reps: "45–60 sec", muscle: "Core" }
  ]},
  { title: "Thursday", focus: "Reflex + Athletic", quote: "Move fast. React faster. 🕷️", exercises: [
    { name: "Fast Feet", sets: 4, reps: "20 sec", muscle: "Foot speed" },
    { name: "Lateral Shuffles", sets: 4, reps: "20 sec", muscle: "Agility" },
    { name: "High Knees", sets: 3, reps: "20 sec", muscle: "Conditioning" },
    { name: "Mountain Climbers", sets: 3, reps: "20 / side", muscle: "Core / conditioning" },
    { name: "Bear Crawl", sets: 3, reps: "20–30 sec", muscle: "Full body coordination" },
    { name: "Squat Jumps", sets: 3, reps: "8", muscle: "Power" },
    { name: "Single-leg Balance", sets: 3, reps: "30 sec / leg", muscle: "Balance" },
    { name: "Reaction Drill", sets: 5, reps: "20–30 sec", muscle: "Reaction speed" }
  ]},
  { title: "Friday", focus: "Upper Body + V-Taper", quote: "Wide shoulders. Strong back. Lean waist.", exercises: [
    { name: "Push-ups", sets: 4, reps: "10–15", muscle: "Chest / triceps" },
    { name: "One-arm DB Rows", sets: 4, reps: "12–15 / side", muscle: "Back / lats" },
    { name: "Pike Push-ups", sets: 3, reps: "8–12", muscle: "Shoulders" },
    { name: "Lateral Raises", sets: 4, reps: "15–20", muscle: "Side delts" },
    { name: "DB Curls", sets: 3, reps: "12", muscle: "Biceps" },
    { name: "Hammer Curls", sets: 3, reps: "12", muscle: "Biceps / forearms" },
    { name: "Leg Raises", sets: 3, reps: "15", muscle: "Abs" }
  ]},
  { title: "Saturday", focus: "Full Body + Athletic · 3 Rounds + Reflex", quote: "Train like an athlete.", exercises: [
    { name: "Squats", sets: 3, reps: "15 · rounds", muscle: "Legs" },
    { name: "Push-ups", sets: 3, reps: "10 · rounds", muscle: "Chest / triceps" },
    { name: "One-arm DB Rows", sets: 3, reps: "10 / side · rounds", muscle: "Back" },
    { name: "Reverse Lunges", sets: 3, reps: "10 / leg · rounds", muscle: "Legs" },
    { name: "Mountain Climbers", sets: 3, reps: "20 / side · rounds", muscle: "Core / conditioning" },
    { name: "Bear Crawl", sets: 3, reps: "20 sec · rounds", muscle: "Coordination" },
    { name: "Plank", sets: 3, reps: "30–45 sec · rounds", muscle: "Core" },
    { name: "Fast Feet", sets: 3, reps: "20 sec · reflex finisher", muscle: "Foot speed" },
    { name: "Lateral Shuffles", sets: 3, reps: "20 sec · reflex finisher", muscle: "Agility" },
    { name: "Reaction Drill", sets: 3, reps: "20 sec · reflex finisher", muscle: "Reaction speed" }
  ]},
  { title: "Sunday", focus: "Recovery", quote: "Recovery is part of growth.", exercises: [
    { name: "Walking", sets: 1, reps: "20–30 min", muscle: "Active recovery" },
    { name: "Full-body stretching", sets: 1, reps: "Easy, pain-free", muscle: "Mobility" },
    { name: "Shoulder mobility", sets: 1, reps: "Gentle routine", muscle: "Shoulders" },
    { name: "Hip mobility", sets: 1, reps: "Gentle routine", muscle: "Hips" },
    { name: "Easy breathing", sets: 1, reps: "2–5 min", muscle: "Relaxation" }
  ]}
];

export const foodIdeas = [
  {name:"Oats with milk", time:"Breakfast", calories:350, protein:14, note:"Convenient energy to start the day."},
  {name:"Rice, dal and vegetables", time:"Lunch", calories:520, protein:18, note:"Affordable, balanced home meal."},
  {name:"Curd and peanuts", time:"Snack", calories:260, protein:10, note:"Easy snack; adjust portions to appetite."},
  {name:"Eggs with rice or roti", time:"Dinner", calories:430, protein:22, note:"A practical protein-containing meal."}
];
