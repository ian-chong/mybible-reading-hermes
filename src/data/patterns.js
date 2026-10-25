// Types & Shadows: Old Testament types and their New Testament antitypes.
// Rule: a pattern is listed only when a New Testament verse itself makes the link
// (`link` quotes that verse, KJV). Each step's ref sits within one chapter, like Stories,
// so reading a pattern counts toward the main plan. Ordered by where the type appears.
import { parseRef } from './stories';

export const ANTITYPE_HELP =
  'A type is a person, event or object in the Old Testament that God used to picture something to come. The antitype is the reality it pointed to, fulfilled in Christ.';

const PATTERNS = [
  {
    id: 'adam',
    name: 'Adam',
    summary: 'The first man, whose one act of disobedience brought death to all — a figure of the One whose obedience brings life.',
    link: { ref: 'Romans 5:14', text: 'Who is the figure of him that was to come.' },
    type: [
      { title: 'Formed of the dust', ref: 'Genesis 2:7-17' },
      { title: 'By one man sin entered', ref: 'Genesis 3:1-19' },
    ],
    antitype: [
      { title: 'The figure of him that was to come', ref: 'Romans 5:12-21' },
      { title: 'The last Adam', ref: '1 Corinthians 15:42-49' },
    ],
  },
  {
    id: 'marriage',
    name: 'Marriage',
    summary: 'A man leaves his father and mother and cleaves to his wife — a mystery Paul says was always about Christ and the church.',
    link: { ref: 'Ephesians 5:32', text: 'This is a great mystery: but I speak concerning Christ and the church.' },
    type: [{ title: 'They shall be one flesh', ref: 'Genesis 2:18-25' }],
    antitype: [{ title: 'Christ and the church', ref: 'Ephesians 5:22-33' }],
  },
  {
    id: 'the-ark',
    name: 'The Ark',
    summary: 'Eight souls saved through the water inside the ark God commanded — a figure of the salvation that comes through baptism.',
    link: { ref: '1 Peter 3:21', text: 'The like figure whereunto even baptism doth also now save us.' },
    type: [
      { title: 'Make thee an ark', ref: 'Genesis 6:5-22' },
      { title: 'The LORD shut him in', ref: 'Genesis 7:1-24' },
      { title: 'God remembered Noah', ref: 'Genesis 8:13-22' },
    ],
    antitype: [
      { title: 'Saved by water', ref: '1 Peter 3:18-22' },
      { title: 'Noah prepared an ark', ref: 'Hebrews 11:7' },
    ],
  },
  {
    id: 'melchizedek',
    name: 'Melchizedek',
    summary: 'A king of righteousness and peace, priest of the most high God, without beginning or end in the record — made like unto the Son of God.',
    link: { ref: 'Hebrews 7:3', text: 'Made like unto the Son of God; abideth a priest continually.' },
    type: [
      { title: 'Priest of the most high God', ref: 'Genesis 14:17-24' },
      { title: 'A priest for ever', ref: 'Psalms 110:1-7' },
    ],
    antitype: [
      { title: 'King of righteousness, King of peace', ref: 'Hebrews 7:1-17' },
      { title: 'An unchangeable priesthood', ref: 'Hebrews 7:18-28' },
    ],
  },
  {
    id: 'hagar-and-sarah',
    name: 'Hagar & Sarah',
    summary: 'Two mothers and two sons — one born after the flesh, one by promise. Paul reads them as the two covenants.',
    link: { ref: 'Galatians 4:24', text: 'Which things are an allegory: for these are the two covenants.' },
    type: [
      { title: 'Hagar and Ishmael', ref: 'Genesis 16:1-16' },
      { title: 'The son of promise', ref: 'Genesis 21:1-21' },
    ],
    antitype: [{ title: 'The bondwoman and the free', ref: 'Galatians 4:21-31' }],
  },
  {
    id: 'isaac-offered',
    name: 'Isaac Offered',
    summary: 'A father lays the wood on his only son and climbs the mount, and receives him back as from the dead.',
    link: { ref: 'Hebrews 11:19', text: 'From whence also he received him in a figure.' },
    type: [{ title: 'God will provide himself a lamb', ref: 'Genesis 22:1-19' }],
    antitype: [{ title: 'Received him in a figure', ref: 'Hebrews 11:17-19' }],
  },
  {
    id: 'passover-lamb',
    name: 'The Passover Lamb',
    summary: 'A lamb without blemish, not a bone broken, its blood on the door — and death passes over.',
    link: { ref: '1 Corinthians 5:7', text: 'For even Christ our passover is sacrificed for us.' },
    type: [
      { title: 'When I see the blood', ref: 'Exodus 12:1-14' },
      { title: 'Neither shall ye break a bone thereof', ref: 'Exodus 12:43-51' },
    ],
    antitype: [
      { title: 'A bone of him shall not be broken', ref: 'John 19:31-37' },
      { title: 'Christ our passover', ref: '1 Corinthians 5:6-8' },
    ],
  },
  {
    id: 'red-sea',
    name: 'The Red Sea',
    summary: 'Israel passes through the waters and leaves Egypt behind for good — Paul calls it a baptism.',
    link: { ref: '1 Corinthians 10:2', text: 'And were all baptized unto Moses in the cloud and in the sea.' },
    type: [{ title: 'Stand still, and see the salvation of the LORD', ref: 'Exodus 14:10-31' }],
    antitype: [{ title: 'Baptized unto Moses', ref: '1 Corinthians 10:1-6' }],
  },
  {
    id: 'manna',
    name: 'Manna',
    summary: 'Bread from heaven every morning in the wilderness — and the true bread that gives life to the world.',
    link: { ref: 'John 6:35', text: 'I am the bread of life.' },
    type: [{ title: 'Bread from heaven', ref: 'Exodus 16:1-21' }],
    antitype: [
      { title: 'The true bread from heaven', ref: 'John 6:26-40' },
      { title: 'I am the living bread', ref: 'John 6:47-58' },
    ],
  },
  {
    id: 'the-rock',
    name: 'The Rock',
    summary: 'Water out of the rock for a thirsty people, struck once at Horeb — and Paul names that Rock.',
    link: { ref: '1 Corinthians 10:4', text: 'For they drank of that spiritual Rock that followed them: and that Rock was Christ.' },
    type: [
      { title: 'Thou shalt smite the rock', ref: 'Exodus 17:1-7' },
      { title: 'Speak ye unto the rock', ref: 'Numbers 20:1-13' },
    ],
    antitype: [{ title: 'That Rock was Christ', ref: '1 Corinthians 10:1-4' }],
  },
  {
    id: 'tabernacle',
    name: 'The Tabernacle',
    summary: 'A tent built to a heavenly pattern so God could dwell among His people — the example and shadow of heavenly things.',
    link: { ref: 'Hebrews 8:5', text: 'Who serve unto the example and shadow of heavenly things.' },
    type: [
      { title: 'That I may dwell among them', ref: 'Exodus 25:1-9' },
      { title: 'The glory filled the tabernacle', ref: 'Exodus 40:17-38' },
    ],
    antitype: [
      { title: 'According to the pattern', ref: 'Hebrews 8:1-6' },
      { title: 'A greater and more perfect tabernacle', ref: 'Hebrews 9:1-12' },
    ],
  },
  {
    id: 'the-veil',
    name: 'The Veil',
    summary: 'A curtain shutting the way into the holiest — torn from top to bottom when Christ died.',
    link: { ref: 'Hebrews 10:20', text: 'Through the veil, that is to say, his flesh.' },
    type: [
      { title: 'The veil shall divide', ref: 'Exodus 26:31-37' },
      { title: 'That he come not at all times', ref: 'Leviticus 16:1-2' },
    ],
    antitype: [
      { title: 'The veil of the temple was rent', ref: 'Matthew 27:45-54' },
      { title: 'A new and living way', ref: 'Hebrews 10:19-22' },
    ],
  },
  {
    id: 'high-priest',
    name: 'The High Priest',
    summary: 'One man, set apart and clothed for glory, bearing the names of the tribes on his heart before God.',
    link: { ref: 'Hebrews 4:14', text: 'Seeing then that we have a great high priest, that is passed into the heavens, Jesus the Son of God.' },
    type: [
      { title: 'Upon his heart', ref: 'Exodus 28:29-38' },
      { title: 'Aaron consecrated', ref: 'Leviticus 8:1-13' },
    ],
    antitype: [
      { title: 'A great high priest', ref: 'Hebrews 4:14-16' },
      { title: 'Called of God, as was Aaron', ref: 'Hebrews 5:1-10' },
    ],
  },
  {
    id: 'day-of-atonement',
    name: 'The Day of Atonement',
    summary: 'Once a year, with blood not his own, the high priest entered the holiest — the shadow of one offering for ever.',
    link: { ref: 'Hebrews 9:12', text: 'By his own blood he entered in once into the holy place, having obtained eternal redemption for us.' },
    type: [
      { title: 'Atonement for the holy place', ref: 'Leviticus 16:3-22' },
      { title: 'A statute for ever', ref: 'Leviticus 16:29-34' },
    ],
    antitype: [
      { title: 'By his own blood', ref: 'Hebrews 9:6-14' },
      { title: 'Once in the end of the world', ref: 'Hebrews 9:24-28' },
      { title: 'One sacrifice for sins for ever', ref: 'Hebrews 10:1-14' },
    ],
  },
  {
    id: 'firstfruits',
    name: 'Firstfruits',
    summary: 'The first sheaf of the harvest waved before the LORD the day after the sabbath — the pledge of the harvest to come.',
    link: { ref: '1 Corinthians 15:20', text: 'But now is Christ risen from the dead, and become the firstfruits of them that slept.' },
    type: [{ title: 'A sheaf of the firstfruits', ref: 'Leviticus 23:9-14' }],
    antitype: [{ title: 'Christ the firstfruits', ref: '1 Corinthians 15:12-23' }],
  },
  {
    id: 'bronze-serpent',
    name: 'The Bronze Serpent',
    summary: 'A serpent of brass lifted on a pole: whoever looked upon it lived.',
    link: { ref: 'John 3:14', text: 'And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up.' },
    type: [{ title: 'When he beheld the serpent of brass', ref: 'Numbers 21:4-9' }],
    antitype: [{ title: 'Even so must the Son of man be lifted up', ref: 'John 3:9-17' }],
  },
  {
    id: 'prophet-like-moses',
    name: 'A Prophet Like Moses',
    summary: 'Moses promised another prophet from among the brethren, with God\'s words in his mouth — and Peter names Him.',
    link: { ref: 'Acts 3:22', text: 'A prophet shall the Lord your God raise up unto you of your brethren, like unto me.' },
    type: [{ title: 'A Prophet like unto me', ref: 'Deuteronomy 18:15-22' }],
    antitype: [
      { title: 'Peter preaches the Prophet', ref: 'Acts 3:12-26' },
      { title: 'Stephen preaches the Prophet', ref: 'Acts 7:35-39' },
    ],
  },
  {
    id: 'sabbath-rest',
    name: 'Sabbath Rest',
    summary: 'God rested on the seventh day, and Joshua brought Israel into the land — yet a rest still remains for the people of God.',
    link: { ref: 'Hebrews 4:9', text: 'There remaineth therefore a rest to the people of God.' },
    type: [
      { title: 'God rested on the seventh day', ref: 'Genesis 2:1-3' },
      { title: 'Remember the sabbath day', ref: 'Exodus 20:8-11' },
      { title: 'The LORD gave them rest', ref: 'Joshua 21:43-45' },
    ],
    antitype: [
      { title: 'There remaineth a rest', ref: 'Hebrews 4:1-11' },
      { title: 'A shadow of things to come', ref: 'Colossians 2:16-17' },
    ],
  },
  {
    id: 'circumcision',
    name: 'Circumcision',
    summary: 'The sign of the covenant in the flesh — and the circumcision of the heart that God always intended.',
    link: { ref: 'Colossians 2:11', text: 'In whom also ye are circumcised with the circumcision made without hands.' },
    type: [
      { title: 'The token of the covenant', ref: 'Genesis 17:1-14' },
      { title: 'The LORD will circumcise thine heart', ref: 'Deuteronomy 30:1-6' },
    ],
    antitype: [
      { title: 'Made without hands', ref: 'Colossians 2:8-15' },
      { title: 'Circumcision of the heart', ref: 'Romans 2:25-29' },
      { title: 'We are the circumcision', ref: 'Philippians 3:1-9' },
    ],
  },
  {
    id: 'elijah',
    name: 'Elijah',
    summary: 'The hairy prophet girt with leather, promised to return before the great day of the LORD — and Jesus says he came.',
    link: { ref: 'Matthew 11:14', text: 'And if ye will receive it, this is Elias, which was for to come.' },
    type: [
      { title: 'An hairy man, girt with leather', ref: '2 Kings 1:1-8' },
      { title: 'I will send you Elijah', ref: 'Malachi 4:1-6' },
    ],
    antitype: [
      { title: 'In the spirit and power of Elias', ref: 'Luke 1:5-17' },
      { title: 'This is Elias, which was for to come', ref: 'Matthew 11:7-15' },
      { title: 'Elias is come already', ref: 'Matthew 17:1-13' },
    ],
  },
  {
    id: 'the-temple',
    name: 'The Temple',
    summary: 'The house Solomon built, filled with the glory of the LORD — and the temple Jesus said He would raise in three days.',
    link: { ref: 'John 2:21', text: 'But he spake of the temple of his body.' },
    type: [
      { title: 'The glory filled the house', ref: '1 Kings 8:1-11' },
      { title: 'Will God indeed dwell on the earth?', ref: '1 Kings 8:22-30' },
    ],
    antitype: [{ title: 'The temple of his body', ref: 'John 2:13-22' }],
  },
];

// Same shape as a story (acts + flat steps), so the story reading screens can show it.
export const patternList = PATTERNS.map((pattern) => {
  const acts = [
    { title: 'Type', kind: 'type', steps: pattern.type },
    { title: 'Antitype', kind: 'antitype', steps: pattern.antitype },
  ];
  return {
    ...pattern,
    key: `pattern:${pattern.id}`,
    source: `pattern:${pattern.id}`,
    acts,
    steps: acts.flatMap((act) => act.steps.map((step) => ({ ...step, label: act.title, ...parseRef(step.ref) }))),
  };
});

export const patternById = new Map(patternList.map((pattern) => [pattern.id, pattern]));
