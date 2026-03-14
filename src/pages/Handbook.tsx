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
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:p-6">
            <div className="text-lg font-semibold text-slate-100">{title}</div>
            <div className="mt-1 text-sm text-slate-400">{summary}</div>
            <div className="mt-5 space-y-5 text-sm text-slate-300 leading-relaxed">{children}</div>
        </div>
    );
}

function P({ children }: { children: React.ReactNode }) {
    return <p className="leading-relaxed">{children}</p>;
}

function B({ children }: { children: React.ReactNode }) {
    return <span className="font-semibold text-slate-100">{children}</span>;
}

function Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-block rounded px-1.5 py-0.5 text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
            {children}
        </span>
    );
}

function Steps({ items }: { items: React.ReactNode[] }) {
    return (
        <ol className="ml-5 space-y-2.5 list-decimal marker:text-slate-500">
            {items.map((item, i) => (
                <li key={i} className="leading-relaxed pl-1">{item}</li>
            ))}
        </ol>
    );
}

function Bullets({ items }: { items: React.ReactNode[] }) {
    return (
        <ul className="ml-5 space-y-2.5 list-disc marker:text-slate-500">
            {items.map((item, i) => (
                <li key={i} className="leading-relaxed pl-1">{item}</li>
            ))}
        </ul>
    );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
    return <p className="font-semibold text-slate-100 text-sm pt-1">{children}</p>;
}

