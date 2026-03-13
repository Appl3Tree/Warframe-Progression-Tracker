// src/pages/Handbook.tsx
//
// Player guidance for confusing or gate-keeping game mechanics.
// This page explains the "why" and "how" of Warframe systems
// that block progression or are commonly misunderstood.
//
// Content is static — no store reads needed.

type Section = {
    id: string;
    title: string;
    summary: string;
    content: React.ReactNode;
};

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

const SECTIONS: Section[] = [
    {
        id: "quest-order",
        title: "Recommended Quest Order",
        summary: "Warframe's story quests unlock major systems and Warframes. Doing them in the wrong order causes confusion.",
        content: (
            <>
                <P>
                    Quests must be completed in a specific order because later quests require earlier ones, and several
                    major game systems are entirely locked until a quest unlocks them.
                </P>
                <P>Recommended critical path:</P>
                <Steps items={[
                    "Vor's Prize — tutorial, unlocks the Star Chart",
                    "Once Awake — unlocks Corpus missions",
                    "The Archwing — unlocks Archwing missions and crafting",
                    "Stolen Dreams → The New Strange — Chroma and Synoid weapons",
                    "Natah — required for The Second Dream",
                    "The Second Dream — major story beat; unlocks Operator mode and Focus",
                    "The War Within — expands Operator abilities; unlocks Kuva Siphons",
                    "Chains of Harrow — unlocks Harrow",
                    "Apostasy Prologue → The Sacrifice — unlocks Excalibur Umbra",
                    "Saya's Vigil → Vox Solaris → Heart of Deimos — open-world prereqs",
                    "The Deadlock Protocol — unlocks Protea and Corpus Ship Railjack tiles",
                    "Call of the Tempestarii — Railjack story and Sevagoth",
                    "The New War — major content gate; unlocks Kahl missions, Veilbreaker",
                    "Whispers in the Walls — unlocks Sanctum Anatomica and Cavia",
                    "Jade Shadows — unlocks Jade",
                    "The Duviri Paradox — unlocks Duviri and Incarnon system",
                ]} />
                <Callout>
                    <B>Tip:</B> The Second Dream and The War Within are the most important gates.
                    Many endgame systems (Focus, Kuva weapons, Operator amps) are locked until these are done.
                </Callout>
            </>
        )
    },
    {
        id: "lich-sisters",
        title: "Kuva Lich & Sister of Parvos",
        summary: "Nemesis systems that let you earn exclusive weapons. The parazon combo system is the main point of confusion.",
        content: (
            <>
                <P>
                    <B>Kuva Liches</B> (Grineer) and <B>Sisters of Parvos</B> (Corpus) are personal nemesis enemies
                    that hold a unique weapon variant. Each has a random element bonus (20–60%) on their weapon.
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
                    "When the Lich/Sister appears in a mission, let them downed you once to reveal which slot is wrong",
                    "Repeat until the order is confirmed, then Vanquish (keep the weapon) or Convert (make them an ally)",
                ]} />
                <Callout>
                    <B>Oull</B> is a wildcard Requiem mod that fits any slot. Useful for finishing off a Lich
                    when you have two slots confirmed but don't have the third mod.
                </Callout>
            </>
        )
    },
    {
        id: "eidolons",
        title: "Eidolon Hunting",
        summary: "Hunting the three Eidolons on the Plains of Eidolon is the primary way to earn Arcanes and Quill Standing.",
        content: (
            <>
                <P>
                    Eidolons are massive boss creatures that roam the Plains of Eidolon (Earth) only at night.
                    A full night cycle lasts about 50 minutes real-time (9 minutes for the plains portion that matters).
                </P>
                <P><B>Requirements before you start:</B></P>
                <Steps items={[
                    "Complete The Second Dream to unlock your Operator",
                    "Build or earn an Amp (Operator weapon) — the base Mote Amp is very weak; upgrade it via the Quills",
                    "A Warframe with decent survivability or support (Trinity, Harrow, and Wisp are popular)",
                    "Lures from Vomvalysts — you need 3 charged Lures attached to capture (not kill) the Eidolon",
                ]} />
                <P><B>Kill order and progression:</B></P>
                <Steps items={[
                    "Teralyst (Terry) — easiest; 1 Lure to capture",
                    "Gantulyst (Gary) — requires a captured Teralyst to spawn; 2 Lures",
                    "Hydrolyst (Harry) — requires a captured Gantulyst; 3 Lures",
                ]} />
                <P>
                    For each Eidolon: strip its shield with Void damage (Operator Amp),
                    then destroy its glowing Synovias with your primary weapon. Eidolon shields regenerate unless
                    you have a Trinity/Harrow keeping them from healing.
                </P>
                <Callout>
                    <B>Brilliant Eidolon Shards</B> come from captures (not kills). Captures are required for
                    Focus school leveling beyond the base ranks.
                </Callout>
            </>
        )
    },
    {
        id: "steel-path",
        title: "Steel Path",
        summary: "A harder replay of every Star Chart mission. Requires clearing the full Star Chart first.",
        content: (
            <>
                <P>
                    <B>Steel Path</B> adds +100 to enemy level scaling and +2500% to enemy armor, shields, and health.
                    It is unlocked by completing every node on the Star Chart (all planets, all junctions).
                </P>
                <P><B>Unique rewards:</B></P>
                <Steps items={[
                    "Steel Essence — the primary currency, earned from missions and Steel Path Honors weekly rotations",
                    "Arcane Adapters (from Teshin's Steel Path Honors shop)",
                    "Kuva — 2,000 from each mission; efficient Kuva farming without requiring a Kuva Fortress survival",
                    "Exclusive cosmetics and the Steel Path completion badge",
                ]} />
                <P>
                    <B>Acolytes</B> spawn randomly during Steel Path missions and drop Steel Essence on kill.
                    Each Acolyte has a fixed elemental weakness — checking the Warframe wiki before a session helps.
                </P>
                <Callout>
                    Steel Path is not required for most endgame content, but it provides the best resource density
                    and is the primary way to earn Steel Essence for Teshin's shop.
                </Callout>
            </>
        )
    },
    {
        id: "railjack",
        title: "Railjack",
        summary: "Space-combat mode. Requires building your own Railjack ship in a Clan Dojo Dry Dock.",
        content: (
            <>
                <P>
                    <B>Railjack</B> is Warframe's space-combat system. You pilot a large ship through a mission
                    area, destroying Corpus or Grineer objectives while boarding enemy crewships.
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
        )
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
                    Necramechs require <B>Orokin Matrix</B> to build, which drops from Tier 3 Isolation Vaults.
                    Plan on running many Vault bounties before you have all the parts.
                </P>
                <Callout>
                    A basic Necramech is required to complete <B>The New War</B> quest.
                    Start farming parts before you're ready to start that quest.
                </Callout>
            </>
        )
    },
    {
        id: "focus",
        title: "Focus Schools",
        summary: "Passive ability trees for your Operator unlocked after The Second Dream. Choose a primary school early — switching is slow.",
        content: (
            <>
                <P>
                    There are five Focus schools, each giving different passive bonuses to Operator and Warframe.
                    Focus is earned by killing enemies with weapons that have a <B>Convergence Orb</B> active (8× multiplier).
                </P>
                <table className="w-full text-xs border border-slate-800 rounded-lg overflow-hidden mt-2">
                    <thead className="bg-slate-900/60">
                        <tr>
                            <th className="text-left px-3 py-2 text-slate-300">School</th>
                            <th className="text-left px-3 py-2 text-slate-300">Identity</th>
                            <th className="text-left px-3 py-2 text-slate-300">Key passive</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ["Zenurik", "Energy regen / caster", "Energizing Dash — channeling dash restores energy over time"],
                            ["Vazarin", "Healing / support", "Protective Dash — voidwalking through allies instantly heals and makes them briefly invulnerable"],
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
                    <B>Zenurik</B> is the most universally useful school for beginners — free energy removes dependency
                    on Energy Pads. <B>Madurai</B> is essential for serious Eidolon hunting.
                </P>
                <Callout>
                    Leveling a school to max requires <B>Brilliant Eidolon Shards</B> for the later nodes.
                    These only drop from captured (not killed) Eidolons.
                </Callout>
            </>
        )
    },
    {
        id: "farming",
        title: "Common Farming Strategies",
        summary: "Where to go for the most common resources. Speed over perfect efficiency when you're starting out.",
        content: (
            <>
                <P><B>Prime parts and Relics:</B></P>
                <Steps items={[
                    "Void Fissure missions — select a Relic, kill 10 Corrupted enemies to crack it",
                    "Survivals (Mot, Ani) for Axi Relics; Defense (Hydron, Mithra) for Neo; Capture (Hepit) for Lith",
                    "Trade Prime parts you don't need with other players for Platinum",
                ]} />
                <P><B>Credits:</B></P>
                <Steps items={[
                    "Index (Neptune, Prodman mission) — 200k credits per successful run in the high-risk bracket",
                    "Profit-Taker Heists (after Vox Solaris rank 4) — large credit rewards",
                ]} />
                <P><B>Endo (mod leveling):</B></P>
                <Steps items={[
                    "Arbitrations — high-level endless missions with large Endo rewards",
                    "Disruption (Olympus, Mars or Ur, Uranus for high-level)",
                ]} />
                <P><B>Kuva (Riven rerolling):</B></P>
                <Steps items={[
                    "Kuva Survival (Kuva Fortress) — 200 Kuva per survival reward; best raw rate",
                    "Steel Path missions — 2,000 Kuva flat per mission completion",
                    "Kuva Siphon / Flood missions — 550–1,200 Kuva each (lower time investment)",
                ]} />
                <P><B>Resources:</B></P>
                <Steps items={[
                    "Plastids: Phobos, Saturn, Uranus, Pluto, Eris survivals",
                    "Neurodes: Earth, Eris, Lua; Infected-type enemies",
                    "Neural Sensors: Jupiter; Factory missions in particular",
                    "Orokin Cells: Saturn, Ceres, Derelict survivals",
                    "Argon Crystal: Void missions (Argon decays; farm just before you need it)",
                ]} />
                <Callout>
                    <B>Resource boosters</B> double all resource drops. They stack with a <B>Smeeta Kavat's</B> Charm
                    buff (which also doubles pickups and can proc multiple times). Using both is the fastest
                    way to gather large quantities of rare materials.
                </Callout>
            </>
        )
    },
];

export default function Handbook() {
    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                <div className="text-xl font-semibold text-slate-100">Handbook</div>
                <div className="mt-1 text-sm text-slate-400">
                    Explanations of game mechanics that commonly gate progression or cause confusion.
                    This is a reference, not a walkthrough — the goal is to unblock you, not hold your hand.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {SECTIONS.map((s) => (
                        <a
                            key={s.id}
                            href={`#${s.id}`}
                            className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                        >
                            {s.title}
                        </a>
                    ))}
                </div>
            </div>

            {SECTIONS.map((s) => (
                <div key={s.id} id={s.id}>
                    <Card title={s.title} summary={s.summary}>
                        {s.content}
                    </Card>
                </div>
            ))}
        </div>
    );
}
