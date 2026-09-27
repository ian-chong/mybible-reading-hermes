import { useState } from 'react';
import { fetchChapter } from './utils/bibleApi';
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';

const books = [
  { name: 'Genesis', chapters: 50 },
  { name: 'Exodus', chapters: 40 },
  { name: 'Leviticus', chapters: 27 },
  { name: 'Numbers', chapters: 36 },
  { name: 'Deuteronomy', chapters: 34 },
  { name: 'Joshua', chapters: 24 },
  { name: 'Judges', chapters: 21 },
  { name: 'Ruth', chapters: 4 },
  { name: '1 Samuel', chapters: 31 },
  { name: '2 Samuel', chapters: 24 },
  { name: '1 Kings', chapters: 22 },
  { name: '2 Kings', chapters: 25 },
  { name: '1 Chronicles', chapters: 29 },
  { name: '2 Chronicles', chapters: 36 },
  { name: 'Ezra', chapters: 10 },
  { name: 'Nehemiah', chapters: 13 },
  { name: 'Esther', chapters: 10 },
  { name: 'Job', chapters: 42 },
  { name: 'Psalms', chapters: 150 },
  { name: 'Proverbs', chapters: 31 },
  { name: 'Ecclesiastes', chapters: 12 },
  { name: 'Song of Solomon', chapters: 8 },
  { name: 'Isaiah', chapters: 66 },
  { name: 'Jeremiah', chapters: 52 },
  { name: 'Lamentations', chapters: 5 },
  { name: 'Ezekiel', chapters: 48 },
  { name: 'Daniel', chapters: 12 },
  { name: 'Hosea', chapters: 14 },
  { name: 'Joel', chapters: 3 },
  { name: 'Amos', chapters: 9 },
  { name: 'Obadiah', chapters: 1 },
  { name: 'Jonah', chapters: 4 },
  { name: 'Micah', chapters: 7 },
  { name: 'Nahum', chapters: 3 },
  { name: 'Habakkuk', chapters: 3 },
  { name: 'Zephaniah', chapters: 3 },
  { name: 'Haggai', chapters: 2 },
  { name: 'Zechariah', chapters: 14 },
  { name: 'Malachi', chapters: 4 },
  { name: 'Matthew', chapters: 28 },
  { name: 'Mark', chapters: 16 },
  { name: 'Luke', chapters: 24 },
  { name: 'John', chapters: 21 },
  { name: 'Acts', chapters: 28 },
  { name: 'Romans', chapters: 16 },
  { name: '1 Corinthians', chapters: 16 },
  { name: '2 Corinthians', chapters: 13 },
  { name: 'Galatians', chapters: 6 },
  { name: 'Ephesians', chapters: 6 },
  { name: 'Philippians', chapters: 4 },
  { name: 'Colossians', chapters: 4 },
  { name: '1 Thessalonians', chapters: 5 },
  { name: '2 Thessalonians', chapters: 3 },
  { name: '1 Timothy', chapters: 6 },
  { name: '2 Timothy', chapters: 4 },
  { name: 'Titus', chapters: 3 },
  { name: 'Philemon', chapters: 1 },
  { name: 'Hebrews', chapters: 13 },
  { name: 'James', chapters: 5 },
  { name: '1 Peter', chapters: 5 },
  { name: '2 Peter', chapters: 3 },
  { name: '1 John', chapters: 5 },
  { name: '2 John', chapters: 1 },
  { name: '3 John', chapters: 1 },
  { name: 'Jude', chapters: 1 },
  { name: 'Revelation', chapters: 22 },
];

const STORAGE_KEY = 'bibleReadingProgress';
const DEFAULT_DEADLINE = '2026-10-14'; // 14 October 2026

function getCompleted() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : {};
}

function setCompleted(completed) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
}

function isChapterCompleted(bookName, chapterNum, completed) {
  return completed[bookName] && completed[bookName].includes(chapterNum);
}

// Both helpers return a new object so React sees the state change and re-renders.
function addCompleted(bookName, chapterNum, completed) {
  const chapters = completed[bookName] || [];
  if (chapters.includes(chapterNum)) return completed;
  const next = { ...completed, [bookName]: [...chapters, chapterNum].sort((a, b) => a - b) };
  setCompleted(next);
  return next;
}

