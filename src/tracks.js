// Curated track pool for the Discovery Dial prototype.
// familiarity: "familiar" = mainstream/already-likely-known, "new" = deeper cut / lesser-known
// Each track is tagged with vibe dimensions so the dial + relevance reasoning can work over it.
// (Prototype dataset — representative, not a live catalog.)
 
export const VIBES = [
  { id: "indie",     label: "Indie & alternative",    seed: "warm guitars, lo-fi, introspective" },
  { id: "ambient",   label: "Ambient & electronic",   seed: "spacious, textural, calm" },
  { id: "techno",    label: "Late-night techno",       seed: "driving, hypnotic, dark" },
  { id: "hyperpop",  label: "Hyperpop & underground",  seed: "glitchy, maximal, playful" },
  { id: "jazz",      label: "Jazz & sample-based",     seed: "improvised, soulful, organic" },
  { id: "shoegaze",  label: "Shoegaze & dream-pop",    seed: "hazy, reverb-soaked, melodic" },
];
 
export const TRACKS = [
  // ── INDIE (familiar avg energy ~2.43) ─────────────────────────────
  { id:"i1",   title:"Apocalypse",                   artist:"Cigarettes After Sex", vibe:"indie", familiarity:"familiar", energy:2, mood:"melancholy",    year:2017 },
  { id:"i2",   title:"Two Slow Dancers",             artist:"Mitski",               vibe:"indie", familiarity:"familiar", energy:2, mood:"melancholy",    year:2018 },
  { id:"i3",   title:"The Less I Know The Better",   artist:"Tame Impala",          vibe:"indie", familiarity:"familiar", energy:3, mood:"groovy",        year:2015 },
  { id:"i4",   title:"Space Song",                   artist:"Beach House",           vibe:"indie", familiarity:"familiar", energy:2, mood:"dreamy",        year:2015 },
  { id:"i5",   title:"Punisher",                     artist:"Phoebe Bridgers",       vibe:"indie", familiarity:"familiar", energy:2, mood:"melancholy",    year:2020 },
  { id:"i5b",  title:"Motion Sickness",              artist:"Phoebe Bridgers",       vibe:"indie", familiarity:"familiar", energy:3, mood:"yearning",      year:2017 },
  { id:"i5c",  title:"Nobody",                       artist:"Mitski",               vibe:"indie", familiarity:"familiar", energy:3, mood:"longing",       year:2018 },
  { id:"i6",   title:"Sunflower Bean Crisis Fest",   artist:"Sunflower Bean",        vibe:"indie", familiarity:"new",      energy:4, mood:"restless",      year:2018 },
  { id:"i7",   title:"Quarter to Three",             artist:"Hovvdy",               vibe:"indie", familiarity:"new",      energy:2, mood:"warm",          year:2021 },
  { id:"i8",   title:"Scott Street demo",            artist:"Indigo De Souza",       vibe:"indie", familiarity:"new",      energy:3, mood:"raw",           year:2021 },
  { id:"i9",   title:"Soft to Be Strong",            artist:"Marika Hackman",        vibe:"indie", familiarity:"new",      energy:2, mood:"introspective", year:2019 },
  { id:"i10",  title:"Cellophane Memories",          artist:"Wishy",                vibe:"indie", familiarity:"new",      energy:3, mood:"hazy",          year:2024 },
  { id:"i11",  title:"Birthday Cake",                artist:"Cigarettes After Sex", vibe:"indie", familiarity:"new",      energy:2, mood:"melancholy",    year:2016 },
  { id:"i_w1", title:"No News From Home",            artist:"Ariel Pink",            vibe:"indie", familiarity:"new",      energy:5, mood:"frantic",       year:2014 },
  { id:"i_w2", title:"Ribs",                         artist:"Lorde",                vibe:"indie", familiarity:"new",      energy:5, mood:"anxious",       year:2013 },
 
  // ── AMBIENT (familiar avg energy ~1.25) ───────────────────────────
  { id:"a1",   title:"An Ending Ascent",             artist:"Brian Eno",            vibe:"ambient", familiarity:"familiar", energy:1, mood:"serene",      year:1983 },
  { id:"a2",   title:"Avril 14th",                   artist:"Aphex Twin",           vibe:"ambient", familiarity:"familiar", energy:1, mood:"wistful",     year:2001 },
  { id:"a3",   title:"Says",                         artist:"Nils Frahm",           vibe:"ambient", familiarity:"familiar", energy:2, mood:"building",    year:2013 },
  { id:"a4",   title:"Saman",                        artist:"Olafur Arnalds",       vibe:"ambient", familiarity:"familiar", energy:1, mood:"tender",      year:2010 },
  { id:"a5",   title:"Substrata Poem for Byzantium", artist:"Biosphere",            vibe:"ambient", familiarity:"new",      energy:1, mood:"glacial",      year:1997 },
  { id:"a6",   title:"Subaqueous Flow",              artist:"Loscil",               vibe:"ambient", familiarity:"new",      energy:1, mood:"submerged",   year:2019 },
  { id:"a7",   title:"Wholeness",                    artist:"Green-House",          vibe:"ambient", familiarity:"new",      energy:2, mood:"verdant",      year:2020 },
  { id:"a8",   title:"Pause",                        artist:"Kaitlyn Aurelia Smith",vibe:"ambient", familiarity:"new",      energy:2, mood:"playful",      year:2017 },
  { id:"a9",   title:"Romance",                      artist:"Rainforest Spiritual Enslavement", vibe:"ambient", familiarity:"new", energy:1, mood:"dense", year:2016 },
  { id:"a10",  title:"Tirian",                       artist:"Hilyard",              vibe:"ambient", familiarity:"new",      energy:1, mood:"drifting",     year:2021 },
  { id:"a_w1", title:"Zone",                         artist:"Grouper",              vibe:"ambient", familiarity:"new",      energy:4, mood:"haunted",      year:2008 },
  { id:"a_w2", title:"Drift",                        artist:"Stars of the Lid",     vibe:"ambient", familiarity:"new",      energy:4, mood:"orchestral",   year:2007 },
 
  // ── TECHNO (familiar avg energy ~3.75) ────────────────────────────
  { id:"t1",   title:"Spastik",                      artist:"Plastikman",           vibe:"techno", familiarity:"familiar", energy:4, mood:"hypnotic",      year:1993 },
  { id:"t2",   title:"Windowlicker",                 artist:"Aphex Twin",           vibe:"techno", familiarity:"familiar", energy:4, mood:"warped",        year:1999 },
  { id:"t3",   title:"Avenue",                       artist:"Saint Etienne",        vibe:"techno", familiarity:"familiar", energy:3, mood:"shimmer",       year:1992 },
  { id:"t4",   title:"LFO",                          artist:"LFO",                  vibe:"techno", familiarity:"familiar", energy:4, mood:"deep",          year:1990 },
  { id:"t5",   title:"Sicko Cell",                   artist:"Anz",                  vibe:"techno", familiarity:"new",      energy:5, mood:"bright",        year:2021 },
  { id:"t6",   title:"Tidal",                        artist:"Peverelist",           vibe:"techno", familiarity:"new",      energy:4, mood:"rolling",       year:2020 },
  { id:"t7",   title:"Pinball",                      artist:"Bicep",                vibe:"techno", familiarity:"new",      energy:4, mood:"euphoric",      year:2021 },
  { id:"t8",   title:"Deep Inside",                  artist:"DJ Octave",            vibe:"techno", familiarity:"new",      energy:4, mood:"warm",          year:2019 },
  { id:"t9",   title:"Panorama Bar Loop",            artist:"Efdemin",              vibe:"techno", familiarity:"new",      energy:4, mood:"dubby",         year:2018 },
  { id:"t10",  title:"Pour Le Mauvais Garcon",       artist:"Vladimir Ivkovic",     vibe:"techno", familiarity:"new",      energy:3, mood:"strange",       year:2017 },
  { id:"t_w1", title:"Emptiness",                    artist:"Demdike Stare",        vibe:"techno", familiarity:"new",      energy:1, mood:"desolate",      year:2010 },
  { id:"t_w2", title:"Midnight Request Line",        artist:"Skream",               vibe:"techno", familiarity:"new",      energy:1, mood:"dubstep",       year:2005 },
 
  // ── HYPERPOP (familiar avg energy ~4.80) ──────────────────────────
  { id:"h1",   title:"Sugar",                        artist:"100 gecs",             vibe:"hyperpop", familiarity:"familiar", energy:5, mood:"chaotic",     year:2019 },
  { id:"h2",   title:"hand crushed by a mallet",     artist:"100 gecs",             vibe:"hyperpop", familiarity:"familiar", energy:5, mood:"chaotic",     year:2019 },
  { id:"h3",   title:"ABCDEFU hyperpop edit",        artist:"GAYLE",                vibe:"hyperpop", familiarity:"familiar", energy:4, mood:"snarky",      year:2021 },
  { id:"h4",   title:"Tears",                        artist:"Charli XCX",           vibe:"hyperpop", familiarity:"familiar", energy:5, mood:"glossy",      year:2020 },
  { id:"h5",   title:"money machine",                artist:"100 gecs",             vibe:"hyperpop", familiarity:"familiar", energy:5, mood:"manic",       year:2019 },
  { id:"h6",   title:"Touch",                        artist:"underscores",          vibe:"hyperpop", familiarity:"new",      energy:4, mood:"bittersweet", year:2021 },
  { id:"h7",   title:"Stupid Horse remix",           artist:"food house",           vibe:"hyperpop", familiarity:"new",      energy:5, mood:"frantic",     year:2021 },
  { id:"h8",   title:"Cherry-coloured Funk",         artist:"glaive",               vibe:"hyperpop", familiarity:"new",      energy:4, mood:"yearning",    year:2021 },
  { id:"h9",   title:"i want the heaven",            artist:"quinn",                vibe:"hyperpop", familiarity:"new",      energy:4, mood:"ethereal",    year:2022 },
  { id:"h10",  title:"Pretty Boy",                   artist:"Aldn",                 vibe:"hyperpop", familiarity:"new",      energy:5, mood:"hyper",       year:2021 },
  { id:"h_w1", title:"Show Me Love",                 artist:"Robyn",                vibe:"hyperpop", familiarity:"new",      energy:2, mood:"bittersweet", year:2010 },
  { id:"h_w2", title:"Complicated",                  artist:"Avril Lavigne",        vibe:"hyperpop", familiarity:"new",      energy:2, mood:"angsty",      year:2002 },
 
  // ── JAZZ (familiar avg energy ~2.80) ──────────────────────────────
  { id:"j1",   title:"So What",                      artist:"Miles Davis",          vibe:"jazz", familiarity:"familiar", energy:2, mood:"cool",            year:1959 },
  { id:"j2",   title:"Take Five",                    artist:"Dave Brubeck",         vibe:"jazz", familiarity:"familiar", energy:3, mood:"breezy",          year:1959 },
  { id:"j3",   title:"Feeling Good",                 artist:"Nina Simone",          vibe:"jazz", familiarity:"familiar", energy:3, mood:"triumphant",      year:1965 },
  { id:"j4",   title:"Mas Que Nada",                 artist:"Sergio Mendes",        vibe:"jazz", familiarity:"familiar", energy:3, mood:"sunny",           year:1966 },
  { id:"j5",   title:"Cantaloupe Island",            artist:"Herbie Hancock",       vibe:"jazz", familiarity:"familiar", energy:3, mood:"groovy",          year:1964 },
  { id:"j6",   title:"Pursuance",                    artist:"Kamasi Washington",    vibe:"jazz", familiarity:"new",      energy:4, mood:"spiritual",       year:2015 },
  { id:"j7",   title:"Movement 8",                   artist:"GoGo Penguin",         vibe:"jazz", familiarity:"new",      energy:3, mood:"propulsive",      year:2018 },
  { id:"j8",   title:"Black Qualls",                 artist:"Thundercat",           vibe:"jazz", familiarity:"new",      energy:3, mood:"funky",           year:2020 },
  { id:"j9",   title:"Sade sample flip",             artist:"Mndsgn",               vibe:"jazz", familiarity:"new",      energy:2, mood:"dusty",           year:2016 },
  { id:"j10",  title:"Friday Night",                 artist:"Yussef Kamaal",        vibe:"jazz", familiarity:"new",      energy:4, mood:"loose",           year:2016 },
  { id:"j_w1", title:"A Love Supreme Part 1",        artist:"John Coltrane",        vibe:"jazz", familiarity:"new",      energy:5, mood:"devotional",      year:1964 },
  { id:"j_w2", title:"Birdland",                     artist:"Weather Report",       vibe:"jazz", familiarity:"new",      energy:5, mood:"explosive",       year:1977 },
 
  // ── SHOEGAZE (familiar avg energy ~3.20) ──────────────────────────
  { id:"s1",   title:"Only Shallow",                 artist:"My Bloody Valentine",  vibe:"shoegaze", familiarity:"familiar", energy:4, mood:"crushing",   year:1991 },
  { id:"s2",   title:"Vapour Trail",                 artist:"Ride",                 vibe:"shoegaze", familiarity:"familiar", energy:3, mood:"soaring",    year:1990 },
  { id:"s3",   title:"When the Sun Hits",            artist:"Slowdive",             vibe:"shoegaze", familiarity:"familiar", energy:3, mood:"washed",     year:1993 },
  { id:"s4",   title:"Sometimes",                    artist:"My Bloody Valentine",  vibe:"shoegaze", familiarity:"familiar", energy:3, mood:"hazy",       year:1991 },
  { id:"s5",   title:"Alison",                       artist:"Slowdive",             vibe:"shoegaze", familiarity:"familiar", energy:3, mood:"yearning",   year:1993 },
  { id:"s6",   title:"Thinking About You",           artist:"Whirr",                vibe:"shoegaze", familiarity:"new",      energy:3, mood:"heavy",      year:2014 },
  { id:"s7",   title:"Sundowner",                    artist:"Cloakroom",            vibe:"shoegaze", familiarity:"new",      energy:3, mood:"dense",      year:2017 },
  { id:"s8",   title:"Heaven",                       artist:"DIIV",                 vibe:"shoegaze", familiarity:"new",      energy:3, mood:"glistening", year:2019 },
  { id:"s9",   title:"Glow",                         artist:"Nothing",              vibe:"shoegaze", familiarity:"new",      energy:4, mood:"bittersweet",year:2016 },
  { id:"s10",  title:"Fleeting Youth",               artist:"Flyying Colours",      vibe:"shoegaze", familiarity:"new",      energy:4, mood:"rushing",    year:2015 },
  { id:"s_w1", title:"Mute",                         artist:"Jesu",                 vibe:"shoegaze", familiarity:"new",      energy:1, mood:"drone",      year:2006 },
  { id:"s_w2", title:"The Crow",                     artist:"Low",                  vibe:"shoegaze", familiarity:"new",      energy:1, mood:"sparse",     year:1996 },
];
 
