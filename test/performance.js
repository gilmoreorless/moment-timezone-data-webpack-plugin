const moment = require('moment-timezone');
const tzdata = require('moment-timezone/data/packed/latest.json');
const { execSync } = require('child_process');
const { PerformanceObserver, performance } = require('perf_hooks');
const { filterData } = require('../src');
const pkg = require('../package.json');

let configs = [
  {
    name: 'single zone, all years',
    options: {
      matchZones: 'Europe/London',
    },
  },
  {
    name: 'single zone, 10 years',
    options: {
      matchZones: 'Europe/London',
      startYear: 2015,
      endYear: 2024,
    },
  },
  {
    name: 'single country, all years',
    options: {
      matchCountries: ['LI'],
    },
  },
  {
    name: 'single country, 10 years',
    options: {
      matchCountries: ['LI'],
      startYear: 2015,
      endYear: 2024,
    },
  },
  {
    name: 'all zones, all years',
    options: {},
  },
  {
    name: 'all zones, 10 years',
    options: {
      startYear: 2015,
      endYear: 2024,
    },
  },
];

// Remove country-based tests when running against older versions
if (!tzdata.countries) {
  configs = configs.filter(config => !config.options.matchCountries);
}

const runs = new Map();
const runCount = 5;

const obs = new PerformanceObserver((items) => {
  const { name, duration } = items.getEntries()[0];
  runs.get(name).push(duration);
  performance.clearMarks();
});
obs.observe({ entryTypes: ['measure'] });

const gitHash = execSync('git rev-parse --short HEAD');
console.log(`
Performance tests: version ${pkg.version}, moment-timezone ${moment.tz.version}, git hash ${gitHash}
`);

const queue = [];
for (let i = 0; i < runCount; i++) {
  configs.forEach(config => {
    if (!runs.has(config.name)) {
      runs.set(config.name, []);
    }
    queue.push(() => {
      performance.mark('start');
      filterData(tzdata, config.options);
      performance.mark('end');
      performance.measure(config.name, 'start', 'end');
    });
  });
}

const gap = 100;
function doRun() {
  const runFn = queue.shift();
  runFn();
  if (queue.length) {
    setTimeout(doRun, gap);
  } else {
    report();
  }
}
doRun();

function round(num, digits) {
  const exp = 10 ** digits;
  return Math.round(num * exp) / exp;
}

const digitsLeft = 3;
const digitsRight = 6;
function tableNum(num) {
  const rounded = round(num, digitsRight);
  const [left, right] = String(rounded).split('.');
  return `${left.padStart(digitsLeft)}.${right.padEnd(digitsRight)}`;
}

const longestNameLength = Math.max.apply(Math, configs.map(c => c.name.length));

/**
 * A simple custom replacement for console.table() that does better formatting of numbers
 */
function consoleTable(data) {
  function dividerRow(startChar, midChar, endChar, fields) {
    return (
      startChar +
      fields.map(f => '─'.repeat(f.width + 2)).join(midChar) +
      endChar
    );
  }

  function dataRow(rowValues) {
    return `│ ${rowValues.join(' │ ')} │`;
  }

  // Width calculations
  let fields = [{ name: 'test name', width: longestNameLength }];
  const firstEntry = Object.values(data)[0];
  for (let field of Object.keys(firstEntry)) {
    fields.push({ name: field, width: digitsLeft + digitsRight + 1 });
  }

  // Header
  console.log(dividerRow('┌', '┬', '┐', fields));
  console.log(dataRow(fields.map(f => f.name.padEnd(f.width))));
  console.log(dividerRow('├', '┼', '┤', fields));

  // Body
  for (let [testName, testData] of Object.entries(data)) {
    let cells = [testName.padEnd(fields[0].width)];
    for (let value of Object.values(testData)) {
      cells.push(tableNum(value));
    }
    console.log(dataRow(cells));
  }

  // Footer
  console.log(dividerRow('└', '┴', '┘', fields));
}

function report() {
  let table = {};
  for (let [name, times] of runs.entries()) {
    let min = Math.min.apply(Math, times);
    let max = Math.max.apply(Math, times);
    let sum = times.reduce((a, t) => a + t, 0);
    let avg = sum / times.length;
    let sorted = times.slice().sort((a, b) => a - b);
    let med = sorted[Math.floor(times.length / 2)];

    table[name] = {
      min,
      max,
      average: avg,
      median: med,
    };
  }

  consoleTable(table);
}
