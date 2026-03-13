// src/pages/Handbook.tsx
//
// Player guidance for game mechanics, quest progression, and farming.
// Content is static — no store reads needed.

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────────────────────

function Card({ title, summary, children }: { title: string; summary: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
            <div className="text-lg font-semibold text-slate-100">{title}</div>
            <div className="mt-1 text-sm text-slate-400">{summary}</div>
            <div className="mt-4 space-y-3 text-sm text-slate-300 leading-relaxed">{children}</div>
        </div>
    );
}

function P({ children }: { children: React.ReactNode }) {
    return <p>{children}</p>;
}

function B({ children }: { children: React.ReactNode }) {
    return <span className="font-semibold text-slate-100">{children}</span>;
}

function Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-block rounded px-1.5 py-0.5 text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
            {children}
        </span>
    );
}

function Steps({ items }: { items: string[] }) {
    return (
        <ol className="ml-4 space-y-1 list-decimal marker:text-slate-500">
            {items.map((item, i) => (
                <li key={i}>{item}</li>
            ))}
        </ol>
    );
}

function Callout({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-blue-900/50 bg-blue-950/30 px-4 py-3 text-blue-200 text-sm">
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quest data types and components
// ─────────────────────────────────────────────────────────────────────────────

type QuestType = "main" | "side" | "warframe";

type Chapter = { name: string; note: string };

type Quest = {
    name: string;
    type: QuestType;
    note: string;
    chapters?: Chapter[];
};

const TYPE_LABEL: Record<QuestType, string> = {
    main: "Main Quest",
    side: "Side Quest",
    warframe: "Warframe Quest",
};

const TYPE_BADGE_CLASS: Record<QuestType, string> = {
    main: "bg-sky-900/40 text-sky-300 border border-sky-800/50",
    side: "bg-amber-900/40 text-amber-300 border border-amber-800/50",
    warframe: "bg-violet-900/40 text-violet-300 border border-violet-800/50",
};

const GROUP_HEADER_CLASS: Record<QuestType, string> = {
    main: "text-sky-500/80",
    side: "text-amber-500/80",
    warframe: "text-violet-500/80",
};

function QuestBadge({ type }: { type: QuestType }) {
    return (
        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-mono ${TYPE_BADGE_CLASS[type]}`}>
            {TYPE_LABEL[type]}
        </span>
    );
}

function QuestEntry({ quest, index }: { quest: Quest; index: number }) {
    return (
        <li className="py-2 border-b border-slate-800/40 last:border-0">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-600 text-xs tabular-nums w-5 shrink-0 text-right">{index}.</span>
                <span className="font-semibold text-slate-100 text-sm">{quest.name}</span>
                <QuestBadge type={quest.type} />
            </div>
            <p className="ml-7 mt-0.5 text-xs text-slate-400 leading-relaxed">{quest.note}</p>
            {quest.chapters && (
                <ul className="ml-7 mt-2 space-y-1.5 pl-3 border-l border-slate-700/40">
                    {quest.chapters.map((ch, i) => (
                        <li key={i}>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-slate-200">{ch.name}</span>
                                <span className="text-xs text-slate-600">Chapter {i + 1}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{ch.note}</p>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}

function QuestGroup({ label, type, quests }: { label: string; type: QuestType; quests: Quest[] }) {
    return (
        <div>
            <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${GROUP_HEADER_CLASS[type]}`}>
                {label}
            </div>
            <ol className="list-none m-0 p-0">
                {quests.map((q, i) => (
                    <QuestEntry key={q.name} quest={q} index={i + 1} />
                ))}
            </ol>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quest data
// ─────────────────────────────────────────────────────────────────────────────

const MAIN_QUESTS: Quest[] = [
    {
        name: "Awakening",
        type: "main",
        note: "Opening cinematic; your Tenno awakens from the Reservoir for the first time.",
    },
    {
        name: "Vor's Prize",
        type: "main",
        note: "Tutorial quest teaching movement and combat. Unlocks the full Star Chart and your Orbiter.",
    },
    {
        name: "The Teacher",
        type: "main",
        note: "Introduces Cephalon Simaris and the Synthesis scanner system.",
    },
    {
        name: "Vox Solaris",
        type: "main",
        note: "Unlocks the Fortuna hub on Venus and access to the Vox Solaris syndicate.",
    },
    {
        name: "Once Awake",
        type: "main",
        note: "Short early quest involving Alad V; unlocks Corpus missions on the Star Chart.",
    },
    {
        name: "Heart of Deimos",
        type: "main",
        note: "Unlocks the Necralisk hub, Cambion Drift open world, and the Entrati syndicate.",
    },
    {
        name: "The Archwing",
        type: "main",
        note: "Awards the Archwing Launcher and unlocks Archwing flight missions.",
    },
    {
        name: "Natah",
        type: "main",
        note: "Investigates the Lotus's true origins; required gate before The Second Dream.",
    },
    {
        name: "The Second Dream",
        type: "main",
        note: "Reveals the Tenno's nature; unlocks Operator mode and the Focus system. One of the most important story milestones.",
    },
    {
        name: "The War Within",
        type: "main",
        note: "Expands Operator Transference abilities; unlocks the Kuva Fortress, Sorties, and Kuva Siphons.",
    },
    {
        name: "Rising Tide",
        type: "main",
        note: "Build your personal Railjack ship in a Clan Dojo Dry Dock; required before The New War.",
    },
    {
        name: "Chains of Harrow",
        type: "main",
        note: "Unlocks Harrow; set aboard an Infested prison ship using the Defection tileset.",
    },
    {
        name: "Apostasy Prologue",
        type: "main",
        note: "Short cinematic quest bridging The War Within and The Sacrifice storylines.",
    },
    {
        name: "The Sacrifice",
        type: "main",
        note: "Unlocks Excalibur Umbra and the Skiajati nikana; a major emotional turning point in the story.",
    },
    {
        name: "Prelude to War",
        type: "main",
        note: "Three-chapter quest serving as the direct lead-up to The New War. All three chapters must be completed before The New War unlocks.",
        chapters: [
            {
                name: "Chimera Prologue",
                note: "Adds the Ropalolyst assassination node to Jupiter.",
            },
            {
                name: "Erra",
                note: "The Sentient invasion escalates; the Lotus's true allegiance is brought into question.",
            },
            {
                name: "The Maker",
                note: "Final chapter; completing this unlocks The New War.",
            },
        ],
    },
    {
        name: "The New War",
        type: "main",
        note: "Feature-length cinematic quest requiring both a Railjack and a Necramech. Unlocks Kahl-175 weekly missions and all post-New-War content.",
    },
    {
        name: "The Duviri Paradox",
        type: "main",
        note: "Unlocks the Duviri open world, The Circuit game mode, and the Incarnon Genesis weapon system.",
    },
    {
        name: "Angels of the Zariman",
        type: "main",
        note: "Unlocks the Chrysalith hub, the Holdfasts syndicate, and Zariman tileset missions.",
    },
    {
        name: "Jade Shadows",
        type: "main",
        note: "Unlocks Jade Warframe; set in the aftermath of The New War.",
    },
    {
        name: "Whispers in the Walls",
        type: "main",
        note: "Unlocks the Sanctum Anatomica hub on Deimos and the Cavia syndicate.",
    },
    {
        name: "The Lotus Eaters",
        type: "main",
        note: "Direct story continuation following the events of Whispers in the Walls.",
    },
    {
        name: "The Hex",
        type: "main",
        note: "Unlocks Höllvania (the 1999 open world) and The Hex syndicate.",
    },
    {
        name: "The Old Peace",
        type: "main",
        note: "Most recent main story quest (Update 41, December 2025).",
    },
];

const SIDE_QUESTS: Quest[] = [
    {
        name: "Saya's Vigil",
        type: "side",
        note: "Unlocks Cetus and the Ostron syndicate on Earth; gateway to the Plains of Eidolon.",
    },
    {
        name: "Howl of the Kubrow",
        type: "side",
        note: "Unlocks Kubrow companion breeding via the Incubator Segment.",
    },
    {
        name: "Stolen Dreams",
        type: "side",
        note: "Unlocks the Arcane Codex system; prerequisite for The New Strange.",
    },
    {
        name: "Veilbreaker",
        type: "side",
        note: "Unlocks Kahl-175 weekly missions and the Kahl mission hub. Requires The New War.",
    },
    {
        name: "Patient Zero",
        type: "side",
        note: "Unlocks Mutalist Alad V on Eris; his assassination node drops Mesa's Neuroptics blueprint.",
    },
    {
        name: "A Man of Few Words",
        type: "side",
        note: "Unlocks repeatable weekly Clem missions from Darvo.",
    },
];

const WARFRAME_QUESTS: Quest[] = [
    {
        name: "The Deadlock Protocol",
        type: "warframe",
        note: "Unlocks Protea and the Corpus Ship Railjack tileset.",
    },
    {
        name: "Call of the Tempestarii",
        type: "warframe",
        note: "Unlocks Sevagoth; a major Railjack story mission.",
    },
    {
        name: "The New Strange",
        type: "warframe",
        note: "Unlocks Chroma; a multi-tileset investigation with Cephalon Simaris.",
    },
    {
        name: "The Glast Gambit",
        type: "warframe",
        note: "Unlocks Nidus; set in the Infested Salvage tileset.",
    },
    {
        name: "Octavia's Anthem",
        type: "warframe",
        note: "Unlocks Octavia; features a unique music puzzle mechanic in the Orokin Moon.",
    },
    {
        name: "Sands of Inaros",
        type: "warframe",
        note: "Unlocks Inaros; requires a special vessel purchased from Baro Ki'Teer and unique offering mechanics.",
    },
    {
        name: "Hidden Messages",
        type: "warframe",
        note: "Unlocks Mirage; involves solving riddles hidden across Warframe's Codex lore entries.",
    },
    {
        name: "Mask of the Revenant",
        type: "warframe",
        note: "Unlocks Revenant; set primarily in the Plains of Eidolon at night.",
    },
    {
        name: "The Silver Grove",
        type: "warframe",
        note: "Unlocks Titania; introduces Apothic crafting and the Silver Grove Specters.",
    },
    {
        name: "The Waverider",
        type: "warframe",
        note: "Unlocks Yareli; requires completing K-Drive trick challenges in Fortuna.",
    },
    {
        name: "The Limbo Theorem",
        type: "warframe",
        note: "Unlocks Limbo; a blueprint-collection quest spanning multiple mission types.",
    },
    {
        name: "The Jordas Precept",
        type: "warframe",
        note: "Unlocks Atlas; an Archwing-heavy quest culminating in the Jordas Golem assassination.",
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section definitions
// ─────────────────────────────────────────────────────────────────────────────

type Section = {
    id: string;
    title: string;
    summary: string;
    content: React.ReactNode;
};

const SECTIONS: Section[] = [
    {
        id: "quest-order",
        title: "Quest Order",
        summary: "Main Quests, Side Quests, and Warframe Quests listed in order of availability.",
        content: (
            <>
                <P>
                    Quests use three in-game categories: <B>Main Quest</B> drives the primary storyline,{" "}
                    <B>Side Quest</B> unlocks systems and companion hubs, and <B>Warframe Quest</B> each
                    rewards a specific Warframe blueprint. Each group is listed in order of when it becomes
                    available.
                </P>
                <QuestGroup label="Main Quests" type="main" quests={MAIN_QUESTS} />
                <QuestGroup label="Side Quests" type="side" quests={SIDE_QUESTS} />
                <QuestGroup label="Warframe Quests" type="warframe" quests={WARFRAME_QUESTS} />
                <Callout>
                    <B>Key gates:</B> The Second Dream and The War Within unlock the Focus system, Operator
                    Amps, and Kuva weaponry. The New War additionally requires both a Railjack and a
                    Necramech — start building both as soon as Rising Tide and Heart of Deimos are complete.
                </Callout>
            </>
        ),
    },
    {
        id: "lich-sisters",
        title: "Kuva Lich & Sister of Parvos",
        summary: "Nemesis systems that let you earn exclusive weapons. The parazon combo system is the main point of confusion.",
        content: (
            <>
                <P>
                    <B>Kuva Liches</B> (Grineer) and <B>Sisters of Parvos</B> (Corpus) are personal nemesis
                    enemies that hold a unique weapon variant. Each has a random element bonus (20–60%) on
                    their weapon.
                </P>
                <P><B>Creating a Lich / Sister:</B></P>
                <Steps items={[
                    "Run a Grineer mission (Lich) or Corpus mission (Sister) on the Star Chart",
                    "Find a Larvling (Lich) or Candidate (Sister) — they spawn randomly in specific mission types",
                    "Mercy-kill them with your Parazon to claim them as your nemesis",
                    "The weapon they drop is shown before you confirm — pick carefully if you're farming a specific weapon",
                ]} />
                <P><B>Defeating them:</B></P>
                <Steps items={[
                    "Farm Murmurs by running missions in their territory until three requiem hints are revealed",
                    "Equip the three matching Requiem mods on your Parazon in the correct order",
                    "When the Lich/Sister appears in a mission, let them down you once to reveal which slot is wrong",
                    "Repeat until the order is confirmed, then Vanquish (keep the weapon) or Convert (make them an ally)",
                ]} />
                <Callout>
                    <B>Oull</B> is a wildcard Requiem mod that fits any slot. Useful for finishing off a
                    Lich when you have two slots confirmed but don't have the third mod.
                </Callout>
            </>
        ),
    },
    {
        id: "eidolons",
        title: "Eidolon Hunting",
        summary: "Hunting the three Eidolons on the Plains of Eidolon is the primary way to earn Arcanes and Quill Standing.",
        content: (
            <>
                <P>
                    Eidolons are massive boss creatures that roam the Plains of Eidolon (Earth) only at
                    night. A full night cycle lasts about 50 minutes real-time (9 minutes for the plains
                    portion that matters).
                </P>
                <P><B>Requirements before you start:</B></P>
                <Steps items={[
                    "Complete The Second Dream to unlock your Operator",
                    "Build or earn an Amp (Operator weapon) — the base Mote Amp is very weak; upgrade it via the Quills",
                    "A Warframe with decent survivability or support (Trinity, Harrow, and Wisp are popular)",
                    "Lures from Vomvalysts — you need charged Lures attached to capture (not kill) the Eidolon",
                ]} />
                <P><B>Kill order and progression:</B></P>
                <Steps items={[
                    "Teralyst (Terry) — easiest; 1 Lure to capture",
                    "Gantulyst (Gary) — requires a captured Teralyst to spawn; 2 Lures",
                    "Hydrolyst (Harry) — requires a captured Gantulyst; 3 Lures",
                ]} />
                <P>
                    For each Eidolon: strip its shield with Void damage (Operator Amp), then destroy its
                    glowing Synovias with your primary weapon. Eidolon shields regenerate unless you have a
                    Trinity or Harrow preventing it.
                </P>
                <Callout>
                    <B>Brilliant Eidolon Shards</B> come from captures (not kills). Captures are required
                    for Focus school leveling beyond the base ranks.
                </Callout>
            </>
        ),
    },
    {
        id: "steel-path",
        title: "Steel Path",
        summary: "A harder replay of every Star Chart mission. Requires clearing the full Star Chart first.",
        content: (
            <>
                <P>
                    <B>Steel Path</B> adds +100 to enemy level scaling and +2500% to enemy armor, shields,
                    and health. It is unlocked by completing every node on the Star Chart (all planets, all
                    junctions).
                </P>
                <P><B>Unique rewards:</B></P>
                <Steps items={[
                    "Steel Essence — the primary currency, earned from missions and Steel Path Honors weekly rotations",
                    "Arcane Adapters (from Teshin's Steel Path Honors shop)",
                    "Kuva — 2,000 from each mission; efficient Kuva farming without requiring a Kuva Fortress survival",
                    "Exclusive cosmetics and the Steel Path completion badge",
                ]} />
                <P>
                    <B>Acolytes</B> spawn randomly during Steel Path missions and drop Steel Essence on
                    kill. Each Acolyte has a fixed elemental weakness — checking the Warframe wiki before a
                    session helps.
                </P>
                <Callout>
                    Steel Path is not required for most endgame content, but it provides the best resource
                    density and is the primary way to earn Steel Essence for Teshin's shop.
                </Callout>
            </>
        ),
    },
    {
        id: "railjack",
        title: "Railjack",
        summary: "Space-combat mode. Requires building your own Railjack ship in a Clan Dojo Dry Dock.",
        content: (
            <>
                <P>
                    <B>Railjack</B> is Warframe's space-combat system. You pilot a large ship through a
                    mission area, destroying Corpus or Grineer objectives while boarding enemy crewships.
                </P>
                <P><B>Getting started:</B></P>
                <Steps items={[
                    "Join a Clan with a Dry Dock, or build your own Dry Dock (requires a large Clan Dojo room)",
                    "Complete the Rising Tide quest — it gives you Railjack component blueprints",
                    "Build the Fuselage, Propulsion, and Hull sections; combine them in the Dry Dock",
                    "Upgrade your Railjack with Avionic grids and weapon hardpoints",
                ]} />
                <P><B>Key resource types:</B></P>
                <Steps items={[
                    "Wreckage — drops from destroyed enemy ships; some can be repaired into Railjack components",
                    "Dirac — used to upgrade Avionics grid",
                    "Credits and standard resources for basic repairs",
                ]} />
                <P>
                    If you don't want to build your own Railjack yet, you can join public Railjack missions
                    as a crew member using the Star Chart's Railjack nodes.
                </P>
                <Callout>
                    The <B>Call of the Tempestarii</B> and <B>The New War</B> quests both require Railjack.
                    Completing the Rising Tide quest first means you'll have your own ship ready when needed.
                </Callout>
            </>
        ),
    },
    {
        id: "necramech",
        title: "Necramech Acquisition",
        summary: "A combat mech usable in Cambion Drift and in The New War. Parts drop from Isolation Vaults.",
        content: (
            <>
                <P>
                    <B>Necramechs</B> are heavy combat mechs piloted by the Operator. Two variants exist:
                    Voidrig (offense) and Bonewidow (defense/melee).
                </P>
                <P><B>How to get one:</B></P>
                <Steps items={[
                    "Complete Heart of Deimos quest to unlock the Necralisk and Cambion Drift",
                    "Reach Entrati Standing Rank 2 (Stranger) to unlock Isolation Vault bounties",
                    "Run Isolation Vault bounties — Necramech part components drop from vault enemies and the Jugulus boss",
                    "Purchase the main Necramech blueprint from Father (Entrati Syndicate vendor)",
                    "Build the main BP after collecting the Systems, Carapace, Capsule, and Engine",
                ]} />
                <P>
                    Necramechs require <B>Orokin Matrix</B> to build, which drops from Tier 3 Isolation
                    Vaults. Plan on running many Vault bounties before you have all the parts.
                </P>
                <Callout>
                    A basic Necramech is required to complete <B>The New War</B> quest. Start farming parts
                    before you're ready to start that quest.
                </Callout>
            </>
        ),
    },
    {
        id: "focus",
        title: "Focus Schools",
        summary: "Passive ability trees for your Operator unlocked after The Second Dream. Choose a primary school early — switching is slow.",
        content: (
            <>
                <P>
                    There are five Focus schools, each giving different passive bonuses to Operator and
                    Warframe. Focus is earned by killing enemies with weapons that have a{" "}
                    <B>Convergence Orb</B> active (8× multiplier).
                </P>
                <table className="w-full text-xs border border-slate-800 rounded-lg overflow-hidden mt-2">
                    <thead className="bg-slate-900/60">
                        <tr>
                            <th className="text-left px-3 py-2 text-slate-300">School</th>
                            <th className="text-left px-3 py-2 text-slate-300">Identity</th>
                            <th className="text-left px-3 py-2 text-slate-300">Key Passive</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ["Zenurik", "Energy / caster", "Energizing Dash — channeled dash restores Warframe energy over time"],
                            ["Vazarin", "Healing / support", "Protective Sling — Void Sling through allies heals them and grants brief invulnerability"],
                            ["Naramon", "Combo / melee", "Power Spike — melee combo counter decays slowly instead of resetting"],
                            ["Unairu", "Armor strip / survival", "Caustic Strike — radial armor strip on Void Blast"],
                            ["Madurai", "Amp damage / Eidolons", "Phoenix Talons — Amp damage bonus after Void Mode exit"],
                        ].map(([school, identity, passive]) => (
                            <tr key={school} className="border-t border-slate-800/60">
                                <td className="px-3 py-2 font-semibold text-slate-100">{school}</td>
                                <td className="px-3 py-2 text-slate-400">{identity}</td>
                                <td className="px-3 py-2 text-slate-300">{passive}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <P>
                    Each school has two <B>Way-Bound</B> passives — special upgrades that remain active
                    even when you switch to a different school. Once unlocked, they permanently benefit all
                    schools.
                </P>
                <table className="w-full text-xs border border-slate-800 rounded-lg overflow-hidden mt-2">
                    <thead className="bg-slate-900/60">
                        <tr>
                            <th className="text-left px-3 py-2 text-slate-300">School</th>
                            <th className="text-left px-3 py-2 text-slate-300">Way-Bound 1</th>
                            <th className="text-left px-3 py-2 text-slate-300">Way-Bound 2</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            [
                                "Zenurik",
                                "Void Flow — increases Operator Void Energy capacity",
                                "Temporal Step — grants an additional Void Sling charge",
                            ],
                            [
                                "Vazarin",
                                "Protective Sling — ally heal and invulnerability on Void Sling",
                                "Rejuvenating Tides — Operator health regenerates faster after taking damage",
                            ],
                            [
                                "Naramon",
                                "Shadow Step — Void Sling briefly cloaks your Warframe",
                                "Surging Dash — Void Sling adds to Melee Combo Counter",
                            ],
                            [
                                "Unairu",
                                "Stone Skin — increases Operator armor while not in Void Mode",
                                "Poise — Operator becomes immune to knockdown and stagger",
                            ],
                            [
                                "Madurai",
                                "Phoenix Penumbra — entering Void Mode briefly cloaks your Warframe",
                                "Swift Specter — Specters summon faster and last longer",
                            ],
                        ].map(([school, wb1, wb2]) => (
                            <tr key={school} className="border-t border-slate-800/60">
                                <td className="px-3 py-2 font-semibold text-slate-100">{school}</td>
                                <td className="px-3 py-2 text-slate-300">{wb1}</td>
                                <td className="px-3 py-2 text-slate-300">{wb2}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <P>
                    <B>Zenurik</B> is the most universally useful school for beginners — free energy removes
                    dependency on Energy Pads. <B>Madurai</B> is essential for serious Eidolon hunting.
                </P>
                <Callout>
                    Leveling a school to max requires <B>Brilliant Eidolon Shards</B> for the later nodes.
                    These only drop from captured (not killed) Eidolons.
                </Callout>
            </>
        ),
    },
    {
        id: "farming",
        title: "Common Farming Strategies",
        summary: "Where to go for the most common resources — specific nodes players commonly recommend.",
        content: (
            <>
                <P><B>Prime Relics by tier:</B></P>
                <Steps items={[
                    "Lith — Hepit (Void, Capture): fastest Lith farm. Everest (Earth, Excavation) for variety.",
                    "Meso — Io (Jupiter, Defense): popular leveling node. Ukko (Void, Capture) for quick solo runs.",
                    "Neo — Hydron (Sedna, Defense): the go-to XP node; also great for Neo. Xini (Eris, Interception) drops both Neo and Axi.",
                    "Axi — Mot (Void, Survival): long survivals yield Axi. Apollo (Lua, Disruption): consistent Axi drops. Xini (Eris, Interception): dual Neo/Axi.",
                ]} />
                <P><B>Credits:</B></P>
                <Steps items={[
                    "Neso (Neptune, Index) — ~200k per high-risk run; the go-to credit farm.",
                    "Profit-Taker Phase 4 (Orb Vallis) — large credit payout plus Toroid drops. Requires Vox Solaris rank 4.",
                ]} />
                <P><B>Endo (mod leveling):</B></P>
                <Steps items={[
                    "Arbitrations — rotating endless missions; Endo rewards scale with time invested.",
                    "Apollo (Lua, Disruption) — consistent Endo and good for simultaneous relic cracking.",
                    "Olympus (Mars, Disruption) — lower-level entry point before Lua is accessible.",
                    "Vodyanoi (Sedna, Interception, Steel Path) — fastest Endo/hour, but requires Steel Path unlock.",
                ]} />
                <P><B>Kuva (Riven rerolling):</B></P>
                <Steps items={[
                    "Taveuni (Kuva Fortress, Survival) — the primary Kuva farm; best raw Kuva per hour.",
                    "Kuva Flood missions — 1,200 Kuva each; distributed across various Grineer nodes when active.",
                    "Kuva Siphon missions — 550 Kuva each; lower time investment than survivals.",
                    "Steel Path missions — 2,000 flat Kuva per mission completion bonus on any node.",
                ]} />
                <P><B>Resources (specific nodes):</B></P>
                <Steps items={[
                    "Plastids — Ophelia (Uranus, Survival), Piscinas (Saturn, Survival), Memphis (Phobos, Survival).",
                    "Neurodes — Tikal (Earth, Excavation), Magnacidium (Deimos, Survival).",
                    "Neural Sensors — Io (Jupiter, Defense), Sinai (Jupiter, Defense), Elara (Jupiter, Survival).",
                    "Orokin Cells — Gabii (Ceres, Survival), Seimeni (Ceres, Defense), Titan (Saturn, Survival).",
                    "Argon Crystal — Oxomoco (Void, Exterminate), Marduk (Void, Sabotage). Argon decays — farm just before you need it.",
                    "Polymer Bundle — Ophelia (Uranus, Survival), Assur (Uranus, Survival).",
                    "Nano Spores — Ophelia (Uranus, Survival) is the most-cited pick; any Deimos or Eris survival also works.",
                ]} />
                <Callout>
                    <B>Resource boosters</B> double all resource drops. They stack with a{" "}
                    <B>Smeeta Kavat's</B> Charm buff (which can proc multiple times per session). Using
                    both during a focused farm is the fastest way to gather rare materials.
                </Callout>
            </>
        ),
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default function Handbook() {
    const [activeId, setActiveId] = useState<string>("quest-order");
    const activeSection = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0];

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                <div className="text-xl font-semibold text-slate-100">Handbook</div>
                <div className="mt-1 text-sm text-slate-400">
                    Explanations of game mechanics that commonly gate progression or cause confusion.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {SECTIONS.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveId(s.id)}
                            className={
                                s.id === activeId
                                    ? "rounded-lg border border-slate-500 bg-slate-700 px-3 py-1.5 text-xs text-slate-100 transition-colors"
                                    : "rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                            }
                        >
                            {s.title}
                        </button>
                    ))}
                </div>
            </div>

            <Card title={activeSection.title} summary={activeSection.summary}>
                {activeSection.content}
            </Card>
        </div>
    );
}
