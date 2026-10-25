import { useCallback, useMemo, useState } from 'react';
import { SideNav, TabBar } from './components/Navigation';
import { booksByName } from './data/books';
import { storyById, storyList } from './data/stories';
import { computePlan, isChapterRead } from './lib/progress';
import { activeRun, deriveProgress, loadState, recordChapter, runHistory, saveState, setDeadline, startNewRun } from './lib/store';
import { markStepRead, storyProgress } from './lib/stories';
import { useAccount } from './lib/useAccount';
import { useRoute, useScrollRestoration } from './lib/router';
import BibleScreen from './screens/BibleScreen';
import ExploreScreen from './screens/ExploreScreen';
import PlanScreen from './screens/PlanScreen';
import ReaderScreen from './screens/ReaderScreen';
import StoriesScreen from './screens/StoriesScreen';
import StoryScreen from './screens/StoryScreen';
import StoryStepScreen from './screens/StoryStepScreen';
import TimelineScreen from './screens/TimelineScreen';
import TodayScreen from './screens/TodayScreen';

function App() {
  const route = useRoute();
  useScrollRestoration(route.key);

  const [state, setState] = useState(() => loadState());
  const progress = useMemo(() => deriveProgress(state), [state]);
  const stories = useMemo(() => storyProgress(state, storyList), [state]);
  const deadline = activeRun(state).deadline;
  const plan = computePlan(progress, deadline);

  // Applies fn to the latest state and saves it (also used by background sync).
  const commit = useCallback((fn) => {
    setState((prev) => {
      const next = fn(prev);
      saveState(next);
      return next;
    });
  }, []);
  const update = (next) => commit(() => next);
  const account = useAccount(state, commit);

  const handleToggleChapter = (bookName, chapter) => {
    const action = isChapterRead(progress.completed, bookName, chapter) ? 'unread' : 'read';
    update(recordChapter(state, bookName, chapter, action));
  };

  const handleDeadlineChange = (value) => update(setDeadline(state, value));

  const handleAdvance = (story, step) => update(markStepRead(state, story, step));

  // The one reset: ends this run (kept in history) and starts a fresh one.
  const handleStartOver = (newDeadline) => update(startNewRun(state, newDeadline));

  const book = route.book ? booksByName.get(route.book) : undefined;
  const story = route.storyId ? storyById.get(route.storyId) : undefined;
  const isReader = route.section === 'read' && book && route.chapter >= 1 && route.chapter <= book.chapters;
  const isStoryStep = route.section === 'stories' && story && route.step >= 1 && route.step <= story.steps.length;
  // Stories and Timeline are reading methods inside Explore.
  const activeTab =
    isReader || route.section === 'bible'
      ? 'bible'
      : ['explore', 'stories', 'timeline'].includes(route.section)
        ? 'explore'
        : route.section;

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
  } else if (isStoryStep) {
    screen = <StoryStepScreen key={route.key} story={story} step={route.step} onAdvance={handleAdvance} />;
  } else if (route.section === 'stories' && story) {
    screen = <StoryScreen story={story} stories={stories} />;
  } else if (route.section === 'stories') {
    screen = <StoriesScreen stories={stories} />;
  } else if (route.section === 'explore') {
    screen = <ExploreScreen completed={progress.completed} stories={stories} />;
  } else if (route.section === 'timeline') {
    screen = <TimelineScreen completed={progress.completed} />;
  } else if (route.section === 'plan') {
    screen = <PlanScreen deadline={deadline} onDeadlineChange={handleDeadlineChange} plan={plan} runs={runHistory(state)} onStartOver={handleStartOver} account={account} state={state} />;
  } else {
    screen = <TodayScreen progress={progress} plan={plan} />;
  }

  const hidesTabBar = isReader || isStoryStep;

  return (
    <div className="min-h-dvh bg-background">
      <SideNav active={activeTab} />
      {/* The reader and story step reader have their own bottom action bars, so the tab bar steps aside there. */}
      <main className={`lg:pl-64 ${hidesTabBar ? '' : 'pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-10'}`}>
        {screen}
      </main>
      {!hidesTabBar && <TabBar active={activeTab} />}
    </div>
  );
}

export default App;
