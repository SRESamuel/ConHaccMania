import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CourseLayout from './components/CourseLayout';
import CourseHome from './pages/CourseHome';
import QuizList from './pages/QuizList';
import './styles/econestoga.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<CourseLayout />}>
          <Route path="/" element={<CourseHome />} />
          <Route path="/quizzes" element={<QuizList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