function removeCompleted(bookName, chapterNum, completed) {
  if (!completed[bookName]) return completed;
  const next = { ...completed };
  const chapters = completed[bookName].filter(c => c !== chapterNum);
  if (chapters.length === 0) {
    delete next[bookName];
  } else {
    next[bookName] = chapters;
  }
  setCompleted(next);
  return next;
}

function getTotalChapters() {
  return books.reduce((sum, book) => sum + book.chapters, 0);
}

function getCompletedCount(completed) {
  return Object.values(completed).reduce((sum, chapters) => sum + chapters.length, 0);
}

function getRemainingChapters(completed) {
  let remaining = 0;
  for (const book of books) {
    const completedChapters = completed[book.name] || [];
    remaining += book.chapters - completedChapters.length;
  }
  return remaining;
}

function computeReadingPlan(completed, deadlineStr) {
  const today = startOfDay(new Date());

  // parseISO reads "YYYY-MM-DD" as local midnight (new Date() would read it as UTC)
  let deadline = parseISO(deadlineStr);

  // If the deadline is before today (or the input is cleared), fall back to today + 14 days.
  // A deadline of today itself is kept.
  if (Number.isNaN(deadline.getTime()) || differenceInCalendarDays(deadline, today) < 0) {
    deadline = addDays(today, 14);
  }
  
  // Count today as a reading day, so a deadline of today still leaves 1 day.
  const daysLeft = differenceInCalendarDays(deadline, today) + 1;
  const chaptersLeft = getRemainingChapters(completed);
  
  if (daysLeft <= 0 || chaptersLeft === 0) {
    return { dailyChapters: 0, daysLeft: Math.max(0, daysLeft), chaptersLeft };
  }
  
  const basePerDay = Math.floor(chaptersLeft / daysLeft);
  const remainder = chaptersLeft % daysLeft;
  
  // We'll distribute remainder as extra chapters on first 'remainder' days
  return { 
    dailyChapters: basePerDay, 
    remainder,
    daysLeft: Math.max(0, daysLeft), 
    chaptersLeft 
  };
}

