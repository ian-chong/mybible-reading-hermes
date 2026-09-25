import { useState, useEffect } from 'react';
import { fetchChapter } from './utils/bibleApi';
import { addDays, differenceInCalendarDays, isToday, isPast, format } from 'date-fns';

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

function addCompleted(bookName, chapterNum, completed) {
  if (!completed[bookName]) {
    completed[bookName] = [];
  }
  if (!completed[bookName].includes(chapterNum)) {
    completed[bookName] = [...completed[bookName], chapterNum].sort((a, b) => a - b);
  }
  setCompleted(completed);
  return completed;
}

function removeCompleted(bookName, chapterNum, completed) {
  if (completed[bookName]) {
    completed[bookName] = completed[bookName].filter(c => c !== chapterNum);
    if (completed[bookName].length === 0) {
      delete completed[bookName];
    }
    setCompleted(completed);
  }
  return completed;
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let deadline = new Date(deadlineStr);
  deadline.setHours(0, 0, 0, 0);
  
  // If deadline is in the past, set it to today (or maybe next year?)
  // For simplicity, if past, we'll set deadline to today + 14 days as a fallback
  if (isPast(deadline)) {
    deadline = addDays(today, 14);
  }
  
  const daysLeft = differenceInCalendarDays(deadline, today);
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
  const [chapterText, setChapterText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setCompletedState(getCompleted());
  }, []); // Only run once on mount
  
  useEffect(() => {
    // Whenever completed or deadline changes, we could recalculate plan
    // But we'll compute it in the render
  }, [completed, deadline]);
  
  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setChapterText('');
    setError(null);
  };
  
  const handleChapterSelect = async (chapter) => {
    if (!selectedBook) return;
    
    setSelectedChapter(chapter);
    setChapterText('Loading...');
    setError(null);
    setLoading(true);
    
    try {
      const result = await fetchChapter(selectedBook.name, chapter);
      setChapterText(result.text);
    } catch (err) {
      setError('Failed to load chapter text');
      setChapterText(`Error loading ${selectedBook.name} ${chapter}`);
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
    
    // If we were viewing this chapter and unchecked it, maybe clear text?
    if (selectedChapter === chapter && !isChapterCompleted(selectedBook.name, chapter, newCompleted)) {
      setChapterText('Select a chapter to view.');
    }
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
    <div className="min-h-screen bg-bible-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-bible-800 dark:text-bible-200 mb-2">
          Bible Reading Planner
        </h1>
        <p className="text-bible-600 dark:text-bible-400 text-lg">
          Smart deadline tracking • {getCompletedCount(completed)}/{getTotalChapters()} chapters completed
        </p>
      </header>

      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-bible-700 dark:text-bible-300 mb-2">
              Target Completion Date
            </label>
            <input
              type="date"
              value={deadline}
              onChange={handleDeadlineChange}
              className="w-full px-5 py-3 border border-bible-300 dark:border-bible-600 rounded-xl focus:ring-2 focus:ring-bible-500 dark:focus:ring-bible-400 focus:border-bible-500 dark:focus:border-bible-400 transition-all duration-200 bg-bible-50 dark:bg-gray-700 text-bible-800 dark:text-bible-200"
            />
          </div>
          <div className="flex-1 text-center text-sm text-bible-500 dark:text-bible-400">
            {daysLeft > 0 ? 
              `Time left: <span className="font-semibold text-bible-800 dark:text-bible-200">${daysLeft}</span> day${daysLeft !== 1 ? 's' : ''}` : 
              <span className="text-red-500 dark:text-red-400 font-semibold">Deadline passed</span>
            }
          </div>
        </div>
        
        {chaptersLeft > 0 && daysLeft > 0 && (
          <div className="mt-6 space-y-4 text-bible-600 dark:text-bible-400">
            <p className="font-medium">
              Chapters remaining: <span className="text-bible-800 dark:text-bible-200 font-bold">{chaptersLeft}</span>
            </p>
            <p className="font-medium">
              Suggested per day: <span className="text-bible-800 dark:text-bible-200 font-bold">{dailyChapters}</span> 
              chapter{dailyChapters !== 1 ? 's' : ''}
              {remainder > 0 && (
                <> (+1 for first <span className="font-semibold">{remainder}</span> day{remainder !== 1 ? 's' : ''})</>
              )}
            </p>
            <p className="mt-4 font-medium">
              Plan for next <span className="font-semibold">{Math.min(7, daysLeft)}</span> 
              day{Math.min(7, daysLeft) !== 1 ? 's' : ''}:
            </p>
            <div className="grid gap-3">
              {plan.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-bible-100 dark:bg-gray-700 rounded-lg">
                  <span className="font-mono">{format(day.date, 'EEE, MMM d')}</span>
                  <span className="font-semibold text-bible-800 dark:text-bible-200">
                    {day.chapters} chapter{day.chapters !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {chaptersLeft === 0 && (
          <div className="text-center py-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl mb-2">
                ✓
              </div>
            </div>
            <p className="text-2xl font-bold text-bible-800 dark:text-bible-200 mb-4">
              Congratulations!
            </p>
            <p className="text-bible-600 dark:text-bible-400">
              You've completed all chapters. Well done on your Bible reading journey!
            </p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Book List */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="mb-6 text-2xl font-bold text-bible-800 dark:text-bible-200">
            Books of the Bible
          </h2>
          <div className="space-y-3">
            {books.map((book) => {
              const completedChapters = completed[book.name] || [];
              const isCompleted = completedChapters.length === book.chapters;
              const progress = `${completedChapters.length}/${book.chapters}`;
              const progressPercent = book.chapters > 0 ? (completedChapters.length / book.chapters) * 100 : 0;
              
              return (
                <div 
                  key={book.name} 
                  onClick={() => handleBookSelect(book)}
                  className={`cursor-pointer flex items-start p-4 border border-bible-200 dark:border-bible-600 rounded-lg hover:bg-bible-50 dark:hover:bg-gray-700 transition-all duration-200 
                    ${selectedBook === book ? 'border-bible-500 bg-bible-50 dark:bg-gray-700' : ''}`}
                >
                  <div className="flex-0 mr-4">
                    {isCompleted ? (
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        ✓
                      </div>
                    ) : (
                      <div className="w-8 h-8 border-2 border-bible-400 dark:border-bible-500 rounded-full flex items-center justify-center">
                        <div className="w-5 h-5 bg-bible-500 dark:bg-bible-200 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-medium text-bible-900 dark:text-bible-100">
                      {book.name}
                    </div>
                    <div className="mt-2 flex items-center space-x-3 text-sm">
                      <div className="w-3 h-3 bg-bible-500 dark:bg-bible-200 rounded-full mr-1"></div>
                      <span className="text-bible-600 dark:text-bible-400">{progress} chapters</span>
                      <div className="w-3 h-3 bg-bible-200 dark:bg-bible-600 rounded-full ml-2 mr-1"></div>
                      <div className="w-3 h-3 {isCompleted ? 'bg-green-500' : 'bg-gray-300'} rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-0 ml-4">
                    <div className="w-2 h-full bg-bible-200 dark:bg-bible-600 rounded-l-lg"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Chapter List */}
        <section className={selectedBook ? 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6' : 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hidden'}>
          {selectedBook && (
            <>
              <h2 className="mb-6 text-2xl font-bold text-bible-800 dark:text-bible-200">
                {selectedBook.name} Chapters
              </h2>
              <div className="space-y-3 grid grid-cols-2 gap-4">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => {
                  const done = isChapterCompleted(selectedBook.name, chapter, completed);
                  return (
                    <button
                      key={chapter}
                      onClick={() => handleChapterSelect(chapter)}
                      className={`w-full text-center p-4 border border-bible-200 dark:border-bible-600 rounded-lg 
                        hover:bg-bible-50 dark:hover:bg-gray-700 
                        ${selectedChapter === chapter ? 'border-bible-500 bg-bible-50 dark:bg-gray-700' : ''}
                        ${done ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : ''}
                        transition-all duration-200`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-2xl font-bold text-bible-900 dark:text-bible-100">
                          {chapter}
                        </div>
                        {done && (
                          <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Content Viewer */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="mb-6 text-2xl font-bold text-bible-800 dark:text-bible-200">
            {selectedBook && selectedChapter ? 
              `${selectedBook.name} Chapter ${selectedChapter}` : 
              'Select a chapter to view'}
          </h2>
          
          {error && (
            <div className="mb-6 p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                    !
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-red-800 dark:text-red-200 mb-2">Error Loading Chapter</p>
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {loading && !chapterText && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-bible-500 dark:border-bible-400"></div>
              <p className="mt-4 text-bible-600 dark:text-bible-400 text-lg">Loading chapter...</p>
            </div>
          )}
          
          {!loading && chapterText && (
            <div className="prose dark:prose-invert max-w-none py-8 bg-bible-50 dark:bg-gray-800/50 rounded-xl p-6">
              {chapterText.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-6 text-bible-900 dark:text-bible-100 leading-relaxed">{paragraph}</p>
              ))}
            </div>
          )}
          
          {!loading && !chapterText && !error && (
            <div className="text-center py-16">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-bible-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-4xl text-bible-400 dark:text-bible-200">
                  📖
                </div>
              </div>
              <p className="text-xl font-medium text-bible-800 dark:text-bible-200 mb-4">
                Select a chapter to begin reading
              </p>
              <p className="text-bible-600 dark:text-bible-400 max-w-2xl">
                Choose a book from the left and a chapter from the middle to start your Bible reading journey.
              </p>
            </div>
          )}
          
          {/* Completion controls */}
          {selectedBook && selectedChapter && !loading && !error && (
            <div className="mt-8 flex items-center space-x-4">
              <button
                onClick={() => handleToggleChapter(selectedChapter)}
                className={`flex-1 px-6 py-3 font-medium rounded-xl 
                  bg-${isChapterCompleted(selectedBook.name, selectedChapter, completed) ? 'gray-300' : 'bible-500'} 
                  text-${isChapterCompleted(selectedBook.name, selectedChapter, completed) ? 'gray-800' : 'white'} 
                  hover:bg-${isChapterCompleted(selectedBook.name, selectedChapter, completed) ? 'gray-400' : 'bible-600'} 
                  dark:hover:bg-${isChapterCompleted(selectedBook.name, selectedChapter, completed) ? 'gray-500' : 'bible-400'}
                  transition-all duration-200 shadow-md
                  hover:shadow-lg
                  transform hover:-translate-y-1`}
              >
                {isChapterCompleted(selectedBook.name, selectedChapter, completed) ? 'Mark as Incomplete' : 'Mark as Complete'}
              </button>
            </div>
          )}
        </section>
      </div>

      <footer className="mt-12 text-center text-bible-500 dark:text-bible-400 text-sm border-t border-bible-200 dark:border-bible-600 pt-8">
        <p className="flex items-center justify-center space-x-2 text-sm">
          Bible Reading Planner • Built with React & Tailwind CSS • Data stored locally
        </p>
        <p className="mt-2 text-xs text-bible-400 dark:text-bible-300">
          © {new Date().getFullYear()} - Your spiritual journey tracker
        </p>
      </footer>
    </div>
  );
}

export default App;