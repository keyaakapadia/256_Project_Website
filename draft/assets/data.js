/* ============================================================
   256 — SHARED DATASET
   All three drafts read from this file. Add rows here only.

   THE SET IS 21 REAL PRECEDENTS + PLACEHOLDER SLOTS UP TO `TARGET`.
   Placeholders reuse the 21 real images so every layout can be
   tested at true density. They are flagged `placeholder:true` and
   the drafts label them, so nothing here can be mistaken for
   finished research. As you tag real precedents, add them to REAL
   and the placeholder count shrinks automatically.

   FIELD VOCABULARY (keep to these values so the drafts can sort)
   geometry     axis | matrix | cloud | orbit | tunnel | deck | section | radial | canvas | wall
   orderedBy    time | category | similarity | space | process | network | associative
   navigation   scroll | pan | zoom | fly | filter | walk | static
   dimension    2D | 2.5D | 3D | physical
   medium       website | installation | poster | template | exhibition | dataviz
   density      sparse | moderate | dense | massive
   structure    explicit | implicit | coordinate | broken
   effort       passive | low | high
   ground       black | light | neutral | colour
   field        architecture | museum | editorial | portfolio | art | web
   register     screen | art | world | print
   ============================================================ */

const TARGET = 120;          // <- raise this as you add real rows

const FIELDS = {
  geometry:   ['axis','matrix','cloud','orbit','tunnel','deck','section','radial','canvas','wall'],
  orderedBy:  ['time','category','similarity','space','process','network','associative'],
  navigation: ['scroll','pan','zoom','fly','filter','walk','static'],
  dimension:  ['2D','2.5D','3D','physical'],
  medium:     ['website','installation','poster','template','exhibition','dataviz'],
  density:    ['sparse','moderate','dense','massive'],
  structure:  ['explicit','implicit','coordinate','broken'],
  effort:     ['passive','low','high'],
  ground:     ['black','light','neutral','colour'],
  field:      ['architecture','museum','editorial','portfolio','art','web'],
  register:   ['screen','art','world','print'],
};

const FIELD_LABELS = {
  geometry:'Geometry', orderedBy:'Ordered by', navigation:'Navigation',
  dimension:'Dimension', medium:'Medium', density:'Density',
  structure:'Structure', effort:'Effort', ground:'Ground',
  field:'Field', register:'Register',
};