function App() {
  const [completed, setCompletedState] = useState(getCompleted);
  const [deadline, setDeadline] = useState(DEFAULT_DEADLINE);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setVerses([]);
    setError(null);
  };

  const handleChapterSelect = async (chapter) => {
    if (!selectedBook) return;

    setSelectedChapter(chapter);
    setVerses([]);
    setError(null);
    setLoading(true);

    try {
      const result = await fetchChapter(selectedBook.name, chapter);
      setVerses(result.verses);
    } catch (err) {
      console.error('Error fetching chapter:', err);
      setError(`Could not load ${selectedBook.name} ${chapter}. Check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChapter = (chapter) => {
    if (!selectedBook) return;

    const newCompleted = isChapterCompleted(selectedBook.name, chapter, completed)
      ? removeCompleted(selectedBook.name, chapter, completed)
      : addCompleted(selectedBook.name, chapter, completed);

    setCompletedState(newCompleted);
  };
  
  const handleDeadlineChange = (e) => {
    setDeadline(e.target.value);
  };
  
  const { dailyChapters, remainder, daysLeft, chaptersLeft } = computeReadingPlan(completed, deadline);
  
  // Generate plan for next 7 days as example
  const plan = [];
  let chaptersAssigned = 0;
  for (let day = 0; day < Math.min(7, daysLeft); day++) {
    const dayIndex = day;
    const extra = dayIndex < remainder ? 1 : 0;
    const chaptersForDay = dailyChapters + extra;
    const date = addDays(new Date(), dayIndex);
    plan.push({
      date,
      chapters: chaptersForDay,
      completedToday: 0 // We could compute how many of these chapters are already completed today, but skip for simplicity
    });
    chaptersAssigned += chaptersForDay;
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      {/* Using the design system's suggested layout: a 12-column grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Hero Section (spans full width) */}
        <header className="col-span-12 text-center py-8">
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-foreground">
            Bible Reading Planner
          </h1>
          <p className="font-serif text-lg text-muted-foreground mt-2">
            Smart deadline tracking • {getCompletedCount(completed)}/{getTotalChapters()} chapters completed
          </p>
        </header>

        {/* Date Input Section (spans full width) */}
        <div className="col-span-12 flex flex-wrap justify-center items-center gap-y-2 py-4">
          <label className="font-serif text-lg text-foreground mr-4">
            Target Completion Date
          </label>
          <input
            type="date"
            value={deadline}
            onChange={handleDeadlineChange}
            className="w-48 px-4 py-2 border border-primary rounded-lg focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-card text-foreground"
          />
          {daysLeft > 0 && (
            <span className="ml-4 font-serif text-lg text-foreground">
              Time left: {daysLeft} day{daysLeft !== 1 ? 's' : ''}
            </span>
          )}
          {daysLeft <= 0 && (
            <span className="ml-4 font-serif text-lg text-destructive">
              Deadline passed
            </span>
          )}
        </div>

        {/* Plan Summary (spans full width) */}
        {chaptersLeft > 0 && daysLeft > 0 && (
          <div className="col-span-12 bg-card rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Reading Plan
            </h2>
            <p className="font-serif text-muted-foreground mb-2">
              Chapters remaining: <span className="text-foreground font-bold">{chaptersLeft}</span>
            </p>
            <p className="font-serif text-muted-foreground mb-2">
              Suggested per day: <span className="text-foreground font-bold">{dailyChapters}</span>{' '}
              chapter{dailyChapters !== 1 ? 's' : ''}
              {remainder > 0 && (
                <> (+1 for first <span className="font-semibold">{remainder}</span> day{remainder !== 1 ? 's' : ''})</>
              )}
            </p>
            <p className="font-serif text-muted-foreground mb-4">
              Plan for next <span className="font-semibold">{Math.min(7, daysLeft)}</span>{' '}
              day{Math.min(7, daysLeft) !== 1 ? 's' : ''}:
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {plan.map((day, index) => (
                <div key={index} className="bg-muted rounded-lg p-4 text-center">
                  <span className="font-mono text-xs text-muted-foreground block">
                    {format(day.date, 'EEE, MMM d')}
                  </span>
                  <span className="font-serif text-lg font-bold text-foreground block">
                    {day.chapters} chapter{day.chapters !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {chaptersLeft === 0 && (
          <div className="col-span-12 flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl mb-4">
              ✓
            </div>
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Congratulations!
            </h2>
            <p className="font-serif text-lg text-muted-foreground">
              You've completed all chapters. Well done on your Bible reading journey!
            </p>
          </div>
        )}

        {/* Book List (spans 3 columns) */}
        <section className="col-span-12 md:col-span-6 lg:col-span-3 bg-card rounded-lg p-6">
          <h2 className="font-serif text-xl font-bold text-foreground mb-4">
            Books of the Bible
          </h2>
          <div className="space-y-3">
            {books.map((book) => {
              const completedChapters = completed[book.name] || [];
              const isCompleted = completedChapters.length === book.chapters;
              const progress = completedChapters.length + '/' + book.chapters;
              
              return (
                <div 
                  key={book.name} 
                  onClick={() => handleBookSelect(book)}
                  className={`cursor-pointer flex items-start p-4 border border-muted rounded-lg hover:bg-muted/50 transition-colors duration-200 ${selectedBook === book ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="flex-0 mr-4">
                    {isCompleted ? (
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        ✓
                      </div>
                    ) : (
                      <div className="w-8 h-8 border-2 border-muted rounded-full flex items-center justify-center">
                        <div className="w-5 h-5 bg-primary rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-medium text-foreground">
                      {book.name}
                    </div>
                    <div className="mt-2 flex items-center space-x-2 text-sm">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full mr-1.5"></div>
                      <span className="text-muted-foreground">{progress} chapters</span>
                      <div className="w-2.5 h-2.5 bg-muted/50 rounded-full ml-2 mr-1.5"></div>
                      <div className={'w-2.5 h-2.5 ' + (isCompleted ? 'bg-primary' : 'bg-muted/20') + ' rounded-full'}></div>
                    </div>
                  </div>
                  <div className="flex-0 ml-4">
                    <div className="w-0.5 h-full bg-primary rounded-l-lg"></div>
                  </div>
                </div>
              );
            })
          }
          </div>
        </section>

        {/* Chapter List (spans 3 columns) */}
        <section className={selectedBook ? 'col-span-12 md:col-span-6 lg:col-span-3 bg-card rounded-lg p-6' : 'hidden'}>
          {selectedBook && (
            <>
              <h2 className="font-serif text-xl font-bold text-foreground mb-4">
                {selectedBook.name} Chapters
              </h2>
              <div className="space-y-2 grid grid-cols-2 gap-2">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => {
                  const done = isChapterCompleted(selectedBook.name, chapter, completed);
                  return (
                    <button
                      key={chapter}
                      onClick={() => handleChapterSelect(chapter)}
                      className={`w-full text-center p-3 border border-muted rounded-lg hover:bg-muted/50 ${selectedChapter === chapter ? 'border-primary bg-primary/5' : ''} ${done ? 'bg-primary/20' : ''} transition-colors duration-200`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <div className="text-xl font-bold text-foreground">
                          {chapter}
                        </div>
                        {done && (
                          <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
                }
                </div>
            </>
          )}
        </section>

        {/* Content Viewer (spans 6 columns) */}
        <section className={`col-span-12 ${selectedBook ? 'lg:col-span-6' : 'lg:col-span-9'} bg-card rounded-lg p-6`}>
          <h2 className="font-serif text-xl font-bold text-foreground mb-4">
            {selectedBook && selectedChapter ? 
              `${selectedBook.name} Chapter ${selectedChapter}` : 
              'Select a chapter to view'}
          </h2>
          
          {error && (
            <div className="mb-6 p-5 bg-destructive/10 border border-destructive/20 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-destructive text-on-destructive rounded-full flex items-center justify-center text-xs">
                    !
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-destructive mb-2">Error Loading Chapter</p>
                  <p className="text-destructive">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="mt-4 text-foreground/80 text-lg">Loading chapter...</p>
            </div>
          )}
          
          {!loading && verses.length > 0 && (
            <div className="prose prose-lg max-w-none py-2 font-serif text-card-foreground">
              <p className="leading-relaxed">
                {verses.map((v) => (
                  <span key={v.verse}>
                    <sup className="mr-1 font-sans text-xs text-muted-foreground">{v.verse}</sup>
                    {v.text}{' '}
                  </span>
                ))}
              </p>
            </div>
          )}
          
          {!loading && verses.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-4xl text-muted-foreground/80">
                  📖
                </div>
              </div>
              <p className="font-serif text-xl font-bold text-foreground mb-4">
                Select a chapter to begin reading
              </p>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose a book from the left and a chapter from the middle to start your Bible reading journey.
              </p>
            </div>
          )}
          
          {/* Completion controls */}
          {selectedBook && selectedChapter && !loading && !error && (
            <div className="mt-6 flex items-center space-x-4">
              <button
                onClick={() => handleToggleChapter(selectedChapter)}
                // Full class names only: Tailwind can't detect classes assembled from `bg-${...}`
                className={`flex-1 px-6 py-3 font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-1 ${
                  isChapterCompleted(selectedBook.name, selectedChapter, completed)
                    ? 'bg-muted text-foreground border border-border hover:bg-border'
                    : 'bg-primary text-on-primary hover:bg-primary/80'
                }`}
              >
                {isChapterCompleted(selectedBook.name, selectedChapter, completed) ? 'Mark as Incomplete' : 'Mark as Complete'}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Footer with design system attribution */}
      <footer className="mt-12 text-center text-muted-foreground text-sm border-t border-muted pt-8">
        <p className="flex items-center justify-center space-x-2 text-sm">
          Bible Reading Planner • Built with React & Tailwind CSS • Data stored locally
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Design system applied: Swiss Modernism 2.0 • Cormorant Garamond / Crimson Pro • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

export default App;