function Callout({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "amber" | "green" | "red" }) {
    const classes: Record<string, string> = {
        blue: "border-blue-900/50 bg-blue-950/30 text-blue-200",
        amber: "border-amber-900/50 bg-amber-950/30 text-amber-200",
        green: "border-green-900/50 bg-green-950/30 text-green-200",
        red: "border-red-900/50 bg-red-950/30 text-red-200",
    };
    return (
        <div className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${classes[color]}`}>
            {children}
        </div>
    );
}

function TableWrap({ children }: { children: React.ReactNode }) {
    return <div className="overflow-x-auto rounded-lg border border-slate-800">{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quest types and components
// ─────────────────────────────────────────────────────────────────────────────

type QuestType = "main" | "side" | "warframe";
type Chapter = { name: string; note: string };
type Quest = {
    name: string;
    type: QuestType;
    note: string;
    chapters?: Chapter[];
    unlocks?: string[];
    keyGate?: string;
};

const TYPE_BADGE_CLASS: Record<QuestType, string> = {
    main: "bg-sky-900/40 text-sky-300 border border-sky-800/50",
    side: "bg-amber-900/40 text-amber-300 border border-amber-800/50",
    warframe: "bg-violet-900/40 text-violet-300 border border-violet-800/50",
};

const TYPE_LABEL: Record<QuestType, string> = {
    main: "Main",
    side: "Side",
    warframe: "Warframe",
};

function QuestBadge({ type }: { type: QuestType }) {
    return (
        <span className={`inline-block shrink-0 rounded px-1.5 py-0.5 text-xs font-mono ${TYPE_BADGE_CLASS[type]}`}>
            {TYPE_LABEL[type]}
        </span>
    );
}

function QuestEntry({ quest, index }: { quest: Quest; index: number }) {
    return (
        <li className="py-3 border-b border-slate-800/40 last:border-0">
            <div className="flex items-start gap-2">
                <span className="text-slate-600 text-xs tabular-nums w-6 shrink-0 text-right mt-0.5">{index}.</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100 text-sm">{quest.name}</span>
                        <QuestBadge type={quest.type} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{quest.note}</p>
                    {quest.unlocks && quest.unlocks.length > 0 && (
                        <p className="mt-1.5 text-xs text-amber-300/90">
                            <span className="font-semibold">Unlocks: </span>
                            {quest.unlocks.join(", ")}
                        </p>
                    )}
                    {quest.keyGate && (
                        <p className="mt-1.5 text-xs text-sky-300/90">
                            <span className="font-semibold">Key Gate: </span>
                            {quest.keyGate}
                        </p>
                    )}
                    {quest.chapters && (
                        <ul className="mt-2.5 space-y-2 pl-3 border-l border-slate-700/40">
                            {quest.chapters.map((ch, i) => (
                                <li key={i}>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-medium text-slate-200">{ch.name}</span>
                                        <span className="text-xs text-slate-600">Part {i + 1}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{ch.note}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </li>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// Unified quest list — in chronological order of availability
// ─────────────────────────────────────────────────────────────────────────────

const QUESTS: Quest[] = [
    {
        name: "Awakening",
        type: "main",
        note: "Opening cinematic; your Tenno awakens from the Reservoir for the first time.",
    },
    {
        name: "Vor's Prize",
        type: "main",
        note: "Tutorial quest teaching movement and combat. Unlocks the full Star Chart and your Orbiter.",
        keyGate: "Unlocks the full Star Chart, your Orbiter, and access to all planet navigation.",
    },
    {
        name: "The Teacher",
        type: "main",
        note: "Introduces Cephalon Simaris and the Synthesis scanner system.",
    },
    {
        name: "Howl of the Kubrow",
        type: "side",
        note: "Unlocks Kubrow companion breeding via the Incubator Segment. Available after completing the Mercury Junction on Venus.",
    },
    {
        name: "A Man of Few Words",
        type: "side",
        note: "Unlocks repeatable weekly Clem missions from Darvo. Visit Darvo in any Relay and select \"What's the job?\" — available as soon as you have Relay access.",
    },
    {
        name: "Saya's Vigil",
        type: "side",
        note: "Unlocks Cetus, the Ostron syndicate, and the Plains of Eidolon open world on Earth. Rewards the Gara Warframe blueprint.",
        keyGate: "Required to access the Plains of Eidolon — necessary for Eidolon hunting later in the game.",
    },
    {
        name: "Vox Solaris",
        type: "main",
        note: "Unlocks the Fortuna hub on Venus and access to the Vox Solaris syndicate.",
        unlocks: ["The Waverider (requires MR 3)"],
    },
    {
        name: "The Waverider",
        type: "warframe",
        note: "Unlocks Yareli; involves completing K-Drive trick challenges in Fortuna. Requires Vox Solaris completion + Mastery Rank 3.",
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
        keyGate: "Begin farming Necramech parts here as soon as possible — a Necramech is required to complete The New War.",
    },
    {
        name: "The Archwing",
        type: "main",
        note: "Awards the Archwing Launcher and unlocks Archwing flight missions.",
        unlocks: ["Stolen Dreams → The New Strange"],
    },
    {
        name: "Stolen Dreams",
        type: "side",
        note: "Unlocks the Arcane Codex system. Directly unlocks The New Strange upon completion.",
        unlocks: ["The New Strange"],
    },
    {
        name: "The New Strange",
        type: "warframe",
        note: "Unlocks Chroma; a multi-tileset investigation with Cephalon Simaris. Requires Stolen Dreams.",
    },
    {
        name: "The Limbo Theorem",
        type: "warframe",
        note: "Unlocks Limbo component blueprints. Available after completing the Jupiter → Europa Junction. Note: the main Limbo blueprint must be purchased from the Market or Cephalon Simaris separately.",
    },
    {
        name: "The Deadlock Protocol",
        type: "warframe",
        note: "Unlocks Protea and the Corpus Ship Railjack tileset. Requires Vox Solaris completion + Saturn Junction + Mastery Rank 4.",
    },
    {
        name: "The Duviri Paradox",
        type: "main",
        note: "Unlocks the Duviri open world, The Circuit game mode, and the Incarnon Genesis weapon system. Can be played early as an alternate entry point (\"Arc 0\") or in story order here.",
    },
    {
        name: "Natah",
        type: "main",
        note: "Investigates the Lotus's true origins; required gate before The Second Dream.",
    },
    {
        name: "The Second Dream",
        type: "main",
        note: "Reveals the Tenno's nature; unlocks Operator mode and the Focus school system. One of the most important story milestones.",
        keyGate: "Unlocks your Operator, Void Dash, Amp crafting via the Quills, and the Focus school system. Required before Eidolon hunting.",
        unlocks: ["Octavia's Anthem", "The Silver Grove"],
    },
    {
        name: "Octavia's Anthem",
        type: "warframe",
        note: "Unlocks Octavia; features a unique music-composition puzzle in the Orokin Moon. Requires The Second Dream.",
    },
    {
        name: "The Silver Grove",
        type: "warframe",
        note: "Unlocks Titania; introduces Apothic crafting and Silver Grove Specter encounters. Requires The Second Dream.",
    },
    {
        name: "Mask of the Revenant",
        type: "warframe",
        note: "Unlocks Revenant; set primarily on the Plains of Eidolon at night. Requires reaching Rank 2 (Observer) with The Quills syndicate, earned by hunting Eidolons and turning in Eidolon Shards.",
    },
    {
        name: "The War Within",
        type: "main",
        note: "Expands Operator Transference abilities and unlocks the Kuva Fortress, Sorties, and Kuva Siphons.",
        keyGate: "Unlocks Sorties, Kuva Siphons, the Kuva Fortress, and the Kuva Lich nemesis system.",
        unlocks: ["The Glast Gambit"],
    },
    {
        name: "The Glast Gambit",
        type: "warframe",
        note: "Unlocks Nidus; set in the Infested Salvage tileset. Requires The War Within.",
    },
    {
        name: "Sands of Inaros",
        type: "warframe",
        note: "Unlocks Inaros; requires a special vessel purchased from Baro Ki'Teer (100 Ducats + 25,000 Credits) or the Market bundle. Baro visits relays every two weeks — plan ahead. Requires Mastery Rank 5.",
    },
    {
        name: "Hidden Messages",
        type: "warframe",
        note: "Unlocks Mirage component blueprints by solving riddles hidden in Warframe's Codex entries. Requires the Pluto → Sedna Junction. The main Mirage blueprint must be purchased from the Market separately.",
    },
    {
        name: "Patient Zero",
        type: "side",
        note: "Unlocks the Mutalist Alad V boss fight on Eris, whose assassination node drops Mesa's Neuroptics blueprint. Requires the Pluto → Eris Junction.",
    },
    {
        name: "The Jordas Precept",
        type: "warframe",
        note: "Unlocks Atlas; an Archwing-heavy quest ending in the Jordas Golem assassination. Requires the Pluto → Eris Junction and an Archwing.",
    },
    {
        name: "Rising Tide",
        type: "main",
        note: "Build your personal Railjack ship in a Clan Dojo Dry Dock.",
        keyGate: "A Railjack is required to complete The New War and Call of the Tempestarii. Build this early.",
    },
    {
        name: "Call of the Tempestarii",
        type: "warframe",
        note: "Unlocks Sevagoth; a major Railjack story quest. Requires The Deadlock Protocol + a Railjack (Rising Tide) + Mastery Rank 4.",
    },
    {
        name: "Chains of Harrow",
        type: "main",
        note: "Unlocks Harrow; set aboard an Infested prison ship on the Defection tileset.",
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
        note: "Three-chapter quest series that directly leads into The New War. All three parts must be completed before The New War unlocks.",
        keyGate: "Chimera Prologue unlocks all Lua and Kuva Fortress Star Chart nodes. Completing all three chapters unlocks The New War.",
        chapters: [
            { name: "Chimera Prologue", note: "Adds the Ropalolyst assassination node to Jupiter. Also unlocks Lua and Kuva Fortress nodes on the Star Chart — needed for Steel Path completion." },
            { name: "Erra", note: "The Sentient invasion escalates; the Lotus's true allegiance is brought into question." },
            { name: "The Maker", note: "Final chapter of Prelude to War. Completing this unlocks The New War." },
        ],
    },
    {
        name: "The New War",
        type: "main",
        note: "Feature-length cinematic quest requiring both a Railjack and a Necramech. Unlocks Kahl-175 weekly missions and all post-New-War content.",
        keyGate: "Requires a Railjack (Rising Tide) and a Necramech (Isolation Vaults on Deimos). Build both well before attempting this quest.",
        unlocks: ["Angels of the Zariman", "Veilbreaker", "Jade Shadows"],
    },
    {
        name: "Veilbreaker",
        type: "side",
        note: "Unlocks Kahl-175 weekly missions and the Kahl mission hub. Requires The New War.",
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
        note: "Unlocks Höllvania (the 1999 open world), The Hex syndicate, and the Technocyte Coda adversary system.",
    },
    {
        name: "The Old Peace",
        type: "main",
        note: "Most recent main story quest (Update 41, December 2025).",
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
        summary: "All quests in chronological order of availability — main, side, and Warframe quests woven together.",
        content: (
            <>
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`rounded px-2 py-1 font-mono ${TYPE_BADGE_CLASS.main}`}>Main — primary storyline</span>
                    <span className={`rounded px-2 py-1 font-mono ${TYPE_BADGE_CLASS.side}`}>Side — unlocks systems & hubs</span>
                    <span className={`rounded px-2 py-1 font-mono ${TYPE_BADGE_CLASS.warframe}`}>Warframe — rewards a specific Warframe</span>
                </div>
                <ol className="list-none m-0 p-0">
                    {QUESTS.map((q, i) => (
                        <QuestEntry key={q.name} quest={q} index={i + 1} />
                    ))}
                </ol>
            </>
        ),
    },
    {
        id: "lich-sisters",
        title: "Nemesis Systems",
        summary: "Kuva Liches, Sisters of Parvos, and Technocyte Codas — personal nemesis enemies holding unique weapon variants.",
        content: (
            <>
                <P>
                    Warframe has three nemesis systems. Each lets you hunt a personal enemy, decode their
                    weaknesses, then choose to <B>Vanquish</B> them (claim their weapon/reward) or{" "}
                    <B>Convert</B> them (make them a mission ally). All three share this core loop but
                    differ significantly in how you crack their defenses.
                </P>

                <SectionHeading>Kuva Lich (Grineer)</SectionHeading>
                <Steps items={[
                    "Run a Grineer Exterminate mission on the Star Chart. A Larvling will spawn — down them and Mercy-kill with your Parazon. The weapon they carry is shown before you confirm, so choose carefully if farming a specific weapon.",
                    "Farm Murmurs by running missions inside their territory until three Requiem hints are revealed.",
                    "Equip the three matching Requiem mods on your Parazon in the correct order. When the Lich appears in a mission, let them downed you once to reveal if a slot is wrong.",
                    "Once the full order is confirmed, Vanquish (gain the weapon) or Convert (make them an ally you can trade).",
                ]} />

                <SectionHeading>Sister of Parvos (Corpus)</SectionHeading>
                <P>
                    Functionally identical to the Kuva Lich loop above, but created from Corpus missions.
                    Find a Candidate, Mercy-kill them to spawn the Sister, then use the same Requiem murmur
                    system to discover the correct 3-mod order. Sisters carry Tenet weapons instead of Kuva weapons.
                </P>
                <Callout>
                    <B>Oull</B> is a wildcard Requiem mod that fills any unknown slot — useful when you
                    have two slots confirmed. <B>Warning:</B> a wrong stab permanently increases your
                    Lich/Sister's level, making future missions harder.
                </Callout>

                <SectionHeading>Technocyte Coda (Höllvania / 1999)</SectionHeading>
                <P>
                    Unlocked after completing <B>The Hex</B>. The Coda is an Infested boy band — five
                    members named Zeke, Drillbit, Harddrive, DJ RoM, and Packet. Requires Mastery Rank 5
                    and no currently active Lich or Sister.
                </P>
                <Steps items={[
                    "In a Höllvania Exterminate, Hell-Scrubs, or Legacyte mission, a Techrot enemy drops a unique item. Pick it up and carry it to a virus-riddled PC in the mission to run \"Technocyte-Coda.exe\". Complete the hacking puzzle to spawn your Coda.",
                    "You can extract immediately after creation — you do not need to finish the mission.",
                    "Farm Antivirus Mods from Techrot Bounties at Höllvania Mall. There are 8 total. Unlike Requiem mods, you only need 1 correct mod equipped in any of your 3 slots — position does not matter.",
                    "Confront your Coda in Höllvania missions (overtaken nodes glow green). Each encounter is a \"duet\" — two random members of the band fight you together.",
                    "Each successful stab adds 5% to the Malware Disinfection bar (up to 35% with Potency Mods). Failing a stab has no penalty — just no progress.",
                    "Once the bar reaches 100%, the Coda flees to Earth Proxima for a final Railjack Empyrean Skirmish showdown.",
                    "Vanquish (earn resources to buy Coda weapons from Eleanor) or Convert (ally or trade at Crimson Branch in the Dojo).",
                ]} />
                <TableWrap>
                    <table className="w-full text-xs min-w-[480px]">
                        <thead className="bg-slate-900/60">
                            <tr>
                                <th className="text-left px-3 py-2.5 text-slate-300">Feature</th>
                                <th className="text-left px-3 py-2.5 text-slate-300">Kuva Lich / Sister</th>
                                <th className="text-left px-3 py-2.5 text-slate-300">Technocyte Coda</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ["Mod system", "3 Requiem mods, correct order required", "1 of 8 Antivirus mods, any slot"],
                                ["Fail penalty", "Nemesis permanently levels up", "No penalty — just no progress"],
                                ["Passive effect", "Taxes resources from influenced nodes", "Cosmetic Technocyte Cyst on your Warframes"],
                                ["Final fight", "Ground mission in Proxima space", "Railjack Empyrean Skirmish"],
                                ["Weapon source", "Drops directly on Vanquish", "Resource from Vanquish → buy from Eleanor"],
                            ].map(([f, ks, tc]) => (
                                <tr key={f} className="border-t border-slate-800/60">
                                    <td className="px-3 py-2 font-semibold text-slate-200">{f}</td>
                                    <td className="px-3 py-2 text-slate-400">{ks}</td>
                                    <td className="px-3 py-2 text-slate-300">{tc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TableWrap>
            </>
        ),
    },
    {
        id: "eidolons",
        title: "Eidolon Hunting",
        summary: "Hunting the three Eidolons on the Plains of Eidolon is the primary way to earn Arcanes and Quills Standing.",
        content: (
            <>
                <P>
                    Eidolons are massive boss creatures that roam the Plains of Eidolon (Earth) only at
                    night. A full day/night cycle lasts about 50 real-time minutes; the huntable night
                    window is roughly 9 minutes — efficiency matters a lot.
                </P>

                <SectionHeading>Requirements before you start:</SectionHeading>
                <Steps items={[
                    "Complete The Second Dream to unlock your Operator.",
                    "Build an Amp — the default Mote Amp is very weak. Upgrade via The Quills syndicate in Cetus as soon as possible. The Amp is your primary tool for stripping Eidolon shields.",
                    "Choose a support Warframe. Trinity (energy restore + shield drain prevention), Harrow (damage buff + critical chance + shield regen lock), and Wisp (healing + speed buff) are the most common picks.",
                    "Equip the Madurai Focus school for bonus Amp damage, or Zenurik if you need the energy sustain.",
                ]} />

                <SectionHeading>Lure mechanics — the most confusing part for new hunters:</SectionHeading>
                <P>
                    Capturing an Eidolon (rather than killing it) is required to spawn the next Eidolon
                    in the chain and to earn Brilliant Eidolon Shards. Lures are what make a capture possible.
                </P>
                <Steps items={[
                    "Locate a Lure on the Plains — they appear as glowing yellow objects scattered across the field at night.",
                    "Shoot the Lure once to activate it, then hack it to take control of it.",
                    "Find Vomvalysts — the small, floating Eidolon fragments that drift around the Plains. Shoot them near your Lure until they transition into their spectral (ghost) form, at which point the Lure will automatically absorb them.",
                    "After absorbing roughly 3 Vomvalysts, the Lure shifts from yellow to blue, indicating it is fully charged.",
                    "Take a charged (blue) Lure next to the Eidolon and position it near a Synovia (weak point / glowing joint) that you have already destroyed. The Lure will tether to it, preventing the Eidolon from regenerating that limb's shield.",
                    "Repeat with additional Lures until all Synovias are destroyed and the required number of charged Lures are attached, then deliver the killing blow with your Operator Amp to trigger a capture.",
                ]} />
                <Callout color="amber">
                    You need <B>2 fully charged Lures</B> attached to capture the Teralyst, and <B>3 fully charged Lures</B>{" "}
                    for both the Gantulyst and Hydrolyst. Running into a fight without pre-charged Lures
                    is the number-one cause of failed captures. Charge them before the Eidolon spawns.
                </Callout>

                <SectionHeading>Kill order and chain progression:</SectionHeading>
                <Steps items={[
                    "Teralyst (Terry) — easiest. Capturing it causes the Gantulyst to spawn at the Lake.",
                    "Gantulyst (Gary) — harder. Requires a captured Teralyst to appear. Capturing it spawns the Hydrolyst.",
                    "Hydrolyst (Harry) — hardest. Requires a captured Gantulyst. Drops the best rewards and Arcanes.",
                ]} />
                <P>
                    For each Eidolon: use <B>Void damage</B> (Operator Amp) to strip its rotating shield,
                    then switch to your primary weapon to destroy the glowing <B>Synovias</B> before the
                    shield comes back. Shields regenerate quickly unless you have a Trinity or Harrow
                    suppressing it.
                </P>
                <Callout>
                    <B>Brilliant Eidolon Shards</B> only drop from <B>captures</B>, not kills. They are
                    specifically needed for purchasing Way-Bound passive nodes in your Focus school — so
                    always aim to capture rather than just kill Eidolons.
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
                    <B>Steel Path</B> adds +100 to enemy level scaling and +2,500% to enemy armor, shields,
                    and health. It unlocks by completing every node on the Star Chart that was accessible
                    before The New War (Zariman, Deimos labs, and Höllvania nodes are not required).
                </P>

                <SectionHeading>Commonly missed nodes that block Steel Path unlock:</SectionHeading>
                <Bullets items={[
                    <>
                        <B>Lua nodes</B> — only become available after completing Chimera Prologue (part of Prelude to War). Very easy to miss if you delay that quest.
                    </>,
                    <>
                        <B>Kuva Fortress nodes</B> — same unlock condition as Lua (requires Chimera Prologue).
                    </>,
                    <>
                        <B>Ropalolyst (Jupiter)</B> — quest-locked assassination node, also unlocked by Chimera Prologue.
                    </>,
                    <>
                        <B>Tyana Pass (Mars)</B> — a quest-locked node many players skip past without realizing.
                    </>,
                    <>
                        <B>Oro (Earth, Vay Hek assassination)</B> — requires Mastery Rank 5 to access.
                    </>,
                    <>
                        <B>Saya's Visions (Earth)</B> — node tied to the Plains of Eidolon, unlocked via Saya's Vigil.
                    </>,
                    <>
                        <B>Deepmines (Venus)</B> — cave network bounties added in Update 40. A bug previously caused these to incorrectly block Steel Path unlock, patched in Hotfix 38.5.3. They are not confirmed to be a hard blocker currently, but players going for full Venus completion on Steel Path will still need to complete these bounties. If Venus shows incomplete, check with <B>Nightcap</B> in Fortuna.
                    </>,
                ]} />
                <Callout color="amber">
                    Speak to <B>Teshin</B> in any Relay and select "Steel Path?" — he will list every
                    node you're still missing and why. Use this before hunting manually.
                </Callout>

                <SectionHeading>Unique Steel Path rewards:</SectionHeading>
                <Bullets items={[
                    "Steel Essence — primary currency, earned from missions and Teshin's weekly Steel Path Honors rotation.",
                    "Arcane Adapters — bought from Teshin's shop using Steel Essence.",
                    "Flat 2,000 Kuva per mission completion on any node — efficient passive Kuva farming.",
                    "Acolytes — elite enemies that spawn randomly during missions, drop Steel Essence on kill, and have fixed elemental weaknesses.",
                ]} />
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
                    mission area, destroying Corpus or Grineer objectives while boarding enemy crewships
                    on foot.
                </P>
                <SectionHeading>Getting started:</SectionHeading>
                <Steps items={[
                    "Join a Clan with a Dry Dock, or build your own Dry Dock room in your Clan Dojo.",
                    "Complete the Rising Tide quest — it provides all the Railjack component blueprints you need.",
                    "Build the Fuselage, Propulsion, and Hull sections, then combine them in the Dry Dock.",
                    "Upgrade components and weapons as you complete missions and earn wreckage drops.",
                ]} />
                <P>
                    You can join public Railjack missions as a crew member without owning a ship — just
                    enter any Railjack node from the Star Chart and select a public squad.
                </P>
                <Callout>
                    <B>Call of the Tempestarii</B> and <B>The New War</B> both require a Railjack.
                    Complete Rising Tide early so you're not scrambling before those quests.
                </Callout>
            </>
        ),
    },
    {
        id: "necramech",
        title: "Necramech Acquisition",
        summary: "A combat mech required for The New War. Parts drop from Isolation Vaults on Deimos.",
        content: (
            <>
                <P>
                    <B>Necramechs</B> are heavy combat mechs piloted by your Operator. Two variants exist:
                    Voidrig (offense/turret) and Bonewidow (defense/melee). Either satisfies The New War requirement.
                </P>
                <SectionHeading>Building one from parts:</SectionHeading>
                <Steps items={[
                    "Complete Heart of Deimos to unlock the Necralisk and Cambion Drift.",
                    "Reach Entrati Standing Rank 2 (Stranger) to unlock Isolation Vault bounties.",
                    "Run Isolation Vault bounties — Necramech component parts drop from vault enemies and the Jugulus boss.",
                    "Purchase the main Necramech blueprint from Father (Entrati vendor in the Necralisk).",
                    "Build the Systems, Carapace, Capsule, and Engine components, then assemble the main blueprint. Note: Orokin Matrix (required) only drops from Tier 3 Isolation Vaults.",
                ]} />
                <Callout color="amber">
                    <B>Many players recommend buying your first Necramech with Platinum</B> rather than
                    farming all the parts — it can take a very long time to collect everything, and The
                    New War is gated behind having one. A practical approach is to sell unneeded Prime
                    parts, mods, or Rivens on <B>warframe.market</B> to earn the Platinum needed to
                    simply buy one from the in-game Market. For players with limited time, this is often
                    the most efficient path forward.
                </Callout>
            </>
        ),
    },
    {
        id: "focus",
        title: "Focus Schools",
        summary: "Passive ability trees for your Operator unlocked after The Second Dream. Choose your primary school early.",
        content: (
            <>
                <P>
                    There are five Focus schools, each giving different passive bonuses to your Operator
                    and Warframe. Focus is earned by killing enemies while a <B>Convergence Orb</B> is
                    active (grants an 8× multiplier for a short window).
                </P>
                <TableWrap>
                    <table className="w-full text-xs min-w-[420px]">
                        <thead className="bg-slate-900/60">
                            <tr>
                                <th className="text-left px-3 py-2.5 text-slate-300">School</th>
                                <th className="text-left px-3 py-2.5 text-slate-300">Identity</th>
                                <th className="text-left px-3 py-2.5 text-slate-300">Key Passive</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ["Zenurik", "Energy / caster", "Energizing Dash — Void Dash restores Warframe energy over time"],
                                ["Vazarin", "Healing / support", "Protective Sling — Void Sling through allies heals them and grants brief invulnerability"],
                                ["Naramon", "Combo / melee", "Power Spike — melee combo counter decays slowly instead of resetting"],
                                ["Unairu", "Armor strip / survival", "Caustic Strike — radial armor strip on Void Blast"],
                                ["Madurai", "Amp damage / Eidolons", "Phoenix Talons — Amp damage bonus after exiting Void Mode"],
                            ].map(([school, identity, passive]) => (
                                <tr key={school} className="border-t border-slate-800/60">
                                    <td className="px-3 py-2 font-semibold text-slate-100">{school}</td>
                                    <td className="px-3 py-2 text-slate-400">{identity}</td>
                                    <td className="px-3 py-2 text-slate-300">{passive}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TableWrap>
                <P>
                    Each school has two <B>Way-Bound</B> passives that remain active permanently even after
                    switching to a different school. Once unlocked, they benefit all schools.
                </P>
                <TableWrap>
                    <table className="w-full text-xs min-w-[500px]">
                        <thead className="bg-slate-900/60">
                            <tr>
                                <th className="text-left px-3 py-2.5 text-slate-300">School</th>
                                <th className="text-left px-3 py-2.5 text-slate-300">Way-Bound 1</th>
                                <th className="text-left px-3 py-2.5 text-slate-300">Way-Bound 2</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ["Zenurik", "Void Flow — increases Operator Void Energy capacity", "Temporal Step — grants an additional Void Sling charge"],
                                ["Vazarin", "Protective Sling — ally heal and invulnerability on Void Sling", "Rejuvenating Tides — Operator health regenerates faster after damage"],
                                ["Naramon", "Shadow Step — Void Sling briefly cloaks your Warframe", "Surging Dash — Void Sling adds to Melee Combo Counter"],
                                ["Unairu", "Stone Skin — increases Operator armor while not in Void Mode", "Poise — Operator becomes immune to knockdown"],
                                ["Madurai", "Phoenix Penumbra — entering Void Mode briefly cloaks your Warframe", "Swift Specter — Specters summon faster and last longer"],
                            ].map(([school, wb1, wb2]) => (
                                <tr key={school} className="border-t border-slate-800/60">
                                    <td className="px-3 py-2 font-semibold text-slate-100">{school}</td>
                                    <td className="px-3 py-2 text-slate-300">{wb1}</td>
                                    <td className="px-3 py-2 text-slate-300">{wb2}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TableWrap>
                <Callout>
                    <B>Brilliant Eidolon Shards are only required for Way-Bound node purchases</B> — regular
                    school progression uses Focus points earned in-mission. Prioritize capturing (not just
                    killing) Eidolons to stockpile Brilliant Shards specifically for Way-Bound unlocks.
                </Callout>
                <P>
                    <B>Zenurik</B> is the most universally useful school for beginners — free energy
                    removes dependence on Energy Pads. <B>Madurai</B> is essential for serious Eidolon
                    hunting. Unlock Way-Bounds from multiple schools over time as they stack permanently.
                </P>
            </>
        ),
    },
    {
        id: "farming",
        title: "Common Farming Strategies",
        summary: "Best nodes for resources, and which Warframes make loot farming dramatically more efficient.",
        content: (
            <>
                <SectionHeading>Farming Warframes & required mods:</SectionHeading>
                <P>
                    These Warframes have abilities that cause enemies to drop additional loot. Combining
                    two or more in a squad multiplies yield significantly.
                </P>
                <Bullets items={[
                    <>
                        <B>Nekros</B> — <Tag>Desecrate</Tag> (innate ability, no augment needed) forces
                        dead enemies to drop additional loot. Keep him in range of corpses.
                        Key mods: <Tag>Stretch</Tag> / <Tag>Overextended</Tag> for range so Desecrate
                        reaches more bodies, <Tag>Equilibrium</Tag> to convert health orbs into energy
                        so he never runs out.
                    </>,
                    <>
                        <B>Hydroid</B> — <Tag>Pilfering Swarm</Tag> augment mod (from Steel Meridian or
                        Red Veil syndicates) makes Tentacle Swarm drop extra loot from grabbed enemies.
                        Key mods: <Tag>Pilfering Swarm</Tag> (required), <Tag>Stretch</Tag> /{" "}
                        <Tag>Overextended</Tag> for tentacle reach, <Tag>Streamline</Tag> /{" "}
                        <Tag>Fleeting Expertise</Tag> for energy efficiency.
                    </>,
                    <>
                        <B>Khora</B> — <Tag>Pilfering Strangledome</Tag> augment mod (from New Loka or
                        Red Veil syndicates) gives Strangledome a chance to double enemy loot drops.
                        Generally considered the strongest loot Warframe.
                        Key mods: <Tag>Pilfering Strangledome</Tag> (required), <Tag>Stretch</Tag> /{" "}
                        <Tag>Overextended</Tag> for dome size, duration mods to keep it active longer.
                    </>,
                    <>
                        <B>Smeeta Kavat</B> (companion) — the <Tag>Charm</Tag> mod randomly doubles all
                        resource pickups for 30 seconds. Stacks with Nekros/Hydroid/Khora and Resource
                        Boosters. One of the most impactful farming companions in the game.
                    </>,
                ]} />
                <Callout color="green">
                    <B>Optimal stack:</B> Nekros + Khora (or Hydroid) in the same squad + Smeeta Kavat
                    + an active Resource Booster. Run any high-density survival or defense node and
                    kills will yield dramatically more loot per run.
                </Callout>

                <SectionHeading>Prime Relics by tier:</SectionHeading>
                <Bullets items={[
                    "Lith — Hepit (Void, Capture): fastest Lith farm. Everest (Earth, Excavation) for variety.",
                    "Meso — Io (Jupiter, Defense): popular leveling node. Ukko (Void, Capture) for quick solo runs.",
                    "Neo — Hydron (Sedna, Defense): go-to XP and Neo node. Xini (Eris, Interception) drops both Neo and Axi.",
                    "Axi — Mot (Void, Survival), Apollo (Lua, Disruption), Xini (Eris, Interception).",
                ]} />

                <SectionHeading>Credits:</SectionHeading>
                <Bullets items={[
                    "Neso (Neptune, The Index) — ~200k per high-risk run; the standard credit farm.",
                    "Profit-Taker Phase 4 (Orb Vallis) — large credit payout plus Toroid drops. Requires Vox Solaris rank 4.",
                ]} />

                <SectionHeading>Endo (mod leveling):</SectionHeading>
                <Bullets items={[
                    "Arbitrations — rotating endless missions with scaling Endo rewards.",
                    "Apollo (Lua, Disruption) — consistent Endo and good relic cracking simultaneously.",
                    "Vodyanoi (Sedna, Interception, Steel Path) — fastest Endo/hour, requires Steel Path.",
                ]} />

                <SectionHeading>Kuva (Riven rerolling):</SectionHeading>
                <Bullets items={[
                    "Taveuni (Kuva Fortress, Survival) — the primary dedicated Kuva farm.",
                    "Kuva Floods — 1,200 Kuva each; found on rotating Grineer nodes.",
                    "Kuva Siphons — 550 Kuva each; lower time per run.",
                    "Steel Path (any node) — flat 2,000 Kuva added to every mission completion.",
                ]} />

                <SectionHeading>Common resources:</SectionHeading>
                <Bullets items={[
                    "Plastids — Ophelia (Uranus), Piscinas (Saturn), Memphis (Phobos). All Survival.",
                    "Neurodes — Tikal (Earth, Excavation), Magnacidium (Deimos, Survival).",
                    "Neural Sensors — Io or Sinai (Jupiter, Defense), Elara (Jupiter, Survival).",
                    "Orokin Cells — Gabii (Ceres, Survival), Seimeni (Ceres, Defense), Titan (Saturn, Survival).",
                    "Argon Crystal — Oxomoco (Void, Exterminate) or Marduk (Void, Sabotage). Argon decays after ~24h real-time — farm just before you need it.",
                    "Polymer Bundle — Ophelia or Assur (Uranus, Survival).",
                    "Nano Spores — Ophelia (Uranus), or any Deimos/Eris survival node.",
                ]} />
            </>
        ),
    },
    {
        id: "modding",
        title: "Modding Basics",
        summary: "How the mod system works — the single most important system to understand for building effective Warframes and weapons.",
        content: (
            <>
                <P>
                    Every Warframe and weapon has <B>mod slots</B>. Mods fill those slots with stats or
                    bonuses, but each mod has a <B>drain</B> value — your total drain cannot exceed your
                    mod capacity (base 30 for all gear).
                </P>
                <SectionHeading>Doubling your mod capacity:</SectionHeading>
                <Bullets items={[
                    <>Install an <B>Orokin Reactor</B> in a Warframe or <B>Orokin Catalyst</B> in a weapon to double capacity from 30 to 60. The community calls these \"Potatoes.\" Free ones appear occasionally via alerts, Nightwave rewards, and login bonuses — always install them on your primary gear.</>,
                    "The Aura mod slot (Warframe only) adds to your capacity rather than spending it, as long as the Aura's polarity matches the slot.",
                ]} />
                <SectionHeading>Polarity slots:</SectionHeading>
                <P>
                    A slot with a polarity symbol <B>halves</B> the drain of a matching mod (rounded up).
                    A mismatched mod in a polarity slot costs <B>more</B> instead. Use <B>Forma</B> to
                    add or change a slot's polarity — but Forma resets the item to rank 0 and you must
                    level it again.
                </P>
                <SectionHeading>Essential mods to prioritize first:</SectionHeading>
                <TableWrap>
                    <table className="w-full text-xs min-w-[360px]">
                        <thead className="bg-slate-900/60">
                            <tr>
                                <th className="text-left px-3 py-2.5 text-slate-300">Mod</th>
                                <th className="text-left px-3 py-2.5 text-slate-300">Used In</th>
                                <th className="text-left px-3 py-2.5 text-slate-300">Effect (max rank)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ["Serration", "Rifle", "+165% base damage"],
                                ["Hornet Strike", "Pistol", "+220% base damage"],
                                ["Pressure Point", "Melee", "+120% base damage"],
                                ["Point Blank", "Shotgun", "+90% base damage"],
                                ["Vitality", "Warframe", "+440% health"],
                                ["Redirection", "Warframe", "+440% shields"],
                                ["Steel Fiber", "Warframe", "+110% armor"],
                                ["Continuity", "Warframe", "+30% ability duration"],
                                ["Streamline", "Warframe", "+30% ability efficiency"],
                                ["Stretch", "Warframe", "+45% ability range"],
                            ].map(([mod, type, effect]) => (
                                <tr key={mod} className="border-t border-slate-800/60">
                                    <td className="px-3 py-2 font-semibold text-slate-100">{mod}</td>
                                    <td className="px-3 py-2 text-slate-400">{type}</td>
                                    <td className="px-3 py-2 text-slate-300">{effect}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TableWrap>
                <Callout>
                    <B>Corrupted mods</B> (from Orokin Derelict vaults) offer a powerful bonus paired with
                    a penalty — e.g., <Tag>Blind Rage</Tag> gives huge ability strength but reduces efficiency.
                    These are core to many endgame builds. <B>Primed mods</B> (from Baro Ki'Teer) are
                    simply stronger versions of standard mods with extra ranks — always equip them over
                    the base version when available.
                </Callout>
            </>
        ),
    },
    {
        id: "daily-weekly",
        title: "Daily & Weekly Loop",
        summary: "What to do each day and week to maximize standing, rewards, and passive progress.",
        content: (
            <>
                <SectionHeading>Daily activities:</SectionHeading>
                <Bullets items={[
                    <><B>Daily Sortie</B> — three chained missions with escalating difficulty modifiers. Rewards include Riven mods, Endo, Kuva, and Ayatan sculptures. Requires completing The War Within.</>,
                    <><B>Cephalon Simaris Daily Synthesis Target</B> — scan the target creature with a Synthesis Scanner (not a Codex Scanner) for bonus Simaris Standing. Used to buy mods, Blueprints, and Sanctuary Onslaught entries.</>,
                    <><B>Maroo's Bazaar Ayatan Run</B> — Maroo offers a short mission once per day rewarding an Ayatan Sculpture. Fill them with Ayatan Stars and trade them to Maroo for Endo, or sell filled sculptures to other players for Platinum.</>,
                    <><B>Syndicate missions</B> — run missions on nodes aligned with your active syndicates while wearing their Sigil to earn Standing up to your daily cap (Mastery Rank × 1,000 + 4,000).</>,
                ]} />
                <SectionHeading>Weekly activities:</SectionHeading>
                <Bullets items={[
                    <><B>Nightwave challenges</B> — complete weekly and daily Nightwave tasks to earn Nightwave Credits for exclusive cosmetics, Orokin Reactors/Catalysts, Nitain Extract, and more from the Nightwave Offerings store.</>,
                    <><B>Steel Path Honors rotation</B> — Teshin's shop stock changes weekly. Spend Steel Essence on Arcane Adapters, exclusive mods, and cosmetics.</>,
                    <><B>Archon Hunt</B> — three-mission weekly set culminating in an Archon boss fight. Rewards Archon Shards (powerful passive stat boosts you socket into Warframes) and Lua Thrax Plasm.</>,
                    <><B>Kahl-175 missions</B> (post-New War, requires Veilbreaker) — weekly missions earning Pathos Clamps and Veilbreaker resources. Used to buy Grendel Prime parts and other items.</>,
                    <><B>Deep Archimedea</B> (post-Whispers in the Walls) — high-difficulty weekly missions with randomized modifiers. Rewards Cavia Standing and Invigoration charges.</>,
                ]} />
                <Callout color="green">
                    <B>New player priority:</B> Do your Daily Sortie every day for Riven mods (sell unwanted
                    ones for Platinum). Complete Nightwave challenges every week for free Reactors and
                    Catalysts — these alone can save you significant Platinum over time.
                </Callout>
            </>
        ),
    },
    {
        id: "trading",
        title: "Trading & Platinum",
        summary: "How to earn Platinum without spending real money — the foundation of Warframe's free-to-play economy.",
        content: (
            <>
                <P>
                    Platinum is Warframe's premium currency, but it can be earned entirely for free by
                    trading with other players. You do not need to spend real money to obtain Warframes,
                    weapons, or cosmetics — though buying Platinum directly speeds things up.
                </P>
                <SectionHeading>What to sell:</SectionHeading>
                <Bullets items={[
                    <><B>Prime Warframe and weapon parts</B> — farm Void Fissure missions, crack relics, and sell the rare/uncommon drops. Check warframe.market for current going rates before listing.</>,
                    <><B>Riven mods</B> — rewarded from Daily Sorties. Unveiled Rivens for popular weapons (Kuva Bramma, Rubico Prime, Catchmoon, etc.) can sell for large amounts. Always unveil before listing.</>,
                    <><B>Arcanes</B> — crafted from Eidolon Shards or dropped from Eidolons. High-tier Arcanes like Arcane Energize and Arcane Grace are consistently valuable.</>,
                    <><B>Syndicate mods and weapons</B> — buy them from your aligned syndicates and sell to players in opposing factions who can't obtain them directly.</>,
                    <><B>Ayatan Sculptures</B> (fully filled with stars) — trade to other players for Platinum, or exchange with Maroo for Endo if you just need the Endo.</>,
                ]} />
                <SectionHeading>How to trade:</SectionHeading>
                <Steps items={[
                    <>List items on <B>warframe.market</B> — the standard third-party trading site. Set your account status to Online in-game while listings are active so buyers can invite you.</>,
                    "Trading happens at a Clan Dojo Trading Post or at Maroo's Bazaar (Asteroid, Mars). Both players must be present.",
                    "Both players pay a Credit tax per trade. Tax scales with item value — high-value Riven trades cost millions of Credits, so keep a large Credit buffer.",
                ]} />
                <Callout color="amber">
                    <B>Never pay Platinum for mods or Prime parts that drop in-game.</B> These are always
                    tradeable from other players at market prices, which are nearly always far lower than
                    the in-game Market. The in-game Market price is a convenience premium, not the fair price.
                </Callout>
            </>
        ),
    },
    {
        id: "syndicates",
        title: "Syndicates",
        summary: "Faction reputation systems that reward exclusive mods, augments, and weapons. Which ones you choose early matters.",
        content: (
            <>
                <P>
                    Syndicates are factions you earn <B>Standing</B> with by wearing their Sigil during
                    missions and completing their specific tasks. Higher ranks unlock better rewards —
                    including Warframe augment mods that dramatically change playstyle.
                </P>
                <P>
                    The six major syndicates exist in opposing pairs. Supporting one faction also penalizes
                    its enemy:
                </P>
                <TableWrap>
                    <table className="w-full text-xs min-w-[500px]">
                        <thead className="bg-slate-900/60">
                            <tr>
                                <th className="text-left px-3 py-2.5 text-slate-300">Syndicate</th>
                                <th className="text-left px-3 py-2.5 text-slate-300">Opposes</th>
                                <th className="text-left px-3 py-2.5 text-slate-300">Notable Rewards</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ["Steel Meridian", "Perrin Sequence", "Pilfering Swarm, Despoil augments. Weapons: Vaykor Hek, Vaykor Marelok"],
                                ["Arbiters of Hexis", "Cephalon Suda", "Eternal War, Accumulating Whirlwind augments. Weapons: Telos Boltace"],
                                ["Cephalon Suda", "Arbiters of Hexis", "Detect Vulnerability augment. Weapons: Synoid Gammacor, Prisma Shade"],
                                ["New Loka", "Red Veil", "Pilfering Strangledome, Healing Return augments. Weapons: Sancti Tigris"],
                                ["Red Veil", "New Loka", "Augur Seeker, Blood for Blood augments. Weapons: Rakta Ballistica"],
                                ["Perrin Sequence", "Steel Meridian", "Seeker Volley, Covert Lethality augments. Weapons: Secura Penta"],
                            ].map(([s, o, r]) => (
                                <tr key={s} className="border-t border-slate-800/60">
                                    <td className="px-3 py-2 font-semibold text-slate-100">{s}</td>
                                    <td className="px-3 py-2 text-slate-400">{o}</td>
                                    <td className="px-3 py-2 text-slate-300">{r}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TableWrap>
                <Callout color="amber">
                    <B>Pick two non-opposing syndicates</B> to level simultaneously — equip a primary Sigil
                    for full Standing and a secondary Sigil for partial. <B>New Loka</B> and{" "}
                    <B>Steel Meridian</B> are popular early choices since they sell the farming augments
                    Pilfering Strangledome and Pilfering Swarm respectively.
                </Callout>
                <P>
                    Your daily Standing cap is <B>Mastery Rank × 1,000 + 4,000</B>. Wearing the Sigil
                    in your Warframe's Appearance tab is required — Standing is not earned without it.
                </P>
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
        <div className="space-y-4 sm:space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5">
                <div className="text-xl font-semibold text-slate-100">Handbook</div>
                <div className="mt-1 text-sm text-slate-400">
                    Explanations of game mechanics that commonly gate progression or cause confusion.
                </div>
                {/* Scrollable tab bar — scrolls horizontally on mobile, wraps on larger screens */}
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
                    {SECTIONS.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveId(s.id)}
                            className={
                                s.id === activeId
                                    ? "shrink-0 rounded-lg border border-slate-500 bg-slate-700 px-3 py-2 text-xs font-medium text-slate-100 transition-colors"
                                    : "shrink-0 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
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