/* ---------------- 21 REAL PRECEDENTS ---------------- */
const REAL = [
  { id:'r02', file:'ref_02.jpg', title:'WW1 portraits on a date line', year:2014,
    geometry:'axis', orderedBy:'time', navigation:'scroll', dimension:'2D',
    medium:'website', density:'moderate', structure:'explicit', effort:'low',
    ground:'black', field:'museum', register:'screen' },

  { id:'r03', file:'ref_03.jpg', title:'Phase 01–07 material study matrix', year:2016,
    geometry:'matrix', orderedBy:'process', navigation:'static', dimension:'2D',
    medium:'poster', density:'dense', structure:'explicit', effort:'passive',
    ground:'light', field:'architecture', register:'print' },

  { id:'r04', file:'ref_04.jpg', title:'Architecture studio ellipse carousel', year:2021,
    geometry:'orbit', orderedBy:'category', navigation:'filter', dimension:'3D',
    medium:'website', density:'moderate', structure:'implicit', effort:'low',
    ground:'light', field:'architecture', register:'screen' },

  { id:'r05', file:'ref_05.jpg', title:'Photo node-graph with x/y addresses', year:2019,
    geometry:'radial', orderedBy:'similarity', navigation:'pan', dimension:'3D',
    medium:'installation', density:'dense', structure:'coordinate', effort:'high',
    ground:'black', field:'art', register:'art' },

  { id:'r06', file:'ref_06.jpg', title:'BCL_NFT_Gallery wireframe tunnel', year:2022,
    geometry:'tunnel', orderedBy:'associative', navigation:'fly', dimension:'3D',
    medium:'website', density:'moderate', structure:'explicit', effort:'low',
    ground:'black', field:'web', register:'screen' },

  { id:'r07', file:'ref_07.jpg', title:'"American Painting" thumbnail cloud', year:2013,
    geometry:'cloud', orderedBy:'category', navigation:'zoom', dimension:'2D',
    medium:'website', density:'massive', structure:'implicit', effort:'low',
    ground:'black', field:'museum', register:'screen' },

  { id:'r08', file:'ref_08.jpg', title:'Suspended photo-print room', year:2019,
    geometry:'cloud', orderedBy:'associative', navigation:'walk', dimension:'physical',
    medium:'installation', density:'dense', structure:'implicit', effort:'passive',
    ground:'black', field:'art', register:'art' },

  { id:'r09', file:'ref_09.jpg', title:'La Raza Archive fly-through', year:2019,
    geometry:'cloud', orderedBy:'time', navigation:'fly', dimension:'3D',
    medium:'website', density:'massive', structure:'implicit', effort:'high',
    ground:'black', field:'museum', register:'screen' },

  { id:'r10', file:'ref_10.jpg', title:'Gallery image vortex', year:2020,
    geometry:'tunnel', orderedBy:'associative', navigation:'fly', dimension:'3D',
    medium:'installation', density:'dense', structure:'explicit', effort:'passive',
    ground:'black', field:'museum', register:'screen' },

  { id:'r11', file:'ref_11.jpg', title:'Edge-on image deck, white ground', year:2018,
    geometry:'deck', orderedBy:'associative', navigation:'scroll', dimension:'2.5D',
    medium:'dataviz', density:'dense', structure:'implicit', effort:'low',
    ground:'light', field:'editorial', register:'screen' },

  { id:'r12', file:'ref_12.jpg', title:'Pannable moodboard canvas', year:2021,
    geometry:'canvas', orderedBy:'associative', navigation:'pan', dimension:'2D',
    medium:'website', density:'sparse', structure:'broken', effort:'low',
    ground:'neutral', field:'web', register:'screen' },

  { id:'r13', file:'ref_13.jpg', title:'"every : second" isometric news ribbons', year:2018,
    geometry:'deck', orderedBy:'time', navigation:'scroll', dimension:'2.5D',
    medium:'website', density:'dense', structure:'implicit', effort:'low',
    ground:'light', field:'editorial', register:'screen' },

  { id:'r14', file:'ref_14.jpg', title:'"Scroll" arc template', year:2023,
    geometry:'orbit', orderedBy:'associative', navigation:'scroll', dimension:'3D',
    medium:'template', density:'moderate', structure:'implicit', effort:'passive',
    ground:'light', field:'web', register:'screen' },

  { id:'r15', file:'ref_15.jpg', title:'Isometric artwork deck, tan ground', year:2017,
    geometry:'deck', orderedBy:'category', navigation:'scroll', dimension:'2.5D',
    medium:'dataviz', density:'dense', structure:'implicit', effort:'low',
    ground:'neutral', field:'museum', register:'screen' },

  { id:'r16', file:'ref_16.jpg', title:'Drents Museum 3D wayfinding plan', year:2011,
    geometry:'section', orderedBy:'space', navigation:'fly', dimension:'3D',
    medium:'exhibition', density:'moderate', structure:'explicit', effort:'high',
    ground:'black', field:'architecture', register:'print' },

  { id:'r17', file:'ref_17.jpg', title:'Cylindrical wall of browser windows', year:2015,
    geometry:'wall', orderedBy:'network', navigation:'walk', dimension:'physical',
    medium:'installation', density:'dense', structure:'implicit', effort:'passive',
    ground:'black', field:'art', register:'art' },

  { id:'r18', file:'ref_18.jpg', title:'OBSCURA projection tile wall', year:2016,
    geometry:'wall', orderedBy:'associative', navigation:'walk', dimension:'physical',
    medium:'installation', density:'massive', structure:'explicit', effort:'passive',
    ground:'black', field:'art', register:'art' },

  { id:'r19', file:'ref_19.jpg', title:'Art-history timeline poster (−5000→2000)', year:2013,
    geometry:'axis', orderedBy:'time', navigation:'static', dimension:'2D',
    medium:'poster', density:'dense', structure:'explicit', effort:'passive',
    ground:'light', field:'museum', register:'print' },

  { id:'r20', file:'ref_20.jpg', title:'Designer genealogy on receding rails', year:2012,
    geometry:'radial', orderedBy:'network', navigation:'filter', dimension:'3D',
    medium:'installation', density:'dense', structure:'coordinate', effort:'high',
    ground:'black', field:'art', register:'art' },

  { id:'r21', file:'ref_21.jpg', title:'Istanbul passages urban section', year:2015,
    geometry:'section', orderedBy:'space', navigation:'static', dimension:'2D',
    medium:'poster', density:'moderate', structure:'explicit', effort:'passive',
    ground:'light', field:'architecture', register:'print' },

  { id:'r22', file:'ref_22.jpg', title:'Suspended-print exhibition render', year:2018,
    geometry:'wall', orderedBy:'category', navigation:'walk', dimension:'physical',
    medium:'exhibition', density:'dense', structure:'implicit', effort:'passive',
    ground:'black', field:'museum', register:'art' },
];

/* ---------------- PLACEHOLDER SLOTS ----------------
   Deterministic, so a layout never reshuffles between reloads.
   Each slot borrows a real image and carries a spread of metadata
   so every axis has enough members to actually read at density.
---------------------------------------------------- */
const IMAGE_POOL = REAL.map(r => r.file);

function seeded(i, salt){
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}
const pick = (arr, i, salt) => arr[Math.floor(seeded(i, salt) * arr.length) % arr.length];

const PLACEHOLDERS = Array.from({ length: Math.max(0, TARGET - REAL.length) }, (_, k) => {
  const i = k + 1;
  const n = String(REAL.length + i).padStart(3, '0');
  return {
    id: `p${n}`,
    file: IMAGE_POOL[k % IMAGE_POOL.length],
    title: `Untagged slot ${n}`,
    year: 2008 + Math.floor(seeded(i, 21) * 17),
    /* geometry cycles so all ten stay populated and ISOLATE stays useful */
    geometry:   FIELDS.geometry[k % FIELDS.geometry.length],
    orderedBy:  pick(FIELDS.orderedBy,  i, 2),
    navigation: pick(FIELDS.navigation, i, 3),
    dimension:  pick(FIELDS.dimension,  i, 4),
    medium:     pick(FIELDS.medium,     i, 5),
    density:    pick(FIELDS.density,    i, 6),
    structure:  pick(FIELDS.structure,  i, 7),
    effort:     pick(FIELDS.effort,     i, 8),
    ground:     pick(FIELDS.ground,     i, 9),
    field:      pick(FIELDS.field,      i, 10),
    register:   pick(FIELDS.register,   i, 11),
    placeholder: true,
  };
});

const DATA = [...REAL, ...PLACEHOLDERS];

const STATS = {
  total: DATA.length,
  real: REAL.length,
  placeholder: PLACEHOLDERS.length,
};

/* Path helper — drafts sit one level below /assets */
const IMG = (f) => `../assets/img/${f}`;
