import { useState } from 'react';
import { SideNav, TabBar } from './components/Navigation';
import { booksByName } from './data/books';
import { storyById } from './data/stories';
import { computePlan, loadDeadline, loadProgress, saveDeadline, saveProgress, toggleChapter } from './lib/progress';
import { loadStories, markStepRead, resetStory, saveStories, stripNewlyMarked } from './lib/stories';
import { useRoute, useScrollRestoration } from './lib/router';
import BibleScreen from './screens/BibleScreen';
import PlanScreen from './screens/PlanScreen';
import ReaderScreen from './screens/ReaderScreen';
import StoriesScreen from './screens/StoriesScreen';
import StoryScreen from './screens/StoryScreen';
import StoryStepScreen from './screens/StoryStepScreen';
import TodayScreen from './screens/TodayScreen';

function App() {
  const route = useRoute();
  useScrollRestoration(route.key);

  const [progress, setProgress] = useState(loadProgress);
  const [deadline, setDeadline] = useState(loadDeadline);
  const [stories, setStories] = useState(loadStories);
  const plan = computePlan(progress, deadline);

  const handleToggleChapter = (bookName, chapter) => {
    const next = toggleChapter(progress, bookName, chapter);
    // A manually unmarked chapter must leave every story's newlyMarked, so a later
    // reset can't unmark a chapter you re-read by hand.
    const nextStories = stripNewlyMarked(stories, `${bookName} ${chapter}`);
    saveProgress(next);
    saveStories(nextStories);
    setProgress(next);
    setStories(nextStories);
  };

  const handleDeadlineChange = (value) => {
    setDeadline(value);
    saveDeadline(value);
  };

  const handleAdvance = (story, step) => {
    const next = markStepRead(stories, progress, story, step);
    saveStories(next.stories);
    saveProgress(next.progress);
    setStories(next.stories);
    setProgress(next.progress);
  };

  const handleResetStory = (storyId) => {
    const story = storyById.get(storyId);
    if (!story) return;
    const next = resetStory(stories, progress, story);
    saveStories(next.stories);
    saveProgress(next.progress);
    setStories(next.stories);
    setProgress(next.progress);
  };

  const book = route.book ? booksByName.get(route.book) : undefined;
  const story = route.storyId ? storyById.get(route.storyId) : undefined;
  const isReader = route.section === 'read' && book && route.chapter >= 1 && route.chapter <= book.chapters;
  const isStoryStep = route.section === 'stories' && story && route.step >= 1 && route.step <= story.steps.length;
  const activeTab = isReader || route.section === 'bible' ? 'bible' : route.section === 'stories' ? 'stories' : route.section;

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
    screen = <StoryScreen story={story} stories={stories} onReset={handleResetStory} />;
  } else if (route.section === 'stories') {
    screen = <StoriesScreen stories={stories} />;
  } else if (route.section === 'plan') {
    screen = <PlanScreen deadline={deadline} onDeadlineChange={handleDeadlineChange} plan={plan} />;
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
