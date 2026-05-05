import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '@/app/layouts/MainLayout';
import AuthGuard from '@/app/guards/AuthGuard';
import LoginPage from '@/pages/auth/LoginPage';
import Dashboard from '@/pages/dashboard/IndexPage';
import LeadsList from '@/pages/leads/ListPage'; import LeadsDetail from '@/pages/leads/DetailPage'; import LeadsAssign from '@/pages/leads/AssignPage';
import StudentsList from '@/pages/students/ListPage'; import StudentsDetail from '@/pages/students/DetailPage';
import Kanban from '@/pages/applications/KanbanPage'; import AppDetail from '@/pages/applications/DetailPage'; import Materials from '@/pages/applications/MaterialsPage'; import Offers from '@/pages/applications/OffersPage'; import Visa from '@/pages/applications/VisaPage';
import Articles from '@/pages/cms/ArticlesPage'; import Cases from '@/pages/cms/CasesPage';
import Library from '@/pages/knowledge/LibraryPage'; import Tasks from '@/pages/messages/TasksPage';
import ReportsOverview from '@/pages/reports/OverviewPage'; import ReportsLeads from '@/pages/reports/LeadsPage';
import Users from '@/pages/settings/UsersPage'; import Roles from '@/pages/settings/RolesPage'; import Dicts from '@/pages/settings/DictsPage'; import Logs from '@/pages/settings/LogsPage';
import E403 from '@/pages/errors/403'; import E404 from '@/pages/errors/404';
export default function AppRouter(){return <Routes><Route path='/login' element={<LoginPage/>}/><Route path='/' element={<AuthGuard><MainLayout/></AuthGuard>}><Route index element={<Navigate to='/dashboard'/>}/><Route path='dashboard' element={<Dashboard/>}/><Route path='leads/list' element={<LeadsList/>}/><Route path='leads/detail/:id' element={<LeadsDetail/>}/><Route path='leads/assign' element={<LeadsAssign/>}/><Route path='students/list' element={<StudentsList/>}/><Route path='students/detail/:id' element={<StudentsDetail/>}/><Route path='applications/kanban' element={<Kanban/>}/><Route path='applications/detail/:id' element={<AppDetail/>}/><Route path='applications/materials' element={<Materials/>}/><Route path='applications/offers' element={<Offers/>}/><Route path='applications/visa' element={<Visa/>}/><Route path='cms/articles' element={<Articles/>}/><Route path='cms/cases' element={<Cases/>}/><Route path='knowledge/library' element={<Library/>}/><Route path='messages/tasks' element={<Tasks/>}/><Route path='reports/overview' element={<ReportsOverview/>}/><Route path='reports/leads' element={<ReportsLeads/>}/><Route path='settings/users' element={<Users/>}/><Route path='settings/roles' element={<Roles/>}/><Route path='settings/dicts' element={<Dicts/>}/><Route path='settings/logs' element={<Logs/>}/></Route><Route path='/403' element={<E403/>}/><Route path='*' element={<E404/>}/></Routes>}
