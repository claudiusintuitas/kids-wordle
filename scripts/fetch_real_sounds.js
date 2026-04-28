// Downloads real animal sounds from Wikimedia Commons (CC-licensed)
// and converts them to short WAV clips suitable for the game.
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const OUT = path.join(__dirname, '../assets/sounds');
const TMP = path.join(__dirname, '../.sound_cache');
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const UA = 'KidsWordle/1.0 (claudius.intuitas@gmail.com)';

function fetch(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close(); fs.unlinkSync(dest);
        return fetch(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close(); fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

function api(params) {
  const qs = new URLSearchParams({ format: 'json', action: 'query', ...params }).toString();
  return new Promise((resolve, reject) => {
    https.get(`https://commons.wikimedia.org/w/api.php?${qs}`, { headers: { 'User-Agent': UA } }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function getFileUrl(filename) {
  const data = await api({ titles: `File:${filename}`, prop: 'imageinfo', iiprop: 'url' });
  const pages = data.query.pages;
  const page = pages[Object.keys(pages)[0]];
  return page.imageinfo ? page.imageinfo[0].url : null;
}

const SOUNDS = [
  { out: 'cat_meow.wav',     src: 'Felis_silvestris_catus_meows.ogg', start: 0.4, dur: 0.7, vol: 1.6 },
  { out: 'cat_meow_2.wav',   src: 'Felis_silvestris_catus_meows.ogg', start: 1.5, dur: 0.7, vol: 1.6 },
  { out: 'monkey.wav',       src: 'Pant-hoot call made by a male chimpanzee.ogg', start: 0.5, dur: 1.2, vol: 1.5 },
  { out: 'monkey_2.wav',     src: 'Brown woolly monkey alarm call.wav',           start: 0.0, dur: 0.9, vol: 1.6 },
  { out: 'elephant.wav',     src: 'Elephant voice - trumpeting.ogg',              start: 0.0, dur: 1.4, vol: 1.5 },
  { out: 'owl.wav',          src: 'Maghreb owl hooting.wav',                      start: 0.0, dur: 1.0, vol: 1.6 },
];

(async () => {
  for (const s of SOUNDS) {
    try {
      const url = await getFileUrl(s.src);
      if (!url) { console.log(`SKIP ${s.out}: source not found`); continue; }
      const ext = path.extname(url).toLowerCase() || '.ogg';
      const tmpFile = path.join(TMP, s.out.replace('.wav', ext));
      await fetch(url, tmpFile);
      const outFile = path.join(OUT, s.out);
      execFileSync(ffmpegPath, [
        '-y', '-i', tmpFile,
        '-ss', String(s.start), '-t', String(s.dur),
        '-ac', '1', '-ar', '22050',
        '-af', `volume=${s.vol},afade=t=in:st=0:d=0.03,afade=t=out:st=${Math.max(0, s.dur - 0.08)}:d=0.08`,
        '-c:a', 'pcm_s16le',
        outFile,
      ], { stdio: 'pipe' });
      console.log(`  -> ${s.out} (${fs.statSync(outFile).size} bytes)`);
    } catch (e) {
      console.log(`FAIL ${s.out}: ${e.message}`);
    }
  }
  console.log('Done with downloads.');
})();
