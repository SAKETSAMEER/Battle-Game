// --- ADD THIS ENTIRE PRELOADER SECTION AT THE TOP OF SCRIPT.JS ---
function isMobileDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

function gatherAssetUrls() {
  const urls = new Set(); // Use a Set to avoid duplicate URLs

  // 1. Gather Player images
  playerImageSets.forEach(set => {
    urls.add(set.card);
    urls.add(set.battle);
  });

  // 2. Gather Opponent images, backgrounds, and GIFs
  for (const key in opponents) {
    const opponent = opponents[key];
    if (opponent.image) urls.add(opponent.image);
    if (opponent.image_damaged) urls.add(opponent.image_damaged);

    // Extract URL from CSS 'url(...)' string
    if (opponent.background) {
      const match = opponent.background.match(/url\(['"]?(.*?)['"]?\)/);
      if (match) urls.add(match[1]);
    }

    // Gather all card GIFs
    if (opponent.cards) {
      opponent.cards.forEach(card => {
        if (card.gif) urls.add(card.gif);
        if (card.stunEffectGif) urls.add(card.stunEffectGif);
      });
    }
  }

  console.log(`Found ${urls.size} unique assets to preload.`);
  return Array.from(urls); // Convert Set to Array
}

function preloadAssets(onComplete) {
  const assetUrls = gatherAssetUrls();
  if (assetUrls.length === 0) {
    onComplete();
    return;
  }

  const loadingPanel = document.getElementById('loading-panel');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');

  loadingPanel.classList.remove('hidden');
  document.getElementById('intro-panel').classList.add('hidden');

  let loadedCount = 0;
  const totalAssets = assetUrls.length;

  assetUrls.forEach(url => {
    const img = new Image();
    img.src = url;

    const assetLoaded = () => {
      loadedCount++;
      const percent = Math.floor((loadedCount / totalAssets) * 100);
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${percent}%`;

      if (loadedCount === totalAssets) {
        // Wait a brief moment so the user can see 100%
        setTimeout(() => {
          loadingPanel.classList.add('hidden');
          onComplete(); // Run the callback function to start the game
        }, 500);
      }
    };

    img.onload = assetLoaded;
    img.onerror = () => {
      console.error(`Failed to load asset: ${url}`);
      assetLoaded(); // Still count it as "loaded" to not block the game
    };
  });
}

// --- END OF PRELOADER SECTION ---
// --- END OF PRELOADER SECTION ---

// ADD THIS NEW FUNCTION
function enterFullScreen() {
  const elem = document.documentElement; // This gets the entire HTML page
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem.msRequestFullscreen();
  }
}

// --- Global Game State Variables ---
// ... rest of your code

// --- Global Game State Variables ---
let playerName = "";
let statPoints = 0;
let statAllocationMode = false;
let selectedStory = null;
let currentStoryIndex = 0;
let playerCards = [];
let stats = { str: 0, end: 0, tech: 0, dur: 0, spd: 0, biq: 0 };
let claimedStatRewards = []; // Tracks claimed stat rewards by ID
let battle_sequence_player_state = { hp: null, maxHp: null, cards: null }; // For multi-battle persistence
let currentStoryNodeKey = null; // Tracks the current main story node
let currentStoryAction = null;  // Tracks the specific choice/action object
let currentStoryNode = null; // <<< --- ADD THIS LINE
let playerGold = 0; // ADD THIS LINE



// --- Player Image Mapping ---
const playerImageSets = [
  { card: 'cha/player/player-1.webp', battle: 'cha/player/battle-player/battle-1.webp' },
  { card: 'cha/player/player-2.webp', battle: 'cha/player/battle-player/battle-2.webp' },
  { card: 'cha/player/player-3.webp', battle: 'cha/player/battle-player/battle-3.webp' },
  { card: 'cha/player/player-4.webp', battle: 'cha/player/battle-player/battle-4.webp' },
  { card: 'cha/player/player-5.webp', battle: 'cha/player/battle-player/battle-5.webp' },
  { card: 'cha/player/player-6.webp', battle: 'cha/player/battle-player/battle-6.webp' },
  { card: 'cha/player/player-7.webp', battle: 'cha/player/battle-player/battle-7.webp' },
  { card: 'cha/player/player-8.webp', battle: 'cha/player/battle-player/battle-8.webp' },
  { card: 'cha/player/player-9.webp', battle: 'cha/player/battle-player/battle-9.webp' },
  { card: 'cha/player/player-10.webp', battle: 'cha/player/battle-player/battle-10.webp' },
  { card: 'cha/player/player-11.webp', battle: 'cha/player/battle-player/battle-11.webp' }
];

let rollCount = 0;
const maxRolls = 3;

// --- Opponent Definitions ---
const opponents = {

  L_Thug3: {
    name: "Local Bully1",
    image: "./cha/opponent/thug_1.webp",
    image_damaged: "./cha/opponent/thug_1.webp",
    stats: { str: 12, end: 7, tech: 16, dur: 7, spd: 8, biq: 10 },
    stunResistanceChance: 0.30,
    background: "url('cha/opponent/battle-bg/old-thug.webp')",
    cards: [
      { name: "Desperate Punch", type: "attack", damage: { min: 20, max: 25 }, cooldown: 2, gif: "cha/Blood_Effect.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Crecent Kick", type: "attack", damage: { min: 20, max: 25 }, cooldown: 2, gif: "cha/taekwondo-kick.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
    ]
  },
  L_Thug2: {
    name: "Local Bully2",
    image: "./cha/opponent/thug_2.webp",
    image_damaged: "./cha/opponent/thug_2_damaged.webp",
    stats: { str: 15, end: 10, tech: 12, dur: 20, spd: 10, biq: 10 },
    background: "url('cha/opponent/battle-bg/old-thug.webp')",
    stunResistanceChance: 0.35,
    cards: [
      { name: "STRONG Punch", type: "attack", damage: { min: 20, max: 55 }, cooldown: 2, gif: "cha/Blood_Effect.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Devil's Cry", type: "debuff", subType: "stat_reduction", statToDebuff: "spd", debuffValue: 0.6, debuffDuration: 5, cooldown: 5, usesLimit: 1, gif: "cha/intimate.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" }
    ]
  },
  L_Thug1: {
    name: "Local Bully3",
    image: "./cha/opponent/thug_3.webp",
    image_damaged: "./cha/opponent/thug_3_damage.webp",
    stats: { str: 22, end: 5, tech: 26, dur: 4, spd: 28, biq: 10 },
    background: "url('cha/opponent/battle-bg/old-thug.webp')",
    cards: [
      { name: "Breaker Style", type: "attack", damage: { min: 30, max: 45 }, cooldown: 2, gif: "cha/Blood_Effect.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Perseverance", type: "buff", subType: "heal", healPercent: 0.20, cooldown: 5, usesLimit: 1, gif: "cha/heal (1).gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav", glowEffect: { color: 'green' } }
    ]
  },

  // --- ADD THE FOLLOWING NEW OPPONENTS (RE-BALANCED) ---
  Jingu_Oh: {
    name: "Jingu Oh",
    image: "./cha/opponent/Jingu_Oh.webp",
    image_damaged: "./cha/opponent/Jingu_Oh_damaged.webp",
    stats: { str: 12, end: 7, tech: 16, dur: 7, spd: 8, biq: 10 },
    background: "url('cha/opponent/battle-bg/seok.webp')",
    cards: [
      { name: "Desperate Punch", type: "attack", damage: { min: 20, max: 25 }, cooldown: 2, gif: "cha/Blood_Effect.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Crecent Kick", type: "attack", damage: { min: 20, max: 25 }, cooldown: 2, gif: "cha/taekwondo-kick.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
    ]
  },
  Hakjin_Ju: {
    name: "Hakjin Ju",
    image: "./cha/opponent/Hakjin_Ju.webp",
    image_damaged: "./cha/opponent/Hakjin_Ju_damaged.webp",
    stats: { str: 8, end: 10, tech: 12, dur: 20, spd: 10, biq: 10 },
    background: "url('cha/opponent/battle-bg/seok.webp')",
    cards: [
      { name: "STRONG Punch", type: "attack", damage: { min: 20, max: 55 }, cooldown: 2, gif: "cha/Blood_Effect.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Devil's Cry", type: "debuff", subType: "stat_reduction", statToDebuff: "spd", debuffValue: 0.6, debuffDuration: 5, cooldown: 5, usesLimit: 1, gif: "cha/intimate.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" }
    ]
  },
  Don_gu_Wang: {
    name: "Don_gu Wang",
    image: "./cha/opponent/Don_gu_Wang.webp",
    image_damaged: "./cha/opponent/Don_gu_Wang.webp",
    stats: { str: 22, end: 5, tech: 26, dur: 4, spd: 28, biq: 10 },
    background: "url('cha/opponent/battle-bg/seok.webp')",
    cards: [
      { name: "Breaker Style", type: "attack", damage: { min: 30, max: 45 }, cooldown: 2, gif: "cha/Blood_Effect.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Perseverance", type: "buff", subType: "heal", healPercent: 0.20, cooldown: 5, usesLimit: 1, gif: "cha/heal (1).gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav", glowEffect: { color: 'green' } }
    ]
  },

  Daniel_MC: {
    name: "Daniel (MC)",
    image: "./cha/opponent/Daniel_.webp",
    image_damaged: "./cha/opponent/Daniel_damaged.webp",
    stats: { str: 30, end: 22, tech: 21, dur: 27, spd: 26, biq: 23 },
    background: "url('cha/opponent/battle-bg/daniel mc.webp')",
    stunResistanceChance: 0.60,
    cards: [
      {
        name: "Lightning Reflexes",
        type: "buff",
        subType: "temp_stat",
        desc: "Boosts speed to evade attacks more easily.",
        statToBuff: "spd",
        buffValue: 8,
        buffDuration: 4,
        cooldown: 5,
        usesLimit: 2,
        gif: "cha/temp speed.gif",
        glowEffect: { color: 'blue' }
      },
      {
        name: "Overturn",
        type: "overturn",       // This is a new, special type
        desc: "When the player uses a powerful attack, has a chance to negate it and reflect double the damage.",
        triggerDamage: 70,      // The minimum player card damage to trigger this
        chance: 0.90,           // 90% chance to activate
        cooldown: 5,
        usesLimit: 4,
        gif: "cha/cut slash.gif",
        gif_target: "player",
        sound: "cha/sound/sowrd.wav"
      },
      { name: "Perfected Systema", type: "attack", damage: { min: 50, max: 65 }, cooldown: 3, gif: "cha/S punch.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Unfeeling Assault", type: "attack", damage: { min: 70, max: 85 }, cooldown: 5, gif: "cha/big attack.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Bloodlust", type: "buff", subType: "multiplier", buffAmount: 1.5, cooldown: 5, usesLimit: 2, buffDuration: 3, glowEffect: { color: 'red' } },
      { name: "Empty Eyes", type: "debuff", subType: "stat_reduction", statsToDebuff: ["tech", "biq", "str", "spd"], debuffValue: 0.80, debuffDuration: 3, cooldown: 6, usesLimit: 2, gif: "cha/intimate.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" }
    ]
  },

  Jikwang_Hong: {
    name: "Jikwang Hong",
    image: "./cha/opponent/Jikwang_Hong.webp",
    image_damaged: "./cha/opponent/Jikwang_Hong_damaged.webp",
    stats: { str: 35, end: 20, tech: 32, dur: 23, spd: 32, biq: 35 },
    background: "url('cha/opponent/battle-bg/npc.webp')",
    stunResistanceChance: 0.50,
    cards: [
      { name: "Counter Punch", type: "attack", damage: { min: 40, max: 65 }, cooldown: 3, gif: "cha/red punch.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Pressure Point", type: "debuff", subType: "stat_reduction", statsToDebuff: ["dur", "spd", "tech", "biq"], debuffValue: 0.6, debuffDuration: 4, cooldown: 5, usesLimit: 1 },
      { name: "Iron Fist", type: "attack", damage: { min: 60, max: 105 }, cooldown: 3, gif: "cha/red punch.gif", gif_target: "player", sound: "cha/sound/punch.mp3" },
      { name: "Brawler's Endurance", type: "buff", subType: "damage_reduction", reductionAmount: 0.75, buffDuration: 3, cooldown: 6, usesLimit: 1, glowEffect: { color: 'brown' } }
    ]
  },

  Jeongdu_Ma: {
    name: "Jeongdu Ma",
    image: "./cha/opponent/jeongda_ma.webp",
    image_damaged: "./cha/opponent/jeongda_ma_damaged.webp",
    stats: { str: 28, end: 30, tech: 27, dur: 34, spd: 28, biq: 30 },
    background: "url('cha/opponent/battle-bg/jeongda.webp')",
    stunResistanceChance: 0.70,
    cards: [
      { name: "Titan's Swing", type: "attack", damage: { min: 90, max: 130 }, cooldown: 4, gif: "cha/Super throw.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      {
        name: "WAR CRY", type: "debuff", subType: "stun",
        stunTurns: 4, cooldown: 5, usesLimit: 3, gif: "cha/bind.gif", gif_target: "player", sound: "cha/sound/T-kick.wav", stunEffectGif: "cha/stun.gif"
      },
      { name: "UnderDog", type: "buff", subType: "multiplier", buffAmount: 1.4, cooldown: 5, usesLimit: 2, gif: "cha/thunder.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav" },
      { name: "Unbreakable Will", type: "buff", subType: "heal", healPercent: 0.20, cooldown: 6, usesLimit: 2, gif: "cha/buff.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav", glowEffect: { color: 'green' } },
      { name: "Executive's Authority", type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.6, debuffDuration: 4, cooldown: 5, usesLimit: 2 }
    ]
  },


  Seok_Kang: {
    name: "Seok Kang",
    image: "./cha/opponent/seok_kang.webp",
    image_damaged: "./cha/opponent/Seok_kang_damaged.webp",
    stats: { str: 30, end: 25, tech: 27, dur: 30, spd: 19, biq: 18 },
    background: "url('cha/opponent/battle-bg/seokFinal.webp')",
    stunResistanceChance: 0.65,
    cards: [
      { name: "Takedown", type: "attack", damage: { min: 80, max: 100 }, cooldown: 4, gif: "cha/Super throw.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      {
        name: "Last Cry", type: "debuff", subType: "stun",
        stunTurns: 4, cooldown: 5, usesLimit: 2, gif: "cha/bind.gif", gif_target: "player", sound: "cha/sound/T-kick.wav", stunEffectGif: "cha/stun.gif"
      },
      { name: "Berserk", type: "buff", subType: "multiplier", buffAmount: 1.4, cooldown: 5, usesLimit: 2, gif: "cha/thunder.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav" },
      { name: "Invincible Wrestler", type: "buff", subType: "heal", healPercent: 0.20, cooldown: 6, usesLimit: 1, gif: "cha/buff.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav", glowEffect: { color: 'green' } }
    ]
  },

  Suheyon_kim: {
    name: "Suhyeon Kim (Betrayed)",
    image: "./cha/opponent/Soohyun.webp",
    image_damaged: "./cha/opponent/soohyun_damaged.webp",
    stats: { str: 34, end: 35, tech: 35, dur: 40, spd: 30, biq: 30 },
    background: "url('cha/opponent/battle-bg/final.webp')",
    stunResistanceChance: 0.75,
    cards: [
      {
        name: "Heightened Senses",
        type: "buff",
        subType: "temp_stat",
        desc: "Boosts speed to evade attacks more easily.",
        statToBuff: "spd",
        buffValue: 12,
        buffDuration: 6,
        cooldown: 5,
        usesLimit: 3,
        gif: "cha/temp speed.gif",
        glowEffect: { color: 'blue' }
      },
      {
        name: "System Seal",
        type: "debuff",
        subType: "seal", // This is a new, custom subtype
        desc: "Seals the player's most valuable cards for 4 turns.",
        sealDuration: 6,
        cooldown: 8,
        usesLimit: 1,
        gif: "cha/void stun.gif",
        gif_target: "player",
        sound: "cha/sound/stun.wav" // Placeholder GIF
      },
      { name: "Second Life", type: "buff", subType: "heal", healPercent: 0.20, cooldown: 5, usesLimit: 2, gif: "cha/heal (1).gif", gif_target: "opponent", glowEffect: { color: 'green' } },

      { name: "Ascended Technique", type: "attack", damage: { min: 100, max: 120 }, cooldown: 3, gif: "cha/machine punch.gif", gif_target: "player" },
      { name: "System Overload", type: "buff", subType: "multiplier", buffAmount: 1.5, buffDuration: 4, cooldown: 6, usesLimit: 1, glowEffect: { color: 'blue' } },
      { name: "King's Pressure", type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech"], debuffValue: 0.65, debuffDuration: 3, cooldown: 6, usesLimit: 1, gif: "cha/intimate.gif", gif_target: "player" }
    ]
  },


  // Completed Choyun (Re-Balanced)
  Choyun: {
    name: "Choyun (Final Boss)",
    image: "./cha/opponent/choyun.webp",
    image_damaged: "./cha/opponent/choyun_damaged.webp",
    stats: { str: 35, end: 38, tech: 27, dur: 40, spd: 28, biq: 30 },
    background: "url('cha/opponent/battle-bg/final.webp')",
    stunResistanceChance: 0.75,
    cards: [
      {
        name: "Locked Off",
        type: "debuff",
        subType: "seal", // This is a new, custom subtype
        desc: "Seals the player's most valuable cards for 4 turns.",
        sealDuration: 6,
        cooldown: 8,
        usesLimit: 1,
        gif: "cha/void stun.gif",
        gif_target: "player",
        sound: "cha/sound/stun.wav" // Placeholder GIF
      },
      {
        name: "Absolute Counter",
        type: "overturn",       // This is a new, special type
        desc: "When the player uses a powerful attack, has a chance to negate it and reflect double the damage.",
        triggerDamage: 70,      // The minimum player card damage to trigger this
        chance: 0.90,           // 90% chance to activate
        cooldown: 5,
        usesLimit: 2,
        gif: "cha/cut slash.gif",
        gif_target: "player",
        sound: "cha/sound/sowrd.wav"
      },
      { name: "Elixir", type: "buff", subType: "heal", healPercent: 0.20, cooldown: 5, usesLimit: 2, gif: "cha/heal (1).gif", gif_target: "opponent", glowEffect: { color: 'green' } },
      { name: "Fa-Jin", type: "attack", damage: { min: 110, max: 130 }, cooldown: 3, gif: "cha/big attack.gif", gif_target: "player" },
      { name: "Limit Break", type: "buff", subType: "multiplier", buffAmount: 1.4, buffDuration: 3, cooldown: 5, usesLimit: 2 },
      { name: "Absolute Authority", type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 4, cooldown: 6, usesLimit: 1, gif: "cha/intimate.gif", gif_target: "player", sound: "cha/sound/aura.wav" }
    ]
  },


  NPC1: {
    name: "NPC_1",
    image: "./cha/opponent/npc1.webp",
    image_damaged: "./cha/opponent/npc1.webp",
    stats: { str: 12, end: 7, tech: 16, dur: 7, spd: 8, biq: 10 },
    background: "url('cha/opponent/battle-bg/npc.webp')",
    cards: [
      { name: "Desperate Punch", type: "attack", damage: { min: 20, max: 25 }, cooldown: 2, gif: "cha/Blood_Effect.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Crecent Kick", type: "attack", damage: { min: 20, max: 25 }, cooldown: 2, gif: "cha/taekwondo-kick.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
    ]
  },
  NPC2: {
    name: "NPC_2",
    image: "./cha/opponent/npc2.webp",
    image_damaged: "./cha/opponent/npc2.webp",
    stats: { str: 8, end: 10, tech: 12, dur: 20, spd: 10, biq: 10 },
    background: "url('cha/opponent/battle-bg/npc.webp')",
    cards: [
      { name: "STRONG Punch", type: "attack", damage: { min: 20, max: 55 }, cooldown: 2, gif: "cha/Blood_Effect.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Devil's Cry", type: "debuff", subType: "stat_reduction", statToDebuff: "spd", debuffValue: 0.6, debuffDuration: 5, cooldown: 5, usesLimit: 1, gif: "cha/intimate.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" }
    ]
  },
  NPC3: {
    name: "NPC_3",
    image: "./cha/opponent/npc3.webp",
    image_damaged: "./cha/opponent/npc3.webp",
    stats: { str: 22, end: 5, tech: 26, dur: 4, spd: 28, biq: 10 },
    background: "url('cha/opponent/battle-bg/npc.webp')",
    cards: [
      { name: "Breaker Style", type: "attack", damage: { min: 30, max: 45 }, cooldown: 2, gif: "cha/Blood_Effect.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Perseverance", type: "buff", subType: "heal", healPercent: 0.20, cooldown: 5, usesLimit: 1, gif: "cha/heal (1).gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav", glowEffect: { color: 'green' } }
    ]
  },
  daniel: {
    name: "Daniel_Park",
    image: "./cha/opponent/Daniel_.webp",
    image_damaged: "./cha/opponent/Daniel_damaged.webp",
    stats: { str: 22, end: 21, tech: 20, dur: 24, spd: 28, biq: 22 },
    background: "url('cha/opponent/battle-bg/danel-sechan.webp')",
    stunResistanceChance: 0.40,
    cards: [
      { name: "Systema Strike", type: "attack", damage: { min: 30, max: 50 }, cooldown: 4, gif: "cha/S punch.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Savate: Chassé", type: "attack", damage: { min: 20, max: 55 }, cooldown: 4, gif: "cha/cut.gif", gif_target: "player", sound: "cha/sound/sword cut.mp3" },
      { name: "Bloodlust", type: "buff", subType: "multiplier", buffAmount: 1.5, cooldown: 5, usesLimit: 2, buffDuration: 3 },
      { name: "Intimidate", type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.8, debuffDuration: 3, cooldown: 5, usesLimit: 2, gif: "cha/intimate.gif", gif_target: "player" }
    ]
  },
  Sechan_Kang: {
    name: "Sechan_Kang",
    image: "./cha/opponent/sechan.webp",
    image_damaged: "./cha/opponent/sechan_damage.webp",
    stats: { str: 25, end: 20, tech: 28, dur: 24, spd: 25, biq: 30 },
    background: "url('cha/opponent/battle-bg/danel-sechan.webp')",
    stunResistanceChance: 0.45,
    cards: [
      { name: "Counter Punch", type: "attack", damage: { min: 40, max: 65 }, cooldown: 3, gif: "cha/red punch.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Calm Mind", type: "buff", subType: "temp_stat", statToBuff: "spd", buffValue: 20, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/sumo throw.gif" },
      { name: "Pressure Point", type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.6, debuffDuration: 4, cooldown: 5, usesLimit: 1 },
      { name: "Iron Will", type: "buff", subType: "heal", healPercent: 0.20, cooldown: 5, usesLimit: 1, gif: "cha/heal (1).gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav", glowEffect: { color: 'green' } }

    ]
  },

  Uijin_Gyeong: {
    name: "Uijin Gyeong",
    image: "./cha/opponent/Ujjin.webp",
    image_damaged: "./cha/opponent/Ujjin_damaged.webp",
    stats: { str: 30, end: 28, tech: 30, dur: 30, spd: 30, biq: 30 },
    background: "url('cha/opponent/battle-bg/ujin.webp')",
    stunResistanceChance: 0.60,
    cards: [
      { name: "Dragon's Tail Sweep", type: "attack", damage: { min: 90, max: 130 }, cooldown: 4, gif: "cha/siver.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      {
        name: "Overturning Void",
        type: "overturn",       // This is a new, special type
        desc: "When the player uses a powerful attack, has a chance to negate it and reflect double the damage.",
        triggerDamage: 70,      // The minimum player card damage to trigger this
        chance: 0.90,           // 90% chance to activate
        cooldown: 5,
        usesLimit: 2,
        gif: "cha/cut slash.gif",
        gif_target: "player",
        sound: "cha/sound/sowrd.wav"
      },
      {
        name: "Phantom Step",
        type: "buff",
        subType: "temp_stat",
        desc: "Boosts speed to evade attacks more easily.",
        statToBuff: "spd",
        buffValue: 8,
        buffDuration: 5,
        cooldown: 5,
        usesLimit: 3,
        gif: "cha/temp speed.gif",
        glowEffect: { color: 'blue' }
      },
      { name: "UnderDog", type: "buff", subType: "multiplier", buffAmount: 1.4, cooldown: 5, usesLimit: 2, gif: "cha/thunder.gif", gif_target: "opponent", sound: "cha/sound/aura.wav" },
      { name: "Unbreakable Will", type: "buff", subType: "heal", healPercent: 0.20, cooldown: 6, usesLimit: 2, gif: "cha/buff.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav", glowEffect: { color: 'green' } },
      { name: "Executive's Authority", type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.6, debuffDuration: 4, cooldown: 5, usesLimit: 2, glowEffect: { color: 'brown' } }
    ]
  },
  old_thug: {
    name: "Local Thug",
    image: "./cha/opponent/Old_thug.webp",
    image_damaged: "./cha/opponent/old-thug-damage.webp",
    stats: { str: 12, end: 7, tech: 16, dur: 7, spd: 8, biq: 10 },
    background: "url('cha/opponent/battle-bg/old-thug.webp')",
    cards: [
      { name: "Desperate Swing", type: "attack", damage: { min: 20, max: 25 }, cooldown: 2, gif: "cha/Blood_Effect.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      {
        name: "Grapple Lock", type: "debuff", subType: "stun", desc: `A powerful lock the opponent in a grueling submission hold, immobilizing the opponent for 3 turn.`,
        stunTurns: 3, cooldown: 5, usesLimit: 2, gif: "cha/bind.gif", gif_target: "player", sound: "cha/sound/T-kick.wav", stunEffectGif: "cha/stun.gif" // ADD THIS NEW PROPERTY
      }
    ]
  },
  Hyeokjae_Bae: {
    name: "Hyeokjae_Bae",
    image: "cha/opponent/Hyeokjae_Bae.webp",
    image_damaged: "cha/opponent/Hyeokjae_Bae_damage.webp",
    stats: { str: 20, end: 14, tech: 6, dur: 13, spd: 18, biq: 8 },
    background: "url('cha/opponent/battle-bg/Hyeokjae_Bae.webp')",
    stunResistanceChance: 0.35,
    cards: [
      { name: "Sumo Throw", type: "attack", damage: { min: 30, max: 35 }, cooldown: 2, gif: "cha/sthrow.gif", gif_target: "player", sound: "cha/sound/sthrpw.mp3" },
      {
        name: "Grapple Lock", type: "debuff", subType: "stun", desc: `A powerful lock the opponent in a grueling submission hold, immobilizing the opponent for 3 turn.`,
        stunTurns: 3, cooldown: 5, usesLimit: 2, gif: "cha/bind.gif", gif_target: "player", sound: "cha/sound/T-kick.wav", stunEffectGif: "cha/stun.gif"
      },
      { name: "Brawler's Endurance", type: "buff", subType: "damage_reduction", reductionAmount: 0.90, buffDuration: 3, cooldown: 6, usesLimit: 1, glowEffect: { color: 'brown' } }

    ]
  },

  Jeong_u_Song: {
    name: "Jeong-u Song",
    image: "./cha/opponent/Jeong_u_Song.webp",
    image_damaged: "./cha/opponent/Jeong_u_Song_damaged.webp",
    stats: { str: 20, end: 9, tech: 6, dur: 11, spd: 24, biq: 15 },
    background: "url('cha/opponent/battle-bg/sung.webp')",
    stunResistanceChance: 0.40,
    cards: [
      { name: "Scissor Kick", type: "attack", damage: { min: 20, max: 30 }, cooldown: 3, gif: "cha/kick (2).gif", gif_target: "player", sound: "cha/sound/kick.wav" },
      {
        name: "Lightning Reflexes",
        type: "buff",
        subType: "temp_stat",
        desc: "Boosts speed to evade attacks more easily.",
        statToBuff: "spd",
        buffValue: 8,
        buffDuration: 4,
        cooldown: 5,
        usesLimit: 1,
        gif: "cha/temp speed.gif",
        glowEffect: { color: 'blue' }
      },
      { name: "Street Brawler's Rush", type: "attack", damage: { min: 25, max: 40 }, cooldown: 4, gif: "cha/normal punch.gif", gif_target: "player", sound: "cha/sound/h punch.mp3" }
    ]
  },
  Geon_Park: {
    name: "Geon_Park",
    image: "./cha/opponent/geon_park.webp",
    image_damaged: "./cha/opponent/geon_park.webp",
    stats: { str: 18, end: 14, tech: 16, dur: 14, spd: 17, biq: 15 },
    background: "url('cha/opponent/battle-bg/han jaeha.webp')",
    cards: [
      { name: "Quick Jab", type: "attack", damage: { min: 30, max: 35 }, cooldown: 3, gif: "cha/red.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Feinting Low Kick", type: "attack", damage: { min: 25, max: 30 }, cooldown: 3, gif: "cha/kick (2).gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Evasion", type: "buff", subType: "temp_stat", statToBuff: "spd", buffValue: 10, buffDuration: 4, cooldown: 6, usesLimit: 2, gif: "cha/temp speed.gif", gif_target: "opponent", glowEffect: { color: 'blue' } },

    ]
  },
  Dongtak_Seo: {
    name: "Dongtak_Seo",
    image: "./cha/opponent/Dongtak_Seo.webp",
    image_damaged: "./cha/opponent/Dongtak_Seo_damaged.webp",
    stats: { str: 28, end: 10, tech: 14, dur: 16, spd: 18, biq: 18 },
    background: "url('cha/opponent/battle-bg/han jaeha.webp')",
    cards: [
      { name: "Viper's Fang", type: "attack", damage: { min: 30, max: 43 }, cooldown: 4, gif: "cha/cut.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      {
        name: "Death Bind", type: "debuff", subType: "stun",
        stunTurns: 3, cooldown: 5, usesLimit: 2, gif: "cha/bind.gif", gif_target: "player", sound: "cha/sound/T-kick.wav", stunEffectGif: "cha/stun.gif"
      },
      { name: "Focus", type: "buff", subType: "temp_stat", statToBuff: "tech", buffValue: 10, buffDuration: 3, cooldown: 6, usesLimit: 2, gif: "cha/temp tech.gif", gif_target: "opponent", glowEffect: { color: 'purple' } },

    ]
  },
  Changung_Yeom: {
    name: "Changung_Yeom",
    image: "./cha/opponent/Changung_Yeom.webp",
    image_damaged: "./cha/opponent/Changung_Yeom_damaged.webp",
    stats: { str: 16, end: 14, tech: 18, dur: 15, spd: 19, biq: 18 },
    background: "url('cha/opponent/battle-bg/han jaeha.webp')",
    cards: [
      { name: "Skull Breaker", type: "attack", damage: { min: 30, max: 40 }, cooldown: 4, gif: "cha/void stun.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      {
        name: "Last Drop", type: "buff", subType: "heal", healPercent: 0.07, cooldown: 5, usesLimit: 1, gif: "cha/heal (1).gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav", glowEffect: { color: 'green' }
      },
      { name: "Tanker", type: "buff", subType: "damage_reduction", reductionAmount: 0.85, buffDuration: 4, cooldown: 6, usesLimit: 1, glowEffect: { color: 'brown' } }

    ]
  },
  Han_Jaeha: {
    name: "Han_Jaeha",
    image: "./cha/opponent/Han_jaeha.webp",
    image_damaged: "./cha/opponent/Han_jaeha_damage.webp",
    stats: { str: 18, end: 16, tech: 22, dur: 17, spd: 29, biq: 17 },
    background: "url('cha/opponent/battle-bg/han jaeha.webp')",
    stunResistanceChance: 0.55,
    cards: [
      { name: "Cunning Strike", type: "attack", damage: { min: 35, max: 45 }, cooldown: 4, gif: "cha/claw.gif", gif_target: "player", sound: "cha/sound/T-kick.wav" },
      { name: "Sharpen Claws", type: "buff", subType: "temp_stat", statToBuff: "tech", buffValue: 10, buffDuration: 3, cooldown: 6, usesLimit: 2, gif: "cha/temp tech.gif", gif_target: "opponent", glowEffect: { color: 'purple' } },
      {
        name: "Perseverance", type: "buff", subType: "heal", healPercent: 0.10, cooldown: 5, usesLimit: 1, gif: "cha/heal (1).gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav", glowEffect: { color: 'green' }
      }]
  }
};
// ... after the opponents object
// This is the closing brace of the opponents object

// PASTE THIS ENTIRE OBJECT
// In script.js, find the cardShopPool and add the 'rarity' property to each card

const cardShopPool = {
  uncommon: [
    { name: "First Aid", rarity: "uncommon", type: "buff", subType: "heal", staminaCost: 20, desc: `Heal for 13% of your max HP.<br>END +2`, effects: { end: 2 }, healPercent: 0.13, cooldown: 5, usesLimit: 2, gif: "cha/heal (1).gif", gif_target: "player", sound: "cha/sound/T-kick.wav", glowEffect: { color: 'green' } },
    { name: "Tackle", rarity: "uncommon", type: "attack", staminaCost: 15, desc: `Rush your opponent with your full body weight, slamming them.<br> SPD+1, BIQ +1`, effects: { spd: 1, biq: 1 }, damage: { min: 25, max: 45 }, cooldown: 4, gif: "cha/throw'.gif", gif_target: "opponents", sound: "cha/sound//throw.mp3" },
    { name: "Straight punch", type: "attack", rarity: "uncommon", staminaCost: 15, desc: `Throws a powerfull Straight punch to opponents, slamming them.<br> STR+1, TECH +1`, effects: { str: 1, tech: 1 }, damage: { min: 30, max: 35 }, cooldown: 4, gif: "cha/red.gif", gif_target: "opponents", sound: "cha/sound/T-kick.wav" },
    { name: " Back Kick", type: "attack", rarity: "uncommon", staminaCost: 15, desc: `Throws a powerfull Back kick to opponents.<br> STR+1, TECH +1`, effects: { str: 1, tech: 1 }, damage: { min: 35, max: 40 }, cooldown: 4, gif: "cha/red.gif", gif_target: "opponents", sound: "cha/sound/T-kick.wav" },
  ],
  rare: [
    { name: "Taekwondo - 180' Kick", rarity: "rare", type: "attack", staminaCost: 30, desc: `Grant user the ability to use Taekwondo - 180 Kick.<br>STR +2`, effects: { str: 2 }, damage: { min: 45, max: 55 }, cooldown: 3, gif: "cha/taekwondo-kick.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav" },
    { name: "WillPower", rarity: "rare", type: "buff", subType: "multiplier", staminaCost: 35, desc: `Increase damage by x1.2 for 4 turns.<br>DUR +2`, effects: { dur: 2 }, buffAmount: 1.20, buffDuration: 4, cooldown: 1, usesLimit: 3, gif: "cha/magic touch.gif", gif_target: "player", sound: "cha/sound/aura.wav" },
    { name: "Glare", rarity: "rare", type: "debuff", subType: "stun", staminaCost: 45, desc: `A fierce stare. that stuns the opponent for 3 turn.<br>SPD +1, BIQ +2`, effects: { str: 1, biq: 2 }, stunTurns: 3, cooldown: 5, usesLimit: 2, gif: "cha/stun2.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav", stunEffectGif: "cha/stun.gif" }
  ],
  epic: [
    { name: "Invincible wrestler", rarity: "epic", type: "buff", isSealable: true, subType: "damage_reduction", staminaCost: 50, desc: "For 10 turns, all damage is reduced by 20%.", effects: { dur: 3 }, buffDuration: 10, reductionAmount: 0.80, cooldown: 6, usesLimit: 1, glowEffect: { color: 'green' } },
    { name: "PowerUP", rarity: "epic", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 45, desc: `Temporarily boosts STR by 20 for 4 turns.<br>SPD +2`, effects: { spd: 2 }, statToBuff: "str", buffValue: 20, buffDuration: 4, cooldown: 4, usesLimit: 2, glowEffect: { color: 'red' } },
    // ADD THIS NEW CARD OBJECT AT THE END OF THE EPIC LIST
    {
      name: "Copy Technique",
      rarity: "epic",
      type: "buff",
      subType: "copy_attack",
      isSealable: true, // This is our new, custom subtype
      staminaCost: 40,
      desc: "Observe the opponent's technique and copy one of their attack cards for the rest of this battle.",
      cooldown: 8,
      usesLimit: 1,
      gif: "cha/eye-copy1.gif",
      gif_target: "opponent", // Using a placeholder GIF
      sound: "cha/sound/aura.wav"
    }
  ],
  legendary: [
    { name: "Animal Instinct", rarity: "legendary", type: "buff", isSealable: true, subType: "multiplier", staminaCost: 60, desc: `Your killer instinct awakens. Increase damage by x1.6.`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, glowEffect: { color: 'black' }, gif: "cha/intimate.gif", gif_target: "opponent", sound: "cha/sound/aura.wav" },
    // ADD THIS NEW CARD OBJECT
    {
      name: "Ultimate Heart Punch",
      rarity: "legendary",
      type: "attack",
      isSealable: true,
      staminaCost: 90,
      desc: "A devastating strike aimed at the opponent's core. Deals massive damage and has a small chance to stop their heart instantly.",
      damage: { min: 260, max: 270 },
      cooldown: 10,
      usesLimit: 2,
      gif: "cha/machine punch.gif",
      gif_target: "opponent",
      sound: "cha/sound/s punch.wav",
      secondaryEffect: {
        type: "one_shot",        // Our new custom effect type
        chance: 0.05,            // 5% chance
        ko_gif: "cha/ko1.gif",
        dead_image_src: "cha/dead (1).webp" // <-- ADD THIS LINE
        // Make sure you have a GIF with this name and path
      }
    },
    { name: "Incomplete Heart Punch", rarity: "legendary", type: "attack", isSealable: true, staminaCost: 75, desc: `A forbidden technique that delivers a precise, vibrating palm strike to the opponent's chest. The shockwave travels through their body, causing their heart to seize for a few terrifying seconds.`, damage: { min: 250, max: 270 }, cooldown: 8, usesLimit: 2, gif: "cha/machine punch.gif", gif_target: "opponent", sound: "cha/sound/s punch.wav", secondaryEffect: { type: "debuff", subType: "stun", stunTurns: 3 } },
    { name: "Invisible Attack", rarity: "legendary", type: "attack", isSealable: true, staminaCost: 70, desc: `A attack move at a speed that breaks perception, striking the opponent from multiple directions at the same instant`, damage: { min: 270, max: 290 }, cooldown: 8, usesLimit: 2, gif: "cha/machine punch.gif", gif_target: "opponent", sound: "cha/sound/s punch.wav", secondaryEffect: { type: "bleed" } }
  ]
};
// The statRewardTiers object starts below this

// --- Stat Reward Definitions ---
const statRewardTiers = [
  {
    id: "str20", stat: "str", threshold: 32, claimed: false, card: {
      name: "Ultimate Fist", type: "attack", isSealable: true, staminaCost: 100, desc: `The pinnacle of Strength. You unleash a powerful attack. Ultimate FIst that completely overwhelms the opponent`,
      damage: { min: 320, max: 350 }, cooldown: 7, usesLimit: 1, gif: "cha/vac ppunch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
      secondaryEffect: {
        type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "cha/stun.gif"
      },
    }
  },
  { id: "spd20", stat: "spd", threshold: 32, claimed: false, card: { name: "Quick Step", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 50, desc: "Temporarily boosts SPD by 30 for 5 turns.<br>SPD +1", effects: { spd: 1 }, statToBuff: "spd", buffValue: 30, buffDuration: 5, cooldown: 4, usesLimit: 2, gif: "cha/temp speed.gif", gif_target: "player", glowEffect: { color: 'blue' } } },
  { id: "tech20", stat: "tech", threshold: 32, claimed: false, card: { name: "Feint", type: "debuff", subType: "stat_reduction", isSealable: true, staminaCost: 65, desc: "Lowers opponent's Stats by 40% for 5 turns.<br>TECH +1", effects: { tech: 1 }, statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.60, debuffDuration: 5, usesLimit: 3, gif: "cha/auraa.gif", gif_target: "opponent", glowEffect: { color: 'yellow' } } },
  {
    id: "dur30", stat: "dur", threshold: 32, claimed: false, card: {
      name: "Iron Fortress", type: "buff", // This card will appear in your "Buff Cards" list.
      subType: "damage_reduction", // Our new, custom subtype.
      isSealable: true,
      staminaCost: 70,
      desc: "For the next 10 turns, all damage taken from the opponent is reduced by 50%.",
      effects: { dur: 1 }, // Optional: also gives a permanent stat boost.
      buffDuration: 10, // The number of turns the effect will last.
      reductionAmount: 0.5, // The multiplier for the damage (0.8 means 20% damage).
      cooldown: 6,
      usesLimit: 1,
      gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
      gif_target: "player",
      sound: "cha/sound/aura.wav",
      glowEffect: { color: 'green' },
    }
  },
  { id: "end30", stat: "end", threshold: 32, claimed: false, card: { name: "Endless Stamina", type: "buff", subType: "heal", isSealable: true, staminaCost: 50, desc: "Heal for 50% of max HP.<br>END +2", effects: { end: 1 }, healPercent: 0.50, cooldown: 6, usesLimit: 1, gif: "/cha/heal (1).gif", gif_target: "player", sound: "cha/sound/T-kick.wav", glowEffect: { color: 'green' } } },
  { id: "biq30", stat: "biq", threshold: 32, claimed: false, card: { name: "Predictive Eye", type: "debuff", subType: "stun", isSealable: true, staminaCost: 120, desc: "Stuns the opponent for 8 turn.<br>BIQ +2", effects: { biq: 2 }, stunTurns: 8, cooldown: 10, usesLimit: 2, gif: "cha/void stun.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav" } },
];


// --- Story Data ---
const storyNodes = {
  earlyGameSequence: {

    substory: [`"You’ve proven yourself," <br>he says. "Get some rest. Or do what you need to do"`, `<br>.You feel the soreness in your arms, but your mind is restless.you keep thinking how tough was the last fight<br> You thinking of what to do next....`],
    game_title: "Choose the way to get Stronger",
    game_desc: " ",
    actions: [{
      label: `<strong>TRAINING</strong><br>{ still in development}<br><small class="button-sub-text">*ALL STATS INCREASE BY 1</small>`,
      train: true,
      gold: 50,
      next: {
        substory: ["You feel your body getting stronger."],
        effects: { str: 1, end: 1, tech: 1, dur: 1, spd: 1, biq: 1 },
        next_story: {
          substory: [`Told you to not choose, you bitch`]
        }
      }
    },
    {
      label: `Search for experience`,
      next: {
        substory: [`You went around looking for fight outside of North gangbuk high,<br> you have beaten some and gaining some experience.`, ` By the time you looked around, <br>you were in the East Gangbuk territory without realizing you were srrounded by the East gangbuk gang<br> As you were little scared but ready to fight...<br>`,
          ` Everyone surrounding me become silent and one guy- blond hair and tanned skin, came forward and<br> asked "Are you the one who went around picking fights?"<br> you said "yes im so what you wanna taste my fist..."<br>  Blond guy laughed "haha no no im good, but i need your help in some of my work wanna help??" `
          , `<br><br>You said "I’m with North Gangbuk. And I don’t even know you."<br> Blond guy said "ah i forgot to mention im Han Jaeha, leader of East gangbuk "<br>" And i know about you, so dont worry it just like part-time,`, `"And Dont worry if you ever needs help in South Territory in future just call me Ill help you"<br>"So what do you think, wanna work??" `],
        game_title: "What will you do?",
        game_desc: "East Gangbuk leader Han Jaeha give you offer to work with him...",
        actions: [{
          label: `Accept Han Jaeha's offer`,
          next: {
            substory: [`You saw System notification,<br> system giving you quest regarding Han Jaeha offer <br> without the second thought you accepted the mission <br><strong>Han Jaeha looks around casually, then steps in a little closer</strong><br>his voice dropping <br>“Here’s the deal. In my territory, I need someone who can fight and drive."<br>" Most of my guys are either too weak or too reckless.”`,
              `<strong>He lights a cigarette, exhales slowly</strong><br>"Last time we tried moving goods, some punks from another district jumped my crew"<br>"Took everything."<br>"Now they’re using my stuff for their own illegal business. And the cops? They're sniffing around more than usual."`
              , `You frown <br>“So what exactly do you want me to do?” <br>Jaeha taps ash onto the pavement, then meets your eyes.<br>"Simple. Recover the goods. Deliver them back to me. That’s it."<br>He pauses.<br>"But you’ll need to move fast. Stay sharp. If those thieves don’t catch you, the cops might."`],
            race: true,
            win: {
              gold: 30,
              substory: [`<strong><span style="color: #89cfff">[MISSION SUCCESS]</span></strong><br>"You have completed your mission gaining Han Jaeha trust"`],
              game_title: "MISSION SUCCESS",
              game_desc: "You have gained the East Gangbuk leader's trust, choose your rewards",
              cards: [{
                name: "Stats point reward", type: "stat_boost", desc: `Get the 7 stats point as rewards `,
                effects: { statPoints: 7 },
              }, {
                name: "Strength card", type: "stat_boost", desc: `You get sudden leap in Strength<br>STR +8`,
                effects: { str: 8 },
              }, {
                name: "Endurance card", type: "stat_boost", desc: `You get sudden leap in Endurance<br>END +8`,
                effects: { end: 8 },
              }, {
                name: "Technique card", type: "stat_boost", desc: `You get sudden leap in Technique<br>TECH +8`,
                effects: { tech: 8 },
              }],
              next_story: {
                substory: [`<strong>After the successful delivery</strong>, you figured you'd be done—but Han Jaeha had other plans.<br>Later that night, you get a message:<br>"Come by. We're celebrating. You earned it." — Jaeha<br><br>`
                  , `<strong>Later that Night</strong><br><br> You head back to the East Gangbuk HQ—a rundown rooftop above a half-abandoned shopping center. But tonight? It’s alive. Music blares from dented speakers, smoke curls into the night air, and neon lights flicker across faces filled with energy and chaos.<br><br>The crew’s going all out.<br>Food, drinks, shouting matches over street fights—it’s like the tension of gang life melted for a night<br>You get pulled into it.You laugh, dance, even sing a little with the others. For a moment, you're not North or East—you’re just you.`,
                  `<strong>Then Han Jaeha approaches</strong><br>He’s leaning back against a folding chair, drink in hand, smirking<br><br>"Honestly, I thought you’d screw up that delivery. Most people do."<br>"But you? You handled it better than most of my own guys."<br>He stands and stretches, then looks you dead in the eye.<br>"So now I’m curious."<br><br>"How strong are you, really?"<br>You shrug, a grin tugging at your lip.“Wanna find out?”`,
                  `<strong><br>Jaeha laughs.</strong><br>"Exactly. Let’s make it fun. You fight my top guys. You win, everyone will respect you the same as top guy in South Gangbuk"`,
                  `<br>He gestures to a small ring chalked onto the concrete. Some of the guys start clearing space. Others start chanting.<br>The mood shifts.<br>`],
                game_title: `Challenge Unlocked: East Gangbuk Trial Match`,
                game_desc: `Opponents~`,
                actions: [{
                  label: `<Strong>Han Jaeha</Strong><br>*LEADER*`,
                  next: {
                    battle: 'Han_Jaeha',
                    win: {
                      gold: { min: 20, max: 50 },
                      substory: [`You've defeated Han Jaeha, impressing everyone.`],
                      cards: [{
                        name: "Adrenaline Rush", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Strength Stats by 20 for 4 turns.<br>SPD +2`,
                        effects: { spd: 2, statPoints: 2 }, statToBuff: "str", buffValue: 20, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
                      }, {
                        name: "Maximum Capacity Punch", type: "attack", staminaCost: 55, desc: `You are ablle to use Maximum Capacity Punch, heavy blow that unbalanced the opponents. but cannot be use more than twice <br>DUR +1, STR +1`,
                        effects: { dur: 1, str: 1, statPoints: 2 }, damage: { min: 180, max: 240 }, cooldown: 2, usesLimit: 2, gif: "cha/big attack.gif", gif_target: "opponent", sound: "cha/sound/throw.mp3",
                        secondaryEffect: {
                          type: "debuff", subType: "stat_reduction", statToDebuff: "spd", debuffValue: 0.9, debuffDuration: 2 // Reduces speed by 30% debuffDuration: 2
                        }
                      }, {
                        name: "Twin Fang Strike", type: "attack", staminaCost: 45, desc: `A swift, two-handed claw attack . A brutal strike that stun the opponents.<br>TECH +1, STR +1`,
                        effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 100, max: 150 }, cooldown: 6, gif: "cha/bite.gif", gif_target: "opponent", sound: "cha/sound/sword cut.mp3",
                        secondaryEffect: {
                          type: "debuff", subType: "stun", stunTurns: 2, debuffDuration: 2, stunEffectGif: "/cha/stun.gif"  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }, {
                        name: "Stone Skin", type: "buff", // This card will appear in your "Buff Cards" list.
                        subType: "damage_reduction", // Our new, custom subtype.
                        isSealable: true,
                        staminaCost: 40,
                        desc: "For the next 10 turns, all damage taken from the opponent is reduced by 30%.",
                        effects: { dur: 3, statPoints: 2 }, // Optional: also gives a permanent stat boost.
                        buffDuration: 10, // The number of turns the effect will last.
                        reductionAmount: 0.7, // The multiplier for the damage (0.8 means 20% damage).
                        cooldown: 6,
                        usesLimit: 1,
                        gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                        gif_target: "player",
                        sound: "cha/sound/aura.wav",
                        glowEffect: { color: 'green' }
                      }, {
                        name: "Chain Of Indoctrination ", type: "debuff", subType: "stun", isSealable: true, staminaCost: 65, desc: `Bind the target for 4 Turns with whole stats reduction by 15% <br>TECH +2, STR +1`,
                        stunTurns: 4, cooldown: 5, usesLimit: 2, gif: "cha/stun3.gif", gif_target: "opponent", sound: "cha/sound/stun.wav",
                        effects: { tech: 2, str: 1, statPoints: 2 },
                        secondaryEffect: {
                          type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.85, debuffDuration: 6  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }],
                      ////////////////
                      next_story: {
                        storyNodeRef: 'startGameSequence'
                      }
                    },
                    lose: {
                      gold: { min: 20, max: 50 },
                      substory: [`You've lost against Han Jaeha, but impressing everyone.`],
                      cards: [{
                        name: "Adrenaline Rush", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Strength Stats by 20 for 4 turns.<br>SPD +2`,
                        effects: { spd: 2, statPoints: 2 }, statToBuff: "str", buffValue: 20, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
                      }, {
                        name: "Overlord Punch", type: "attack", isSealable: true, staminaCost: 50, desc: `You are ablle to use heavy Punch, heavy blow that unbalanced the opponents. but cannot be use more than twice <br>DUR +1, STR +1`,
                        effects: { dur: 1, str: 1, statPoints: 2 }, damage: { min: 170, max: 240 }, cooldown: 2, usesLimit: 2, gif: "cha/Super throw.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                        secondaryEffect: {
                          type: "debuff", subType: "stun", stunTurns: 2, debuffDuration: 2, stunEffectGif: "/cha/stun.gif"  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }, {
                        name: "Raging Talons", type: "attack", staminaCost: 35, desc: `A swift, two-handed claw attack . A brutal strike that stun the opponents.<br>TECH +1, STR +1`,
                        effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 90, max: 145 }, cooldown: 6, gif: "cha/claw3.gif", gif_target: "opponent", sound: "cha/sound/sowrd.wav",
                        secondaryEffect: {
                          type: "bleed"
                        }
                      }, {
                        name: "Rock Skin", type: "buff", // This card will appear in your "Buff Cards" list.
                        subType: "damage_reduction", // Our new, custom subtype.
                        isSealable: true,
                        staminaCost: 35,
                        desc: "For the next 10 turns, all damage taken from the opponent is reduced by 25%.",
                        effects: { dur: 3, statPoints: 2 }, // Optional: also gives a permanent stat boost.
                        buffDuration: 10, // The number of turns the effect will last.
                        reductionAmount: 0.75, // The multiplier for the damage (0.8 means 20% damage).
                        cooldown: 6,
                        usesLimit: 1,
                        gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                        gif_target: "player",
                        glowEffect: { color: 'green' }
                      }, {
                        name: "Chain Of Indoctrination ", type: "debuff", subType: "stun", isSealable: true, staminaCost: 65, desc: `Bind the target for 4 Turns with whole stats reduction by 15% <br>TECH +2, STR +1`,
                        stunTurns: 4, cooldown: 5, usesLimit: 2, gif: "cha/stun3.gif", gif_target: "opponent", sound: "cha/sound/stun.wav",
                        effects: { tech: 2, str: 1, statPoints: 2 },
                        secondaryEffect: {
                          type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.85, debuffDuration: 6  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }],
                      next_story: {
                        storyNodeRef: 'startGameSequence'
                      }
                    }
                  }
                },
                {
                  label: `<strong>Changung Yeom</strong><br>No. 2 ×`,
                  next: {
                    battle: 'Changung_Yeom',
                    win: {
                      gold: { min: 20, max: 40 },
                      substory: [`You defeated Changung_Yeom, impressing Everyone.`],
                      cards: [{
                        name: "Adrenaline Rush", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Strength Stats by 20 for 4 turns.<br>SPD +2`,
                        effects: { spd: 2, statPoints: 2 }, statToBuff: "str", buffValue: 20, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
                      }, {
                        name: "Mach Punch", type: "attack", staminaCost: 55, desc: `You are ablle to use mach Punch, heavy blow that unbalanced the opponents. but cannot be use more than twice <br>DUR +1, STR +1`,
                        effects: { dur: 1, str: 1, statPoints: 2 }, damage: { min: 150, max: 220 }, cooldown: 2, usesLimit: 2, gif: "cha/big attack.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                        secondaryEffect: {
                          type: "debuff", subType: "stun", stunTurns: 2, debuffDuration: 2, stunEffectGif: "/cha/stun.gif"  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }, {
                        name: "Swift Claw", type: "attack", staminaCost: 35, desc: `A swift, two-handed claw attack . A brutal strike that stun the opponents.<br>TECH +1, STR +1`,
                        effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 90, max: 135 }, cooldown: 6, gif: "cha/claw1.gif", gif_target: "opponent", sound: "cha/sound/claw2.mp3",
                        secondaryEffect: {
                          type: "bleed"
                        }
                      }, {
                        name: "Rock Skin", type: "buff", // This card will appear in your "Buff Cards" list.
                        subType: "damage_reduction", // Our new, custom subtype.
                        isSealable: true,
                        staminaCost: 35,
                        desc: "For the next 10 turns, all damage taken from the opponent is reduced by 25%.",
                        effects: { dur: 3, statPoints: 2 }, // Optional: also gives a permanent stat boost.
                        buffDuration: 10, // The number of turns the effect will last.
                        reductionAmount: 0.75, // The multiplier for the damage (0.8 means 20% damage).
                        cooldown: 6,
                        usesLimit: 1,
                        gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                        gif_target: "player",
                        glowEffect: { color: 'green' }
                      }, {
                        name: "Chain Of Indoctrination ", type: "debuff", subType: "stun", isSealable: true, staminaCost: 65, desc: `Bind the target for 4 Turns with whole stats reduction by 15% <br>TECH +2, STR +1`,
                        stunTurns: 4, cooldown: 5, usesLimit: 2, gif: "cha/stun3.gif", gif_target: "opponent", sound: "cha/sound/stun.wav",
                        effects: { tech: 2, str: 1, statPoints: 2 },
                        secondaryEffect: {
                          type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.85, debuffDuration: 6  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }],
                      next_story: {
                        storyNodeRef: 'startGameSequence'
                      }
                    }
                  }
                },
                {
                  label: `<strong>Dongtak Seo</strong><br>No. 4 ×`,
                  next: {
                    battle: 'Dongtak_Seo',
                    win: {
                      gold: { min: 20, max: 40 },
                      substory: [`You defeated Dongtak_Seo, impressing Everyone.`],
                      cards: [{
                        name: "Adrenaline Rush", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Strength Stats by 20 for 4 turns.<br>SPD +2`,
                        effects: { spd: 2, statPoints: 2 }, statToBuff: "str", buffValue: 20, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
                      }, {
                        name: "Mach Punch", type: "attack", staminaCost: 55, desc: `You are ablle to use mach Punch, heavy blow that unbalanced the opponents. but cannot be use more than twice <br>DUR +1, STR +1`,
                        effects: { dur: 1, str: 1, statPoints: 2 }, damage: { min: 150, max: 220 }, cooldown: 2, usesLimit: 2, gif: "cha/big attack.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                        secondaryEffect: {
                          type: "debuff", subType: "stun", stunTurns: 2, debuffDuration: 2, stunEffectGif: "/cha/stun.gif"  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }, {
                        name: "Swift Claw", type: "attack", staminaCost: 35, desc: `A swift, two-handed claw attack . A brutal strike that stun the opponents.<br>TECH +1, STR +1`,
                        effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 90, max: 135 }, cooldown: 6, gif: "cha/claw1.gif", gif_target: "opponent", sound: "cha/sound/claw2.mp3",
                        secondaryEffect: {
                          type: "bleed"
                        }
                      }, {
                        name: "Rock Skin", type: "buff", // This card will appear in your "Buff Cards" list.
                        subType: "damage_reduction", // Our new, custom subtype.
                        isSealable: true,
                        staminaCost: 35,
                        desc: "For the next 10 turns, all damage taken from the opponent is reduced by 25%.",
                        effects: { dur: 3, statPoints: 2 }, // Optional: also gives a permanent stat boost.
                        buffDuration: 10, // The number of turns the effect will last.
                        reductionAmount: 0.75, // The multiplier for the damage (0.8 means 20% damage).
                        cooldown: 6,
                        usesLimit: 1,
                        gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                        gif_target: "player",
                        glowEffect: { color: 'green' }
                      }, {
                        name: "Chain Of Indoctrination ", type: "debuff", subType: "stun", isSealable: true, staminaCost: 65, desc: `Bind the target for 4 Turns with whole stats reduction by 15% <br>TECH +2, STR +1`,
                        stunTurns: 4, cooldown: 5, usesLimit: 2, gif: "cha/stun3.gif", gif_target: "opponent", sound: "cha/sound/stun.wav",
                        effects: { tech: 2, str: 1, statPoints: 2 },
                        secondaryEffect: {
                          type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.85, debuffDuration: 6  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }],
                      next_story: {
                        storyNodeRef: 'startGameSequence'
                      }
                    }
                  }
                },
                {
                  label: `<strong>Geon Park</strong><br>No. 5`,
                  next: {
                    battle: 'Geon_Park',
                    win: {
                      gold: { min: 20, max: 40 },
                      substory: [`You defeated Hyeokjae Bae, impressing Choyun.`],
                      cards: [{
                        name: "Adrenaline Rush", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Strength Stats by 20 for 4 turns.<br>SPD +2`,
                        effects: { spd: 2, statPoints: 2 }, statToBuff: "str", buffValue: 20, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
                      }, {
                        name: "Mach Punch", type: "attack", staminaCost: 55, desc: `You are ablle to use mach Punch, heavy blow that unbalanced the opponents. but cannot be use more than twice <br>DUR +1, STR +1`,
                        effects: { dur: 1, str: 1, statPoints: 2 }, damage: { min: 150, max: 220 }, cooldown: 2, usesLimit: 2, gif: "cha/big attack.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                        secondaryEffect: {
                          type: "debuff", subType: "stun", stunTurns: 2, debuffDuration: 2, stunEffectGif: "/cha/stun.gif"  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }, {
                        name: "Swift Claw", type: "attack", staminaCost: 35, desc: `A swift, two-handed claw attack . A brutal strike that stun the opponents.<br>TECH +1, STR +1`,
                        effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 90, max: 135 }, cooldown: 6, gif: "cha/claw1.gif", gif_target: "opponent", sound: "cha/sound/claw2.mp3",
                        secondaryEffect: {
                          type: "bleed"
                        }
                      }, {
                        name: "Rock Skin", type: "buff", // This card will appear in your "Buff Cards" list.
                        subType: "damage_reduction", // Our new, custom subtype.
                        isSealable: true,
                        staminaCost: 35,
                        desc: "For the next 10 turns, all damage taken from the opponent is reduced by 25%.",
                        effects: { dur: 3, statPoints: 2 }, // Optional: also gives a permanent stat boost.
                        buffDuration: 10, // The number of turns the effect will last.
                        reductionAmount: 0.75, // The multiplier for the damage (0.8 means 20% damage).
                        cooldown: 6,
                        usesLimit: 1,
                        gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                        gif_target: "player",
                        glowEffect: { color: 'green' }
                      }, {
                        name: "Chain Of Indoctrination ", type: "debuff", subType: "stun", isSealable: true, staminaCost: 65, desc: `Bind the target for 4 Turns with whole stats reduction by 15% <br>TECH +2, STR +1`,
                        stunTurns: 4, cooldown: 5, usesLimit: 2, gif: "cha/stun3.gif", gif_target: "opponent", sound: "cha/sound/stun.wav",
                        effects: { tech: 2, str: 1, statPoints: 2 },
                        secondaryEffect: {
                          type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.85, debuffDuration: 6  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }],
                      next_story: {
                        storyNodeRef: 'startGameSequence'
                      }
                    }
                  }
                }]
              }
            }
          }
        }, {
          label: `Refuse`,
          next: {

            substory: [`You saw System notification,<br> system giving you quest regarding Han Jaeha offer <br> without the second thought you accepted the mission <br><strong>Han Jaeha looks around casually, then steps in a little closer</strong><br>his voice dropping <br>“Here’s the deal. In my territory, I need someone who can fight and drive."<br>" Most of my guys are either too weak or too reckless.”`,
              `<strong>He lights a cigarette, exhales slowly</strong><br>"Last time we tried moving goods, some punks from another district jumped my crew"<br>"Took everything."<br>"Now they’re using my stuff for their own illegal business. And the cops? They're sniffing around more than usual."`
              , `You frown <br>“So what exactly do you want me to do?” <br>Jaeha taps ash onto the pavement, then meets your eyes.<br>"Simple. Recover the goods. Deliver them back to me. That’s it."<br>He pauses.<br>"But you’ll need to move fast. Stay sharp. If those thieves don’t catch you, the cops might."`],
            race: true,
            win: {
              gold: 30,
              substory: [`<strong><span style="color: #89cfff">[MISSION SUCCESS]</span></strong><br>"You have completed your mission gaining Han Jaeha trust"`],
              game_title: "MISSION SUCCESS",
              game_desc: "You have gained the East Gangbuk leader's trust, choose your rewards",
              cards: [{
                name: "Stats point reward", type: "stat_boost", desc: `Get the 7 stats point as rewards `,
                effects: { statPoints: 7 },
              }, {
                name: "Strength card", type: "stat_boost", desc: `You get sudden leap in Strength<br>STR +8`,
                effects: { str: 8 },
              }, {
                name: "Endurance card", type: "stat_boost", desc: `You get sudden leap in Endurance<br>END +8`,
                effects: { end: 8 },
              }, {
                name: "Technique card", type: "stat_boost", desc: `You get sudden leap in Technique<br>TECH +8`,
                effects: { tech: 8 },
              }],
              next_story: {
                substory: [`<strong>After the successful delivery</strong>, you figured you'd be done—but Han Jaeha had other plans.<br>Later that night, you get a message:<br>"Come by. We're celebrating. You earned it." — Jaeha<br><br>`
                  , `<strong>Later that Night</strong><br><br> You head back to the East Gangbuk HQ—a rundown rooftop above a half-abandoned shopping center. But tonight? It’s alive. Music blares from dented speakers, smoke curls into the night air, and neon lights flicker across faces filled with energy and chaos.<br><br>The crew’s going all out.<br>Food, drinks, shouting matches over street fights—it’s like the tension of gang life melted for a night<br>You get pulled into it.You laugh, dance, even sing a little with the others. For a moment, you're not North or East—you’re just you.`,
                  `<strong>Then Han Jaeha approaches</strong><br>He’s leaning back against a folding chair, drink in hand, smirking<br><br>"Honestly, I thought you’d screw up that delivery. Most people do."<br>"But you? You handled it better than most of my own guys."<br>He stands and stretches, then looks you dead in the eye.<br>"So now I’m curious."<br><br>"How strong are you, really?"<br>You shrug, a grin tugging at your lip.“Wanna find out?”`,
                  `<strong><br>Jaeha laughs.</strong><br>"Exactly. Let’s make it fun. You fight my top guys. You win, everyone will respect you the same as top guy in South Gangbuk"`,
                  `<br>He gestures to a small ring chalked onto the concrete. Some of the guys start clearing space. Others start chanting.<br>The mood shifts.<br>`],
                game_title: `Challenge Unlocked: East Gangbuk Trial Match`,
                game_desc: `Opponents~`,
                actions: [{
                  label: `<Strong>Han Jaeha</Strong><br>*LEADER*`,
                  next: {
                    battle: 'Han_Jaeha',
                    win: {
                      gold: { min: 20, max: 50 },
                      substory: [`You've defeated Han Jaeha, impressing everyone.`],
                      game_title: "You've defeated Han Jaeha",
                      game_desc: "choose your rewards",
                      cards: [{
                        name: "Adrenaline Rush", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Strength Stats by 20 for 4 turns.<br>SPD +2`,
                        effects: { spd: 2, statPoints: 2 }, statToBuff: "str", buffValue: 20, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
                      }, {
                        name: "Maximum Capacity Punch", type: "attack", staminaCost: 55, desc: `You are ablle to use Maximum Capacity Punch, heavy blow that unbalanced the opponents. but cannot be use more than twice <br>DUR +1, STR +1`,
                        effects: { dur: 1, str: 1, statPoints: 2 }, damage: { min: 180, max: 240 }, cooldown: 2, usesLimit: 2, gif: "cha/big attack.gif", gif_target: "opponent", sound: "cha/sound/throw.mp3",
                        secondaryEffect: {
                          type: "debuff", subType: "stat_reduction", statToDebuff: "spd", debuffValue: 0.9, debuffDuration: 2 // Reduces speed by 30% debuffDuration: 2
                        }
                      }, {
                        name: "Twin Fang Strike", type: "attack", staminaCost: 45, desc: `A swift, two-handed claw attack . A brutal strike that stun the opponents.<br>TECH +1, STR +1`,
                        effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 100, max: 150 }, cooldown: 6, gif: "cha/bite.gif", gif_target: "opponent", sound: "cha/sound/sword cut.mp3",
                        secondaryEffect: {
                          type: "debuff", subType: "stun", stunTurns: 2, debuffDuration: 2, stunEffectGif: "/cha/stun.gif"  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }, {
                        name: "Stone Skin", type: "buff", // This card will appear in your "Buff Cards" list.
                        subType: "damage_reduction", // Our new, custom subtype.
                        isSealable: true,
                        staminaCost: 40,
                        desc: "For the next 10 turns, all damage taken from the opponent is reduced by 30%.",
                        effects: { dur: 3, statPoints: 2 }, // Optional: also gives a permanent stat boost.
                        buffDuration: 10, // The number of turns the effect will last.
                        reductionAmount: 0.7, // The multiplier for the damage (0.8 means 20% damage).
                        cooldown: 6,
                        usesLimit: 1,
                        gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                        gif_target: "player",
                        sound: "cha/sound/aura.wav",
                        glowEffect: { color: 'green' }
                      }, {
                        name: "Chain Of Indoctrination ", type: "debuff", subType: "stun", isSealable: true, staminaCost: 65, desc: `Bind the target for 4 Turns with whole stats reduction by 15% <br>TECH +2, STR +1`,
                        stunTurns: 4, cooldown: 5, usesLimit: 2, gif: "cha/stun3.gif", gif_target: "opponent", sound: "cha/sound/stun.wav",
                        effects: { tech: 2, str: 1, statPoints: 2 },
                        secondaryEffect: {
                          type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.85, debuffDuration: 6  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }],
                      ////////////////
                      next_story: {
                        storyNodeRef: 'startGameSequence'
                      }
                    },
                    lose: {

                      gold: { min: 20, max: 50 },
                      substory: [`You've lost against Han Jaeha, but impressing everyone.`],
                      game_title: "You've fought against Han Jaeha bravely",
                      game_desc: "choose your rewards",
                      cards: [{
                        name: "Adrenaline Rush", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Strength Stats by 20 for 4 turns.<br>SPD +2`,
                        effects: { spd: 2, statPoints: 2 }, statToBuff: "str", buffValue: 20, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
                      }, {
                        name: "Overlord Punch", type: "attack", isSealable: true, staminaCost: 50, desc: `You are ablle to use heavy Punch, heavy blow that unbalanced the opponents. but cannot be use more than twice <br>DUR +1, STR +1`,
                        effects: { dur: 1, str: 1, statPoints: 2 }, damage: { min: 170, max: 240 }, cooldown: 2, usesLimit: 2, gif: "cha/Super throw.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                        secondaryEffect: {
                          type: "debuff", subType: "stun", stunTurns: 2, debuffDuration: 2, stunEffectGif: "/cha/stun.gif"  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }, {
                        name: "Raging Talons", type: "attack", staminaCost: 35, desc: `A swift, two-handed claw attack . A brutal strike that stun the opponents.<br>TECH +1, STR +1`,
                        effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 90, max: 145 }, cooldown: 6, gif: "cha/claw3.gif", gif_target: "opponent", sound: "cha/sound/sowrd.wav",
                        secondaryEffect: {
                          type: "bleed"
                        }
                      }, {
                        name: "Rock Skin", type: "buff", // This card will appear in your "Buff Cards" list.
                        subType: "damage_reduction", // Our new, custom subtype.
                        isSealable: true,
                        staminaCost: 35,
                        desc: "For the next 10 turns, all damage taken from the opponent is reduced by 25%.",
                        effects: { dur: 3, statPoints: 2 }, // Optional: also gives a permanent stat boost.
                        buffDuration: 10, // The number of turns the effect will last.
                        reductionAmount: 0.75, // The multiplier for the damage (0.8 means 20% damage).
                        cooldown: 6,
                        usesLimit: 1,
                        gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                        gif_target: "player",
                        glowEffect: { color: 'green' }
                      }, {
                        name: "Chain Of Indoctrination ", type: "debuff", subType: "stun", isSealable: true, staminaCost: 65, desc: `Bind the target for 4 Turns with whole stats reduction by 15% <br>TECH +2, STR +1`,
                        stunTurns: 4, cooldown: 5, usesLimit: 2, gif: "cha/stun3.gif", gif_target: "opponent", sound: "cha/sound/stun.wav",
                        effects: { tech: 2, str: 1, statPoints: 2 },
                        secondaryEffect: {
                          type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.85, debuffDuration: 6  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }],
                      next_story: {
                        storyNodeRef: 'startGameSequence'
                      }
                    }
                  }
                },
                {
                  label: `<strong>Changung Yeom</strong><br>No. 2 ×`,
                  next: {
                    battle: 'Changung_Yeom',
                    win: {
                      gold: { min: 20, max: 40 },
                      substory: [`You defeated Changung_Yeom, impressing Everyone.`],
                      game_title: "You've defeated Changung_Yeom",
                      game_desc: "choose your rewards",
                      cards: [{
                        name: "Adrenaline Rush", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Strength Stats by 20 for 4 turns.<br>SPD +2`,
                        effects: { spd: 2, statPoints: 2 }, statToBuff: "str", buffValue: 20, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
                      }, {
                        name: "Mach Punch", type: "attack", staminaCost: 55, desc: `You are ablle to use mach Punch, heavy blow that unbalanced the opponents. but cannot be use more than twice <br>DUR +1, STR +1`,
                        effects: { dur: 1, str: 1, statPoints: 2 }, damage: { min: 150, max: 220 }, cooldown: 2, usesLimit: 2, gif: "cha/big attack.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                        secondaryEffect: {
                          type: "debuff", subType: "stun", stunTurns: 2, debuffDuration: 2, stunEffectGif: "/cha/stun.gif"  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }, {
                        name: "Swift Claw", type: "attack", staminaCost: 35, desc: `A swift, two-handed claw attack . A brutal strike that stun the opponents.<br>TECH +1, STR +1`,
                        effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 90, max: 135 }, cooldown: 6, gif: "cha/claw1.gif", gif_target: "opponent", sound: "cha/sound/claw2.mp3",
                        secondaryEffect: {
                          type: "bleed"
                        }
                      }, {
                        name: "Rock Skin", type: "buff", // This card will appear in your "Buff Cards" list.
                        subType: "damage_reduction", // Our new, custom subtype.
                        isSealable: true,
                        staminaCost: 35,
                        desc: "For the next 10 turns, all damage taken from the opponent is reduced by 25%.",
                        effects: { dur: 3, statPoints: 2 }, // Optional: also gives a permanent stat boost.
                        buffDuration: 10, // The number of turns the effect will last.
                        reductionAmount: 0.75, // The multiplier for the damage (0.8 means 20% damage).
                        cooldown: 6,
                        usesLimit: 1,
                        gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                        gif_target: "player",
                        glowEffect: { color: 'green' }
                      }, {
                        name: "Chain Of Indoctrination ", type: "debuff", subType: "stun", isSealable: true, staminaCost: 65, desc: `Bind the target for 4 Turns with whole stats reduction by 15% <br>TECH +2, STR +1`,
                        stunTurns: 4, cooldown: 5, usesLimit: 2, gif: "cha/stun3.gif", gif_target: "opponent", sound: "cha/sound/stun.wav",
                        effects: { tech: 2, str: 1, statPoints: 2 },
                        secondaryEffect: {
                          type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.85, debuffDuration: 6  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }],
                      next_story: {
                        storyNodeRef: 'startGameSequence'
                      }
                    }
                  }
                },
                {
                  label: `<strong>Dongtak Seo</strong><br>No. 4 ×`,
                  next: {
                    battle: 'Dongtak_Seo',
                    win: {
                      gold: { min: 20, max: 40 },
                      substory: [`You defeated Dongtak_Seo, impressing Everyone.`],
                      game_title: "You've defeated Dongtak_Seo",
                      game_desc: "choose your rewards",
                      cards: [{
                        name: "Adrenaline Rush", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Strength Stats by 20 for 4 turns.<br>SPD +2`,
                        effects: { spd: 2, statPoints: 2 }, statToBuff: "str", buffValue: 20, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
                      }, {
                        name: "Mach Punch", type: "attack", staminaCost: 55, desc: `You are ablle to use mach Punch, heavy blow that unbalanced the opponents. but cannot be use more than twice <br>DUR +1, STR +1`,
                        effects: { dur: 1, str: 1, statPoints: 2 }, damage: { min: 150, max: 220 }, cooldown: 2, usesLimit: 2, gif: "cha/big attack.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                        secondaryEffect: {
                          type: "debuff", subType: "stun", stunTurns: 2, debuffDuration: 2, stunEffectGif: "/cha/stun.gif"  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }, {
                        name: "Swift Claw", type: "attack", staminaCost: 35, desc: `A swift, two-handed claw attack . A brutal strike that stun the opponents.<br>TECH +1, STR +1`,
                        effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 90, max: 135 }, cooldown: 6, gif: "cha/claw1.gif", gif_target: "opponent", sound: "cha/sound/claw2.mp3",
                        secondaryEffect: {
                          type: "bleed"
                        }
                      }, {
                        name: "Rock Skin", type: "buff", // This card will appear in your "Buff Cards" list.
                        subType: "damage_reduction", // Our new, custom subtype.
                        isSealable: true,
                        staminaCost: 35,
                        desc: "For the next 10 turns, all damage taken from the opponent is reduced by 25%.",
                        effects: { dur: 3, statPoints: 2 }, // Optional: also gives a permanent stat boost.
                        buffDuration: 10, // The number of turns the effect will last.
                        reductionAmount: 0.75, // The multiplier for the damage (0.8 means 20% damage).
                        cooldown: 6,
                        usesLimit: 1,
                        gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                        gif_target: "player",
                        glowEffect: { color: 'green' }
                      }, {
                        name: "Chain Of Indoctrination ", type: "debuff", subType: "stun", isSealable: true, staminaCost: 65, desc: `Bind the target for 4 Turns with whole stats reduction by 15% <br>TECH +2, STR +1`,
                        stunTurns: 4, cooldown: 5, usesLimit: 2, gif: "cha/stun3.gif", gif_target: "opponent", sound: "cha/sound/stun.wav",
                        effects: { tech: 2, str: 1, statPoints: 2 },
                        secondaryEffect: {
                          type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.85, debuffDuration: 6  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }],
                      next_story: {
                        storyNodeRef: 'startGameSequence'
                      }
                    }
                  }
                },
                {
                  label: `<strong>Geon Park</strong><br>No. 5`,
                  next: {
                    battle: 'Geon_Park',
                    win: {
                      gold: { min: 20, max: 40 },
                      substory: [`You defeated Geon_Park, impressing Everyone.`],
                      game_title: "You've defeated Geon_Park",
                      game_desc: "choose your rewards",
                      cards: [{
                        name: "Adrenaline Rush", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Strength Stats by 20 for 4 turns.<br>SPD +2`,
                        effects: { spd: 2, statPoints: 2 }, statToBuff: "str", buffValue: 20, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
                      }, {
                        name: "Mach Punch", type: "attack", staminaCost: 55, desc: `You are ablle to use mach Punch, heavy blow that unbalanced the opponents. but cannot be use more than twice <br>DUR +1, STR +1`,
                        effects: { dur: 1, str: 1, statPoints: 2 }, damage: { min: 150, max: 220 }, cooldown: 2, usesLimit: 2, gif: "cha/big attack.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                        secondaryEffect: {
                          type: "debuff", subType: "stun", stunTurns: 2, debuffDuration: 2, stunEffectGif: "/cha/stun.gif"  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }, {
                        name: "Swift Claw", type: "attack", staminaCost: 35, desc: `A swift, two-handed claw attack . A brutal strike that stun the opponents.<br>TECH +1, STR +1`,
                        effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 90, max: 135 }, cooldown: 6, gif: "cha/claw1.gif", gif_target: "opponent", sound: "cha/sound/claw2.mp3",
                        secondaryEffect: {
                          type: "bleed"
                        }
                      }, {
                        name: "Rock Skin", type: "buff", // This card will appear in your "Buff Cards" list.
                        subType: "damage_reduction", // Our new, custom subtype.
                        isSealable: true,
                        staminaCost: 35,
                        desc: "For the next 10 turns, all damage taken from the opponent is reduced by 25%.",
                        effects: { dur: 3, statPoints: 2 }, // Optional: also gives a permanent stat boost.
                        buffDuration: 10, // The number of turns the effect will last.
                        reductionAmount: 0.75, // The multiplier for the damage (0.8 means 20% damage).
                        cooldown: 6,
                        usesLimit: 1,
                        gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                        gif_target: "player",
                        glowEffect: { color: 'green' }
                      }, {
                        name: "Chain Of Indoctrination ", type: "debuff", subType: "stun", isSealable: true, staminaCost: 65, desc: `Bind the target for 4 Turns with whole stats reduction by 15% <br>TECH +2, STR +1`,
                        stunTurns: 4, cooldown: 5, usesLimit: 2, gif: "cha/stun3.gif", gif_target: "opponent", sound: "cha/sound/stun.wav",
                        effects: { tech: 2, str: 1, statPoints: 2 },
                        secondaryEffect: {
                          type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.85, debuffDuration: 6  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                        }
                      }],
                      next_story: {
                        storyNodeRef: 'startGameSequence'
                      }
                    }
                  }
                }]
              }
            }
          }
        }]
      }
    }]

  },
  startGameSequence: {

    substory: [`After defeating the top East Gangbuk fighters, you earned the crew’s full respect. Even Han Jaeha nodded with something close to admiration<br>But the celebration didn’t last long.<br><br><strong>The next morning,</strong><br> your phone buzzed. A message from Choyun<br>"Urgent. Come to the back lot. Alone."`,
      `You arrive. Choyun stands by an old, dusty truck. His arms are crossed. His expression is colder than usual<br>“It’s time,” he says.<br> “We’re taking out Sechan Kang, leader of North Gangbuk. Tonight.”<br>You hesitate.<br> Sechan Kang?You’d seen him around before. Quiet. Calm. A guy who didn’t chase power or brag about strength. He never picked fights unless there was no other choice.<br>“Are you sure?” you ask<br>Choyun doesn’t even blink, He places a hand on your shoulder.<br>“Be ready. Tonight, we end it. I want you there.”`,
      `<strong>Nightfall – The Alley Showdown</strong><br><br>The meeting spot is a dimly lit alley—cracked pavement, a flickering lamp, silence hanging thick in the air.<br>You and Choyun wait. Eventually, Sechan Kang walks in. Alone, just as asked.He stops a few feet away, hands in his pockets<br><br>“I figured this was coming,” he says quietly.<br>“But... I’m not here to fight. I don’t even want to be a leader.<br> I’ve avoided war this long. I just want my people safe.”<br>He turns to leave.That’s when Choyun steps forward and blocks his path`,
      `<br><br>Before anything else can happen, a slow, sarcastic clapping breaks the tension.<br>From the shadows, a figure emerges. A lean guy with a sharp stare and a smirk—Daniel.<br>“Wow... Really classy, Choyun the quite guy now wanted to played some gang-stuff. Set up a 2-on-1 in a dead alley?”<br>“I told you, Sechan Kang—something felt off.”<br><strong>Sechan Kang sighs.</strong><br>“Haha… what can I say? I trusted too much.”<br>Daniel cracks his neck and steps beside Sechan Kang.Both take their fighting stances.`],
    game_title: "Pick Your Opponent",
    game_desc: "Risky battle but high risk high reward",
    actions: [{
      label: `<strong>Sechan Kang</strong><br>No. 1 ×`,
      next: {
        battle: 'Sechan_Kang',
        win: {
          gold: { min: 50, max: 70 },
          substory: [`<strong><span style="color: #89cfff">[You defeated Sechan Kang.]</span></strong>`],
          game_title: 'Choose your reward',
          cards: [
            { name: "LOCK-IN", type: "buff", subType: "multiplier", isSealable: true, staminaCost: 50, desc: `Increase the user strength by 35% when used (Can be stacked)<br>BIQ +2, SPD +1`, effects: { biq: 2, spd: 1 }, buffAmount: 1.35, cooldown: 10, usesLimit: 2, gif: "./cha/buff.gif", gif_target: "player", sound: "cha/sound/aura.wav" },
            {
              name: "Unleashed Potential", type: "buff", subType: "temp_stat", staminaCost: 40, desc: `Temporarly Buff the user Strength Stats by 25 for 4 turns.<br>SPD +1, TECH +1`,
              effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 25, buffDuration: 4, cooldown: 6, usesLimit: 2, gif: "cha/temp str.gif", gif_target: "player", glowEffect: { color: 'red' },
            }, {
              name: "Concussive Barrage", type: "attack", isSealable: true, staminaCost: 40, desc: `You unleash a flurry of hooks and jabs aimed at the opponent's head.the repeated impacts serve to rattle their brain disrupting their thoughts and coordination. <br>SPD +1, STR +1`,
              effects: { spd: 1, str: 1, statPoints: 2 }, damage: { min: 130, max: 160 }, cooldown: 5, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
              secondaryEffect: {
                type: "debuff", subType: "stat_reduction", statToDebuff: "spd", debuffValue: 0.9, debuffDuration: 2 // Reduces speed by 30% debuffDuration: 2
              }
            }, {
              name: "Tiger's Fury", type: "attack", staminaCost: 40, desc: `A swift  claw attack , unleashing a furious assault on a weakened foe. A brutal strike that stir the opponents speed and strength.<br>TECH +1, STR +1`,
              effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 140, max: 150 }, cooldown: 6, gif: "cha/bite.gif", gif_target: "opponent", sound: "cha/sound/claw.mp3",
              secondaryEffect: {
                type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd"], debuffValue: 0.90, debuffDuration: 3  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
              }
            }, {
              name: "Paralyzing Palm", type: "debuff", subType: "stun", isSealable: true, staminaCost: 75, desc: `Stun the target for 4 Turns with whole stats reduction by 20% <br>DUR+2, STR +1`,
              stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/red punch11.gif", sound: "cha/sound/stun.wav", gif_target: "opponent",
              effects: { tech: 2, str: 1, statPoints: 2 },
              secondaryEffect: {
                type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.80, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
              }
            }
          ],
          next_story: {
            storyNodeRef: 'endGameSequence'
          }
        }
      }
    }, {
      label: `<strong>Daniel</strong><br>No. 2 ×`,
      next: {
        battle: 'daniel',
        win: {
          gold: { min: 50, max: 70 },
          substory: [`You defeated daniel, impressing everyone.`],
          cards: [
            { name: "Fighting Instinct", type: "buff", subType: "multiplier", isSealable: true, staminaCost: 45, desc: `Increase the user strength by 30% when used (Can be stacked)<br>BIQ +2, SPD +1`, effects: { biq: 2, spd: 1 }, buffAmount: 1.30, cooldown: 8, usesLimit: 2, gif: "./cha/buff.gif", gif_target: "player", sound: "cha/sound/aura.wav" },
            {
              name: "Berserker", type: "buff", subType: "temp_stat", staminaCost: 35, desc: `Temporarly Buff the user Technique Stats by 20 for 4 turns.<br>SPD +1, TECH +1`,
              effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "tech", buffValue: 20, buffDuration: 4, cooldown: 6, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
            }, {
              name: "Machine Gun Blows", type: "attack", isSealable: true, staminaCost: 40, desc: `You unleash a blinding torrent of piston-like punches. The sheer speed and volume of strikes make it impossible for the opponent to track or defend against them individually <br>SPD +1, STR +1`,
              effects: { spd: 1, str: 1, statPoints: 2 }, damage: { min: 120, max: 150 }, cooldown: 5, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/s punch.wav",
              secondaryEffect: {
                type: "debuff", subType: "stat_reduction", statToDebuff: "spd", debuffValue: 0.9, debuffDuration: 2 // Reduces speed by 30% debuffDuration: 2
              }
            }, {
              name: "Claw Fury", type: "attack", staminaCost: 35, desc: `A swift  claw attack , unleashing a furious assault on a weakened foe. A brutal strike that stir the opponents strength.<br>TECH +1, STR +1`,
              effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 100, max: 140 }, cooldown: 6, gif: "cha/claw3.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
              secondaryEffect: {
                type: "bleed"
              }
            }, {
              name: "Zapper Shot", type: "debuff", subType: "stun", isSealable: true, staminaCost: 75, desc: `Stun the target for 4 Turns with whole stats reduction by 20% <br>DUR+2, STR +1`, sound: "cha/sound/stun.wav", gif: "cha/stun3.gif", gif_target: "opponent",
              stunTurns: 5, cooldown: 7, usesLimit: 2,
              effects: { tech: 1, spd: 2, statPoints: 2 },
              secondaryEffect: {
                type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.80, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
              }
            }
          ],
          next_story: {
            storyNodeRef: 'endGameSequence'
          }
          /////
        }
      }
    }]

  },
  endGameSequence: { // The unique name for our reusable story node
    substory: [`<strong>Scene: The Night You Should've Walked Away</strong><br><br>After defeating Sechan Kang and Daniel in that back-alley fight, it should have ended.<br>Choyun stood over the fallen bodies, his voice calm<br>“Your work is done. You can go now.”<br>You nodded, still catching your breath.<br><br>“If you ever need me again… you know where to find me.”<br>But he just stared at you. Cold. Unblinking. His expression void of any emotion.As you turned and started walking out of the alley, something… shifted.<br>Your gut twisted.<br>You paused. Looked back`,
      `In the dim alley, you saw Choyun standing over Sechan Kang—who was still breathing, still alive.<br>Until Choyun grabbed him by the throat.<br>You froze.<br>Sechan Kang struggled. Fought. His body convulsed. Then something horrible happened.<br>You saw his skin sink in—like something was draining the very life out of him.<br>Within seconds, his body crumbled into a brittle, husk-like shell.<br> Eyes wide.<br> Lifeless.<br>And behind Choyun…`,
      `A massive, slimy, translucent creature rose from the darkness.<br>It devoured what remained of Sechan Kang with a sickening, wet sound.<br>You couldn’t breathe.<br>Your foot accidentally knocked over a tin can.<br><br><strong>!!Clang!!</strong><br>Choyun turned sharply. You ducked behind the corner and ran. Fast.You didn’t stop running...`,
      `<strong>Next Morning – Something’s Off</strong><br><br>You made it to school. The halls were normal. The buzz of students. Teachers lecturing<br>But Choyun walked into the classroom… changed<br>He looked taller. His frame more filled out- like a completely different body...<br>And beside him, like a loyal dog, was Daniel.<br>The same Daniel you fought. The same one who stood against Choyun with Sechan Kang.<br>Now walking shoulder to shoulder, eyes dull, almost empty.<br>He didn’t even look at you.<br>Worse... there was no mention of Sechan Kang.<br>No memorial. No gossip. No rumors.<br>It was like he never existed`, `You told yourself it was just a dream. A bad one.<br>But deep down, you knew what you saw was real.<br>To distract your mind you went arount fighting and training....`],
    game_title: "To distract your Mind you choose to...",
    game_desc: "Choose",
    actions: [{
      label: "Fight Thugs",
      ///
      next: {
        battle_sequence: ["L_Thug1", "L_Thug2", "L_Thug3"],
        win: {
          gold: { min: 30, max: 60 },
          substory: [`You've defeated Bullies, <br>Choose your reward.`],
          cards: [
            {
              name: "Boost Up", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Speed Stats by 24 for 3 turns.<br>SPD +1`,
              effects: { spd: 2, statPoints: 4 }, statToBuff: "spd", buffValue: 24, buffDuration: 3, cooldown: 6, usesLimit: 2, gif: "cha/temp speed.gif", gif_target: "player", glowEffect: { color: 'blue' },
            }, {
              name: "Crescent Moon Kick", type: "attack", desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1`,
              effects: { tech: 2, statPoints: 4 }, damage: { min: 120, max: 145 }, cooldown: 7, gif: "cha/cutt.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
              secondaryEffect: {
                type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/void stun.gif"
              }
            }, {
              name: "Overwhelming Presence", type: "debuff", subType: "stun", desc: `Overwhelming the target for 4 Turns with whole stats reduction by 15% <br>DUR +1`,
              effects: { dur: 2, statPoints: 4 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/intimate.gif", gif_target: "opponent", stunEffectGif: "/cha/void stun.gif",
              secondaryEffect: {
                type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.85, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
              }
            }
          ],
          //////
          next_story: {
            substory: [`<strong>Two Months Later – Trying to Move On</strong><br><br>You fought thugs, sparred at local gyms, sharpened your body. You tried to forget. To bury it.<br>But every time you closed your eyes, that image returned: Sechan Kang’s body shriveling... that creature behind Choyun.`, `So finally, one morning, you packed a bag.<br><br><strong>[Destination: Gangbuk Resort – North Gangbuk's Mountain Retreat.]</strong><br><br>A trip to clear your mind. Breathe fresh air. Find peace`
              , `Arrival at Gangbuk Resort~<br><br>The resort was quiet. Clean air. Cold breeze. The scent of pine and hot springs<br>You checked in. Room 207<br>You left your bag, changed into something light, and stepped outside<br>For the first time in months, the world felt still<br>No gangs. No fights. No monsters<br>But peace doesn’t last long, does it?...`,
              `<strong>Loud Voices in the Hallway</strong><br><br>You heard laughter, footsteps, and the thud of luggage bumping against walls. Curious, you opened your door.<br>A group stood outside the room opposite yours. One of them waved.<br>“Hey! We’re staying across from you. I’m Suhyeon Kim.”<br>He introduced his friends one by one<br>Suhyeon smiled.<br><br>“If you’re here alone, wanna join us? It’s just for fun.”<br>you hesitated but <br>“Sure,” you said. “Why not?”`
              , `<strong>Day at the Beach</strong><br><br>The afternoon was full of chaotic joy,You didn’t expect much from the beach. Maybe some peace and a quiet swim.<br>Instead, you got total chaos—and somehow, it was exactly what you needed.<br>Gukja, full of energy and overconfidence, grabbed a beach ball and shouted<br>“Alright! Watch this pro-level serve!”<br>He threw it high into the air, ran back for a running jump……and mistimed everything<br>The ball bounced off a wave of wind, curved like it had a grudge, and smacked directly into Gukja’s face mid-dash.<br>Thwop!!<br><br>The group exploded with laughter<br>We spent the whole afternoon messing around—swimming, splashing water at each other like kids; building sandcastles, most of which either collapsed or somehow turned into weird-looking sea creatures; and playing watermelon splitting, where half the fun was watching everyone miss wildly and nearly knock each other out instead of hitting the fruit.`, `That night, they invited you to their room. Card games turned into weird punishments—one round had you singing an anime opening you barely knew. Hajun tried to beatbox. It was awful. But in a good way<br><br>Later, you returned to your room, exhausted, smiling.`,
              `The next night felt… different.<br>No sound from Suhyeon Kim’s room. No laughter. No late-night snacks.<br>You stepped into the corridor, hands in your pockets. The air was colder.<br>Deciding to clear your head, you went for a night walk along the side path that led toward the beach.<br>And that’s when you saw it.<br>Under a flickering lamp near the back ally, Suhyeon was in a fight.And his opponent?<br><strong>Daniel</strong><br>But this wasn’t the same Daniel you fought two months ago. He was faster. Stronger. His movements were too sharp. His eyes—cold.<br>Suhyeon Kim was holding his own… barely.<br>You froze.<br>You were from North Gangbuk. Helping him might risk your position—or worse, put a target on your back from Choyun<br><br>you dont know what to do..??`],

            game_title: "What do you want to do next?",
            game_desc: "Risky battle begins",
            actions: [{
              label: "<strong>Help Suhyeon Kim</strong> <br>**Crucial choice**",
              next: {
                substory: [`You turned slightly to back away... and saw it.<br>A crumpled paper bag, left beside a trash bin.<br>You smirked...<br>"Screw it.”<br>You grabbed the bag, tore eye holes, and pulled it over your head.Then you charged`,
                  `You leapt into the fight, surprising both of them<br>Daniel narrowed his eyes.<br><br>“Who the hell…?”<br>You didn’t answer.Instead, you stepped between him and Suhyeon Kim, fists clenched, breath steady behind the paper mask.<br>Suhyeon Kim blinked<br>“Wait… is that a grocery bag?” <br>you replied <br>“Don’t ask. Let’s take him down.”`],
                battle: 'Daniel_MC',
                win: {
                  gold: { min: 60, max: 100 },
                  game_title: `You defeated Daniel (HIGH RISK HIGH REWARD)`,
                  game_desc: `Choose your reward.`,
                  cards: [
                    {
                      name: "Healing bean", type: "buff", subType: "heal", isSealable: true, staminaCost: 35, desc: `Heal for 30% of your max HP with 10% damage reduction.<br> DUR +2`,
                      effects: { dur: 2, statPoints: 4 }, healPercent: 0.30, cooldown: 6, usesLimit: 2,
                      secondaryEffect: {
                        type: "buff", subType: "damage_reduction", // Our new, custom subtype.
                        buffDuration: 3, // The number of turns the effect will last.
                        reductionAmount: 0.90, // The multiplier for the damage (0.8 means 20% damage).
                        gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                        gif_target: "player",
                      }
                    },
                    {
                      name: "Overwhelm speed", type: "buff", subType: "temp_stat", staminaCost: 40, desc: `Temporarly Buff the user Speed Stats by 35 for 3 turns.<br>SPD +1`,
                      effects: { spd: 1, statPoints: 4 }, statToBuff: "spd", buffValue: 35, buffDuration: 3, cooldown: 6, usesLimit: 2, gif: "cha/temp speed.gif", gif_target: "player", glowEffect: { color: 'blue' },
                    }, {
                      name: "German Suplex", type: "attack", staminaCost: 50, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br> STR +1`,
                      effects: { str: 1, statPoints: 4 }, damage: { min: 145, max: 175 }, cooldown: 7, gif: "cha/Super throw.gif", gif_target: "opponent", sound: "cha/sound/throw.mp3",
                      secondaryEffect: {
                        type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                      }
                    }, {
                      name: "Hand Blade", type: "attack", staminaCost: 45, desc: `You harden the edge of your hand into a living blade and deliver a swift, chopping blow to a vital points...<br> TECH +1`,
                      effects: { tech: 1, statPoints: 4 }, damage: { min: 130, max: 190 }, cooldown: 8, gif: "cha/kick.gif", gif_target: "opponent", sound: "cha/sound/sword cut.mp3",
                      secondaryEffect: {
                        type: "bleed"
                      }
                    }
                  ],
                  next_story: {
                    substory: [`you have defeated Daniel <br>You stepped back, chest heaving, the paper bag still over your face—now torn, sweat-soaked, and flapping in the wind.<br>Suhyeon Kim knelt beside Daniel, then stood, brushing dust off his arms<br><br>You asked "why is daniel fighting you"<br>He replied<br>“I’m Suhyeon Kim, leader of Western Gangbuk. And I plan to unify all of Gangbuk” <br>Your eyes widened<br>Suhyeon Kim continued: “My goals are simple—protect my crew, grow stronger, and stop that Evil before he becomes unstoppable.”<br>You told her everything—about Choyun, the fight with Sechan Kang, the Slime-like creature, and how Daniel became… different and about System`, `Suhyeon Kim replied <br>“You… have a system too?”<br>you nodded.“Yeah. Guess we’re not so rare after all.” Suhyeon Kim listened quietly<br>“Then it’s worse than I thought. If Choyun’s draining and mind controling people, and he’s a system user like us… he’s probably evolving too. Every second.”<br>“One month. That’s all I need. I’ll train, grow, and then head to North Gangbuk and finish this.”<br><br>“You do the same. Whatever it takes—get stronger Good Luck”`],
                    game_title: "What do you want to do next?",
                    game_desc: "End-Game Coming",
                    actions: [{
                      label: "Train Alone",
                      train: true,
                      gold: 50,
                      //////
                      next: {
                        substory: ["You feel your body getting stronger."],
                        effects: { statPoints: 8 },
                        game_title: "Now you are at the END GAME",
                        game_desc: "",
                        actions: [{
                          label: "Continue",
                          effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 8 },
                          next: {
                            substory: [`It had been a month since you disappeared from the streets.<br> In that time, you'd put everything into getting stronger—mentally and physically.<br> Now, it was time to come back<br>You called Suhyeon Kim, and he told you to come to Western Gangbuk High<br>You expected a quiet meetup.What you found was a full war council<br>You spotted Kang Seok, the Southern Gangbuk leader, standing near the wall with his usual dead-serious expression.<br>Then, near the back, leaning against the wall with his arms crossed and a laid-back look on his face— <br>Han Jaeha, leader of Eastern Gangbuk.<br>You walked over.<br><br>“Long time no see,” Jaeha said with a crooked grin.<br>“Yeah,” you replied. “Feels like forever.”`,
                              `He asked.<br>“So, you’re with us now? For real?”<br>You nodded.<br>“Yup.”<br>He looked you over, impressed.<br>“Then we’ve got ourselves some serious firepower.”<br>Before more words could be exchanged, Suhyeon Kim entered the room .“Good. Everyone’s here,” he said.`, `<strong>The Plan Begins</strong><br><br>Suhyeon Kim unrolled a large city map over a folding table.<br>“We’ve gathered solid intel on Northern Gangbuk. Their manpower is insane—if we try to storm them head-on, we’ll get crushed.”<br>“Instead, we strike strategically. Four key operations—they’re the heart of North Gangbuk’s underground empire.”<br>he pointed to four marked locations:<br><br>
                                                                                        <ul><li>🎤 Karaoke Bar: “Run by No. 5 Jun Jang, with several elite executives.”</li><li>🥊 Fighting Arena: “The strongest holdout. Controlled by No. 3 Jeongdu Ma and No. 6 Jikwang Hong.”</li><li>🎰 Casino: “Managed by No. 4 Jiwon Seo and No. 8 Jintae Heo.”</li><li>💉 Drug Den: “A dark hole crawling with executive-level enforcers.”</li></ul><br>`
                              , `Suhyeon Kim continued:“Here’s how we’ll divide our forces.”<br> South Gangbuk, led by Kang Seok and with Seonu Ha, will hit the Drug Den.<br>Han Jaeha and Taeho Cheon from the East will target the Karaoke Bar.<br>I and Uijin Gyeong will take Western forces to the Fighting Arena.<br>You, along with some of our best from West, will handle the Casino.<br><br>But you raised your hand.“Switch me. I’ll take the Arena.”<br>Everyone paused.<br>Suhyeon Kim gave you a look.<br>“That’s the most heavily guarded location. You’d be going straight into the toughest part.”<br>You smirked.“I didn’t spend a month hiding in alleyways and fighting just to play it safe.”<br>Then Suhyeon Kim gave a faint smile.<br>“Alright. Then it’s settled.”`
                              , `he stepped back and looked at the group.<br>“Once all four targets are neutralized, we regroup. One final assault—on Choyun.”<br><br>Everyone responded in unison:<br>“Got it.”One by one, the gangs began dispersing—each team heading toward their battlefield.Your destination: The Arena.`],
                            game_title: "You arrived at fighting arena",
                            game_desc: "",
                            actions: [{
                              label: "GET READY TO WORK",
                              next: {
                                substory: [`You arrived at the Underground Fighting Arena just before sundown.<br>The place wasn’t flashy—just a massive concrete hall deep in North Gangbuk territory. Dim lighting. The air was heavy with sweat, blood, and cheap smoke. You could hear the crowd, chaotic, hungry for violence<br>Inside, the fights were already in full swing<br>One guy was getting dragged out with his nose bent sideways. Another limped off with his corner man holding a towel over his eye.<br>You kept your hood low and didn’t speak to anyone<br>At the registration table, you registerd yoruself using fake name <br>They didn’t know you were a traitor now. but its always better to be cautious<br>Before stepping into the prep area, you pulled out a crumpled paper bag mask—the same one you’d used before. Ripped eye holes, nothing fancy. Just enough to keep your face hidden`,
                                  `<strong>Match Starts</strong><br><br>Your first opponent was already in the ring—shirt off, bouncing on his heels, built like a small tank.<br>They called your fake name. You walked out<br>“What the hell’s with the bag?”<br>“New guy’s got jokes.”<br>You didn’t react.<br><strong>The bell rang!!.</strong>`],
                                game_title: "Risky battle begins",
                                game_desc: "Upgrade your stats before the battle",
                                actions: [{
                                  label: "START",
                                  next: {
                                    battle_sequence: ['NPC1', 'NPC2', 'NPC3'],
                                    win: {
                                      gold: { min: 30, max: 60 },
                                      substory: [`Now you have defeated your opponents now times for the final round<br>By now, the mood had shifted.<br>No one was laughing about the paper bag anymore.<br> Whispers started:“This guy’s for real.”<br>"He defeated all those strong fighter with much effort but that's it"<br>"He still not match for Hong"<br>Someone yelled,“Bring out Jikwang Hong!”<br>And that’s when the doors opened`,
                                        `<strong>Enter: Jikwang Hong</strong><br><br>You turned.<br>Jikwang Hong walked in, casual like he owned the place.<br>Buzzcut. Faded knuckle scars. Broad shoulders, no nonsense in his stride.<br>He looked at you, sizing you up from across the ring<br>“You made it this far with a paper bag on your head,” he said, voice dry.<br>“But this is the end of the road.”<br>You said nothing.<br><br>“Life doesn’t go the way you want,” he muttered.<br>It sounded like more than just trash talk… but you didn’t have time to think about it.<br>The bell rang.`],
                                      battle: 'Jikwang_Hong',
                                      win: {
                                        gold: { min: 80, max: 120 },
                                        substory: [`<strong>You defeated Jikwang Hong,</strong>.`],
                                        game_title: "Choose your rewards",
                                        game_desc: " ",
                                        cards: [{
                                          name: "Limit Breaker", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 60, desc: `Temporarly Buff the user Strength Stat by 50 for 5 turns.<br>SPD +1, TECH +1`,
                                          effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 50, buffDuration: 5, cooldown: 6, usesLimit: 1, gif: "cha/auraa.gif", sound: "cha/sound/aura.wav", gif_target: "player", glowEffect: { color: 'red' },
                                        }, {
                                          name: "CQC", type: "attack", isSealable: true, staminaCost: 65, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1, STR +1`,
                                          effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 145, max: 190 }, cooldown: 9, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
                                          secondaryEffect: {
                                            type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                                          }
                                        }, {
                                          name: "Crushing Python", type: "debuff", subType: "stun", isSealable: true, staminaCost: 80, desc: `Bind the target for 5 Turns with whole stats reduction by 30% <br>DUR+2, STR +1`,
                                          stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/bind.gif", gif_target: "opponent", stunEffectGif: "/cha/stun.gif",
                                          effects: { tech: 2, str: 1, statPoints: 2 },
                                          secondaryEffect: {
                                            type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                          }
                                        }
                                        ],
                                        next_story: {
                                          substory: [`<strong>After the Fight – The Twist</strong><br><br>The fight was over.Jikwang Hong lay on the floor, unconscious. The arena, once roaring with noise, had gone quiet.Little by little The crowd dispersed<br>You leaned against the wall, breathing heavily.<br>“Just one left…” you muttered.<br>“Only Jeongdu Ma remains.”<br>You pulled out your phone and called Han Jaeha, eager to brag.He picked up on the first ring.` <
                                            `<br>Han Jaeha: "What’s up? How’s the attack going?"<br>You: "I already beat No.6. All that’s left is Jeongdu Ma. What about you? Have you even started yet? Heh."<br>Han Jaeha (laughing): "I’m already done here, lol. We’ve defeated everyone."<br>But just as he said that, you heard it — screaming in the background. People crying out in pain.<br>Han Jaeha: "Wait… something’s happening. I’ll call you later."<br>He hung up.<br>A bad feeling crept in.<br><br>You tried calling Seok… but the call wouldn’t go through. No signal. No response.<br>Then—shadows moved. You looked around… and realized you were surrounded.<br>Members of the North, closing in. And leading them was Jeongdu Ma himself.<br>Jeongdu Ma: "You actually made a decent plan to take us down. We already expected this, though."<br>He smirked.<br>Jeongdu Ma: "We had a spy in your team… Seok Kang. South’s so-called leader. Hahaha!"<br>You: "What?? That Bastard Seok kang was with North all along?!"<br>Your phone rang again — Han Jaeha’s number.`,
                                            `<br>You picked it up, shouting: "Seok is a traitor—!"<br>But the voice on the other end wasn’t Han Jaeha’s.<br><br>You: "Choyun?! What happened to Han Jaeha?!"<br>Choyun: "Relax. He’s not dead… but he’s not in any condition to answer calls either."<br>Choyun: "Your plan failed. You can’t win. I’ll give you one last chance."<br>Choyun: "Come back and join us… or get killed here and now."<br>What will you do?....`],
                                          game_title: "Last Chance",
                                          game_desc: "Since you've already picked the Suhyeon Kim so its only one choice",
                                          actions: [{
                                            label: "Rejects the offer",
                                            next: {
                                              substory: [`Choyun: "Still taking their side, huh? Even after all this? Fine."<br>"Die then."<br>The call ended. Silence for a moment… then a shift in the air.<br>Jeongdu Ma cracked his knuckles and stepped forward<br>The real fight had begun.`],
                                              battle: 'Jeongdu_Ma',
                                              win: {
                                                gold: { min: 100, max: 150 },
                                                substory: [`You defeated Jeongdu Ma`],
                                                game_title: "Choose your rewards",
                                                game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b>",
                                                cards: [

                                                  {
                                                    name: "Diamond Skin", staminaCost: 70, type: "buff", // This card will appear in your "Buff Cards" list.
                                                    subType: "damage_reduction", // Our new, custom subtype.
                                                    isSealable: true,
                                                    desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 60%.",
                                                    // Optional: also gives a permanent stat boost.
                                                    buffDuration: 10, // The number of turns the effect will last.
                                                    reductionAmount: 0.4, // The multiplier for the damage (0.8 means 20% damage).
                                                    cooldown: 6,
                                                    usesLimit: 1,
                                                    gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                                                    gif_target: "player",
                                                    glowEffect: { color: 'green' }
                                                  }, {
                                                    name: "Infinite Technique", staminaCost: 85, staminaCost: 85, type: "attack", isSealable: true, desc: `The pinnacle of combat mastery. You unleash a flawless, continuous barrage of attacks. Infinite Technique is a storm of martial arts that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                    damage: { min: 250, max: 300 }, cooldown: 8, usesLimit: 2, gif: "cha/rapid punch.gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                                    secondaryEffect: {
                                                      type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "/cha/stun.gif"
                                                    }
                                                  },
                                                  {
                                                    name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 40% of your max HP.`, gif: "/cha/heal.gif", gif_target: "player",
                                                    healPercent: 0.40, cooldown: 8, usesLimit: 2,
                                                  }, {
                                                    name: "Ultra Instinct", staminaCost: 60, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 60% when used (Can be stacked)`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", glowEffect: { color: 'black' }
                                                  },

                                                ],
                                                next_story: {
                                                  substory: [`You stepped out of the arena, blood still drying on your skin.<br>Jeongdu Ma was down. One of the strongest in the north—defeated. You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. “What happened?”<br>He looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Your eyes narrowed. “So it’s true. That Bastard was with them all along." <br>Suhyeon Kim nodded. “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>You glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                    `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br> On one side of him stood Seok Kang. On the other, Daniel.`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. You stepped forward.<br><br>Suhyeon Kim turned to you. “Let me handle that traitor and Daniel.”<br>You nodded. “Then I’ll take Choyun.”<br>Choyun’s smiled. “Come, then. Show me what you've got”<br><br><strong>The final fight—begins now.</strong>`],
                                                  battle: 'Choyun',
                                                  win: {
                                                    substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                    next_story: {
                                                      substory: ["The End. Thanks for playing!"],
                                                      // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                      onComplete: function () {
                                                        // Prepare and save the player's state for online mode
                                                        const onlineData = {
                                                          playerName: playerName,
                                                          stats: stats,
                                                          cards: playerCards,
                                                          playerCardImage: localStorage.getItem('playerCardImage'),
                                                          playerBattleImage: localStorage.getItem('playerBattleImage')
                                                        };
                                                        localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                        // Show a confirmation and the online button
                                                        showPopup("Online Mode Unlocked!");
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }]
                                        }
                                      }
                                    }
                                  }
                                }]
                              }
                            }]
                          }
                        }]
                      }
                    },
                    {
                      label: "Fight Local Thugs",
                      next: {
                        battle_sequence: ['L_Thug1', 'L_Thug2', 'L_Thug3',],
                        win: {
                          gold: { min: 30, max: 60 },
                          game_title: `You defeated the Local bullies`,
                          game_desc: `Choose your reward.`,
                          cards: [
                            {
                              name: "Stats point reward", type: "stat_boost", desc: `Get the 7 stats point as rewards `,
                              effects: { statPoints: 7 },
                            }, {
                              name: "Strength card", type: "stat_boost", desc: `You get sudden leap in Strength<br>STR +8`,
                              effects: { str: 8 },
                            }, {
                              name: "Endurance card", type: "stat_boost", desc: `You get sudden leap in Endurance<br>END +8`,
                              effects: { end: 8 },
                            }, {
                              name: "Technique card", type: "stat_boost", desc: `You get sudden leap in Technique<br>TECH +8`,
                              effects: { tech: 8 },
                            }
                          ],
                          next_story: {
                            substory: ["You feel your body getting stronger."],
                            game_title: "What do you want to do next?",
                            game_desc: "Now you are at the END GAME",
                            actions: [{
                              label: "Continue",
                              effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 10 },
                              next: {
                                substory: [`It had been a month since you disappeared from the streets.<br> In that time, you'd put everything into getting stronger—mentally and physically.<br> Now, it was time to come back<br>You called Suhyeon Kim, and he told you to come to Western Gangbuk High<br>You expected a quiet meetup.What you found was a full war council<br>You spotted Kang Seok, the Southern Gangbuk leader, standing near the wall with his usual dead-serious expression.<br>Then, near the back, leaning against the wall with his arms crossed and a laid-back look on his face— <br>Han Jaeha, leader of Eastern Gangbuk.<br>You walked over.<br><br>“Long time no see,” Jaeha said with a crooked grin.<br>“Yeah,” you replied. “Feels like forever.”`,
                                  `He asked.<br>“So, you’re with us now? For real?”<br>You nodded.<br>“Yup.”<br>He looked you over, impressed.<br>“Then we’ve got ourselves some serious firepower.”<br>Before more words could be exchanged, Suhyeon Kim entered the room .“Good. Everyone’s here,” he said.`, `<strong>The Plan Begins</strong><br><br>Suhyeon Kim unrolled a large city map over a folding table.<br>“We’ve gathered solid intel on Northern Gangbuk. Their manpower is insane—if we try to storm them head-on, we’ll get crushed.”<br>“Instead, we strike strategically. Four key operations—they’re the heart of North Gangbuk’s underground empire.”<br>he pointed to four marked locations:<br><br>
                                                                                        <ul><li>🎤 Karaoke Bar: “Run by No. 5 Jun Jang, with several elite executives.”</li><li>🥊 Fighting Arena: “The strongest holdout. Controlled by No. 3 Jeongdu Ma and No. 6 Jikwang Hong.”</li><li>🎰 Casino: “Managed by No. 4 Jiwon Seo and No. 8 Jintae Heo.”</li><li>💉 Drug Den: “A dark hole crawling with executive-level enforcers.”</li></ul><br>`
                                  , `Suhyeon Kim continued:“Here’s how we’ll divide our forces.”<br> South Gangbuk, led by Kang Seok and with Seonu Ha, will hit the Drug Den.<br>Han Jaeha and Taeho Cheon from the East will target the Karaoke Bar.<br>I and Uijin Gyeong will take Western forces to the Fighting Arena.<br>You, along with some of our best from West, will handle the Casino.<br><br>But you raised your hand.“Switch me. I’ll take the Arena.”<br>Everyone paused.<br>Suhyeon Kim gave you a look.<br>“That’s the most heavily guarded location. You’d be going straight into the toughest part.”<br>You smirked.“I didn’t spend a month hiding in alleyways and fighting just to play it safe.”<br>Then Suhyeon Kim gave a faint smile.<br>“Alright. Then it’s settled.”`
                                  , `he stepped back and looked at the group.<br>“Once all four targets are neutralized, we regroup. One final assault—on Choyun.”<br><br>Everyone responded in unison:<br>“Got it.”One by one, the gangs began dispersing—each team heading toward their battlefield.Your destination: The Arena.`],
                                game_title: "You arrived at fighting arena",
                                game_desc: "",
                                actions: [{
                                  label: "GET READY TO WORK",
                                  next: {
                                    substory: [`You arrived at the Underground Fighting Arena just before sundown.<br>The place wasn’t flashy—just a massive concrete hall deep in North Gangbuk territory. Dim lighting. The air was heavy with sweat, blood, and cheap smoke. You could hear the crowd, chaotic, hungry for violence<br>Inside, the fights were already in full swing<br>One guy was getting dragged out with his nose bent sideways. Another limped off with his corner man holding a towel over his eye.<br>You kept your hood low and didn’t speak to anyone<br>At the registration table, you registerd yoruself using fake name <br>They didn’t know you were a traitor now. but its always better to be cautious<br>Before stepping into the prep area, you pulled out a crumpled paper bag mask—the same one you’d used before. Ripped eye holes, nothing fancy. Just enough to keep your face hidden`,
                                      `<strong>Match Starts</strong><br><br>Your first opponent was already in the ring—shirt off, bouncing on his heels, built like a small tank.<br>They called your fake name. You walked out<br>“What the hell’s with the bag?”<br>“New guy’s got jokes.”<br>You didn’t react.<br><strong>The bell rang!!.</strong>`],
                                    game_title: "Risky battle begins",
                                    game_desc: "Upgrade your stats before the battle",
                                    actions: [{
                                      label: "START",
                                      next: {
                                        battle_sequence: ['NPC1', 'NPC2', 'NPC3'],
                                        win: {
                                          gold: { min: 30, max: 60 },
                                          substory: [`Now you have defeated your opponents now times for the final round<br>By now, the mood had shifted.<br>No one was laughing about the paper bag anymore.<br> Whispers started:“This guy’s for real.”<br>"He defeated all those strong fighter with much effort but that's it"<br>"He still not match for Hong"<br>Someone yelled,“Bring out Jikwang Hong!”<br>And that’s when the doors opened`,
                                            `<strong>Enter: Jikwang Hong</strong><br><br>You turned.<br>Jikwang Hong walked in, casual like he owned the place.<br>Buzzcut. Faded knuckle scars. Broad shoulders, no nonsense in his stride.<br>He looked at you, sizing you up from across the ring<br>“You made it this far with a paper bag on your head,” he said, voice dry.<br>“But this is the end of the road.”<br>You said nothing.<br><br>“Life doesn’t go the way people want,” he muttered.<br>It sounded like more than just trash talk… but you didn’t have time to think about it.<br>The bell rang.`],
                                          battle: 'Jikwang_Hong',
                                          win: {
                                            gold: { min: 80, max: 120 },
                                            substory: [`<strong>You defeated Jikwang Hong,</strong>.`],
                                            game_title: "Choose your rewards",
                                            game_desc: " ",
                                            cards: [{
                                              name: "Limit Breaker", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 60, desc: `Temporarly Buff the user Strength Stat by 50 for 5 turns.<br>SPD +1, TECH +1`,
                                              effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 50, buffDuration: 5, cooldown: 6, usesLimit: 1, gif: "cha/auraa.gif", sound: "cha/sound/aura.wav", gif_target: "player", glowEffect: { color: 'red' },
                                            }, {
                                              name: "CQC", type: "attack", isSealable: true, staminaCost: 65, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1, STR +1`,
                                              effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 145, max: 190 }, cooldown: 9, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
                                              secondaryEffect: {
                                                type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                                              }
                                            }, {
                                              name: "Crushing Python", type: "debuff", subType: "stun", isSealable: true, staminaCost: 80, desc: `Bind the target for 5 Turns with whole stats reduction by 30% <br>DUR+2, STR +1`,
                                              stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/bind.gif", gif_target: "opponent", stunEffectGif: "/cha/stun.gif",
                                              effects: { tech: 2, str: 1, statPoints: 2 },
                                              secondaryEffect: {
                                                type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                              }
                                            }
                                            ],
                                            next_story: {
                                              substory: [`<strong>After the Fight – The Twist</strong><br><br>The fight was over.Jikwang Hong lay on the floor, unconscious. The arena, once roaring with noise, had gone quiet.Little by little The crowd dispersed<br>You leaned against the wall, breathing heavily.<br>“Just one left…” you muttered.<br>“Only Jeongdu Ma remains.”<br>You pulled out your phone and called Han Jaeha, eager to brag.He picked up on the first ring.` <
                                                `<br>Han Jaeha: "What’s up? How’s the attack going?"<br>You: "I already beat No.6. All that’s left is Jeongdu Ma. What about you? Have you even started yet? Heh."<br>Han Jaeha (laughing): "I’m already done here, lol. We’ve defeated everyone."<br>But just as he said that, you heard it — screaming in the background. People crying out in pain.<br>Han Jaeha: "Wait… something’s happening. I’ll call you later."<br>He hung up.<br>A bad feeling crept in.<br><br>You tried calling Seok… but the call wouldn’t go through. No signal. No response.<br>Then—shadows moved. You looked around… and realized you were surrounded.<br>Members of the North, closing in. And leading them was Jeongdu Ma himself.<br>Jeongdu Ma: "You actually made a decent plan to take us down. We already expected this, though."<br>He smirked.<br>Jeongdu Ma: "We had a spy in your team… Seok Kang. South’s so-called leader. Hahaha!"<br>You: "What?? That pig Seok was with North all along?!"<br>Your phone rang again — Han Jaeha’s number.`,
                                                `<br>You picked it up, shouting: "Seok is a traitor—!"<br>But the voice on the other end wasn’t Han Jaeha’s.<br><br>You: "Choyun?! What happened to Han Jaeha?!"<br>Choyun: "Relax. He’s not dead… but he’s not in any condition to answer calls either."<br>Choyun: "Your plan failed. You can’t win. I’ll give you one last chance."<br>Choyun: "Come back and join us… or get killed here and now."<br>What will you do?....`],
                                              game_title: "Last Chance",
                                              game_desc: "Since you've already picked the Suhyeon Kim so its only one choice",
                                              actions: [{
                                                label: "Rejects the offer",
                                                next: {
                                                  substory: [`Choyun: "Still taking their side, huh? Even after all this? Fine."<br>"Die then."<br>The call ended. Silence for a moment… then a shift in the air.<br>Jeongdu Ma cracked his knuckles and stepped forward<br>The real fight had begun.`],
                                                  battle: 'Jeongdu_Ma',
                                                  win: {
                                                    gold: { min: 100, max: 150 },
                                                    substory: [`You defeated Jeongdu Ma`],
                                                    game_title: "Choose your rewards",
                                                    game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                                    cards: [
                                                      {
                                                        name: "Diamond Skin", staminaCost: 70, type: "buff", // This card will appear in your "Buff Cards" list.
                                                        subType: "damage_reduction", // Our new, custom subtype.
                                                        isSealable: true,
                                                        desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 60%.",
                                                        // Optional: also gives a permanent stat boost.
                                                        buffDuration: 10, // The number of turns the effect will last.
                                                        reductionAmount: 0.4, // The multiplier for the damage (0.8 means 20% damage).
                                                        cooldown: 6,
                                                        usesLimit: 1,
                                                        gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                                                        gif_target: "player",
                                                        glowEffect: { color: 'green' }
                                                      }, {
                                                        name: "Infinite Technique", staminaCost: 85, type: "attack", isSealable: true, desc: `The pinnacle of combat mastery. You unleash a flawless, continuous barrage of attacks. Infinite Technique is a storm of martial arts that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                        damage: { min: 250, max: 300 }, cooldown: 8, usesLimit: 2, gif: "cha/rapid punch.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                                                        secondaryEffect: {
                                                          type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "/cha/stun.gif"
                                                        }
                                                      },
                                                      {
                                                        name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 40% of your max HP.`,
                                                        healPercent: 0.40, cooldown: 8, usesLimit: 2,
                                                      }, {
                                                        name: "Ultra Instinct", staminaCost: 60, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 60% when used (Can be stacked)`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", glowEffect: { color: 'black' }
                                                      },

                                                    ],
                                                    next_story: {
                                                      substory: [`You stepped out of the arena, blood still drying on your skin.<br>Jeongdu Ma was down. One of the strongest in the north—defeated. You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. “What happened?”<br>He looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Your eyes narrowed. “So it’s true. That Bastard was with them all along." <br>Suhyeon Kim nodded. “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>You glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                        `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br> On one side of him stood Seok Kang. On the other, Daniel.`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. You stepped forward.<br><br>Suhyeon Kim turned to you. “Let me handle that traitor and Daniel.”<br>You nodded. “Then I’ll take Choyun.”<br>Choyun’s smiled. “Come, then. Show me what you've got”<br><br><strong>The final fight—begins now.</strong>`],
                                                      battle: 'Choyun',
                                                      win: {
                                                        substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                        next_story: {
                                                          substory: ["The End. Thanks for playing!"],
                                                          // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                          onComplete: function () {
                                                            // Prepare and save the player's state for online mode
                                                            const onlineData = {
                                                              playerName: playerName,
                                                              stats: stats,
                                                              cards: playerCards,
                                                              playerCardImage: localStorage.getItem('playerCardImage'),
                                                              playerBattleImage: localStorage.getItem('playerBattleImage')
                                                            };
                                                            localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                            // Show a confirmation and the online button
                                                            showPopup("Online Mode Unlocked!");
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }]
                                            }
                                          }
                                        }
                                      }
                                    }]
                                  }
                                }]
                              }
                            }]
                          }

                        }
                      }
                    }, {
                      label: "Help Han Jaeha",
                      race: true,
                      win: {
                        gold: 30,
                        game_title: "DELIVERY SUCCESS",
                        game_desc: "You have proven your worth The system grants you rewards.",
                        cards: [{
                          name: "Stats point reward", desc: `Get the 7 stats point as rewards `,
                          effects: { statPoints: 7 },
                        }, {
                          name: "Strength card", desc: `You get sudden leap in Strength<br>STR +8`,
                          effects: { str: 8 },
                        }, {
                          name: "Technique card", desc: `You skills ot sharpher<br>STR +8`,
                          effects: { tech: 8 },
                        }, {
                          name: "Endurance card", desc: `You get sudden leap in Speed<br>END +8`,
                          effects: { end: 8 },
                        }],
                        next_story: {
                          substory: ["You feel your body getting stronger."],
                          game_title: "What do you want to do next?",
                          game_desc: "Now you are at the END GAME",
                          actions: [{
                            label: "Continue",
                            effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 10 },
                            next: {
                              substory: [`It had been a month since you disappeared from the streets.<br> In that time, you'd put everything into getting stronger—mentally and physically.<br> Now, it was time to come back<br>You called Suhyeon Kim, and he told you to come to Western Gangbuk High<br>You expected a quiet meetup.What you found was a full war council<br>You spotted Kang Seok, the Southern Gangbuk leader, standing near the wall with his usual dead-serious expression.<br>Then, near the back, leaning against the wall with his arms crossed and a laid-back look on his face— <br>Han Jaeha, leader of Eastern Gangbuk.<br>You walked over.<br><br>“Long time no see,” Jaeha said with a crooked grin.<br>“Yeah,” you replied. “Feels like forever.”`,
                                `He asked.<br>“So, you’re with us now? For real?”<br>You nodded.<br>“Yup.”<br>He looked you over, impressed.<br>“Then we’ve got ourselves some serious firepower.”<br>Before more words could be exchanged, Suhyeon Kim entered the room .“Good. Everyone’s here,” he said.`, `<strong>The Plan Begins</strong><br><br>Suhyeon Kim unrolled a large city map over a folding table.<br>“We’ve gathered solid intel on Northern Gangbuk. Their manpower is insane—if we try to storm them head-on, we’ll get crushed.”<br>“Instead, we strike strategically. Four key operations—they’re the heart of North Gangbuk’s underground empire.”<br>he pointed to four marked locations:<br><br>
                                                                                        <ul><li>🎤 Karaoke Bar: “Run by No. 5 Jun Jang, with several elite executives.”</li><li>🥊 Fighting Arena: “The strongest holdout. Controlled by No. 3 Jeongdu Ma and No. 6 Jikwang Hong.”</li><li>🎰 Casino: “Managed by No. 4 Jiwon Seo and No. 8 Jintae Heo.”</li><li>💉 Drug Den: “A dark hole crawling with executive-level enforcers.”</li></ul><br>`
                                , `Suhyeon Kim continued:“Here’s how we’ll divide our forces.”<br> South Gangbuk, led by Kang Seok and with Seonu Ha, will hit the Drug Den.<br>Han Jaeha and Taeho Cheon from the East will target the Karaoke Bar.<br>I and Uijin Gyeong will take Western forces to the Fighting Arena.<br>You, along with some of our best from West, will handle the Casino.<br><br>But you raised your hand.“Switch me. I’ll take the Arena.”<br>Everyone paused.<br>Suhyeon Kim gave you a look.<br>“That’s the most heavily guarded location. You’d be going straight into the toughest part.”<br>You smirked.“I didn’t spend a month hiding in alleyways and fighting just to play it safe.”<br>Then Suhyeon Kim gave a faint smile.<br>“Alright. Then it’s settled.”`
                                , `he stepped back and looked at the group.<br>“Once all four targets are neutralized, we regroup. One final assault—on Choyun.”<br><br>Everyone responded in unison:<br>“Got it.”One by one, the gangs began dispersing—each team heading toward their battlefield.Your destination: The Arena.`],
                              game_title: "You arrived at fighting arena",
                              game_desc: "",
                              actions: [{
                                label: "GET READY TO WORK",
                                next: {
                                  substory: [`You arrived at the Underground Fighting Arena just before sundown.<br>The place wasn’t flashy—just a massive concrete hall deep in North Gangbuk territory. Dim lighting. The air was heavy with sweat, blood, and cheap smoke. You could hear the crowd, chaotic, hungry for violence<br>Inside, the fights were already in full swing<br>One guy was getting dragged out with his nose bent sideways. Another limped off with his corner man holding a towel over his eye.<br>You kept your hood low and didn’t speak to anyone<br>At the registration table, you registerd yoruself using fake name <br>They didn’t know you were a traitor now. but its always better to be cautious<br>Before stepping into the prep area, you pulled out a crumpled paper bag mask—the same one you’d used before. Ripped eye holes, nothing fancy. Just enough to keep your face hidden`,
                                    `<strong>Match Starts</strong><br><br>Your first opponent was already in the ring—shirt off, bouncing on his heels, built like a small tank.<br>They called your fake name. You walked out<br>“What the hell’s with the bag?”<br>“New guy’s got jokes.”<br>You didn’t react.<br><strong>The bell rang!!.</strong>`],
                                  game_title: "Risky battle begins",
                                  game_desc: "Upgrade your stats before the battle",
                                  actions: [{
                                    label: "START",
                                    next: {
                                      battle_sequence: ['NPC1', 'NPC2', 'NPC3'],
                                      win: {
                                        gold: { min: 30, max: 60 },
                                        substory: [`Now you have defeated your opponents now times for the final round<br>By now, the mood had shifted.<br>No one was laughing about the paper bag anymore.<br> Whispers started:“This guy’s for real.”<br>"He defeated all those strong fighter with much effort but that's it"<br>"He still not match for Hong"<br>Someone yelled,“Bring out Jikwang Hong!”<br>And that’s when the doors opened`,
                                          `<strong>Enter: Jikwang Hong</strong><br><br>You turned.<br>Jikwang Hong walked in, casual like he owned the place.<br>Buzzcut. Faded knuckle scars. Broad shoulders, no nonsense in his stride.<br>He looked at you, sizing you up from across the ring<br>“You made it this far with a paper bag on your head,” he said, voice dry.<br>“But this is the end of the road.”<br>You said nothing.<br><br>“Life doesn’t go the way people want,” he muttered.<br>It sounded like more than just trash talk… but you didn’t have time to think about it.<br>The bell rang.`],
                                        battle: 'Jikwang_Hong',
                                        win: {
                                          gold: { min: 80, max: 120 },
                                          substory: [`<strong>You defeated Jikwang Hong,</strong>.`],
                                          game_title: "Choose your rewards",
                                          game_desc: " ",
                                          cards: [{
                                            name: "Limit Breaker", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 60, desc: `Temporarly Buff the user Strength Stat by 50 for 5 turns.<br>SPD +1, TECH +1`,
                                            effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 50, buffDuration: 5, cooldown: 6, usesLimit: 1, gif: "cha/auraa.gif", sound: "cha/sound/aura.wav", gif_target: "player", glowEffect: { color: 'red' },
                                          }, {
                                            name: "CQC", type: "attack", isSealable: true, staminaCost: 65, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1, STR +1`,
                                            effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 145, max: 190 }, cooldown: 9, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
                                            secondaryEffect: {
                                              type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                                            }
                                          }, {
                                            name: "Crushing Python", type: "debuff", subType: "stun", isSealable: true, staminaCost: 80, desc: `Bind the target for 5 Turns with whole stats reduction by 30% <br>DUR+2, STR +1`,
                                            stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/bind.gif", gif_target: "opponent", stunEffectGif: "/cha/stun.gif",
                                            effects: { tech: 2, str: 1, statPoints: 2 },
                                            secondaryEffect: {
                                              type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                            }
                                          }
                                          ],
                                          next_story: {
                                            substory: [`<strong>After the Fight – The Twist</strong><br><br>The fight was over.Jikwang Hong lay on the floor, unconscious. The arena, once roaring with noise, had gone quiet.Little by little The crowd dispersed<br>You leaned against the wall, breathing heavily.<br>“Just one left…” you muttered.<br>“Only Jeongdu Ma remains.”<br>You pulled out your phone and called Han Jaeha, eager to brag.He picked up on the first ring.` <
                                              `<br>Han Jaeha: "What’s up? How’s the attack going?"<br>You: "I already beat No.6. All that’s left is Jeongdu Ma. What about you? Have you even started yet? Heh."<br>Han Jaeha (laughing): "I’m already done here, lol. We’ve defeated everyone."<br>But just as he said that, you heard it — screaming in the background. People crying out in pain.<br>Han Jaeha: "Wait… something’s happening. I’ll call you later."<br>He hung up.<br>A bad feeling crept in.<br><br>You tried calling Seok… but the call wouldn’t go through. No signal. No response.<br>Then—shadows moved. You looked around… and realized you were surrounded.<br>Members of the North, closing in. And leading them was Jeongdu Ma himself.<br>Jeongdu Ma: "You actually made a decent plan to take us down. We already expected this, though."<br>He smirked.<br>Jeongdu Ma: "We had a spy in your team… Seok Kang. South’s so-called leader. Hahaha!"<br>You: "What?? That pig Seok was with North all along?!"<br>Your phone rang again — Han Jaeha’s number.`,
                                              `<br>You picked it up, shouting: "Seok is a traitor—!"<br>But the voice on the other end wasn’t Han Jaeha’s.<br><br>You: "Choyun?! What happened to Han Jaeha?!"<br>Choyun: "Relax. He’s not dead… but he’s not in any condition to answer calls either."<br>Choyun: "Your plan failed. You can’t win. I’ll give you one last chance."<br>Choyun: "Come back and join us… or get killed here and now."<br>What will you do?....`],
                                            game_title: "Last Chance",
                                            game_desc: "Since you've already picked the Suhyeon Kim so its only one choice",
                                            actions: [{
                                              label: "Rejects the offer",
                                              next: {
                                                substory: [`Choyun: "Still taking their side, huh? Even after all this? Fine."<br>"Die then."<br>The call ended. Silence for a moment… then a shift in the air.<br>Jeongdu Ma cracked his knuckles and stepped forward<br>The real fight had begun.`],
                                                battle: 'Jeongdu_Ma',
                                                win: {
                                                  gold: { min: 100, max: 150 },
                                                  substory: [`You defeated Jeongdu Ma`],
                                                  game_title: "Choose your rewards",
                                                  game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                                  cards: [

                                                    {
                                                      name: "Diamond Skin", staminaCost: 70, type: "buff", // This card will appear in your "Buff Cards" list.
                                                      subType: "damage_reduction", // Our new, custom subtype.
                                                      isSealable: true,
                                                      desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 60%.",
                                                      // Optional: also gives a permanent stat boost.
                                                      buffDuration: 10, // The number of turns the effect will last.
                                                      reductionAmount: 0.4, // The multiplier for the damage (0.8 means 20% damage).
                                                      cooldown: 6,
                                                      usesLimit: 1,
                                                      gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                                                      gif_target: "player",
                                                      glowEffect: { color: 'green' }
                                                    }, {
                                                      name: "Infinite Technique", staminaCost: 85, type: "attack", isSealable: true, desc: `The pinnacle of combat mastery. You unleash a flawless, continuous barrage of attacks. Infinite Technique is a storm of martial arts that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                      damage: { min: 250, max: 300 }, cooldown: 8, usesLimit: 2, gif: "cha/rapid punch.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                                                      secondaryEffect: {
                                                        type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "/cha/stun.gif"
                                                      }
                                                    },
                                                    {
                                                      name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 40% of your max HP.`,
                                                      healPercent: 0.40, cooldown: 8, usesLimit: 2,
                                                    }, {
                                                      name: "Ultra Instinct", staminaCost: 60, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 60% when used (Can be stacked)`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", glowEffect: { color: 'black' }
                                                    },

                                                  ],
                                                  next_story: {
                                                    substory: [`You stepped out of the arena, blood still drying on your skin.<br>Jeongdu Ma was down. One of the strongest in the north—defeated. You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. “What happened?”<br>He looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Your eyes narrowed. “So it’s true. That Bastard was with them all along." <br>Suhyeon Kim nodded. “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>You glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                      `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br> On one side of him stood Seok Kang. On the other, Daniel.`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. You stepped forward.<br><br>Suhyeon Kim turned to you. “Let me handle that traitor and Daniel.”<br>You nodded. “Then I’ll take Choyun.”<br>Choyun’s smiled. “Come, then. Show me what you've got”<br><br><strong>The final fight—begins now.</strong>`],
                                                    battle: 'Choyun',
                                                    win: {
                                                      substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                      next_story: {
                                                        substory: ["The End. Thanks for playing!"],
                                                        // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                        onComplete: function () {
                                                          // Prepare and save the player's state for online mode
                                                          const onlineData = {
                                                            playerName: playerName,
                                                            stats: stats,
                                                            cards: playerCards,
                                                            playerCardImage: localStorage.getItem('playerCardImage'),
                                                            playerBattleImage: localStorage.getItem('playerBattleImage')
                                                          };
                                                          localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                          // Show a confirmation and the online button
                                                          showPopup("Online Mode Unlocked!");
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }]
                                          }
                                        }
                                      }
                                    }
                                  }]
                                }
                              }]
                            }
                          }]
                        }
                      }
                    }]
                  }
                }
              }
            }, {
              label: "Ignore",
              next: {
                substory: [`You were still technically a North Gangbuk member. Helping Suhyeon Kim might label you a traitor. <br>You turned to walk away, unsure—until a message buzzed on your phone.<br>From Choyun:"Bring Suhyeon Kim."<br>you went back, stepped between them, and fought Daniel off just enough to stop the fight. Suhyeon Kim looked at you, confused and a little betrayed. That’s when you told him.<br><br>“I’m working with the North. Choyun wants to talk to you.”<br>He didn’t say anything for a second. But then he sighed and nodded. “Alright. I’ll go. But only because it’s you.”<br>`,
                  `You brought him to Choyun’s base and waited outside as they spoke. It felt like an eternity.<br><br>Finally, Suhyeon Kim stepped out<br>“What happened?” you asked.<br>He let out a breath. <br><br>“Choyun wants me to join North. I told him West Gangbuk is unstable right now, for that. He gave me one month to decide.”<br>You looked at him.<br> “So… are you going to join him?”<br>He shook his head.<br> “No. But I need a plan. A real one. We need to hit him with everything we’ve got in just one month.”`
                  , `<br>You didn’t even hesitate. “Then tell me what you need.”<br>Suhyeon Kim said, “We need South Gangbuk to join our alliance. Without them, we don’t have the numbers.”<br><br>You gave a short nod. “Alright. I’ll handle it—even if I have to crack some skulls to make it happen.”<br>He grinned back. “Knew I could count on you.”<br>Things were about to get serious. But at least now… we had a real shot.`],
                game_title: `Forming Alliance `,
                game_desc: ``,
                actions: [{
                  label: "Ready",
                  next: {
                    substory: [`You headed straight into South Gangbuk territory—hostile turf crawling with muscleheads, thugs, and more than a few eyes watching your every move. At the center of it all was Seok Kang, the infamous South leader. Big build, slit eyes, and a permanent smirk that made your fists itch<br><br>You met him face-to-face in one of their open hangars, surrounded by his crew. The guy didn’t even stand up. Just leaned back, arms crossed, grinning like you were some street clown.<br><br>“So, you came all the way here to ask for an alliance with West?” Seok scoffed. “You really think West has the power to move anything? Hah! I rather join the NORTH than to join weaklings ahaha.”<br>You kept your voice cold. “I’m not requesting,” you said.<br> “I’m ordering you to join the alliance.”<br>`
                      , `That made him laugh hard. “You got guts, I’ll give you that. But you want me to listen? Then go through them first.”<br>He snapped his fingers.<br>South Gangbuk’s top executives stepped in, circling around you—cracking knuckles, ready to tear you apart. No backing out now`],
                    battle_sequence: ['Don_gu_Wang', 'Hakjin_Ju', 'Jingu_Oh'],
                    win: {
                      gold: { min: 30, max: 60 },
                      substory: [`You defeated the top South gang members,Then came Seok.<br>Face twisted in rage, he stepped forward, ripping off his jacket.<br> “You’re messing with the wrong guy,” he growled.`],
                      battle: 'Seok_Kang',
                      win: {
                        gold: { min: 30, max: 60 },
                        substory: [`You defeated Seok Kang`],
                        game_title: "You have defeated the strong opponent, Choose your rewards",
                        game_desc: " ",
                        cards: [
                          {
                            name: "Healing bean", type: "buff", subType: "heal", isSealable: true, staminaCost: 35, desc: `Heal for 30% of your max HP with 10% damage reduction.<br> DUR +2`,
                            effects: { dur: 2, statPoints: 4 }, healPercent: 0.30, cooldown: 6, usesLimit: 2,
                            secondaryEffect: {
                              type: "buff", subType: "damage_reduction", // Our new, custom subtype.
                              buffDuration: 3, // The number of turns the effect will last.
                              reductionAmount: 0.90, // The multiplier for the damage (0.8 means 20% damage).
                              gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                              gif_target: "player",
                            }
                          },
                          {
                            name: "Insight", staminaCost: 40, type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Technique Stats by 35 for 3 turns.<br>SPD +1`,
                            effects: { spd: 1, statPoints: 4 }, statToBuff: "tech", buffValue: 35, buffDuration: 3, cooldown: 6, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
                          }, {
                            name: "PileDriver", staminaCost: 55, type: "attack", desc: `A devastating and dangerous maneuver. lifting the opponent, driving their head into the ground with immense force.<br> STR +1`,
                            effects: { str: 1, statPoints: 4 }, damage: { min: 130, max: 180 }, cooldown: 7, gif: "cha/sumo throw.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                            secondaryEffect: {
                              type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                            }
                          }, {
                            name: "Blade Dance", staminaCost: 50, type: "attack", desc: `You weave a mesmerizing and deadly dance with your blade, delivering a flurry of slashes that are as graceful as they are lethal....<br> TECH +1`,
                            effects: { tech: 1, statPoints: 4 }, damage: { min: 150, max: 185 }, cooldown: 8, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                            secondaryEffect: {
                              type: "debuff", subType: "stat_reduction", statToDebuff: "spd", debuffValue: 0.8, debuffDuration: 2
                            }
                          }
                        ],
                        next_story: {
                          substory: [`And after a brutal clash, you had him on the floor, blood on his lip and your fist raised, ready to end it.<br><br>“W-wait!” he shouted. <br>“I’ll join! I’ll join the damn alliance!”<br>You paused, lowered your fist.<br><br>Smart choice.`,
                            `You pulled out your phone and called Suhyeon Kim.<br> “He’s ready to form the alliance.”<br>“Good,” Suhyeon Kim replied, his voice calm but sharp.<br> “Then send him here. And get yourself ready too…”<br>You already knew what was coming.<br>“…the big battle is just around the corner.”`],

                          actions: [{
                            label: "Train Alone",
                            train: true,
                            gold: 50,
                            //////
                            next: {
                              substory: ["You feel your body getting stronger."],
                              effects: { statPoints: 8 },
                              game_title: "Now you are at the END GAME",
                              game_desc: "",
                              actions: [{
                                label: "Continue",
                                effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 8 },
                                next: {
                                  substory: [`It had been a month since you disappeared from the streets.<br> In that time, you'd put everything into getting stronger—mentally and physically.<br> Now, it was time to come back<br>You called Suhyeon Kim, and he told you to come to Western Gangbuk High<br>You expected a quiet meetup.What you found was a full war council<br>You spotted Kang Seok, the Southern Gangbuk leader, standing near the wall with his usual dead-serious expression.<br>Then, near the back, leaning against the wall with his arms crossed and a laid-back look on his face— <br>Han Jaeha, leader of Eastern Gangbuk.<br>You walked over.<br><br>“Long time no see,” Jaeha said with a crooked grin.<br>“Yeah,” you replied. “Feels like forever.”`,
                                    `He asked.<br>“So, you’re with us now? For real?”<br>You nodded.<br>“Yup.”<br>He looked you over, impressed.<br>“Then we’ve got ourselves some serious firepower.”<br>Before more words could be exchanged, Suhyeon Kim entered the room .“Good. Everyone’s here,” he said.`, `<strong>The Plan Begins</strong><br><br>Suhyeon Kim unrolled a large city map over a folding table.<br>“We’ve gathered solid intel on Northern Gangbuk. Their manpower is insane—if we try to storm them head-on, we’ll get crushed.”<br>“Instead, we strike strategically. Four key operations—they’re the heart of North Gangbuk’s underground empire.”<br>he pointed to four marked locations:<br><br>
                                                                                        <ul><li>🎤 Karaoke Bar: “Run by No. 5 Jun Jang, with several elite executives.”</li><li>🥊 Fighting Arena: “The strongest holdout. Controlled by No. 3 Jeongdu Ma and No. 6 Jikwang Hong.”</li><li>🎰 Casino: “Managed by No. 4 Jiwon Seo and No. 8 Jintae Heo.”</li><li>💉 Drug Den: “A dark hole crawling with executive-level enforcers.”</li></ul><br>`
                                    , `Suhyeon Kim continued:“Here’s how we’ll divide our forces.”<br> South Gangbuk, led by Kang Seok and with Seonu Ha, will hit the Drug Den.<br>Han Jaeha and Taeho Cheon from the East will target the Karaoke Bar.<br>I and Uijin Gyeong will take Western forces to the Fighting Arena.<br>You, along with some of our best from West, will handle the Casino.<br><br>But you raised your hand.“Switch me. I’ll take the Arena.”<br>Everyone paused.<br>Suhyeon Kim gave you a look.<br>“That’s the most heavily guarded location. You’d be going straight into the toughest part.”<br>You smirked.“I didn’t spend a month hiding in alleyways and fighting just to play it safe.”<br>Then Suhyeon Kim gave a faint smile.<br>“Alright. Then it’s settled.”`
                                    , `he stepped back and looked at the group.<br>“Once all four targets are neutralized, we regroup. One final assault—on Choyun.”<br><br>Everyone responded in unison:<br>“Got it.”One by one, the gangs began dispersing—each team heading toward their battlefield.Your destination: The Arena.`],
                                  game_title: "You arrived at fighting arena",
                                  game_desc: "",
                                  actions: [{
                                    label: "GET READY TO WORK",
                                    next: {
                                      substory: [`You arrived at the Underground Fighting Arena just before sundown.<br>The place wasn’t flashy—just a massive concrete hall deep in North Gangbuk territory. Dim lighting. The air was heavy with sweat, blood, and cheap smoke. You could hear the crowd, chaotic, hungry for violence<br>Inside, the fights were already in full swing<br>One guy was getting dragged out with his nose bent sideways. Another limped off with his corner man holding a towel over his eye.<br>You kept your hood low and didn’t speak to anyone<br>At the registration table, you registerd yoruself using fake name <br>They didn’t know you were a traitor now. but its always better to be cautious<br>Before stepping into the prep area, you pulled out a crumpled paper bag mask—the same one you’d used before. Ripped eye holes, nothing fancy. Just enough to keep your face hidden`,
                                        `<strong>Match Starts</strong><br><br>Your first opponent was already in the ring—shirt off, bouncing on his heels, built like a small tank.<br>They called your fake name. You walked out<br>“What the hell’s with the bag?”<br>“New guy’s got jokes.”<br>You didn’t react.<br><strong>The bell rang!!.</strong>`],
                                      game_title: "Risky battle begins",
                                      game_desc: "Upgrade your stats before the battle",
                                      actions: [{
                                        label: "START",
                                        next: {
                                          battle_sequence: ['NPC1', 'NPC2', 'NPC3'],
                                          win: {
                                            gold: { min: 30, max: 60 },
                                            substory: [`Now you have defeated your opponents now times for the final round<br>By now, the mood had shifted.<br>No one was laughing about the paper bag anymore.<br> Whispers started:“This guy’s for real.”<br>"He defeated all those strong fighter with much effort but that's it"<br>"He still not match for Hong"<br>Someone yelled,“Bring out Jikwang Hong!”<br>And that’s when the doors opened`,
                                              `<strong>Enter: Jikwang Hong</strong><br><br>You turned.<br>Jikwang Hong walked in, casual like he owned the place.<br>Buzzcut. Faded knuckle scars. Broad shoulders, no nonsense in his stride.<br>He looked at you, sizing you up from across the ring<br>“You made it this far with a paper bag on your head,” he said, voice dry.<br>“But this is the end of the road.”<br>You said nothing.<br><br>“Life doesn’t go the way people want,” he muttered.<br>It sounded like more than just trash talk… but you didn’t have time to think about it.<br>The bell rang.`],
                                            battle: 'Jikwang_Hong',
                                            win: {
                                              gold: { min: 80, max: 120 },
                                              substory: [`<strong>You defeated Jikwang Hong,</strong>.`],
                                              game_title: "Choose your rewards",
                                              game_desc: " ",
                                              cards: [{
                                                name: "Limit Breaker", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 60, desc: `Temporarly Buff the user Strength Stat by 50 for 5 turns.<br>SPD +1, TECH +1`,
                                                effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 50, buffDuration: 5, cooldown: 6, usesLimit: 1, gif: "cha/auraa.gif", sound: "cha/sound/aura.wav", gif_target: "player", glowEffect: { color: 'red' },
                                              }, {
                                                name: "CQC", type: "attack", isSealable: true, staminaCost: 65, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1, STR +1`,
                                                effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 145, max: 190 }, cooldown: 9, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
                                                secondaryEffect: {
                                                  type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                                                }
                                              }, {
                                                name: "Crushing Python", type: "debuff", subType: "stun", isSealable: true, staminaCost: 80, desc: `Bind the target for 5 Turns with whole stats reduction by 30% <br>DUR+2, STR +1`,
                                                stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/bind.gif", gif_target: "opponent", stunEffectGif: "/cha/stun.gif",
                                                effects: { tech: 2, str: 1, statPoints: 2 },
                                                secondaryEffect: {
                                                  type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                                }
                                              }
                                              ],
                                              next_story: {
                                                substory: [`<strong>After the Fight – The Twist</strong><br><br>The fight was over.Jikwang Hong lay on the floor, unconscious. The arena, once roaring with noise, had gone quiet.Little by little The crowd dispersed<br>You leaned against the wall, breathing heavily.<br>“Just one left…” you muttered.<br>“Only Jeongdu Ma remains.”<br>You pulled out your phone and called Han Jaeha, eager to brag.He picked up on the first ring.` <
                                                  `<br>Han Jaeha: "What’s up? How’s the attack going?"<br>You: "I already beat No.6. All that’s left is Jeongdu Ma. What about you? Have you even started yet? Heh."<br>Han Jaeha (laughing): "I’m already done here, lol. We’ve defeated everyone."<br>But just as he said that, you heard it — screaming in the background. People crying out in pain.<br>Han Jaeha: "Wait… something’s happening. I’ll call you later."<br>He hung up.<br>A bad feeling crept in.<br><br>You tried calling Seok… but the call wouldn’t go through. No signal. No response.<br>Then—shadows moved. You looked around… and realized you were surrounded.<br>Members of the North, closing in. And leading them was Jeongdu Ma himself.<br>Jeongdu Ma: "You actually made a decent plan to take us down. We already expected this, though."<br>He smirked.<br>Jeongdu Ma: "We had a spy in your team… Seok Kang. South’s so-called leader. Hahaha!"<br>You: "What?? That pig Seok was with North all along?!"<br>Your phone rang again — Han Jaeha’s number.`,
                                                  `<br>You picked it up, shouting: "Seok is a traitor—!"<br>But the voice on the other end wasn’t Han Jaeha’s.<br><br>You: "Choyun?! What happened to Han Jaeha?!"<br>Choyun: "Relax. He’s not dead… but he’s not in any condition to answer calls either."<br>Choyun: "Your plan failed. You can’t win. I’ll give you one last chance."<br>Choyun: "Come back and join us… or get killed here and now."<br>What will you do?....`],
                                                game_title: "Last Chance",
                                                game_desc: " ",
                                                actions: [{
                                                  label: "Rejects the offer",
                                                  next: {
                                                    substory: [`Choyun: "Still taking their side, huh? Even after all this? Fine."<br>"Die then."<br>The call ended. Silence for a moment… then a shift in the air.<br>Jeongdu Ma cracked his knuckles and stepped forward<br>The real fight had begun.`],
                                                    battle: 'Jeongdu_Ma',
                                                    win: {
                                                      gold: { min: 100, max: 150 },
                                                      substory: [`You defeated Jeongdu Ma`],
                                                      game_title: "Choose your rewards",
                                                      game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                                      cards: [

                                                        {
                                                          name: "Diamond Skin", staminaCost: 70, type: "buff", // This card will appear in your "Buff Cards" list.
                                                          subType: "damage_reduction", // Our new, custom subtype.
                                                          isSealable: true,
                                                          desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 60%.",
                                                          // Optional: also gives a permanent stat boost.
                                                          buffDuration: 10, // The number of turns the effect will last.
                                                          reductionAmount: 0.4, // The multiplier for the damage (0.8 means 20% damage).
                                                          cooldown: 6,
                                                          usesLimit: 1,
                                                          gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                                                          gif_target: "player",
                                                          glowEffect: { color: 'green' }
                                                        }, {
                                                          name: "Infinite Technique", staminaCost: 85, type: "attack", isSealable: true, desc: `The pinnacle of combat mastery. You unleash a flawless, continuous barrage of attacks. Infinite Technique is a storm of martial arts that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                          damage: { min: 250, max: 300 }, cooldown: 8, usesLimit: 2, gif: "cha/rapid punch.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                                                          secondaryEffect: {
                                                            type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "/cha/stun.gif"
                                                          }
                                                        },
                                                        {
                                                          name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 40% of your max HP.`,
                                                          healPercent: 0.40, cooldown: 8, usesLimit: 2,
                                                        }, {
                                                          name: "Ultra Instinct", staminaCost: 60, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 60% when used (Can be stacked)`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", glowEffect: { color: 'black' }
                                                        },

                                                      ],
                                                      next_story: {
                                                        substory: [`You stepped out of the arena, blood still drying on your skin.<br>Jeongdu Ma was down. One of the strongest in the north—defeated. You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. “What happened?”<br>He looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Your eyes narrowed. “So it’s true. That Bastard was with them all along." <br>Suhyeon Kim nodded. “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>You glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                          `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br> On one side of him stood Seok Kang. On the other, Daniel.`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. You stepped forward.<br><br>Suhyeon Kim turned to you. “Let me handle that traitor and Daniel.”<br>You nodded. “Then I’ll take Choyun.”<br>Choyun’s smiled. “Come, then. Show me what you've got”<br><br><strong>The final fight—begins now.</strong>`],
                                                        battle: 'Choyun',
                                                        win: {
                                                          substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                          next_story: {
                                                            substory: ["The End. Thanks for playing!"],
                                                            // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                            onComplete: function () {
                                                              // Prepare and save the player's state for online mode
                                                              const onlineData = {
                                                                playerName: playerName,
                                                                stats: stats,
                                                                cards: playerCards,
                                                                playerCardImage: localStorage.getItem('playerCardImage'),
                                                                playerBattleImage: localStorage.getItem('playerBattleImage')
                                                              };
                                                              localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                              // Show a confirmation and the online button
                                                              showPopup("Online Mode Unlocked!");
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }, {
                                                  label: "Accept the offer",
                                                  next: {
                                                    substory: [`And in that moment, you made your choice.<br>“…Fine. I’ll join.”<br>There was a pause. Then Choyun let out a slow, satisfied laugh.<br>“Smart move. You value your life more than some hopeless war. I respect that. But now that you’ve rejoined us, it’s time you prove it.”<br><br>“…Prove it how?”<br><br>“Take down the remaining West Gang forces. Wipe them out.”<br>You clenched your fists. “I’m not strong enough to take on the entire West side alone.”<br>“You won’t be alone,” Choyun said. “You, Daniel, and Seok. That’ll be enough. But first… call Soohyun. Tell him to meet you. Alone. Somewhere quiet. Make it believable.”<br>You nodded slowly. “…Got it.”<br>You dialed Soohyun’s number. Your hand trembled a bit, but your voice stayed calm.<br>“Meet me at the meeting place. Alone. There’s something I need to tell you… face-to-face.” Soohyun didn’t hesitate. “Alright. I’ll be there.”`,
                                                      `While Soohyun headed into the trap, you, Daniel, and Seok moved through the shadows of Gangbuk’s war-torn backstreets. The only ones left standing in the West were Soohyun’s remaining crew—and Uijin Gyeong. And that was a problem.<br><br>Uijin Gyeong spotted you three approaching and stepped forward, glaring.<br>“What’s this?” he asked, eyes narrowing. “Why are you here… with Seok and Daniel? Where’s Soohyun?”<br>You didn’t answer.<br>A few long seconds passed.<br>Then Uijin’s expression twisted. His voice lowered <br>“So that’s why Han Jaeha isn’t answering his phone…”<br>His fists clenched.<br><strong>“You really betrayed us.”</strong><br>You looked at Seok and Daniel. “Take care of the rest. Leave Uijin to me.”<br>They nodded and rushed into the fray.<br>You stepped toward Uijin, heart pounding, face grim.<br>No turning back now. `],
                                                    battle: 'Uijin_Gyeong',
                                                    win: {
                                                      gold: { min: 100, max: 150 },
                                                      substory: [`You defeated Uijin Gyeong`],
                                                      game_title: "Choose your rewards",
                                                      game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b>",
                                                      cards: [
                                                        {
                                                          name: "Diamond Scale", type: "buff", // This card will appear in your "Buff Cards" list.
                                                          subType: "damage_reduction", // Our new, custom subtype.
                                                          isSealable: true,
                                                          staminaCost: 65,
                                                          desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 45%.",
                                                          // Optional: also gives a permanent stat boost.
                                                          buffDuration: 9, // The number of turns the effect will last.
                                                          reductionAmount: 0.55, // The multiplier for the damage (0.8 means 20% damage).
                                                          cooldown: 6,
                                                          usesLimit: 1,
                                                          gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                                                          gif_target: "player",
                                                          glowEffect: { color: 'green' }
                                                        }, {
                                                          name: "Conviction Mastery", staminaCost: 95, type: "attack", isSealable: true, desc: `The pinnacle of mastery. You unleash a flawless, continuous barrage of powerful attacks. Conviction Strength is a mastery that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                          damage: { min: 280, max: 295 }, cooldown: 7, usesLimit: 2, gif: "cha/vac ppunch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                                                          secondaryEffect: {
                                                            type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "cha/stun.gif"
                                                          }
                                                        },
                                                        {
                                                          name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 36% of your max HP.`,
                                                          healPercent: 0.36, cooldown: 8, usesLimit: 2,
                                                        }, {
                                                          name: "True Ultra Instinct", staminaCost: 70, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 65% when used (Can be stacked)`, buffAmount: 1.65, cooldown: 12, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", sound: "cha/sound/aura.wav", glowEffect: { color: 'black' }
                                                        },],
                                                      next_story: {
                                                        substory: [`You have defeated Uijin but both seok and Daniel are injured and unable to fight, You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. Suheyon asked “What happened?”<br>you looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Suhyeon  eyes narrowed. “So it’s true. That Bastard was with them all along." <br>  “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>Suhyeon glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                          `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br>`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. Choyun smirked "Do you really think He on your side Suheyon"<br><br>Suheyon confused "What? Do you think he betrayed me lol he didnt am i right?" <br><br> you didnt said anything <br> You stepped forward. Suheyon feels betrayed<br><br> Choyun said "Do you think you can handle us both?? haha Give up"<br>You still feeling conflicted...`],
                                                        game_title: `Final battle Final Chance`,
                                                        game_desc: `You still felt conflicted. you can still choose what to do next `,
                                                        // Replace the old actions array with this one
                                                        actions: [{
                                                          label: `Choose to Side with Suheyon kim`,
                                                          next: { // CORRECT: The battle logic is now inside 'next'
                                                            battle: 'Choyun',
                                                            win: {
                                                              substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                              next_story: {
                                                                substory: ["The End. Thanks for playing!"],
                                                                // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                                onComplete: function () {
                                                                  // Prepare and save the player's state for online mode
                                                                  const onlineData = {
                                                                    playerName: playerName,
                                                                    stats: stats,
                                                                    cards: playerCards,
                                                                    playerCardImage: localStorage.getItem('playerCardImage'),
                                                                    playerBattleImage: localStorage.getItem('playerBattleImage')
                                                                  };
                                                                  localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                                  // Show a confirmation and the online button
                                                                  showPopup("Online Mode Unlocked!");
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }, {
                                                          label: `Choose to Side with Choyun`,
                                                          next: { // CORRECT: The battle logic is now inside 'next'
                                                            battle: 'Suheyon_kim',
                                                            win: {
                                                              // Step 1: Tell the story of the victory.
                                                              substory: [
                                                                `You defeated Suheyon,<br>You stood over Suheyon’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Suheyon loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“I never thought… you would be the one to betray me,” he said, voice cracked, barely more than a whisper.<br>You opened your mouth, but no words came out.`,
                                                                `<br>Then—without warning—Choyun stepped forward.<br> He grabbed Soohyun by the throat, lifting him like a doll. Soohyun’s body jerked as Choyun’s uses mana drain on Soohyun, draining every last bit of power he had left<br><br>You stood frozen.You wanted to stop it.<br>But you didn’t.Couldn’t.<br>When Choyun let go, Soohyun crumpled to the ground, nothing more than skin and bones—a husk of the fighter he once was<br>He stretched his arms out as if addressing the entire world.<br>“Gangbuk was just the beginning. Soon, all of Seoul will kneel. The age of gangs? No. This will be a reign. My reign.”`,
                                                                `You had made your choice.<br><br>But as Choyun walked past you, crackling with Sudden power, you realized something:<br>This wasn’t victory.<br>This was the beginning of something far darker.`
                                                              ],
                                                              // Step 2: After the story, trigger the video.
                                                              next_story: {
                                                                end_video: {
                                                                  src: "cha/end-choyun.mp4", // Path to your video file
                                                                  // Step 3: After the video, show the final message.
                                                                  next: {
                                                                    substory: ["The Dark End. Thanks for playing!"],
                                                                    actions: []
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }]
                                                      }
                                                    }
                                                  }
                                                }
                                                ]
                                              }
                                            }
                                          }
                                        }
                                      }]
                                    }
                                  }]
                                }
                              }]
                            }

                          }, {
                            label: "Fight Local Thugs",
                            next: {
                              battle_sequence: ['L_Thug1', 'L_Thug2', 'L_Thug3'],
                              win: {
                                gold: { min: 30, max: 60 },
                                game_title: `You defeated Local bullies`,
                                game_desc: `Choose your reward.`,
                                cards: [{
                                  name: "Stats point reward", desc: `Get the 7 stats point as rewards `,
                                  effects: { statPoints: 7 },
                                }, {
                                  name: "Strength card", desc: `You get sudden leap in Strength<br>STR +8`,
                                  effects: { str: 8 },
                                }, {
                                  name: "Technique card", desc: `You skills ot sharpher<br>STR +8`,
                                  effects: { tech: 8 },
                                }, {
                                  name: "Endurance card", desc: `You get sudden leap in Speed<br>END +8`,
                                  effects: { end: 8 },
                                }],
                                next_story: {
                                  substory: ["You feel your body getting stronger."],

                                  game_title: "Now you are at the END GAME",
                                  game_desc: "",
                                  actions: [{
                                    label: "Continue",
                                    effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 10 },
                                    next: {
                                      substory: [`It had been a month since you disappeared from the streets.<br> In that time, you'd put everything into getting stronger—mentally and physically.<br> Now, it was time to come back<br>You called Suhyeon Kim, and he told you to come to Western Gangbuk High<br>You expected a quiet meetup.What you found was a full war council<br>You spotted Kang Seok, the Southern Gangbuk leader, standing near the wall with his usual dead-serious expression.<br>Then, near the back, leaning against the wall with his arms crossed and a laid-back look on his face— <br>Han Jaeha, leader of Eastern Gangbuk.<br>You walked over.<br><br>“Long time no see,” Jaeha said with a crooked grin.<br>“Yeah,” you replied. “Feels like forever.”`,
                                        `He asked.<br>“So, you’re with us now? For real?”<br>You nodded.<br>“Yup.”<br>He looked you over, impressed.<br>“Then we’ve got ourselves some serious firepower.”<br>Before more words could be exchanged, Suhyeon Kim entered the room .“Good. Everyone’s here,” he said.`, `<strong>The Plan Begins</strong><br><br>Suhyeon Kim unrolled a large city map over a folding table.<br>“We’ve gathered solid intel on Northern Gangbuk. Their manpower is insane—if we try to storm them head-on, we’ll get crushed.”<br>“Instead, we strike strategically. Four key operations—they’re the heart of North Gangbuk’s underground empire.”<br>he pointed to four marked locations:<br><br>
                                                                                                   <ul><li>🎤 Karaoke Bar: “Run by No. 5 Jun Jang, with several elite executives.”</li><li>🥊 Fighting Arena: “The strongest holdout. Controlled by No. 3 Jeongdu Ma and No. 6 Jikwang Hong.”</li><li>🎰 Casino: “Managed by No. 4 Jiwon Seo and No. 8 Jintae Heo.”</li><li>💉 Drug Den: “A dark hole crawling with executive-level enforcers.”</li></ul><br>`
                                        , `Suhyeon Kim continued:“Here’s how we’ll divide our forces.”<br> South Gangbuk, led by Kang Seok and with Seonu Ha, will hit the Drug Den.<br>Han Jaeha and Taeho Cheon from the East will target the Karaoke Bar.<br>I and Uijin Gyeong will take Western forces to the Fighting Arena.<br>You, along with some of our best from West, will handle the Casino.<br><br>But you raised your hand.“Switch me. I’ll take the Arena.”<br>Everyone paused.<br>Suhyeon Kim gave you a look.<br>“That’s the most heavily guarded location. You’d be going straight into the toughest part.”<br>You smirked.“I didn’t spend a month hiding in alleyways and fighting just to play it safe.”<br>Then Suhyeon Kim gave a faint smile.<br>“Alright. Then it’s settled.”`
                                        , `he stepped back and looked at the group.<br>“Once all four targets are neutralized, we regroup. One final assault—on Choyun.”<br><br>Everyone responded in unison:<br>“Got it.”One by one, the gangs began dispersing—each team heading toward their battlefield.Your destination: The Arena.`],
                                      game_title: "You arrived at fighting arena",
                                      game_desc: "",
                                      actions: [{
                                        label: "GET READY TO WORK",
                                        next: {
                                          substory: [`You arrived at the Underground Fighting Arena just before sundown.<br>The place wasn’t flashy—just a massive concrete hall deep in North Gangbuk territory. Dim lighting. The air was heavy with sweat, blood, and cheap smoke. You could hear the crowd, chaotic, hungry for violence<br>Inside, the fights were already in full swing<br>One guy was getting dragged out with his nose bent sideways. Another limped off with his corner man holding a towel over his eye.<br>You kept your hood low and didn’t speak to anyone<br>At the registration table, you registerd yoruself using fake name <br>They didn’t know you were a traitor now. but its always better to be cautious<br>Before stepping into the prep area, you pulled out a crumpled paper bag mask—the same one you’d used before. Ripped eye holes, nothing fancy. Just enough to keep your face hidden`,
                                            `<strong>Match Starts</strong><br><br>Your first opponent was already in the ring—shirt off, bouncing on his heels, built like a small tank.<br>They called your fake name. You walked out<br>“What the hell’s with the bag?”<br>“New guy’s got jokes.”<br>You didn’t react.<br><strong>The bell rang!!.</strong>`],
                                          game_title: "Risky battle begins",
                                          game_desc: "Upgrade your stats before the battle",
                                          actions: [{
                                            label: "START",
                                            next: {
                                              battle_sequence: ['NPC1', 'NPC2', 'NPC3'],
                                              win: {
                                                gold: { min: 30, max: 60 },
                                                substory: [`Now you have defeated your opponents now times for the final round<br>By now, the mood had shifted.<br>No one was laughing about the paper bag anymore.<br> Whispers started:“This guy’s for real.”<br>"He defeated all those strong fighter with much effort but that's it"<br>"He still not match for Hong"<br>Someone yelled,“Bring out Jikwang Hong!”<br>And that’s when the doors opened`,
                                                  `<strong>Enter: Jikwang Hong</strong><br><br>You turned.<br>Jikwang Hong walked in, casual like he owned the place.<br>Buzzcut. Faded knuckle scars. Broad shoulders, no nonsense in his stride.<br>He looked at you, sizing you up from across the ring<br>“You made it this far with a paper bag on your head,” he said, voice dry.<br>“But this is the end of the road.”<br>You said nothing.<br><br>“Life doesn’t go the way people want,” he muttered.<br>It sounded like more than just trash talk… but you didn’t have time to think about it.<br>The bell rang.`],
                                                battle: 'Jikwang_Hong',
                                                win: {
                                                  gold: { min: 80, max: 120 },
                                                  substory: [`<strong>You defeated Jikwang Hong,</strong>.`],
                                                  game_title: "Choose your rewards",
                                                  game_desc: " ",
                                                  cards: [{
                                                    name: "Limit Breaker", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 60, desc: `Temporarly Buff the user Strength Stat by 50 for 5 turns.<br>SPD +1, TECH +1`,
                                                    effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 50, buffDuration: 5, cooldown: 6, usesLimit: 1, gif: "cha/auraa.gif", sound: "cha/sound/aura.wav", gif_target: "player", glowEffect: { color: 'red' },
                                                  }, {
                                                    name: "CQC", type: "attack", isSealable: true, staminaCost: 65, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1, STR +1`,
                                                    effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 145, max: 190 }, cooldown: 9, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
                                                    secondaryEffect: {
                                                      type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                                                    }
                                                  }, {
                                                    name: "Crushing Python", type: "debuff", subType: "stun", isSealable: true, staminaCost: 80, desc: `Bind the target for 5 Turns with whole stats reduction by 30% <br>DUR+2, STR +1`,
                                                    stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/bind.gif", gif_target: "opponent", stunEffectGif: "/cha/stun.gif",
                                                    effects: { tech: 2, str: 1, statPoints: 2 },
                                                    secondaryEffect: {
                                                      type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                                    }
                                                  }
                                                  ],
                                                  next_story: {
                                                    substory: [`<strong>After the Fight – The Twist</strong><br><br>The fight was over.Jikwang Hong lay on the floor, unconscious. The arena, once roaring with noise, had gone quiet.Little by little The crowd dispersed<br>You leaned against the wall, breathing heavily.<br>“Just one left…” you muttered.<br>“Only Jeongdu Ma remains.”<br>You pulled out your phone and called Han Jaeha, eager to brag.He picked up on the first ring.` <
                                                      `<br>Han Jaeha: "What’s up? How’s the attack going?"<br>You: "I already beat No.6. All that’s left is Jeongdu Ma. What about you? Have you even started yet? Heh."<br>Han Jaeha (laughing): "I’m already done here, lol. We’ve defeated everyone."<br>But just as he said that, you heard it — screaming in the background. People crying out in pain.<br>Han Jaeha: "Wait… something’s happening. I’ll call you later."<br>He hung up.<br>A bad feeling crept in.<br><br>You tried calling Seok… but the call wouldn’t go through. No signal. No response.<br>Then—shadows moved. You looked around… and realized you were surrounded.<br>Members of the North, closing in. And leading them was Jeongdu Ma himself.<br>Jeongdu Ma: "You actually made a decent plan to take us down. We already expected this, though."<br>He smirked.<br>Jeongdu Ma: "We had a spy in your team… Seok Kang. South’s so-called leader. Hahaha!"<br>You: "What?? That pig Seok was with North all along?!"<br>Your phone rang again — Han Jaeha’s number.`,
                                                      `<br>You picked it up, shouting: "Seok is a traitor—!"<br>But the voice on the other end wasn’t Han Jaeha’s.<br><br>You: "Choyun?! What happened to Han Jaeha?!"<br>Choyun: "Relax. He’s not dead… but he’s not in any condition to answer calls either."<br>Choyun: "Your plan failed. You can’t win. I’ll give you one last chance."<br>Choyun: "Come back and join us… or get killed here and now."<br>What will you do?....`],
                                                    game_title: "Last Chance",
                                                    game_desc: " ",
                                                    actions: [{
                                                      label: "Rejects the offer",
                                                      next: {
                                                        substory: [`Choyun: "Still taking their side, huh? Even after all this? Fine."<br>"Die then."<br>The call ended. Silence for a moment… then a shift in the air.<br>Jeongdu Ma cracked his knuckles and stepped forward<br>The real fight had begun.`],
                                                        battle: 'Jeongdu_Ma',
                                                        win: {
                                                          gold: { min: 100, max: 150 },
                                                          substory: [`You defeated Jeongdu Ma`],
                                                          game_title: "Choose your rewards",
                                                          game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                                          cards: [

                                                            {
                                                              name: "Diamond Skin", staminaCost: 70, type: "buff", // This card will appear in your "Buff Cards" list.
                                                              subType: "damage_reduction", // Our new, custom subtype.
                                                              isSealable: true,
                                                              desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 60%.",
                                                              // Optional: also gives a permanent stat boost.
                                                              buffDuration: 10, // The number of turns the effect will last.
                                                              reductionAmount: 0.4, // The multiplier for the damage (0.8 means 20% damage).
                                                              cooldown: 6,
                                                              usesLimit: 1,
                                                              gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                                                              gif_target: "player",
                                                              glowEffect: { color: 'green' }
                                                            }, {
                                                              name: "Infinite Technique", staminaCost: 85, type: "attack", isSealable: true, desc: `The pinnacle of combat mastery. You unleash a flawless, continuous barrage of attacks. Infinite Technique is a storm of martial arts that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                              damage: { min: 250, max: 300 }, cooldown: 8, usesLimit: 2, gif: "cha/rapid punch.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                                                              secondaryEffect: {
                                                                type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "/cha/stun.gif"
                                                              }
                                                            },
                                                            {
                                                              name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 40% of your max HP.`,
                                                              healPercent: 0.40, cooldown: 8, usesLimit: 2,
                                                            }, {
                                                              name: "Ultra Instinct", staminaCost: 60, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 60% when used (Can be stacked)`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", glowEffect: { color: 'black' }
                                                            },

                                                          ],
                                                          next_story: {
                                                            substory: [`You stepped out of the arena, blood still drying on your skin.<br>Jeongdu Ma was down. One of the strongest in the north—defeated. You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. “What happened?”<br>He looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Your eyes narrowed. “So it’s true. That Bastard was with them all along." <br>Suhyeon Kim nodded. “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>You glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                              `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br> On one side of him stood Seok Kang. On the other, Daniel.`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. You stepped forward.<br><br>Suhyeon Kim turned to you. “Let me handle that traitor and Daniel.”<br>You nodded. “Then I’ll take Choyun.”<br>Choyun’s smiled. “Come, then. Show me what you've got”<br><br><strong>The final fight—begins now.</strong>`],
                                                            battle: 'Choyun',
                                                            win: {
                                                              substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                              next_story: {
                                                                substory: ["The End. Thanks for playing!"],
                                                                // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                                onComplete: function () {
                                                                  // Prepare and save the player's state for online mode
                                                                  const onlineData = {
                                                                    playerName: playerName,
                                                                    stats: stats,
                                                                    cards: playerCards,
                                                                    playerCardImage: localStorage.getItem('playerCardImage'),
                                                                    playerBattleImage: localStorage.getItem('playerBattleImage')
                                                                  };
                                                                  localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                                  // Show a confirmation and the online button
                                                                  showPopup("Online Mode Unlocked!");
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }, {
                                                      label: "Accept the offer",
                                                      next: {
                                                        substory: [`And in that moment, you made your choice.<br>“…Fine. I’ll join.”<br>There was a pause. Then Choyun let out a slow, satisfied laugh.<br>“Smart move. You value your life more than some hopeless war. I respect that. But now that you’ve rejoined us, it’s time you prove it.”<br><br>“…Prove it how?”<br><br>“Take down the remaining West Gang forces. Wipe them out.”<br>You clenched your fists. “I’m not strong enough to take on the entire West side alone.”<br>“You won’t be alone,” Choyun said. “You, Daniel, and Seok. That’ll be enough. But first… call Soohyun. Tell him to meet you. Alone. Somewhere quiet. Make it believable.”<br>You nodded slowly. “…Got it.”<br>You dialed Soohyun’s number. Your hand trembled a bit, but your voice stayed calm.<br>“Meet me at the meeting place. Alone. There’s something I need to tell you… face-to-face.” Soohyun didn’t hesitate. “Alright. I’ll be there.”`,
                                                          `While Soohyun headed into the trap, you, Daniel, and Seok moved through the shadows of Gangbuk’s war-torn backstreets. The only ones left standing in the West were Soohyun’s remaining crew—and Uijin Gyeong. And that was a problem.<br><br>Uijin Gyeong spotted you three approaching and stepped forward, glaring.<br>“What’s this?” he asked, eyes narrowing. “Why are you here… with Seok and Daniel? Where’s Soohyun?”<br>You didn’t answer.<br>A few long seconds passed.<br>Then Uijin’s expression twisted. His voice lowered <br>“So that’s why Han Jaeha isn’t answering his phone…”<br>His fists clenched.<br><strong>“You really betrayed us.”</strong><br>You looked at Seok and Daniel. “Take care of the rest. Leave Uijin to me.”<br>They nodded and rushed into the fray.<br>You stepped toward Uijin, heart pounding, face grim.<br>No turning back now. `],
                                                        battle: 'Uijin_Gyeong',
                                                        win: {
                                                          gold: { min: 100, max: 150 },
                                                          substory: [`You defeated Uijin Gyeong`],
                                                          game_title: "Choose your rewards",
                                                          game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                                          cards: [
                                                            {
                                                              name: "Diamond Scale", type: "buff", // This card will appear in your "Buff Cards" list.
                                                              subType: "damage_reduction", // Our new, custom subtype.
                                                              isSealable: true,
                                                              staminaCost: 65,
                                                              desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 45%.",
                                                              // Optional: also gives a permanent stat boost.
                                                              buffDuration: 9, // The number of turns the effect will last.
                                                              reductionAmount: 0.55, // The multiplier for the damage (0.8 means 20% damage).
                                                              cooldown: 6,
                                                              usesLimit: 1,
                                                              gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                                                              gif_target: "player",
                                                              glowEffect: { color: 'green' }
                                                            }, {
                                                              name: "Conviction Mastery", staminaCost: 95, type: "attack", isSealable: true, desc: `The pinnacle of mastery. You unleash a flawless, continuous barrage of powerful attacks. Conviction Strength is a mastery that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                              damage: { min: 280, max: 295 }, cooldown: 7, usesLimit: 2, gif: "cha/vac ppunch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                                                              secondaryEffect: {
                                                                type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "cha/stun.gif"
                                                              }
                                                            },
                                                            {
                                                              name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 36% of your max HP.`,
                                                              healPercent: 0.36, cooldown: 8, usesLimit: 2,
                                                            }, {
                                                              name: "True Ultra Instinct", staminaCost: 70, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 65% when used (Can be stacked)`, buffAmount: 1.65, cooldown: 12, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", sound: "cha/sound/aura.wav", glowEffect: { color: 'black' }
                                                            },],
                                                          next_story: {
                                                            substory: [`You have defeated Uijin but both seok and Daniel are injured and unable to fight, You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. Suheyon asked “What happened?”<br>you looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Suhyeon  eyes narrowed. “So it’s true. That Bastard was with them all along." <br>  “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>Suhyeon glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                              `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br>`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. Choyun smirked "Do you really think He on your side Suheyon"<br><br>Suheyon confused "What? Do you think he betrayed me lol he didnt am i right?" <br><br> you didnt said anything <br> You stepped forward. Suheyon feels betrayed<br><br> Choyun said "Do you think you can handle us both?? haha Give up"<br>You still feeling conflicted...`],
                                                            game_title: `Final battle Final Chance`,
                                                            game_desc: `You still felt conflicted. you can still choose what to do next `,
                                                            // Replace the old actions array with this one
                                                            actions: [{
                                                              label: `Choose to Side with Suheyon kim`,
                                                              next: { // CORRECT: The battle logic is now inside 'next'
                                                                battle: 'Choyun',
                                                                win: {
                                                                  substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                                  next_story: {
                                                                    substory: ["The End. Thanks for playing!"],
                                                                    // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                                    onComplete: function () {
                                                                      // Prepare and save the player's state for online mode
                                                                      const onlineData = {
                                                                        playerName: playerName,
                                                                        stats: stats,
                                                                        cards: playerCards,
                                                                        playerCardImage: localStorage.getItem('playerCardImage'),
                                                                        playerBattleImage: localStorage.getItem('playerBattleImage')
                                                                      };
                                                                      localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                                      // Show a confirmation and the online button
                                                                      showPopup("Online Mode Unlocked!");
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }, {
                                                              label: `Choose to Side with Choyun`,
                                                              next: { // CORRECT: The battle logic is now inside 'next'
                                                                battle: 'Suheyon_kim',
                                                                win: {
                                                                  // Step 1: Tell the story of the victory.
                                                                  substory: [
                                                                    `You defeated Suheyon,<br>You stood over Suheyon’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Suheyon loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“I never thought… you would be the one to betray me,” he said, voice cracked, barely more than a whisper.<br>You opened your mouth, but no words came out.`,
                                                                    `<br>Then—without warning—Choyun stepped forward.<br> He grabbed Soohyun by the throat, lifting him like a doll. Soohyun’s body jerked as Choyun’s uses mana drain on Soohyun, draining every last bit of power he had left<br><br>You stood frozen.You wanted to stop it.<br>But you didn’t.Couldn’t.<br>When Choyun let go, Soohyun crumpled to the ground, nothing more than skin and bones—a husk of the fighter he once was<br>He stretched his arms out as if addressing the entire world.<br>“Gangbuk was just the beginning. Soon, all of Seoul will kneel. The age of gangs? No. This will be a reign. My reign.”`,
                                                                    `You had made your choice.<br><br>But as Choyun walked past you, crackling with Sudden power, you realized something:<br>This wasn’t victory.<br>This was the beginning of something far darker.`
                                                                  ],
                                                                  // Step 2: After the story, trigger the video.
                                                                  next_story: {
                                                                    end_video: {
                                                                      src: "cha/end-choyun.mp4", // Path to your video file
                                                                      // Step 3: After the video, show the final message.
                                                                      next: {
                                                                        substory: ["The Dark End. Thanks for playing!"],
                                                                        actions: []
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }]
                                                          }
                                                        }
                                                      }
                                                    }
                                                    ]
                                                  }
                                                }
                                              }
                                            }
                                          }]
                                        }
                                      }]
                                    }
                                  }]
                                }

                              }
                            }
                          }, {
                            label: "Help Han Jaeha",
                            race: true,
                            win: {
                              gold: 30,
                              game_title: "DELIVERY SUCCESS",
                              game_desc: "You have proven your worth The system grants you rewards.",
                              cards: [{
                                name: "Stats point reward", desc: `Get the 7 stats point as rewards `,
                                effects: { statPoints: 7 },
                              }, {
                                name: "Strength card", desc: `You get sudden leap in Strength<br>STR +8`,
                                effects: { str: 8 },
                              }, {
                                name: "Technique card", desc: `You skills ot sharpher<br>STR +8`,
                                effects: { tech: 8 },
                              }, {
                                name: "Endurance card", desc: `You get sudden leap in Speed<br>END +8`,
                                effects: { end: 8 },
                              }],
                              ////
                              next_story: {
                                substory: ["You feel your body getting stronger."],
                                game_title: "Now you are at the END GAME",
                                game_desc: "",
                                actions: [{
                                  label: "Continue",
                                  effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 10 },
                                  next: {
                                    substory: [`It had been a month since you disappeared from the streets.<br> In that time, you'd put everything into getting stronger—mentally and physically.<br> Now, it was time to come back<br>You called Suhyeon Kim, and he told you to come to Western Gangbuk High<br>You expected a quiet meetup.What you found was a full war council<br>You spotted Kang Seok, the Southern Gangbuk leader, standing near the wall with his usual dead-serious expression.<br>Then, near the back, leaning against the wall with his arms crossed and a laid-back look on his face— <br>Han Jaeha, leader of Eastern Gangbuk.<br>You walked over.<br><br>“Long time no see,” Jaeha said with a crooked grin.<br>“Yeah,” you replied. “Feels like forever.”`,
                                      `He asked.<br>“So, you’re with us now? For real?”<br>You nodded.<br>“Yup.”<br>He looked you over, impressed.<br>“Then we’ve got ourselves some serious firepower.”<br>Before more words could be exchanged, Suhyeon Kim entered the room .“Good. Everyone’s here,” he said.`, `<strong>The Plan Begins</strong><br><br>Suhyeon Kim unrolled a large city map over a folding table.<br>“We’ve gathered solid intel on Northern Gangbuk. Their manpower is insane—if we try to storm them head-on, we’ll get crushed.”<br>“Instead, we strike strategically. Four key operations—they’re the heart of North Gangbuk’s underground empire.”<br>he pointed to four marked locations:<br><br>
                                                                                        <ul><li>🎤 Karaoke Bar: “Run by No. 5 Jun Jang, with several elite executives.”</li><li>🥊 Fighting Arena: “The strongest holdout. Controlled by No. 3 Jeongdu Ma and No. 6 Jikwang Hong.”</li><li>🎰 Casino: “Managed by No. 4 Jiwon Seo and No. 8 Jintae Heo.”</li><li>💉 Drug Den: “A dark hole crawling with executive-level enforcers.”</li></ul><br>`
                                      , `Suhyeon Kim continued:“Here’s how we’ll divide our forces.”<br> South Gangbuk, led by Kang Seok and with Seonu Ha, will hit the Drug Den.<br>Han Jaeha and Taeho Cheon from the East will target the Karaoke Bar.<br>I and Uijin Gyeong will take Western forces to the Fighting Arena.<br>You, along with some of our best from West, will handle the Casino.<br><br>But you raised your hand.“Switch me. I’ll take the Arena.”<br>Everyone paused.<br>Suhyeon Kim gave you a look.<br>“That’s the most heavily guarded location. You’d be going straight into the toughest part.”<br>You smirked.“I didn’t spend a month hiding in alleyways and fighting just to play it safe.”<br>Then Suhyeon Kim gave a faint smile.<br>“Alright. Then it’s settled.”`
                                      , `he stepped back and looked at the group.<br>“Once all four targets are neutralized, we regroup. One final assault—on Choyun.”<br><br>Everyone responded in unison:<br>“Got it.”One by one, the gangs began dispersing—each team heading toward their battlefield.Your destination: The Arena.`],
                                    game_title: "You arrived at fighting arena",
                                    game_desc: "",
                                    actions: [{
                                      label: "GET READY TO WORK",
                                      next: {
                                        substory: [`You arrived at the Underground Fighting Arena just before sundown.<br>The place wasn’t flashy—just a massive concrete hall deep in North Gangbuk territory. Dim lighting. The air was heavy with sweat, blood, and cheap smoke. You could hear the crowd, chaotic, hungry for violence<br>Inside, the fights were already in full swing<br>One guy was getting dragged out with his nose bent sideways. Another limped off with his corner man holding a towel over his eye.<br>You kept your hood low and didn’t speak to anyone<br>At the registration table, you registerd yoruself using fake name <br>They didn’t know you were a traitor now. but its always better to be cautious<br>Before stepping into the prep area, you pulled out a crumpled paper bag mask—the same one you’d used before. Ripped eye holes, nothing fancy. Just enough to keep your face hidden`,
                                          `<strong>Match Starts</strong><br><br>Your first opponent was already in the ring—shirt off, bouncing on his heels, built like a small tank.<br>They called your fake name. You walked out<br>“What the hell’s with the bag?”<br>“New guy’s got jokes.”<br>You didn’t react.<br><strong>The bell rang!!.</strong>`],
                                        game_title: "Risky battle begins",
                                        game_desc: "Upgrade your stats before the battle",
                                        actions: [{
                                          label: "START",
                                          next: {
                                            battle_sequence: ['NPC1', 'NPC2', 'NPC3'],
                                            win: {
                                              gold: { min: 30, max: 60 },
                                              substory: [`Now you have defeated your opponents now times for the final round<br>By now, the mood had shifted.<br>No one was laughing about the paper bag anymore.<br> Whispers started:“This guy’s for real.”<br>"He defeated all those strong fighter with much effort but that's it"<br>"He still not match for Hong"<br>Someone yelled,“Bring out Jikwang Hong!”<br>And that’s when the doors opened`,
                                                `<strong>Enter: Jikwang Hong</strong><br><br>You turned.<br>Jikwang Hong walked in, casual like he owned the place.<br>Buzzcut. Faded knuckle scars. Broad shoulders, no nonsense in his stride.<br>He looked at you, sizing you up from across the ring<br>“You made it this far with a paper bag on your head,” he said, voice dry.<br>“But this is the end of the road.”<br>You said nothing.<br><br>“Life doesn’t go the way people want,” he muttered.<br>It sounded like more than just trash talk… but you didn’t have time to think about it.<br>The bell rang.`],
                                              battle: 'Jikwang_Hong',
                                              win: {
                                                gold: { min: 80, max: 120 },
                                                substory: [`<strong>You defeated Jikwang Hong,</strong>.`],
                                                game_title: "Choose your rewards",
                                                game_desc: " ",
                                                cards: [{
                                                  name: "Limit Breaker", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 60, desc: `Temporarly Buff the user Strength Stat by 50 for 5 turns.<br>SPD +1, TECH +1`,
                                                  effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 50, buffDuration: 5, cooldown: 6, usesLimit: 1, gif: "cha/auraa.gif", sound: "cha/sound/aura.wav", gif_target: "player", glowEffect: { color: 'red' },
                                                }, {
                                                  name: "CQC", type: "attack", isSealable: true, staminaCost: 65, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1, STR +1`,
                                                  effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 145, max: 190 }, cooldown: 9, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
                                                  secondaryEffect: {
                                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                                                  }
                                                }, {
                                                  name: "Crushing Python", type: "debuff", subType: "stun", isSealable: true, staminaCost: 80, desc: `Bind the target for 5 Turns with whole stats reduction by 30% <br>DUR+2, STR +1`,
                                                  stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/bind.gif", gif_target: "opponent", stunEffectGif: "/cha/stun.gif",
                                                  effects: { tech: 2, str: 1, statPoints: 2 },
                                                  secondaryEffect: {
                                                    type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                                  }
                                                }
                                                ],
                                                next_story: {
                                                  substory: [`<strong>After the Fight – The Twist</strong><br><br>The fight was over.Jikwang Hong lay on the floor, unconscious. The arena, once roaring with noise, had gone quiet.Little by little The crowd dispersed<br>You leaned against the wall, breathing heavily.<br>“Just one left…” you muttered.<br>“Only Jeongdu Ma remains.”<br>You pulled out your phone and called Han Jaeha, eager to brag.He picked up on the first ring.` <
                                                    `<br>Han Jaeha: "What’s up? How’s the attack going?"<br>You: "I already beat No.6. All that’s left is Jeongdu Ma. What about you? Have you even started yet? Heh."<br>Han Jaeha (laughing): "I’m already done here, lol. We’ve defeated everyone."<br>But just as he said that, you heard it — screaming in the background. People crying out in pain.<br>Han Jaeha: "Wait… something’s happening. I’ll call you later."<br>He hung up.<br>A bad feeling crept in.<br><br>You tried calling Seok… but the call wouldn’t go through. No signal. No response.<br>Then—shadows moved. You looked around… and realized you were surrounded.<br>Members of the North, closing in. And leading them was Jeongdu Ma himself.<br>Jeongdu Ma: "You actually made a decent plan to take us down. We already expected this, though."<br>He smirked.<br>Jeongdu Ma: "We had a spy in your team… Seok Kang. South’s so-called leader. Hahaha!"<br>You: "What?? That pig Seok was with North all along?!"<br>Your phone rang again — Han Jaeha’s number.`,
                                                    `<br>You picked it up, shouting: "Seok is a traitor—!"<br>But the voice on the other end wasn’t Han Jaeha’s.<br><br>You: "Choyun?! What happened to Han Jaeha?!"<br>Choyun: "Relax. He’s not dead… but he’s not in any condition to answer calls either."<br>Choyun: "Your plan failed. You can’t win. I’ll give you one last chance."<br>Choyun: "Come back and join us… or get killed here and now."<br>What will you do?....`],
                                                  game_title: "Last Chance",
                                                  game_desc: " ",
                                                  actions: [{
                                                    label: "Rejects the offer",
                                                    next: {
                                                      substory: [`Choyun: "Still taking their side, huh? Even after all this? Fine."<br>"Die then."<br>The call ended. Silence for a moment… then a shift in the air.<br>Jeongdu Ma cracked his knuckles and stepped forward<br>The real fight had begun.`],
                                                      battle: 'Jeongdu_Ma',
                                                      win: {
                                                        gold: { min: 100, max: 150 },
                                                        substory: [`You defeated Jeongdu Ma`],
                                                        game_title: "Choose your rewards",
                                                        game_desc: " <b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b>",
                                                        cards: [

                                                          {
                                                            name: "Diamond Skin", staminaCost: 70, type: "buff", // This card will appear in your "Buff Cards" list.
                                                            subType: "damage_reduction", // Our new, custom subtype.
                                                            isSealable: true,
                                                            desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 60%.",
                                                            // Optional: also gives a permanent stat boost.
                                                            buffDuration: 10, // The number of turns the effect will last.
                                                            reductionAmount: 0.4, // The multiplier for the damage (0.8 means 20% damage).
                                                            cooldown: 6,
                                                            usesLimit: 1,
                                                            gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                                                            gif_target: "player",
                                                            glowEffect: { color: 'green' }
                                                          }, {
                                                            name: "Infinite Technique", staminaCost: 85, type: "attack", isSealable: true, desc: `The pinnacle of combat mastery. You unleash a flawless, continuous barrage of attacks. Infinite Technique is a storm of martial arts that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                            damage: { min: 250, max: 300 }, cooldown: 8, usesLimit: 2, gif: "cha/rapid punch.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                                                            secondaryEffect: {
                                                              type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "/cha/stun.gif"
                                                            }
                                                          },
                                                          {
                                                            name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 40% of your max HP.`,
                                                            healPercent: 0.40, cooldown: 8, usesLimit: 2,
                                                          }, {
                                                            name: "Ultra Instinct", staminaCost: 60, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 60% when used (Can be stacked)`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", glowEffect: { color: 'black' }
                                                          },

                                                        ],
                                                        next_story: {
                                                          substory: [`You stepped out of the arena, blood still drying on your skin.<br>Jeongdu Ma was down. One of the strongest in the north—defeated. You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. “What happened?”<br>He looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Your eyes narrowed. “So it’s true. That Bastard was with them all along." <br>Suhyeon Kim nodded. “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>You glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                            `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br> On one side of him stood Seok Kang. On the other, Daniel.`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. You stepped forward.<br><br>Suhyeon Kim turned to you. “Let me handle that traitor and Daniel.”<br>You nodded. “Then I’ll take Choyun.”<br>Choyun’s smiled. “Come, then. Show me what you've got”<br><br><strong>The final fight—begins now.</strong>`],
                                                          battle: 'Choyun',
                                                          win: {
                                                            substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                            next_story: {
                                                              substory: ["The End. Thanks for playing!"],
                                                              // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                              onComplete: function () {
                                                                // Prepare and save the player's state for online mode
                                                                const onlineData = {
                                                                  playerName: playerName,
                                                                  stats: stats,
                                                                  cards: playerCards,
                                                                  playerCardImage: localStorage.getItem('playerCardImage'),
                                                                  playerBattleImage: localStorage.getItem('playerBattleImage')
                                                                };
                                                                localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                                // Show a confirmation and the online button
                                                                showPopup("Online Mode Unlocked!");
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }, {
                                                    label: "Accept the offer",
                                                    next: {
                                                      substory: [`And in that moment, you made your choice.<br>“…Fine. I’ll join.”<br>There was a pause. Then Choyun let out a slow, satisfied laugh.<br>“Smart move. You value your life more than some hopeless war. I respect that. But now that you’ve rejoined us, it’s time you prove it.”<br><br>“…Prove it how?”<br><br>“Take down the remaining West Gang forces. Wipe them out.”<br>You clenched your fists. “I’m not strong enough to take on the entire West side alone.”<br>“You won’t be alone,” Choyun said. “You, Daniel, and Seok. That’ll be enough. But first… call Soohyun. Tell him to meet you. Alone. Somewhere quiet. Make it believable.”<br>You nodded slowly. “…Got it.”<br>You dialed Soohyun’s number. Your hand trembled a bit, but your voice stayed calm.<br>“Meet me at the meeting place. Alone. There’s something I need to tell you… face-to-face.” Soohyun didn’t hesitate. “Alright. I’ll be there.”`,
                                                        `While Soohyun headed into the trap, you, Daniel, and Seok moved through the shadows of Gangbuk’s war-torn backstreets. The only ones left standing in the West were Soohyun’s remaining crew—and Uijin Gyeong. And that was a problem.<br><br>Uijin Gyeong spotted you three approaching and stepped forward, glaring.<br>“What’s this?” he asked, eyes narrowing. “Why are you here… with Seok and Daniel? Where’s Soohyun?”<br>You didn’t answer.<br>A few long seconds passed.<br>Then Uijin’s expression twisted. His voice lowered <br>“So that’s why Han Jaeha isn’t answering his phone…”<br>His fists clenched.<br><strong>“You really betrayed us.”</strong><br>You looked at Seok and Daniel. “Take care of the rest. Leave Uijin to me.”<br>They nodded and rushed into the fray.<br>You stepped toward Uijin, heart pounding, face grim.<br>No turning back now. `],
                                                      battle: 'Uijin_Gyeong',
                                                      win: {
                                                        gold: { min: 100, max: 150 },
                                                        substory: [`You defeated Uijin Gyeong`],
                                                        game_title: "Choose your rewards",
                                                        game_desc: " <b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b>",
                                                        cards: [
                                                          {
                                                            name: "Diamond Scale", type: "buff", // This card will appear in your "Buff Cards" list.
                                                            subType: "damage_reduction", // Our new, custom subtype.
                                                            isSealable: true,
                                                            staminaCost: 65,
                                                            desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 45%.",
                                                            // Optional: also gives a permanent stat boost.
                                                            buffDuration: 9, // The number of turns the effect will last.
                                                            reductionAmount: 0.55, // The multiplier for the damage (0.8 means 20% damage).
                                                            cooldown: 6,
                                                            usesLimit: 1,
                                                            gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                                                            gif_target: "player",
                                                            glowEffect: { color: 'green' }
                                                          }, {
                                                            name: "Conviction Mastery", staminaCost: 95, type: "attack", isSealable: true, desc: `The pinnacle of mastery. You unleash a flawless, continuous barrage of powerful attacks. Conviction Strength is a mastery that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                            damage: { min: 280, max: 295 }, cooldown: 7, usesLimit: 2, gif: "cha/vac ppunch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                                                            secondaryEffect: {
                                                              type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "cha/stun.gif"
                                                            }
                                                          },
                                                          {
                                                            name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 36% of your max HP.`,
                                                            healPercent: 0.36, cooldown: 8, usesLimit: 2,
                                                          }, {
                                                            name: "True Ultra Instinct", staminaCost: 70, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 65% when used (Can be stacked)`, buffAmount: 1.65, cooldown: 12, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", sound: "cha/sound/aura.wav", glowEffect: { color: 'black' }
                                                          },],
                                                        next_story: {
                                                          substory: [`You have defeated Uijin but both seok and Daniel are injured and unable to fight, You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. Suheyon asked “What happened?”<br>you looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Suhyeon  eyes narrowed. “So it’s true. That Bastard was with them all along." <br>  “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>Suhyeon glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                            `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br>`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. Choyun smirked "Do you really think He on your side Suheyon"<br><br>Suheyon confused "What? Do you think he betrayed me lol he didnt am i right?" <br><br> you didnt said anything <br> You stepped forward. Suheyon feels betrayed<br><br> Choyun said "Do you think you can handle us both?? haha Give up"<br>You still feeling conflicted...`],
                                                          game_title: `Final battle Final Chance`,
                                                          game_desc: `You still felt conflicted. you can still choose what to do next `,
                                                          // Replace the old actions array with this one
                                                          actions: [{
                                                            label: `Choose to Side with Suheyon kim`,
                                                            next: { // CORRECT: The battle logic is now inside 'next'
                                                              battle: 'Choyun',
                                                              win: {
                                                                substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                                next_story: {
                                                                  substory: ["The End. Thanks for playing!"],
                                                                  // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                                  onComplete: function () {
                                                                    // Prepare and save the player's state for online mode
                                                                    const onlineData = {
                                                                      playerName: playerName,
                                                                      stats: stats,
                                                                      cards: playerCards,
                                                                      playerCardImage: localStorage.getItem('playerCardImage'),
                                                                      playerBattleImage: localStorage.getItem('playerBattleImage')
                                                                    };
                                                                    localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                                    // Show a confirmation and the online button
                                                                    showPopup("Online Mode Unlocked!");
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }, {
                                                            label: `Choose to Side with Choyun`,
                                                            next: { // CORRECT: The battle logic is now inside 'next'
                                                              battle: 'Suheyon_kim',
                                                              win: {
                                                                // Step 1: Tell the story of the victory.
                                                                substory: [
                                                                  `You defeated Suheyon,<br>You stood over Suheyon’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Suheyon loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“I never thought… you would be the one to betray me,” he said, voice cracked, barely more than a whisper.<br>You opened your mouth, but no words came out.`,
                                                                  `<br>Then—without warning—Choyun stepped forward.<br> He grabbed Soohyun by the throat, lifting him like a doll. Soohyun’s body jerked as Choyun’s uses mana drain on Soohyun, draining every last bit of power he had left<br><br>You stood frozen.You wanted to stop it.<br>But you didn’t.Couldn’t.<br>When Choyun let go, Soohyun crumpled to the ground, nothing more than skin and bones—a husk of the fighter he once was<br>He stretched his arms out as if addressing the entire world.<br>“Gangbuk was just the beginning. Soon, all of Seoul will kneel. The age of gangs? No. This will be a reign. My reign.”`,
                                                                  `You had made your choice.<br><br>But as Choyun walked past you, crackling with Sudden power, you realized something:<br>This wasn’t victory.<br>This was the beginning of something far darker.`
                                                                ],
                                                                // Step 2: After the story, trigger the video.
                                                                next_story: {
                                                                  end_video: {
                                                                    src: "cha/end-choyun.mp4", // Path to your video file
                                                                    // Step 3: After the video, show the final message.
                                                                    next: {
                                                                      substory: ["The Dark End. Thanks for playing!"],
                                                                      actions: []
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }]
                                                        }
                                                      }
                                                    }
                                                  }
                                                  ]
                                                }
                                              }
                                            }
                                          }
                                        }]
                                      }
                                    }]
                                  }
                                }]
                              }
                            }
                          }]
                        }

                      }
                    }
                  }
                }]
              }

            }]
          }
        }
      }
    }
      ///////
      , {
      label: "Train Alone",
      train: true,
      gold: 50,
      next: {
        substory: ["Traning Alone has raises you body strength "],
        effects: { str: 1, end: 1, tech: 1, dur: 1, spd: 1, biq: 1, statPoints: 4 },
        next_story: {
          substory: [`<strong>Two Months Later – Trying to Move On</strong><br><br>You fought thugs, sparred at local gyms, sharpened your body. You tried to forget. To bury it.<br>But every time you closed your eyes, that image returned: Sechan Kang’s body shriveling... that creature behind Choyun.`, `So finally, one morning, you packed a bag.<br><br><strong>[Destination: Gangbuk Resort – North Gangbuk's Mountain Retreat.]</strong><br><br>A trip to clear your mind. Breathe fresh air. Find peace`
            , `Arrival at Gangbuk Resort~<br><br>The resort was quiet. Clean air. Cold breeze. The scent of pine and hot springs<br>You checked in. Room 207<br>You left your bag, changed into something light, and stepped outside<br>For the first time in months, the world felt still<br>No gangs. No fights. No monsters<br>But peace doesn’t last long, does it?...`,
            `<strong>Loud Voices in the Hallway</strong><br><br>You heard laughter, footsteps, and the thud of luggage bumping against walls. Curious, you opened your door.<br>A group stood outside the room opposite yours. One of them waved.<br>“Hey! We’re staying across from you. I’m Suhyeon Kim.”<br>He introduced his friends one by one<br>Suhyeon smiled.<br><br>“If you’re here alone, wanna join us? It’s just for fun.”<br>you hesitated but <br>“Sure,” you said. “Why not?”`
            , `<strong>Day at the Beach</strong><br><br>The afternoon was full of chaotic joy,You didn’t expect much from the beach. Maybe some peace and a quiet swim.<br>Instead, you got total chaos—and somehow, it was exactly what you needed.<br>Gukja, full of energy and overconfidence, grabbed a beach ball and shouted<br>“Alright! Watch this pro-level serve!”<br>He threw it high into the air, ran back for a running jump……and mistimed everything<br>The ball bounced off a wave of wind, curved like it had a grudge, and smacked directly into Gukja’s face mid-dash.<br>Thwop!!<br><br>The group exploded with laughter<br>We spent the whole afternoon messing around—swimming, splashing water at each other like kids; building sandcastles, most of which either collapsed or somehow turned into weird-looking sea creatures; and playing watermelon splitting, where half the fun was watching everyone miss wildly and nearly knock each other out instead of hitting the fruit.`, `That night, they invited you to their room. Card games turned into weird punishments—one round had you singing an anime opening you barely knew. Hajun tried to beatbox. It was awful. But in a good way<br><br>Later, you returned to your room, exhausted, smiling.`,
            `The next night felt… different.<br>No sound from Suhyeon Kim’s room. No laughter. No late-night snacks.<br>You stepped into the corridor, hands in your pockets. The air was colder.<br>Deciding to clear your head, you went for a night walk along the side path that led toward the beach.<br>And that’s when you saw it.<br>Under a flickering lamp near the back ally, Suhyeon was in a fight.And his opponent?<br><strong>Daniel</strong><br>But this wasn’t the same Daniel you fought two months ago. He was faster. Stronger. His movements were too sharp. His eyes—cold.<br>Suhyeon Kim was holding his own… barely.<br>You froze.<br>You were from North Gangbuk. Helping him might risk your position—or worse, put a target on your back from Choyun<br><br>you dont know what to do..??`],

          game_title: "What do you want to do next?",
          game_desc: "Risky battle begins",
          actions: [{
            label: "<strong>Help Suhyeon Kim</strong> <br>**Crucial choice**",
            next: {
              substory: [`You turned slightly to back away... and saw it.<br>A crumpled paper bag, left beside a trash bin.<br>You smirked...<br>"Screw it.”<br>You grabbed the bag, tore eye holes, and pulled it over your head.Then you charged`,
                `You leapt into the fight, surprising both of them<br>Daniel narrowed his eyes.<br><br>“Who the hell…?”<br>You didn’t answer.Instead, you stepped between him and Suhyeon Kim, fists clenched, breath steady behind the paper mask.<br>Suhyeon Kim blinked<br>“Wait… is that a grocery bag?” <br>you replied <br>“Don’t ask. Let’s take him down.”`],
              battle: 'Daniel_MC',
              win: {
                gold: { min: 30, max: 60 },
                game_title: `You defeated Daniel (HIGH RISK HIGH REWARD)`,
                game_desc: `Choose your reward.`,
                cards: [
                  {
                    name: "Healing bean", type: "buff", subType: "heal", isSealable: true, staminaCost: 35, desc: `Heal for 30% of your max HP with 10% damage reduction.<br> DUR +2`,
                    effects: { dur: 2, statPoints: 4 }, healPercent: 0.30, cooldown: 6, usesLimit: 2,
                    secondaryEffect: {
                      type: "buff", subType: "damage_reduction", // Our new, custom subtype.
                      buffDuration: 3, // The number of turns the effect will last.
                      reductionAmount: 0.90, // The multiplier for the damage (0.8 means 20% damage).
                      gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                      gif_target: "player",
                    }
                  },
                  {
                    name: "Overwhelm speed", type: "buff", subType: "temp_stat", staminaCost: 40, desc: `Temporarly Buff the user Speed Stats by 35 for 3 turns.<br>SPD +1`,
                    effects: { spd: 1, statPoints: 4 }, statToBuff: "spd", buffValue: 35, buffDuration: 3, cooldown: 6, usesLimit: 2, gif: "cha/temp speed.gif", gif_target: "player", glowEffect: { color: 'blue' },
                  }, {
                    name: "German Suplex", type: "attack", staminaCost: 50, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br> STR +1`,
                    effects: { str: 1, statPoints: 4 }, damage: { min: 145, max: 175 }, cooldown: 7, gif: "cha/Super throw.gif", gif_target: "opponent", sound: "cha/sound/throw.mp3",
                    secondaryEffect: {
                      type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                    }
                  }, {
                    name: "Hand Blade", type: "attack", staminaCost: 45, desc: `You harden the edge of your hand into a living blade and deliver a swift, chopping blow to a vital points...<br> TECH +1`,
                    effects: { tech: 1, statPoints: 4 }, damage: { min: 130, max: 190 }, cooldown: 8, gif: "cha/kick.gif", gif_target: "opponent", sound: "cha/sound/sword cut.mp3",
                    secondaryEffect: {
                      type: "bleed"
                    }
                  }
                ],
                next_story: {
                  substory: [`you have defeated Daniel <br>You stepped back, chest heaving, the paper bag still over your face—now torn, sweat-soaked, and flapping in the wind.<br>Suhyeon Kim knelt beside Daniel, then stood, brushing dust off his arms<br><br>You asked "why is daniel fighting you"<br>He replied<br>“I’m Suhyeon Kim, leader of Western Gangbuk. And I plan to unify all of Gangbuk” <br>Your eyes widened<br>Suhyeon Kim continued: “My goals are simple—protect my crew, grow stronger, and stop that Evil before he becomes unstoppable.”<br>You told her everything—about Choyun, the fight with Sechan Kang, the Slime-like creature, and how Daniel became… different and about System`, `Suhyeon Kim replied <br>“You… have a system too?”<br>you nodded.“Yeah. Guess we’re not so rare after all.” Suhyeon Kim listened quietly<br>“Then it’s worse than I thought. If Choyun’s draining and mind controling people, and he’s a system user like us… he’s probably evolving too. Every second.”<br>“One month. That’s all I need. I’ll train, grow, and then head to North Gangbuk and finish this.”<br><br>“You do the same. Whatever it takes—get stronger Good Luck”`],
                  game_title: "What do you want to do next?",
                  game_desc: "End-Game Coming",
                  actions: [{
                    label: "Train Alone",
                    train: true,
                    gold: 50,
                    //////
                    next: {
                      substory: ["You feel your body getting stronger."],
                      effects: { statPoints: 8 },
                      game_title: "Now you are at the END GAME",
                      game_desc: "",
                      actions: [{
                        label: "Continue",
                        effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 10 },
                        next: {
                          substory: [`It had been a month since you disappeared from the streets.<br> In that time, you'd put everything into getting stronger—mentally and physically.<br> Now, it was time to come back<br>You called Suhyeon Kim, and he told you to come to Western Gangbuk High<br>You expected a quiet meetup.What you found was a full war council<br>You spotted Kang Seok, the Southern Gangbuk leader, standing near the wall with his usual dead-serious expression.<br>Then, near the back, leaning against the wall with his arms crossed and a laid-back look on his face— <br>Han Jaeha, leader of Eastern Gangbuk.<br>You walked over.<br><br>“Long time no see,” Jaeha said with a crooked grin.<br>“Yeah,” you replied. “Feels like forever.”`,
                            `He asked.<br>“So, you’re with us now? For real?”<br>You nodded.<br>“Yup.”<br>He looked you over, impressed.<br>“Then we’ve got ourselves some serious firepower.”<br>Before more words could be exchanged, Suhyeon Kim entered the room .“Good. Everyone’s here,” he said.`, `<strong>The Plan Begins</strong><br><br>Suhyeon Kim unrolled a large city map over a folding table.<br>“We’ve gathered solid intel on Northern Gangbuk. Their manpower is insane—if we try to storm them head-on, we’ll get crushed.”<br>“Instead, we strike strategically. Four key operations—they’re the heart of North Gangbuk’s underground empire.”<br>he pointed to four marked locations:<br><br>
                                                                                        <ul><li>🎤 Karaoke Bar: “Run by No. 5 Jun Jang, with several elite executives.”</li><li>🥊 Fighting Arena: “The strongest holdout. Controlled by No. 3 Jeongdu Ma and No. 6 Jikwang Hong.”</li><li>🎰 Casino: “Managed by No. 4 Jiwon Seo and No. 8 Jintae Heo.”</li><li>💉 Drug Den: “A dark hole crawling with executive-level enforcers.”</li></ul><br>`
                            , `Suhyeon Kim continued:“Here’s how we’ll divide our forces.”<br> South Gangbuk, led by Kang Seok and with Seonu Ha, will hit the Drug Den.<br>Han Jaeha and Taeho Cheon from the East will target the Karaoke Bar.<br>I and Uijin Gyeong will take Western forces to the Fighting Arena.<br>You, along with some of our best from West, will handle the Casino.<br><br>But you raised your hand.“Switch me. I’ll take the Arena.”<br>Everyone paused.<br>Suhyeon Kim gave you a look.<br>“That’s the most heavily guarded location. You’d be going straight into the toughest part.”<br>You smirked.“I didn’t spend a month hiding in alleyways and fighting just to play it safe.”<br>Then Suhyeon Kim gave a faint smile.<br>“Alright. Then it’s settled.”`
                            , `he stepped back and looked at the group.<br>“Once all four targets are neutralized, we regroup. One final assault—on Choyun.”<br><br>Everyone responded in unison:<br>“Got it.”One by one, the gangs began dispersing—each team heading toward their battlefield.Your destination: The Arena.`],
                          game_title: "You arrived at fighting arena",
                          game_desc: "",
                          actions: [{
                            label: "GET READY TO WORK",
                            next: {
                              substory: [`You arrived at the Underground Fighting Arena just before sundown.<br>The place wasn’t flashy—just a massive concrete hall deep in North Gangbuk territory. Dim lighting. The air was heavy with sweat, blood, and cheap smoke. You could hear the crowd, chaotic, hungry for violence<br>Inside, the fights were already in full swing<br>One guy was getting dragged out with his nose bent sideways. Another limped off with his corner man holding a towel over his eye.<br>You kept your hood low and didn’t speak to anyone<br>At the registration table, you registerd yoruself using fake name <br>They didn’t know you were a traitor now. but its always better to be cautious<br>Before stepping into the prep area, you pulled out a crumpled paper bag mask—the same one you’d used before. Ripped eye holes, nothing fancy. Just enough to keep your face hidden`,
                                `<strong>Match Starts</strong><br><br>Your first opponent was already in the ring—shirt off, bouncing on his heels, built like a small tank.<br>They called your fake name. You walked out<br>“What the hell’s with the bag?”<br>“New guy’s got jokes.”<br>You didn’t react.<br><strong>The bell rang!!.</strong>`],
                              game_title: "Risky battle begins",
                              game_desc: "Upgrade your stats before the battle",
                              actions: [{
                                label: "START",
                                next: {
                                  battle_sequence: ['NPC1', 'NPC2', 'NPC3'],
                                  win: {
                                    gold: { min: 30, max: 60 },
                                    substory: [`Now you have defeated your opponents now times for the final round<br>By now, the mood had shifted.<br>No one was laughing about the paper bag anymore.<br> Whispers started:“This guy’s for real.”<br>"He defeated all those strong fighter with much effort but that's it"<br>"He still not match for Hong"<br>Someone yelled,“Bring out Jikwang Hong!”<br>And that’s when the doors opened`,
                                      `<strong>Enter: Jikwang Hong</strong><br><br>You turned.<br>Jikwang Hong walked in, casual like he owned the place.<br>Buzzcut. Faded knuckle scars. Broad shoulders, no nonsense in his stride.<br>He looked at you, sizing you up from across the ring<br>“You made it this far with a paper bag on your head,” he said, voice dry.<br>“But this is the end of the road.”<br>You said nothing.<br><br>“Life doesn’t go the way you want,” he muttered.<br>It sounded like more than just trash talk… but you didn’t have time to think about it.<br>The bell rang.`],
                                    battle: 'Jikwang_Hong',
                                    win: {
                                      gold: { min: 80, max: 120 },
                                      substory: [`<strong>You defeated Jikwang Hong,</strong>.`],
                                      game_title: "Choose your rewards",
                                      game_desc: " ",
                                      cards: [{
                                        name: "Limit Breaker", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 60, desc: `Temporarly Buff the user Strength Stat by 50 for 5 turns.<br>SPD +1, TECH +1`,
                                        effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 50, buffDuration: 5, cooldown: 6, usesLimit: 1, gif: "cha/auraa.gif", sound: "cha/sound/aura.wav", gif_target: "player", glowEffect: { color: 'red' },
                                      }, {
                                        name: "CQC", type: "attack", isSealable: true, staminaCost: 65, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1, STR +1`,
                                        effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 145, max: 190 }, cooldown: 9, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
                                        secondaryEffect: {
                                          type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                                        }
                                      }, {
                                        name: "Crushing Python", type: "debuff", subType: "stun", isSealable: true, staminaCost: 80, desc: `Bind the target for 5 Turns with whole stats reduction by 30% <br>DUR+2, STR +1`,
                                        stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/bind.gif", gif_target: "opponent", stunEffectGif: "/cha/stun.gif",
                                        effects: { tech: 2, str: 1, statPoints: 2 },
                                        secondaryEffect: {
                                          type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                        }
                                      }
                                      ],
                                      next_story: {
                                        substory: [`<strong>After the Fight – The Twist</strong><br><br>The fight was over.Jikwang Hong lay on the floor, unconscious. The arena, once roaring with noise, had gone quiet.Little by little The crowd dispersed<br>You leaned against the wall, breathing heavily.<br>“Just one left…” you muttered.<br>“Only Jeongdu Ma remains.”<br>You pulled out your phone and called Han Jaeha, eager to brag.He picked up on the first ring.` <
                                          `<br>Han Jaeha: "What’s up? How’s the attack going?"<br>You: "I already beat No.6. All that’s left is Jeongdu Ma. What about you? Have you even started yet? Heh."<br>Han Jaeha (laughing): "I’m already done here, lol. We’ve defeated everyone."<br>But just as he said that, you heard it — screaming in the background. People crying out in pain.<br>Han Jaeha: "Wait… something’s happening. I’ll call you later."<br>He hung up.<br>A bad feeling crept in.<br><br>You tried calling Seok… but the call wouldn’t go through. No signal. No response.<br>Then—shadows moved. You looked around… and realized you were surrounded.<br>Members of the North, closing in. And leading them was Jeongdu Ma himself.<br>Jeongdu Ma: "You actually made a decent plan to take us down. We already expected this, though."<br>He smirked.<br>Jeongdu Ma: "We had a spy in your team… Seok Kang. South’s so-called leader. Hahaha!"<br>You: "What?? That Bastard Seok kang was with North all along?!"<br>Your phone rang again — Han Jaeha’s number.`,
                                          `<br>You picked it up, shouting: "Seok is a traitor—!"<br>But the voice on the other end wasn’t Han Jaeha’s.<br><br>You: "Choyun?! What happened to Han Jaeha?!"<br>Choyun: "Relax. He’s not dead… but he’s not in any condition to answer calls either."<br>Choyun: "Your plan failed. You can’t win. I’ll give you one last chance."<br>Choyun: "Come back and join us… or get killed here and now."<br>What will you do?....`],
                                        game_title: "Last Chance",
                                        game_desc: "Since you've already picked the Suhyeon Kim so its only one choice",
                                        actions: [{
                                          label: "Rejects the offer",
                                          next: {
                                            substory: [`Choyun: "Still taking their side, huh? Even after all this? Fine."<br>"Die then."<br>The call ended. Silence for a moment… then a shift in the air.<br>Jeongdu Ma cracked his knuckles and stepped forward<br>The real fight had begun.`],
                                            battle: 'Jeongdu_Ma',
                                            win: {
                                              gold: { min: 100, max: 150 },
                                              substory: [`You defeated Jeongdu Ma`],
                                              game_title: "Choose your rewards",
                                              game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                              cards: [

                                                {
                                                  name: "Diamond Skin", staminaCost: 70, type: "buff", // This card will appear in your "Buff Cards" list.
                                                  subType: "damage_reduction", // Our new, custom subtype.
                                                  isSealable: true,
                                                  desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 60%.",
                                                  // Optional: also gives a permanent stat boost.
                                                  buffDuration: 10, // The number of turns the effect will last.
                                                  reductionAmount: 0.4, // The multiplier for the damage (0.8 means 20% damage).
                                                  cooldown: 6,
                                                  usesLimit: 1,
                                                  gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                                                  gif_target: "player",
                                                  glowEffect: { color: 'green' }
                                                }, {
                                                  name: "Infinite Technique", staminaCost: 85, type: "attack", isSealable: true, desc: `The pinnacle of combat mastery. You unleash a flawless, continuous barrage of attacks. Infinite Technique is a storm of martial arts that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                  damage: { min: 250, max: 300 }, cooldown: 8, usesLimit: 2, gif: "cha/rapid punch.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                                                  secondaryEffect: {
                                                    type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "/cha/stun.gif"
                                                  }
                                                },
                                                {
                                                  name: "Second Life", type: "buff", staminaCost: 50, staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 40% of your max HP.`,
                                                  healPercent: 0.40, cooldown: 8, usesLimit: 2,
                                                }, {
                                                  name: "Ultra Instinct", staminaCost: 60, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 60% when used (Can be stacked)`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", glowEffect: { color: 'black' }
                                                },

                                              ],
                                              next_story: {
                                                substory: [`You stepped out of the arena, blood still drying on your skin.<br>Jeongdu Ma was down. One of the strongest in the north—defeated. You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. “What happened?”<br>He looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Your eyes narrowed. “So it’s true. That Bastard was with them all along." <br>Suhyeon Kim nodded. “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>You glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                  `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br> On one side of him stood Seok Kang. On the other, Daniel.`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. You stepped forward.<br><br>Suhyeon Kim turned to you. “Let me handle that traitor and Daniel.”<br>You nodded. “Then I’ll take Choyun.”<br>Choyun’s smiled. “Come, then. Show me what you've got”<br><br><strong>The final fight—begins now.</strong>`],
                                                battle: 'Choyun',
                                                win: {
                                                  substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                  next_story: {
                                                    substory: ["The End. Thanks for playing!"],
                                                    // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                    onComplete: function () {
                                                      // Prepare and save the player's state for online mode
                                                      const onlineData = {
                                                        playerName: playerName,
                                                        stats: stats,
                                                        cards: playerCards,
                                                        playerCardImage: localStorage.getItem('playerCardImage'),
                                                        playerBattleImage: localStorage.getItem('playerBattleImage')
                                                      };
                                                      localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                      // Show a confirmation and the online button
                                                      showPopup("Online Mode Unlocked!");
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }]
                                      }
                                    }
                                  }
                                }
                              }]
                            }
                          }]
                        }
                      }]
                    }
                  },
                  {
                    label: "Fight Local Thugs",
                    next: {
                      battle_sequence: ['L_Thug1', 'L_Thug2', 'L_Thug3',],
                      win: {
                        gold: { min: 30, max: 60 },
                        game_title: `You defeated the Local bullies`,
                        game_desc: `Choose your reward.`,
                        cards: [
                          {
                            name: "Stats point reward", type: "stat_boost", desc: `Get the 7 stats point as rewards `,
                            effects: { statPoints: 7 },
                          }, {
                            name: "Strength card", type: "stat_boost", desc: `You get sudden leap in Strength<br>STR +8`,
                            effects: { str: 8 },
                          }, {
                            name: "Endurance card", type: "stat_boost", desc: `You get sudden leap in Endurance<br>END +8`,
                            effects: { end: 8 },
                          }, {
                            name: "Technique card", type: "stat_boost", desc: `You get sudden leap in Technique<br>TECH +8`,
                            effects: { tech: 8 },
                          }
                        ],
                        next_story: {
                          substory: ["You feel your body getting stronger."],
                          game_title: "What do you want to do next?",
                          game_desc: "Now you are at the END GAME",
                          actions: [{
                            label: "Continue",
                            effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 10 },
                            next: {
                              substory: [`It had been a month since you disappeared from the streets.<br> In that time, you'd put everything into getting stronger—mentally and physically.<br> Now, it was time to come back<br>You called Suhyeon Kim, and he told you to come to Western Gangbuk High<br>You expected a quiet meetup.What you found was a full war council<br>You spotted Kang Seok, the Southern Gangbuk leader, standing near the wall with his usual dead-serious expression.<br>Then, near the back, leaning against the wall with his arms crossed and a laid-back look on his face— <br>Han Jaeha, leader of Eastern Gangbuk.<br>You walked over.<br><br>“Long time no see,” Jaeha said with a crooked grin.<br>“Yeah,” you replied. “Feels like forever.”`,
                                `He asked.<br>“So, you’re with us now? For real?”<br>You nodded.<br>“Yup.”<br>He looked you over, impressed.<br>“Then we’ve got ourselves some serious firepower.”<br>Before more words could be exchanged, Suhyeon Kim entered the room .“Good. Everyone’s here,” he said.`, `<strong>The Plan Begins</strong><br><br>Suhyeon Kim unrolled a large city map over a folding table.<br>“We’ve gathered solid intel on Northern Gangbuk. Their manpower is insane—if we try to storm them head-on, we’ll get crushed.”<br>“Instead, we strike strategically. Four key operations—they’re the heart of North Gangbuk’s underground empire.”<br>he pointed to four marked locations:<br><br>
                                                                                        <ul><li>🎤 Karaoke Bar: “Run by No. 5 Jun Jang, with several elite executives.”</li><li>🥊 Fighting Arena: “The strongest holdout. Controlled by No. 3 Jeongdu Ma and No. 6 Jikwang Hong.”</li><li>🎰 Casino: “Managed by No. 4 Jiwon Seo and No. 8 Jintae Heo.”</li><li>💉 Drug Den: “A dark hole crawling with executive-level enforcers.”</li></ul><br>`
                                , `Suhyeon Kim continued:“Here’s how we’ll divide our forces.”<br> South Gangbuk, led by Kang Seok and with Seonu Ha, will hit the Drug Den.<br>Han Jaeha and Taeho Cheon from the East will target the Karaoke Bar.<br>I and Uijin Gyeong will take Western forces to the Fighting Arena.<br>You, along with some of our best from West, will handle the Casino.<br><br>But you raised your hand.“Switch me. I’ll take the Arena.”<br>Everyone paused.<br>Suhyeon Kim gave you a look.<br>“That’s the most heavily guarded location. You’d be going straight into the toughest part.”<br>You smirked.“I didn’t spend a month hiding in alleyways and fighting just to play it safe.”<br>Then Suhyeon Kim gave a faint smile.<br>“Alright. Then it’s settled.”`
                                , `he stepped back and looked at the group.<br>“Once all four targets are neutralized, we regroup. One final assault—on Choyun.”<br><br>Everyone responded in unison:<br>“Got it.”One by one, the gangs began dispersing—each team heading toward their battlefield.Your destination: The Arena.`],
                              game_title: "You arrived at fighting arena",
                              game_desc: "",
                              actions: [{
                                label: "GET READY TO WORK",
                                next: {
                                  substory: [`You arrived at the Underground Fighting Arena just before sundown.<br>The place wasn’t flashy—just a massive concrete hall deep in North Gangbuk territory. Dim lighting. The air was heavy with sweat, blood, and cheap smoke. You could hear the crowd, chaotic, hungry for violence<br>Inside, the fights were already in full swing<br>One guy was getting dragged out with his nose bent sideways. Another limped off with his corner man holding a towel over his eye.<br>You kept your hood low and didn’t speak to anyone<br>At the registration table, you registerd yoruself using fake name <br>They didn’t know you were a traitor now. but its always better to be cautious<br>Before stepping into the prep area, you pulled out a crumpled paper bag mask—the same one you’d used before. Ripped eye holes, nothing fancy. Just enough to keep your face hidden`,
                                    `<strong>Match Starts</strong><br><br>Your first opponent was already in the ring—shirt off, bouncing on his heels, built like a small tank.<br>They called your fake name. You walked out<br>“What the hell’s with the bag?”<br>“New guy’s got jokes.”<br>You didn’t react.<br><strong>The bell rang!!.</strong>`],
                                  game_title: "Risky battle begins",
                                  game_desc: "Upgrade your stats before the battle",
                                  actions: [{
                                    label: "START",
                                    next: {
                                      battle_sequence: ['NPC1', 'NPC2', 'NPC3'],
                                      win: {
                                        gold: { min: 30, max: 60 },
                                        substory: [`Now you have defeated your opponents now times for the final round<br>By now, the mood had shifted.<br>No one was laughing about the paper bag anymore.<br> Whispers started:“This guy’s for real.”<br>"He defeated all those strong fighter with much effort but that's it"<br>"He still not match for Hong"<br>Someone yelled,“Bring out Jikwang Hong!”<br>And that’s when the doors opened`,
                                          `<strong>Enter: Jikwang Hong</strong><br><br>You turned.<br>Jikwang Hong walked in, casual like he owned the place.<br>Buzzcut. Faded knuckle scars. Broad shoulders, no nonsense in his stride.<br>He looked at you, sizing you up from across the ring<br>“You made it this far with a paper bag on your head,” he said, voice dry.<br>“But this is the end of the road.”<br>You said nothing.<br><br>“Life doesn’t go the way people want,” he muttered.<br>It sounded like more than just trash talk… but you didn’t have time to think about it.<br>The bell rang.`],
                                        battle: 'Jikwang_Hong',
                                        win: {
                                          gold: { min: 80, max: 120 },
                                          substory: [`<strong>You defeated Jikwang Hong,</strong>.`],
                                          game_title: "Choose your rewards",
                                          game_desc: " ",
                                          cards: [{
                                            name: "Limit Breaker", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 60, desc: `Temporarly Buff the user Strength Stat by 50 for 5 turns.<br>SPD +1, TECH +1`,
                                            effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 50, buffDuration: 5, cooldown: 6, usesLimit: 1, gif: "cha/auraa.gif", sound: "cha/sound/aura.wav", gif_target: "player", glowEffect: { color: 'red' },
                                          }, {
                                            name: "CQC", type: "attack", isSealable: true, staminaCost: 65, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1, STR +1`,
                                            effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 145, max: 190 }, cooldown: 9, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
                                            secondaryEffect: {
                                              type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                                            }
                                          }, {
                                            name: "Crushing Python", type: "debuff", subType: "stun", isSealable: true, staminaCost: 80, desc: `Bind the target for 5 Turns with whole stats reduction by 30% <br>DUR+2, STR +1`,
                                            stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/bind.gif", gif_target: "opponent", stunEffectGif: "/cha/stun.gif",
                                            effects: { tech: 2, str: 1, statPoints: 2 },
                                            secondaryEffect: {
                                              type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                            }
                                          }
                                          ],
                                          next_story: {
                                            substory: [`<strong>After the Fight – The Twist</strong><br><br>The fight was over.Jikwang Hong lay on the floor, unconscious. The arena, once roaring with noise, had gone quiet.Little by little The crowd dispersed<br>You leaned against the wall, breathing heavily.<br>“Just one left…” you muttered.<br>“Only Jeongdu Ma remains.”<br>You pulled out your phone and called Han Jaeha, eager to brag.He picked up on the first ring.` <
                                              `<br>Han Jaeha: "What’s up? How’s the attack going?"<br>You: "I already beat No.6. All that’s left is Jeongdu Ma. What about you? Have you even started yet? Heh."<br>Han Jaeha (laughing): "I’m already done here, lol. We’ve defeated everyone."<br>But just as he said that, you heard it — screaming in the background. People crying out in pain.<br>Han Jaeha: "Wait… something’s happening. I’ll call you later."<br>He hung up.<br>A bad feeling crept in.<br><br>You tried calling Seok… but the call wouldn’t go through. No signal. No response.<br>Then—shadows moved. You looked around… and realized you were surrounded.<br>Members of the North, closing in. And leading them was Jeongdu Ma himself.<br>Jeongdu Ma: "You actually made a decent plan to take us down. We already expected this, though."<br>He smirked.<br>Jeongdu Ma: "We had a spy in your team… Seok Kang. South’s so-called leader. Hahaha!"<br>You: "What?? That pig Seok was with North all along?!"<br>Your phone rang again — Han Jaeha’s number.`,
                                              `<br>You picked it up, shouting: "Seok is a traitor—!"<br>But the voice on the other end wasn’t Han Jaeha’s.<br><br>You: "Choyun?! What happened to Han Jaeha?!"<br>Choyun: "Relax. He’s not dead… but he’s not in any condition to answer calls either."<br>Choyun: "Your plan failed. You can’t win. I’ll give you one last chance."<br>Choyun: "Come back and join us… or get killed here and now."<br>What will you do?....`],
                                            game_title: "Last Chance",
                                            game_desc: "Since you've already picked the Suhyeon Kim so its only one choice",
                                            actions: [{
                                              label: "Rejects the offer",
                                              next: {
                                                substory: [`Choyun: "Still taking their side, huh? Even after all this? Fine."<br>"Die then."<br>The call ended. Silence for a moment… then a shift in the air.<br>Jeongdu Ma cracked his knuckles and stepped forward<br>The real fight had begun.`],
                                                battle: 'Jeongdu_Ma',
                                                win: {
                                                  gold: { min: 100, max: 150 },
                                                  substory: [`You defeated Jeongdu Ma`],
                                                  game_title: "Choose your rewards",
                                                  game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                                  cards: [

                                                    {
                                                      name: "Diamond Skin", staminaCost: 70, type: "buff", // This card will appear in your "Buff Cards" list.
                                                      subType: "damage_reduction", // Our new, custom subtype.
                                                      isSealable: true,
                                                      desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 60%.",
                                                      // Optional: also gives a permanent stat boost.
                                                      buffDuration: 10, // The number of turns the effect will last.
                                                      reductionAmount: 0.4, // The multiplier for the damage (0.8 means 20% damage).
                                                      cooldown: 6,
                                                      usesLimit: 1,
                                                      gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                                                      gif_target: "player",
                                                      glowEffect: { color: 'green' }
                                                    }, {
                                                      name: "Infinite Technique", staminaCost: 85, type: "attack", isSealable: true, desc: `The pinnacle of combat mastery. You unleash a flawless, continuous barrage of attacks. Infinite Technique is a storm of martial arts that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                      damage: { min: 250, max: 300 }, cooldown: 8, usesLimit: 2, gif: "cha/rapid punch.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                                                      secondaryEffect: {
                                                        type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "/cha/stun.gif"
                                                      }
                                                    },
                                                    {
                                                      name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 40% of your max HP.`,
                                                      healPercent: 0.40, cooldown: 8, usesLimit: 2,
                                                    }, {
                                                      name: "Ultra Instinct", staminaCost: 60, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 60% when used (Can be stacked)`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", glowEffect: { color: 'black' }
                                                    },

                                                  ],
                                                  next_story: {
                                                    substory: [`You stepped out of the arena, blood still drying on your skin.<br>Jeongdu Ma was down. One of the strongest in the north—defeated. You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. “What happened?”<br>He looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Your eyes narrowed. “So it’s true. That Bastard was with them all along." <br>Suhyeon Kim nodded. “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>You glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                      `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br> On one side of him stood Seok Kang. On the other, Daniel.`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. You stepped forward.<br><br>Suhyeon Kim turned to you. “Let me handle that traitor and Daniel.”<br>You nodded. “Then I’ll take Choyun.”<br>Choyun’s smiled. “Come, then. Show me what you've got”<br><br><strong>The final fight—begins now.</strong>`],
                                                    battle: 'Choyun',
                                                    win: {
                                                      substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                      next_story: {
                                                        substory: ["The End. Thanks for playing!"],
                                                        // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                        onComplete: function () {
                                                          // Prepare and save the player's state for online mode
                                                          const onlineData = {
                                                            playerName: playerName,
                                                            stats: stats,
                                                            cards: playerCards,
                                                            playerCardImage: localStorage.getItem('playerCardImage'),
                                                            playerBattleImage: localStorage.getItem('playerBattleImage')
                                                          };
                                                          localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                          // Show a confirmation and the online button
                                                          showPopup("Online Mode Unlocked!");
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }]
                                          }
                                        }
                                      }
                                    }
                                  }]
                                }
                              }]
                            }
                          }]
                        }

                      }
                    }
                  }, {
                    label: "Help Han Jaeha",
                    race: true,
                    win: {
                      gold: 30,
                      game_title: "DELIVERY SUCCESS",
                      game_desc: "You have proven your worth The system grants you rewards.",
                      cards: [{
                        name: "Stats point reward", desc: `Get the 7 stats point as rewards `,
                        effects: { statPoints: 7 },
                      }, {
                        name: "Strength card", desc: `You get sudden leap in Strength<br>STR +8`,
                        effects: { str: 8 },
                      }, {
                        name: "Technique card", desc: `You skills ot sharpher<br>STR +8`,
                        effects: { tech: 8 },
                      }, {
                        name: "Endurance card", desc: `You get sudden leap in Speed<br>END +8`,
                        effects: { end: 8 },
                      }],
                      next_story: {
                        substory: ["You feel your body getting stronger."],
                        game_title: "What do you want to do next?",
                        game_desc: "Now you are at the END GAME",
                        actions: [{
                          label: "Continue",
                          effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 10 },
                          next: {
                            substory: [`It had been a month since you disappeared from the streets.<br> In that time, you'd put everything into getting stronger—mentally and physically.<br> Now, it was time to come back<br>You called Suhyeon Kim, and he told you to come to Western Gangbuk High<br>You expected a quiet meetup.What you found was a full war council<br>You spotted Kang Seok, the Southern Gangbuk leader, standing near the wall with his usual dead-serious expression.<br>Then, near the back, leaning against the wall with his arms crossed and a laid-back look on his face— <br>Han Jaeha, leader of Eastern Gangbuk.<br>You walked over.<br><br>“Long time no see,” Jaeha said with a crooked grin.<br>“Yeah,” you replied. “Feels like forever.”`,
                              `He asked.<br>“So, you’re with us now? For real?”<br>You nodded.<br>“Yup.”<br>He looked you over, impressed.<br>“Then we’ve got ourselves some serious firepower.”<br>Before more words could be exchanged, Suhyeon Kim entered the room .“Good. Everyone’s here,” he said.`, `<strong>The Plan Begins</strong><br><br>Suhyeon Kim unrolled a large city map over a folding table.<br>“We’ve gathered solid intel on Northern Gangbuk. Their manpower is insane—if we try to storm them head-on, we’ll get crushed.”<br>“Instead, we strike strategically. Four key operations—they’re the heart of North Gangbuk’s underground empire.”<br>he pointed to four marked locations:<br><br>
                                                                                        <ul><li>🎤 Karaoke Bar: “Run by No. 5 Jun Jang, with several elite executives.”</li><li>🥊 Fighting Arena: “The strongest holdout. Controlled by No. 3 Jeongdu Ma and No. 6 Jikwang Hong.”</li><li>🎰 Casino: “Managed by No. 4 Jiwon Seo and No. 8 Jintae Heo.”</li><li>💉 Drug Den: “A dark hole crawling with executive-level enforcers.”</li></ul><br>`
                              , `Suhyeon Kim continued:“Here’s how we’ll divide our forces.”<br> South Gangbuk, led by Kang Seok and with Seonu Ha, will hit the Drug Den.<br>Han Jaeha and Taeho Cheon from the East will target the Karaoke Bar.<br>I and Uijin Gyeong will take Western forces to the Fighting Arena.<br>You, along with some of our best from West, will handle the Casino.<br><br>But you raised your hand.“Switch me. I’ll take the Arena.”<br>Everyone paused.<br>Suhyeon Kim gave you a look.<br>“That’s the most heavily guarded location. You’d be going straight into the toughest part.”<br>You smirked.“I didn’t spend a month hiding in alleyways and fighting just to play it safe.”<br>Then Suhyeon Kim gave a faint smile.<br>“Alright. Then it’s settled.”`
                              , `he stepped back and looked at the group.<br>“Once all four targets are neutralized, we regroup. One final assault—on Choyun.”<br><br>Everyone responded in unison:<br>“Got it.”One by one, the gangs began dispersing—each team heading toward their battlefield.Your destination: The Arena.`],
                            game_title: "You arrived at fighting arena",
                            game_desc: "",
                            actions: [{
                              label: "GET READY TO WORK",
                              next: {
                                substory: [`You arrived at the Underground Fighting Arena just before sundown.<br>The place wasn’t flashy—just a massive concrete hall deep in North Gangbuk territory. Dim lighting. The air was heavy with sweat, blood, and cheap smoke. You could hear the crowd, chaotic, hungry for violence<br>Inside, the fights were already in full swing<br>One guy was getting dragged out with his nose bent sideways. Another limped off with his corner man holding a towel over his eye.<br>You kept your hood low and didn’t speak to anyone<br>At the registration table, you registerd yoruself using fake name <br>They didn’t know you were a traitor now. but its always better to be cautious<br>Before stepping into the prep area, you pulled out a crumpled paper bag mask—the same one you’d used before. Ripped eye holes, nothing fancy. Just enough to keep your face hidden`,
                                  `<strong>Match Starts</strong><br><br>Your first opponent was already in the ring—shirt off, bouncing on his heels, built like a small tank.<br>They called your fake name. You walked out<br>“What the hell’s with the bag?”<br>“New guy’s got jokes.”<br>You didn’t react.<br><strong>The bell rang!!.</strong>`],
                                game_title: "Risky battle begins",
                                game_desc: "Upgrade your stats before the battle",
                                actions: [{
                                  label: "START",
                                  next: {
                                    battle_sequence: ['NPC1', 'NPC2', 'NPC3'],
                                    win: {
                                      gold: { min: 30, max: 60 },
                                      substory: [`Now you have defeated your opponents now times for the final round<br>By now, the mood had shifted.<br>No one was laughing about the paper bag anymore.<br> Whispers started:“This guy’s for real.”<br>"He defeated all those strong fighter with much effort but that's it"<br>"He still not match for Hong"<br>Someone yelled,“Bring out Jikwang Hong!”<br>And that’s when the doors opened`,
                                        `<strong>Enter: Jikwang Hong</strong><br><br>You turned.<br>Jikwang Hong walked in, casual like he owned the place.<br>Buzzcut. Faded knuckle scars. Broad shoulders, no nonsense in his stride.<br>He looked at you, sizing you up from across the ring<br>“You made it this far with a paper bag on your head,” he said, voice dry.<br>“But this is the end of the road.”<br>You said nothing.<br><br>“Life doesn’t go the way people want,” he muttered.<br>It sounded like more than just trash talk… but you didn’t have time to think about it.<br>The bell rang.`],
                                      battle: 'Jikwang_Hong',
                                      win: {
                                        gold: { min: 80, max: 120 },
                                        substory: [`<strong>You defeated Jikwang Hong,</strong>.`],
                                        game_title: "Choose your rewards",
                                        game_desc: " ",
                                        cards: [{
                                          name: "Limit Breaker", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 60, desc: `Temporarly Buff the user Strength Stat by 50 for 5 turns.<br>SPD +1, TECH +1`,
                                          effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 50, buffDuration: 5, cooldown: 6, usesLimit: 1, gif: "cha/auraa.gif", sound: "cha/sound/aura.wav", gif_target: "player", glowEffect: { color: 'red' },
                                        }, {
                                          name: "CQC", type: "attack", isSealable: true, staminaCost: 65, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1, STR +1`,
                                          effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 145, max: 190 }, cooldown: 9, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
                                          secondaryEffect: {
                                            type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                                          }
                                        }, {
                                          name: "Crushing Python", type: "debuff", subType: "stun", isSealable: true, staminaCost: 80, desc: `Bind the target for 5 Turns with whole stats reduction by 30% <br>DUR+2, STR +1`,
                                          stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/bind.gif", gif_target: "opponent", stunEffectGif: "/cha/stun.gif",
                                          effects: { tech: 2, str: 1, statPoints: 2 },
                                          secondaryEffect: {
                                            type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                          }
                                        }
                                        ],
                                        next_story: {
                                          substory: [`<strong>After the Fight – The Twist</strong><br><br>The fight was over.Jikwang Hong lay on the floor, unconscious. The arena, once roaring with noise, had gone quiet.Little by little The crowd dispersed<br>You leaned against the wall, breathing heavily.<br>“Just one left…” you muttered.<br>“Only Jeongdu Ma remains.”<br>You pulled out your phone and called Han Jaeha, eager to brag.He picked up on the first ring.` <
                                            `<br>Han Jaeha: "What’s up? How’s the attack going?"<br>You: "I already beat No.6. All that’s left is Jeongdu Ma. What about you? Have you even started yet? Heh."<br>Han Jaeha (laughing): "I’m already done here, lol. We’ve defeated everyone."<br>But just as he said that, you heard it — screaming in the background. People crying out in pain.<br>Han Jaeha: "Wait… something’s happening. I’ll call you later."<br>He hung up.<br>A bad feeling crept in.<br><br>You tried calling Seok… but the call wouldn’t go through. No signal. No response.<br>Then—shadows moved. You looked around… and realized you were surrounded.<br>Members of the North, closing in. And leading them was Jeongdu Ma himself.<br>Jeongdu Ma: "You actually made a decent plan to take us down. We already expected this, though."<br>He smirked.<br>Jeongdu Ma: "We had a spy in your team… Seok Kang. South’s so-called leader. Hahaha!"<br>You: "What?? That pig Seok was with North all along?!"<br>Your phone rang again — Han Jaeha’s number.`,
                                            `<br>You picked it up, shouting: "Seok is a traitor—!"<br>But the voice on the other end wasn’t Han Jaeha’s.<br><br>You: "Choyun?! What happened to Han Jaeha?!"<br>Choyun: "Relax. He’s not dead… but he’s not in any condition to answer calls either."<br>Choyun: "Your plan failed. You can’t win. I’ll give you one last chance."<br>Choyun: "Come back and join us… or get killed here and now."<br>What will you do?....`],
                                          game_title: "Last Chance",
                                          game_desc: "Since you've already picked the Suhyeon Kim so its only one choice",
                                          actions: [{
                                            label: "Rejects the offer",
                                            next: {
                                              substory: [`Choyun: "Still taking their side, huh? Even after all this? Fine."<br>"Die then."<br>The call ended. Silence for a moment… then a shift in the air.<br>Jeongdu Ma cracked his knuckles and stepped forward<br>The real fight had begun.`],
                                              battle: 'Jeongdu_Ma',
                                              win: {
                                                gold: { min: 100, max: 150 },
                                                substory: [`You defeated Jeongdu Ma`],
                                                game_title: "Choose your rewards",
                                                game_desc: " <b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b>",
                                                cards: [

                                                  {
                                                    name: "Diamond Skin", staminaCost: 70, type: "buff", // This card will appear in your "Buff Cards" list.
                                                    subType: "damage_reduction", // Our new, custom subtype.
                                                    isSealable: true,
                                                    desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 60%.",
                                                    // Optional: also gives a permanent stat boost.
                                                    buffDuration: 10, // The number of turns the effect will last.
                                                    reductionAmount: 0.4, // The multiplier for the damage (0.8 means 20% damage).
                                                    cooldown: 6,
                                                    usesLimit: 1,
                                                    gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                                                    gif_target: "player",
                                                    glowEffect: { color: 'green' }
                                                  }, {
                                                    name: "Infinite Technique", staminaCost: 85, type: "attack", isSealable: true, desc: `The pinnacle of combat mastery. You unleash a flawless, continuous barrage of attacks. Infinite Technique is a storm of martial arts that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                    damage: { min: 250, max: 300 }, cooldown: 8, usesLimit: 2, gif: "cha/rapid punch.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                                                    secondaryEffect: {
                                                      type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "/cha/stun.gif"
                                                    }
                                                  },
                                                  {
                                                    name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 40% of your max HP.`,
                                                    healPercent: 0.40, cooldown: 8, usesLimit: 2,
                                                  }, {
                                                    name: "Ultra Instinct", staminaCost: 60, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 60% when used (Can be stacked)`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", glowEffect: { color: 'black' }
                                                  },

                                                ],
                                                next_story: {
                                                  substory: [`You stepped out of the arena, blood still drying on your skin.<br>Jeongdu Ma was down. One of the strongest in the north—defeated. You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. “What happened?”<br>He looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Your eyes narrowed. “So it’s true. That Bastard was with them all along." <br>Suhyeon Kim nodded. “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>You glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                    `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br> On one side of him stood Seok Kang. On the other, Daniel.`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. You stepped forward.<br><br>Suhyeon Kim turned to you. “Let me handle that traitor and Daniel.”<br>You nodded. “Then I’ll take Choyun.”<br>Choyun’s smiled. “Come, then. Show me what you've got”<br><br><strong>The final fight—begins now.</strong>`],
                                                  battle: 'Choyun',
                                                  win: {
                                                    substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                    next_story: {
                                                      substory: ["The End. Thanks for playing!"],
                                                      // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                      onComplete: function () {
                                                        // Prepare and save the player's state for online mode
                                                        const onlineData = {
                                                          playerName: playerName,
                                                          stats: stats,
                                                          cards: playerCards,
                                                          playerCardImage: localStorage.getItem('playerCardImage'),
                                                          playerBattleImage: localStorage.getItem('playerBattleImage')
                                                        };
                                                        localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                        // Show a confirmation and the online button
                                                        showPopup("Online Mode Unlocked!");
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }]
                                        }
                                      }
                                    }
                                  }
                                }]
                              }
                            }]
                          }
                        }]
                      }
                    }
                  }]
                }
              }
            }
          }, {
            label: "Ignore",
            next: {
              substory: [`You were still technically a North Gangbuk member. Helping Suhyeon Kim might label you a traitor. <br>You turned to walk away, unsure—until a message buzzed on your phone.<br>From Choyun:"Bring Suhyeon Kim."<br>you went back, stepped between them, and fought Daniel off just enough to stop the fight. Suhyeon Kim looked at you, confused and a little betrayed. That’s when you told him.<br><br>“I’m working with the North. Choyun wants to talk to you.”<br>He didn’t say anything for a second. But then he sighed and nodded. “Alright. I’ll go. But only because it’s you.”<br>`,
                `You brought him to Choyun’s base and waited outside as they spoke. It felt like an eternity.<br><br>Finally, Suhyeon Kim stepped out<br>“What happened?” you asked.<br>He let out a breath. <br><br>“Choyun wants me to join North. I told him West Gangbuk is unstable right now, for that. He gave me one month to decide.”<br>You looked at him.<br> “So… are you going to join him?”<br>He shook his head.<br> “No. But I need a plan. A real one. We need to hit him with everything we’ve got in just one month.”`
                , `<br>You didn’t even hesitate. “Then tell me what you need.”<br>Suhyeon Kim said, “We need South Gangbuk to join our alliance. Without them, we don’t have the numbers.”<br><br>You gave a short nod. “Alright. I’ll handle it—even if I have to crack some skulls to make it happen.”<br>He grinned back. “Knew I could count on you.”<br>Things were about to get serious. But at least now… we had a real shot.`],
              game_title: `Forming Alliance `,
              game_desc: ``,
              actions: [{
                label: "Ready",
                next: {
                  substory: [`You headed straight into South Gangbuk territory—hostile turf crawling with muscleheads, thugs, and more than a few eyes watching your every move. At the center of it all was Seok Kang, the infamous South leader. Big build, slit eyes, and a permanent smirk that made your fists itch<br><br>You met him face-to-face in one of their open hangars, surrounded by his crew. The guy didn’t even stand up. Just leaned back, arms crossed, grinning like you were some street clown.<br><br>“So, you came all the way here to ask for an alliance with West?” Seok scoffed. “You really think West has the power to move anything? Hah! I rather join the NORTH than to join weaklings ahaha.”<br>You kept your voice cold. “I’m not requesting,” you said.<br> “I’m ordering you to join the alliance.”<br>`
                    , `That made him laugh hard. “You got guts, I’ll give you that. But you want me to listen? Then go through them first.”<br>He snapped his fingers.<br>South Gangbuk’s top executives stepped in, circling around you—cracking knuckles, ready to tear you apart. No backing out now`],
                  battle_sequence: ['Don_gu_Wang', 'Hakjin_Ju', 'Jingu_Oh'],
                  win: {
                    gold: { min: 30, max: 60 },
                    substory: [`You defeated the top South gang members,Then came Seok.<br>Face twisted in rage, he stepped forward, ripping off his jacket.<br> “You’re messing with the wrong guy,” he growled.`],
                    battle: 'Seok_Kang',
                    win: {
                      gold: { min: 30, max: 60 },
                      substory: [`You defeated Seok Kang`],
                      game_title: "You have defeated the strong opponent, Choose your rewards",
                      game_desc: " ",
                      cards: [
                        {
                          name: "Healing bean", type: "buff", subType: "heal", isSealable: true, staminaCost: 35, desc: `Heal for 30% of your max HP with 10% damage reduction.<br> DUR +2`,
                          effects: { dur: 2, statPoints: 4 }, healPercent: 0.30, cooldown: 6, usesLimit: 2,
                          secondaryEffect: {
                            type: "buff", subType: "damage_reduction", // Our new, custom subtype.
                            buffDuration: 3, // The number of turns the effect will last.
                            reductionAmount: 0.90, // The multiplier for the damage (0.8 means 20% damage).
                            gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                            gif_target: "player",
                          }
                        },
                        {
                          name: "Insight", staminaCost: 40, type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user Technique Stats by 35 for 3 turns.<br>SPD +1`,
                          effects: { spd: 1, statPoints: 4 }, statToBuff: "tech", buffValue: 35, buffDuration: 3, cooldown: 6, usesLimit: 2, gif: "cha/auraa.gif", gif_target: "player", glowEffect: { color: 'red' },
                        }, {
                          name: "PileDriver", staminaCost: 55, type: "attack", desc: `A devastating and dangerous maneuver. lifting the opponent, driving their head into the ground with immense force.<br> STR +1`,
                          effects: { str: 1, statPoints: 4 }, damage: { min: 130, max: 180 }, cooldown: 7, gif: "cha/sumo throw.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                          secondaryEffect: {
                            type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                          }
                        }, {
                          name: "Blade Dance", staminaCost: 50, type: "attack", desc: `You weave a mesmerizing and deadly dance with your blade, delivering a flurry of slashes that are as graceful as they are lethal....<br> TECH +1`,
                          effects: { tech: 1, statPoints: 4 }, damage: { min: 150, max: 185 }, cooldown: 8, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                          secondaryEffect: {
                            type: "debuff", subType: "stat_reduction", statToDebuff: "spd", debuffValue: 0.8, debuffDuration: 2
                          }
                        }
                      ],
                      next_story: {
                        substory: [`And after a brutal clash, you had him on the floor, blood on his lip and your fist raised, ready to end it.<br><br>“W-wait!” he shouted. <br>“I’ll join! I’ll join the damn alliance!”<br>You paused, lowered your fist.<br><br>Smart choice.`,
                          `You pulled out your phone and called Suhyeon Kim.<br> “He’s ready to form the alliance.”<br>“Good,” Suhyeon Kim replied, his voice calm but sharp.<br> “Then send him here. And get yourself ready too…”<br>You already knew what was coming.<br>“…the big battle is just around the corner.”`],

                        actions: [{
                          label: "Train Alone",
                          train: true,
                          gold: 50,
                          //////
                          next: {
                            substory: ["You feel your body getting stronger."],
                            effects: { statPoints: 8 },
                            game_title: "Now you are at the END GAME",
                            game_desc: "",
                            actions: [{
                              label: "Continue",
                              effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 10 },
                              next: {
                                substory: [`It had been a month since you disappeared from the streets.<br> In that time, you'd put everything into getting stronger—mentally and physically.<br> Now, it was time to come back<br>You called Suhyeon Kim, and he told you to come to Western Gangbuk High<br>You expected a quiet meetup.What you found was a full war council<br>You spotted Kang Seok, the Southern Gangbuk leader, standing near the wall with his usual dead-serious expression.<br>Then, near the back, leaning against the wall with his arms crossed and a laid-back look on his face— <br>Han Jaeha, leader of Eastern Gangbuk.<br>You walked over.<br><br>“Long time no see,” Jaeha said with a crooked grin.<br>“Yeah,” you replied. “Feels like forever.”`,
                                  `He asked.<br>“So, you’re with us now? For real?”<br>You nodded.<br>“Yup.”<br>He looked you over, impressed.<br>“Then we’ve got ourselves some serious firepower.”<br>Before more words could be exchanged, Suhyeon Kim entered the room .“Good. Everyone’s here,” he said.`, `<strong>The Plan Begins</strong><br><br>Suhyeon Kim unrolled a large city map over a folding table.<br>“We’ve gathered solid intel on Northern Gangbuk. Their manpower is insane—if we try to storm them head-on, we’ll get crushed.”<br>“Instead, we strike strategically. Four key operations—they’re the heart of North Gangbuk’s underground empire.”<br>he pointed to four marked locations:<br><br>
                                                                                        <ul><li>🎤 Karaoke Bar: “Run by No. 5 Jun Jang, with several elite executives.”</li><li>🥊 Fighting Arena: “The strongest holdout. Controlled by No. 3 Jeongdu Ma and No. 6 Jikwang Hong.”</li><li>🎰 Casino: “Managed by No. 4 Jiwon Seo and No. 8 Jintae Heo.”</li><li>💉 Drug Den: “A dark hole crawling with executive-level enforcers.”</li></ul><br>`
                                  , `Suhyeon Kim continued:“Here’s how we’ll divide our forces.”<br> South Gangbuk, led by Kang Seok and with Seonu Ha, will hit the Drug Den.<br>Han Jaeha and Taeho Cheon from the East will target the Karaoke Bar.<br>I and Uijin Gyeong will take Western forces to the Fighting Arena.<br>You, along with some of our best from West, will handle the Casino.<br><br>But you raised your hand.“Switch me. I’ll take the Arena.”<br>Everyone paused.<br>Suhyeon Kim gave you a look.<br>“That’s the most heavily guarded location. You’d be going straight into the toughest part.”<br>You smirked.“I didn’t spend a month hiding in alleyways and fighting just to play it safe.”<br>Then Suhyeon Kim gave a faint smile.<br>“Alright. Then it’s settled.”`
                                  , `he stepped back and looked at the group.<br>“Once all four targets are neutralized, we regroup. One final assault—on Choyun.”<br><br>Everyone responded in unison:<br>“Got it.”One by one, the gangs began dispersing—each team heading toward their battlefield.Your destination: The Arena.`],
                                game_title: "You arrived at fighting arena",
                                game_desc: "",
                                actions: [{
                                  label: "GET READY TO WORK",
                                  next: {
                                    substory: [`You arrived at the Underground Fighting Arena just before sundown.<br>The place wasn’t flashy—just a massive concrete hall deep in North Gangbuk territory. Dim lighting. The air was heavy with sweat, blood, and cheap smoke. You could hear the crowd, chaotic, hungry for violence<br>Inside, the fights were already in full swing<br>One guy was getting dragged out with his nose bent sideways. Another limped off with his corner man holding a towel over his eye.<br>You kept your hood low and didn’t speak to anyone<br>At the registration table, you registerd yoruself using fake name <br>They didn’t know you were a traitor now. but its always better to be cautious<br>Before stepping into the prep area, you pulled out a crumpled paper bag mask—the same one you’d used before. Ripped eye holes, nothing fancy. Just enough to keep your face hidden`,
                                      `<strong>Match Starts</strong><br><br>Your first opponent was already in the ring—shirt off, bouncing on his heels, built like a small tank.<br>They called your fake name. You walked out<br>“What the hell’s with the bag?”<br>“New guy’s got jokes.”<br>You didn’t react.<br><strong>The bell rang!!.</strong>`],
                                    game_title: "Risky battle begins",
                                    game_desc: "Upgrade your stats before the battle",
                                    actions: [{
                                      label: "START",
                                      next: {
                                        battle_sequence: ['NPC1', 'NPC2', 'NPC3'],
                                        win: {
                                          gold: { min: 30, max: 60 },
                                          substory: [`Now you have defeated your opponents now times for the final round<br>By now, the mood had shifted.<br>No one was laughing about the paper bag anymore.<br> Whispers started:“This guy’s for real.”<br>"He defeated all those strong fighter with much effort but that's it"<br>"He still not match for Hong"<br>Someone yelled,“Bring out Jikwang Hong!”<br>And that’s when the doors opened`,
                                            `<strong>Enter: Jikwang Hong</strong><br><br>You turned.<br>Jikwang Hong walked in, casual like he owned the place.<br>Buzzcut. Faded knuckle scars. Broad shoulders, no nonsense in his stride.<br>He looked at you, sizing you up from across the ring<br>“You made it this far with a paper bag on your head,” he said, voice dry.<br>“But this is the end of the road.”<br>You said nothing.<br><br>“Life doesn’t go the way people want,” he muttered.<br>It sounded like more than just trash talk… but you didn’t have time to think about it.<br>The bell rang.`],
                                          battle: 'Jikwang_Hong',
                                          win: {
                                            gold: { min: 80, max: 120 },
                                            substory: [`<strong>You defeated Jikwang Hong,</strong>.`],
                                            game_title: "Choose your rewards",
                                            game_desc: " ",
                                            cards: [{
                                              name: "Limit Breaker", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 60, desc: `Temporarly Buff the user Strength Stat by 50 for 5 turns.<br>SPD +1, TECH +1`,
                                              effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 50, buffDuration: 5, cooldown: 6, usesLimit: 1, gif: "cha/auraa.gif", sound: "cha/sound/aura.wav", gif_target: "player", glowEffect: { color: 'red' },
                                            }, {
                                              name: "CQC", type: "attack", isSealable: true, staminaCost: 65, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1, STR +1`,
                                              effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 145, max: 190 }, cooldown: 9, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
                                              secondaryEffect: {
                                                type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                                              }
                                            }, {
                                              name: "Crushing Python", type: "debuff", subType: "stun", isSealable: true, staminaCost: 80, desc: `Bind the target for 5 Turns with whole stats reduction by 30% <br>DUR+2, STR +1`,
                                              stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/bind.gif", gif_target: "opponent", stunEffectGif: "/cha/stun.gif",
                                              effects: { tech: 2, str: 1, statPoints: 2 },
                                              secondaryEffect: {
                                                type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                              }
                                            }
                                            ],
                                            next_story: {
                                              substory: [`<strong>After the Fight – The Twist</strong><br><br>The fight was over.Jikwang Hong lay on the floor, unconscious. The arena, once roaring with noise, had gone quiet.Little by little The crowd dispersed<br>You leaned against the wall, breathing heavily.<br>“Just one left…” you muttered.<br>“Only Jeongdu Ma remains.”<br>You pulled out your phone and called Han Jaeha, eager to brag.He picked up on the first ring.` <
                                                `<br>Han Jaeha: "What’s up? How’s the attack going?"<br>You: "I already beat No.6. All that’s left is Jeongdu Ma. What about you? Have you even started yet? Heh."<br>Han Jaeha (laughing): "I’m already done here, lol. We’ve defeated everyone."<br>But just as he said that, you heard it — screaming in the background. People crying out in pain.<br>Han Jaeha: "Wait… something’s happening. I’ll call you later."<br>He hung up.<br>A bad feeling crept in.<br><br>You tried calling Seok… but the call wouldn’t go through. No signal. No response.<br>Then—shadows moved. You looked around… and realized you were surrounded.<br>Members of the North, closing in. And leading them was Jeongdu Ma himself.<br>Jeongdu Ma: "You actually made a decent plan to take us down. We already expected this, though."<br>He smirked.<br>Jeongdu Ma: "We had a spy in your team… Seok Kang. South’s so-called leader. Hahaha!"<br>You: "What?? That pig Seok was with North all along?!"<br>Your phone rang again — Han Jaeha’s number.`,
                                                `<br>You picked it up, shouting: "Seok is a traitor—!"<br>But the voice on the other end wasn’t Han Jaeha’s.<br><br>You: "Choyun?! What happened to Han Jaeha?!"<br>Choyun: "Relax. He’s not dead… but he’s not in any condition to answer calls either."<br>Choyun: "Your plan failed. You can’t win. I’ll give you one last chance."<br>Choyun: "Come back and join us… or get killed here and now."<br>What will you do?....`],
                                              game_title: "Last Chance",
                                              game_desc: "",
                                              actions: [{
                                                label: "Rejects the offer",
                                                next: {
                                                  substory: [`Choyun: "Still taking their side, huh? Even after all this? Fine."<br>"Die then."<br>The call ended. Silence for a moment… then a shift in the air.<br>Jeongdu Ma cracked his knuckles and stepped forward<br>The real fight had begun.`],
                                                  battle: 'Jeongdu_Ma',
                                                  win: {
                                                    gold: { min: 100, max: 150 },
                                                    substory: [`You defeated Jeongdu Ma`],
                                                    game_title: "Choose your rewards",
                                                    game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                                    cards: [

                                                      {
                                                        name: "Diamond Skin", staminaCost: 70, type: "buff", // This card will appear in your "Buff Cards" list.
                                                        subType: "damage_reduction", // Our new, custom subtype.
                                                        isSealable: true,
                                                        desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 60%.",
                                                        // Optional: also gives a permanent stat boost.
                                                        buffDuration: 10, // The number of turns the effect will last.
                                                        reductionAmount: 0.4, // The multiplier for the damage (0.8 means 20% damage).
                                                        cooldown: 6,
                                                        usesLimit: 1,
                                                        gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                                                        gif_target: "player",
                                                        glowEffect: { color: 'green' }
                                                      }, {
                                                        name: "Infinite Technique", staminaCost: 85, type: "attack", isSealable: true, desc: `The pinnacle of combat mastery. You unleash a flawless, continuous barrage of attacks. Infinite Technique is a storm of martial arts that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                        damage: { min: 250, max: 300 }, cooldown: 8, usesLimit: 2, gif: "cha/rapid punch.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                                                        secondaryEffect: {
                                                          type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "/cha/stun.gif"
                                                        }
                                                      },
                                                      {
                                                        name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 40% of your max HP.`,
                                                        healPercent: 0.40, cooldown: 8, usesLimit: 2,
                                                      }, {
                                                        name: "Ultra Instinct", staminaCost: 60, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 60% when used (Can be stacked)`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", glowEffect: { color: 'black' }
                                                      },

                                                    ],
                                                    next_story: {
                                                      substory: [`You stepped out of the arena, blood still drying on your skin.<br>Jeongdu Ma was down. One of the strongest in the north—defeated. You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. “What happened?”<br>He looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Your eyes narrowed. “So it’s true. That Bastard was with them all along." <br>Suhyeon Kim nodded. “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>You glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                        `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br> On one side of him stood Seok Kang. On the other, Daniel.`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. You stepped forward.<br><br>Suhyeon Kim turned to you. “Let me handle that traitor and Daniel.”<br>You nodded. “Then I’ll take Choyun.”<br>Choyun’s smiled. “Come, then. Show me what you've got”<br><br><strong>The final fight—begins now.</strong>`],
                                                      battle: 'Choyun',
                                                      win: {
                                                        substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                        next_story: {
                                                          substory: ["The End. Thanks for playing!"],
                                                          // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                          onComplete: function () {
                                                            // Prepare and save the player's state for online mode
                                                            const onlineData = {
                                                              playerName: playerName,
                                                              stats: stats,
                                                              cards: playerCards,
                                                              playerCardImage: localStorage.getItem('playerCardImage'),
                                                              playerBattleImage: localStorage.getItem('playerBattleImage')
                                                            };
                                                            localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                            // Show a confirmation and the online button
                                                            showPopup("Online Mode Unlocked!");
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }, {
                                                label: "Accept the offer",
                                                next: {
                                                  substory: [`And in that moment, you made your choice.<br>“…Fine. I’ll join.”<br>There was a pause. Then Choyun let out a slow, satisfied laugh.<br>“Smart move. You value your life more than some hopeless war. I respect that. But now that you’ve rejoined us, it’s time you prove it.”<br><br>“…Prove it how?”<br><br>“Take down the remaining West Gang forces. Wipe them out.”<br>You clenched your fists. “I’m not strong enough to take on the entire West side alone.”<br>“You won’t be alone,” Choyun said. “You, Daniel, and Seok. That’ll be enough. But first… call Soohyun. Tell him to meet you. Alone. Somewhere quiet. Make it believable.”<br>You nodded slowly. “…Got it.”<br>You dialed Soohyun’s number. Your hand trembled a bit, but your voice stayed calm.<br>“Meet me at the meeting place. Alone. There’s something I need to tell you… face-to-face.” Soohyun didn’t hesitate. “Alright. I’ll be there.”`,
                                                    `While Soohyun headed into the trap, you, Daniel, and Seok moved through the shadows of Gangbuk’s war-torn backstreets. The only ones left standing in the West were Soohyun’s remaining crew—and Uijin Gyeong. And that was a problem.<br><br>Uijin Gyeong spotted you three approaching and stepped forward, glaring.<br>“What’s this?” he asked, eyes narrowing. “Why are you here… with Seok and Daniel? Where’s Soohyun?”<br>You didn’t answer.<br>A few long seconds passed.<br>Then Uijin’s expression twisted. His voice lowered <br>“So that’s why Han Jaeha isn’t answering his phone…”<br>His fists clenched.<br><strong>“You really betrayed us.”</strong><br>You looked at Seok and Daniel. “Take care of the rest. Leave Uijin to me.”<br>They nodded and rushed into the fray.<br>You stepped toward Uijin, heart pounding, face grim.<br>No turning back now. `],
                                                  battle: 'Uijin_Gyeong',
                                                  win: {
                                                    gold: { min: 100, max: 150 },
                                                    substory: [`You defeated Uijin Gyeong`],
                                                    game_title: "Choose your rewards",
                                                    game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                                    cards: [
                                                      {
                                                        name: "Diamond Scale", type: "buff", // This card will appear in your "Buff Cards" list.
                                                        subType: "damage_reduction", // Our new, custom subtype.
                                                        staminaCost: 65,
                                                        isSealable: true,
                                                        desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 45%.",
                                                        // Optional: also gives a permanent stat boost.
                                                        buffDuration: 9, // The number of turns the effect will last.
                                                        reductionAmount: 0.55, // The multiplier for the damage (0.8 means 20% damage).
                                                        cooldown: 6,
                                                        usesLimit: 1,
                                                        gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                                                        gif_target: "player",
                                                        glowEffect: { color: 'green' }
                                                      }, {
                                                        name: "Conviction Mastery", staminaCost: 95, type: "attack", isSealable: true, desc: `The pinnacle of mastery. You unleash a flawless, continuous barrage of powerful attacks. Conviction Strength is a mastery that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                        damage: { min: 280, max: 295 }, cooldown: 7, usesLimit: 2, gif: "cha/vac ppunch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                                                        secondaryEffect: {
                                                          type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "cha/stun.gif"
                                                        }
                                                      },
                                                      {
                                                        name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 36% of your max HP.`,
                                                        healPercent: 0.36, cooldown: 8, usesLimit: 2,
                                                      }, {
                                                        name: "True Ultra Instinct", staminaCost: 70, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 65% when used (Can be stacked)`, buffAmount: 1.65, cooldown: 12, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", sound: "cha/sound/aura.wav", glowEffect: { color: 'black' }
                                                      },],
                                                    next_story: {
                                                      substory: [`You have defeated Uijin but both seok and Daniel are injured and unable to fight, You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. Suheyon asked “What happened?”<br>you looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Suhyeon  eyes narrowed. “So it’s true. That Bastard was with them all along." <br>  “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>Suhyeon glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                        `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br>`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. Choyun smirked "Do you really think He on your side Suheyon"<br><br>Suheyon confused "What? Do you think he betrayed me lol he didnt am i right?" <br><br> you didnt said anything <br> You stepped forward. Suheyon feels betrayed<br><br> Choyun said "Do you think you can handle us both?? haha Give up"<br>You still feeling conflicted...`],
                                                      game_title: `Final battle Final Chance`,
                                                      game_desc: `You still felt conflicted. you can still choose what to do next `,
                                                      // Replace the old actions array with this one
                                                      actions: [{
                                                        label: `Choose to Side with Suheyon kim`,
                                                        next: { // CORRECT: The battle logic is now inside 'next'
                                                          battle: 'Choyun',
                                                          win: {
                                                            substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                            next_story: {
                                                              substory: ["The End. Thanks for playing!"],
                                                              // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                              onComplete: function () {
                                                                // Prepare and save the player's state for online mode
                                                                const onlineData = {
                                                                  playerName: playerName,
                                                                  stats: stats,
                                                                  cards: playerCards,
                                                                  playerCardImage: localStorage.getItem('playerCardImage'),
                                                                  playerBattleImage: localStorage.getItem('playerBattleImage')
                                                                };
                                                                localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                                // Show a confirmation and the online button
                                                                showPopup("Online Mode Unlocked!");
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }, {
                                                        label: `Choose to Side with Choyun`,
                                                        next: { // CORRECT: The battle logic is now inside 'next'
                                                          battle: 'Suheyon_kim',
                                                          win: {
                                                            // Step 1: Tell the story of the victory.
                                                            substory: [
                                                              `You defeated Suheyon,<br>You stood over Suheyon’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Suheyon loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“I never thought… you would be the one to betray me,” he said, voice cracked, barely more than a whisper.<br>You opened your mouth, but no words came out.`,
                                                              `<br>Then—without warning—Choyun stepped forward.<br> He grabbed Soohyun by the throat, lifting him like a doll. Soohyun’s body jerked as Choyun’s uses mana drain on Soohyun, draining every last bit of power he had left<br><br>You stood frozen.You wanted to stop it.<br>But you didn’t.Couldn’t.<br>When Choyun let go, Soohyun crumpled to the ground, nothing more than skin and bones—a husk of the fighter he once was<br>He stretched his arms out as if addressing the entire world.<br>“Gangbuk was just the beginning. Soon, all of Seoul will kneel. The age of gangs? No. This will be a reign. My reign.”`,
                                                              `You had made your choice.<br><br>But as Choyun walked past you, crackling with Sudden power, you realized something:<br>This wasn’t victory.<br>This was the beginning of something far darker.`
                                                            ],
                                                            // Step 2: After the story, trigger the video.
                                                            next_story: {
                                                              end_video: {
                                                                src: "cha/end-choyun.mp4", // Path to your video file
                                                                // Step 3: After the video, show the final message.
                                                                next: {
                                                                  substory: ["The Dark End. Thanks for playing!"],
                                                                  actions: []
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }]
                                                    }
                                                  }
                                                }
                                              }
                                              ]
                                            }
                                          }
                                        }
                                      }
                                    }]
                                  }
                                }]
                              }
                            }]
                          }

                        }, {
                          label: "Fight Local Thugs",
                          next: {
                            battle_sequence: ['L_Thug1', 'L_Thug2', 'L_Thug3',],
                            win: {
                              gold: { min: 30, max: 60 },
                              game_title: `You defeated Local bullies`,
                              game_desc: `Choose your reward.`,
                              cards: [{
                                name: "Stats point reward", desc: `Get the 7 stats point as rewards `,
                                effects: { statPoints: 7 },
                              }, {
                                name: "Strength card", desc: `You get sudden leap in Strength<br>STR +8`,
                                effects: { str: 8 },
                              }, {
                                name: "Technique card", desc: `You skills ot sharpher<br>STR +8`,
                                effects: { tech: 8 },
                              }, {
                                name: "Endurance card", desc: `You get sudden leap in Speed<br>END +8`,
                                effects: { end: 8 },
                              }],
                              next_story: {
                                substory: ["You feel your body getting stronger."],
                                game_title: "Now you are at the END GAME",
                                game_desc: "",
                                actions: [{
                                  label: "Continue",
                                  effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 10 },
                                  next: {
                                    substory: [`It had been a month since you disappeared from the streets.<br> In that time, you'd put everything into getting stronger—mentally and physically.<br> Now, it was time to come back<br>You called Suhyeon Kim, and he told you to come to Western Gangbuk High<br>You expected a quiet meetup.What you found was a full war council<br>You spotted Kang Seok, the Southern Gangbuk leader, standing near the wall with his usual dead-serious expression.<br>Then, near the back, leaning against the wall with his arms crossed and a laid-back look on his face— <br>Han Jaeha, leader of Eastern Gangbuk.<br>You walked over.<br><br>“Long time no see,” Jaeha said with a crooked grin.<br>“Yeah,” you replied. “Feels like forever.”`,
                                      `He asked.<br>“So, you’re with us now? For real?”<br>You nodded.<br>“Yup.”<br>He looked you over, impressed.<br>“Then we’ve got ourselves some serious firepower.”<br>Before more words could be exchanged, Suhyeon Kim entered the room .“Good. Everyone’s here,” he said.`, `<strong>The Plan Begins</strong><br><br>Suhyeon Kim unrolled a large city map over a folding table.<br>“We’ve gathered solid intel on Northern Gangbuk. Their manpower is insane—if we try to storm them head-on, we’ll get crushed.”<br>“Instead, we strike strategically. Four key operations—they’re the heart of North Gangbuk’s underground empire.”<br>he pointed to four marked locations:<br><br>
                                                                                                   <ul><li>🎤 Karaoke Bar: “Run by No. 5 Jun Jang, with several elite executives.”</li><li>🥊 Fighting Arena: “The strongest holdout. Controlled by No. 3 Jeongdu Ma and No. 6 Jikwang Hong.”</li><li>🎰 Casino: “Managed by No. 4 Jiwon Seo and No. 8 Jintae Heo.”</li><li>💉 Drug Den: “A dark hole crawling with executive-level enforcers.”</li></ul><br>`
                                      , `Suhyeon Kim continued:“Here’s how we’ll divide our forces.”<br> South Gangbuk, led by Kang Seok and with Seonu Ha, will hit the Drug Den.<br>Han Jaeha and Taeho Cheon from the East will target the Karaoke Bar.<br>I and Uijin Gyeong will take Western forces to the Fighting Arena.<br>You, along with some of our best from West, will handle the Casino.<br><br>But you raised your hand.“Switch me. I’ll take the Arena.”<br>Everyone paused.<br>Suhyeon Kim gave you a look.<br>“That’s the most heavily guarded location. You’d be going straight into the toughest part.”<br>You smirked.“I didn’t spend a month hiding in alleyways and fighting just to play it safe.”<br>Then Suhyeon Kim gave a faint smile.<br>“Alright. Then it’s settled.”`
                                      , `he stepped back and looked at the group.<br>“Once all four targets are neutralized, we regroup. One final assault—on Choyun.”<br><br>Everyone responded in unison:<br>“Got it.”One by one, the gangs began dispersing—each team heading toward their battlefield.Your destination: The Arena.`],
                                    game_title: "You arrived at fighting arena",
                                    game_desc: "",
                                    actions: [{
                                      label: "GET READY TO WORK",
                                      next: {
                                        substory: [`You arrived at the Underground Fighting Arena just before sundown.<br>The place wasn’t flashy—just a massive concrete hall deep in North Gangbuk territory. Dim lighting. The air was heavy with sweat, blood, and cheap smoke. You could hear the crowd, chaotic, hungry for violence<br>Inside, the fights were already in full swing<br>One guy was getting dragged out with his nose bent sideways. Another limped off with his corner man holding a towel over his eye.<br>You kept your hood low and didn’t speak to anyone<br>At the registration table, you registerd yoruself using fake name <br>They didn’t know you were a traitor now. but its always better to be cautious<br>Before stepping into the prep area, you pulled out a crumpled paper bag mask—the same one you’d used before. Ripped eye holes, nothing fancy. Just enough to keep your face hidden`,
                                          `<strong>Match Starts</strong><br><br>Your first opponent was already in the ring—shirt off, bouncing on his heels, built like a small tank.<br>They called your fake name. You walked out<br>“What the hell’s with the bag?”<br>“New guy’s got jokes.”<br>You didn’t react.<br><strong>The bell rang!!.</strong>`],
                                        game_title: "Risky battle begins",
                                        game_desc: "Upgrade your stats before the battle",
                                        actions: [{
                                          label: "START",
                                          next: {
                                            battle_sequence: ['NPC1', 'NPC2', 'NPC3'],
                                            win: {
                                              gold: { min: 30, max: 60 },
                                              substory: [`Now you have defeated your opponents now times for the final round<br>By now, the mood had shifted.<br>No one was laughing about the paper bag anymore.<br> Whispers started:“This guy’s for real.”<br>"He defeated all those strong fighter with much effort but that's it"<br>"He still not match for Hong"<br>Someone yelled,“Bring out Jikwang Hong!”<br>And that’s when the doors opened`,
                                                `<strong>Enter: Jikwang Hong</strong><br><br>You turned.<br>Jikwang Hong walked in, casual like he owned the place.<br>Buzzcut. Faded knuckle scars. Broad shoulders, no nonsense in his stride.<br>He looked at you, sizing you up from across the ring<br>“You made it this far with a paper bag on your head,” he said, voice dry.<br>“But this is the end of the road.”<br>You said nothing.<br><br>“Life doesn’t go the way people want,” he muttered.<br>It sounded like more than just trash talk… but you didn’t have time to think about it.<br>The bell rang.`],
                                              battle: 'Jikwang_Hong',
                                              win: {
                                                gold: { min: 80, max: 120 },
                                                substory: [`<strong>You defeated Jikwang Hong,</strong>.`],
                                                game_title: "Choose your rewards",
                                                game_desc: " ",
                                                cards: [{
                                                  name: "Limit Breaker", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 60, desc: `Temporarly Buff the user Strength Stat by 50 for 5 turns.<br>SPD +1, TECH +1`,
                                                  effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 50, buffDuration: 5, cooldown: 6, usesLimit: 1, gif: "cha/auraa.gif", sound: "cha/sound/aura.wav", gif_target: "player", glowEffect: { color: 'red' },
                                                }, {
                                                  name: "CQC", type: "attack", isSealable: true, staminaCost: 65, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1, STR +1`,
                                                  effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 145, max: 190 }, cooldown: 9, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
                                                  secondaryEffect: {
                                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                                                  }
                                                }, {
                                                  name: "Crushing Python", type: "debuff", subType: "stun", isSealable: true, staminaCost: 80, desc: `Bind the target for 5 Turns with whole stats reduction by 30% <br>DUR+2, STR +1`,
                                                  stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/bind.gif", gif_target: "opponent", stunEffectGif: "/cha/stun.gif",
                                                  effects: { tech: 2, str: 1, statPoints: 2 },
                                                  secondaryEffect: {
                                                    type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                                  }
                                                }
                                                ],
                                                next_story: {
                                                  substory: [`<strong>After the Fight – The Twist</strong><br><br>The fight was over.Jikwang Hong lay on the floor, unconscious. The arena, once roaring with noise, had gone quiet.Little by little The crowd dispersed<br>You leaned against the wall, breathing heavily.<br>“Just one left…” you muttered.<br>“Only Jeongdu Ma remains.”<br>You pulled out your phone and called Han Jaeha, eager to brag.He picked up on the first ring.` <
                                                    `<br>Han Jaeha: "What’s up? How’s the attack going?"<br>You: "I already beat No.6. All that’s left is Jeongdu Ma. What about you? Have you even started yet? Heh."<br>Han Jaeha (laughing): "I’m already done here, lol. We’ve defeated everyone."<br>But just as he said that, you heard it — screaming in the background. People crying out in pain.<br>Han Jaeha: "Wait… something’s happening. I’ll call you later."<br>He hung up.<br>A bad feeling crept in.<br><br>You tried calling Seok… but the call wouldn’t go through. No signal. No response.<br>Then—shadows moved. You looked around… and realized you were surrounded.<br>Members of the North, closing in. And leading them was Jeongdu Ma himself.<br>Jeongdu Ma: "You actually made a decent plan to take us down. We already expected this, though."<br>He smirked.<br>Jeongdu Ma: "We had a spy in your team… Seok Kang. South’s so-called leader. Hahaha!"<br>You: "What?? That pig Seok was with North all along?!"<br>Your phone rang again — Han Jaeha’s number.`,
                                                    `<br>You picked it up, shouting: "Seok is a traitor—!"<br>But the voice on the other end wasn’t Han Jaeha’s.<br><br>You: "Choyun?! What happened to Han Jaeha?!"<br>Choyun: "Relax. He’s not dead… but he’s not in any condition to answer calls either."<br>Choyun: "Your plan failed. You can’t win. I’ll give you one last chance."<br>Choyun: "Come back and join us… or get killed here and now."<br>What will you do?....`],
                                                  game_title: "Last Chance",
                                                  game_desc: " ",
                                                  actions: [{
                                                    label: "Rejects the offer",
                                                    next: {
                                                      substory: [`Choyun: "Still taking their side, huh? Even after all this? Fine."<br>"Die then."<br>The call ended. Silence for a moment… then a shift in the air.<br>Jeongdu Ma cracked his knuckles and stepped forward<br>The real fight had begun.`],
                                                      battle: 'Jeongdu_Ma',
                                                      win: {
                                                        gold: { min: 100, max: 150 },
                                                        substory: [`You defeated Jeongdu Ma`],
                                                        game_title: "Choose your rewards",
                                                        game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                                        cards: [

                                                          {
                                                            name: "Diamond Skin", staminaCost: 70, type: "buff", // This card will appear in your "Buff Cards" list.
                                                            subType: "damage_reduction", // Our new, custom subtype.
                                                            isSealable: true,
                                                            desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 60%.",
                                                            // Optional: also gives a permanent stat boost.
                                                            buffDuration: 10, // The number of turns the effect will last.
                                                            reductionAmount: 0.4, // The multiplier for the damage (0.8 means 20% damage).
                                                            cooldown: 6,
                                                            usesLimit: 1,
                                                            gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                                                            gif_target: "player",
                                                            glowEffect: { color: 'green' }
                                                          }, {
                                                            name: "Infinite Technique", staminaCost: 85, type: "attack", isSealable: true, desc: `The pinnacle of combat mastery. You unleash a flawless, continuous barrage of attacks. Infinite Technique is a storm of martial arts that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                            damage: { min: 250, max: 300 }, cooldown: 8, usesLimit: 2, gif: "cha/rapid punch.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                                                            secondaryEffect: {
                                                              type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "/cha/stun.gif"
                                                            }
                                                          },
                                                          {
                                                            name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 40% of your max HP.`,
                                                            healPercent: 0.40, cooldown: 8, usesLimit: 2,
                                                          }, {
                                                            name: "Ultra Instinct", staminaCost: 60, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 60% when used (Can be stacked)`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", glowEffect: { color: 'black' }
                                                          },

                                                        ],
                                                        next_story: {
                                                          substory: [`You stepped out of the arena, blood still drying on your skin.<br>Jeongdu Ma was down. One of the strongest in the north—defeated. You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. “What happened?”<br>He looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Your eyes narrowed. “So it’s true. That Bastard was with them all along." <br>Suhyeon Kim nodded. “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>You glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                            `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br> On one side of him stood Seok Kang. On the other, Daniel.`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. You stepped forward.<br><br>Suhyeon Kim turned to you. “Let me handle that traitor and Daniel.”<br>You nodded. “Then I’ll take Choyun.”<br>Choyun’s smiled. “Come, then. Show me what you've got”<br><br><strong>The final fight—begins now.</strong>`],
                                                          battle: 'Choyun',
                                                          win: {
                                                            substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                            next_story: {
                                                              substory: ["The End. Thanks for playing!"],
                                                              // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                              onComplete: function () {
                                                                // Prepare and save the player's state for online mode
                                                                const onlineData = {
                                                                  playerName: playerName,
                                                                  stats: stats,
                                                                  cards: playerCards,
                                                                  playerCardImage: localStorage.getItem('playerCardImage'),
                                                                  playerBattleImage: localStorage.getItem('playerBattleImage')
                                                                };
                                                                localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                                // Show a confirmation and the online button
                                                                showPopup("Online Mode Unlocked!");
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }, {
                                                    label: "Accept the offer",
                                                    next: {
                                                      substory: [`And in that moment, you made your choice.<br>“…Fine. I’ll join.”<br>There was a pause. Then Choyun let out a slow, satisfied laugh.<br>“Smart move. You value your life more than some hopeless war. I respect that. But now that you’ve rejoined us, it’s time you prove it.”<br><br>“…Prove it how?”<br><br>“Take down the remaining West Gang forces. Wipe them out.”<br>You clenched your fists. “I’m not strong enough to take on the entire West side alone.”<br>“You won’t be alone,” Choyun said. “You, Daniel, and Seok. That’ll be enough. But first… call Soohyun. Tell him to meet you. Alone. Somewhere quiet. Make it believable.”<br>You nodded slowly. “…Got it.”<br>You dialed Soohyun’s number. Your hand trembled a bit, but your voice stayed calm.<br>“Meet me at the meeting place. Alone. There’s something I need to tell you… face-to-face.” Soohyun didn’t hesitate. “Alright. I’ll be there.”`,
                                                        `While Soohyun headed into the trap, you, Daniel, and Seok moved through the shadows of Gangbuk’s war-torn backstreets. The only ones left standing in the West were Soohyun’s remaining crew—and Uijin Gyeong. And that was a problem.<br><br>Uijin Gyeong spotted you three approaching and stepped forward, glaring.<br>“What’s this?” he asked, eyes narrowing. “Why are you here… with Seok and Daniel? Where’s Soohyun?”<br>You didn’t answer.<br>A few long seconds passed.<br>Then Uijin’s expression twisted. His voice lowered <br>“So that’s why Han Jaeha isn’t answering his phone…”<br>His fists clenched.<br><strong>“You really betrayed us.”</strong><br>You looked at Seok and Daniel. “Take care of the rest. Leave Uijin to me.”<br>They nodded and rushed into the fray.<br>You stepped toward Uijin, heart pounding, face grim.<br>No turning back now. `],
                                                      battle: 'Uijin_Gyeong',
                                                      win: {
                                                        gold: { min: 100, max: 150 },
                                                        substory: [`You defeated Uijin Gyeong`],
                                                        game_title: "Choose your rewards",
                                                        game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                                        cards: [
                                                          {
                                                            name: "Diamond Scale", type: "buff", // This card will appear in your "Buff Cards" list.
                                                            subType: "damage_reduction", // Our new, custom subtype.
                                                            isSealable: true,
                                                            staminaCost: 65,
                                                            desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 45%.",
                                                            // Optional: also gives a permanent stat boost.
                                                            buffDuration: 9, // The number of turns the effect will last.
                                                            reductionAmount: 0.55, // The multiplier for the damage (0.8 means 20% damage).
                                                            cooldown: 6,
                                                            usesLimit: 1,
                                                            gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                                                            gif_target: "player",
                                                            glowEffect: { color: 'green' }
                                                          }, {
                                                            name: "Conviction Mastery", staminaCost: 95, type: "attack", isSealable: true, desc: `The pinnacle of mastery. You unleash a flawless, continuous barrage of powerful attacks. Conviction Strength is a mastery that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                            damage: { min: 280, max: 295 }, cooldown: 7, usesLimit: 2, gif: "cha/vac ppunch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                                                            secondaryEffect: {
                                                              type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "cha/stun.gif"
                                                            }
                                                          },
                                                          {
                                                            name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 36% of your max HP.`,
                                                            healPercent: 0.36, cooldown: 8, usesLimit: 2,
                                                          }, {
                                                            name: "True Ultra Instinct", staminaCost: 70, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 65% when used (Can be stacked)`, buffAmount: 1.65, cooldown: 12, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", sound: "cha/sound/aura.wav", glowEffect: { color: 'black' }
                                                          },],
                                                        next_story: {
                                                          substory: [`You have defeated Uijin but both seok and Daniel are injured and unable to fight, You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. Suheyon asked “What happened?”<br>you looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Suhyeon  eyes narrowed. “So it’s true. That Bastard was with them all along." <br>  “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>Suhyeon glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                            `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br>`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. Choyun smirked "Do you really think He on your side Suheyon"<br><br>Suheyon confused "What? Do you think he betrayed me lol he didnt am i right?" <br><br> you didnt said anything <br> You stepped forward. Suheyon feels betrayed<br><br> Choyun said "Do you think you can handle us both?? haha Give up"<br>You still feeling conflicted...`],
                                                          game_title: `Final battle Final Chance`,
                                                          game_desc: `You still felt conflicted. you can still choose what to do next `,
                                                          // Replace the old actions array with this one
                                                          actions: [{
                                                            label: `Choose to Side with Suheyon kim`,
                                                            next: { // CORRECT: The battle logic is now inside 'next'
                                                              battle: 'Choyun',
                                                              win: {
                                                                substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                                next_story: {
                                                                  substory: ["The End. Thanks for playing!"],
                                                                  // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                                  onComplete: function () {
                                                                    // Prepare and save the player's state for online mode
                                                                    const onlineData = {
                                                                      playerName: playerName,
                                                                      stats: stats,
                                                                      cards: playerCards,
                                                                      playerCardImage: localStorage.getItem('playerCardImage'),
                                                                      playerBattleImage: localStorage.getItem('playerBattleImage')
                                                                    };
                                                                    localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                                    // Show a confirmation and the online button
                                                                    showPopup("Online Mode Unlocked!");
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }, {
                                                            label: `Choose to Side with Choyun`,
                                                            next: { // CORRECT: The battle logic is now inside 'next'
                                                              battle: 'Suheyon_kim',
                                                              win: {
                                                                // Step 1: Tell the story of the victory.
                                                                substory: [
                                                                  `You defeated Suheyon,<br>You stood over Suheyon’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Suheyon loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“I never thought… you would be the one to betray me,” he said, voice cracked, barely more than a whisper.<br>You opened your mouth, but no words came out.`,
                                                                  `<br>Then—without warning—Choyun stepped forward.<br> He grabbed Soohyun by the throat, lifting him like a doll. Soohyun’s body jerked as Choyun’s uses mana drain on Soohyun, draining every last bit of power he had left<br><br>You stood frozen.You wanted to stop it.<br>But you didn’t.Couldn’t.<br>When Choyun let go, Soohyun crumpled to the ground, nothing more than skin and bones—a husk of the fighter he once was<br>He stretched his arms out as if addressing the entire world.<br>“Gangbuk was just the beginning. Soon, all of Seoul will kneel. The age of gangs? No. This will be a reign. My reign.”`,
                                                                  `You had made your choice.<br><br>But as Choyun walked past you, crackling with Sudden power, you realized something:<br>This wasn’t victory.<br>This was the beginning of something far darker.`
                                                                ],
                                                                // Step 2: After the story, trigger the video.
                                                                next_story: {
                                                                  end_video: {
                                                                    src: "cha/end-choyun.mp4", // Path to your video file
                                                                    // Step 3: After the video, show the final message.
                                                                    next: {
                                                                      substory: ["The Dark End. Thanks for playing!"],
                                                                      actions: []
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }]
                                                        }
                                                      }
                                                    }
                                                  }
                                                  ]
                                                }
                                              }
                                            }
                                          }
                                        }]
                                      }
                                    }]
                                  }
                                }]
                              }

                            }
                          }
                        }, {
                          label: "Help Han Jaeha",
                          race: true,
                          win: {
                            gold: 30,
                            game_title: "DELIVERY SUCCESS",
                            game_desc: "You have proven your worth The system grants you rewards.",
                            cards: [{
                              name: "Stats point reward", desc: `Get the 7 stats point as rewards `,
                              effects: { statPoints: 7 },
                            }, {
                              name: "Strength card", desc: `You get sudden leap in Strength<br>STR +8`,
                              effects: { str: 8 },
                            }, {
                              name: "Technique card", desc: `You skills ot sharpher<br>STR +8`,
                              effects: { tech: 8 },
                            }, {
                              name: "Endurance card", desc: `You get sudden leap in Speed<br>END +8`,
                              effects: { end: 8 },
                            }],
                            ////
                            next_story: {
                              substory: ["You feel your body getting stronger."],
                              game_title: "Now you are at the END GAME",
                              game_desc: "",
                              actions: [{
                                label: "Continue",
                                effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 10 },
                                next: {
                                  substory: [`It had been a month since you disappeared from the streets.<br> In that time, you'd put everything into getting stronger—mentally and physically.<br> Now, it was time to come back<br>You called Suhyeon Kim, and he told you to come to Western Gangbuk High<br>You expected a quiet meetup.What you found was a full war council<br>You spotted Kang Seok, the Southern Gangbuk leader, standing near the wall with his usual dead-serious expression.<br>Then, near the back, leaning against the wall with his arms crossed and a laid-back look on his face— <br>Han Jaeha, leader of Eastern Gangbuk.<br>You walked over.<br><br>“Long time no see,” Jaeha said with a crooked grin.<br>“Yeah,” you replied. “Feels like forever.”`,
                                    `He asked.<br>“So, you’re with us now? For real?”<br>You nodded.<br>“Yup.”<br>He looked you over, impressed.<br>“Then we’ve got ourselves some serious firepower.”<br>Before more words could be exchanged, Suhyeon Kim entered the room .“Good. Everyone’s here,” he said.`, `<strong>The Plan Begins</strong><br><br>Suhyeon Kim unrolled a large city map over a folding table.<br>“We’ve gathered solid intel on Northern Gangbuk. Their manpower is insane—if we try to storm them head-on, we’ll get crushed.”<br>“Instead, we strike strategically. Four key operations—they’re the heart of North Gangbuk’s underground empire.”<br>he pointed to four marked locations:<br><br>
                                                                                        <ul><li>🎤 Karaoke Bar: “Run by No. 5 Jun Jang, with several elite executives.”</li><li>🥊 Fighting Arena: “The strongest holdout. Controlled by No. 3 Jeongdu Ma and No. 6 Jikwang Hong.”</li><li>🎰 Casino: “Managed by No. 4 Jiwon Seo and No. 8 Jintae Heo.”</li><li>💉 Drug Den: “A dark hole crawling with executive-level enforcers.”</li></ul><br>`
                                    , `Suhyeon Kim continued:“Here’s how we’ll divide our forces.”<br> South Gangbuk, led by Kang Seok and with Seonu Ha, will hit the Drug Den.<br>Han Jaeha and Taeho Cheon from the East will target the Karaoke Bar.<br>I and Uijin Gyeong will take Western forces to the Fighting Arena.<br>You, along with some of our best from West, will handle the Casino.<br><br>But you raised your hand.“Switch me. I’ll take the Arena.”<br>Everyone paused.<br>Suhyeon Kim gave you a look.<br>“That’s the most heavily guarded location. You’d be going straight into the toughest part.”<br>You smirked.“I didn’t spend a month hiding in alleyways and fighting just to play it safe.”<br>Then Suhyeon Kim gave a faint smile.<br>“Alright. Then it’s settled.”`
                                    , `he stepped back and looked at the group.<br>“Once all four targets are neutralized, we regroup. One final assault—on Choyun.”<br><br>Everyone responded in unison:<br>“Got it.”One by one, the gangs began dispersing—each team heading toward their battlefield.Your destination: The Arena.`],
                                  game_title: "You arrived at fighting arena",
                                  game_desc: "",
                                  actions: [{
                                    label: "GET READY TO WORK",
                                    next: {
                                      substory: [`You arrived at the Underground Fighting Arena just before sundown.<br>The place wasn’t flashy—just a massive concrete hall deep in North Gangbuk territory. Dim lighting. The air was heavy with sweat, blood, and cheap smoke. You could hear the crowd, chaotic, hungry for violence<br>Inside, the fights were already in full swing<br>One guy was getting dragged out with his nose bent sideways. Another limped off with his corner man holding a towel over his eye.<br>You kept your hood low and didn’t speak to anyone<br>At the registration table, you registerd yoruself using fake name <br>They didn’t know you were a traitor now. but its always better to be cautious<br>Before stepping into the prep area, you pulled out a crumpled paper bag mask—the same one you’d used before. Ripped eye holes, nothing fancy. Just enough to keep your face hidden`,
                                        `<strong>Match Starts</strong><br><br>Your first opponent was already in the ring—shirt off, bouncing on his heels, built like a small tank.<br>They called your fake name. You walked out<br>“What the hell’s with the bag?”<br>“New guy’s got jokes.”<br>You didn’t react.<br><strong>The bell rang!!.</strong>`],
                                      game_title: "Risky battle begins",
                                      game_desc: "Upgrade your stats before the battle",
                                      actions: [{
                                        label: "START",
                                        next: {
                                          battle_sequence: ['NPC1', 'NPC2', 'NPC3'],
                                          win: {
                                            gold: { min: 30, max: 60 },
                                            substory: [`Now you have defeated your opponents now times for the final round<br>By now, the mood had shifted.<br>No one was laughing about the paper bag anymore.<br> Whispers started:“This guy’s for real.”<br>"He defeated all those strong fighter with much effort but that's it"<br>"He still not match for Hong"<br>Someone yelled,“Bring out Jikwang Hong!”<br>And that’s when the doors opened`,
                                              `<strong>Enter: Jikwang Hong</strong><br><br>You turned.<br>Jikwang Hong walked in, casual like he owned the place.<br>Buzzcut. Faded knuckle scars. Broad shoulders, no nonsense in his stride.<br>He looked at you, sizing you up from across the ring<br>“You made it this far with a paper bag on your head,” he said, voice dry.<br>“But this is the end of the road.”<br>You said nothing.<br><br>“Life doesn’t go the way people want,” he muttered.<br>It sounded like more than just trash talk… but you didn’t have time to think about it.<br>The bell rang.`],
                                            battle: 'Jikwang_Hong',
                                            win: {
                                              gold: { min: 80, max: 120 },
                                              substory: [`<strong>You defeated Jikwang Hong,</strong>.`],
                                              game_title: "Choose your rewards",
                                              game_desc: " ",
                                              cards: [{
                                                name: "Limit Breaker", type: "buff", subType: "temp_stat", isSealable: true, staminaCost: 60, desc: `Temporarly Buff the user Strength Stat by 50 for 5 turns.<br>SPD +1, TECH +1`,
                                                effects: { spd: 1, tech: 1, statPoints: 2 }, statToBuff: "str", buffValue: 50, buffDuration: 5, cooldown: 6, usesLimit: 1, gif: "cha/auraa.gif", sound: "cha/sound/aura.wav", gif_target: "player", glowEffect: { color: 'red' },
                                              }, {
                                                name: "CQC", type: "attack", isSealable: true, staminaCost: 65, desc: `continuous barrage of close-range strikes—elbows, knees, and punches—giving them absolutely no space to think or react..<br>TECH +1, STR +1`,
                                                effects: { tech: 1, str: 1, statPoints: 2 }, damage: { min: 145, max: 190 }, cooldown: 9, gif: "cha/slash.gif", gif_target: "opponent", sound: "cha/sound/cut.mp3",
                                                secondaryEffect: {
                                                  type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif"
                                                }
                                              }, {
                                                name: "Crushing Python", type: "debuff", subType: "stun", isSealable: true, staminaCost: 80, desc: `Bind the target for 5 Turns with whole stats reduction by 30% <br>DUR+2, STR +1`,
                                                stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "/cha/bind.gif", gif_target: "opponent", stunEffectGif: "/cha/stun.gif",
                                                effects: { tech: 2, str: 1, statPoints: 2 },
                                                secondaryEffect: {
                                                  type: "debuff", subType: "stat_reduction", statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.70, debuffDuration: 8  //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                                }
                                              }
                                              ],
                                              next_story: {
                                                substory: [`<strong>After the Fight – The Twist</strong><br><br>The fight was over.Jikwang Hong lay on the floor, unconscious. The arena, once roaring with noise, had gone quiet.Little by little The crowd dispersed<br>You leaned against the wall, breathing heavily.<br>“Just one left…” you muttered.<br>“Only Jeongdu Ma remains.”<br>You pulled out your phone and called Han Jaeha, eager to brag.He picked up on the first ring.` <
                                                  `<br>Han Jaeha: "What’s up? How’s the attack going?"<br>You: "I already beat No.6. All that’s left is Jeongdu Ma. What about you? Have you even started yet? Heh."<br>Han Jaeha (laughing): "I’m already done here, lol. We’ve defeated everyone."<br>But just as he said that, you heard it — screaming in the background. People crying out in pain.<br>Han Jaeha: "Wait… something’s happening. I’ll call you later."<br>He hung up.<br>A bad feeling crept in.<br><br>You tried calling Seok… but the call wouldn’t go through. No signal. No response.<br>Then—shadows moved. You looked around… and realized you were surrounded.<br>Members of the North, closing in. And leading them was Jeongdu Ma himself.<br>Jeongdu Ma: "You actually made a decent plan to take us down. We already expected this, though."<br>He smirked.<br>Jeongdu Ma: "We had a spy in your team… Seok Kang. South’s so-called leader. Hahaha!"<br>You: "What?? That pig Seok was with North all along?!"<br>Your phone rang again — Han Jaeha’s number.`,
                                                  `<br>You picked it up, shouting: "Seok is a traitor—!"<br>But the voice on the other end wasn’t Han Jaeha’s.<br><br>You: "Choyun?! What happened to Han Jaeha?!"<br>Choyun: "Relax. He’s not dead… but he’s not in any condition to answer calls either."<br>Choyun: "Your plan failed. You can’t win. I’ll give you one last chance."<br>Choyun: "Come back and join us… or get killed here and now."<br>What will you do?....`],
                                                game_title: "Last Chance",
                                                game_desc: " choice",
                                                actions: [{
                                                  label: "Rejects the offer",
                                                  next: {
                                                    substory: [`Choyun: "Still taking their side, huh? Even after all this? Fine."<br>"Die then."<br>The call ended. Silence for a moment… then a shift in the air.<br>Jeongdu Ma cracked his knuckles and stepped forward<br>The real fight had begun.`],
                                                    battle: 'Jeongdu_Ma',
                                                    win: {
                                                      gold: { min: 100, max: 150 },
                                                      substory: [`You defeated Jeongdu Ma`],
                                                      game_title: "Choose your rewards",
                                                      game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                                      cards: [

                                                        {
                                                          name: "Diamond Skin", staminaCost: 70, type: "buff", // This card will appear in your "Buff Cards" list.
                                                          subType: "damage_reduction", // Our new, custom subtype.
                                                          isSealable: true,
                                                          desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 60%.",
                                                          // Optional: also gives a permanent stat boost.
                                                          buffDuration: 10, // The number of turns the effect will last.
                                                          reductionAmount: 0.4, // The multiplier for the damage (0.8 means 20% damage).
                                                          cooldown: 6,
                                                          usesLimit: 1,
                                                          gif: "/cha/barrier (2).gif", // Make sure you have a GIF for this.
                                                          gif_target: "player",
                                                          glowEffect: { color: 'green' }
                                                        }, {
                                                          name: "Infinite Technique", staminaCost: 85, type: "attack", isSealable: true, desc: `The pinnacle of combat mastery. You unleash a flawless, continuous barrage of attacks. Infinite Technique is a storm of martial arts that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                          damage: { min: 250, max: 300 }, cooldown: 8, usesLimit: 2, gif: "cha/rapid punch.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav",
                                                          secondaryEffect: {
                                                            type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "/cha/stun.gif"
                                                          }
                                                        },
                                                        {
                                                          name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 40% of your max HP.`,
                                                          healPercent: 0.40, cooldown: 8, usesLimit: 2,
                                                        }, {
                                                          name: "Ultra Instinct", staminaCost: 60, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 60% when used (Can be stacked)`, buffAmount: 1.60, cooldown: 10, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", glowEffect: { color: 'black' }
                                                        },

                                                      ],
                                                      next_story: {
                                                        substory: [`You stepped out of the arena, blood still drying on your skin.<br>Jeongdu Ma was down. One of the strongest in the north—defeated. You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. “What happened?”<br>He looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Your eyes narrowed. “So it’s true. That Bastard was with them all along." <br>Suhyeon Kim nodded. “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>You glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                          `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br> On one side of him stood Seok Kang. On the other, Daniel.`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. You stepped forward.<br><br>Suhyeon Kim turned to you. “Let me handle that traitor and Daniel.”<br>You nodded. “Then I’ll take Choyun.”<br>Choyun’s smiled. “Come, then. Show me what you've got”<br><br><strong>The final fight—begins now.</strong>`],
                                                        battle: 'Choyun',
                                                        win: {
                                                          substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                          next_story: {
                                                            substory: ["The End. Thanks for playing!"],
                                                            // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                            onComplete: function () {
                                                              // Prepare and save the player's state for online mode
                                                              const onlineData = {
                                                                playerName: playerName,
                                                                stats: stats,
                                                                cards: playerCards,
                                                                playerCardImage: localStorage.getItem('playerCardImage'),
                                                                playerBattleImage: localStorage.getItem('playerBattleImage')
                                                              };
                                                              localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                              // Show a confirmation and the online button
                                                              showPopup("Online Mode Unlocked!");
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }, {
                                                  label: "Accept the offer",
                                                  next: {
                                                    substory: [`And in that moment, you made your choice.<br>“…Fine. I’ll join.”<br>There was a pause. Then Choyun let out a slow, satisfied laugh.<br>“Smart move. You value your life more than some hopeless war. I respect that. But now that you’ve rejoined us, it’s time you prove it.”<br><br>“…Prove it how?”<br><br>“Take down the remaining West Gang forces. Wipe them out.”<br>You clenched your fists. “I’m not strong enough to take on the entire West side alone.”<br>“You won’t be alone,” Choyun said. “You, Daniel, and Seok. That’ll be enough. But first… call Soohyun. Tell him to meet you. Alone. Somewhere quiet. Make it believable.”<br>You nodded slowly. “…Got it.”<br>You dialed Soohyun’s number. Your hand trembled a bit, but your voice stayed calm.<br>“Meet me at the meeting place. Alone. There’s something I need to tell you… face-to-face.” Soohyun didn’t hesitate. “Alright. I’ll be there.”`,
                                                      `While Soohyun headed into the trap, you, Daniel, and Seok moved through the shadows of Gangbuk’s war-torn backstreets. The only ones left standing in the West were Soohyun’s remaining crew—and Uijin Gyeong. And that was a problem.<br><br>Uijin Gyeong spotted you three approaching and stepped forward, glaring.<br>“What’s this?” he asked, eyes narrowing. “Why are you here… with Seok and Daniel? Where’s Soohyun?”<br>You didn’t answer.<br>A few long seconds passed.<br>Then Uijin’s expression twisted. His voice lowered <br>“So that’s why Han Jaeha isn’t answering his phone…”<br>His fists clenched.<br><strong>“You really betrayed us.”</strong><br>You looked at Seok and Daniel. “Take care of the rest. Leave Uijin to me.”<br>They nodded and rushed into the fray.<br>You stepped toward Uijin, heart pounding, face grim.<br>No turning back now. `],
                                                    battle: 'Uijin_Gyeong',
                                                    win: {
                                                      gold: { min: 100, max: 150 },
                                                      substory: [`You defeated Uijin Gyeong`],
                                                      game_title: "Choose your rewards",
                                                      game_desc: "<b>* UPGRADE YOUR STATS BEFORE FINAL BATTLE *</b> ",
                                                      cards: [
                                                        {
                                                          name: "Diamond Scale", type: "buff", // This card will appear in your "Buff Cards" list.
                                                          subType: "damage_reduction", // Our new, custom subtype.
                                                          isSealable: true,
                                                          staminaCost: 65,
                                                          desc: "You push your body beyond its natural limits, achieving a state of hardness comparable to diamond...For the next 10 turns, all damage taken from the opponent is reduced by 45%.",
                                                          // Optional: also gives a permanent stat boost.
                                                          buffDuration: 9, // The number of turns the effect will last.
                                                          reductionAmount: 0.55, // The multiplier for the damage (0.8 means 20% damage).
                                                          cooldown: 6,
                                                          usesLimit: 1,
                                                          gif: "/cha/stone-skin.gif", // Make sure you have a GIF for this.
                                                          gif_target: "player",
                                                          glowEffect: { color: 'green' }
                                                        }, {
                                                          name: "Conviction Mastery", staminaCost: 95, type: "attack", isSealable: true, desc: `The pinnacle of mastery. You unleash a flawless, continuous barrage of powerful attacks. Conviction Strength is a mastery that completely overwhelms the opponent.—giving them absolutely no space to think or react...`,
                                                          damage: { min: 280, max: 295 }, cooldown: 7, usesLimit: 2, gif: "cha/vac ppunch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3",
                                                          secondaryEffect: {
                                                            type: "debuff", subType: "stun", stunTurns: 3, stunEffectGif: "cha/stun.gif"
                                                          }
                                                        },
                                                        {
                                                          name: "Second Life", type: "buff", staminaCost: 50, subType: "heal", isSealable: true, desc: `Drinking it flushes the body with pure restorative data, healing all wounds, purging all ailments, and restoring you to peak condition. Heal for 36% of your max HP.`,
                                                          healPercent: 0.36, cooldown: 8, usesLimit: 2,
                                                        }, {
                                                          name: "True Ultra Instinct", staminaCost: 70, type: "buff", subType: "multiplier", isSealable: true, desc: `Your killer instinct awakens. You focus your power for a single, decisive blow to finish the fight...Increase the user strength by 65% when used (Can be stacked)`, buffAmount: 1.65, cooldown: 12, usesLimit: 2, gif: "./cha/auraa.gif", gif_target: "player", sound: "cha/sound/aura.wav", glowEffect: { color: 'black' }
                                                        },],
                                                      next_story: {
                                                        substory: [`You have defeated Uijin but both seok and Daniel are injured and unable to fight, You didn’t have time to rest. You rushed to the meeting location.<br>Suhyeon Kim was already there—alone<br>You approached him quickly. Suheyon asked “What happened?”<br>you looked up, tired but still standing. “Everything was going smoothly at first. Each squad took their target.<br>But then the rest of Choyun’s top executives showed up... and <strong>Seok Kang</strong> _That bastard betrayed us.”<br>Suhyeon  eyes narrowed. “So it’s true. That Bastard was with them all along." <br>  “We got overwhelmed, but we managed to beat them. Still... everyone else is too injured to keep going. It’s just us now.”<br><br>Suhyeon glanced toward the distance, heart steady. “Then we finish it. Just the two of us.”<br>`,
                                                          `You both headed out. Through the quiet streets. Toward the heart of the north.<br>And there he was—Choyun.<br>Standing calmly with his arms crossed.<br>`, `<br>Choyun looked at you both. <br>“So… only two of you left. You really think you can do anything now?”<br>You and Suhyeon Kim didn’t answer. Choyun smirked "Do you really think He on your side Suheyon"<br><br>Suheyon confused "What? Do you think he betrayed me lol he didnt am i right?" <br><br> you didnt said anything <br> You stepped forward. Suheyon feels betrayed<br><br> Choyun said "Do you think you can handle us both?? haha Give up"<br>You still feeling conflicted...`],
                                                        game_title: `Final battle Final Chance`,
                                                        game_desc: `You still felt conflicted. you can still choose what to do next `,
                                                        // Replace the old actions array with this one
                                                        actions: [{
                                                          label: `Choose to Side with Suheyon kim`,
                                                          next: { // CORRECT: The battle logic is now inside 'next'
                                                            battle: 'Choyun',
                                                            win: {
                                                              substory: [`You defeated Choyun,<br>You stood over Choyun’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Choyun loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“So this... is what it feels like to lose everything".<br>Suhyeon Kim walked over, exhausted but alive. He looked down at Choyun, then glanced around at the shattered remains of the battlefield<br><br>“It’s over,” Suhyeon Kim said<br>With Choyun’s fall, the reign of fear in Gangbuk came to an end<br><br><br><img src="/cha/endbg.png" alt="description" width="300">`],
                                                              next_story: {
                                                                substory: ["The End. Thanks for playing!"],
                                                                // ADD A FUNCTION TO RUN AFTER THE STORY ENDS
                                                                onComplete: function () {
                                                                  // Prepare and save the player's state for online mode
                                                                  const onlineData = {
                                                                    playerName: playerName,
                                                                    stats: stats,
                                                                    cards: playerCards,
                                                                    playerCardImage: localStorage.getItem('playerCardImage'),
                                                                    playerBattleImage: localStorage.getItem('playerBattleImage')
                                                                  };
                                                                  localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                                                                  // Show a confirmation and the online button
                                                                  showPopup("Online Mode Unlocked!");
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }, {
                                                          label: `Choose to Side with Choyun`,
                                                          next: { // CORRECT: The battle logic is now inside 'next'
                                                            battle: 'Suheyon_kim',
                                                            win: {
                                                              // Step 1: Tell the story of the victory.
                                                              substory: [
                                                                `You defeated Suheyon,<br>You stood over Suheyon’s fallen body, breathing heavy, knuckles bruised, blood dripping down your arm. The fight was over—he was finished. and then Suheyon loses all his powers after being defeated.<br><br>He looked up at you with hollow eyes. <br>“I never thought… you would be the one to betray me,” he said, voice cracked, barely more than a whisper.<br>You opened your mouth, but no words came out.`,
                                                                `<br>Then—without warning—Choyun stepped forward.<br> He grabbed Soohyun by the throat, lifting him like a doll. Soohyun’s body jerked as Choyun’s uses mana drain on Soohyun, draining every last bit of power he had left<br><br>You stood frozen.You wanted to stop it.<br>But you didn’t.Couldn’t.<br>When Choyun let go, Soohyun crumpled to the ground, nothing more than skin and bones—a husk of the fighter he once was<br>He stretched his arms out as if addressing the entire world.<br>“Gangbuk was just the beginning. Soon, all of Seoul will kneel. The age of gangs? No. This will be a reign. My reign.”`,
                                                                `You had made your choice.<br><br>But as Choyun walked past you, crackling with Sudden power, you realized something:<br>This wasn’t victory.<br>This was the beginning of something far darker.`
                                                              ],
                                                              // Step 2: After the story, trigger the video.
                                                              next_story: {
                                                                end_video: {
                                                                  src: "cha/end-choyun.mp4", // Path to your video file
                                                                  // Step 3: After the video, show the final message.
                                                                  next: {
                                                                    substory: ["The Dark End. Thanks for playing!"],
                                                                    actions: []
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }]
                                                      }
                                                    }
                                                  }
                                                }
                                                ]
                                              }
                                            }
                                          }
                                        }
                                      }]
                                    }
                                  }]
                                }
                              }]
                            }
                          }
                        }]
                      }

                    }
                  }
                }
              }]
            }

          }]
        }
      }
    },
      /// 

      ///
    ]

  }
};

const storyOptions = [
  /*{
    title: "Story 1: Reincarnated Fighter",
    parts: [
      "You wake up in a new body in a dirty alley.",
      "Memories are hazy, but your fists itch for battle.",
      "A voice inside your head whispers — choose your path."
    ],
    game_title: "Choose Your Crew",
    game_desc: "The path of a fighter is rarely walked alone. Where do you belong?",
    choices: [
      {
        label: "Join Allied",
        effects: { statPoints: 35 },
        substory: ["You walk through the gates of North Gangbuk High.", "A cold student named Choyun watches you from afar.", "Your instincts scream: this place is dangerous."],
        race: true,
      },
      {
        label: "Join Burn Knuckle",
        substory: ["You enter South’s chaotic campus.", "Fights are breaking out even during lunch.", "A wild kid named Gun takes interest in you."]
      },
      {
        label: "Join Big Deal",
        substory: ["You step into East Gangbuk High.", "It’s organized — too organized.", "Someone’s pulling strings behind the scenes."]
      },
      {
        label: "Join MNC",
        substory: ["You arrive at West Gangbuk High.", "The school is strict. Regimented.", "You’re immediately told to prove yourself."],
        game_title: "Prove Your Worth",
        game_desc: "In the West, respect is earned, not given. How will you make your mark?",
        actions: [{ label: "Go Solo" }, { label: "Ask to Join Crew" }, { label: "Train with Old Man", train: true, next: { substory: ["Your training is complete. You feel a new power surging within."], effects: { str: 3, spd: 1 } } }]
      }
    ]
  },*/
  {
    title: "Story 2: Gangbuk High Reincarnated",
    parts: [`You wake up in the body of a high school student — in the <strong>Questism</strong> universe.<br>
        Suddenly, a voice calls out from outside your room:<br>
        “<em>Breakfast is ready!</em>”<br><br>
        Startled, you sit up and glance around. The room is unfamiliar. The bed, the furniture — everything feels different.<br>
        Your eyes land on a mirror nearby, and you slowly rise to take a look.<br>
        The face staring back at you is someone else’s.<br>
        You can’t seem to recognize it.<br>
        Your build is lean and athletic. You look younger — sharper. Healthier.<br>
        Nothing about this place feels like your old life.<br>`, `
        You're now living in <strong>Gangbuk</strong>, in a quiet neighborhood, with two parents who call you their child — and a younger brother who’s still in middle school.<br>
        You try to remember how this happened, but your memory is hazy.<br>
        The only thing you recall is a strange, glowing window — like something out of a game.<br>
        Curious, you try saying words aloud:<br>
        “System.”<br>
        “Window.”<br>
        “AI.”<br>
        “Quest.”<br>
        Nothing happens.
        Until—<br>`, `<strong>“Status.”</strong><br>
        Suddenly, a translucent window opens before your eyes.<br>
        <span style="color: #89cfff">[STATUS MENU OPENED]</span><br>
        Your heart races. For a moment, it feels like a dream.<br>
        Still… something deep inside tells you this isn’t a dream.`, `
        "Later that evening, during dinner, your parents bring up school.
        You're told it’s time to get back to studying and choose where to transfer.<br>
        They give you Four choices:..."`,],

    game_title: "Choose Your School",
    game_desc: "Your new life begins now. Each school in Gangbuk offers a different fate.",
    choices: [
      {
        label: "Join North Gangbuk High",
        gold: 50,
        effects: { str: 2, end: 2, tech: 2, dur: 2, spd: 2, biq: 2, statPoints: 4 },
        substory: [
          `<strong>You joined North Gangbuk High.</strong><br><br><span style="color: #89cfff">[ALL STATS INCREASED BY 2]</span></strong><br><span style="color: #89cfff">[GAINED 4 STATS POINT]</span><br>Today is your first day. After the principal’s long-winded speech, Seats were assigned. Mine was near the window.<br> The guy sitting beside me had a sharp, cold look — clean-cut uniform, and this quiet intensity about him.
            I tried to talk to him.

            “Hey, I’m new here. Nice to meet you.”
            “...Yeah.”

            That was all he said.
            Every time I tried, I got one-word answers. It wasn’t just cold — it was like he didn’t want to exist in the same space as me. He kept his head down, buried in textbooks and worksheets. It was like school was just a pit stop before cram school.
            All I found out was his name: Choyun.
            I gave up and went on with life.`,
          `<strong>A Few Weeks Later...</strong><br>You still haven’t made any friends. But then something strange happens. Choyun — the guy who never looked up from his books — suddenly starts skipping class. Rumors spread that he's been fighting seniors and hanging out with a gang.`,
          `<h2> Later That Day...</h2><br>That evening, I went out to buy groceries. Mom had asked for a few things, and I figured some fresh air would help clear my head.
            On the way back, I saw a group of thugs cornering a student — taking his money, laughing while he screaming in pain...
            I hesitated.
            Should I get involved…? Or just keep walking?`
        ],
        game_title: "A Fateful Encounter",
        game_desc: "In a dark alley, a choice awaits. Will you be a bystander or a hero?",
        actions: [
          {
            label: "Help",
            next: {
              substory: ["You can't just stand by. You clench your fists and step forward. you saw the quest mission on system screen you get motivated and shouted<br>'Pick on someone your own size,' you Fatfucks."],
              battle: 'old_thug',
              win: {
                gold: 50,
                substory: [`The thugs are scattered. The student thanks you profusely before running off.`, `Suddenly, you hear clapping. It's Choyun.<br>'Impressive...' he says. <br>'You have potential to become strongest'<br> then suddenly system pops-up~</strong><br><br><span style="color: #89cfff">[YOU HAVE COMPLETED THE MISSION, CHECK YOUR REWARDS]</span><br><br>`],
                game_title: "A Hero's Reward",
                game_desc: "Your bravery has been recognized by the system. Choose any one.",
                cards: [

                  { name: "Taekwondo - Wheel Kick", type: "attack", staminaCost: 15, desc: `Grant user the ability to use Taekwondo - Wheel Kick.<br>STR +2`, effects: { str: 2, statPoints: 2 }, damage: { min: 45, max: 55 }, cooldown: 3, gif: "./cha/taekwondo-kick.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav" },
                  { name: "Leap of Strength", type: "buff", subType: "multiplier", staminaCost: 30, desc: `Increase the user strength by 1.20 when used (Can be stacked)<br>DUR +2`, effects: { dur: 2, statPoints: 2 }, buffAmount: 1.20, buffDuration: 4, cooldown: 1, usesLimit: 3, gif: "./cha/Leap in str.gif", gif_target: "player" },
                  { name: "Second Wind", type: "buff", subType: "heal", staminaCost: 20, desc: `Heal for 15% of your max HP.<br>END +2`, effects: { end: 2, statPoints: 2 }, healPercent: 0.15, cooldown: 5, usesLimit: 2, gif: "/cha/heal (1).gif", gif_target: "player", sound: "cha/sound/aura.wav" },
                  { name: "Shoulder Barge", type: "attack", staminaCost: 15, desc: `Rush your opponent with your full body weight, slamming them.<br> SPD+1, BIQ +1`, effects: { spd: 1, biq: 1, statPoints: 2 }, damage: { min: 35, max: 65 }, cooldown: 4, gif: "/cha/normal punch.gif", gif_target: "opponent", sound: "cha/sound/punch.mp3" },
                ],
                next_story: {
                  substory: ["Choyun looks you over.<br> 'I can help you in becoming the strongest alongside me' He makes you an offer..."],
                  game_title: "An Offer",
                  game_desc: "Choyun, the raising force of North Gangbuk, has taken an interest in you. What is your decision?",
                  actions: [
                    {
                      label: "JOIN CHOYUN'S GANG",
                      race: true,
                      next: {
                        substory: ["You nod. 'Alright, I'm in.' Choyun smirks. 'Good. We have lots of work to do.'"],
                        game_title: "Pledge of Allegiance",
                        game_desc: "You have joined the Choyun crew in the North. The system rewards your ambition.",
                        cards: [{
                          name: "Boxing - Red Punch", type: "attack", staminaCost: 25, desc: `A risky but powerful opening move.<br>STR +2, SPD +1`,
                          effects: { str: 2, spd: 1, statPoints: 2 }, damage: { min: 50, max: 90 }, cooldown: 5, gif: "./cha/red punch.gif", gif_target: "opponent", sound: "cha/sound/normal Punch.wav"
                        }, {
                          name: "Taekwondo: Axe Kick", type: "attack", staminaCost: 25, desc: `A devastating downward kick that comes crashing down on an opponent's guard<br>STR +1, SPD +2`,
                          effects: { str: 1, spd: 2, statPoints: 2 }, damage: { min: 65, max: 85 }, cooldown: 5, gif: "./cha/taekwondo-kick.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav"
                        },
                        { name: "Burning Spirit", type: "buff", subType: "multiplier", staminaCost: 30, desc: `Increase the user strength by 30%  for 4 turns when used (Can be stacked)<br>TECH +2, DUR +1`, effects: { dur: 1, tech: 2 }, buffDuration: 4, buffAmount: 1.30, cooldown: 2, usesLimit: 2, gif: "./cha/buff.gif", gif_target: "player" }, {
                          name: "Magic Touch", type: "buff", subType: "temp_stat", staminaCost: 15, desc: `Temporarly Buff the user TECH by 10 for 4 turns.<br>END +4`, sound: "cha/sound/aura.wav",
                          effects: { end: 4, statPoints: 2 }, statToBuff: "tech", buffValue: 10, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/magic touch.gif", gif_target: "player", glowEffect: { color: 'pink' },
                        },
                        {
                          name: "Weakening Jolt", type: "debuff", subType: "stat_reduction", staminaCost: 30, desc: `Reduces opponent's STRENGTH by 20% for 4 turns.<br>BIQ +3`,
                          effects: { biq: 3, statPoints: 2 }, sound: "cha/sound/stun.wav",
                          statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.8, debuffDuration: 4, cooldown: 5, usesLimit: 2, gif: "cha/thunder.gif", gif_target: "opponent"
                        }],
                        next_story: {
                          substory: [`With your new power acknowledged, Choyun introduces you to the others.Choyun said<br> "you have talent but..."`, ` "But to become officially part of crew you have to prove your worth.." <br>" Now a really good time"<br> "Go..."`],
                          game_title: "First Mission",
                          game_desc: "Choyun gives you your first set of orders. It's time to get to work.",
                          actions: [{
                            label: "Disrupt Hyeokjae Bae's territory",
                            next: {
                              substory: [`Your mission is to cause a scene in Hyeokjae Bae's turf.`, `As you find the base of Hyeokjae Bae's crew you started fighting the crew members <br>"Bring out the Hyeokjae Bae"<br>Behind you a large shadow apears as turn around you a big fat guy standing menicingly <br> BAAAM!!!<br> you were thrown around by Hyeokjae Bae <br><Fight started> `],
                              battle: 'Hyeokjae_Bae',
                              win: {
                                gold: { min: 20, max: 40 },
                                substory: ["You defeated Hyeokjae Bae, impressing Choyun."],
                                game_title: "Rival Defeated",
                                game_desc: "You have proven your strength against a formidable foe. The system grants you new insight.",
                                cards: [{
                                  name: "Sumo Throw", type: "attack", staminaCost: 40, desc: `You are ablle to use Powerful Sumo throw that Stun the opponent<br>TECH +2, SPD +1`, gif: "cha/sthrow.gif", gif_target: "opponent", sound: "cha/sound/throw.mp3",
                                  effects: { tech: 2, spd: 1, statPoints: 2 }, damage: { min: 80, max: 100 }, cooldown: 4,
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }, {
                                  name: "Tanker's Resilience", type: "buff", subType: "heal", staminaCost: 40, desc: `Heal for 40% of your max HP.<br>END +1, DUR +2`,
                                  effects: { end: 1, dur: 2, statPoints: 2 }, healPercent: 0.40, cooldown: 6, usesLimit: 1, gif: "cha/temp end.gif"
                                }, {
                                  name: "Concussive Blow", type: "debuff", subType: "stun", desc: `A powerful blow that stuns the opponent for 5 turn.<br>SPD +1, BIQ +2`,
                                  effects: { str: 1, biq: 2, statPoints: 2 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3"
                                }, {
                                  name: "Capoeira - Ginga Flow", type: "attack", staminaCost: 45, desc: `A fluid, dance-like series of kicks from unpredictable angles. A Swift strike with stun the opponents.<br>DUR +1, SPD +2`,
                                  effects: { dur: 1, spd: 2, statPoints: 2 }, damage: { min: 70, max: 115 }, cooldown: 4, gif: "cha/kick (2).gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }],
                                /////////////////////
                                next_story: {
                                  storyNodeRef: 'earlyGameSequence'
                                }
                              }
                            }
                          },
                          {
                            label: "Disrupt the Jeong-u Song's territory",
                            next: {
                              battle: 'Jeong_u_Song',
                              win: {
                                gold: 30,
                                substory: ["Your mission is to cause a scene in Jeong-u Song's turf. You hop on a bike to make a quick getaway after."],
                                race: true,
                                win: {
                                  gold: 30,
                                  substory: ["You successfully created a distraction and escaped. You've sent a clear message."],
                                  effects: { str: 1, dur: 1 },
                                  game_title: "Mission Success",
                                  game_desc: "You've proven your speed and cunning. What's next?",
                                  cards: [{
                                    name: "Phantom Strike", type: "attack", staminaCost: 45, desc: `You are ablle to use Powerful strike that Stun the opponent<br>TECH +2, SPD +1`,
                                    effects: { tech: 2, spd: 1, statPoints: 2 }, damage: { min: 65, max: 120 }, cooldown: 4, gif: "/cha/barrage punch.gif", gif_target: "opponent", sound: "cha/sound/punch.mp3",
                                    secondaryEffect: {
                                      type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                    }
                                  }, {
                                    name: "Tanker's Resilience", type: "buff", subType: "heal", staminaCost: 40, desc: `Heal for 40% of your max HP.<br>END +1, DUR +2`,
                                    effects: { end: 1, dur: 2, statPoints: 2 }, healPercent: 0.40, cooldown: 6, usesLimit: 1, gif: "cha/temp end.gif"
                                  }, {
                                    name: "Concussive Blow", type: "debuff", subType: "stun", desc: `A powerful blow that stuns the opponent for 5 turn.<br>SPD +1, BIQ +2`,
                                    effects: { str: 1, biq: 2, statPoints: 2 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3"
                                  }, {
                                    name: "Capoeira - Ginga Flow", type: "attack", staminaCost: 45, desc: `A fluid, dance-like series of kicks from unpredictable angles. A Swift strike with stun the opponents.<br>DUR +1, SPD +2`,
                                    effects: { dur: 1, spd: 2, statPoints: 2 }, damage: { min: 70, max: 115 }, cooldown: 4, gif: "cha/kick (2).gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                    secondaryEffect: {
                                      type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                    }
                                  }],
                                  next_story: {
                                    storyNodeRef: 'earlyGameSequence'
                                  }
                                }
                              },
                              lose: {
                                substory: ["You lost but Your mission is to cause a scene in Jeong-u Song's turf anyway. You hop on a bike to make a quick getaway after."],
                                race: true,
                                win: {
                                  gold: 30,
                                  substory: ["You successfully created a distraction and escaped. You've sent a clear message."],
                                  effects: { str: 2, dur: 2 },
                                  game_title: "Mission Success",
                                  game_desc: "You've proven your speed and cunning. What's next?",
                                  cards: [{
                                    name: "Intercepting Knee", type: "attack", staminaCost: 40, desc: ` a perfectly timed, rock-solid knee to their torso, stopping their momentum cold...<br>TECH +2, SPD +1`,
                                    effects: { tech: 2, spd: 1, statPoints: 2 }, damage: { min: 55, max: 120 }, cooldown: 4, gif: "cha/cut.gif", gif_target: "opponent", sound: "cha/sound/kick.wav",
                                    secondaryEffect: {
                                      type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                    }
                                  }, {
                                    name: "Tanker's Resilience", type: "buff", subType: "heal", staminaCost: 40, desc: `Heal for 40% of your max HP.<br>END +1, DUR +2`,
                                    effects: { end: 1, dur: 2, statPoints: 2 }, healPercent: 0.40, cooldown: 6, usesLimit: 1, gif: "cha/temp end.gif"
                                  }, {
                                    name: "Concussive Blow", type: "debuff", subType: "stun", desc: `A powerful blow that stuns the opponent for 5 turn.<br>SPD +1, BIQ +2`,
                                    effects: { str: 1, biq: 2, statPoints: 2 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3"
                                  }, {
                                    name: "Capoeira - Ginga Flow", type: "attack", staminaCost: 45, desc: `A fluid, dance-like series of kicks from unpredictable angles. A Swift strike with stun the opponents.<br>DUR +1, SPD +2`,
                                    effects: { dur: 1, spd: 2, statPoints: 2 }, damage: { min: 70, max: 115 }, cooldown: 4, gif: "cha/kick (2).gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                    secondaryEffect: {
                                      type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                    }
                                  }],
                                  next_story: {
                                    storyNodeRef: 'earlyGameSequence'
                                  }
                                }
                              }
                            }
                          }],
                          next_story: {
                            substory: [`hello`]
                          }
                        }
                      }
                    },
                    {
                      label: "REJECT THE OFFER",
                      next: {
                        substory: ["'I work alone,' you say, turning your back on him. Choyun watches you go, an unreadable expression on his face. 'A shame,' he mutters."],
                        game_title: "The Lone Wolf",
                        game_desc: "You have chosen a harder path. The system grants you a skill for your independence.",
                        cards: [{
                          name: "Lone Wolf Strike", type: "attack", desc: "A swift, independent attack.",
                          effects: { spd: 3, tech: 1 }, damage: { min: 15, max: 25 }, cooldown: 2
                        }],
                        next_story: {
                          substory: ["You walk your own path, honing your skills in the shadows."],
                          game_title: "Path of Solitude",
                          game_desc: "Without a crew, you must rely on your own strength. How will you grow stronger?",
                          actions: [
                            {
                              label: "Train relentlessly",
                              train: true,
                              gold: 50,
                              next: {
                                substory: ["You spend your days and nights in grueling training, emerging stronger than before."],
                                effects: { str: 2, spd: 2, end: 2 },
                                game_title: "Training Complete",
                                game_desc: "Your body screams, but your power has grown.",
                                actions: [{ label: "Seek a real challenge" }]
                              }
                            },
                            {
                              label: "Fight for experience",
                              next: {
                                substory: ["You seek out fights in the back alleys."],
                                effects: { tech: 2, dur: 2, biq: 2 },
                                battle: 'uijin_thug',
                                win: {
                                  substory: ["You easily dispatch the local bully, feeling your technique improve."],
                                  game_title: "Street Brawl Won",
                                  game_desc: "Another victory under your belt. You feel more confident in your abilities.",
                                  card: []
                                }
                              }
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              },
              lose: {
                gold: 100,
                substory: ["You fought bravely but were overwhelmed. As you lay bruised, the thugs scatter. A figure looms over you. It's Choyun. He helps you up. 'You've got guts, but you're weak,' he says. 'I can change that. I'm making you an offer...'"],
                effects: { str: 1, spd: 1, end: 2 },
                game_title: "Defeated, But Not Broken",
                game_desc: "Choyun offers you a path to power from the ashes of your defeat. What will you do?",
                actions: [
                  {
                    label: "JOIN CHOYUN'S GANG",
                    next: {
                      substory: ["You nod. 'Alright, I'm in.' Choyun smirks. 'Good. We have lots of work to do.'"],
                      game_title: "Pledge of Allegiance",
                      game_desc: "You have joined the Choyun crew in the North. The system rewards your ambition.",
                      cards: [{
                        name: "Boxing - Red Punch", type: "attack", staminaCost: 25, desc: `A risky but powerful opening move.<br>STR +2, SPD +1`,
                        effects: { str: 2, spd: 1, statPoints: 2 }, damage: { min: 50, max: 90 }, cooldown: 5, gif: "./cha/red punch.gif", gif_target: "opponent", sound: "cha/sound/normal Punch.wav"
                      }, {
                        name: "Taekwondo: Axe Kick", type: "attack", staminaCost: 25, desc: `A devastating downward kick that comes crashing down on an opponent's guard<br>STR +1, SPD +2`,
                        effects: { str: 1, spd: 2, statPoints: 2 }, damage: { min: 65, max: 85 }, cooldown: 5, gif: "./cha/taekwondo-kick.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav"
                      },
                      { name: "Burning Spirit", type: "buff", subType: "multiplier", staminaCost: 30, desc: `Increase the user strength by 30%  for 4 turns when used (Can be stacked)<br>TECH +2, DUR +1`, effects: { dur: 1, tech: 2 }, buffDuration: 4, buffAmount: 1.30, cooldown: 2, usesLimit: 2, gif: "./cha/buff.gif", gif_target: "player" }, {
                        name: "Magic Touch", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user TECH by 10 for 4 turns.<br>END +4`, sound: "cha/sound/aura.wav",
                        effects: { end: 4, statPoints: 2 }, statToBuff: "tech", buffValue: 10, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/magic touch.gif", gif_target: "player", glowEffect: { color: 'pink' },
                      },
                      {
                        name: "Weakening Jolt", type: "debuff", subType: "stat_reduction", staminaCost: 30, desc: `Reduces opponent's STRENGTH by 20% for 4 turns.<br>BIQ +3`,
                        effects: { biq: 3, statPoints: 2 }, sound: "cha/sound/stun.wav",
                        statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.8, debuffDuration: 4, cooldown: 5, usesLimit: 2, gif: "cha/thunder.gif", gif_target: "opponent"
                      }],
                      next_story: {
                        substory: [`With your new power acknowledged, Choyun introduces you to the others.Choyun said<br> "you have talent but..."`, ` "But to become officially part of crew you have to prove your worth.." <br>" Now a really good time"<br> "Go..."`],
                        game_title: "First Mission",
                        game_desc: "Choyun gives you your first set of orders. It's time to get to work.",
                        actions: [{
                          label: "Disrupt Hyeokjae Bae's territory",
                          next: {
                            substory: [`Your mission is to cause a scene in Hyeokjae Bae's turf.`, `As you find the base of Hyeokjae Bae's crew you started fighting the crew members <br>"Bring out the Hyeokjae Bae"<br>Behind you a large shadow apears as turn around you a big fat guy standing menicingly <br> BAAAM!!!<br> you were thrown around by Hyeokjae Bae <br><Fight started> `],
                            battle: 'Hyeokjae_Bae',
                            win: {
                              gold: { min: 20, max: 40 },
                              substory: ["You defeated Hyeokjae Bae, impressing Choyun."],
                              game_title: "Rival Defeated",
                              game_desc: "You have proven your strength against a formidable foe. The system grants you new insight.",
                              cards: [{
                                name: "Sumo Throw", type: "attack", staminaCost: 40, desc: `You are ablle to use Powerful Sumo throw that Stun the opponent<br>TECH +2, SPD +1`, gif: "cha/sthrow.gif", gif_target: "opponent", sound: "cha/sound/throw.mp3",
                                effects: { tech: 2, spd: 1, statPoints: 2 }, damage: { min: 80, max: 100 }, cooldown: 4,
                                secondaryEffect: {
                                  type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                }
                              }, {
                                name: "Tanker's Resilience", type: "buff", subType: "heal", staminaCost: 40, desc: `Heal for 40% of your max HP.<br>END +1, DUR +2`,
                                effects: { end: 1, dur: 2, statPoints: 2 }, healPercent: 0.40, cooldown: 6, usesLimit: 1, gif: "cha/temp end.gif"
                              }, {
                                name: "Concussive Blow", type: "debuff", subType: "stun", desc: `A powerful blow that stuns the opponent for 5 turn.<br>SPD +1, BIQ +2`,
                                effects: { str: 1, biq: 2, statPoints: 2 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3"
                              }, {
                                name: "Capoeira - Ginga Flow", type: "attack", staminaCost: 45, desc: `A fluid, dance-like series of kicks from unpredictable angles. A Swift strike with stun the opponents.<br>DUR +1, SPD +2`,
                                effects: { dur: 1, spd: 2, statPoints: 2 }, damage: { min: 70, max: 115 }, cooldown: 4, gif: "cha/kick (2).gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                secondaryEffect: {
                                  type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                }
                              }],
                              /////////////////////
                              next_story: {
                                storyNodeRef: 'earlyGameSequence'
                              }
                            }
                          }
                        },
                        {
                          label: "Disrupt the Jeong-u Song's territory",
                          next: {
                            battle: 'Jeong_u_Song',
                            win: {
                              gold: { min: 20, max: 30 },
                              substory: ["Your mission is to cause a scene in Jeong-u Song's turf. You hop on a bike to make a quick getaway after."],
                              race: true,
                              win: {
                                gold: 30,
                                substory: ["You successfully created a distraction and escaped. You've sent a clear message."],
                                effects: { str: 2, dur: 2 },
                                game_title: "Mission Success",
                                game_desc: "You've proven your speed and cunning. What's next?",
                                cards: [{
                                  name: "Phantom Strike", type: "attack", staminaCost: 45, desc: `You are ablle to use Powerful strike that Stun the opponent<br>TECH +2, SPD +1`,
                                  effects: { tech: 2, spd: 1, statPoints: 2 }, damage: { min: 65, max: 120 }, cooldown: 4, gif: "/cha/barrage punch.gif", gif_target: "opponent", sound: "cha/sound/punch.mp3",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }, {
                                  name: "Tanker's Resilience", type: "buff", subType: "heal", staminaCost: 40, desc: `Heal for 40% of your max HP.<br>END +1, DUR +2`,
                                  effects: { end: 1, dur: 2, statPoints: 2 }, healPercent: 0.40, cooldown: 6, usesLimit: 1, gif: "cha/temp end.gif"
                                }, {
                                  name: "Concussive Blow", type: "debuff", subType: "stun", desc: `A powerful blow that stuns the opponent for 5 turn.<br>SPD +1, BIQ +2`,
                                  effects: { str: 1, biq: 2, statPoints: 2 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3"
                                }, {
                                  name: "Capoeira - Ginga Flow", type: "attack", staminaCost: 45, desc: `A fluid, dance-like series of kicks from unpredictable angles. A Swift strike with stun the opponents.<br>DUR +1, SPD +2`,
                                  effects: { dur: 1, spd: 2, statPoints: 2 }, damage: { min: 70, max: 115 }, cooldown: 4, gif: "cha/kick (2).gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }],
                                next_story: {
                                  storyNodeRef: 'earlyGameSequence'
                                }
                              }
                            },
                            lose: {
                              substory: ["You lost but Your mission is to cause a scene in Jeong-u Song's turf anyway. You hop on a bike to make a quick getaway after."],
                              race: true,
                              win: {
                                gold: 30,
                                substory: ["You successfully created a distraction and escaped. You've sent a clear message."],
                                effects: { str: 1, dur: 1 },
                                game_title: "Mission Success",
                                game_desc: "You've proven your speed and cunning. What's next?",
                                cards: [{
                                  name: "Intercepting Knee", type: "attack", staminaCost: 40, desc: ` a perfectly timed, rock-solid knee to their torso, stopping their momentum cold...<br>TECH +2, SPD +1`,
                                  effects: { tech: 2, spd: 1, statPoints: 2 }, damage: { min: 55, max: 120 }, cooldown: 4, gif: "cha/cut.gif", gif_target: "opponent", sound: "cha/sound/kick.wav",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }, {
                                  name: "Tanker's Resilience", type: "buff", subType: "heal", staminaCost: 40, desc: `Heal for 40% of your max HP.<br>END +1, DUR +2`,
                                  effects: { end: 1, dur: 2, statPoints: 2 }, healPercent: 0.40, cooldown: 6, usesLimit: 1, gif: "cha/temp end.gif"
                                }, {
                                  name: "Concussive Blow", type: "debuff", subType: "stun", desc: `A powerful blow that stuns the opponent for 5 turn.<br>SPD +1, BIQ +2`,
                                  effects: { str: 1, biq: 2, statPoints: 2 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3"
                                }, {
                                  name: "Capoeira - Ginga Flow", type: "attack", staminaCost: 45, desc: `A fluid, dance-like series of kicks from unpredictable angles. A Swift strike with stun the opponents.<br>DUR +1, SPD +2`,
                                  effects: { dur: 1, spd: 2, statPoints: 2 }, damage: { min: 70, max: 115 }, cooldown: 4, gif: "cha/kick (2).gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }],
                                next_story: {
                                  storyNodeRef: 'earlyGameSequence'
                                }
                              }
                            }
                          }
                        }],
                        next_story: {
                          substory: [`hello`]
                        }
                      }
                    }
                  },
                  {
                    label: "REJECT THE OFFER",
                    next: {
                      substory: ["'I work alone,' you say, turning your back on him. Choyun watches you go, an unreadable expression on his face. 'A shame,' he mutters."],
                      cards: [{ name: "Lone Wolf Strike", type: "attack", desc: "A swift, independent attack.", effects: { spd: 3, tech: 1 }, damage: { min: 15, max: 25 }, cooldown: 2 }]
                    }
                  }
                ]
              }
            }
          },
          {
            label: "Run away",
            next: {
              substory: ["You decide it's not your fight and turn away, your footsteps quickening. But you can't outrun fate. A burly thug blocks your path. 'Think you can just walk away?'"],
              battle: 'old_thug',
              win: {
                gold: 80,
                substory: ["You manage to defeat the thug who cornered you. As he flees, you notice someone watching from the shadows — Choyun. He steps out. 'You fight well when you have to,' he observes. 'But you lack conviction. Still, I'll make you an offer...'"],
                effects: { statPoints: 8 },
                game_title: "A Coward's Victory",
                game_desc: "You only fought when you had no other choice. Choyun has seen this, and he is not impressed... but he still sees an opportunity.",
                actions: [
                  {
                    label: "JOIN CHOYUN'S GANG",
                    next: {
                      substory: ["You nod. 'Alright, I'm in.' Choyun smirks. 'Good. We have lots of work to do.'"],
                      game_title: "Pledge of Allegiance",
                      game_desc: "You have joined the Choyun crew in the North. The system rewards your ambition.",
                      cards: [{
                        name: "Boxing - Red Punch", type: "attack", staminaCost: 25, desc: `A risky but powerful opening move.<br>STR +2, SPD +1`,
                        effects: { str: 2, spd: 1, statPoints: 2 }, damage: { min: 50, max: 90 }, cooldown: 5, gif: "./cha/red punch.gif", gif_target: "opponent", sound: "cha/sound/normal Punch.wav"
                      }, {
                        name: "Taekwondo: Axe Kick", type: "attack", staminaCost: 25, desc: `A devastating downward kick that comes crashing down on an opponent's guard<br>STR +1, SPD +2`,
                        effects: { str: 1, spd: 2, statPoints: 2 }, damage: { min: 65, max: 85 }, cooldown: 5, gif: "./cha/taekwondo-kick.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav"
                      },
                      { name: "Burning Spirit", type: "buff", subType: "multiplier", staminaCost: 30, desc: `Increase the user strength by 30%  for 4 turns when used (Can be stacked)<br>TECH +2, DUR +1`, effects: { dur: 1, tech: 2 }, buffDuration: 4, buffAmount: 1.30, cooldown: 2, usesLimit: 2, gif: "./cha/buff.gif", gif_target: "player" }, {
                        name: "Magic Touch", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user TECH by 10 for 4 turns.<br>END +4`, sound: "cha/sound/aura.wav",
                        effects: { end: 4, statPoints: 2 }, statToBuff: "tech", buffValue: 10, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/magic touch.gif", gif_target: "player", glowEffect: { color: 'pink' },
                      },
                      {
                        name: "Weakening Jolt", type: "debuff", subType: "stat_reduction", staminaCost: 30, desc: `Reduces opponent's STRENGTH by 20% for 4 turns.<br>BIQ +3`,
                        effects: { biq: 3, statPoints: 2 }, sound: "cha/sound/stun.wav",
                        statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.8, debuffDuration: 4, cooldown: 5, usesLimit: 2, gif: "cha/thunder.gif", gif_target: "opponent"
                      }],
                      next_story: {
                        substory: [`With your new power acknowledged, Choyun introduces you to the others.Choyun said<br> "you have talent but..."`, ` "But to become officially part of crew you have to prove your worth.." <br>" Now a really good time"<br> "Go..."`],
                        game_title: "First Mission",
                        game_desc: "Choyun gives you your first set of orders. It's time to get to work.",
                        actions: [{
                          label: "Disrupt Hyeokjae Bae's territory",
                          next: {
                            substory: [`Your mission is to cause a scene in Hyeokjae Bae's turf.`, `As you find the base of Hyeokjae Bae's crew you started fighting the crew members <br>"Bring out the Hyeokjae Bae"<br>Behind you a large shadow apears as turn around you a big fat guy standing menicingly <br> BAAAM!!!<br> you were thrown around by Hyeokjae Bae <br><Fight started> `],
                            battle: 'Hyeokjae_Bae',
                            win: {
                              gold: { min: 20, max: 40 },
                              substory: ["You defeated Hyeokjae Bae, impressing Choyun."],
                              game_title: "Rival Defeated",
                              game_desc: "You have proven your strength against a formidable foe. The system grants you new insight.",
                              cards: [{
                                name: "Sumo Throw", type: "attack", staminaCost: 40, desc: `You are ablle to use Powerful Sumo throw that Stun the opponent<br>TECH +2, SPD +1`, gif: "cha/sthrow.gif", gif_target: "opponent", sound: "cha/sound/throw.mp3",
                                effects: { tech: 2, spd: 1, statPoints: 2 }, damage: { min: 80, max: 100 }, cooldown: 4,
                                secondaryEffect: {
                                  type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                }
                              }, {
                                name: "Tanker's Resilience", type: "buff", subType: "heal", staminaCost: 40, desc: `Heal for 40% of your max HP.<br>END +1, DUR +2`,
                                effects: { end: 1, dur: 2, statPoints: 2 }, healPercent: 0.40, cooldown: 6, usesLimit: 1, gif: "cha/temp end.gif"
                              }, {
                                name: "Concussive Blow", type: "debuff", subType: "stun", desc: `A powerful blow that stuns the opponent for 5 turn.<br>SPD +1, BIQ +2`,
                                effects: { str: 1, biq: 2, statPoints: 2 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3"
                              }, {
                                name: "Capoeira - Ginga Flow", type: "attack", staminaCost: 45, desc: `A fluid, dance-like series of kicks from unpredictable angles. A Swift strike with stun the opponents.<br>DUR +1, SPD +2`,
                                effects: { dur: 1, spd: 2, statPoints: 2 }, damage: { min: 70, max: 115 }, cooldown: 4, gif: "cha/kick (2).gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                secondaryEffect: {
                                  type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                }
                              }],
                              /////////////////////
                              next_story: {
                                storyNodeRef: 'earlyGameSequence'
                              }
                            }
                          }
                        },
                        {
                          label: "Disrupt the Jeong-u Song's territory",
                          next: {
                            battle: 'Jeong_u_Song',
                            win: {
                              gold: { min: 20, max: 30 },
                              substory: ["Your mission is to cause a scene in Jeong-u Song's turf. You hop on a bike to make a quick getaway after."],
                              race: true,
                              win: {
                                gold: 30,
                                substory: ["You successfully created a distraction and escaped. You've sent a clear message."],
                                effects: { str: 2, dur: 2 },
                                game_title: "Mission Success",
                                game_desc: "You've proven your speed and cunning. What's next?",
                                cards: [{
                                  name: "Phantom Strike", type: "attack", staminaCost: 45, desc: `You are ablle to use Powerful strike that Stun the opponent<br>TECH +2, SPD +1`,
                                  effects: { tech: 2, spd: 1, statPoints: 2 }, damage: { min: 65, max: 120 }, cooldown: 4, gif: "/cha/barrage punch.gif", gif_target: "opponent", sound: "cha/sound/punch.mp3",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }, {
                                  name: "Tanker's Resilience", type: "buff", subType: "heal", staminaCost: 40, desc: `Heal for 40% of your max HP.<br>END +1, DUR +2`,
                                  effects: { end: 1, dur: 2, statPoints: 2 }, healPercent: 0.40, cooldown: 6, usesLimit: 1, gif: "cha/temp end.gif"
                                }, {
                                  name: "Concussive Blow", type: "debuff", subType: "stun", desc: `A powerful blow that stuns the opponent for 5 turn.<br>SPD +1, BIQ +2`,
                                  effects: { str: 1, biq: 2, statPoints: 2 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3"
                                }, {
                                  name: "Capoeira - Ginga Flow", type: "attack", staminaCost: 45, desc: `A fluid, dance-like series of kicks from unpredictable angles. A Swift strike with stun the opponents.<br>DUR +1, SPD +2`,
                                  effects: { dur: 1, spd: 2, statPoints: 2 }, damage: { min: 70, max: 115 }, cooldown: 4, gif: "cha/kick (2).gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }],
                                next_story: {
                                  storyNodeRef: 'earlyGameSequence'
                                }
                              }
                            },
                            lose: {
                              substory: ["You lost but Your mission is to cause a scene in Jeong-u Song's turf anyway. You hop on a bike to make a quick getaway after."],
                              race: true,
                              win: {
                                gold: 30,
                                substory: ["You successfully created a distraction and escaped. You've sent a clear message."],
                                effects: { str: 2, dur: 2 },
                                game_title: "Mission Success",
                                game_desc: "You've proven your speed and cunning. What's next?",
                                cards: [{
                                  name: "Intercepting Knee", type: "attack", staminaCost: 40, desc: ` a perfectly timed, rock-solid knee to their torso, stopping their momentum cold...<br>TECH +2, SPD +1`,
                                  effects: { tech: 2, spd: 1, statPoints: 2 }, damage: { min: 55, max: 120 }, cooldown: 4, gif: "cha/cut.gif", gif_target: "opponent", sound: "cha/sound/kick.wav",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }, {
                                  name: "Tanker's Resilience", type: "buff", subType: "heal", staminaCost: 40, desc: `Heal for 40% of your max HP.<br>END +1, DUR +2`,
                                  effects: { end: 1, dur: 2, statPoints: 2 }, healPercent: 0.40, cooldown: 6, usesLimit: 1, gif: "cha/temp end.gif"
                                }, {
                                  name: "Concussive Blow", type: "debuff", subType: "stun", desc: `A powerful blow that stuns the opponent for 5 turn.<br>SPD +1, BIQ +2`,
                                  effects: { str: 1, biq: 2, statPoints: 2 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3"
                                }, {
                                  name: "Capoeira - Ginga Flow", type: "attack", staminaCost: 45, desc: `A fluid, dance-like series of kicks from unpredictable angles. A Swift strike with stun the opponents.<br>DUR +1, SPD +2`,
                                  effects: { dur: 1, spd: 2, statPoints: 2 }, damage: { min: 70, max: 115 }, cooldown: 4, gif: "cha/kick (2).gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }],
                                next_story: {
                                  storyNodeRef: 'earlyGameSequence'
                                }
                              }
                            }
                          }
                        }],
                        next_story: {
                          substory: [`hello`]
                        }
                      }
                    }

                  },
                  { label: "REJECT THE OFFER<br>{ still in development}<br>", next: { substory: ["'I work alone,' you say, turning your back on him. Choyun watches you go, an unreadable expression on his face. 'A shame,' he mutters."] } }
                ]
              },
              lose: {
                gold: 100,
                substory: ["The thug beats you down. 'That's what you get for running,' he spits. As he leaves, Choyun appears, looking down at you with disdain. 'Pathetic. But maybe I can make something of you. Listen up...'"],
                effects: { str: 1, spd: 1, end: 2, statPoints: 2 },
                game_title: "A Coward's Fate",
                game_desc: "Your attempt to flee ended in failure and humiliation. Choyun offers you a way out. It may be your only one.",
                actions: [
                  {
                    label: "JOIN CHOYUN'S GANG",
                    next: {
                      substory: ["You nod. 'Alright, I'm in.' Choyun smirks. 'Good. We have lots of work to do.'"],
                      game_title: "Pledge of Allegiance",
                      game_desc: "You have joined the Choyun crew in the North. The system rewards your ambition.",
                      cards: [{
                        name: "Boxing - Red Punch", type: "attack", staminaCost: 25, desc: `A risky but powerful opening move.<br>STR +2, SPD +1`,
                        effects: { str: 2, spd: 1, statPoints: 2 }, damage: { min: 50, max: 90 }, cooldown: 5, gif: "./cha/red punch.gif", gif_target: "opponent", sound: "cha/sound/normal Punch.wav"
                      }, {
                        name: "Taekwondo: Axe Kick", type: "attack", staminaCost: 25, desc: `A devastating downward kick that comes crashing down on an opponent's guard<br>STR +1, SPD +2`,
                        effects: { str: 1, spd: 2, statPoints: 2 }, damage: { min: 65, max: 85 }, cooldown: 5, gif: "./cha/taekwondo-kick.gif", gif_target: "opponent", sound: "cha/sound/T-kick.wav"
                      },
                      { name: "Burning Spirit", type: "buff", subType: "multiplier", staminaCost: 30, desc: `Increase the user strength by 30%  for 4 turns when used (Can be stacked)<br>TECH +2, DUR +1`, effects: { dur: 1, tech: 2 }, buffDuration: 4, buffAmount: 1.30, cooldown: 2, usesLimit: 2, gif: "./cha/buff.gif", gif_target: "player" }, {
                        name: "Magic Touch", type: "buff", subType: "temp_stat", desc: `Temporarly Buff the user TECH by 10 for 4 turns.<br>END +4`, sound: "cha/sound/aura.wav",
                        effects: { end: 4, statPoints: 2 }, statToBuff: "tech", buffValue: 10, buffDuration: 4, cooldown: 4, usesLimit: 2, gif: "cha/magic touch.gif", gif_target: "player", glowEffect: { color: 'pink' },
                      },
                      {
                        name: "Weakening Jolt", type: "debuff", subType: "stat_reduction", staminaCost: 30, desc: `Reduces opponent's STRENGTH by 20% for 4 turns.<br>BIQ +3`,
                        effects: { biq: 3, statPoints: 2 }, sound: "cha/sound/stun.wav",
                        statsToDebuff: ["str", "spd", "tech", "biq"], debuffValue: 0.8, debuffDuration: 4, cooldown: 5, usesLimit: 2, gif: "cha/thunder.gif", gif_target: "opponent"
                      }],
                      next_story: {
                        substory: [`With your new power acknowledged, Choyun introduces you to the others.Choyun said<br> "you have talent but..."`, ` "But to become officially part of crew you have to prove your worth.." <br>" Now a really good time"<br> "Go..."`],
                        game_title: "First Mission",
                        game_desc: "Choyun gives you your first set of orders. It's time to get to work.",
                        actions: [{
                          label: "Disrupt Hyeokjae Bae's territory",
                          next: {
                            substory: [`Your mission is to cause a scene in Hyeokjae Bae's turf.`, `As you find the base of Hyeokjae Bae's crew you started fighting the crew members <br>"Bring out the Hyeokjae Bae"<br>Behind you a large shadow apears as turn around you a big fat guy standing menicingly <br> BAAAM!!!<br> you were thrown around by Hyeokjae Bae <br><Fight started> `],
                            battle: 'Hyeokjae_Bae',
                            win: {
                              gold: { min: 20, max: 40 },
                              substory: ["You defeated Hyeokjae Bae, impressing Choyun."],
                              game_title: "Rival Defeated",
                              game_desc: "You have proven your strength against a formidable foe. The system grants you new insight.",
                              cards: [{
                                name: "Sumo Throw", type: "attack", staminaCost: 40, desc: `You are ablle to use Powerful Sumo throw that Stun the opponent<br>TECH +2, SPD +1`, gif: "cha/sthrow.gif", gif_target: "opponent", sound: "cha/sound/throw.mp3",
                                effects: { tech: 2, spd: 1, statPoints: 2 }, damage: { min: 80, max: 100 }, cooldown: 4,
                                secondaryEffect: {
                                  type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                }
                              }, {
                                name: "Tanker's Resilience", type: "buff", subType: "heal", staminaCost: 40, desc: `Heal for 40% of your max HP.<br>END +1, DUR +2`,
                                effects: { end: 1, dur: 2, statPoints: 2 }, healPercent: 0.40, cooldown: 6, usesLimit: 1, gif: "cha/temp end.gif"
                              }, {
                                name: "Concussive Blow", type: "debuff", subType: "stun", desc: `A powerful blow that stuns the opponent for 5 turn.<br>SPD +1, BIQ +2`,
                                effects: { str: 1, biq: 2, statPoints: 2 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3"
                              }, {
                                name: "Capoeira - Ginga Flow", type: "attack", staminaCost: 45, desc: `A fluid, dance-like series of kicks from unpredictable angles. A Swift strike with stun the opponents.<br>DUR +1, SPD +2`,
                                effects: { dur: 1, spd: 2, statPoints: 2 }, damage: { min: 70, max: 115 }, cooldown: 4, gif: "cha/kick (2).gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                secondaryEffect: {
                                  type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                }
                              }],
                              /////////////////////
                              next_story: {
                                storyNodeRef: 'earlyGameSequence'
                              }
                            }
                          }
                        },
                        {
                          label: "Disrupt the Jeong-u Song's territory",
                          next: {
                            battle: 'Jeong_u_Song',
                            win: {
                              gold: { min: 20, max: 40 },
                              substory: ["Your mission is to cause a scene in Jeong-u Song's turf. You hop on a bike to make a quick getaway after."],
                              race: true,
                              win: {
                                gold: 30,
                                substory: ["You successfully created a distraction and escaped. You've sent a clear message."],
                                effects: { str: 2, dur: 2 },
                                game_title: "Mission Success",
                                game_desc: "You've proven your speed and cunning. What's next?",
                                cards: [{
                                  name: "Phantom Strike", type: "attack", staminaCost: 45, desc: `You are ablle to use Powerful strike that Stun the opponent<br>TECH +2, SPD +1`,
                                  effects: { tech: 2, spd: 1, statPoints: 2 }, damage: { min: 65, max: 120 }, cooldown: 4, gif: "/cha/barrage punch.gif", gif_target: "opponent", sound: "cha/sound/punch.mp3",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }, {
                                  name: "Tanker's Resilience", type: "buff", subType: "heal", staminaCost: 40, desc: `Heal for 40% of your max HP.<br>END +1, DUR +2`,
                                  effects: { end: 1, dur: 2, statPoints: 2 }, healPercent: 0.40, cooldown: 6, usesLimit: 1, gif: "cha/temp end.gif"
                                }, {
                                  name: "Concussive Blow", type: "debuff", subType: "stun", desc: `A powerful blow that stuns the opponent for 5 turn.<br>SPD +1, BIQ +2`,
                                  effects: { str: 1, biq: 2, statPoints: 2 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3"
                                }, {
                                  name: "Capoeira - Ginga Flow", type: "attack", staminaCost: 45, desc: `A fluid, dance-like series of kicks from unpredictable angles. A Swift strike with stun the opponents.<br>DUR +1, SPD +2`,
                                  effects: { dur: 1, spd: 2, statPoints: 2 }, damage: { min: 70, max: 115 }, cooldown: 4, gif: "cha/kick (2).gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }],
                                next_story: {
                                  storyNodeRef: 'earlyGameSequence'
                                }
                              }
                            },
                            lose: {
                              substory: ["You lost but Your mission is to cause a scene in Jeong-u Song's turf anyway. You hop on a bike to make a quick getaway after."],
                              race: true,
                              win: {
                                gold: 30,
                                substory: ["You successfully created a distraction and escaped. You've sent a clear message."],
                                effects: { str: 1, dur: 1 },
                                game_title: "Mission Success",
                                game_desc: "You've proven your speed and cunning. What's next?",
                                cards: [{
                                  name: "Intercepting Knee", type: "attack", staminaCost: 40, desc: ` a perfectly timed, rock-solid knee to their torso, stopping their momentum cold...<br>TECH +2, SPD +1`,
                                  effects: { tech: 2, spd: 1, statPoints: 2 }, damage: { min: 55, max: 120 }, cooldown: 4, gif: "cha/cut.gif", gif_target: "opponent", sound: "cha/sound/kick.wav",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stun.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }, {
                                  name: "Tanker's Resilience", type: "buff", subType: "heal", staminaCost: 40, desc: `Heal for 40% of your max HP.<br>END +1, DUR +2`,
                                  effects: { end: 1, dur: 2, statPoints: 2 }, healPercent: 0.40, cooldown: 6, usesLimit: 1, gif: "cha/temp end.gif"
                                }, {
                                  name: "Concussive Blow", type: "debuff", subType: "stun", desc: `A powerful blow that stuns the opponent for 5 turn.<br>SPD +1, BIQ +2`,
                                  effects: { str: 1, biq: 2, statPoints: 2 }, stunTurns: 5, cooldown: 5, usesLimit: 2, gif: "cha/S punch.gif", gif_target: "opponent", sound: "cha/sound/h punch.mp3"
                                }, {
                                  name: "Capoeira - Ginga Flow", type: "attack", staminaCost: 45, desc: `A fluid, dance-like series of kicks from unpredictable angles. A Swift strike with stun the opponents.<br>DUR +1, SPD +2`,
                                  effects: { dur: 1, spd: 2, statPoints: 2 }, damage: { min: 70, max: 115 }, cooldown: 4, gif: "cha/kick (2).gif", gif_target: "opponent", sound: "cha/sound/kick.mp3",
                                  secondaryEffect: {
                                    type: "debuff", subType: "stun", stunTurns: 2, stunEffectGif: "/cha/stunn.gif" //statToDebuff: "spd", debuffValue: 0.8, // Reduces speed by 20% debuffDuration: 2
                                  }
                                }],
                                next_story: {
                                  storyNodeRef: 'earlyGameSequence'
                                }
                              }
                            }
                          }
                        }],
                        next_story: {
                          substory: [`hello`]
                        }
                      }
                    }
                  },
                  {
                    label: "REJECT THE OFFER<br>{ still in development}<br>",
                    next: {
                      substory: ["'I work alone,' you say, turning your back on him. Choyun watches you go, an unreadable expression on his face. 'A shame,' he mutters."]
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      {
        label: "Join South Gangbuk High<br>{ still in development}<br>",
        gold: 500,
        effects: { str: 1, dur: 1, statPoints: 34 },
        substory: ["You enter South’s chaotic campus.", "Fights are breaking out even during lunch.", "A wild kid named Seok kang takes interest in you."]
      },
      {
        label: "Join East Gangbuk High<br>{ still in development}<br>",
        gold: 400,
        effects: { str: 10000, dur: 1, statPoints: 34 },
        substory: ["You step into East Gangbuk High.", "It’s organized — too organized.", "Someone’s pulling strings behind the scenes."],
        game_title: "The Eastern Front",
        game_desc: "This school is different. Quieter. More dangerous. What's your first move?",
        actions: [{
          label: "Go Solo",
          next: {
            battle: 'Choyun',
            win: {
              substory: ["The End. Thanks for playing!"],
              game_title: "END ",
              game_desc: "you can now play pvp.",
              actions: [{
                label: "online pvp",
                // --- AFTER ---
                onComplete: function () {
                  // This function will now run WHEN THE BUTTON IS CLICKED
                  const onlineData = {
                    playerName: playerName,
                    stats: stats,
                    cards: playerCards,
                    playerCardImage: localStorage.getItem('playerCardImage'),
                    playerBattleImage: localStorage.getItem('playerBattleImage')
                  };
                  localStorage.setItem('onlinePlayerStats', JSON.stringify(onlineData));

                  // Navigate directly to the online lobby page
                  window.location.href = '/online.html';
                }
              }]
            }
          }

        }, { label: "Ask to Join Crew" }, { label: "Train with Old Man" }]
      },
      {
        label: "Join West Gangbuk High<br>{ still in development}<br>",
        gold: 600,
        substory: ["You arrive at West Gangbuk High.", "The school is strict. Regimented.", "You’re immediately told to prove yourself."],
        game_title: "Western Discipline",
        game_desc: "In the West, they value raw power and technique. The system provides a foundation.",
        cards: [{ name: "KOC Combo", desc: "Power hits", bonus: "+2 STR" }, { name: "KOC Guard", desc: "Block counter", bonus: "+1 DUR" }]
      }
    ]
  },
];



// --- Save and Load Game State ---
function saveGameState() {
  const gameState = {
    playerName,
    statPoints,
    stats,
    playerCards,
    playerGold, // ADD THIS

    claimedStatRewards,
    currentStoryNode, // <<< This now saves your story progress
  };
  localStorage.setItem('lookismGameState', JSON.stringify(gameState));
}

function loadGameState() {
  const savedState = localStorage.getItem('lookismGameState');
  if (savedState) {
    const gameState = JSON.parse(savedState);
    playerName = gameState.playerName;
    playerGold = gameState.playerGold || 0; // ADD THIS

    statPoints = gameState.statPoints;
    stats = gameState.stats;
    playerCards = gameState.playerCards;
    claimedStatRewards = gameState.claimedStatRewards || [];
    currentStoryNode = gameState.currentStoryNode; // <<< This now loads your story progress
    return true;
  }
  return false;
}

function updateUIFromLoadedState() {
  updateStats();
  document.getElementById("attack-cards").innerHTML = '';
  document.getElementById("support-cards").innerHTML = '';
  document.getElementById("debuff-cards").innerHTML = '';
  playerCards.forEach(card => addCardToUI(card, false));
  document.getElementById("player-name").textContent = `<strong>Player: ${playerName}<strong>`;
  const playerCardImg = localStorage.getItem('playerCardImage');
  if (playerCardImg) {
    document.getElementById("gamePlayerCard").style.backgroundImage = `url(${playerCardImg})`;
  }
}

// --- Core UI & Sound Functions ---
function playClickSound() {
  const sound = document.getElementById("btnSound");
  if (sound) sound.play();
}

function playSound(soundId) {
  const sound = document.getElementById(soundId);
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.error(`Error playing sound ${soundId}:`, e));
  }
}
// Add this new function to your script
function playEndVideo(videoSrc, onEndedCallback) {
  const videoPanel = document.getElementById('video-panel');
  const videoPlayer = document.getElementById('endVideo');

  videoPlayer.querySelector('source').setAttribute('src', videoSrc);
  videoPlayer.load(); // Load the new video source

  transitionPanels('story-panel', 'video-panel');

  videoPlayer.play().catch(e => console.error("Video autoplay failed:", e));

  videoPlayer.onended = () => {
    videoPanel.classList.add('hidden');
    if (onEndedCallback) {
      onEndedCallback();
    }
  };
}

function transitionPanels(hideId, showId) {
  const hidePanel = document.getElementById(hideId);
  const showPanel = document.getElementById(showId);
  if (!hidePanel || !showPanel) return;

  // ADD THIS 'IF' BLOCK
  if (hideId === 'battle-panel') {
    battle_cleanupVisualEffects();
  }

  hidePanel.classList.remove("fade-in");
  hidePanel.classList.add("fade-out");


  setTimeout(() => {
    hidePanel.classList.add("hidden");
    hidePanel.classList.remove("fade-out");
    showPanel.classList.remove("hidden");
    showPanel.classList.add("fade-in");

    if (showId === 'battle-panel') {
      checkOrientation();
    }
  }, 400);
}

function resetStartButton(callback) {
  const oldBtn = document.getElementById("startGameBtn");
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);
  newBtn.onclick = () => { playClickSound(); callback(); };
}

// --- Text Animation Helper ---
function updateStoryText(newText) {
  const storyTextEl = document.getElementById("story-text");
  storyTextEl.classList.remove('text-fade-in');
  void storyTextEl.offsetWidth; // Trigger reflow to restart animation
  storyTextEl.innerHTML = newText;
  storyTextEl.classList.add('text-fade-in');
}

// --- Initial Setup Flow ---
// In script.js, find and REPLACE your existing startNewGame function

function startNewGame() {
  enterFullScreen();
  playClickSound();

  // --- MODIFICATION START ---
  // First, transition to the disclaimer panel
  transitionPanels("intro-panel", "disclaimer-panel");

  // After 5 seconds, proceed with the original game start logic
  setTimeout(() => {
    // The preloader will handle showing the loading screen and then calling the next step
    preloadAssets(() => {
      // This code runs AFTER all assets are loaded
      localStorage.clear();
      playerName = "";
      statPoints = 0;
      stats = { str: 0, end: 0, tech: 0, dur: 0, spd: 0, biq: 0 };
      playerCards = [];
      claimedStatRewards = [];
      rollCount = 0;
      resetBattleSequenceState();

      document.getElementById("rollDiceBtn").disabled = false;
      updateRollCountUI();
      document.getElementById("rolledStats").classList.add("hidden");

      // Now we transition from the loading panel to the name panel
      transitionPanels("loading-panel", "name-panel");
    });
    // Hide the disclaimer and show the loading panel to start preloading
    document.getElementById('disclaimer-panel').classList.add('hidden');
    document.getElementById('loading-panel').classList.remove('hidden');

  }, 5000); // 5000 milliseconds = 5 seconds
  // --- MODIFICATION END ---
}

function completeName() {
  const nameInput = document.getElementById("nameInput");
  if (!nameInput.checkValidity()) { nameInput.reportValidity(); return; }
  playerName = nameInput.value.trim();
  if (!playerName) { alert("Please enter a valid name."); return; }
  transitionPanels("name-panel", "dice-panel");

  const randomImageSet = playerImageSets[Math.floor(Math.random() * playerImageSets.length)];

  document.getElementById("playerCard").style.backgroundImage = `url(${randomImageSet.card})`;
  document.getElementById("gamePlayerCard").style.backgroundImage = `url(${randomImageSet.card})`;

  localStorage.setItem('playerCardImage', randomImageSet.card);
  localStorage.setItem('playerBattleImage', randomImageSet.battle);
}

// --- Dice Roll & Stat Logic ---
const ranks = ["Null", "F", "E", "D", "C", "C+", "B", "B+", "A-", "A", "A+", "S-", "S", "S+", "SS-", "SS", "SS+", "SSS-", "SSS", "SSS+", "SR", "SR+", "SSR", "SSR+", "UR", "UR+", "LR", "LR+", "MR", "MR+", "X", "XX", "XXX", "EX", "DX", "UNMEASURABLE"];
let rolling = false;

function getRankDetails(value) {
  const rankName = ranks[value] || "UNMEASURABLE";
  let glowClass = '';

  const rankColorMapping = {
    "Null": "rank-color-f", "F": "rank-color-f", "E": "rank-color-e", "D": "rank-color-d",
    "C": "rank-color-c", "C+": "rank-color-c", "B": "rank-color-b", "B+": "rank-color-b",
    "A-": "rank-color-a", "A": "rank-color-a", "A+": "rank-color-a", "S-": "rank-color-s",
    "S": "rank-color-s", "S+": "rank-color-s", "SS-": "rank-color-ss", "SS": "rank-color-ss",
    "SS+": "rank-color-ss", "SSS-": "rank-color-sss", "SSS": "rank-color-sss", "SSS+": "rank-color-sss"
  };
  let colorClass = rankColorMapping[rankName] || '';

  // Glow Tiers
  if (["SR", "SR+", "SSR", "SSR+"].includes(rankName)) {
    glowClass = 'rank-glow-tier-2';
  } else if (["UR", "UR+", "LR", "LR+", "MR", "MR+"].includes(rankName)) {
    glowClass = 'rank-glow-tier-3';
  } else if (["X", "XX", "XXX"].includes(rankName)) {
    glowClass = 'rank-glow-tier-4';
  } else if (["EX", "DX"].includes(rankName)) {
    glowClass = 'rank-glow-tier-5';
  } else if (rankName === "UNMEASURABLE") {
    glowClass = 'rank-glow-tier-6';
  }

  return {
    name: rankName,
    classes: [colorClass, glowClass].filter(Boolean)
  };
}

function updateRollCountUI() {
  const rollsLeft = maxRolls - rollCount;
  const rollBtn = document.getElementById("rollDiceBtn");
  rollBtn.textContent = rollCount >= maxRolls ? "No Rolls Left 🎲" : `🎲 Roll Dice (${rollsLeft} left)`;
}

function rollStats() {
  if (rolling || rollCount >= maxRolls) return;
  playClickSound();
  rolling = true;
  rollCount++;
  updateRollCountUI();
  const statKeys = Object.keys(stats);
  const statNames = ["Strength", "Endurance", "Technique", "Durability", "Speed", "BIQ"];
  const statReveal = document.getElementById("statReveal");
  statReveal.innerHTML = "";
  let delay = 0;
  statKeys.forEach((key, index) => {
    const value = Math.floor(Math.random() * 10) + 1;
    stats[key] = value;
    delay += 500;
    setTimeout(() => {
      const rankDetails = getRankDetails(value);
      const div = document.createElement("div");
      const rankSpan = document.createElement("span");
      rankSpan.textContent = rankDetails.name;
      rankSpan.classList.add(...rankDetails.classes);
      div.append(`${statNames[index]}: `);
      div.appendChild(rankSpan);
      statReveal.appendChild(div);
    }, delay);
  });
  setTimeout(() => {
    document.getElementById("rolledStats").classList.remove("hidden");
    rolling = false;
    if (rollCount >= maxRolls) { document.getElementById("rollDiceBtn").disabled = true; }
  }, delay + 500);
}

// --- Story Progression & Game Logic ---
function startJourney() {
  playClickSound();
  updateStats();
  transitionPanels("dice-panel", "story-panel");
  selectedStory = storyOptions[Math.floor(Math.random() * storyOptions.length)];
  currentStoryIndex = 0;
  document.getElementById("story-title").innerHTML = selectedStory.title;
  updateStoryText(selectedStory.parts[currentStoryIndex]);
  document.getElementById("nextBtn").classList.remove("hidden");
  document.getElementById("startGameBtn").classList.add("hidden");
}

document.getElementById("nextBtn").addEventListener("click", () => {
  currentStoryIndex++;
  if (currentStoryIndex < selectedStory.parts.length) {
    updateStoryText(selectedStory.parts[currentStoryIndex]);
  } else {
    document.getElementById("nextBtn").classList.add("hidden");
    document.getElementById("startGameBtn").classList.remove("hidden");
    resetStartButton(startGamePanel);
  }
});

function startGamePanel() {
  transitionPanels("story-panel", "game-panel");
  showStoryActions(selectedStory.choices, selectedStory.game_title, selectedStory.game_desc);
}

function handleTraining(actionData) {
  transitionPanels('game-panel', 'training-panel');
  setTimeout(() => {
    transitionPanels('training-panel', 'game-panel');
    handleChoice(actionData.next);
  }, 5000); // 5 seconds for the GIF
}

function handleChoice(choiceData) {
  playClickSound();

  // FIX: These two lines track your current position in the story.
  currentStoryNodeKey = findKeyForChoice(choiceData);
  currentStoryAction = choiceData;

  if (choiceData && choiceData.storyNodeRef && storyNodes[choiceData.storyNodeRef]) {
    choiceData = storyNodes[choiceData.storyNodeRef];
    // Also update the key if we are redirecting to another node
    currentStoryNodeKey = choiceData.storyNodeRef;
    currentStoryAction = choiceData;
  }
  if (!choiceData) return;

  if (choiceData.effects) {
    const {
      statPoints: points = 0, ...rest
    } = choiceData.effects;
    updateStats(rest, points);
  }
  // ADD THIS BLOCK to check for and grant gold rewards
  if (choiceData.gold) {
    grantGold(choiceData.gold);
  }


  if (choiceData.substory && choiceData.substory.length > 0) {
    runSubStory(choiceData.substory, choiceData.cards || null, choiceData.actions || null, choiceData);
  } else if (choiceData.end_video) {
    playEndVideo(choiceData.end_video.src, () => {
      handleChoice(choiceData.end_video.next);
    });
  } else if (choiceData.cards) {
    showCardChoices(choiceData.cards, choiceData.next_story || null, choiceData.game_title, choiceData.game_desc);
  } else if (choiceData.actions) {
    showActionChoices(choiceData.actions, choiceData.game_title, choiceData.game_desc);
  } else if (choiceData.battle) {
    initiateBattle([choiceData.battle], 0, choiceData.win, choiceData.lose, 'game-panel');
  } else if (choiceData.battle_sequence) {
    initiateBattle(choiceData.battle_sequence, 0, choiceData.win, choiceData.lose, 'game-panel');
  } else if (choiceData.race) {
    initiateRace(choiceData.win, 'game-panel');
  }
}


function showStoryActions(choiceList, title, desc) {
  const actionArea = document.getElementById("action-choices");
  actionArea.innerHTML = "";
  document.getElementById("card-choices").classList.add("hidden");
  actionArea.classList.remove("hidden");

  document.getElementById("game-title").innerHTML = title || "Choose Your Path";
  document.getElementById("game-desc").innerHTML = desc || "Each choice leads to a new chapter...";

  choiceList.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-button";
    btn.innerHTML = choice.label; // Use innerHTML to render <br> tags
    btn.onclick = () => {
      if (choice.train) {
        handleTraining(choice);
      } else {
        handleChoice(choice);
      }
    };
    actionArea.appendChild(btn);
  });
}

function runSubStory(parts, rewardCards = null, nextActions = null, choiceData = null) {
  const hasFollowUpAction = choiceData?.battle || choiceData?.battle_sequence || choiceData?.race || rewardCards || nextActions || choiceData?.next_story;

  if ((!parts || parts.length === 0) && hasFollowUpAction) {
    if (choiceData.battle) initiateBattle([choiceData.battle], 0, choiceData.win, choiceData.lose, 'game-panel');
    else if (choiceData.battle_sequence) initiateBattle(choiceData.battle_sequence, 0, choiceData.win, choiceData.lose, 'game-panel');
    else if (choiceData.race) initiateRace(choiceData.win, 'game-panel');
    else if (rewardCards) showCardChoices(rewardCards, choiceData.next_story || null, choiceData.game_title, choiceData.game_desc);
    else if (nextActions) showActionChoices(nextActions, choiceData.game_title, choiceData.game_desc);
    else if (choiceData.next_story) handleChoice(choiceData.next_story);
    return;
  }

  if (!parts || parts.length === 0) return;

  transitionPanels("game-panel", "story-panel");
  let idx = 0;
  document.getElementById("story-title").innerHTML = "Sub-Story";
  updateStoryText(parts[idx]);
  document.getElementById("nextBtn").classList.remove("hidden");
  document.getElementById("startGameBtn").classList.add("hidden");

  const nextBtn = document.getElementById("nextBtn");
  const storyNext = nextBtn.cloneNode(true);
  nextBtn.parentNode.replaceChild(storyNext, nextBtn);
  storyNext.onclick = () => {
    idx++;
    if (idx < parts.length) { updateStoryText(parts[idx]); }
    else {
      storyNext.classList.add("hidden");
      document.getElementById("startGameBtn").classList.remove("hidden");
      // --- AFTER (The corrected code) ---
      resetStartButton(() => {
        if (choiceData?.battle) {
          initiateBattle([choiceData.battle], 0, choiceData.win, choiceData.lose, 'story-panel');
        } else if (choiceData?.battle_sequence) {
          initiateBattle(choiceData.battle_sequence, 0, choiceData.win, choiceData.lose, 'story-panel');
        } else if (choiceData?.race) {
          initiateRace(choiceData.win, 'story-panel');
        } else if (rewardCards) {
          showCardChoices(rewardCards, choiceData.next_story || null, choiceData.game_title, choiceData.game_desc);
        } else if (nextActions) {
          showActionChoices(nextActions, choiceData.game_title, choiceData.game_desc);
        }
        // vvv THIS IS THE NEW PART THAT FIXES THE BUG vvv
        else if (choiceData && typeof choiceData.onComplete === 'function') {
          choiceData.onComplete(); // Execute the function to save data and show the popup
          document.getElementById("startGameBtn").classList.add("hidden"); // Hide the button after it's used
          updateStoryText("Online Mode Unlocked! You can now access it from the main menu."); // Give final feedback
        }
        // ^^^ END OF NEW PART ^^^
        else {
          handleChoice(choiceData.next_story);
        }
      });
    }
  };
}

function showActionChoices(options, title, desc) {
  transitionPanels("story-panel", "game-panel");
  const actionArea = document.getElementById("action-choices");
  document.getElementById("card-choices").classList.add("hidden");
  actionArea.innerHTML = "";
  actionArea.classList.remove("hidden");

  document.getElementById("game-title").innerHTML = title || "Make Your Move";
  document.getElementById("game-desc").innerHTML = desc || "The consequences of this choice will be immediate.";

  currentDisplayState = { type: "actions", options, title, desc };

  options.forEach(action => {
    const btn = document.createElement("button");
    btn.className = "choice-button";
    btn.innerHTML = action.label;
    // The onclick function is now corrected to use 'action'
    btn.onclick = () => {
      playClickSound();
      if (action.train) { // Changed from 'choice' to 'action'
        handleTraining(action);
      }
      else if (action.onComplete && typeof action.onComplete === 'function') { // Changed from 'choice' to 'action'
        action.onComplete();
      }
      else {
        handleChoice(action.next); // Changed from 'choice.next' to 'action.next'
      }
    };
    actionArea.appendChild(btn);
  });
}

function showCardChoices(cards, nextStory = null, title, desc) {
  transitionPanels("story-panel", "game-panel");
  const cardArea = document.getElementById("card-choices");
  document.getElementById("action-choices").classList.add("hidden");
  cardArea.innerHTML = "";
  cardArea.classList.remove("hidden");

  document.getElementById("game-title").innerHTML = title || "A Reward from the System";
  document.getElementById("game-desc").innerHTML = desc || "Choose your new power carefully.";

  // This line creates a snapshot of the current screen for saving.
  currentDisplayState = { type: "cards", cards, nextStory, title, desc };

  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<div class="title">${card.type.toUpperCase()} CARD</div><div class="subtitle">${card.name}</div><div class="description">${card.desc}</div>`;
    div.onclick = () => {
      playClickSound();

      if (card.effects) {
        const { statPoints: points = 0, ...rest } = card.effects;
        updateStats(rest, points);
      }

      if (card.type !== 'stat_boost') {
        addCardToUI(card);
      }

      if (nextStory) {
        handleChoice(nextStory);
      } else {
        currentDisplayState = null; // Clear state after choice
        document.getElementById("card-choices").classList.add("hidden");
        document.getElementById("action-choices").classList.remove("hidden");
        document.getElementById("action-choices").innerHTML = "<p>You can continue your journey.</p>";
      }
    };
    cardArea.appendChild(div);
  });
}

function restoreGameView() {
  // This function uses the loaded checkpoint data to show the correct screen
  if (currentStoryNode) {
    // Hide whatever panel is currently visible and show the main game panel
    const currentPanel = document.querySelector('.panel:not(.hidden)');
    if (currentPanel) {
      transitionPanels(currentPanel.id, 'game-panel');
    } else {
      // Fallback if no panel is visible
      document.getElementById('game-panel').classList.remove('hidden');
    }

    // Restore the correct choices based on the checkpoint type
    if (currentStoryNode.type === 'actions') {
      showActionChoices(currentStoryNode.options, currentStoryNode.title, currentStoryNode.desc);
    } else if (currentStoryNode.type === 'cards') {
      showCardChoices(currentStoryNode.cards, currentStoryNode.nextStory, currentStoryNode.title, currentStoryNode.desc);
    }
  } else {
    // Fallback if there's no saved story progress (e.g., very old save file)
    startGamePanel();
  }
}


// --- Stat Panel & Allocation ---
function addCardToUI(card, shouldAddToCollection = true) {
  let listId;
  switch (card.type) {
    case 'attack': listId = 'attack-cards'; break;
    case 'buff': listId = 'support-cards'; break;
    case 'debuff': listId = 'debuff-cards'; break;
    default: return;
  }
  const list = document.getElementById(listId);
  if (list) {
    const li = document.createElement('li');
    li.textContent = card.name;
    list.appendChild(li);
  }
  if (shouldAddToCollection) { playerCards.push(card); }
}

function updateStats(newStats = {}, extraPoints = 0) {
  console.groupCollapsed(`%c STAT UPDATE `, 'background: #222; color: #bada55');
  console.log('Previous Stats:', JSON.parse(JSON.stringify(stats)));
  console.log('Changes:', newStats);
  console.log('Stat Points Gained:', extraPoints);

  for (let key in newStats) { if (stats.hasOwnProperty(key)) { stats[key] += newStats[key]; } }
  statPoints += extraPoints;
  document.getElementById("player-name").innerHTML = `Player: <b>${playerName}</b>`;
  for (let key in stats) {
    const fill = document.getElementById(`${key}-fill`);
    const rankSpan = document.getElementById(`${key}-rank`);
    if (fill && rankSpan) {
      const percent = Math.min(100, Math.floor(((stats[key] - 1) / (ranks.length - 1)) * 100));
      fill.style.width = `${percent}%`;

      const rankDetails = getRankDetails(stats[key]);
      rankSpan.textContent = rankDetails.name;
      rankSpan.className = '';
      rankSpan.classList.add(...rankDetails.classes);
    }
  }

  console.log('New Stats:', JSON.parse(JSON.stringify(stats)));
  console.log('New Stat Point Total:', statPoints);
  console.groupEnd();

  displayStatPointsUI();
  checkForStatRewards();
}

function displayStatPointsUI() {
  document.getElementById("statPointValue").textContent = statPoints;
  renderPlusButtons();
}

function renderPlusButtons() {
  Object.keys(stats).forEach((key) => {
    const block = document.getElementById(`${key}-block`);
    let btn = block.querySelector(".plus-btn");
    if (statAllocationMode && statPoints > 0) {
      if (!btn) {
        btn = document.createElement("button");
        btn.className = "plus-btn";
        btn.textContent = "+";
        btn.onclick = () => increaseStat(key);
        block.appendChild(btn);
      }
    } else { if (btn) btn.remove(); }
  });
}

function increaseStat(key) {
  if (statPoints <= 0) return;
  playClickSound();
  stats[key]++;
  statPoints--;
  updateStats();
  if (statPoints === 0) { statAllocationMode = false; renderPlusButtons(); }
}

// --- Stat Reward Logic ---
function checkForStatRewards() {
  statRewardTiers.forEach(reward => {
    if (!claimedStatRewards.includes(reward.id) && stats[reward.stat] >= reward.threshold) {
      claimedStatRewards.push(reward.id);
      addCardToUI(reward.card);
      showRewardMessage(reward.card);
    }
  });
}

function showRewardMessage(card) {
  const rewardPanel = document.getElementById('reward-panel');
  const rewardCardDisplay = document.getElementById('reward-card-display');

  rewardCardDisplay.innerHTML = `<div class="title">${card.type.toUpperCase()} CARD</div><div class="subtitle">${card.name}</div><div class="description">${card.desc}</div>`;

  rewardPanel.classList.remove('hidden');
  rewardPanel.classList.add('fade-in');

  setTimeout(() => {
    rewardPanel.classList.remove('fade-in');
    rewardPanel.classList.add('fade-out');
    setTimeout(() => {
      rewardPanel.classList.add('hidden');
      rewardPanel.classList.remove('fade-out');
    }, 500);
  }, 5000); // Show for 5 seconds
}


// --- Battle Initiator ---
function initiateBattle(opponentKeys, currentIndex, winData, loseData, fromPanel) {
  if (!opponentKeys || opponentKeys.length === 0 || currentIndex >= opponentKeys.length) {
    console.error("Invalid opponent sequence.");
    return;
  }
  const opponentKey = opponentKeys[currentIndex];
  if (!opponents[opponentKey]) {
    console.error("Opponent key not found:", opponentKey);
    return;
  }


  if (currentIndex === 0) {
    battle_sequence_player_state.maxHp = (stats.dur + stats.end) * 100;
    battle_sequence_player_state.hp = battle_sequence_player_state.maxHp;
    battle_sequence_player_state.cards = JSON.parse(JSON.stringify(playerCards)).map(card => ({
      ...card,
      cooldownTurnsLeft: 0,
      usesLeft: card.usesLimit === undefined ? -1 : card.usesLimit,
      sealedTurnsLeft: 0 // <-- ADD THIS to initialize the sealed state
    }));
    battle_maxPlayerStamina = (stats.spd + stats.end) * 10;
    battle_playerStamina = battle_maxPlayerStamina;
  }

  saveGameState();
  battle_setup(opponents[opponentKey], opponentKeys, currentIndex, winData, loseData);
  transitionPanels(fromPanel, 'battle-panel');
}


// --- Race Initiator ---
function initiateRace(winData, fromPanel) {
  saveGameState();
  const winCallback = () => {
    transitionPanels('race-panel', 'game-panel');
    handleChoice(winData);
  };
  const loseCallback = () => {
    initiateRace(winData, 'race-panel');
  };
  transitionPanels(fromPanel, 'race-panel');
  raceGame.init(winCallback, loseCallback);
}

// ===============================================================
// BATTLE LOGIC
// ===============================================================
let battle_stunResistAttempts = 0;      // <-- ADD THIS LINE
let battle_stunWillBrokenMessageShown = false; // <-- ADD THIS LINE
let battle_playerRageActive = false;       // <-- ADD THIS LINE
let battle_playerCardLockTurns = 0;      // <-- ADD THIS LINE
// ... rest of your battle variables
// ... rest of your battle variables
let battle_playerStamina = 0, battle_maxPlayerStamina = 0; // <-- ADD THIS LINE
let battle_opponentData = null, battle_winCondition = null, battle_loseCondition = null;
let battle_playerHP = 0, battle_maxPlayerHP = 0;
let battle_opponentHP = 0, battle_maxOpponentHP = 0;
let battle_playerBuff = 1, battle_playerDefence = false;
let battle_playerDamageReduction = 1; // 1 means 100% damage (no reduction)
let battle_opponentDamageReduction = 1; // Opponent's damage reduction
// In script.js

var battle_currentCardType = null, battle_isPlayerTurn = true, battle_playerTurnCount = 0;
let battle_opponentCards = [], battle_playerCards = [];
let battle_activePlayerBuffs = [], battle_activeOpponentDebuffs = [], battle_activePlayerDebuffs = [];
let battle_activePlayerBleeds = [], battle_activeOpponentBleeds = []; // Add this line

let battle_opponentStunnedTurns = 0;
let battle_playerStunnedTurns = 0;
let battle_opponentSequence = [], battle_currentOpponentIndex = 0;
let battle_isOver = false;

function resetBattleSequenceState() {
  battle_sequence_player_state.hp = null;
  battle_sequence_player_state.maxHp = null;
  battle_sequence_player_state.cards = null;
}

// INSIDE battle_setup function...
// ADD THIS HELPER FUNCTION
function hasActiveSpeedBuff(activeBuffsArray) {
  return activeBuffsArray.some(buff => buff.subType === 'temp_stat' && buff.statToBuff === 'spd');
}
// --- BATTLE LOGIC ---

// ADD THIS ENTIRE NEW FUNCTION
function battle_cleanupVisualEffects() {
  console.log("Cleaning up battle visual effects...");

  // 1. Hide and reset any active STUN GIFs
  const playerStunGif = document.getElementById('player-stun-gif');
  const opponentStunGif = document.getElementById('opponent-stun-gif');

  if (playerStunGif) {
    playerStunGif.classList.add('hidden');
    playerStunGif.src = ''; // Stop the GIF from loading/looping
  }
  if (opponentStunGif) {
    opponentStunGif.classList.add('hidden');
    opponentStunGif.src = '';
  }

  // 2. Hide any lingering ATTACK GIFs
  document.getElementById('player-gif-container').style.display = 'none';
  document.getElementById('opponent-gif-container').style.display = 'none';
  document.getElementById('middle-gif-container').style.display = 'none';

  // 3. Remove all GLOW effects from characters
  const playerImage = document.getElementById('battle_playerImage');
  const opponentImage = document.getElementById('battle_opponentImage');
  const glowColors = ['green', 'red', 'blue', 'pink', 'black', 'brown', 'yellow', 'purple'];

  if (playerImage) {
    glowColors.forEach(color => playerImage.classList.remove(`glow-${color}`));
  }
  if (opponentImage) {
    glowColors.forEach(color => opponentImage.classList.remove(`glow-${color}`));
  }
}
// Add this new function to script.js
// This is the new function to COPY
function battle_checkAndApplyRage() {
  const playerImage = document.getElementById('battle_playerImage');

  // Remove glow at the start of each check
  playerImage.classList.remove('glow-red');

  // Reset rage state for the current turn
  battle_playerRageActive = false;

  const hpPercent = battle_playerHP / battle_maxPlayerHP;

  // 1. Check if player HP is at or below the 35% threshold
  if (hpPercent <= 0.35) {
    // 2. Roll for the 70% activation chance
    if (Math.random() < 0.70) {
      // RAGE IS ACTIVE for this turn
      battle_playerRageActive = true;
      playerImage.classList.add('glow-red'); // ADD THE GLOW EFFECT

      // 3. Roll for the 20% chance of a negative side effect
      if (Math.random() < 0.20) {
        battle_playerCardLockTurns = Math.floor(Math.random() * 4) + 1; // Random 1-4 turns
        battle_logMessage(`<span style="color: #ff4747;">You are consumed by RAGE and cannot focus on your cards for ${battle_playerCardLockTurns} turns!</span>`);
      }
    }
  }
}
// REPLACE your existing function with this updated version
function battle_applyStunToOpponent(stunTurns, cardWithEffect) {
  // Exit if the stun has no duration
  if (!stunTurns || stunTurns <= 0) return;

  // Reset the resistance counters for this new stun application
  battle_stunResistAttempts = 0;
  battle_stunWillBrokenMessageShown = false;

  // This function now just applies the stun directly
  battle_opponentStunnedTurns += stunTurns;
  battle_logMessage(`Opponent is <span style="color: #e7b946ff"><b>Stunned</b></span> for ${stunTurns} turn(s).`);

  if (cardWithEffect && cardWithEffect.stunEffectGif) {
    const stunGif = document.getElementById('opponent-stun-gif');
    stunGif.src = cardWithEffect.stunEffectGif;
    stunGif.classList.remove('hidden');
  }
}

// In script.js, add this new function
function endBattleAfterSpecialSequence() {
  document.querySelector('#battle-panel .buttons').style.display = 'none';
  const returnBtn = document.createElement("button");
  returnBtn.textContent = "Claim Victory";
  returnBtn.onclick = () => {
    resetBattleSequenceState();
    transitionPanels('battle-panel', 'game-panel');
    handleChoice(battle_winCondition);
  };
  document.getElementById('battle_log').appendChild(returnBtn);
}
// --- Your existing battle_setup function starts below this ---

function battle_setup(opponentData, opponentKeys, currentIndex, winCondition, loseCondition) {
  battle_opponentData = { ...opponentData, current_stats: { ...opponentData.stats } };
  battle_opponentSequence = opponentKeys;
  battle_currentOpponentIndex = currentIndex;

  battle_winCondition = winCondition;
  battle_loseCondition = loseCondition;

  battle_playerHP = battle_sequence_player_state.hp;
  battle_maxPlayerHP = battle_sequence_player_state.maxHp;
  battle_playerCards = battle_sequence_player_state.cards;

  battle_opponentHP = (opponentData.stats.dur + opponentData.stats.end) * 100;
  battle_maxOpponentHP = battle_opponentHP;

  battle_playerBuff = 1;
  battle_playerDefence = false;
  battle_isPlayerTurn = true;
  battle_playerTurnCount = 0;
  battle_activePlayerBuffs = [];
  battle_activeOpponentDebuffs = [];
  battle_activeOpponentBuffs = [];
  battle_activePlayerDebuffs = [];
  battle_activePlayerBleeds = []; // Add this line
  battle_activeOpponentBleeds = []; // Add this line
  battle_opponentStunnedTurns = 0;
  battle_playerStunnedTurns = 0;
  battle_opponentBuff = 1; // This will hold the damage multiplier
  battle_isOver = false; // Reset the battle over state
  battle_playerBuff = 1; // Reset one-time player buff
  battle_opponentBuff = 1; // Reset one-time opponent buff
  battle_opponentDamageReduction = 1; // Reset opponent's damage reduction
  // ADD THIS HELPER FUNCTION




  battle_opponentCards = opponentData.cards.map(card => ({ ...card, cooldownTurnsLeft: 0, usesLeft: card.usesLimit === undefined ? -1 : card.usesLimit }));

  const battleScreen = document.querySelector('#battle-panel .game-screen');
  if (opponentData.background && battleScreen) {
    battleScreen.style.backgroundImage = opponentData.background;
  } else if (battleScreen) {
    battleScreen.style.backgroundImage = "url('https://i.pinimg.com/originals/89/5f/68/895f68f86a953a7d259583952erg.gif')";
  }

  document.getElementById("battle_opponentName").textContent = `${opponentData.name} (${currentIndex + 1}/${opponentKeys.length})`;

  // --- MODIFICATION START ---
  const opponentKey = opponentKeys[currentIndex];
  const opponentImageEl = document.getElementById("battle_opponentImage");

  // Reset classes to just the base class, removing any from previous opponents
  opponentImageEl.className = 'opponent-img';

  // Add the new specific class based on the opponent key (e.g., "Jeong_u_Song")
  opponentImageEl.classList.add(opponentKey);

  opponentImageEl.src = opponentData.image;
  // --- MODIFICATION END ---

  document.getElementById("battle_playerImage").src = localStorage.getItem('playerBattleImage') || playerImageSets[0].battle;
  document.getElementById("battle_log").innerHTML = "";
  battle_logMessage(`Battle starts! You are facing ${opponentData.name}.`);
  battle_updateHealthBars();
  battle_updateStaminaBar(); // <-- ADD THIS LINE

  document.querySelector('#battle-panel .buttons').style.display = 'flex';
  document.getElementById('battle_cardContainer').style.display = 'none';
  const oldReturnBtn = document.querySelector('#battle_log button');
  if (oldReturnBtn) oldReturnBtn.remove();
}

function battle_calculateActiveMultiplier(activeBuffs) {
  let multiplier = 1;
  activeBuffs.forEach(buff => {
    if (buff.subType === 'multiplier' && buff.buffAmount) {
      multiplier *= buff.buffAmount;
    }
  });
  return multiplier;
}


function battle_updateHealthBars() {
  const playerHealthPercent = Math.max(0, (battle_playerHP / battle_maxPlayerHP) * 100);
  const opponentHealthPercent = Math.max(0, (battle_opponentHP / battle_maxOpponentHP) * 100);
  document.getElementById("battle_playerHealth").style.width = playerHealthPercent + "%";
  document.getElementById("battle_opponentHealth").style.width = opponentHealthPercent + "%";

  // ADD THIS LINE to prevent the image from changing back during special sequences
  if (battle_isOver) return;
  const opponentImage = document.getElementById("battle_opponentImage");

  if (battle_opponentHP <= battle_maxOpponentHP * 0.3) {
    opponentImage.classList.add('critical');
    opponentImage.classList.remove('damaged');
    if (battle_opponentData.image_damaged) opponentImage.src = battle_opponentData.image_damaged;
  } else if (battle_opponentHP <= battle_maxOpponentHP * 0.5) {
    opponentImage.classList.add('damaged');
    opponentImage.classList.remove('critical');
    if (battle_opponentData.image_damaged) opponentImage.src = battle_opponentData.image_damaged;
  } else {
    opponentImage.classList.remove('damaged', 'critical');
    opponentImage.src = battle_opponentData.image;
  }
}
// Add this new function near battle_updateHealthBars
function battle_updateStaminaBar() {
  const staminaPercent = Math.max(0, (battle_playerStamina / battle_maxPlayerStamina) * 100);
  document.getElementById("battle_playerStamina").style.width = staminaPercent + "%";
  document.getElementById("battle_playerStaminaText").textContent = `${Math.floor(battle_playerStamina)}/${battle_maxPlayerStamina}`;
}

function battle_logMessage(message) {
  const log = document.getElementById("battle_log");
  log.innerHTML += message + "<br>";
  log.scrollTop = log.scrollHeight;
}

function battle_triggerAnimation(elementId, animationClass) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.add(animationClass);
  setTimeout(() => el.classList.remove(animationClass), 400);
}

function battle_showAttackGif(gifSrc, target = 'middle') {
  let attackGif;
  let attackGifContainer;
  if (target === 'player') {
    attackGif = document.getElementById("player-attack-gif");
    attackGifContainer = document.getElementById("player-gif-container");
  } else if (target === 'opponent') {
    attackGif = document.getElementById("opponent-attack-gif");
    attackGifContainer = document.getElementById("opponent-gif-container");
  } else {
    attackGif = document.getElementById("middle-attack-gif");
    attackGifContainer = document.getElementById("middle-gif-container");
  }
  if (attackGif && attackGifContainer) {
    attackGif.src = `${gifSrc}?t=${new Date().getTime()}`;
    attackGifContainer.style.display = 'block';
    setTimeout(() => {
      attackGifContainer.style.display = 'none';
      attackGif.src = '';
    }, 1000);
  }
}

function battle_getPlayerBattleStats() {
  const battleStats = { ...stats };

  battle_activePlayerBuffs.forEach(buff => {
    if (buff.subType === 'temp_stat' && battleStats.hasOwnProperty(buff.statToBuff)) {
      battleStats[buff.statToBuff] += buff.buffValue;
    }
  });

  battle_activePlayerDebuffs.forEach(debuff => {
    if (debuff.subType === 'stat_reduction') {
      if (Array.isArray(debuff.statToDebuff)) {
        // Handle array of stats
        debuff.statToDebuff.forEach(stat => {
          if (battleStats.hasOwnProperty(stat)) {
            battleStats[stat] = Math.floor(battleStats[stat] * debuff.debuffValue);
          }
        });
      } else if (battleStats.hasOwnProperty(debuff.statToDebuff)) {
        // Handle single stat string
        battleStats[debuff.statToDebuff] = Math.floor(battleStats[debuff.statToDebuff] * debuff.debuffValue);
      }
    }
  });

  return battleStats;
}

function battle_calculateNormalAttack(attackerStats, isPlayerAttacker, buff = 1) {
  const baseDamage = attackerStats.str + attackerStats.spd + attackerStats.biq + attackerStats.tech + (Math.floor(Math.random() * 8) + 1);
  let totalDamage = Math.floor(baseDamage * buff);
  if (isPlayerAttacker && Math.random() < 0.25) {
    battle_logMessage(`<b>💥 CRITICAL HIT! 💥</b>`);
    totalDamage = Math.floor(totalDamage * 2.25);
  }
  return totalDamage;
}

function battle_updateEffects() {
  // --- CARD LOCK COUNTDOWN ---
  if (battle_playerCardLockTurns > 0) {
    battle_playerCardLockTurns--;
    if (battle_playerCardLockTurns === 0) {
      battle_logMessage(`<span style="color: #67ee67ff;">Your head clears. You can use your cards again.</span>`);
    }
  }
  battle_activePlayerBuffs = battle_activePlayerBuffs.filter(buff => {
    buff.duration--;
    if (buff.duration <= 0) {
      battle_logMessage(`Your ${buff.name} has worn off.`);

      // If the buff that wore off had a glow, remove it
      if (buff.glowColor) {
        document.getElementById('battle_playerImage').classList.remove('glow-' + buff.glowColor);
      }

      // Handle specific buff subtype effects wearing off
      if (buff.subType === 'damage_reduction') {
        battle_playerDamageReduction = 1; // Reset to no reduction
      }

      return false; // Remove the buff from the active list
    }
    return true; // Keep the buff
  });
  battle_activeOpponentBleeds = battle_activeOpponentBleeds.filter(bleed => {
    bleed.duration--;
    if (bleed.duration <= 0) {
      battle_logMessage(`The opponent's <span style="color: #c0392b;">bleeding</span> has stopped.`);
      return false; // Remove the bleed effect from the active list
    }
    return true; // Keep the bleed effect
  });
  // --- END OF NEW BLOCK ---

  // --- PLAYER DEBUFFS ---

  battle_activePlayerDebuffs = battle_activePlayerDebuffs.filter(debuff => {
    debuff.duration--;
    if (debuff.duration <= 0) {
      battle_logMessage(`The ${debuff.name} effect on you has worn off.`);
      return false;
    }
    return true;
  });

  // --- AFTER ---
  battle_activeOpponentDebuffs = battle_activeOpponentDebuffs.filter(debuff => {
    debuff.duration--;
    if (debuff.duration <= 0) {
      battle_logMessage(`${battle_opponentData.name}'s ${debuff.name} has worn off.`);
      if (debuff.statsToDebuff && Array.isArray(debuff.statsToDebuff)) {
        debuff.statsToDebuff.forEach(stat => {
          battle_opponentData.current_stats[stat] = battle_opponentData.stats[stat];
        });
      }
      return false;
    }
    return true;
  });

  battle_activeOpponentBuffs = battle_activeOpponentBuffs.filter(buff => {
    buff.duration--;
    if (buff.duration <= 0) {
      battle_logMessage(`${battle_opponentData.name}'s ${buff.name} has worn off.`);

      // If the buff that wore off had a glow, remove it
      if (buff.glowColor) {
        document.getElementById('battle_opponentImage').classList.remove('glow-' + buff.glowColor);
      }

      // Handle specific buff subtype effects wearing off
      if (buff.subType === 'damage_reduction') {
        battle_opponentDamageReduction = 1; // Reset to no reduction
      }

      return false; // Remove the buff from the active list
    }
    return true; // Keep the buff
  });
  // ADD THIS LOOP for sealed cards
  battle_playerCards.forEach(card => {
    if (card.sealedTurnsLeft && card.sealedTurnsLeft > 0) {
      card.sealedTurnsLeft--;
      if (card.sealedTurnsLeft === 0) {
        battle_logMessage(`The seal on your <b>${card.name}</b> has broken!`);
      }
    }
  });

}


function battle_endPlayerTurn() {
  document.getElementById('battle_cardContainer').style.display = 'none';
  battle_playerTurnCount++;
  battle_playerCards.forEach(card => { if (card.cooldownTurnsLeft > 0) card.cooldownTurnsLeft--; });

  battle_updateEffects();
  battle_updateHealthBars();

  if (battle_opponentHP <= 0) {
    battle_isOver = true; // Add this line
    // Find this block
    // Inside battle_endPlayerTurn() -> if (battle_opponentHP <= 0)
    battle_logMessage(`You defeated <b>${battle_opponentData.name}!</b>`); // Simplified log message

    // Check if the battle's win condition specifies a gold reward
    if (battle_winCondition.gold) {
      grantGold(battle_winCondition.gold);
    }
    document.querySelector('#battle-panel .buttons').style.display = 'none';
    const returnBtn = document.createElement("button");

    battle_sequence_player_state.hp = battle_playerHP;
    battle_sequence_player_state.cards = battle_playerCards;

    if (battle_currentOpponentIndex < battle_opponentSequence.length - 1) {
      returnBtn.textContent = "Next Opponent";
      returnBtn.onclick = () => {
        initiateBattle(battle_opponentSequence, battle_currentOpponentIndex + 1, battle_winCondition, battle_loseCondition, 'battle-panel');
      };
    } else {
      returnBtn.textContent = "Claim Victory";
      returnBtn.onclick = () => {
        resetBattleSequenceState();
        transitionPanels('battle-panel', 'game-panel');
        handleChoice(battle_winCondition);
      };
    }
    document.getElementById('battle_log').appendChild(returnBtn);

  } else {
    setTimeout(battle_opponentTurn, 1000);
  }
}

// REPLACE your entire battle_playerMove function with this corrected version

function battle_playerMove(type) {
  if (battle_isOver) return;
  if (battle_playerStunnedTurns > 0) {
    battle_logMessage(`<span style="color: #bf4c4cff">You are stunned and cannot move!</span>`);
    battle_playerStunnedTurns--;
    if (battle_playerStunnedTurns <= 0) {
      document.getElementById('player-stun-gif').classList.add('hidden');
    }
    battle_endPlayerTurn();
    return;
  }
  if (!battle_isPlayerTurn) return;
  battle_isPlayerTurn = false;

  // REPLACE the existing 'if (type === 'attack')' block in battle_playerMove with this:

  if (type === 'attack') {
    playSound('normalAttackSound');

    if (hasActiveSpeedBuff(battle_activeOpponentBuffs) && Math.random() < 0.5) {
      battle_logMessage(`<b>${battle_opponentData.name}</b>'s speed allowed them to <b>dodge</b> your attack!`);
    } else {
      const playerBattleStats = battle_getPlayerBattleStats();
      let totalDamage = battle_calculateNormalAttack(playerBattleStats, true, battle_playerBuff * battle_calculateActiveMultiplier(battle_activePlayerBuffs));
      // --- NEW, OVERHAULED RAGE LOGIC ---
      battle_checkAndApplyRage(); // Check if Rage activates this turn
      if (battle_playerRageActive) {
        const hpPercent = battle_playerHP / battle_maxPlayerHP;
        const missingHealthPercent = 1 - hpPercent;
        const rageBonus = Math.floor(totalDamage * missingHealthPercent * (playerBattleStats.str / 25));
        if (rageBonus > 0) {
          totalDamage += rageBonus;
          battle_logMessage(`<strong>Your in <b style="color:#ff4747;">Rage</b>, increasing your damage! (+${rageBonus})</strong>`);
        }
      }
      // --- END OF NEW LOGIC ---


      const actualDamageDealt = Math.floor(totalDamage * battle_opponentDamageReduction);
      battle_opponentHP -= actualDamageDealt;
      battle_logMessage(`You attacked and dealt ${actualDamageDealt} damage!`);
    }

    const oldStamina = battle_playerStamina;
    const staminaRecovery = battle_maxPlayerStamina * 0.05;
    battle_playerStamina = Math.min(battle_maxPlayerStamina, battle_playerStamina + staminaRecovery);
    battle_updateStaminaBar();
    if (battle_playerStamina > oldStamina) {
      battle_logMessage(`Your attack recovers <span style="color: #3498db">${Math.floor(staminaRecovery)}</span> stamina.`);
    }

    battle_triggerAnimation('battle_playerImage', 'attack-lunge-player');
    battle_triggerAnimation('battle_opponentImage', 'shake');
    battle_showAttackGif("./cha/punch.gif", "opponent");

  } else if (type === 'defence') {
    battle_playerDefence = true;
    battle_logMessage(`You brace yourself for the next attack!`);

    // --- CORRECTED STAMINA RECOVERY LOGIC ---
    const oldStamina = battle_playerStamina;
    const staminaRecovery = battle_maxPlayerStamina * 0.10; // 10% recovery
    battle_playerStamina = Math.min(battle_maxPlayerStamina, battle_playerStamina + staminaRecovery);
    battle_updateStaminaBar();
    if (battle_playerStamina > oldStamina) { // Only show message if stamina was actually recovered
      battle_logMessage(`Your defensive stance recovers <span style="color: #3498db">${Math.floor(staminaRecovery)}</span> stamina.`);
    }
  }
  battle_endPlayerTurn();
}

function battle_playCard(cardName) {
  if (battle_isOver) return; // Add this line
  // --- NEW: Check if cards are locked by Rage ---
  if (battle_playerCardLockTurns > 0) {
    battle_logMessage(`<span style="color: #ff4747;">Blinded by Rage! You cannot use cards right now.</span>`);
    return; // Stop the function immediately
  }
  if (battle_playerStunnedTurns > 0) {
    battle_logMessage(`<span style="color: #bf4c4cff">You are stunned and cannot move!</span>`);
    battle_playerStunnedTurns--; // Decrement FIRST
    if (battle_playerStunnedTurns <= 0) { // Then check
      document.getElementById('player-stun-gif').classList.add('hidden');
    }
    battle_endPlayerTurn();
    return;
  }
  if (!battle_isPlayerTurn) return;
  // ... rest of the function
  if (!battle_isPlayerTurn) return;
  battle_isPlayerTurn = false; // Immediately disable further actions
  const card = battle_playerCards.find(c => c.name === cardName);
  if (!card) {
    battle_isPlayerTurn = true; // Re-enable turn if card not found

    return;
  }
  // --- NEW: Check if the card is sealed ---
  if (card.sealedTurnsLeft && card.sealedTurnsLeft > 0) {
    battle_logMessage(`<span style="color:#8e44ad;">${card.name} is sealed and cannot be used!</span>`);
    battle_isPlayerTurn = true; // Give the turn back
    return;
  }
  // --- END OF NEW CHECK ---
  if (card.staminaCost && battle_playerStamina < card.staminaCost) {
    battle_logMessage(`<span style="color: #e7b946ff">Not enough stamina to use ${card.name}!</span>`);
    battle_isPlayerTurn = true; // Give the turn back
    return; // Stop the card from being used
  }
  if (card.usesLeft === 0) {
    battle_logMessage(`${cardName} is used up!`);
    battle_isPlayerTurn = true; // Re-enable turn if card not found
    return;
  }
  if (card.cooldownTurnsLeft > 0) {
    battle_logMessage(`${cardName} is on cooldown!`); battle_isPlayerTurn = true; // Re-enable turn if card not found
    return;
  }
  if (card.staminaCost) {
    battle_playerStamina -= card.staminaCost;
    battle_updateStaminaBar();
    battle_logMessage(`Used <b>${card.name}</b>, consuming <span style="color: #3498db">${card.staminaCost}</span> stamina.`);

  }

  // --- NEW LOGIC TO HANDLE SPECIFIC SOUNDS ---
  if (card.sound) {
    // If the card has its own sound file defined
    const specificSoundPlayer = document.getElementById('cardSpecificSound');
    specificSoundPlayer.src = card.sound; // Set the source to the card's sound
    specificSoundPlayer.play().catch(e => console.error("Error playing specific card sound:", e));
  } else {
    // --- FALLBACK to generic sounds if no specific sound is set ---
    if (card.type === 'attack') {
      playSound('attackCardSound');
    } else if (card.type === 'buff') {
      playSound('buffCardSound');
    } else if (card.type === 'debuff') {
      playSound('debuffCardSound');
    }
  }
  // --- END of new sound logic ---


  const playerBattleStats = battle_getPlayerBattleStats();

  if (card.type === 'attack') {
    // --- NEW: OPPONENT OVERTURN CHECK ---
    // --- START OF CORRECTIONS ---
    // Moved this calculation to the top so it's available for both normal attacks and Overturn
    const cardBaseDamage = Math.floor(Math.random() * (card.damage.max - card.damage.min + 1) + card.damage.min);

    const overturnCard = battle_opponentCards.find(c => c.type === 'overturn' && c.cooldownTurnsLeft === 0 && (c.usesLeft === -1 || c.usesLeft > 0));

    // Check if the opponent can and does use Overturn
    if (overturnCard && card.damage.min > overturnCard.triggerDamage && Math.random() < overturnCard.chance) {

      // --- OVERTURN SUCCEEDS ---
      battle_logMessage(`<b>${battle_opponentData.name}</b> uses <b style="color:#ff4747;">${overturnCard.name}</b>!`);

      // Calculate the potential damage the player would have dealt
      let potentialDamage = Math.floor(((playerBattleStats.tech * 1.5) + cardBaseDamage) * (battle_playerBuff * battle_calculateActiveMultiplier(battle_activePlayerBuffs)));

      // Add any Rage bonus to the potential damage before reflecting
      const hpPercent = battle_playerHP / battle_maxPlayerHP;
      if (battle_playerRageActive) { // Check if Rage is active
        const missingHealthPercent = 1 - hpPercent;
        const rageBonus = Math.floor(potentialDamage * missingHealthPercent * (playerBattleStats.str / 25));
        if (rageBonus > 0) potentialDamage += rageBonus;
      }

      const reflectedDamage = potentialDamage * 2;
      battle_playerHP -= reflectedDamage;

      // Log the clearer message you requested
      battle_logMessage(`Your attack is negated! You take <b style="color: #ffababff">${potentialDamage} x 2 = ${reflectedDamage}</b> reflected damage!`);

      // Put the opponent's Overturn card on cooldown
      overturnCard.cooldownTurnsLeft = overturnCard.cooldown;
      if (overturnCard.usesLeft > 0) overturnCard.usesLeft--;

    } else {
      // --- If Overturn fails or doesn't exist, proceed with the NORMAL ATTACK ---
      let totalDamage = Math.floor(((playerBattleStats.tech * 1.5) + cardBaseDamage) * (battle_playerBuff * battle_calculateActiveMultiplier(battle_activePlayerBuffs)));

      if (Math.random() < 0.25) {
        battle_logMessage("💥 CRITICAL HIT! 💥");
        totalDamage = Math.floor(totalDamage * 2.25);
      }

      if (hasActiveSpeedBuff(battle_activeOpponentBuffs) && Math.random() < 0.5) {
        totalDamage = Math.floor(totalDamage * 0.1);
        battle_logMessage(`<b>${battle_opponentData.name}</b>'s speed reduced the damage by <b>90%</b>!`);
      }

      // Apply Rage Logic
      battle_checkAndApplyRage();
      if (battle_playerRageActive) {
        const hpPercent = battle_playerHP / battle_maxPlayerHP;
        const missingHealthPercent = 1 - hpPercent;
        const rageBonus = Math.floor(totalDamage * missingHealthPercent * (playerBattleStats.str / 25));
        if (rageBonus > 0) {
          totalDamage += rageBonus;
          battle_logMessage(`Your <b style="color:#ff4747;">Rage</b> activates, increasing your damage! (+${rageBonus})`);
        }
      }

      const actualDamageDealt = Math.floor(totalDamage * battle_opponentDamageReduction);
      battle_opponentHP -= actualDamageDealt;
      battle_logMessage(`Dealt ${actualDamageDealt} damage with ${cardName}!`);
    }

    battle_triggerAnimation('battle_playerImage', 'attack-lunge-player');
    battle_triggerAnimation('battle_opponentImage', 'shake');
    // --- END OF CORRECTIONS ---
  }
  else if (card.type === 'buff') {
    playSound('buffCardSound');
    switch (card.subType) {

      case 'damage_reduction': { // <--- Added opening brace
        const buffData = {
          name: card.name,
          subType: card.subType,
          duration: card.buffDuration,
          reductionAmount: card.reductionAmount
        };

        if (card.glowEffect) {
          buffData.glowColor = card.glowEffect.color;
          setTimeout(() => {
            document.getElementById('battle_playerImage').classList.add('glow-' + card.glowEffect.color);
          }, 500);
        }

        battle_activePlayerBuffs.push(buffData);
        battle_playerDamageReduction = card.reductionAmount;
        battle_logMessage(`Used <b>${card.name}!</b> For <b>${card.buffDuration}</b> turns, you will take reduced damage.`);
        break;
      } // <--- Added closing brace

      case 'temp_stat': { // <--- Added opening brace
        const buffData = {
          name: card.name,
          subType: card.subType,
          statToBuff: card.statToBuff,
          buffValue: card.buffValue,
          duration: card.buffDuration
        };

        if (card.glowEffect) {
          buffData.glowColor = card.glowEffect.color;
          setTimeout(() => {
            document.getElementById('battle_playerImage').classList.add('glow-' + card.glowEffect.color);
          }, 500);
        }

        battle_activePlayerBuffs.push(buffData);
        battle_logMessage(`Used <b>${cardName}!</b> Your <b>${card.statToBuff.toUpperCase()}</b> is boosted for <b>${card.buffDuration}</b> turns.`);
        break;
      }

      case 'multiplier': {
        if (card.buffDuration) {
          // It's a duration-based buff, add it to the active list
          const buffData = {
            name: card.name,
            subType: card.subType,
            buffAmount: card.buffAmount,
            duration: card.buffDuration
          };
          if (card.glowEffect) {
            buffData.glowColor = card.glowEffect.color;
            setTimeout(() => {
              document.getElementById('battle_playerImage').classList.add('glow-' + card.glowEffect.color);
            }, 500);
          }
          battle_activePlayerBuffs.push(buffData);
          battle_logMessage(`Used <b>${cardName}!</b> Damage is multiplied by <span style="color: #ff9900ff"><b>x${card.buffAmount}</b></span> for <b>${card.buffDuration}</b> turns.`);
        } else {
          // It's a one-time buff, apply it to the temporary variable
          battle_playerBuff *= card.buffAmount;
          battle_logMessage(`<b>${cardName}</b> used! Damage multiplier is now x<b>${battle_playerBuff.toFixed(2)}</b>`);
        }
        break;
      }
      case 'heal':
        const healAmount = Math.floor(battle_maxPlayerHP * card.healPercent);
        battle_playerHP = Math.min(battle_maxPlayerHP, battle_playerHP + healAmount);
        battle_logMessage(`You used <b>${cardName}</b> and <span style="color: #67ee67ff">Healed</span> for <b>${healAmount} HP!</b>`);
        break;
      // PASTE THIS ENTIRE NEW 'case' BLOCK HERE
      // This new code goes inside the switch statement in the battle_playCard function

      case 'copy_attack': {
        battle_logMessage(`You use <b>${card.name}</b>, studying your opponent's moves...`);

        const opponentAttackCards = battle_opponentCards.filter(c => c.type === 'attack');

        if (opponentAttackCards.length === 0) {
          battle_logMessage("Opponent has no attack techniques to copy!");
          battle_isPlayerTurn = true; // Give the turn back
          return;
        }

        const cardToCopy = opponentAttackCards[Math.floor(Math.random() * opponentAttackCards.length)];
        const mimicCardIndex = battle_playerCards.findIndex(c => c.name === card.name);

        if (mimicCardIndex !== -1) {
          // --- START OF MODIFICATIONS ---

          // 1. Create the new, copied card object
          const copiedCard = {
            ...cardToCopy, // Copy all original properties
            name: `${cardToCopy.name} (Copied)`,
            isCopied: true,
            cooldownTurnsLeft: 0,
            gif_target: 'opponent' // ALWAYS set the GIF target to the opponent
          };

          // 2. Check if the card has damage and add the bonus
          if (cardToCopy.damage && typeof cardToCopy.damage.min !== 'undefined') {
            copiedCard.damage = {
              min: cardToCopy.damage.min + 30, // Add 30 to min damage
              max: cardToCopy.damage.max + 50  // Add 50 to max damage
            };
            // 3. Update the description to show it's buffed
            copiedCard.desc = `(Copied) ${cardToCopy.desc}<br><b style="color:#67ee67ff;">Damage increased!</b>`;
          }

          // --- END OF MODIFICATIONS ---

          // Replace the original card in your hand with the new one
          battle_playerCards[mimicCardIndex] = copiedCard;

          // Update the log message
          battle_logMessage(`You copied <b>${cardToCopy.name}</b> and infused it with your own power!`);

          // Immediately update the card display
          if (document.getElementById('battle_cardContainer').style.display === 'block') {
            battle_updateCardButtons();
          }
        }
        break;
      }
      // This is the closing brace of the switch statement
    }
  }
  else if (card.type === 'debuff') {
    playSound('debuffCardSound');
    switch (card.subType) {


      // Part 1: Play the initial attack GIF once
      case 'stun':
        // REPLACE the old stun logic here...
        battle_applyStunToOpponent(card.stunTurns, card); // ...with this one line.
        break;
      // --- AFTER ---
      case 'stat_reduction':
        if (card.statsToDebuff && Array.isArray(card.statsToDebuff)) {
          // New logic for multiple stats
          let affectedStats = [];
          card.statsToDebuff.forEach(stat => {
            battle_opponentData.current_stats[stat] = Math.floor(battle_opponentData.stats[stat] * card.debuffValue);
            affectedStats.push(stat.toUpperCase());
          });
          // For tracking the effect duration, we can push one debuff object that lists all affected stats
          battle_activeOpponentDebuffs.push({
            name: card.name,
            subType: card.subType,
            statsToDebuff: card.statsToDebuff, // Store the array of stats
            duration: card.debuffDuration
          });
          battle_logMessage(`Used <b>${cardName}!</b> Opponent's <b>${affectedStats.join(' & ')}</b> are reduced for ${card.debuffDuration} turns.`);

        } else if (card.statToDebuff) {
          // Original logic for single stat (backward compatibility)
          battle_opponentData.current_stats[card.statToDebuff] = Math.floor(battle_opponentData.stats[card.statToDebuff] * card.debuffValue);
          battle_activeOpponentDebuffs.push({ name: card.name, subType: card.subType, statsToDebuff: [card.statToDebuff], duration: card.debuffDuration });
          battle_logMessage(`Used <b>${cardName}!</b> Opponent's <b>${card.statToDebuff.toUpperCase()}</b> is reduced for ${card.debuffDuration} turns.`);
        }
        break;

    }
  }
  // --- ADD THIS NEW BLOCK OF CODE ---
  // Check for and apply a secondary effect
  if (card.secondaryEffect) {
    battle_logMessage(`The <b>${card.name}</b> has an additional effect!`);
    const effect = card.secondaryEffect;

    switch (effect.type) {
      case 'bleed': { // <-- ADD THIS NEW CASE
        const bleedDuration = Math.floor(Math.random() * 6) + 2; // Random duration between 2 and 7
        const bleedDamagePercent = Math.random() * (0.005 - 0.001) + 0.001; // Random damage between 0.1% and 0.5%

        battle_activeOpponentBleeds.push({
          name: `${card.name} Effect`,
          duration: bleedDuration,
          damagePercent: bleedDamagePercent
        });

        battle_logMessage(`The opponent is <span style="color: #c0392b;">bleeding</span> for ${bleedDuration} turns!`);
        break;
      }
      case 'debuff':
        if (effect.subType === 'stat_reduction') {
          // NEW LOGIC to handle single OR multiple stat debuffs
          if (effect.statsToDebuff && Array.isArray(effect.statsToDebuff)) {
            // Logic for multiple stats
            let affectedStats = [];
            effect.statsToDebuff.forEach(stat => {
              if (battle_opponentData.current_stats[stat] !== undefined) {
                battle_opponentData.current_stats[stat] = Math.floor(battle_opponentData.stats[stat] * effect.debuffValue);
                affectedStats.push(stat.toUpperCase());
              }
            });
            battle_activeOpponentDebuffs.push({
              name: `${card.name} Effect`,
              subType: effect.subType,
              statsToDebuff: effect.statsToDebuff,
              duration: effect.debuffDuration
            });
            battle_logMessage(`Opponent's <b>${affectedStats.join(' & ')}</b> are reduced for <b>${effect.debuffDuration}</b> turns.`);
          } else if (effect.statToDebuff) {
            // Fallback for older, single-stat debuffs
            battle_opponentData.current_stats[effect.statToDebuff] = Math.floor(battle_opponentData.stats[effect.statToDebuff] * effect.debuffValue);
            battle_activeOpponentDebuffs.push({
              name: `${card.name} Effect`,
              subType: effect.subType,
              statsToDebuff: [effect.statToDebuff],
              duration: effect.debuffDuration
            });
            battle_logMessage(`Opponent's <b>${effect.statToDebuff.toUpperCase()}</b> is reduced for <b>${effect.debuffDuration}</b> turns.`);
          }
        } else if (effect.subType === 'stun') {
          if (Math.random() < 0.7) { // This creates a 70% chance of success
            battle_opponentStunnedTurns += effect.stunTurns;
            battle_logMessage(`Opponent is <span style="color: #e5bc29ff"><b>Stunned</b></span> for <b>${effect.stunTurns}</b> turn(s)!`);
          } else {
            battle_logMessage(`The stun effect missed!`);
          }
        }
        break;

      case 'buff':
        if (effect.subType === 'heal') {
          const healAmount = Math.floor(battle_maxPlayerHP * effect.healPercent);
          battle_playerHP = Math.min(battle_maxPlayerHP, battle_playerHP + healAmount);
          battle_logMessage(`You <span style="color: #67ee67ff">Healed</span> for <b>${healAmount} HP!</b>`);
        }
        break;
      // ADD THIS ENTIRE NEW 'case' BLOCK
      case 'one_shot': {
        const playerBattleStats = battle_getPlayerBattleStats();
        const baseChance = effect.chance; // This is 0.05 from your card data
        const bonusChance = playerBattleStats.biq * 0.002; // Example: 0.2% bonus per BIQ point
        const finalChance = baseChance + bonusChance;

        battle_logMessage(`Forbidden technique... (Chance: ${(finalChance * 100).toFixed(1)}%)`);

        if (Math.random() < finalChance) {
          // SUCCESSFUL ONE-SHOT
          battle_isOver = true; // Mark the battle as over to stop the opponent's next turn

          setTimeout(() => { battle_logMessage(`<span style="color: #ff4747;">koff...</span>`); }, 1000);
          setTimeout(() => { battle_logMessage(`<span style="color: #ff4747;">Koff... koff...</span>`); }, 2000);
          setTimeout(() => { battle_logMessage(`<span style="color: #ff4747; font-weight: bold;">ARGHHHHH!</span>`); }, 3000);

          setTimeout(() => {
            battle_logMessage(`<span style="color: #ff4747; font-weight: bold;">Opponent can't breathe... their heart has stopped working.</span>`);

            // Change the opponent's image to the "dead" version
            if (effect.dead_image_src) {
              const opponentImageEl = document.getElementById('battle_opponentImage');
              opponentImageEl.src = effect.dead_image_src;
              opponentImageEl.classList.remove('damaged', 'critical');
            }

            // --- NEW TIMING LOGIC ---
            // Show the KO GIF (but don't hide it automatically)
            if (effect.ko_gif) {
              const middleGifContainer = document.getElementById("middle-gif-container");
              const middleGif = document.getElementById("middle-attack-gif");

              middleGif.style.width = '450px'; // Make GIF larger
              middleGif.src = effect.ko_gif; // Load the GIF normally
              middleGifContainer.style.display = 'block';
            }

            // Wait for the GIF to play (e.g., 1.5s) PLUS the 3s pause
            setTimeout(() => {
              battle_opponentHP = 0;
              battle_updateHealthBars();
              endBattleAfterSpecialSequence();
              document.getElementById("middle-attack-gif").style.width = '150px'; // Reset GIF size for next time
              // We don't hide the GIF here, it will be cleaned up automatically when you transition panels.
            }, 4500); // 1.5s for the GIF animation + 3s pause

          }, 5000); // This is the delay for the initial text

          // IMPORTANT: We stop the rest of the function to let the animation play out
          return;

        } else {
          // FAILED ONE-SHOT
          battle_logMessage("The forbidden technique fails to find a vital point...");
        }
        break;
      }


      // You could add more secondary effect types here, like 'attack' or 'buff'
    }
  }

  if (card.gif) { battle_showAttackGif(card.gif, card.gif_target || 'middle'); }
  if (card.usesLeft > 0) card.usesLeft--;
  card.cooldownTurnsLeft = card.cooldown;
  battle_endPlayerTurn();
}


function battle_toggleCardContainer(type) {
  if (!battle_isPlayerTurn) return;
  const cardContainer = document.getElementById("battle_cardContainer");
  if (cardContainer.style.display === 'block' && battle_currentCardType === type) {
    cardContainer.style.display = 'none';
    return;
  }
  battle_currentCardType = type;
  battle_updateCardButtons();
  cardContainer.style.display = 'block';
}

function battle_updateCardButtons() {
  const cardContainer = document.getElementById("battle_cardContainer");
  cardContainer.innerHTML = "";
  const relevantCards = battle_playerCards.filter(card => card.type === battle_currentCardType.replace('-card', ''));

  relevantCards.forEach((card) => {
    const btn = document.createElement("button");
    let buttonText = card.name;
    let isDisabled = false;
    // --- NEW SEALED LOGIC ---
    if (card.sealedTurnsLeft && card.sealedTurnsLeft > 0) {
      isDisabled = true;
      buttonText += ` (Sealed: ${card.sealedTurnsLeft})`;
    }
    // --- END NEW LOGIC ---
    if (card.usesLeft !== -1) {
      buttonText += ` (${card.usesLeft} left)`;
      if (card.usesLeft <= 0) { isDisabled = true; buttonText += " - Used Up"; }
    }
    if (card.cooldownTurnsLeft > 0) { isDisabled = true; buttonText += ` (CD: ${card.cooldownTurnsLeft})`; }
    btn.textContent = buttonText;
    btn.disabled = isDisabled;
    btn.onclick = () => battle_playCard(card.name);
    cardContainer.appendChild(btn);
  });
}

// REPLACE your entire existing battle_opponentTurn function with this one

function battle_opponentTurn() {
  if (battle_isOver) return;

  if (battle_activeOpponentBleeds.length > 0) {
    battle_activeOpponentBleeds.forEach(bleed => {
      const bleedDamage = Math.floor(battle_maxOpponentHP * bleed.damagePercent);
      battle_opponentHP -= bleedDamage;
      battle_logMessage(`Opponent takes ${bleedDamage} damage from <span style="color: #c0392b;">bleeding</span>.`);
    });
    battle_updateHealthBars();
  }

  battle_opponentCards.forEach(card => { if (card.cooldownTurnsLeft > 0) card.cooldownTurnsLeft--; });

  if (battle_opponentStunnedTurns > 0) {
    let resisted = false;
    if (battle_stunResistAttempts > 0 && battle_opponentData.stunResistanceChance) {
      const playerBattleStats = battle_getPlayerBattleStats();
      const initialResistChance = battle_opponentData.stunResistanceChance - (playerBattleStats.biq * 0.015);
      const diminishingPenalty = (battle_stunResistAttempts - 1) * 0.10;
      const finalResistChance = Math.max(0, initialResistChance - diminishingPenalty);

      if (finalResistChance <= 0 && !battle_stunWillBrokenMessageShown) {
        battle_logMessage(`<span style="font-weight: bold; color: #e7b946ff;">${battle_opponentData.name}'s will is broken... they can't resist!</span>`);
        battle_stunWillBrokenMessageShown = true;
      } else if (finalResistChance > 0) {
        battle_logMessage(`Opponent attempts to break free... (Resist Chance: ${(finalResistChance * 100).toFixed(1)}%)`);
        if (Math.random() < finalResistChance) {
          battle_logMessage(`<span style="font-weight: bold; color: #f1c40f;">${battle_opponentData.name} broke free from the stun!</span>`);
          battle_opponentStunnedTurns = 0;
          document.getElementById('opponent-stun-gif').classList.add('hidden');
          resisted = true;
        }
      }
    }

    if (!resisted) {
      battle_logMessage(`${battle_opponentData.name} <span style="color: #f96e6eff">is stunned and cannot move!</span>`);
      battle_opponentStunnedTurns--;
      battle_stunResistAttempts++;
      if (battle_opponentStunnedTurns <= 0) {
        document.getElementById('opponent-stun-gif').classList.add('hidden');
      }
      battle_isPlayerTurn = true;
      if (document.getElementById('battle_cardContainer').style.display === 'block') {
        battle_updateCardButtons();
      }
      return;
    }
  }

  // --- START OF NEW SEAL CARD LOGIC ---
  const opponentHealthPercent = battle_opponentHP / battle_maxOpponentHP;
  const sealCard = battle_opponentCards.find(c => c.subType === 'seal' && c.cooldownTurnsLeft === 0 && (c.usesLeft === -1 || c.usesLeft > 0));

  // Check if opponent is below 50% HP, has a seal card ready, and hits the 85% chance
  if (sealCard && opponentHealthPercent <= 0.5 && Math.random() < 0.85) {
    battle_logMessage(`<b>${battle_opponentData.name}</b> prepares a special technique!`);

    const sealablePlayerCards = battle_playerCards.filter(card => card.isSealable && (!card.sealedTurnsLeft || card.sealedTurnsLeft === 0));

    if (sealablePlayerCards.length > 0) {
      sealCard.cooldownTurnsLeft = sealCard.cooldown;
      if (sealCard.usesLeft > 0) sealCard.usesLeft--;

      sealablePlayerCards.sort(() => 0.5 - Math.random());
      const cardsToSeal = sealablePlayerCards.slice(0, 2);

      cardsToSeal.forEach(card => {
        card.sealedTurnsLeft = sealCard.sealDuration;
      });

      const sealedCardNames = cardsToSeal.map(card => `<b>${card.name}</b>`).join(' and ');
      battle_logMessage(`${sealedCardNames} has been <b style="color:#8e44ad;">sealed</b> for ${sealCard.sealDuration} turns!`);

    } else {
      battle_logMessage(`But you have no powerful cards to seal!`);
    }

  } else {
    // --- If seal is not used, proceed with the NORMAL opponent turn logic ---
    const canUseCard = battle_opponentHP <= battle_maxOpponentHP * 0.3;
    const usableCards = battle_opponentCards.filter(card => card.cooldownTurnsLeft === 0 && (card.usesLeft === -1 || card.usesLeft > 0) && card.subType !== 'seal');

    if (canUseCard && usableCards.length > 0 && Math.random() > 0.4) {
      const cardToUse = usableCards[Math.floor(Math.random() * usableCards.length)];
      cardToUse.cooldownTurnsLeft = cardToUse.cooldown;
      if (cardToUse.usesLeft > 0) cardToUse.usesLeft--;

      if (cardToUse.type === 'attack') {
        const cardBaseDamage = Math.floor(Math.random() * (cardToUse.damage.max - cardToUse.damage.min + 1) + cardToUse.damage.min);
        const playerBattleStats = battle_getPlayerBattleStats();
        const damageRaw = (battle_opponentData.current_stats.str + battle_opponentData.current_stats.spd + battle_opponentData.current_stats.biq + battle_opponentData.current_stats.tech + cardBaseDamage) * (battle_opponentBuff * battle_calculateActiveMultiplier(battle_activeOpponentBuffs));
        const damageReduction = playerBattleStats.dur / 2;
        const damageAfterDur = Math.max(0, damageRaw - damageReduction);
        let finalDamage = battle_playerDefence ? Math.floor(damageAfterDur / 2) : Math.floor(damageAfterDur * battle_playerDamageReduction);
        if (hasActiveSpeedBuff(battle_activePlayerBuffs) && Math.random() < 0.5) {
          finalDamage = Math.floor(finalDamage * 0.1);
          battle_logMessage(`<b>Your speed allowed you to partially evade, reducing damage by 90%</b>!`);
        }
        battle_playerHP -= finalDamage;
        battle_logMessage(`<span style="color: #bf4c4cff">ENRAGED</span> <b>${battle_opponentData.name}</b> uses ${cardToUse.name} for  <span style="color: #ffababff">${finalDamage} damage!`);
        if (cardToUse.gif) { battle_showAttackGif(cardToUse.gif, cardToUse.gif_target || 'middle'); }
      } else if (cardToUse.type === 'buff') {
        battle_logMessage(`${battle_opponentData.name} uses ${cardToUse.name}!`);
        switch (cardToUse.subType) {
          case 'temp_stat':
            battle_activeOpponentBuffs.push({ name: cardToUse.name, subType: cardToUse.subType, statToBuff: cardToUse.statToBuff, buffValue: cardToUse.buffValue, duration: cardToUse.buffDuration });
            battle_logMessage(`<b>${battle_opponentData.name}'s ${cardToUse.statToBuff.toUpperCase()}</b> is boosted for ${cardToUse.buffDuration} turns.`);
            break;
          case 'damage_reduction':
            const buffDataDR = { name: cardToUse.name, subType: cardToUse.subType, duration: cardToUse.buffDuration, reductionAmount: cardToUse.reductionAmount };
            if (cardToUse.glowEffect) {
              buffDataDR.glowColor = cardToUse.glowEffect.color;
              setTimeout(() => { document.getElementById('battle_opponentImage').classList.add('glow-' + cardToUse.glowEffect.color); }, 500);
            }
            battle_activeOpponentBuffs.push(buffDataDR);
            battle_opponentDamageReduction = cardToUse.reductionAmount;
            battle_logMessage(`<b>${battle_opponentData.name}</b> uses <b>${cardToUse.name}!</b> For <b>${cardToUse.buffDuration}</b> turns, they will take reduced damage.`);
            break;
          case 'heal':
            const healAmount = Math.floor(battle_maxOpponentHP * cardToUse.healPercent);
            battle_opponentHP = Math.min(battle_maxOpponentHP, battle_opponentHP + healAmount);
            battle_logMessage(`<b>${battle_opponentData.name}</b> uses <b>${cardToUse.name}</b> and <span style="color: #67ee67ff">Healed</span> for <b>${healAmount} HP!</b>`);
            break;
          case 'multiplier':
            if (cardToUse.buffDuration) {
              const buffDataM = { name: cardToUse.name, subType: cardToUse.subType, buffAmount: cardToUse.buffAmount, duration: cardToUse.buffDuration };
              battle_activeOpponentBuffs.push(buffDataM);
              battle_logMessage(`${battle_opponentData.name} uses <b>${cardToUse.name}</b>! Their damage is multiplied by <span style="color: #ff9900ff"><b>x${cardToUse.buffAmount}</b></span> for ${cardToUse.buffDuration} turns.`);
            } else {
              battle_opponentBuff = cardToUse.buffAmount;
              battle_logMessage(`<b>${battle_opponentData.name}</b> uses <b>${cardToUse.name}</b> and is powered up by <span style="color: #ff9900ff"><b>x${cardToUse.buffAmount}</b></span>!`);
            }
            break;
        }
      } else if (cardToUse.type === 'debuff') {
        switch (cardToUse.subType) {
          case 'stat_reduction':
            if (cardToUse.statsToDebuff && Array.isArray(cardToUse.statsToDebuff)) {
              battle_activePlayerDebuffs.push({ name: cardToUse.name, subType: cardToUse.subType, statToDebuff: cardToUse.statsToDebuff, debuffValue: cardToUse.debuffValue, duration: cardToUse.debuffDuration });
              battle_logMessage(`<b>${battle_opponentData.name}</b> uses <b>${cardToUse.name}!</b> Your stats are reduced!`);
            } else {
              battle_activePlayerDebuffs.push({ name: cardToUse.name, subType: cardToUse.subType, statToDebuff: cardToUse.statToDebuff, debuffValue: cardToUse.debuffValue, duration: cardToUse.debuffDuration });
              battle_logMessage(`<b>${battle_opponentData.name}</b> uses <b>${cardToUse.name}!</b> Your <span style="color: #00b7ffff">${cardToUse.statToDebuff.toUpperCase()}</span> is reduced!`);
            }
            break;
          case 'stun':
            if (cardToUse.gif) { battle_showAttackGif(cardToUse.gif, cardToUse.gif_target || 'middle'); }
            battle_playerStunnedTurns += cardToUse.stunTurns;
            battle_logMessage(`<b>${battle_opponentData.name}</b> uses <b>${cardToUse.name}!</b> You are <span style="color: #bf4c4cff">stunned</span> for ${cardToUse.stunTurns} turn(s).`);
            if (cardToUse.stunEffectGif) {
              const stunGif = document.getElementById('player-stun-gif');
              stunGif.src = cardToUse.stunEffectGif;
              stunGif.classList.remove('hidden');
            }
            break;
        }
      }
    } else {
      const playerBattleStats = battle_getPlayerBattleStats();
      if (hasActiveSpeedBuff(battle_activePlayerBuffs) && Math.random() < 0.5) {
        battle_logMessage(`Your superior speed allowed you to completely <b>dodge</b> the attack!`);
      } else {
        const damageRaw = battle_calculateNormalAttack(battle_opponentData.current_stats, false) * (battle_opponentBuff * battle_calculateActiveMultiplier(battle_activeOpponentBuffs));
        const damageReduction = playerBattleStats.dur / 2;
        const damageAfterDur = Math.max(0, damageRaw - damageReduction);
        let finalDamage = battle_playerDefence ? Math.floor(damageAfterDur / 2) : Math.floor(damageAfterDur * battle_playerDamageReduction);
        if (battle_playerDefence) { battle_logMessage(`<b>You defended, halving the damage!</b>`); }
        battle_playerHP -= finalDamage;
        battle_logMessage(`<b>${battle_opponentData.name}</b> attacked and dealt <span style="color: #ff4747">${finalDamage}</span> damage!`);
      }
    }
  }

  battle_triggerAnimation('battle_opponentImage', 'attack-lunge-opponent');
  battle_triggerAnimation('battle_playerImage', 'shake');
  battle_opponentBuff = 1;
  battle_playerDefence = false;
  battle_updateHealthBars();
  if (battle_playerHP <= 0) {
    battle_isOver = true;
    battle_logMessage("You lost!");
    document.querySelector('#battle-panel .buttons').style.display = 'none';
    const returnBtn = document.createElement("button");
    resetBattleSequenceState();
    if (battle_loseCondition) {
      returnBtn.textContent = "Continue";
      returnBtn.onclick = () => {
        transitionPanels('battle-panel', 'game-panel');
        handleChoice(battle_loseCondition);
      };
    } else {
      returnBtn.textContent = "Return to Menu";
      returnBtn.onclick = () => { handleGameLoss() };
    }
    document.getElementById('battle_log').appendChild(returnBtn);
  } else {
    battle_isPlayerTurn = true;
    if (document.getElementById('battle_cardContainer').style.display === 'block') {
      battle_updateCardButtons();
    }
  }
}

function handleGameLoss() {
  resetBattleSequenceState();
  transitionPanels('battle-panel', 'intro-panel');
}

function checkOrientation() {
  const prompt = document.getElementById('orientation-prompt');
  const game = document.querySelector('#battle-panel .game-screen');
  if (!prompt || !game) return;
  if (window.innerHeight > window.innerWidth) {
    prompt.style.display = 'flex';
    game.style.visibility = 'hidden';
  } else {
    prompt.style.display = 'none';
    game.style.visibility = 'visible';
  }
}



// ===============================================================
// RACE MINIGAME LOGIC
// ===============================================================
const raceGame = {
  canvas: null, ctx: null, player: {}, drops: [], traffic: [], score: 0, bar: 0, maxBar: 100,
  gameOver: false, missionComplete: false, animationId: null, dropImg: new Image(), playerImg: new Image(),
  trafficImgs: [], intervals: [], winCallback: null, loseCallback: null, boundKeyDown: null,
  boundTouchStart: null, boundTouchEnd: null,

  init(winCallback, loseCallback) {
    this.winCallback = winCallback; this.loseCallback = loseCallback;
    this.canvas = document.getElementById("raceCanvas"); this.ctx = this.canvas.getContext("2d");

    // --- START OF NEW RESPONSIVE LOGIC ---
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Check if the screen is wider than it is tall (landscape)
    const isLandscape = this.canvas.width > this.canvas.height;

    if (isLandscape) {
      // In landscape, the road should take up a smaller percentage of the width
      this.roadWidth = this.canvas.width * 0.4;
    } else {
      // In portrait, it can take up more width
      this.roadWidth = this.canvas.width * 0.75;
    }
    // --- END OF NEW RESPONSIVE LOGIC ---

    this.laneCount = 3;
    this.laneWidth = this.roadWidth / this.laneCount;
    this.carWidth = this.laneWidth * 0.7;
    this.carHeight = this.laneWidth * 1.2;
    this.player = { x: this.getLaneCenter(1) - this.carWidth / 2, y: this.canvas.height - this.carHeight - 20, speed: 5 };
    this.drops = []; this.traffic = []; this.score = 0; this.bar = 0; this.gameOver = false; this.missionComplete = false;
    this.dropImg.src = 'cha/gold-2-removebg-preview.png'; this.playerImg.src = 'cha/player-race.png';
    this.trafficImgs = ['cha/bike-thug.png', 'cha/bike-thug2.png', 'cha/police.png'].map(src => { const img = new Image(); img.src = src; return img; });
    this.cleanup(); this.addEventListeners();
    this.intervals.push(setInterval(() => this.spawnDrop(), 1000)); this.intervals.push(setInterval(() => this.spawnTraffic(), 1500));
    if (!CanvasRenderingContext2D.prototype.roundRect) { CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) { if (!Array.isArray(radii)) radii = [radii]; let r = radii.map(val => Math.min(val, w / 2, h / 2)); r.length < 2 && (r[1] = r[0]); r.length < 3 && (r[2] = r[0]); r.length < 4 && (r[3] = r[1]); this.moveTo(x + r[0], y); this.arcTo(x + w, y, x + w, y + h, r[1]); this.arcTo(x + w, y + h, x, y + h, r[2]); this.arcTo(x, y + h, x, y, r[3]); this.arcTo(x, y, x + w, y, r[0]); this.closePath(); }; }
    this.loop();
  },
  cleanup() { if (this.animationId) cancelAnimationFrame(this.animationId); this.intervals.forEach(clearInterval); this.intervals = []; this.removeEventListeners(); },
  addEventListeners() { this.boundKeyDown = this.handleKeyDown.bind(this); this.boundTouchStart = this.handleTouchStart.bind(this); this.boundTouchEnd = this.handleTouchEnd.bind(this); document.addEventListener("keydown", this.boundKeyDown); this.canvas.addEventListener("touchstart", this.boundTouchStart); this.canvas.addEventListener("touchend", this.boundTouchEnd); },
  removeEventListeners() { document.removeEventListener("keydown", this.boundKeyDown); if (this.canvas) { this.canvas.removeEventListener("touchstart", this.boundTouchStart); this.canvas.removeEventListener("touchend", this.boundTouchEnd); } },
  getLaneCenter(laneIndex) { return (this.canvas.width - this.roadWidth) / 2 + this.laneWidth * laneIndex + this.laneWidth / 2; },
  spawnDrop() { if (!this.gameOver && !this.missionComplete) { const lane = Math.floor(Math.random() * this.laneCount); this.drops.push({ x: this.getLaneCenter(lane) - 10, y: -20, w: 20, h: 20 }); } },
  spawnTraffic() { if (!this.gameOver && !this.missionComplete) { const lane = Math.floor(Math.random() * this.laneCount); const imgIndex = Math.floor(Math.random() * this.trafficImgs.length); this.traffic.push({ x: this.getLaneCenter(lane) - this.carWidth / 2, y: -this.carHeight, img: this.trafficImgs[imgIndex] }); } },
  drawPlayer() { this.ctx.drawImage(this.playerImg, this.player.x, this.player.y, this.carWidth, this.carHeight); },
  drawDrops() { this.drops.forEach((d, i) => { d.y += 3; this.ctx.drawImage(this.dropImg, d.x, d.y, d.w, d.h); if (d.y + d.h > this.player.y && d.y < this.player.y + this.carHeight && d.x < this.player.x + this.carWidth && d.x + d.w > this.player.x) { playSound('collectDropSound'); this.drops.splice(i, 1); this.score += 10; if (!this.missionComplete) this.bar = Math.min(this.bar + 4, this.maxBar); if (this.bar >= this.maxBar && !this.missionComplete) { this.missionComplete = true; setTimeout(() => { this.cleanup(); this.drawMissionCompleteScreen(); }, 500); } } }); this.drops = this.drops.filter(d => d.y < this.canvas.height); },
  drawTraffic() { this.traffic.forEach((c) => { c.y += 4; this.ctx.drawImage(c.img, c.x, c.y, this.carWidth, this.carHeight); if (!this.missionComplete && !this.gameOver && c.y + this.carHeight > this.player.y && c.y < this.player.y + this.carHeight && c.x < this.player.x + this.carWidth && c.x + this.carWidth > this.player.x) { this.endGame(); } }); this.traffic = this.traffic.filter(c => c.y < this.canvas.height); },
  drawScoreAndBar() { this.ctx.fillStyle = "lime"; this.ctx.font = "bold 18px Arial"; this.ctx.fillText("Score: " + this.score, 10, 60); const barHeight = 22, barX = 10, barY = 15, barWidth = this.canvas.width - 20; this.ctx.fillStyle = "#333"; this.ctx.beginPath(); this.ctx.roundRect(barX, barY, barWidth, barHeight, [11]); this.ctx.fill(); const progressWidth = (this.bar / this.maxBar) * barWidth; if (progressWidth > 0) { const gradient = this.ctx.createLinearGradient(barX, barY, barX + progressWidth, barY); gradient.addColorStop(0, 'cyan'); gradient.addColorStop(1, '#00bfff'); this.ctx.fillStyle = gradient; this.ctx.beginPath(); this.ctx.roundRect(barX, barY, progressWidth, barHeight, [11]); this.ctx.fill(); } const percentage = Math.floor((this.bar / this.maxBar) * 100); this.ctx.fillStyle = "black"; this.ctx.font = "bold 14px Arial"; this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle"; this.ctx.fillText(percentage + "%", barX + barWidth / 2, barY + barHeight / 2); this.ctx.textAlign = "left"; this.ctx.textBaseline = "alphabetic"; },
  drawRoad() { const offsetX = (this.canvas.width - this.roadWidth) / 2; this.ctx.fillStyle = "#34495e"; this.ctx.fillRect(offsetX, 0, this.roadWidth, this.canvas.height); this.ctx.strokeStyle = "white"; this.ctx.lineWidth = 2; for (let i = 1; i < this.laneCount; i++) { let x = offsetX + this.laneWidth * i; this.ctx.setLineDash([20, 15]); this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke(); } },
  endGame() { if (this.gameOver) return; this.gameOver = true; playSound('raceCrashSound'); this.cleanup(); this.ctx.fillStyle = "rgba(0,0,0,0.8)"; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); this.ctx.fillStyle = "white"; this.ctx.font = "30px Arial"; this.ctx.textAlign = "center"; this.ctx.fillText("Game Over!", this.canvas.width / 2, this.canvas.height / 2 - 40); this.ctx.fillText("Score: " + this.score, this.canvas.width / 2, this.canvas.height / 2); const racePanel = document.getElementById('race-panel'); let restartBtn = racePanel.querySelector('button'); if (!restartBtn) { restartBtn = document.createElement('button'); restartBtn.textContent = 'Restart'; restartBtn.style.position = 'absolute'; restartBtn.style.top = '60%'; restartBtn.style.left = '50%'; restartBtn.style.transform = 'translateX(-50%)'; restartBtn.style.padding = '15px 30px'; restartBtn.onclick = () => { restartBtn.remove(); this.loseCallback(); }; racePanel.appendChild(restartBtn); } this.ctx.textAlign = "left"; },
  drawMissionCompleteScreen() {
    playSound('raceWinSound');
    this.ctx.fillStyle = "rgba(0,0,0,0.8)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#00ffcc";
    this.ctx.font = "40px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("MISSION COMPLETE!", this.canvas.width / 2, this.canvas.height / 2);
    const racePanel = document.getElementById('race-panel');
    let completeBtn = racePanel.querySelector('button');
    if (!completeBtn) {
      completeBtn = document.createElement('button');
      completeBtn.textContent = 'Continue';
      completeBtn.style.position = 'absolute';
      completeBtn.style.top = '60%';
      completeBtn.style.left = '50%';
      completeBtn.style.transform = 'translateX(-50%)';
      completeBtn.style.padding = '15px 30px';
      completeBtn.onclick = () => { completeBtn.remove(); this.winCallback(); };
      racePanel.appendChild(completeBtn);
    }
    this.ctx.textAlign = "left";
  },
  loop() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.drawRoad(); this.drawDrops(); this.drawTraffic(); if (!this.missionComplete) this.drawPlayer(); this.drawScoreAndBar(); if (!this.gameOver && !this.missionComplete) { this.animationId = requestAnimationFrame(() => this.loop()); } },
  handleKeyDown(e) { if (e.key === "ArrowLeft" && this.player.x > (this.canvas.width - this.roadWidth) / 2) { this.player.x -= this.laneWidth; } if (e.key === "ArrowRight" && this.player.x + this.carWidth < (this.canvas.width + this.roadWidth) / 2) { this.player.x += this.laneWidth; } },
  handleTouchStart(e) { this.touchStartX = e.changedTouches[0].clientX; },
  handleTouchEnd(e) { let touchEndX = e.changedTouches[0].clientX; let dx = touchEndX - this.touchStartX; if (Math.abs(dx) > 30) { if (dx < 0 && this.player.x > (this.canvas.width - this.roadWidth) / 2) { this.player.x -= this.laneWidth; } else if (dx > 0 && this.player.x + this.carWidth < (this.canvas.width + this.roadWidth) / 2) { this.player.x += this.laneWidth; } } }
};
// === NEW CHECKPOINT SYSTEM LOGIC ===

// Add this new helper function
function findKeyForChoice(choiceObject) {
  for (const key in storyNodes) {
    if (storyNodes[key] === choiceObject) {
      return key;
    }
  }
  return 'earlyGameSequence'; // Fallback
}

// Add this new helper function
function findKeyForChoice(choiceObject) {
  for (const key in storyNodes) {
    if (storyNodes[key] === choiceObject) {
      return key;
    }
  }
  // This is a simplified search; a more robust one might be needed for deeply nested choices
  // However, based on your structure, this will work for top-level nodes.
  return 'earlyGameSequence'; // Fallback to a known starting point
}

function setupCheckpointSystem() {
  const checkpointBtn = document.getElementById('checkpointBtn');
  const checkpointContainer = document.getElementById('checkpoint-container');
  const mainPanel = document.getElementById('checkpoint-panel');
  const savePanel = document.getElementById('save-slots-panel');
  const loadPanel = document.getElementById('load-slots-panel');
  const clearPanel = document.getElementById('clear-confirm-panel');

  // Main menu buttons
  checkpointBtn.addEventListener('click', () => checkpointContainer.classList.remove('hidden'));
  document.getElementById('return-btn').addEventListener('click', () => checkpointContainer.classList.add('hidden'));

  document.getElementById('save-btn').addEventListener('click', () => {
    renderSaveSlots();
    mainPanel.classList.add('hidden');
    savePanel.classList.remove('hidden');
  });

  document.getElementById('load-btn').addEventListener('click', () => {
    renderLoadSlots();
    mainPanel.classList.add('hidden');
    loadPanel.classList.remove('hidden');
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    mainPanel.classList.add('hidden');
    clearPanel.classList.remove('hidden');
  });

  // Back buttons
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      savePanel.classList.add('hidden');
      loadPanel.classList.add('hidden');
      mainPanel.classList.remove('hidden');
    });
  });

  // Clear confirmation buttons
  document.getElementById('cancel-clear-btn').addEventListener('click', () => {
    clearPanel.classList.add('hidden');
    mainPanel.classList.remove('hidden');
  });
  document.getElementById('confirm-clear-btn').addEventListener('click', clearCheckpoints);
}

function renderSaveSlots() {
  const container = document.getElementById('save-slots-container');
  container.innerHTML = '';
  for (let i = 1; i <= 4; i++) {
    const slotData = JSON.parse(localStorage.getItem(`checkpoint_slot_${i}`));
    const btn = document.createElement('button');
    btn.className = 'slot-button';
    btn.innerHTML = `Slot ${i} <span class="slot-time">${slotData ? new Date(slotData.timestamp).toLocaleString() : 'Empty'}</span>`;
    if (!slotData) {
      btn.classList.add('empty');
    }
    btn.onclick = () => saveToCheckpoint(i);
    container.appendChild(btn);
  }
}

function renderLoadSlots() {
  const container = document.getElementById('load-slots-container');
  container.innerHTML = '';
  for (let i = 1; i <= 4; i++) {
    const slotData = JSON.parse(localStorage.getItem(`checkpoint_slot_${i}`));
    const btn = document.createElement('button');
    btn.className = 'slot-button';
    if (slotData) {
      btn.innerHTML = `Slot ${i} <span class="slot-time">${new Date(slotData.timestamp).toLocaleString()}</span>`;
      btn.onclick = () => loadFromCheckpoint(i);
    } else {
      btn.innerHTML = `Slot ${i} <span class="slot-time">Empty</span>`;
      btn.classList.add('empty');
      btn.disabled = true;
    }
    container.appendChild(btn);
  }
}

function saveToCheckpoint(slot) {
  // Check if a story choice has been made.
  if (!currentDisplayState) {
    showPopup("You can't save at the start.");
    return;
  }

  const gameState = {
    playerName,
    statPoints,
    stats: { ...stats },
    playerCards: [...playerCards],
    claimedStatRewards: [...claimedStatRewards],
    currentDisplayState, // MODIFIED: Save the current screen state
    timestamp: new Date().toISOString()
  };
  localStorage.setItem(`checkpoint_slot_${slot}`, JSON.stringify(gameState));
  showPopup(`Game saved to Slot ${slot}`);
  renderSaveSlots();
}

function loadFromCheckpoint(slot) {
  const savedState = localStorage.getItem(`checkpoint_slot_${slot}`);
  if (savedState) {
    const gameState = JSON.parse(savedState);

    // Load player data as usual
    playerName = gameState.playerName;
    statPoints = gameState.statPoints;
    stats = gameState.stats;
    playerCards = gameState.playerCards;
    claimedStatRewards = gameState.claimedStatRewards || [];
    currentDisplayState = gameState.currentDisplayState; // Load the screen state

    // Hide checkpoint UI
    document.getElementById('checkpoint-container').classList.add('hidden');
    document.getElementById('load-slots-panel').classList.add('hidden');
    document.getElementById('checkpoint-panel').classList.remove('hidden');

    // Update stats panel
    updateUIFromLoadedState();

    // --- NEW LOGIC TO RESTORE THE EXACT SCREEN ---
    if (currentDisplayState) {
      document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
      document.getElementById('game-panel').classList.remove('hidden');

      if (currentDisplayState.type === 'actions') {
        showActionChoices(currentDisplayState.options, currentDisplayState.title, currentDisplayState.desc);
      } else if (currentDisplayState.type === 'cards') {
        showCardChoices(currentDisplayState.cards, currentDisplayState.nextStory, currentDisplayState.title, currentDisplayState.desc);
      }
    } else {
      // Fallback if there's no saved screen state
      transitionPanels('game-panel', 'intro-panel');
    }
  }
}

function clearCheckpoints() {
  // Since the user has already clicked "Yes, Clear" on the confirmation panel,
  // we can perform the action directly without asking again.

  // 1. Delete the data from all four slots.
  for (let i = 1; i <= 4; i++) {
    localStorage.removeItem(`checkpoint_slot_${i}`);
  }

  // 2. Show the custom "All checkpoints have been cleared." message for 2 seconds.
  showPopup('All checkpoints have been cleared.');

  // 3. Hide the confirmation panel and show the main checkpoint menu again.
  document.getElementById('clear-confirm-panel').classList.add('hidden');
  document.getElementById('checkpoint-panel').classList.remove('hidden');
}

// === END OF CHECKPOINT SYSTEM LOGIC ===
// In script.js

// In script.js

// --- Main Game Initialization ---
window.onload = function () {
    // This function now safely checks if elements exist before adding listeners,
    // making it work on both index.html and battle.html.

    const newGameBtn = document.getElementById("newGameBtn");
    if (newGameBtn) {
        newGameBtn.addEventListener("click", startNewGame);
    }

    const onlineBtn = document.getElementById("onlineBtn");
    if (onlineBtn) {
        onlineBtn.addEventListener("click", () => {
            if (localStorage.getItem('onlinePlayerStats')) {
                window.location.href = '/online.html';
            } else {
                showPopup("You must complete the story mode first to unlock Online Mode!");
            }
        });
    }

    const shopBtn = document.getElementById("shopBtn");
    if (shopBtn) {
        shopBtn.addEventListener("click", openShop);
    }
    
    const returnToGameBtn = document.getElementById("returnToGameBtn");
    if (returnToGameBtn) {
        returnToGameBtn.addEventListener("click", closeShop);
    }
    
    const closeRewardPopup = document.getElementById("close-reward-popup");
    if (closeRewardPopup) {
        closeRewardPopup.addEventListener("click", () => {
            document.getElementById('pack-reward-popup').classList.add('hidden');
        });
    }

    const namePanelForm = document.querySelector("#name-panel form");
    if (namePanelForm) {
        namePanelForm.addEventListener("submit", (e) => { e.preventDefault(); completeName(); });
    }

    const rollDiceBtn = document.getElementById("rollDiceBtn");
    if (rollDiceBtn) {
        rollDiceBtn.onclick = rollStats;
    }
    
    const rolledStatsBtn = document.querySelector("#rolledStats button");
    if (rolledStatsBtn) {
        rolledStatsBtn.onclick = startJourney;
    }
    
    const toggleStatBtn = document.getElementById("toggleStatBtn");
    if (toggleStatBtn) {
        toggleStatBtn.addEventListener("click", () => { playClickSound(); statAllocationMode = !statAllocationMode; renderPlusButtons(); });
    }

    setupCheckpointSystem(); // This sets up its own listeners, so it's fine.

    window.addEventListener('resize', checkOrientation);
};

// --- POPUP UI ---
function showPopup(message, duration = 2000) {
  const popup = document.getElementById('popup-message');
  popup.textContent = message;
  popup.classList.add('show');
  popup.classList.remove('hidden');

  setTimeout(() => {
    popup.classList.remove('show');
    popup.classList.add('hidden');
  }, duration);
}

function showConfirm(message, onYes, onNo) {
  const dialog = document.getElementById('confirm-dialog');
  const confirmMsg = document.getElementById('confirm-message');
  const yesBtn = document.getElementById('confirm-yes');
  const noBtn = document.getElementById('confirm-no');

  confirmMsg.textContent = message;
  dialog.classList.remove('hidden');

  const cleanup = () => {
    dialog.classList.add('hidden');
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  };

  const yesHandler = () => {
    cleanup();
    onYes();
  };

  const noHandler = () => {
    cleanup();
    if (onNo) onNo();
  };

  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

// PASTE THIS ENTIRE BLOCK AT THE END OF SCRIPT.JS

function updateGoldUI() {
  document.getElementById('player-gold-display').textContent = `Gold: ${playerGold}`;
  document.getElementById('shop-gold-display').textContent = `Gold: ${playerGold}`;
}

function openShop() {
  updateGoldUI();
  transitionPanels('game-panel', 'shop-panel');
}

function closeShop() {
  transitionPanels('shop-panel', 'game-panel');
}

const packData = {
  bronze: { cost: 50, cashback: 10, chances: { legendary: 1, epic: 5, rare: 25, uncommon: 80, stats: 90 } },
  silver: { cost: 150, cashback: 20, chances: { legendary: 4, epic: 12, rare: 40, uncommon: 84, stats: 92 } },
  diamond: { cost: 250, cashback: 40, chances: { legendary: 8, epic: 22, rare: 54, uncommon: 90, stats: 95 } }
};

function buyCardPack(packType) {
  const data = packData[packType];
  if (playerGold < data.cost) {
    showPopup("Not enough gold!");
    return;
  }

  playerGold -= data.cost;
  updateGoldUI();

  const roll = Math.random() * 100;
  let rewardType;

  if (roll < data.chances.legendary) rewardType = 'legendary';
  else if (roll < data.chances.epic) rewardType = 'epic';
  else if (roll < data.chances.rare) rewardType = 'rare';
  else if (roll < data.chances.uncommon) rewardType = 'uncommon';
  else if (roll < data.chances.stats) rewardType = 'stats';
  else rewardType = 'nothing';

  grantReward(rewardType, data.cashback);
}

// In script.js, find grantReward and showPackReward and REPLACE them with these versions

// REPLACE your existing grantReward function with this one

function grantReward(type, cashback) {
  let rewardObject;

  if (type === 'stats') {
    const points = Math.floor(Math.random() * 5) + 2; // Random 2-6
    statPoints += points;
    rewardObject = { rarity: 'uncommon', type: 'stats', name: `${points} Stat Points`, desc: `You found a hidden reserve of power!` };

  } else if (type === 'nothing') {
    playerGold += cashback;
    rewardObject = { rarity: 'uncommon', type: 'nothing', name: `Nothing...`, desc: `The pack was empty... You get ${cashback}G back.` };

  } else {
    // --- START OF NEW DUPLICATE CHECK LOGIC ---
    const pool = cardShopPool[type];
    const selectedCard = pool[Math.floor(Math.random() * pool.length)];

    // Check if the player already has a card with the same name
    const isDuplicate = playerCards.some(existingCard => existingCard.name === selectedCard.name);

    if (isDuplicate) {
      const compensationGold = 25; // Amount of gold to give for a duplicate
      playerGold += compensationGold;
      rewardObject = {
        rarity: 'uncommon', // Give duplicates a standard reveal animation
        type: 'duplicate',
        name: `Duplicate Card!`,
        desc: `You already have "${selectedCard.name}".<br>You receive ${compensationGold}G instead.`
      };
    } else {
      // It's a new card, add it to the player's collection
      const newCard = { ...selectedCard }; // Create a copy
      addCardToUI(newCard);
      rewardObject = newCard;
    }
    // --- END OF NEW DUPLICATE CHECK LOGIC ---
  }

  showPackReward(rewardObject);
  updateGoldUI();
  updateStats(); // To update stat points display
}

// REPLACE your existing animation function with this corrected one.
// REPLACE your current showPackReward function with this one

function showPackReward(reward) {
  const popup = document.getElementById('pack-reward-popup');
  const content = document.getElementById('pack-reward-content');
  const display = document.getElementById('pack-reward-card-display');
  const title = document.getElementById('pack-reward-title');
  const closeBtn = document.getElementById('close-reward-popup');

  // --- Animation Setup ---
  // 1. Create the flipper element dynamically
  const flipper = document.createElement('div');
  flipper.className = 'card-reveal-flipper';
  flipper.innerHTML = '<div class="card-reveal-back"></div>';

  // 2. Hide the real card content and button initially
  display.style.opacity = '0';
  title.style.opacity = '0';
  closeBtn.style.opacity = '0';
  closeBtn.style.pointerEvents = 'none'; // Prevent clicking while invisible

  // 3. Add the flipper to the start of the content without deleting anything
  content.prepend(flipper);

  // 4. Set the content of the reward card
  // And change it to this:
  if (reward.type === 'stats' || reward.type === 'nothing' || reward.type === 'duplicate') {
    display.innerHTML = `<div class="card"><div class="subtitle">${reward.name}</div><div class="description">${reward.desc}</div></div>`;
  } // ... the rest of the function stays the same
  else {
    display.innerHTML = `<div class="card"><div class="title">${reward.rarity.toUpperCase()} CARD</div><div class="subtitle">${reward.name}</div><div class="description">${reward.desc}</div></div>`;
  }

  // 5. Apply the rarity class for color/glow
  const rarity = reward.rarity || 'uncommon';
  flipper.classList.add(`rarity-${rarity}`);

  // 6. Show the popup and start the animation
  popup.classList.remove('hidden');

  setTimeout(() => {
    flipper.classList.add('animate');
  }, 100);

  // 7. After the flip animation ends, show the card and button, then remove the flipper
  flipper.addEventListener('animationend', (event) => {
    // We only care about the 'flip' animation ending
    if (event.animationName === 'flip') {
      display.style.opacity = '1';
      title.style.opacity = '1';
      closeBtn.style.opacity = '1';
      closeBtn.style.pointerEvents = 'auto'; // Make the button clickable again

      // Remove the animation element so it doesn't block the button
      flipper.remove();
    }
  });
}
// Add this new function to the end of script.js
function grantGold(goldData) {
  if (!goldData) return;

  let amount = 0;
  if (typeof goldData === 'number') {
    // This is for a fixed amount, e.g., gold: 100
    amount = goldData;
  } else if (typeof goldData === 'object' && goldData.min && goldData.max) {
    // This is for a random range, e.g., gold: { min: 50, max: 150 }
    amount = Math.floor(Math.random() * (goldData.max - goldData.min + 1)) + goldData.min;
  }

  if (amount > 0) {
    playerGold += amount;
    updateGoldUI();
    showPopup(`You received ${amount} Gold!`); // Shows a notification
  }
}