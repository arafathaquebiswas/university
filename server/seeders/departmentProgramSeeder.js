/**
 * departmentProgramSeeder.js
 *
 * Safely inserts BRAC University departments and programs.
 * Uses findOrCreate so re-running is safe (no duplicates).
 *
 * Run from the project root:
 *   cd server && node seeders/departmentProgramSeeder.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sequelize = require('../config/database');
require('../models'); // register all associations
const { Department, Program } = require('../models');

// ── 1. Departments ──────────────────────────────────────────────────────────
// key is used below to reference the right deptId for programs
const DEPT_DEFS = [
  { key: 'BBS',    name: 'BRAC Business School' },
  { key: 'SDCS',   name: 'School of Data & Computational Sciences' },
  { key: 'SENG',   name: 'BSRM School of Engineering' },
  { key: 'LAW',    name: 'School of Law' },
  { key: 'PHAR',   name: 'School of Pharmacy' },
  { key: 'ARCH',   name: 'School of Architecture & Design' },
  { key: 'HUM',    name: 'School of Humanities & Social Sciences' },
  { key: 'GEN',    name: 'School of General Education' },
  { key: 'SPH',    name: 'BRAC James P Grant School of Public Health' },
  { key: 'LIFE',   name: 'School of Life Sciences' },
  { key: 'MATHS',  name: 'Department of Mathematics & Physical Sciences' },
  { key: 'FASH',   name: 'School of Fashion & Design' },
];

// ── 2. Programs ─────────────────────────────────────────────────────────────
// duration: years | credits column does NOT exist in the model — kept as comment
// dept: key from DEPT_DEFS above
const PROGRAM_DEFS = [
  // ── Mathematics & Physical Sciences ─────────────────────────────────────
  { name: 'Bachelor of Science in Applied Physics and Electronics (APE)', duration: 4, dept: 'MATHS' }, // 130 cr
  { name: 'Bachelor of Science in Mathematics (MAT)',                     duration: 4, dept: 'MATHS' }, // 127 cr
  { name: 'Bachelor of Science in Physics (PHY)',                         duration: 4, dept: 'MATHS' }, // 120 cr

  // ── Humanities & Social Sciences ─────────────────────────────────────────
  { name: 'Bachelor of Social Sciences in Anthropology (ANT)',            duration: 4, dept: 'HUM'   }, // 120 cr
  { name: 'Bachelor of Social Science in Economics (ECO)',                duration: 4, dept: 'HUM'   }, // 120 cr
  { name: 'Bachelor of Arts in English',                                  duration: 4, dept: 'HUM'   }, // 132 cr
  { name: 'Bachelor of Arts in AELS',                                     duration: 4, dept: 'HUM'   }, // credits N/A

  // ── Architecture & Design ────────────────────────────────────────────────
  { name: 'Bachelor of Architecture (ARC)',                               duration: 5, dept: 'ARCH'  }, // 207 cr

  // ── Life Sciences ────────────────────────────────────────────────────────
  { name: 'Bachelor of Science in Biotechnology (BIO)',                   duration: 4, dept: 'LIFE'  }, // 136 cr
  { name: 'Bachelor of Science in Microbiology (MIC)',                    duration: 4, dept: 'LIFE'  }, // 136 cr

  // ── Pharmacy ─────────────────────────────────────────────────────────────
  { name: 'Bachelor of Pharmacy (PHR)',                                   duration: 5, dept: 'PHAR'  }, // 164 cr

  // ── Business ─────────────────────────────────────────────────────────────
  { name: 'Bachelor of Business Administration (BBA)',                    duration: 4, dept: 'BBS'   }, // 130 cr

  // ── Law ──────────────────────────────────────────────────────────────────
  { name: 'Bachelor of Laws (LLB)',                                       duration: 4, dept: 'LAW'   }, // 135 cr

  // ── Data & Computational Sciences ────────────────────────────────────────
  { name: 'Bachelor of Science in Computer Science & Engineering (CSE)',  duration: 4, dept: 'SDCS'  }, // 136 cr
  { name: 'Bachelor of Science in Computer Science (CS)',                 duration: 4, dept: 'SDCS'  }, // 124 cr

  // ── Engineering ──────────────────────────────────────────────────────────
  { name: 'Bachelor of Science in Electronic & Communication Engineering (ECE)', duration: 4, dept: 'SENG' }, // 136 cr
  { name: 'Bachelor of Science in Electrical & Electronic Engineering (EEE)',    duration: 4, dept: 'SENG' }, // 136 cr

  // ── General Education ────────────────────────────────────────────────────
  { name: 'General Education (GenEd)',                                    duration: 1, dept: 'GEN'   }, // 39 cr
  { name: 'Minor in History',                                             duration: 1, dept: 'GEN'   }, // 24 cr

  // ── Public Health ────────────────────────────────────────────────────────
  { name: 'Bachelor of Disaster Management (BDM)',                        duration: 4, dept: 'SPH'   }, // 141 cr
];

// ── Main seeder ─────────────────────────────────────────────────────────────
async function run() {
  await sequelize.authenticate();
  console.log('✓ DB connected\n');

  // sync without force — creates tables only if they don't exist, never drops
  await sequelize.sync();

  // ── Step 1: Insert departments ─────────────────────────────────────────
  console.log('── Seeding departments ───────────────────────────────────────');
  const deptMap = {}; // key → Department instance

  for (const def of DEPT_DEFS) {
    const [dept, created] = await Department.findOrCreate({
      where: { name: def.name },
      defaults: { name: def.name },
    });
    deptMap[def.key] = dept;
    console.log(`  ${created ? 'CREATED' : 'EXISTS '} [${String(dept.deptId).padStart(3)}] ${dept.name}`);
  }

  // ── Step 2: Insert programs ────────────────────────────────────────────
  console.log('\n── Seeding programs ──────────────────────────────────────────');
  let created = 0;
  let skipped = 0;

  for (const def of PROGRAM_DEFS) {
    const dept = deptMap[def.dept];
    if (!dept) {
      console.warn(`  WARN  Could not find department key "${def.dept}" for program "${def.name}"`);
      continue;
    }

    const [prog, wasCreated] = await Program.findOrCreate({
      where: { name: def.name },
      defaults: { name: def.name, duration: def.duration, deptId: dept.deptId },
    });

    const label = wasCreated ? 'CREATED' : 'EXISTS ';
    console.log(`  ${label} [${String(prog.progId).padStart(3)}] ${prog.name}`);
    console.log(`           └─ ${dept.name} · ${def.duration} yr`);

    wasCreated ? created++ : skipped++;
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log(`  Departments : ${DEPT_DEFS.length} total (${Object.keys(deptMap).length} processed)`);
  console.log(`  Programs    : ${created} created, ${skipped} already existed`);
  console.log('─────────────────────────────────────────────────────────────');
  console.log('\n✅  Done — departments & programs are ready.\n');
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌  Seeder failed:\n', err.message || err);
  process.exit(1);
});
