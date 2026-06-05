import { Routes, Route, Navigate } from 'react-router-dom';
import { useGetAnnexesQuery } from '@/store/annexesApi';
import { AppLayout } from '@/components/layout/AppLayout';
import { AnnexLayout } from '@/components/layout/AnnexLayout';
import { GroupSchedulePage } from '@/pages/schedule/GroupSchedulePage';
import { TeacherSchedulePage } from '@/pages/schedule/TeacherSchedulePage';
import { AnnexesPage } from '@/pages/AnnexesPage';
import { TeachersPage } from '@/pages/TeachersPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { AnnexSettingsPage } from '@/pages/annex/AnnexSettingsPage';
import { AnnexStaffPage } from '@/pages/annex/AnnexStaffPage';
import { AnnexRulesPage } from '@/pages/annex/AnnexRulesPage'
import { AnnexPlanGroupPage } from '@/pages/annex/AnnexPlanGroupPage';
import { AnnexPlanTeacherPage } from '@/pages/annex/AnnexPlanTeacherPage';
import { AnnexPlanOverviewPage } from '@/pages/annex/AnnexPlanOverviewPage';
import { AnnexPlanTablePage } from '@/pages/annex/AnnexPlanTablePage';
import { GlobalRulesPage } from '@/pages/GlobalRulesPage';
import { NoDraftPage } from '@/pages/NoDraftPage';

function DefaultRedirect() {
  const { data: annexes = [], isLoading } = useGetAnnexesQuery();
  if (isLoading) return null;
  const draft = annexes.find((a) => a.state === 'DRAFT');
  if (draft) return <Navigate to={`/annexes/${draft.id}/plan/table`} replace />;
  const current = annexes.find((a) => a.state === 'CURRENT');
  if (current) return <Navigate to={`/annexes/${current.id}/plan/table`} replace />;
  return <Navigate to="/schedule/groups" replace />;
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DefaultRedirect />} />
        <Route path="/schedule/groups" element={<GroupSchedulePage />} />
        <Route path="/schedule/teachers" element={<TeacherSchedulePage />} />
        <Route path="/annexes" element={<AnnexesPage />} />
        <Route path="/teachers" element={<TeachersPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/global-rules" element={<GlobalRulesPage />} />
        <Route path="/no-draft" element={<NoDraftPage />} />
        <Route path="/annexes/:id" element={<AnnexLayout />}>
          <Route index element={<Navigate to="plan/table" replace />} />
          <Route path="settings" element={<AnnexSettingsPage />} />
          <Route path="staff" element={<AnnexStaffPage />} />
          <Route path="rules" element={<AnnexRulesPage />} />
          <Route path="plan/groups" element={<AnnexPlanGroupPage />} />
          <Route path="plan/teachers" element={<AnnexPlanTeacherPage />} />
          <Route path="plan/overview" element={<AnnexPlanOverviewPage />} />
          <Route path="plan/table" element={<AnnexPlanTablePage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
