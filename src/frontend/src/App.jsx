import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext';
import CourseLayout from './components/CourseLayout';
import CourseHome from './pages/CourseHome';
import QuizList from './pages/QuizList';
import QuizSummary from './pages/QuizSummary';
import CreateQuiz from './pages/CreateQuiz';
import QuestionBuilder from './pages/QuestionBuilder';
import QuizTaking from './pages/QuizTaking';
import InstructorDashboard from './pages/InstructorDashboard';
import './styles/econestoga.css';

function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<CourseLayout />}>
            <Route path="/" element={<CourseHome />} />
            <Route path="/quizzes" element={<QuizList />} />
            <Route path="/quiz/:id" element={<QuizSummary />} />
            <Route path="/quizzes/create" element={<CreateQuiz />} />
            <Route path="/quiz/:id/edit" element={<QuestionBuilder />} />
            <Route path="/quiz/:id/take" element={<QuizTaking />} />
            <Route path="/quiz/:id/submissions" element={<InstructorDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RoleProvider>
  );
}

export default App;
