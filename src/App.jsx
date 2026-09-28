import { useState } from 'react';
import { SideNav, TabBar } from './components/Navigation';
import { booksByName } from './data/books';
import { computePlan, loadDeadline, loadProgress, saveDeadline, saveProgress, toggleChapter } from './lib/progress';
import { useRoute, useScrollRestoration } from './lib/router';
import BibleScreen from './screens/BibleScreen';
import PlanScreen from './screens/PlanScreen';
import ReaderScreen from './screens/ReaderScreen';
import TodayScreen from './screens/TodayScreen';

function App() {
  const route = useRoute();
  useScrollRestoration(route.key);

  const [progress, setProgress] = useState(loadProgress);
  const [deadline, setDeadline] = useState(loadDeadline);
  const plan = computePlan(progress, deadline);

  const handleToggleChapter = (bookName, chapter) => {
    const next = toggleChapter(progress, bookName, chapter);
    saveProgress(next);
    setProgress(next);
  };

  const handleDeadlineChange = (value) => {
    setDeadline(value);
    saveDeadline(value);
  };

  const book = route.book ? booksByName.get(route.book) : undefined;
  const isReader = route.section === 'read' && book && route.chapter >= 1 && route.chapter <= book.chapters;
  const activeTab = isReader || route.section === 'bible' ? 'bible' : route.section;

  let screen;
  if (isReader) {
    screen = (
      <ReaderScreen
        key={route.key}
        book={book}
        chapter={route.chapter}
        completed={progress.completed}
        onToggle={handleToggleChapter}
      />
    );
  } else if (route.section === 'bible' || route.section === 'read') {
    screen = <BibleScreen book={book} completed={progress.completed} />;
  } else if (route.section === 'plan') {
    screen = <PlanScreen deadline={deadline} onDeadlineChange={handleDeadlineChange} plan={plan} />;
  } else {
    screen = <TodayScreen progress={progress} plan={plan} />;
  }

  return (
    <div className="min-h-dvh bg-background">
      <SideNav active={activeTab} />
      {/* The reader has its own bottom action bar, so the tab bar steps aside there. */}
      <main className={`lg:pl-64 ${isReader ? '' : 'pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-10'}`}>
        {screen}
      </main>
      {!isReader && <TabBar active={activeTab} />}
    </div>
  );
}

export default App;
