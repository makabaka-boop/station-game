import { useGameStore } from '@/store/gameStore';
import { MainMenu } from '@/pages/MainMenu';
import { LevelSelect } from '@/pages/LevelSelect';
import { GamePage } from '@/pages/GamePage';
import { ResultPage } from '@/pages/ResultPage';
import { TutorialPage } from '@/pages/TutorialPage';
import { ScoresPage } from '@/pages/ScoresPage';
import { ReplayPage } from '@/pages/ReplayPage';

function App() {
  const { currentPage } = useGameStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'menu':
        return <MainMenu />;
      case 'levelSelect':
        return <LevelSelect />;
      case 'game':
        return <GamePage />;
      case 'result':
        return <ResultPage />;
      case 'tutorial':
        return <TutorialPage />;
      case 'scores':
        return <ScoresPage />;
      case 'replay':
        return <ReplayPage />;
      default:
        return <MainMenu />;
    }
  };

  return <div className="min-h-screen bg-slate-900">{renderPage()}</div>;
}

export default App;
